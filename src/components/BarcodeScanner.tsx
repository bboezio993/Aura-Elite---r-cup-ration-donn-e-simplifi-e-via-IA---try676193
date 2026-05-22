import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Scan, 
  Search, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  Heart, 
  Apple, 
  Plus, 
  Loader2, 
  Camera, 
  Info,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BarcodeScanner({ onAddMealItem }: { onAddMealItem: (item: any) => void }) {
  const store = useStore();
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any | null>(null);
  const [hasDetector, setHasDetector] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Portion calculation state
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');
  const [rawCooked, setRawCooked] = useState<'raw' | 'cooked'>('raw');

  // Corrections state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedBrand, setEditedBrand] = useState('');
  const [editedCalories, setEditedCalories] = useState(0);
  const [editedProtein, setEditedProtein] = useState(0);
  const [editedCarbs, setEditedCarbs] = useState(0);
  const [editedFat, setEditedFat] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check for experimental BarcodeDetector support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      setHasDetector(true);
    }
  }, []);

  const startScanner = async () => {
    setError(null);
    setScanning(true);
    setProduct(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();

        // If BarcodeDetector is available, set up detection interval loop
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
          });

          const detectLoop = async () => {
            if (!scanning || !streamRef.current) return;
            try {
              if (videoRef.current) {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detected = barcodes[0].rawValue;
                  console.log("Barcode detected:", detected);
                  setBarcode(detected);
                  stopScanner();
                  handleLookup(detected);
                  return;
                }
              }
              // Loop every 300ms
              setTimeout(detectLoop, 300);
            } catch (err) {
              console.warn("Barcode detection error:", err);
            }
          };
          setTimeout(detectLoop, 1000);
        }
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Impossible d'accéder à la caméra. Veuillez saisir le code-barres manuellement.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleLookup = async (codeToLookup = barcode) => {
    if (!codeToLookup) return;
    setLoading(true);
    setError(null);
    setProduct(null);
    setIsEditing(false);

    try {
      const res = await fetch(`/api/openfoodfacts/barcode/${codeToLookup}`);
      if (!res.ok) {
        throw new Error("Erreur de proxy Open Food Facts");
      }
      const data = await res.json();
      if (data.found && data.product) {
        const prod = data.product;
        setProduct(prod);
        
        // Initialize corrections states
        setEditedName(prod.productName);
        setEditedBrand(prod.brand);
        setEditedCalories(prod.nutrimentsPer100g.calories.value);
        setEditedProtein(prod.nutrimentsPer100g.protein.value);
        setEditedCarbs(prod.nutrimentsPer100g.carbs.value);
        setEditedFat(prod.nutrimentsPer100g.fat.value);

        // Check if favorite in store
        const isFav = store.userProfile?.favoriteFoodIds?.includes(prod.id) || false;
        setIsFavorite(isFav);
      } else {
        setError(`Produit non enregistré ou introuvable pour : "${codeToLookup}". Veuillez le saisir manuellement ou tenter un OCR d'étiquette.`);
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("Échec de connexion au service Open Food Facts. Vérifiez votre réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = () => {
    if (!product) return;
    const isFav = !isFavorite;
    setIsFavorite(isFav);

    const fIds = store.userProfile?.favoriteFoodIds || [];
    let updated: string[];
    if (fIds.includes(product.id)) {
      updated = fIds.filter(id => id !== product.id);
    } else {
      updated = [...fIds, product.id];
    }
    store.updateUserProfile({ favoriteFoodIds: updated });
  };

  // Calculate current item values
  const gramsSelected = unit === 'g' ? quantity : quantity * 50; // default piece is 50g approx
  const finalCals = Math.round(((isEditing ? editedCalories : product?.nutrimentsPer100g.calories.value || 0) * gramsSelected) / 100);
  const finalProtein = Number((((isEditing ? editedProtein : product?.nutrimentsPer100g.protein.value || 0) * gramsSelected) / 100).toFixed(1));
  const finalCarbs = Number((((isEditing ? editedCarbs : product?.nutrimentsPer100g.carbs.value || 0) * gramsSelected) / 100).toFixed(1));
  const finalFat = Number((((isEditing ? editedFat : product?.nutrimentsPer100g.fat.value || 0) * gramsSelected) / 100).toFixed(1));

  const handleAddProduct = () => {
    if (!product) return;

    onAddMealItem({
      foodId: product.id,
      foodName: `${isEditing ? editedName : product.productName} (${isEditing ? editedBrand : product.brand})`,
      quantity,
      unit,
      gramsSelected,
      rawCookedState: unit === 'g' ? rawCooked : undefined,
      conversionConfidence: 95,
      conversionAssumptions: `Directement issu de l'API Open Food Facts (${barcode}). Corrigé par l'utilisateur: ${isEditing ? 'Oui' : 'Non'}.`,
      sourceType: "open_food_facts",
      calories: finalCals,
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat
    });

    // Reset layout
    setProduct(null);
    setBarcode('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            pattern="\d*"
            placeholder="Saisir code-barres (EAN-13, UPC)..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
            className="w-full text-xs rounded-lg border border-border bg-background py-2 pl-9 pr-4 focus:ring-1 focus:outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleLookup()}
            disabled={!barcode || loading}
            className="text-xs h-[34px] px-3 font-semibold shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1" />}
            Rechercher
          </Button>

          <Button
            type="button"
            variant={scanning ? "destructive" : "secondary"}
            onClick={scanning ? stopScanner : startScanner}
            className="text-xs h-[34px] px-3 font-semibold shrink-0"
          >
            <Camera className="w-3.5 h-3.5 mr-1" />
            {scanning ? "Arrêter" : "Scanner photo"}
          </Button>
        </div>
      </div>

      {scanning && (
        <div className="relative border border-primary/20 rounded-2xl overflow-hidden bg-black max-w-sm mx-auto aspect-video flex flex-col justify-end">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/80 to-transparent text-[10px] text-white text-center">
            {hasDetector ? "Détection automatique active. Présentez le code-barres." : "Détection automatique indisponible sur ce navigateur. Cadrez et tapez le code."}
          </div>
          <div className="absolute inset-0 border-2 border-emerald-500/40 m-8 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="w-full h-[1px] bg-red-500/80 animate-pulse shadow-sm" />
          </div>
          {/* Saisie rapide pendant scan action */}
          <div className="p-2 bg-black/80 flex justify-center z-10">
            <Button
              size="sm"
              onClick={() => {
                // Mock test scan if user wants simple emulation in local env
                setBarcode("3017620422003"); // Famous Barcode (Nutella)
                stopScanner();
                handleLookup("3017620422003");
              }}
              className="text-[9px] h-6 px-2 bg-emerald-600 text-white font-mono font-bold"
            >
              Simuler Code Nutella (3017620422003)
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs flex gap-2 items-start leading-relaxed">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Interrogation du registre central Open Food Facts...</span>
        </div>
      )}

      {product && (
        <div className="p-4 border rounded-2xl bg-secondary/10 border-border/80 space-y-4 animate-fade-in text-xs">
          <div className="flex gap-3">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.productName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 object-contain rounded-lg bg-white border shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h5 className="font-bold text-sm text-foreground truncate">{product.productName}</h5>
                  <span className="text-[10px] text-muted-foreground block">{product.brand}</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                  Completeness: {product.sourceCompleteness}%
                </Badge>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-6 px-2 text-[9px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                >
                  {isEditing ? "Conserver corrections" : "Modifier valeurs / 100g ✏️"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleFavorite}
                  className={`h-6 px-2 text-[9px] font-bold uppercase ${isFavorite ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
                >
                  <Heart size={10} className={`mr-1 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "Favori !" : "Favorisé"}
                </Button>
              </div>
            </div>
          </div>

          {/* Form modifications inside */}
          {isEditing ? (
            <div className="p-3 bg-secondary/30 rounded-xl border border-border/40 space-y-3">
              <h6 className="font-bold text-[10px] uppercase text-muted-foreground">Corriger l'aliment (/100g)</h6>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground">Nom :</label>
                  <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="w-full bg-background border p-1 rounded font-sans text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground">Marque :</label>
                  <input type="text" value={editedBrand} onChange={e => setEditedBrand(e.target.value)} className="w-full bg-background border p-1 rounded font-sans text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground">Cal (kcal)</label>
                  <input type="number" value={editedCalories} onChange={e => setEditedCalories(Number(e.target.value))} className="w-full bg-background border p-1 rounded font-mono text-center text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground">Prot (g)</label>
                  <input type="number" step="0.1" value={editedProtein} onChange={e => setEditedProtein(Number(e.target.value))} className="w-full bg-background border p-1 rounded font-mono text-center text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground">Glu (g)</label>
                  <input type="number" step="0.1" value={editedCarbs} onChange={e => setEditedCarbs(Number(e.target.value))} className="w-full bg-background border p-1 rounded font-mono text-center text-xs" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground">Lip (g)</label>
                  <input type="number" step="0.1" value={editedFat} onChange={e => setEditedFat(Number(e.target.value))} className="w-full bg-background border p-1 rounded font-mono text-center text-xs" />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-secondary/20 rounded-xl border border-secondary border-t-2 border-t-emerald-500 flex justify-between items-center text-center">
              <div>
                <span className="text-[8px] block uppercase text-muted-foreground">Calories (100g)</span>
                <span className="font-mono font-bold text-xs text-emerald-500">{product.nutrimentsPer100g.calories.value} kcal</span>
              </div>
              <div>
                <span className="text-[8px] block uppercase text-muted-foreground">Protéines</span>
                <span className="font-mono font-bold text-xs text-indigo-400">{product.nutrimentsPer100g.protein.value}g</span>
              </div>
              <div>
                <span className="text-[8px] block uppercase text-muted-foreground">Glucides</span>
                <span className="font-mono font-bold text-xs text-amber-500">{product.nutrimentsPer100g.carbs.value}g</span>
              </div>
              <div>
                <span className="text-[8px] block uppercase text-muted-foreground">Lipides</span>
                <span className="font-mono font-bold text-xs text-rose-400">{product.nutrimentsPer100g.fat.value}g</span>
              </div>
            </div>
          )}

          {/* Portion and Selection values */}
          <div className="pt-3 border-t border-border/60">
            <h6 className="font-bold text-[10px] uppercase text-muted-foreground mb-3 flex items-center gap-1">
              <Sliders size={12} className="text-primary" />
              Configuration de la portion consommée
            </h6>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-muted-foreground block mb-1">Unité :</label>
                <select 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs rounded-lg border border-border bg-background p-2 focus:ring-1 focus:outline-none"
                >
                  <option value="g">Grammes (g)</option>
                  <option value="piece">Unité / Pièce moyenne (~50g)</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-muted-foreground block mb-1">Quantité :</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border border-border bg-background p-2 font-mono"
                />
              </div>
            </div>

            {unit === 'g' && (
              <div className="pt-2">
                <label className="text-[9px] font-bold text-muted-foreground block mb-1">État de cuisson :</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <input type="radio" value="raw" checked={rawCooked === 'raw'} onChange={() => setRawCooked('raw')} className="accent-emerald-500" />
                    Cru
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <input type="radio" value="cooked" checked={rawCooked === 'cooked'} onChange={() => setRawCooked('cooked')} className="accent-emerald-500" />
                    Cuit
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div className="font-mono leading-tight">
              <span className="text-[9px] uppercase text-muted-foreground block">Apports estimés pour {quantity} {unit} :</span>
              <span className="font-bold text-xs text-emerald-500">{finalCals} kcal</span>
              <span className="text-[10px] text-muted-foreground block">Pro: {finalProtein}g • Glu: {finalCarbs}g • Lip: {finalFat}g</span>
            </div>
            
            <Button
              onClick={handleAddProduct}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-9 px-4 rounded-lg text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Ajouter au repas
            </Button>
          </div>

          {/* Source completeness and quality warn */}
          <div className="p-2 border border-blue-500/20 bg-blue-500/5 rounded-xl text-[10px] text-muted-foreground flex gap-1.5 items-center leading-tight">
            <Info size={12} className="text-blue-500 shrink-0" />
            <span>Données issues d’Open Food Facts - à vérifier si produit sensible.</span>
          </div>
        </div>
      )}
    </div>
  );
}
