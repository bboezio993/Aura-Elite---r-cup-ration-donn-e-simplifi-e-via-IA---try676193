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
  FileText, 
  Sliders, 
  Info,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function LabelOCRCapture({ onAddMealItem }: { onAddMealItem: (item: any) => void }) {
  const store = useStore();
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [success, setSuccess] = useState(false);

  // States for portion and manual edits
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');
  const [editedNutrients, setEditedNutrients] = useState<any[]>([]);
  const [editedName, setEditedName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOcrResult(null);
      setError(null);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyzeLabel = async () => {
    if (!imageSrc) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/extract-nutrition-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageSrc })
      });

      if (!res.ok) {
        throw new Error("L'intelligence artificielle n'a pas pu décoder l'étiquette. Veuillez prendre une photo plus nette.");
      }

      const data = await res.json();
      setOcrResult(data);
      setEditedNutrients(data.valuesPer100g || []);
      setEditedName(data.productName || "Produit OCRisé");

      // Save usage log structure
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
      setError("Délai d'attente d'analyse vision dépassé. Essayez de recadrer pour n'afficher que le tableau d'ingrédients.");
    } finally {
      setLoading(false);
    }
  };

  const updateNutrientValue = (idx: number, newVal: number) => {
    const updated = [...editedNutrients];
    updated[idx] = { ...updated[idx], value: Number(newVal) };
    setEditedNutrients(updated);
  };

  // Compute final values from selection portion
  const gramsSelected = unit === 'g' ? quantity : quantity * 50; 
  const getNutrient = (id: string) => {
    const nut = editedNutrients.find(n => n.nutrientId === id);
    return nut ? nut.value : 0;
  };

  const finalCals = Math.round((getNutrient("calories") * gramsSelected) / 100);
  const finalProtein = Number(((getNutrient("protein") * gramsSelected) / 100).toFixed(1));
  const finalCarbs = Number(((getNutrient("carbs") * gramsSelected) / 100).toFixed(1));
  const finalFat = Number(((getNutrient("fat") * gramsSelected) / 100).toFixed(1));

  const handleConfirmAndAdd = () => {
    if (!ocrResult) return;

    onAddMealItem({
      foodId: `ocr_${Date.now()}`,
      foodName: `${editedName} (Extrait par OCR)`,
      quantity,
      unit,
      gramsSelected,
      conversionConfidence: 90,
      conversionAssumptions: `Extrait de photo d'étiquette d'emballage par Vision OCR. Certitude moyenne de l'IA: 90%.`,
      sourceType: "label_ocr",
      calories: finalCals,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setOcrResult(null);
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
          <UploadCloud className="w-8 h-8 text-muted-foreground animate-bounce" />
          <p className="font-semibold text-foreground text-xs">Importer la photo d'un emballage nutritionnel 📸</p>
          <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
            Glissez-déposez ou cliquez pour photographier directement l'étiquette nutritionnelle (tableau blanc de glucides, lipides, protéines pour 100g).
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
            <img src={imageSrc} alt="Pre-OCR label" className="max-h-full object-contain" />
            <button 
              onClick={() => setImageSrc(null)}
              className="absolute top-2 right-2 p-1 bg-black/80 text-white rounded-lg px-2 text-[10px] font-bold uppercase transition-all"
            >
              Changer d'image ❌
            </button>
          </div>

          {!ocrResult && (
            <div className="flex justify-end">
              <Button
                onClick={handleAnalyzeLabel}
                disabled={loading}
                className="text-xs h-9 font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Lecture de l'étiquette par Vision IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500 animate-pulse" />
                    Lancer l'OCR intelligent ✨
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
          <span>Nutriments d'emballage ajoutés avec succès !</span>
        </div>
      )}

      {ocrResult && (
        <div className="p-4 border rounded-2xl bg-secondary/5 border-border/80 space-y-4 animate-fade-in text-xs">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-muted-foreground block">Résultats de décodage Vision</span>
              <input 
                type="text" 
                value={editedName} 
                onChange={e => setEditedName(e.target.value)} 
                className="text-sm font-bold bg-background border rounded px-1.5 py-0.5 text-foreground mt-0.5" 
              />
            </div>
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
              <Sparkles size={10} />
              OCR Fiable à 92%
            </Badge>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-[10px] uppercase text-muted-foreground flex items-center justify-between">
              <span>Nutriments identifiés (/100g ou 100ml) :</span>
              <span className="text-[9px] text-amber-500 font-normal">Veuillez vérifier et affiner avant confirmation</span>
            </h5>

            <div className="grid grid-cols-2 gap-3">
              {editedNutrients.map((nut, idx) => (
                <div key={idx} className="p-2 border rounded-xl bg-background flex flex-col justify-between gap-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="font-semibold uppercase font-mono">{nut.nutrientId}</span>
                    <span className="italic">"{nut.rawText}"</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="number"
                        step="0.1"
                        value={nut.value}
                        onChange={(e) => updateNutrientValue(idx, Number(e.target.value))}
                        className="w-16 bg-secondary border p-1 rounded text-center text-xs font-bold font-mono"
                      />
                      <span className="text-[10px] text-muted-foreground">{nut.unit}</span>
                    </div>

                    <Badge variant={nut.confidence >= 80 ? "default" : "secondary"} className="text-[9px]">
                      {nut.confidence}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {ocrResult.allergensText && (
            <div className="p-2.5 bg-rose-500/5 border border-rose-500/10 rounded-xl leading-relaxed text-[10.5px]">
              <span className="font-bold text-rose-400 block mb-0.5">Allergènes décelés :</span>
              <p className="text-muted-foreground italic">"{ocrResult.allergensText}"</p>
            </div>
          )}

          {ocrResult.uncertainFields?.length > 0 && (
            <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl leading-relaxed text-[10.5px]">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Tableaux ou lignes ambigües :
              </span>
              <ul className="list-disc list-inside text-muted-foreground pl-1 space-y-0.5">
                {ocrResult.uncertainFields.map((field: string, idx: number) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Setup portion */}
          <div className="pt-3 border-t">
            <h6 className="font-bold text-[10px] uppercase text-muted-foreground mb-3 flex items-center gap-1">
              <Sliders size={12} className="text-primary" />
              Quantité consommée de cet aliment
            </h6>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground block mb-1">Unité :</label>
                <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs rounded-lg border p-2 bg-background focus:ring-1 focus:outline-none"
                >
                  <option value="g">Grammes (g)</option>
                  <option value="portion">Portion de l'emballage (~50g)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground block mb-1">Quantité :</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border p-2 bg-background font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t flex items-center justify-between">
            <div className="font-mono leading-tight">
              <span className="text-[9px] uppercase text-muted-foreground block">Apports estimés pour {quantity} {unit} :</span>
              <span className="font-bold text-xs text-emerald-500">{finalCals} kcal</span>
              <span className="text-[10px] text-muted-foreground block">Pro: {finalProtein}g • Glu: {finalCarbs}g • Lip: {finalFat}g</span>
            </div>
            
            <Button
              onClick={handleConfirmAndAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 px-4 rounded-lg"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Confirmer et Ajouter au repas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
