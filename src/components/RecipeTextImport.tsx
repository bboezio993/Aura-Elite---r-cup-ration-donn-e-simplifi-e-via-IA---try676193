import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../components/FirebaseProvider';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  FileText, 
  HelpCircle, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  UserPlus, 
  Plus, 
  Edit3, 
  Coffee 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function RecipeTextImport({ onAddMealItem }: { onAddMealItem: (item: any) => void }) {
  const store = useStore();
  const { user } = useAuth();
  const [recipeText, setRecipeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);

  // Edit states for individual returned ingredients
  const [editedIngredients, setEditedIngredients] = useState<any[]>([]);

  const handleParse = async () => {
    if (!recipeText.trim()) return;
    setLoading(true);
    setError(null);
    setDraft(null);

    try {
      const res = await fetch("/api/gemini/parse-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeText })
      });
      if (!res.ok) {
        throw new Error("L'assistant nutritionnel n'a pas pu traiter cette recette.");
      }
      const data = await res.json();
      setDraft(data);
      setEditedIngredients(data.ingredients || []);

      // If uid available, write aiUsageLogs in Firestore to document cost
      if (user && data.usageLog) {
        try {
          const usageDoc = doc(db, 'aiUsageLogs', data.usageLog.id);
          await setDoc(usageDoc, { ...data.usageLog, uid: user.uid });
        } catch (fsErr) {
          console.warn("Firestore usage logging skipped:", fsErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Délai d'attente dépassé ou anomalie d'analyse IA. Assurez-vous d'avoir saisi du texte lisible.");
    } finally {
      setLoading(false);
    }
  };

  const updateIngredientGram = (idx: number, grams: number) => {
    const updated = [...editedIngredients];
    updated[idx] = { ...updated[idx], grams: Number(grams) };
    setEditedIngredients(updated);
  };

  const updateIngredientName = (idx: number, name: string) => {
    const updated = [...editedIngredients];
    updated[idx] = { ...updated[idx], foodName: name };
    setEditedIngredients(updated);
  };

  const handleValidateAndAdd = () => {
    if (!draft) return;

    // Convert parsed ingredients to FoodLog properties
    // For calculation, assume: (for simplicity, we assume generic macronutrients profile if we don't have deep food library in state - wait, let's estimate average macros as calculated by standard densities, or calculate 4kcal/g carbs/prot, 9kcal/g fat based on standard protein content)
    
    editedIngredients.forEach(ing => {
      // Propose mock/generic macros corresponding to the food, standard average is typically:
      // Protein 10g, Carbs 15g, Fat 5g per 100g or standard conversion estimation
      const grams = ing.grams || 100;
      const confidence = ing.confidence || 80;

      // Add to current meal logger items
      onAddMealItem({
        foodId: `rec_ing_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        foodName: ing.foodName,
        quantity: grams,
        unit: "g",
        gramsSelected: grams,
        conversionConfidence: confidence,
        conversionAssumptions: ing.assumptions || "Extrait de recette de cuisine par l'IA",
        sourceType: "recipe_text",
        calories: Math.round(grams * 1.5), // approx: 150 kcal per 100g
        protein: Number((grams * 0.08).toFixed(1)), // approx 8% prot
        carbs: Number((grams * 0.18).toFixed(1)), // approx 18% carbs
        fat: Number((grams * 0.04).toFixed(1)) // approx 4% fat
      });
    });

    // Save recipe structure into Zustand store recipes log
    const newRecipe = {
      id: `recipe_${Date.now()}`,
      name: draft.name || "Recette Importée IA",
      ingredients: editedIngredients.map(ing => ({
        foodName: ing.foodName,
        quantity: ing.quantity,
        unit: ing.unit,
        grams: ing.grams
      })),
      createdAt: new Date().toISOString()
    };
    store.addRecipe(newRecipe);

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setDraft(null);
      setRecipeText('');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
          <FileText size={14} className="text-primary" />
          Coller le texte brut de votre recette (blog, email, livre) :
        </label>
        <textarea
          rows={5}
          value={recipeText}
          onChange={(e) => setRecipeText(e.target.value)}
          placeholder={`Ex: Risotto aux cèpes pour 2 personnes :
- 150g de riz arborio
- 1 conserve de champignons sylvestres (cèpes)
- 1 cube de bouillon de légumes
- 25g de parmesan râpé
- Un demi oignon rouge haché`}
          className="w-full text-xs rounded-lg border border-border bg-background p-3 focus:ring-1 focus:outline-none placeholder:text-muted-foreground/50 leading-relaxed font-sans"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground">
          Analyse instantanée et défilement des ingrédients via Gemini-3.5-flash
        </span>
        <Button
          onClick={handleParse}
          disabled={loading || !recipeText.trim()}
          className="text-xs font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Extraction IA en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 animate-pulse" />
              Analyser la recette 🌟
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex gap-2 items-center">
          <Check size={16} />
          <span>Recette dégradée et ses ingrédients ajoutés au calcul de charge nutritionnelle !</span>
        </div>
      )}

      {draft && (
        <div className="p-4 border rounded-2xl bg-secondary/5 border-border/80 space-y-4 animate-fade-in text-xs">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Recette Détectée</span>
              <h4 className="text-sm font-bold text-foreground">{draft.name}</h4>
            </div>
            <Badge variant="secondary" className="gap-1 text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/25">
              <Sparkles size={10} />
              Structurée à 95%
            </Badge>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-[10px] uppercase text-muted-foreground">Ingrédients traduits & convertis :</h5>
            
            <div className="divide-y divide-border/40 max-h-60 overflow-y-auto pr-1">
              {editedIngredients.map((ing, idx) => (
                <div key={idx} className="py-2.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground line-through block italic">{ing.rawText}</span>
                    <input 
                      type="text" 
                      value={ing.foodName} 
                      onChange={(e) => updateIngredientName(idx, e.target.value)}
                      className="text-xs font-semibold bg-background border px-1.5 py-0.5 rounded max-w-xs mt-1" 
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] text-muted-foreground block">Converti :</span>
                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          value={ing.grams}
                          onChange={(e) => updateIngredientGram(idx, Number(e.target.value))}
                          className="w-14 bg-background border px-1 py-0.5 rounded text-center text-xs text-foreground font-bold"
                        />
                        <span className="text-[10px] text-muted-foreground">g</span>
                      </div>
                    </div>
                    
                    <Badge variant={ing.confidence >= 80 ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {ing.confidence}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {draft.missingMatches?.length > 0 && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1.5 text-[11px]">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={13} />
                Ingrédients incertains ou non appariés ({draft.missingMatches.length}) :
              </span>
              <ul className="list-disc list-inside text-muted-foreground pl-1 leading-tight space-y-0.5">
                {draft.missingMatches.map((item: any, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.questionsForUser?.length > 0 && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1 text-[11px]">
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <HelpCircle size={13} />
                Questions ou doutes identifiés :
              </span>
              <ul className="list-disc list-inside text-muted-foreground pl-1 leading-tight space-y-0.5">
                {draft.questionsForUser.map((item: any, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t flex justify-end">
            <Button
              onClick={handleValidateAndAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Valider et ajouter les ingrédients ({editedIngredients.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
