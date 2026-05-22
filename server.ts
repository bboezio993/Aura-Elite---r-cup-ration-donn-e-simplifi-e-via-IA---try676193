import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI, Type } from "@google/genai";

// Ensure Gemini Client is initialized safely
const aiApiKey = process.env.GEMINI_API_KEY || "";
let aiClient: GoogleGenAI | null = null;
if (aiApiKey) {
  aiClient = new GoogleGenAI({
    apiKey: aiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

// Global In-Memory Cache to prevent duplicate Gemini API charges
// Keeps map of MD5 inputHash -> cached structured analysis results
const cacheMap = new Map<string, any>();

// User Quotas tracker: Reset every 24 hours. For demo/preview context, capped simply.
const quotaTracker = new Map<string, { count: number; lastReset: number }>();
const MAX_AI_QUOTA_PER_DAY = 30;

function checkQuota(userIp: string): boolean {
  const now = Date.now();
  const userEntry = quotaTracker.get(userIp) || { count: 0, lastReset: now };
  if (now - userEntry.lastReset > 24 * 60 * 60 * 1000) {
    userEntry.count = 0;
    userEntry.lastReset = now;
  }
  if (userEntry.count >= MAX_AI_QUOTA_PER_DAY) {
    return false;
  }
  userEntry.count++;
  quotaTracker.set(userIp, userEntry);
  return true;
}

// Helper to compute MD5 hash for cache indexing
function computeHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for images, audios and Garmin uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Ensure debug directory exists
  const debugDir = path.join(process.cwd(), 'debug_data');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  // API Health Indicator
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy Endpoint: Open Food Facts Product Lookup by Barcode
  // No API keys required, fetched directly from the open registry
  app.get("/api/openfoodfacts/barcode/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      if (!barcode || !/^\d+$/.test(barcode)) {
        return res.status(400).json({ error: "Code-barres invalide" });
      }

      console.log(`[OFF Proxy] Looking up barcode: ${barcode}`);
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      if (!offResponse.ok) {
        return res.status(offResponse.status).json({ error: "Erreur lors de l'appel d'Open Food Facts" });
      }

      const rawData: any = await offResponse.json();
      if (rawData.status === 0 || !rawData.product) {
        return res.json({ found: false, barcode });
      }

      const p = rawData.product;
      const nut = p.nutriments || {};

      // Preserve missing values and missingReason as per P4.6
      const mapNutrient = (name: string, val: any, unit: string) => {
        if (val === undefined || val === null) {
          return { value: null, unit, isMissing: true, missingReason: "not_documented" };
        }
        return { value: Number(val), unit, isMissing: false };
      };

      // Transform and map to CIQUAL/USDA standard structure for Aura Elite Next
      const foodProduct = {
        id: barcode,
        barcode,
        source: "open_food_facts",
        productName: p.product_name_fr || p.product_name || "Produit inconnu",
        brand: p.brands || p.brands_tags?.[0] || "Marque inconnue",
        imageUrl: p.image_url || p.image_front_url || "",
        ingredientsText: p.ingredients_text_fr || p.ingredients_text || "Ingrédients non renseignés",
        allergens: p.allergens_tags?.map((a: string) => a.replace("en:", "").replace("fr:", "")) || [],
        traces: p.traces_tags?.map((t: string) => t.replace("en:", "").replace("fr:", "")) || [],
        nutrimentsPer100g: {
          calories: mapNutrient("calories", nut["energy-kcal_100g"] !== undefined ? nut["energy-kcal_100g"] : (nut["energy_100g"] ? Math.round(nut["energy_100g"] / 4.184) : undefined), "kcal"),
          protein: mapNutrient("protein", nut.proteins_100g, "g"),
          carbs: mapNutrient("carbs", nut.carbohydrates_100g, "g"),
          sugars: mapNutrient("sugars", nut.sugars_100g, "g"),
          fat: mapNutrient("fat", nut.fat_100g, "g"),
          saturatedFat: mapNutrient("saturatedFat", nut["saturated-fat_100g"], "g"),
          fiber: mapNutrient("fiber", nut.fiber_100g, "g"),
          salt: mapNutrient("salt", nut.salt_100g, "g"),
          sodium: mapNutrient("sodium", nut.sodium_100g || (nut.salt_100g ? Number(nut.salt_100g) / 2.5 : undefined), "g")
        },
        sourceCompleteness: p.states_tags?.includes("en:nutrition-facts-completed") ? 100 : 70,
        confidence: 90,
        lastFetchedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      res.json({ found: true, product: foodProduct });
    } catch (error) {
      console.error("[OFF Proxy] Error looking up barcode:", error);
      res.status(500).json({ error: "Échec du serveur proxy Open Food Facts" });
    }
  });

  // API Endpoint: Parse Text Recipes via Gemini AI
  app.post("/api/gemini/parse-recipe", async (req, res) => {
    try {
      const { recipeText } = req.body;
      if (!recipeText) {
        return res.status(400).json({ error: "Le texte de la recette est requis." });
      }

      if (!aiClient) {
        return res.status(500).json({ error: "Clé API Gemini non configurée sur le serveur." });
      }

      const ip = req.ip || "unknown";
      if (!checkQuota(ip)) {
        return res.status(429).json({ error: "Quota journalier d'analyse IA dépassé. Veuillez réessayer demain." });
      }

      const inputHash = computeHash(recipeText);
      if (cacheMap.has(inputHash)) {
        console.log("[Gemini Cache] Hit for parse-recipe");
        return res.json({ ...cacheMap.get(inputHash), cached: true });
      }

      const prompt = `Analyse cette recette de cuisine collée ou dictée par l'athlète et extrait précisément les ingrédients, portions et macro-estimations.
Recette:
${recipeText}`;

      const systemInstruction = `Tu es un nutritionniste de haut niveau pour Aura Elite Next.
Analyse la recette textuelle fournie. Convertis de façon déterministe chaque ingrédient avec son poids théorique en grammes ou volume en ml.
Associe des indices de confiance (0-100) pour chaque ingrédient.
Ne propose jamais de diagnostics ou d'opinions médicales. Formule uniquement en grammage nutritionnel.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nom général de la recette" },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rawText: { type: Type.STRING, description: "Ingrédient textuel brut" },
                    foodName: { type: Type.STRING, description: "Nom standardisé en français d'aliment CIQUAL" },
                    quantity: { type: Type.NUMBER, description: "Quantité brute numérique extraite" },
                    unit: { type: Type.STRING, description: "Unité originale (g, ml, cuillère, tasse, pièce, etc.)" },
                    grams: { type: Type.NUMBER, description: "Poids équivalents convertis en grammes" },
                    confidence: { type: Type.NUMBER, description: "Niveau de certitude de 0 à 100" },
                    assumptions: { type: Type.STRING, description: "Hypothèses de densité ou de portion" }
                  },
                  required: ["rawText", "foodName", "quantity", "unit", "grams", "confidence", "assumptions"]
                }
              },
              missingMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
              questionsForUser: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiresValidation: { type: Type.BOOLEAN }
            },
            required: ["name", "ingredients", "missingMatches", "questionsForUser", "requiresValidation"]
          }
        }
      });

      const parsedJSON = JSON.parse(response.text || "{}");
      const usageLog = {
        id: `usage_${Date.now()}`,
        feature: "recipe_text",
        model: "gemini-3.5-flash",
        inputHash,
        cached: false,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };

      const result = { ...parsedJSON, usageLog };
      cacheMap.set(inputHash, result);
      res.json(result);
    } catch (error) {
      console.error("[Gemini Recipe Engine] Error:", error);
      res.status(500).json({ error: "Échec d'analyse de la recette par l'IA" });
    }
  });

  // API Endpoint: Translate Voice Forms (Daily, RPE, Pain, Nutrition)
  app.post("/api/gemini/parse-voice-form", async (req, res) => {
    try {
      const { transcript, formType } = req.body;
      if (!transcript || !formType) {
        return res.status(400).json({ error: "Transcript et formType requis." });
      }

      if (!aiClient) {
        return res.status(500).json({ error: "Clé API Gemini non configurée sur le serveur." });
      }

      const ip = req.ip || "unknown";
      if (!checkQuota(ip)) {
        return res.status(429).json({ error: "Quota journalier d'analyse IA dépassé. Veuillez réenregistrer demain." });
      }

      const inputHash = computeHash(`${formType}_${transcript}`);
      if (cacheMap.has(inputHash)) {
        console.log("[Gemini Cache] Hit for voice form");
        return res.json({ ...cacheMap.get(inputHash), cached: true });
      }

      const systemInstruction = `Tu es un assistant vocal d'élite pour athlètes.
Extrais les paramètres physiologiques depuis la dictée vocale de l'utilisateur.
Utilise rigoureusement le schéma JSON imposé selon le formulaire ${formType}.
Règles :
- daily : fatigue (1-7), stress (1-7), sleepQuality (1-7), soreness (1-7), mood (1-7), motivation (1-7), painLevel (0-10), digestion (1-5), appetite (1-5). NE transpose jamais de diagnostic médical.
- rpe : rpe (1-10 échelle de Borg), durationMinutes (durée), feeling (1-5), comment, conformanceToPlan.
- nutrition : mealType (breakfast, lunch, dinner, snack, pre_workout, intra_workout, post_workout), items d'aliments avec quantité numérique et unité d'ingrédient.
- pain : localisation de douleur, intensité (0-10), description, facteurs déclenchants.
Livre les incertitudes dans 'uncertainFields' et éléments omis dans 'missingFields'.`;

      const schemas: Record<string, any> = {
        daily: {
          type: Type.OBJECT,
          properties: {
            fatigue: { type: Type.INTEGER, description: "Fatigue (1 à 7)" },
            stress: { type: Type.INTEGER, description: "Stress (1 à 7)" },
            sleepQuality: { type: Type.INTEGER, description: "Qualité sommeil (1 à 7)" },
            soreness: { type: Type.INTEGER, description: "Courbatures (1 à 7)" },
            mood: { type: Type.INTEGER, description: "Humeur (1 à 7)" },
            motivation: { type: Type.INTEGER, description: "Motivation (1 à 7)" },
            painLevel: { type: Type.INTEGER, description: "Niveau de douleur (0 à 10)" },
            digestion: { type: Type.INTEGER, description: "Digestion (1 à 5)" },
            appetite: { type: Type.INTEGER, description: "Appétit (1 à 5)" },
            recovery: { type: Type.INTEGER, description: "Récupération subjective (1 à 10)" },
            isIll: { type: Type.BOOLEAN, description: "Symptôme de maladie" },
            notes: { type: Type.STRING },
            missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            requiresValidation: { type: Type.BOOLEAN }
          },
          required: ["missingFields", "uncertainFields", "requiresValidation"]
        },
        rpe: {
          type: Type.OBJECT,
          properties: {
            rpe: { type: Type.INTEGER, description: "Intensité d'effort RPE (1 à 10)" },
            durationMinutes: { type: Type.INTEGER, description: "Durée en minutes" },
            feeling: { type: Type.INTEGER, description: "Feeling (1 à 5)" },
            comment: { type: Type.STRING },
            conformanceToPlan: { type: Type.BOOLEAN },
            missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            requiresValidation: { type: Type.BOOLEAN }
          },
          required: ["missingFields", "uncertainFields", "requiresValidation"]
        },
        nutrition: {
          type: Type.OBJECT,
          properties: {
            mealType: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  foodName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING, description: "g, ml, piece, portions..." },
                  rawCookedState: { type: Type.STRING, description: "raw ou cuit" },
                  confidence: { type: Type.NUMBER },
                  assumptions: { type: Type.STRING }
                },
                required: ["foodName", "quantity", "unit", "confidence", "assumptions"]
              }
            },
            missingQuantities: { type: Type.ARRAY, items: { type: Type.STRING } },
            uncertainItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            requiresValidation: { type: Type.BOOLEAN }
          },
          required: ["items", "missingQuantities", "uncertainItems", "requiresValidation"]
        },
        pain: {
          type: Type.OBJECT,
          properties: {
            localisation: { type: Type.STRING },
            intensity: { type: Type.INTEGER, description: "Douleur 0 à 10" },
            description: { type: Type.STRING },
            aggravatingFactors: { type: Type.STRING },
            missingFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
            requiresValidation: { type: Type.BOOLEAN }
          },
          required: ["localisation", "intensity", "missingFields", "uncertainFields", "requiresValidation"]
        }
      };

      const specSchema = schemas[formType] || schemas.daily;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: transcript,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: specSchema
        }
      });

      const parsedJSON = JSON.parse(response.text || "{}");
      const usageLog = {
        id: `usage_${Date.now()}`,
        feature: "voice_form",
        model: "gemini-3.5-flash",
        inputHash,
        cached: false,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };

      const result = { ...parsedJSON, usageLog };
      cacheMap.set(inputHash, result);
      res.json(result);
    } catch (error) {
      console.error("[Gemini Vocal Engine] Error:", error);
      res.status(500).json({ error: "Échec de l'extraction par l'Assistant vocal IA" });
    }
  });

  // API Endpoint: Extract Nutrition Facts Labels from Picture (OCR)
  app.post("/api/gemini/extract-nutrition-label", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "L'image base64 est requise." });
      }

      if (!aiClient) {
        return res.status(500).json({ error: "Clé API Gemini non configurée sur le serveur." });
      }

      const ip = req.ip || "unknown";
      if (!checkQuota(ip)) {
        return res.status(429).json({ error: "Quota journalier d'analyse IA dépassé." });
      }

      // Stripping data URL header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const inputHash = computeHash(cleanBase64.slice(0, 5000)); // hash prefix
      if (cacheMap.has(inputHash)) {
        console.log("[Gemini Cache] Hit for label OCR");
        return res.json({ ...cacheMap.get(inputHash), cached: true });
      }

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      };

      const textPart = {
        text: "Analyse cette photo de tableau nutritionnel d'aliment et extrais les nutriments POUR 100 G."
      };

      const systemInstruction = `Tu es un OCR intelligent spécialisé en métabolisme et étiquetage CIQUAL.
Analyse la photo de l'étiquette et extrais les nutriments standardisés uniquement pour 100 G.
Donne des indices de confiance (0-100) pour chaque nutriment.
Ne remplace jamais une valeur illisible par 0, utilise l'argument 'missingReason'.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              servingSize: { type: Type.STRING },
              valuesPer100g: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nutrientId: { type: Type.STRING, description: "calories, protein, carbs, sugars, fat, saturatedFat, fiber, salt, sodium" },
                    value: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    rawText: { type: Type.STRING },
                    missingReason: { type: Type.STRING }
                  },
                  required: ["nutrientId", "value", "unit", "confidence", "rawText"]
                }
              },
              ingredientsText: { type: Type.STRING },
              allergensText: { type: Type.STRING },
              uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiresUserValidation: { type: Type.BOOLEAN }
            },
            required: ["valuesPer100g", "uncertainFields", "requiresUserValidation"]
          }
        }
      });

      const parsedJSON = JSON.parse(response.text || "{}");
      const usageLog = {
        id: `usage_${Date.now()}`,
        feature: "label_ocr",
        model: "gemini-3.5-flash",
        inputHash,
        cached: false,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };

      const result = { ...parsedJSON, usageLog };
      cacheMap.set(inputHash, result);
      res.json(result);
    } catch (error) {
      console.error("[Gemini OCR Engine] Error:", error);
      res.status(500).json({ error: "Échec d'analyse de l'étiquette par Vision IA" });
    }
  });

  // API Endpoint: Analyze Meal Photo (Vision) to propose approximate draft
  app.post("/api/gemini/analyze-meal-photo", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "L'image du repas est requise." });
      }

      if (!aiClient) {
        return res.status(500).json({ error: "Clé API Gemini non configurée sur le serveur." });
      }

      const ip = req.ip || "unknown";
      if (!checkQuota(ip)) {
        return res.status(429).json({ error: "Quota journalier d'analyse IA dépassé." });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const inputHash = computeHash(cleanBase64.slice(0, 5000));
      if (cacheMap.has(inputHash)) {
        console.log("[Gemini Cache] Hit for meal photo analysis");
        return res.json({ ...cacheMap.get(inputHash), cached: true });
      }

      const imagePart = {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64
        }
      };

      const textPart = {
        text: "Identifie les aliments probables présents dans cette assiette de manière visuelle, estime leurs poids, portions ou volumes."
      };

      const systemInstruction = `Tu es un expert en estimation nutritionnelle visuelle pour Aura Elite Next.
Règles cruciales :
- Ne prétends jamais livrer des calories ou valeurs exactes indiscutables. Indique clairement qu'il s'agit d'un brouillon ('MealPhotoDraft') soumis à validation requise obligatoire de l'utilisateur.
- Propose des alternatives intelligentes d'aliments de notre base de données.
- Liste les incertitudes visuelles : sauce dissimulée, mélange non dissociable, etc.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedFoods: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING, description: "Nom informel français de l'ingrédient" },
                    probableFoodIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mappage ou IDs d'aliments du catalogue" },
                    visualConfidence: { type: Type.NUMBER, description: "Confiance visuelle 0 à 100" },
                    estimatedQuantityLabel: { type: Type.STRING, description: "Ex: '150g', 'une cuillère à soupe'" },
                    quantityConfidence: { type: Type.NUMBER, description: "Confiance de quantité 0 à 100" },
                    rawCookedGuess: { type: Type.STRING, description: "raw, cooked ou inconnu" },
                    needsUserConfirmation: { type: Type.BOOLEAN },
                    uncertaintyNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["label", "probableFoodIds", "visualConfidence", "estimatedQuantityLabel", "quantityConfidence", "rawCookedGuess", "needsUserConfirmation", "uncertaintyNotes"]
                }
              },
              globalUncertainties: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              modelVersion: { type: Type.STRING },
              promptVersion: { type: Type.STRING }
            },
            required: ["detectedFoods", "globalUncertainties", "suggestedQuestions", "modelVersion", "promptVersion"]
          }
        }
      });

      const parsedJSON = JSON.parse(response.text || "{}");
      const usageLog = {
        id: `usage_${Date.now()}`,
        feature: "meal_photo",
        model: "gemini-3.5-flash",
        inputHash,
        cached: false,
        status: "confirmed",
        createdAt: new Date().toISOString()
      };

      const result = { ...parsedJSON, usageLog };
      cacheMap.set(inputHash, result);
      res.json(result);
    } catch (error) {
      console.error("[Gemini Meal Photo Engine] Error:", error);
      res.status(500).json({ error: "Échec de l'interprétation de l'assiette par Vision IA" });
    }
  });

  app.post("/api/debug/upload", (req, res) => {
    try {
      const { filename, content, type } = req.body;
      if (!filename || !content) {
        return res.status(400).json({ error: "Missing filename or content" });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeFilename = `${timestamp}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(debugDir, safeFilename);

      let dataToWrite = content;
      
      // If it's base64 (like a zip file), decode it
      if (type === 'base64') {
        dataToWrite = Buffer.from(content, 'base64');
      }

      fs.writeFileSync(filePath, dataToWrite);
      console.log(`Saved debug file: ${filePath}`);
      
      res.json({ success: true, path: filePath });
    } catch (error) {
      console.error("Error saving debug file:", error);
      res.status(500).json({ error: "Failed to save file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
