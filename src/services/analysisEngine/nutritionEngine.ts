import { AppState } from "../../store/useStore";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";
import { buildNutritionDaySummary } from "./mealLogEngine";
import { NutritionAnalysisResult, MealTimingAnalysis, MicronutrientCoverageValue } from "../../domain/nutrition/foodTypes";

function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(durationStr) || 0;
}

const MICRONUTRIENT_TARGETS: Record<string, { target: number; unit: string; name: string }> = {
  sodium: { target: 2000, unit: "mg", name: "Sodium" },
  potassium: { target: 3500, unit: "mg", name: "Potassium" },
  calcium: { target: 1000, unit: "mg", name: "Calcium" },
  magnesium: { target: 400, unit: "mg", name: "Magnésium" },
  iron: { target: 14, unit: "mg", name: "Fer" },
  zinc: { target: 11, unit: "mg", name: "Zinc" },
  vitC: { target: 90, unit: "mg", name: "Vitamine C" },
  vitD: { target: 15, unit: "mcg", name: "Vitamine D" },
  vitB12: { target: 2.4, unit: "mcg", name: "Vitamine B12" }
};


export function analyzeNutritionDay(state: AppState, dateStr: string): NutritionAnalysisResult {
  const summary = buildNutritionDaySummary(state.mealLogs, dateStr, state.metrics, state);
  const weightKg = state.userProfile?.general?.weight || null;
  const heightCm = state.userProfile?.general?.height || null;
  const age = state.userProfile?.general?.age || null;
  const gender = state.userProfile?.general?.gender || null;

  // Setup dynamic targets from userProfile goal
  const goal = state.userProfile?.nutritionGoal;
  const objective = goal?.objective ?? "performance";
  const targetCalories = goal?.calories?.value ?? (weightKg ? Math.round(weightKg * 35) : 2400);
  const targetProteinGPerKg = goal?.proteinGPerKg?.value ?? 1.8;
  const targetCarbsGPerKg = goal?.carbsGPerKg?.value ?? 4.0;
  
  const targetProtein = weightKg ? Math.round(weightKg * targetProteinGPerKg) : 110;
  const targetCarbs = weightKg ? Math.round(weightKg * targetCarbsGPerKg) : 260;
  const targetFat = goal?.fat?.value ?? 75;
  const targetFiber = goal?.fiber?.value ?? 30;
  const targetHydration = goal?.hydration?.value ?? 2500;
  const targetSodium = goal?.sodium?.value ?? 2300;

  // Calcul BMR
  let bmr: number | null = null;
  if (weightKg && heightCm && age && gender) {
    const s = gender === 'female' ? -161 : 5;
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
  }

  // Calcul dépenses actives
  const activeCalToday = state.metrics
    .filter((m) => (m.type === "active_calories" || m.type === "activity_calories") && m.timestamp && m.timestamp.startsWith(dateStr))
    .reduce((a, b) => a + b.value, 0);

  const hasGarminActivities = state.garminActivities.some((a) => a.date && a.date.startsWith(dateStr));
  const hasGarmin = hasGarminActivities || activeCalToday > 0;
  const estimatedExpenditureKcal = (bmr !== null && hasGarmin) ? Math.round(bmr + activeCalToday) : null;
  const energyBalance = estimatedExpenditureKcal !== null ? summary.totalCalories - estimatedExpenditureKcal : null;

  // Ratios macros
  const proteinGPerKg = weightKg ? Number((summary.totalProtein / weightKg).toFixed(2)) : null;
  const carbsGPerKg = weightKg ? Number((summary.totalCarbs / weightKg).toFixed(2)) : null;

  // FFM pour disponibilité énergétique
  let ffm: number | null = null;
  if (weightKg) {
    const bodyFat = (state.userProfile as any)?.general?.bodyFatPercentage || null;
    if (bodyFat !== null) {
      ffm = weightKg * (1 - bodyFat / 100);
    }
  }

  const activeExerciseCal = state.garminActivities
    .filter((a) => a.date && a.date.startsWith(dateStr))
    .reduce((sum, act) => sum + (act.calories || 0), 0);

  const hasSufficientNutritionData = summary.isComplete || summary.presentMeals.length >= 3;
  const energyAvailability = (ffm !== null && hasSufficientNutritionData) ? (summary.totalCalories - activeExerciseCal) / ffm : null;

  // Micronutrient Coverage
  const micronutrientCoverage: Record<string, MicronutrientCoverageValue> = {};
  
  Object.keys(MICRONUTRIENT_TARGETS).forEach(key => {
    const targetInfo = MICRONUTRIENT_TARGETS[key];
    const itemInSummary = summary.micronutrients?.find(m => m.nutrientId === key || m.nutrientId.toLowerCase().replace(/_/g, '') === key.toLowerCase());
    
    if (!itemInSummary || itemInSummary.isMissing) {
      micronutrientCoverage[key] = {
        value: 0,
        unit: targetInfo.unit,
        status: "unmeasured"
      };
    } else {
      const val = itemInSummary.value || 0;
      const ratio = val / targetInfo.target;
      micronutrientCoverage[key] = {
        value: val,
        unit: targetInfo.unit,
        ratio: Number(ratio.toFixed(2)),
        status: ratio >= 0.75 ? "met" : "low"
      };
    }
  });

  // Timing around exercise
  const dayActivities = state.garminActivities.filter((a) => a.date && a.date.startsWith(dateStr));
  const hasWorkouts = dayActivities.length > 0;
  const longRun = dayActivities.find(a => 
    (a.type?.toLowerCase() === "running") && 
    ((a.distance && a.distance > 8) || (a.duration && parseDurationToSeconds(a.duration) > 3000) || (a.calories && a.calories > 450))
  );

  const dayLogs = state.mealLogs.filter(l => l.date === dateStr);
  const preMeal = dayLogs.find(l => l.mealType === "pre_workout");
  const postMeal = dayLogs.find(l => l.mealType === "post_workout");
  const intraMeal = dayLogs.find(l => l.mealType === "intra_workout");

  const preWorkoutPresent = !!preMeal;
  const postWorkoutPresent = !!postMeal;
  const intraWorkoutPresent = !!intraMeal;

  // Carbs before long run
  let hasSufficientCarbsBeforeLongRun = false;
  if (longRun) {
    if (preMeal && preMeal.items.reduce((sum, i) => sum + i.carbs, 0) >= 30) {
      hasSufficientCarbsBeforeLongRun = true;
    } else if (dayLogs.some(l => l.mealType === "breakfast" && l.items.reduce((sum, i) => sum + i.carbs, 0) >= 50)) {
      hasSufficientCarbsBeforeLongRun = true;
    }
  }

  // Protein post workout
  let hasSufficientProteinPostWorkout = false;
  if (hasWorkouts) {
    if (postMeal && postMeal.items.reduce((sum, i) => sum + i.protein, 0) >= 20) {
      hasSufficientProteinPostWorkout = true;
    } else if (dayLogs.some(l => l.items.reduce((sum, i) => sum + i.protein, 0) >= 25)) {
      hasSufficientProteinPostWorkout = true;
    }
  }

  const timingNotes: string[] = [];
  let timingScore = 100;

  if (hasWorkouts) {
    if (!preWorkoutPresent) {
      timingNotes.push("Repas de pré-entraînement (Pre-workout) non renseigné.");
      timingScore -= 20;
    }
    if (!postWorkoutPresent) {
      timingNotes.push("Repas de récupération post-séance non renseigné.");
      timingScore -= 25;
    }
    if (longRun && !intraWorkoutPresent && longRun.duration && parseDurationToSeconds(longRun.duration) > 4200) {
      timingNotes.push("Séance longue d'endurance détectée sans apport intra-effort enregistré.");
      timingScore -= 15;
    }
    if (longRun && !hasSufficientCarbsBeforeLongRun) {
      timingNotes.push("Apport glucidique pré-séance longue potentiellement à optimiser.");
      timingScore -= 15;
    }
    if (!hasSufficientProteinPostWorkout) {
      timingNotes.push("Apport de protéines après l'effort à documenter pour la réparation.");
      timingScore -= 15;
    }
    if (summary.totalHydrationMl < 1000) {
      timingNotes.push("Hydratation à surveiller particulièrement les jours d'entraînement.");
      timingScore -= 10;
    }
  } else {
    timingNotes.push("Aucune séance Garmin détectée aujourd’hui pour évaluer le timing de péri-entraînement.");
    timingScore = 100; // Base baseline
  }
  
  timingScore = Math.max(20, timingScore);

  const mealTiming: MealTimingAnalysis = {
    score: timingScore,
    notes: timingNotes,
    preWorkoutPresent,
    postWorkoutPresent,
    intraWorkoutPresent,
    hasSufficientCarbsBeforeLongRun,
    hasSufficientProteinPostWorkout
  };

  // Fueling category
  let fuelingScore = 100;
  const fuelingNotes: string[] = [];
  let fuelingStatus = "Données suffisantes";

  if (hasWorkouts) {
    if (longRun) {
      if (!preWorkoutPresent && !intraWorkoutPresent) {
        fuelingNotes.push("Séance longue détectée aujourd’hui. Les apports autour de l’entraînement sont incomplets ou non renseignés.");
        fuelingScore -= 40;
        fuelingStatus = "Signal à compléter";
      } else {
        fuelingNotes.push("Ravitaillement autour de la séance longue documenté.");
        fuelingStatus = "Optimisé";
      }
    } else {
      fuelingNotes.push("Ravitaillement de séance standard enregistré.");
      fuelingStatus = "Standard";
    }
  } else {
    fuelingNotes.push("Données insuffisantes pour interpréter le ravitaillement (pas de séance enregistrée).");
    fuelingStatus = "Données insuffisantes";
    fuelingScore = 50;
  }

  const limitations = [...summary.limits];
  if (ffm === null) {
    limitations.push("Disponibilité énergétique non évaluable : masse maigre inconnue.");
  }
  if (bmr === null) {
    limitations.push("Dépense énergétique basale (BMR) non calculée car votre profil est incomplet.");
  }
  if (weightKg === null) {
    limitations.push("Calculs de balance énergétique limités : poids manquant dans le profil.");
  }

  let finalConfidence = summary.confidence;
  if (weightKg === null || bmr === null) {
    finalConfidence -= 15;
  }
  finalConfidence = Math.max(10, finalConfidence);

  return {
    date: dateStr,
    energyIntakeKcal: summary.totalCalories,
    estimatedExpenditureKcal,
    energyBalance,
    proteinTotalG: summary.totalProtein,
    proteinGPerKg,
    carbsTotalG: summary.totalCarbs,
    carbsGPerKg,
    fatTotalG: summary.totalFat,
    fiberG: summary.totalFiber,
    hydrationMl: summary.totalHydrationMl,
    micronutrientCoverage,
    mealTiming,
    trainingFueling: {
      score: fuelingScore,
      status: fuelingStatus,
      notes: fuelingNotes
    },
    energyAvailability,
    confidence: finalConfidence,
    limitations,
    targets: {
      calories: targetCalories,
      protein: targetProtein,
      carbs: targetCarbs,
      fat: targetFat,
      fiber: targetFiber,
      hydration: targetHydration,
      sodium: targetSodium,
      objective
    }
  };
}

