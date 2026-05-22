import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../components/FirebaseProvider';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  UploadCloud, 
  Loader2, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  Utensils, 
  Maximize2, 
  Sliders, 
  Info,
  Apple
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MealPhotoCapture({ onAddMealItem }: { onAddMealItem: (item: any) => void }) {
  const store = useStore();
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);

  // States for ingredient revisions
  const [editedFoods, setEditedFoods] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyzeMeal = async () => {
    if (!imageSrc) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/analyze-meal-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageSrc })
      });

      if (!res.ok) {
        throw new Error("L'assistant nutritionnel visuel n'a pas pu évaluer l'image.");
      }

      const data = await res.json();
      setAnalysisResult(data);
      setEditedFoods(data.detectedFoods || []);

      if (user && data.usageLog) {
        try {
          const usageDoc = doc(db, 'aiUsageLogs', data.usageLog.id);
          await setDoc(usageDoc, { ...data.usageLog, uid: user.uid });
        } catch (fsErr) {
          console.warn("Firestore usage log write skipped:", fsErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Anomalie réseau ou d'interprétation visuelle de l'assiette. Veuillez réessayer avec une image centrée.");
    } finally {
      setLoading(false);
    }
  };

  const updateFoodGrams = (idx: number, gramsLabel: string) => {
    const updated = [...editedFoods];
    updated[idx] = { ...updated[idx], estimatedQuantityLabel: gramsLabel };
    setEditedFoods(updated);
  };

  const updateFoodLabel = (idx: number, newLabel: string) => {
    const updated = [...editedFoods];
    updated[idx] = { ...updated[idx], label: newLabel };
    setEditedFoods(updated);
  };

  const handleConfirmAndAddAll = () => {
    if (!analysisResult) return;

    editedFoods.forEach(food => {
      // Decode raw weight from label like '150g'
      let numericGrams = 100;
      const match = food.estimatedQuantityLabel.match(/(\d+)/);
      if (match) {
        numericGrams = Number(match[1]);
      }

      // Propose approx macro profiles based on standard caloric density (average 120 kcal, 6g prot, 18g carbs, 3g lipids per 100g)
      onAddMealItem({
        foodId: `photo_img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        foodName: `${food.label} (Estimation visuelle)`,
        quantity: numericGrams,
        unit: "g",
        gramsSelected: numericGrams,
        conversionConfidence: food.visualConfidence || 75,
        conversionAssumptions: `Estimé visuellement par Gemini Vision. État supposé: ${food.rawCookedGuess}. Note: ${food.uncertaintyNotes?.[0] || 'aucune'}.`,
        sourceType: "meal_photo",
        calories: Math.round(numericGrams * 1.3),
        protein: Number((numericGrams * 0.06).toFixed(1)),
        carbs: Number((numericGrams * 0.16).toFixed(1)),
        fat: Number((numericGrams * 0.03).toFixed(1))
      });
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setAnalysisResult(null);
      setImageSrc(null);
    }, 1500);
  };

  return (
    <div className="space-y-4 text-xs">
      {!imageSrc ? (
        <div 
          onClick={handleUploadClick}
          className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer bg-secondary/10 hover:bg-secondary/20 transition-all space-y-2 flex flex-col items-center justify-center py-8"
        >
          <Utensils className="w-8 h-8 text-muted-foreground animate-pulse" />
          <p className="font-semibold text-foreground text-xs">Photographier votre assiette de repas 📸</p>
          <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
            Glissez-déposez ou cliquez pour prendre une photo de votre assiette complète (ex: pâtes au saumon, riz poulet, salade composée).
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl border overflow-hidden aspect-video bg-black flex justify-center items-center">
            <img src={imageSrc} alt="User meal plate" className="max-h-full object-contain" />
            <button 
              onClick={() => setImageSrc(null)}
              className="absolute top-2 right-2 p-1 bg-black/80 text-white rounded-lg px-2 text-[10px] font-bold uppercase transition-all animate-fade-in"
            >
              Changer de repas ❌
            </button>
          </div>

          {!analysisResult && (
            <div className="flex justify-end">
              <Button
                onClick={handleAnalyzeMeal}
                disabled={loading}
                className="text-xs h-9 font-bold font-sans"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Interprétation calorique de l'assiette...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 animate-pulse" />
                    Estimer calories visuellement ✨
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex gap-2 items-center">
          <Check size={16} />
          <span>Brouillon validé ! Les portions estimées ont été intégrées dans votre journal d'entraînement !</span>
        </div>
      )}

      {analysisResult && (
        <div className="p-4 border rounded-2xl bg-secondary/5 border-border/80 space-y-4 animate-fade-in text-xs">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-muted-foreground block">Estimation Visuelle Proratisée</span>
              <h5 className="font-bold text-foreground">Aliments & Portions détectés :</h5>
            </div>
            <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] animate-pulse">
              <Sparkles size={10} />
              Brouillon non validé ⚠️
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="divide-y divide-border/40 max-h-60 overflow-y-auto pr-1">
              {editedFoods.map((food, idx) => (
                <div key={idx} className="py-2.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <input 
                      type="text" 
                      value={food.label} 
                      onChange={(e) => updateFoodLabel(idx, e.target.value)}
                      className="text-xs font-semibold bg-background border px-1.5 py-0.5 rounded max-w-xs" 
                    />
                    <div className="text-[10px] text-muted-foreground mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[9px] font-normal">{food.rawCookedGuess}</Badge>
                      {food.uncertaintyNotes?.length > 0 && (
                        <span className="italic block text-[9.5px]">({food.uncertaintyNotes[0]})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <span className="text-[9px] text-muted-foreground block">Quantité standard :</span>
                      <input 
                        type="text" 
                        value={food.estimatedQuantityLabel} 
                        onChange={(e) => updateFoodGrams(idx, e.target.value)}
                        className="w-20 bg-background border px-1.5 py-0.5 rounded text-xs text-foreground font-bold font-mono text-center"
                      />
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-muted-foreground uppercase block">Confiance</span>
                      <Badge variant={food.visualConfidence >= 75 ? "default" : "secondary"} className="text-[10px]">
                        {food.visualConfidence}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {analysisResult.suggestedQuestions?.length > 0 && (
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1.5 text-[11px] leading-relaxed">
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <HelpCircle size={13} />
                Pour affiner la précision macro de votre assiette :
              </span>
              <ul className="list-disc list-inside text-muted-foreground pl-1 space-y-1">
                {analysisResult.suggestedQuestions.map((q: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">
                    {q} 
                    <button 
                      onClick={() => {
                        // Let user add details directly inside notes field
                        const updated = [...editedFoods];
                        updated[0] = { ...updated[0], uncertaintyNotes: ["Confirmé par l'athlète sous forme de précision manuelle."] };
                        setEditedFoods(updated);
                      }}
                      className="ml-1.5 text-[9px] text-primary hover:underline font-bold uppercase"
                    >
                      Confirmer Oui ✔️
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.globalUncertainties?.length > 0 && (
            <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl leading-relaxed text-[11px] space-y-1">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Incertitudes visuelles (matières grasses, épaisseur) :
              </span>
              <ul className="list-disc list-inside text-muted-foreground pl-1 space-y-0.5">
                {analysisResult.globalUncertainties.map((unc: string, idx: number) => (
                  <li key={idx}>{unc}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t flex justify-end">
            <Button
              onClick={handleConfirmAndAddAll}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Valider toutes les portions ({editedFoods.length} aliments)
            </Button>
          </div>

          <div className="p-2 border border-blue-500/10 bg-blue-500/5 rounded-xl text-[10px] text-muted-foreground flex gap-1.5 items-center leading-tight">
            <Info size={12} className="text-blue-500 shrink-0" />
            <span>Rappel : Les calories visuelles sont estimées de façon probabiliste. Corrigé sur validation.</span>
          </div>
        </div>
      )}
    </div>
  );
}
