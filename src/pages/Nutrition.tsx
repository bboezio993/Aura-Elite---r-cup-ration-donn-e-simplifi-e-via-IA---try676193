import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { NutritionLogger } from "../features/nutrition/NutritionLogger";
import { buildNutritionDaySummary } from "../services/analysisEngine/mealLogEngine";
import { analyzeNutritionDay } from "../services/analysisEngine/nutritionEngine";
import { foodNutrientDatabase } from "../domain/nutrition/foodNutrientValues";
import { 
  Droplets, 
  Apple, 
  AlertCircle, 
  Plus, 
  Flame, 
  Activity, 
  Scale, 
  Info,
  Clock,
  ShieldAlert,
  Dumbbell,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Heart,
  Sliders,
  RotateCcw,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Nutrition() {
  const storeState = useStore();
  const addMetric = useStore(state => state.addMetric);

  const todayStr = new Date().toISOString().split("T")[0];
  const [isRestDay, setIsRestDay] = useState(false);
  
  const mealTypeOrder = [
    "breakfast",
    "pre_workout",
    "intra_workout",
    "post_workout",
    "lunch",
    "snack",
    "dinner"
  ];
  
  // High fidelity structures from our central engines
  const summary = buildNutritionDaySummary(storeState.mealLogs, todayStr, storeState.metrics, storeState);
  const analysis = analyzeNutritionDay(storeState, todayStr);

  const todayMeals = storeState.mealLogs.filter(log => log.date === todayStr);
  const weightKg = storeState.userProfile?.general?.weight;
  const isProfileComplete = !!(weightKg && storeState.userProfile?.general?.height && storeState.userProfile?.general?.age && storeState.userProfile?.general?.gender);

  // Macro targets (derived dynamically from analysis targets)
  let targetCalories = analysis.targets?.calories ?? 2400;
  let targetProtein = analysis.targets?.protein ?? (weightKg ? Math.round(weightKg * 1.8) : 110);
  let targetCarbs = analysis.targets?.carbs ?? (weightKg ? Math.round(weightKg * 4.0) : 260);
  let targetFat = analysis.targets?.fat ?? 75;
  let targetWaterHtml = analysis.targets?.hydration ?? 2500;
  let targetFiber = analysis.targets?.fiber ?? 30;
  let targetSodium = analysis.targets?.sodium ?? 2300;
  const currentObjective = analysis.targets?.objective ?? "performance";

  if (isRestDay) {
    targetCalories = Math.round(targetCalories * 0.82);
    targetCarbs = weightKg ? Math.round(weightKg * 2.8) : 180;
    targetFat = Math.round(targetFat * 0.9);
  }

  // Goal customization state and functions
  const userGoal = storeState.userProfile?.nutritionGoal || {
    calories: { value: 2400, isUserDefined: false },
    proteinGPerKg: { value: 1.8, isUserDefined: false },
    carbsGPerKg: { value: 4.0, isUserDefined: false },
    fat: { value: 75, isUserDefined: false },
    fiber: { value: 30, isUserDefined: false },
    hydration: { value: 2500, isUserDefined: false },
    sodium: { value: 2300, isUserDefined: false },
    objective: "performance",
    updatedAt: undefined,
    source: undefined
  };

  const handleUpdateGoalField = (field: string, val: any) => {
    const updatedGoal = {
      ...userGoal,
      [field]: field === "objective" ? val : { value: Number(val), isUserDefined: true },
      updatedAt: new Date().toISOString(),
      source: "Manuel (Athlète)"
    };
    storeState.updateUserProfile({
      nutritionGoal: updatedGoal
    });
  };

  const handleResetGoals = () => {
    const w = weightKg || 65;
    const defaultGoal = {
      calories: { value: Math.round(w * 35), isUserDefined: false },
      proteinGPerKg: { value: 1.8, isUserDefined: false },
      carbsGPerKg: { value: 4.0, isUserDefined: false },
      fat: { value: Math.round(w * 1.1), isUserDefined: false },
      fiber: { value: 30, isUserDefined: false },
      hydration: { value: 2500, isUserDefined: false },
      sodium: { value: 2300, isUserDefined: false },
      objective: "performance" as const,
      updatedAt: new Date().toISOString(),
      source: "Défaut (Calculateur)"
    };
    storeState.updateUserProfile({
      nutritionGoal: defaultGoal
    });
  };

  const handleAddWater = () => {
    addMetric({
      id: `water_${Date.now()}`,
      source: "manual",
      timestamp: new Date().toISOString(),
      type: "hydration_volume",
      value: 250,
      unit: "ml",
      confidenceScore: 100
    });
  };

  // List of micronutrients for P6 block
  const trackingMicros = [
    { id: "sodium", name: "Sodium", normalMin: targetSodium, normalMax: 2300, unit: "mg" },
    { id: "potassium", name: "Potassium", normalMin: 3500, normalMax: 4700, unit: "mg" },
    { id: "calcium", name: "Calcium", normalMin: 1000, normalMax: 1200, unit: "mg" },
    { id: "magnesium", name: "Magnésium", normalMin: 400, normalMax: 420, unit: "mg" },
    { id: "iron", name: "Fer", normalMin: 14, normalMax: 18, unit: "mg" },
    { id: "zinc", name: "Zinc", normalMin: 11, normalMax: 15, unit: "mg" },
    { id: "vitC", name: "Vitamine C", normalMin: 90, normalMax: 110, unit: "mg" },
    { id: "vitD", name: "Vitamine D", normalMin: 15, normalMax: 50, unit: "mcg" },
    { id: "vitB12", name: "Vitamine B12", normalMin: 2.4, normalMax: 4.0, unit: "mcg" }
  ];

  return (
    <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nutrition & Métabolisme</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Adaptez vos apports réels aux dépenses physiques réelles sans fallbacks biométriques arbitraires.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-mono py-1 px-2 text-xs">
            Aura Engine V1
          </Badge>
          <Badge variant="outline" className="border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-mono py-1 px-2 text-xs">
            Indice de confiance : {analysis.confidence}%
          </Badge>
        </div>
      </div>

      {/* Main dashboard macro widgets - Fluid Grid-5 columns list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* Card 1: Calories & Balance */}
        <div className="bento-card p-5 border border-border/60 flex flex-col justify-between h-44">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Balance Énergétique</span>
            {analysis.energyBalance !== null ? (
              <span className={`text-2xl font-black font-mono block mt-1 ${analysis.energyBalance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {analysis.energyBalance > 0 ? '+' : ''}{analysis.energyBalance} <span className="text-xs font-normal text-muted-foreground">kcal</span>
              </span>
            ) : (
              <span className="text-xs font-semibold flex items-center gap-1 text-muted-foreground mt-2">
                <AlertCircle size={14} className="text-orange-400 shrink-0" /> Profil ou Garmin incomplet
              </span>
            )}
          </div>
          <div className="space-y-1 mt-2 text-[11px] font-medium text-muted-foreground">
            <div className="flex justify-between">
              <span>Consommé :</span>
              <span className="text-emerald-500 font-bold">+{summary.totalCalories} / {(isProfileComplete || userGoal.calories.isUserDefined) ? `${targetCalories} kcal` : "à définir"}</span>
            </div>
            {analysis.estimatedExpenditureKcal !== null ? (
              <div className="flex justify-between">
                <span>Dépense (BMR+Act.) :</span>
                <span className="text-red-400 font-bold">-{analysis.estimatedExpenditureKcal} kcal</span>
              </div>
            ) : (
              <div className="flex justify-between">
                <span>Active Garmin :</span>
                <span className="text-red-400 font-bold">
                  {storeState.garminActivities.length > 0 ? (
                    `-${storeState.garminActivities
                      .filter(a => a.date && a.date.startsWith(todayStr))
                      .reduce((acc, a) => acc + (a.calories || 0), 0)} kcal`
                  ) : (
                    "pas d'estimation (Garmin absent)"
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Proteins */}
        <div className="bento-card p-5 flex flex-col justify-between h-44 border border-border/60">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Protéines</span>
              {userGoal.proteinGPerKg.isUserDefined && (
                <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[8px] py-0 px-1">Manuel</Badge>
              )}
            </div>
            <span className="text-2xl font-black font-mono block mt-1 text-indigo-400">
              {summary.totalProtein}g <span className="text-xs font-normal text-muted-foreground">/ {(isProfileComplete || userGoal.proteinGPerKg.isUserDefined) ? `${targetProtein}g` : "à définir"}</span>
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Ratio : {analysis.proteinGPerKg !== null ? `${analysis.proteinGPerKg} g/kg` : "—"}</span>
              <span>{(isProfileComplete || userGoal.proteinGPerKg.isUserDefined) ? `${Math.round(Math.min(100, (summary.totalProtein / targetProtein) * 100))}%` : "—"}</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all" 
                style={{ width: `${(isProfileComplete || userGoal.proteinGPerKg.isUserDefined) ? Math.min(100, (summary.totalProtein / targetProtein) * 100) : 0}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Card 3: Carbohydrates */}
        <div className="bento-card p-5 flex flex-col justify-between h-44 border border-border/60">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Glucides</span>
              {userGoal.carbsGPerKg.isUserDefined && (
                <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[8px] py-0 px-1">Manuel</Badge>
              )}
            </div>
            <span className="text-2xl font-black font-mono block mt-1 text-amber-500">
              {summary.totalCarbs}g <span className="text-xs font-normal text-muted-foreground">/ {(isProfileComplete || userGoal.carbsGPerKg.isUserDefined) ? `${targetCarbs}g` : "à définir"}</span>
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Ratio : {analysis.carbsGPerKg !== null ? `${analysis.carbsGPerKg} g/kg` : "—"}</span>
              <span>{(isProfileComplete || userGoal.carbsGPerKg.isUserDefined) ? `${Math.round(Math.min(100, (summary.totalCarbs / targetCarbs) * 100))}%` : "—"}</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all" 
                style={{ width: `${(isProfileComplete || userGoal.carbsGPerKg.isUserDefined) ? Math.min(100, (summary.totalCarbs / targetCarbs) * 100) : 0}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Card 4: Energy Availability (EA) - B3 Requirement */}
        <div className="bento-card p-5 flex flex-col justify-between h-44 border border-border/60">
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Disponibilité Énergétique (EA)</span>
            <span className="text-2xl font-black font-mono block mt-1 text-rose-400">
              {analysis.energyAvailability !== null ? (
                `${Math.round(analysis.energyAvailability)} kcal`
              ) : (
                "N/A"
              )}
            </span>
          </div>
          <div className="space-y-1">
            {analysis.energyAvailability !== null ? (
              <>
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground leading-tight">
                  <span>Masse Maigre</span>
                  <span className={analysis.energyAvailability >= 45 ? "text-emerald-400" : analysis.energyAvailability >= 30 ? "text-amber-400" : "text-rose-400"}>
                    {analysis.energyAvailability >= 45 ? "Optimal" : analysis.energyAvailability >= 30 ? "Adéquat" : "disponibilité énergétique basse possible"}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight">
                  {analysis.energyAvailability < 30 
                    ? "à interpréter avec les données disponibles" 
                    : "Soutien adéquat des fonctions cellulaires de base."}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground leading-tight">
                  Données de % de gras ou de pesées insuffisantes pour évaluer la disponibilité active.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 5: Liquid Hydration tracker card */}
        <div className="bento-card p-5 flex flex-col justify-between h-44 border border-border/60">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hydratation</span>
              <span className="text-2xl font-black font-mono block mt-1 text-sky-400">
                {(summary.totalHydrationMl / 1000).toFixed(2)} <span className="text-xs font-normal text-muted-foreground">/ {(isProfileComplete || userGoal.hydration.isUserDefined) ? `${(targetWaterHtml / 1000).toFixed(1)} L` : "à définir"}</span>
              </span>
            </div>
            <Button 
              onClick={handleAddWater}
              size="sm" 
              className="w-7 h-7 rounded-full bg-sky-500 text-white hover:bg-sky-600 flex items-center justify-center p-0 shrink-0"
              id="btn-add-water-fast"
            >
              <Plus size={14} />
            </Button>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
              <span>Saisie hydrique :</span>
              <span>{(isProfileComplete || userGoal.hydration.isUserDefined) ? `${Math.min(100, Math.round((summary.totalHydrationMl / targetWaterHtml) * 100))}%` : "—"}</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-400 rounded-full transition-all" 
                style={{ width: `${(isProfileComplete || userGoal.hydration.isUserDefined) ? Math.min(100, Math.round((summary.totalHydrationMl / targetWaterHtml) * 100)) : 0}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main split layout spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Logger is the primary module */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bento-card p-6">
            <NutritionLogger />
          </div>

          {/* Timeline Repas (P1-5) */}
          <div className="bento-card p-6 border border-border space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-border/60">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Clock size={18} className="text-emerald-500" />
                Timeline de Ravitaillement du Jour
              </h3>
              <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono">
                Aura Chrono Flow
              </Badge>
            </div>

            {todayMeals.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground bg-secondary/10 rounded-2xl border border-dashed border-border/50">
                Aucun repas enregistré pour aujourd’hui. Utilisez le formulaire ci-dessus pour composer votre premier repas.
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/20 pl-6 ml-3 space-y-6 pt-2">
                {mealTypeOrder.map((mType) => {
                  const mealsOfThisType = todayMeals.filter(meal => meal.mealType === mType);
                  if (mealsOfThisType.length === 0) return null;

                  return mealsOfThisType.map((meal) => {
                    const totalCal = meal.items.reduce((s, i) => s + (i.calories || 0), 0);
                    const totalPro = meal.items.reduce((s, i) => s + (i.protein || 0), 0);
                    const totalCarb = meal.items.reduce((s, i) => s + (i.carbs || 0), 0);
                    const totalFat = meal.items.reduce((s, i) => s + (i.fat || 0), 0);

                    // Check for quality warnings in this meal
                    const warnings: string[] = [];
                    meal.items.forEach(it => {
                      if (it.unit !== 'g') {
                        warnings.push(`Portion de ${it.foodName} évaluée avec unité (${it.unit}) : précision modérée.`);
                      }
                      const hasNutrients = foodNutrientDatabase[it.foodId] && foodNutrientDatabase[it.foodId].length > 0;
                      if (!hasNutrients) {
                        warnings.push(`Micronutriments non documentés dans la base CIQUAL/USDA pour: ${it.foodName}.`);
                      }
                    });

                    const mealNames: Record<string, string> = {
                      breakfast: "Petit-déjeuner",
                      pre_workout: "Collation Pré-effort 🚀",
                      intra_workout: "Ravitaillement d'effort 🔋",
                      post_workout: "Récupération Post-effort 🔄",
                      lunch: "Déjeuner",
                      snack: "Collation / Snack",
                      dinner: "Dîner"
                    };

                    const typicalHours: Record<string, string> = {
                      breakfast: "07:30",
                      pre_workout: "09:30",
                      intra_workout: "10:45",
                      post_workout: "12:15",
                      lunch: "12:45",
                      snack: "16:00",
                      dinner: "19:45"
                    };

                    const hungerLabels: Record<number, string> = { 1: "Satiété", 3: "Moyenne", 5: "Intense" };
                    const satietyLabels: Record<number, string> = { 1: "Affamé", 3: "Idéale", 5: "Surchargée" };
                    const digestionLabels: Record<number, string> = { 1: "Lourde", 3: "Standard", 5: "Légère" };

                    return (
                      <div key={meal.id} className="relative group">
                        {/* Timeline Bullet Anchor */}
                        <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full border-2 border-emerald-500 bg-background flex items-center justify-center transition-all group-hover:scale-110">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>

                        {/* Card body */}
                        <div className="p-4 bg-secondary/10 hover:bg-secondary/20 transition-all border border-border/80 rounded-2xl space-y-3">
                          {/* Title and delete action */}
                          <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-foreground font-sans uppercase tracking-wider block">
                                <span className="font-mono text-emerald-400 font-black mr-1.5">{typicalHours[mType] || "—"}</span>
                                {mealNames[mType] || mType}
                              </span>
                              {meal.notes && <p className="text-[11px] text-muted-foreground italic leading-tight">&laquo; {meal.notes} &raquo;</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-500/10 text-emerald-400 font-mono text-[10.5px]">
                                {totalCal} kcal
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => storeState.deleteMealLog(meal.id)}
                                className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-500/10 p-0"
                                title="Supprimer ce repas de la journée"
                              >
                                <Trash2 size={12} className="shrink-0" />
                              </Button>
                            </div>
                          </div>

                          {/* Consumed items list */}
                          <div className="text-[11px] space-y-1">
                            <span className="text-[9.5px] uppercase font-bold text-muted-foreground block">Aliments et formules associés</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {meal.items.map((it, idx) => (
                                <div key={idx} className="p-2 rounded-xl bg-background border border-border/45 flex justify-between items-center">
                                  <div className="truncate pr-2">
                                    <span className="font-semibold text-foreground block truncate">{it.foodName}</span>
                                    <span className="text-[9.5px] text-muted-foreground font-mono">
                                      {it.quantity} {it.unit} (~{Math.round(it.gramsSelected)}g)
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10px] text-emerald-500 font-bold shrink-0">{it.calories} kcal</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Dynamic warnings block if any item has missing micronutrients */}
                          {warnings.length > 0 && (
                            <div className="p-2 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-1 text-[10px]">
                              {Array.from(new Set(warnings)).map((w, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-amber-500 leading-tight">
                                  <AlertTriangle size={11} className="shrink-0" />
                                  <span>{w}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Row 4: Subjective variables & Macros */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-border/45 text-[10px]">
                            {/* Pro/Carb/Fat Macros stats */}
                            <div className="flex gap-2.5 items-center font-mono">
                              <span className="bg-indigo-500/15 text-indigo-400 py-0.5 px-2 rounded font-bold">Pro: {totalPro.toFixed(1)}g</span>
                              <span className="bg-amber-500/15 text-amber-400 py-0.5 px-2 rounded font-bold">Cho: {totalCarb.toFixed(1)}g</span>
                              <span className="bg-red-500/15 text-red-500 py-0.5 px-2 rounded font-bold">Lip: {totalFat.toFixed(1)}g</span>
                            </div>

                            {/* Hunger/Fullness/Digestion indicators */}
                            <div className="flex flex-wrap gap-2 text-[9px] uppercase font-bold text-muted-foreground md:justify-end">
                              {meal.hungerBefore !== undefined && (
                                <span className="bg-secondary p-1 rounded-sm">Faim: {hungerLabels[meal.hungerBefore] || meal.hungerBefore}</span>
                              )}
                              {meal.satietyAfter !== undefined && (
                                <span className="bg-secondary p-1 rounded-sm">Satiété: {satietyLabels[meal.satietyAfter] || meal.satietyAfter}</span>
                              )}
                              {meal.digestionAfter !== undefined && (
                                <span className="bg-secondary p-1 rounded-sm">Digestion: {digestionLabels[meal.digestionAfter] || meal.digestionAfter}</span>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            )}
          </div>

          {/* P6 - Micronutriments section */}
          <div className="bento-card p-6 border border-border/60">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Apple size={18} className="text-emerald-500" />
                Micronutriments & Oligo-éléments
              </h3>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Base FoodNutrient database
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Consommations micronutritionnelles agrégées directement depuis les bases de données nutritionnelles (CIQUAL / USDA).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trackingMicros.map(m => {
                const cov = analysis.micronutrientCoverage[m.id];
                const info = summary.micronutrients?.find(nut => nut.nutrientId === m.id);
                const isUnmeas = cov?.status === "unmeasured" || !info || info.isMissing;
                const value = cov?.value || 0;
                const percentage = isUnmeas ? 0 : Math.min(100, Math.round((value / m.normalMin) * 100));

                return (
                  <div key={m.id} className="p-3 border rounded-xl bg-secondary/15 flex flex-col justify-between space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-foreground block">{m.name}</span>
                        <span className="text-[9px] text-muted-foreground">cible min : {m.normalMin} {m.unit}</span>
                      </div>
                      
                      {isUnmeas ? (
                        <Badge variant="outline" className="border-orange-500/20 bg-orange-500/5 text-orange-400 text-[8px] font-mono">
                          Non mesuré
                        </Badge>
                      ) : (
                        <Badge variant="outline" className={`text-[8px] font-mono ${cov?.status === "met" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-amber-500/20 bg-amber-500/5 text-amber-500"}`}>
                          {cov?.status === "met" ? "Atteint" : "Bas"}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-mono font-black text-sm">
                          {isUnmeas ? "— " : value} <span className="text-[9px] font-normal text-muted-foreground">{m.unit}</span>
                        </span>
                        {!isUnmeas && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {percentage}%
                          </span>
                        )}
                      </div>

                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${cov?.status === "met" ? "bg-emerald-500" : "bg-amber-500"}`} 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar right */}
        <div className="lg:col-span-4 space-y-6">

          {/* Goals Editor Box (Fulfills P1-5) */}
          <div className="bento-card p-5 border border-border border-l-4 border-l-emerald-500 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <Sliders size={16} className="text-emerald-500" />
                Objectifs Métabolisme & Cibles
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetGoals}
                className="h-7 text-[10px] px-2 flex gap-1 items-center hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                <RotateCcw size={10} /> Recalculer
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Personnalisez librement vos cibles nutritionnelles sans contraintes algorithmiques de régimes restrictifs.
            </p>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/35 rounded-xl text-[11px] leading-none mb-1">
              <button 
                type="button"
                onClick={() => setIsRestDay(false)}
                className={`py-2 px-2.5 rounded-lg font-bold text-center transition-all ${!isRestDay ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}
              >
                ⚡ Entraînement
              </button>
              <button 
                type="button"
                onClick={() => setIsRestDay(true)}
                className={`py-2 px-2.5 rounded-lg font-bold text-center transition-all ${isRestDay ? "bg-indigo-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}
              >
                🔋 Jour de Repos
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Objective */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Objectif global</label>
                <select 
                  value={currentObjective}
                  onChange={(e) => handleUpdateGoalField("objective", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="maintenance">Maintenance métabolique</option>
                  <option value="performance">Soutien de Performance athlétique</option>
                  <option value="recovery">Récupération systémique active</option>
                  <option value="recomposition">Recomposition corporelle prudente</option>
                  <option value="other">Autre / Équilibre</option>
                </select>
              </div>

              {/* Calories input */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Calories (kcal)</label>
                  <Badge className={`text-[8px] border-none py-0 px-1 font-mono ${userGoal.calories.isUserDefined ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                    {userGoal.calories.isUserDefined ? "Manuel" : "Estimé"}
                  </Badge>
                </div>
                <input 
                  type="number" 
                  value={userGoal.calories.value}
                  onChange={(e) => handleUpdateGoalField("calories", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono"
                />
              </div>

              {/* Protein and Carbs dual input */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block">Protéines (g/kg)</label>
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    value={userGoal.proteinGPerKg.value}
                    onChange={(e) => handleUpdateGoalField("proteinGPerKg", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block">Glucides (g/kg)</label>
                  </div>
                  <input 
                    type="number" 
                    step="0.1"
                    value={userGoal.carbsGPerKg.value}
                    onChange={(e) => handleUpdateGoalField("carbsGPerKg", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Fat, Fiber and Hydration inputs (g and ml) */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Lipides (g)</label>
                  <input 
                    type="number" 
                    value={userGoal.fat.value}
                    onChange={(e) => handleUpdateGoalField("fat", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-1.5 py-1 text-xs font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Fibres (g)</label>
                  <input 
                    type="number" 
                    value={userGoal.fiber.value}
                    onChange={(e) => handleUpdateGoalField("fiber", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-1.5 py-1 text-xs font-mono text-center"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Hydr. (ml)</label>
                  <input 
                    type="number" 
                    value={userGoal.hydration.value}
                    onChange={(e) => handleUpdateGoalField("hydration", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-1.5 py-1 text-xs font-mono text-center"
                  />
                </div>
              </div>

              {/* Sodium input */}
              <div className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block">Sodium cible (mg)</label>
                  <Badge className={`text-[8px] border-none py-0 px-1 font-mono ${userGoal.sodium.isUserDefined ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"}`}>
                    {userGoal.sodium.isUserDefined ? "Manuel" : "Estimé"}
                  </Badge>
                </div>
                <input 
                  type="number" 
                  value={userGoal.sodium.value}
                  onChange={(e) => handleUpdateGoalField("sodium", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs font-mono"
                />
              </div>

            </div>

            <div className="pt-2.5 text-[10px] text-muted-foreground border-t border-border/60 flex justify-between items-center font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Source : {userGoal.source || "Aura Recommandations"}
              </span>
              <span>Modifié : {userGoal.updatedAt ? new Date(userGoal.updatedAt).toLocaleDateString() : "Automatique"}</span>
            </div>
          </div>

          {/* B1 Block - Diagnostic de complétude des données & limitations summary */}
          <div className="bento-card p-6 border border-border border-l-4 border-l-amber-500">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-500" />
              Diagnostic de Complétude des Données
            </h4>
            
            {analysis.limitations.length === 0 ? (
              <div className="py-4 text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Saisie complète et conforme détectée pour aujourd’hui.
              </div>
            ) : (
              <div className="space-y-2">
                {analysis.limitations.map((lim, idx) => (
                  <div key={idx} className="flex gap-2 p-2 bg-secondary/20 rounded-lg text-xs hover:bg-secondary/30 transition-colors">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-[11px] leading-tight">{lim}</span>
                  </div>
                ))}
              </div>
            )}

            {/* General metrics counts inside layout */}
            <div className="pt-3 border-t border-border mt-4 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-secondary/15 p-2 rounded-lg text-center">
                <span className="text-muted-foreground block text-[8px] uppercase font-bold">Portions approx.</span>
                <span className="font-mono font-bold text-foreground">{summary.approximatedPortions}</span>
              </div>
              <div className="bg-secondary/15 p-2 rounded-lg text-center">
                <span className="text-muted-foreground block text-[8px] uppercase font-bold">Sans source</span>
                <span className="font-mono font-bold text-foreground">{summary.foodsWithoutSource}</span>
              </div>
            </div>
          </div>

          {/* B5 - Timing péri-effort (autour des séances Garmin) */}
          <div className="bento-card p-6 border border-border border-l-4 border-l-indigo-500">
            <h4 className="font-bold text-sm mb-2.5 flex items-center gap-1.5">
              <Dumbbell size={16} className="text-indigo-400" />
              Timing Ravitaillement Péri-Effort
            </h4>
            
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Vérifie la répartition de vos apports alimentaires par rapport à vos séances physiques Garmin détectées.
            </p>

            <div className="bg-secondary/30 p-2.5 rounded-xl flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground">Timing d'effort</span>
              <Badge className="bg-indigo-500 text-white font-mono text-[10px]">
                {analysis.mealTiming.score}/100
              </Badge>
            </div>

            <div className="space-y-2 text-xs">
              {analysis.mealTiming.notes.map((note, idx) => (
                <div key={idx} className="p-2.5 bg-secondary/15 rounded-xl border border-secondary text-[11px] leading-relaxed flex gap-2">
                  <Lightbulb size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{note}</span>
                </div>
              ))}
              
              {analysis.mealTiming.notes.length === 0 && (
                <div className="py-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Apports d'efforts de séance alignés.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/60 mt-4">
              <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Status ravitaillement</span>
              <div className="flex justify-between items-center bg-secondary/20 p-2 rounded-lg text-xs font-mono">
                <span className="text-muted-foreground">{analysis.trainingFueling.status}</span>
                <span className="font-bold text-indigo-400">{analysis.trainingFueling.score}%</span>
              </div>
            </div>
          </div>



          <div className="bento-card p-6 border border-border">
            <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
              <Info size={16} className="text-primary" />
              Équivalents Évolution Cru v. Cuit
            </h4>
            <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
              <p>
                Rappelez-vous que la cuisson multiplie le poids de vos glucides par réabsorption d'eau :
              </p>
              <div className="p-3 bg-secondary/15 rounded-xl border space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span>Pâtes crues (&times;2.7)</span>
                  <span>100g &rarr; 270g cuit</span>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span>Riz blanc cru (&times;2.8)</span>
                  <span>100g &rarr; 280g cuit</span>
                </div>
              </div>
              <p className="text-[11px]">
                Renseignez toujours l'état réel (cru ou cuit) de votre aliment pour préserver le modèle d'apport.
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}