export function runNutritionEngine(state: AppState): ModularEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const analysis = analyzeNutritionDay(state, todayStr);
  const summary = buildNutritionDaySummary(state.mealLogs, todayStr, state.metrics, state);

  const dataUsed = ["meal_logs"];
  const dataMissing: string[] = [];
  if (state.mealLogs.filter(l => l.date === todayStr).length === 0) {
    dataMissing.push("meal_logs_today");
  }

  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];

  let score = 50;

  if (analysis.energyIntakeKcal > 0) {
    const targetProteinGPerKg = state.userProfile?.nutritionGoal?.proteinGPerKg?.value ?? 1.8;
    const targetCarbsGPerKg = state.userProfile?.nutritionGoal?.carbsGPerKg?.value ?? 4.0;
    const targetFiber = state.userProfile?.nutritionGoal?.fiber?.value ?? 25;
    const targetHydration = state.userProfile?.nutritionGoal?.hydration?.value ?? 2000;

    // 1. Apport Protéique (Max 15)
    const proRatio = analysis.proteinGPerKg ? Math.min(1.0, analysis.proteinGPerKg / targetProteinGPerKg) : 0.5;
    const proteinPoints = Math.round(proRatio * 15);

    // 2. Apport Glucidique (Max 15)
    const carbsRatio = analysis.carbsGPerKg ? Math.min(1.0, analysis.carbsGPerKg / targetCarbsGPerKg) : 0.5;
    const carbsPoints = Math.round(carbsRatio * 15);

    // 3. Disponibilité Énergétique (Max 10)
    let eaPoints = 10;
    if (analysis.energyAvailability !== null) {
      if (analysis.energyAvailability < 30) eaPoints = 3;
      else if (analysis.energyAvailability < 45) eaPoints = 8;
    } else {
      eaPoints = 7; // valeur par défaut prudente
    }

    // 4. Complétude de la Saisie (Max 15)
    const completePoints = summary.isComplete ? 15 : 6;

    // 5. Hydratation (Max 10)
    const hydrationPoints = Math.round(Math.min(1.0, analysis.hydrationMl / targetHydration) * 10);

    // 6. Fibres alimentaires (Max 10)
    const fiberPoints = Math.round(Math.min(1.0, analysis.fiberG / targetFiber) * 10);

    // 7. Précision & sources (Confiance portions, recettes claires) (Max 10)
    let qualityPoints = 10;
    if (summary.approximatedPortions > 1) qualityPoints -= 3;
    if (summary.recipesWithoutClearPortions > 0) qualityPoints -= 3;
    if (summary.foodsWithoutSource > 0) qualityPoints -= 2;
    const missingNutrientsCount = summary.missingNutrients.length;
    if (missingNutrientsCount > 4) qualityPoints -= 2;
    qualityPoints = Math.max(0, qualityPoints);

    // 8. Couverture Micronutritionnelle des minéraux/vitamines (Max 10)
    const totalMicros = Object.keys(analysis.micronutrientCoverage).length;
    const metMicros = Object.values(analysis.micronutrientCoverage).filter(m => m.status === "met").length;
    const microRatio = totalMicros > 0 ? metMicros / totalMicros : 0.5;
    const microPoints = Math.round(microRatio * 10);

    // 9. Timing des nutriments autour effort (Max 5)
    const timingPoints = Math.round((analysis.mealTiming.score / 100) * 5);

    score = proteinPoints + carbsPoints + eaPoints + completePoints + hydrationPoints + fiberPoints + qualityPoints + microPoints + timingPoints;
    score = Math.min(100, Math.max(10, score));

    // Drivers
    if (proRatio >= 0.85) {
      positiveDrivers.push({
        metricId: "protein_intake",
        label: "Apport protéique ciblé",
        impact: "positive",
        value: `${analysis.proteinTotalG}g`,
        note: `Cible de ${targetProteinGPerKg} g/kg bien couverte.`
      });
    } else {
      negativeDrivers.push({
        metricId: "protein_intake",
        label: "Apport protéique bas",
        impact: "negative",
        value: `${analysis.proteinTotalG}g`,
        note: `Inférieur à la cible de ${targetProteinGPerKg} g/kg.`
      });
    }

    if (carbsRatio >= 0.85) {
      positiveDrivers.push({
        metricId: "carbs_intake",
        label: "Réserves de glycogène nourries",
        impact: "positive",
        value: `${analysis.carbsTotalG}g`,
        note: `Apports glucidiques optimaux (${analysis.carbsGPerKg} g/kg) pour l'effort.`
      });
    } else {
      negativeDrivers.push({
        metricId: "carbs_intake",
        label: "Glucides à compléter",
        impact: "negative",
        value: `${analysis.carbsTotalG}g`,
        note: `Apport glucidique de ${analysis.carbsGPerKg || 0} g/kg en deçà de la cible.`
      });
    }

    if (analysis.hydrationMl >= targetHydration) {
      positiveDrivers.push({
        metricId: "hydration",
        label: "Hydratation optimale",
        impact: "positive",
        value: `${(analysis.hydrationMl / 1000).toFixed(1)}L`,
        note: `Objectif de ${(targetHydration / 1000).toFixed(1)}L atteint.`
      });
    } else {
      negativeDrivers.push({
        metricId: "hydration",
        label: "Hydratation insuffisante",
        impact: "negative",
        value: `${(analysis.hydrationMl / 1000).toFixed(1)}L`,
        note: `Cible minimale non atteinte (${(targetHydration / 1000).toFixed(1)}L).`
      });
    }

    if (analysis.fiberG >= targetFiber) {
      positiveDrivers.push({
        metricId: "fiber",
        label: "Soutien du transit (fibres)",
        impact: "positive",
        value: `${analysis.fiberG}g`,
        note: "Objectif de fibres atteint pour soutenir la digestion."
      });
    } else if (analysis.fiberG > 0) {
      negativeDrivers.push({
        metricId: "fiber",
        label: "Fibres à augmenter",
        impact: "negative",
        value: `${analysis.fiberG}g`,
        note: `Cible requise : ${targetFiber}g.`
      });
    }

    if (microRatio >= 0.7) {
      positiveDrivers.push({
        metricId: "micros",
        label: "Variété micronutritionnelle",
        impact: "positive",
        value: `${metMicros}/${totalMicros}`,
        note: "Couverture majoritaire des cofacteurs métaboliques clés."
      });
    } else if (metMicros < totalMicros / 2) {
      negativeDrivers.push({
        metricId: "micros",
        label: "Micronutriments incomplets",
        impact: "negative",
        value: `${metMicros}/${totalMicros}`,
        note: "Plusieurs vitamines et minéraux de la base d'estimation restent sous les repères."
      });
    }

    if (analysis.mealTiming.score < 70) {
      negativeDrivers.push({
        metricId: "meal_timing",
        label: "Timing péri-effort à structurer",
        impact: "negative",
        value: `${analysis.mealTiming.score}/100`,
        note: "Repas pré, intra ou récupération post-séance absents ou incomplets."
      });
    }
  }

  let status: "optimal" | "adequate" | "low" | "incomplete" | "watch" = "adequate";
  if (score > 80) status = "optimal";
  else if (score < 45) status = "watch";
  else if (score < 65) status = "low";

  if (!summary.isComplete) {
    status = "incomplete";
  }

  let secureWording = "à interpréter avec les données de ressenti et sommeil disponibles. Disponibilité énergétique adéquate pour soutenir la récupération active.";
  if (status === "watch" || status === "low" || status === "incomplete") {
    secureWording = "à interpréter avec les données de ressenti de fatigue et de sommeil disponibles. Disponibilité énergétique basse possible.";
  }

  return {
    score,
    status,
    confidence: analysis.confidence,
    positiveDrivers,
    negativeDrivers,
    dataUsed,
    dataMissing,
    limits: analysis.limitations,
    secureWording
  };
}
