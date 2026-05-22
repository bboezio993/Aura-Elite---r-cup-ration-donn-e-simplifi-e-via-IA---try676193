import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, AnalysisResult } from "../types";
import { runAnalysisEngine } from "./analysisEngine/engine";
import { useStore } from "../store/useStore";
import { runExplainabilityLayer } from "./analysisEngine/explainabilityLayer";

// Instantiate GoogleGenAI client with standard config and aistudio-build telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    }
  }
});

export async function analyzeHealthData(
  profile: UserProfile,
  recentMetrics: any[] // Kept for signature compatibility
): Promise<AnalysisResult> {
  // Retrieve deterministic pre-calculated results from the store/internal math engine
  const storeState = useStore.getState();
  const calculatedScores = runAnalysisEngine(storeState);
  const explainability = runExplainabilityLayer(storeState);

  // Define the system instructions guiding the model to act purely as a pedagogical rewriter, bypassing any primary calculations
  const systemInstruction = `
    Vous êtes un rédacteur et vulgarisateur sportif de haut niveau pour Aura Elite.
    Votre unique mission est de reformuler de manière pédagogique, fluide et extrêmement bienveillante les résultats déterminés par notre moteur mathématique interne de physiologie sportive.
    
    RÈGLES CRUCIALES :
    1. Vous ne devez JAMAIS effectuer de calculs mathématiques personnels ni modifier les scores et statuts fournis.
    2. Respectez scrupuleusement les scores calculés par notre moteur :
       - Score Readiness de disponibilité : ${calculatedScores.performanceReadiness.score}
       - Statut Readiness : ${calculatedScores.performanceReadiness.status}
       - Score Récupération : ${calculatedScores.recoveryStatus.score}
       - Statut Récupération : ${calculatedScores.recoveryStatus.status}
       - Statut Sommeil : ${calculatedScores.sleepHealth.status}
    3. Utilisez obligatoirement des formulations prudentes, préventives et non médicales pour décrire les limites et contraintes :
       - Ne posez jamais de diagnostic.
       - Parlez de "signaux de surcharge à surveiller", "charge aiguë élevée par rapport à votre historique récent", "adaptation prudente de la charge recommandée", "douleur déclarée nécessitant une attention particulière", "disponibilité énergétique possiblement basse".
    4. Intégrez l'explication contextuelle suivante fournie par l'Explainability Layer :
       - "${explainability.shortSummary}"
       - "${explainability.pedagogicalReformulation}"
    
    Rédigez une synthèse claire d'environ 3 à 4 phrases en français dans la propriété "summary".
  `;

  const prompt = `
    Profil de l'athlète : ${JSON.stringify(profile)}
    Résultats physiologiques internes : ${JSON.stringify(calculatedScores)}
    
    Produisez l'analyse reformulée au format JSON respectant strictement le schéma spécifié.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readinessScore: { type: Type.NUMBER, description: "Doit correspondre exactement au score interne fourni." },
            status: { 
              type: Type.STRING, 
              enum: ["optimal", "stable", "strained", "critical"], 
              description: "Adapté du statut de disponibilité." 
            },
            summary: { type: Type.STRING, description: "Synthèse pédagogique et fluide de l'état actuel de récupération." }
          },
          required: ["readinessScore", "status", "summary"]
        }
      }
    });

    const parsedText = response.text || "{}";
    const result = JSON.parse(parsedText);

    // Force strict alignment of scores and status with internal mathematical determinations, protecting against AI hallucination or deviations
    let mappedStatus: "optimal" | "stable" | "strained" | "critical" = "stable";
    if (calculatedScores.performanceReadiness.status === "optimal") {
       mappedStatus = "optimal";
    } else if (calculatedScores.performanceReadiness.status === "caution") {
       mappedStatus = "critical";
    } else if (calculatedScores.performanceReadiness.status === "reduced" || calculatedScores.performanceReadiness.status === "low") {
       mappedStatus = "strained";
    }

    return {
      readinessScore: calculatedScores.performanceReadiness.score,
      status: mappedStatus,
      summary: result.summary || explainability.naturalLanguageExplanation,
      recommendations: [], // Deterministic recommendations are handled separately on the dashboard
      trends: {
        hrv: calculatedScores.trends?.hrv || "stable",
        recovery: calculatedScores.trends?.recovery || "stable"
      }
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Safe deterministic fallback completely independent of API failure
    let mappedStatus: "optimal" | "stable" | "strained" | "critical" = "stable";
    if (calculatedScores.performanceReadiness.status === "optimal") mappedStatus = "optimal";
    else if (calculatedScores.performanceReadiness.status === "caution") mappedStatus = "critical";
    else if (calculatedScores.performanceReadiness.status === "reduced" || calculatedScores.performanceReadiness.status === "low") mappedStatus = "strained";

    return {
      readinessScore: calculatedScores.performanceReadiness.score,
      status: mappedStatus,
      summary: explainability.naturalLanguageExplanation,
      recommendations: [],
      trends: {
        hrv: calculatedScores.trends?.hrv || "stable",
        recovery: calculatedScores.trends?.recovery || "stable"
      }
    };
  }
}
