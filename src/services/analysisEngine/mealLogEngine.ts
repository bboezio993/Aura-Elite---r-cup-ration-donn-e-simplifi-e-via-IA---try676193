import { MealLog, NutritionDaySummary, MealItem } from "../../domain/nutrition/foodTypes";
import { foodNutrientDatabase } from "../../domain/nutrition/foodNutrientValues";
import { internalFoodDatabase } from "../../domain/nutrition/foodDatabase";
import { CoreNutrients } from "../../domain/nutrition/nutrientDefinitions";
import { NormalizedMetric } from "../../types";

export function buildNutritionDaySummary(
  mealLogs: MealLog[], 
  dateStr: string, 
  metrics: NormalizedMetric[] = [],
  state?: any
): NutritionDaySummary {
  const dayLogs = mealLogs.filter(l => l.date === dateStr);
  const dayMetrics = metrics.filter(m => m.timestamp && m.timestamp.startsWith(dateStr));
  
  const hydrationMetrics = dayMetrics.filter(m => m.type === "hydration_volume");
  const totalHydration = hydrationMetrics.reduce((sum, m) => sum + (m.value || 0), 0);
  
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  let water = totalHydration;
  
  let totalFiber = 0;
  let totalSugars = 0;
  let totalSaturatedFat = 0;
  let totalSodium = 0;
  let totalPotassium = 0;
  let totalCalcium = 0;
  let totalMagnesium = 0;
  let totalIron = 0;
  let totalZinc = 0;
  let totalVitC = 0;
  let totalVitD = 0;
  let totalVitB12 = 0;

  // Track confidence & missing data
  let missingNutrients: string[] = [];
  let approximatedPortions = 0;
  let missingSourceFoods = 0;
  let recipesWithoutClearPortions = 0;

  const presentMeals = new Set(dayLogs.map(l => l.mealType));

  // Initialize a structure to accumulate micronutrients with confidence weighting
  const accumulators: Record<string, { totalVal: number; totalWeight: number; sumConfidenceProduct: number; missingReasons: Set<string>; isPartiallyMissing: boolean }> = {};
  
  // Set up accumulators for each core nutrient
  Object.keys(CoreNutrients).forEach(key => {
    const nutDef = CoreNutrients[key];
    accumulators[nutDef.id] = {
      totalVal: 0,
      totalWeight: 0,
      sumConfidenceProduct: 0,
      missingReasons: new Set<string>(),
      isPartiallyMissing: false
    };
  });

  // Main aggregator helper
  const addIntake = (foodId: string, gramsSelected: number) => {
    const dbFood = internalFoodDatabase.find(f => f.id === foodId);
    const nutrientValues = foodNutrientDatabase[foodId];

    if (nutrientValues && nutrientValues.length > 0) {
      nutrientValues.forEach(nv => {
        const acc = accumulators[nv.nutrientId];
        if (!acc) return; // Not in core definitions

        if (nv.isMissing) {
          acc.isPartiallyMissing = true;
          if (nv.missingReason) acc.missingReasons.add(nv.missingReason);
          missingNutrients.push(nv.nutrientId);
        } else {
          const val = ((nv.valuePer100g || 0) * gramsSelected) / 100;
          acc.totalVal += val;
          acc.totalWeight += gramsSelected;
          acc.sumConfidenceProduct += (nv.confidence || 80) * gramsSelected;
        }
      });

      // Special check: if any core nutrient is omitted from the database entry for this food,
      // flag it as missing/not_measured rather than silently ignoring or forcing to zero.
      Object.keys(CoreNutrients).forEach(key => {
        const nutId = CoreNutrients[key].id;
        if (nutId === "kcal" || nutId === "protein" || nutId === "carbs" || nutId === "fat") return;
        
        const hasNut = nutrientValues.some(nv => nv.nutrientId === nutId);
        if (!hasNut) {
          accumulators[nutId].isPartiallyMissing = true;
          accumulators[nutId].missingReasons.add("not_measured");
          missingNutrients.push(nutId);
        }
      });

    } else if (dbFood) {
      // Fallback to plain food definitions macros/fiber/sodium if nutrient database doesn't have details
      const fallbackValues: { nutrientId: string; val: number }[] = [
        { nutrientId: "fiber", val: dbFood.fiber || 0 },
        { nutrientId: "sugar", val: dbFood.sugars || 0 },
        { nutrientId: "sat_fat", val: dbFood.saturatedFat || 0 },
        { nutrientId: "sodium", val: dbFood.sodium || 0 }
      ];

      fallbackValues.forEach(f => {
        const acc = accumulators[f.nutrientId];
        if (acc) {
          acc.totalVal += (f.val * gramsSelected) / 100;
          acc.totalWeight += gramsSelected;
          acc.sumConfidenceProduct += 60 * gramsSelected; // lower fallback confidence
        }
      });

      // All others are missing
      Object.keys(CoreNutrients).forEach(key => {
        const nutId = CoreNutrients[key].id;
        if (nutId === "kcal" || nutId === "protein" || nutId === "carbs" || nutId === "fat") return;
        if (["fiber", "sugar", "sat_fat", "sodium"].includes(nutId)) return;

        accumulators[nutId].isPartiallyMissing = true;
        accumulators[nutId].missingReasons.add("unknown");
        missingNutrients.push(nutId);
      });
    }
  };

  // Loop through days meals
  dayLogs.forEach(log => {
    log.items.forEach(item => {
      calories += item.calories || 0;
      protein += item.protein || 0;
      carbs += item.carbs || 0;
      fat += item.fat || 0;
      
      if (item.sourceType === "recipe" && !item.recipeServingCount && !item.recipeServingWeightGrams) {
        recipesWithoutClearPortions++;
      }
      
      if (!item.sourceFoodId && item.sourceType !== "recipe") {
        missingSourceFoods++;
      }
      if (item.conversionConfidence && item.conversionConfidence < 80) {
        approximatedPortions++;
      }

      if (item.sourceType === "recipe" && item.expandedIngredients && item.expandedIngredients.length > 0) {
        // Expand recipe ingredients
        const ratio = item.recipeRatio || 1;
        item.expandedIngredients.forEach(ing => {
          const scaledGrams = (ing.gramsSelected || 0) * ratio;
          if (scaledGrams > 0) {
            addIntake(ing.foodId, scaledGrams);
          }
        });
      } else {
        // Direct food item consumption
        if (item.gramsSelected > 0) {
          addIntake(item.foodId, item.gramsSelected);
        }
      }

      if (item.missingNutrients) {
        missingNutrients.push(...item.missingNutrients);
      }
    });
  });

  // Extract totals from accumulators
  totalFiber = accumulators["fiber"]?.totalVal || 0;
  totalSugars = accumulators["sugar"]?.totalVal || 0;
  totalSaturatedFat = accumulators["sat_fat"]?.totalVal || 0;
  totalSodium = accumulators["sodium"]?.totalVal || 0;
  totalPotassium = accumulators["potassium"]?.totalVal || 0;
  totalCalcium = accumulators["calcium"]?.totalVal || 0;
  totalMagnesium = accumulators["magnesium"]?.totalVal || 0;
  totalIron = accumulators["iron"]?.totalVal || 0;
  totalZinc = accumulators["zinc"]?.totalVal || 0;
  totalVitC = accumulators["vit_c"]?.totalVal || 0;
  totalVitD = accumulators["vit_d"]?.totalVal || 0;
  totalVitB12 = accumulators["vit_b12"]?.totalVal || 0;

  const micronutrientsList = Object.keys(CoreNutrients).map(key => {
    const nutDef = CoreNutrients[key];
    const acc = accumulators[nutDef.id];
    
    const confidence = acc.totalWeight > 0 
      ? Math.round(acc.sumConfidenceProduct / acc.totalWeight) 
      : 80;

    return {
      nutrientId: nutDef.id,
      name: nutDef.name,
      value: Number(acc.totalVal.toFixed(2)),
      unit: nutDef.unit,
      isMissing: acc.totalWeight === 0 && acc.isPartiallyMissing,
      missingNotes: acc.totalWeight === 0 ? Array.from(acc.missingReasons).join(", ") || "Donnée indisponible" : undefined,
      confidence
    };
  });

  // Determine if this is an ongoing day (today block)
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = (dateStr === todayStr);

  const currentHour = new Date().getHours();

  // Determine expected meals based on current hour and day type
  const expectedMeals: ("breakfast" | "lunch" | "dinner")[] = [];
  if (!isToday) {
    expectedMeals.push("breakfast", "lunch", "dinner");
  } else {
    // Only expect meals if their typical hour range has passed
    if (currentHour >= 10) expectedMeals.push("breakfast");
    if (currentHour >= 15) expectedMeals.push("lunch");
    if (currentHour >= 21) expectedMeals.push("dinner");
  }

  // Check which expected meals are missing
  const missedExpectedMeals = expectedMeals.filter(m => !presentMeals.has(m));

  // Determine plausible calorie threshold depending on profile
  let targetCalThreshold = 1200;
  let isProfileComplete = false;
  const userProfile = state?.userProfile;
  if (userProfile?.general?.weight && userProfile?.general?.height && userProfile?.general?.age && userProfile?.general?.gender) {
    isProfileComplete = true;
    const { weight: weightKg, height: heightCm, age, gender } = userProfile.general;
    const s = gender === 'female' ? -161 : 5;
    const userBmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
    
    if (isToday) {
      // Scale expected minimum calories for the ongoing day
      const ratio = currentHour < 10 ? 0.25 : currentHour < 15 ? 0.55 : currentHour < 21 ? 0.85 : 1.0;
      targetCalThreshold = Math.round(userBmr * 0.55 * ratio);
    } else {
      targetCalThreshold = Math.round(userBmr * 0.6); // Base minimum target intake
    }
  } else {
    // If profile is incomplete, use hour-scaled defaults for today
    if (isToday) {
      const ratio = currentHour < 10 ? 0.25 : currentHour < 15 ? 0.55 : currentHour < 21 ? 0.85 : 1.0;
      targetCalThreshold = Math.round(1200 * ratio);
    }
  }
  if (targetCalThreshold < 300) targetCalThreshold = 300; // safety lower bound

  const totalLogsCount = dayLogs.length;
  const hasLoggedWorkoutFueling = presentMeals.has("pre_workout") || presentMeals.has("post_workout") || presentMeals.has("intra_workout");
  
  const meetsCaloriePlausibility = calories >= targetCalThreshold;
  const hasExpectedMealsLogged = missedExpectedMeals.length === 0;

  // Flexible completeness formulation
  let isComplete = false;
  if (isToday) {
    if (expectedMeals.length === 0) {
      isComplete = totalLogsCount >= 1 || calories > 150;
    } else {
      isComplete = hasExpectedMealsLogged && (meetsCaloriePlausibility || totalLogsCount >= 2 || hasLoggedWorkoutFueling);
    }
  } else {
    isComplete = hasExpectedMealsLogged && (meetsCaloriePlausibility || totalLogsCount >= 3 || (totalLogsCount >= 2 && hasLoggedWorkoutFueling));
  }

  // Calculate confidence based on quality of log
  let confidence = isComplete ? 85 : (dayLogs.length >= 3 ? 65 : 40);
  if (approximatedPortions > 1) confidence -= 15;
  if (recipesWithoutClearPortions > 0) confidence -= 10;
  if (!isProfileComplete) confidence -= 10; // penalty for incomplete profile
  confidence = Math.max(10, confidence);

  const limits: string[] = [];
  if (!isComplete) {
    if (isToday) {
      limits.push("Journée en cours : repères d'apports nutritionnels à compléter au fil des heures.");
    } else {
      limits.push("Saisie alimentaire incomplète ou apports inférieurs au seuil d'activité estimé.");
    }
  }
  if (approximatedPortions > 0) limits.push(`${approximatedPortions} portion(s) évaluée(s) avec une précision incertaine.`);
  if (recipesWithoutClearPortions > 0) limits.push(`${recipesWithoutClearPortions} recette(s) sans portion claire consommée(s).`);
  if (water === 0) limits.push("Hydratation non renseignée.");
  if (!isProfileComplete) limits.push("Calculs basés sur des cibles par défaut : profil de l'athlète incomplet.");

  const missingMeals = (["breakfast", "lunch", "dinner"].filter(m => !presentMeals.has(m as any)) as any[]);

  return {
    date: dateStr,
    totalCalories: calories,
    totalProtein: protein,
    totalCarbs: carbs,
    totalFat: fat,
    totalFiber: Number(totalFiber.toFixed(1)),
    totalSugars: Number(totalSugars.toFixed(1)),
    totalSaturatedFat: Number(totalSaturatedFat.toFixed(1)),
    totalHydrationMl: water,
    sodium: Number(totalSodium.toFixed(0)),
    potassium: Number(totalPotassium.toFixed(0)),
    calcium: Number(totalCalcium.toFixed(0)),
    magnesium: Number(totalMagnesium.toFixed(0)),
    iron: Number(totalIron.toFixed(1)),
    zinc: Number(totalZinc.toFixed(1)),
    vitC: Number(totalVitC.toFixed(1)),
    vitD: Number(totalVitD.toFixed(1)),
    vitB12: Number(totalVitB12.toFixed(2)),
    presentMeals: Array.from(presentMeals) as any,
    missingMeals,
    isComplete,
    confidence,
    limits,
    missingNutrients: Array.from(new Set(missingNutrients)),
    approximatedPortions,
    recipesWithoutClearPortions,
    foodsWithoutSource: missingSourceFoods,
    micronutrients: micronutrientsList
  };
}
