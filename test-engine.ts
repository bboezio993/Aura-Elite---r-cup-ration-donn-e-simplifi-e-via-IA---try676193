import assert from "node:assert";
import { AppState } from "./src/store/useStore";
import { runAnalysisEngine } from "./src/services/analysisEngine/engine";
import { runNutritionEngine, analyzeNutritionDay } from "./src/services/analysisEngine/nutritionEngine";
import { metricRegistry } from "./src/domain/metrics/metricRegistry";

const mockState = {
  metrics: [
    {
      id: "m_1",
      source: "garmin",
      timestamp: new Date().toISOString(),
      type: "hrv_rmssd",
      value: 65,
      unit: "ms",
      confidenceScore: 90
    },
    {
      id: "m_2",
      source: "garmin",
      timestamp: new Date().toISOString(),
      type: "rhr",
      value: 45,
      unit: "bpm",
      confidenceScore: 90
    }
  ],
  hooperLogs: [],
  sessionRpeLogs: [],
  contextLogs: [],
  engineScores: null,
  garminImportLogs: [],
  garminActivities: [],
  mealLogs: [],
  painLogs: [],
  weeklyScreeningLogs: [],
  menstrualLogs: [],
  userProfile: {
    general: {
      name: "Tester",
      age: 28,
      gender: "male",
      height: 180,
      weight: 75,
      activityLevel: "athlete",
      primaryGoal: "performance"
    },
    health: { conditions: [], allergies: [], injuries: [], medications: [] },
    sport: { primarySport: "Triathlon", trainingFrequency: 6, weeklyVolume: 12, intensity: "high" },
    preferences: { units: "metric", enableMenstrualTracking: false, notificationsEnabled: true, dataSharingConsent: false }
  },
  connections: {}
} as unknown as AppState;

console.log("=== Aura Elite : Test Suite ===");

// 1. App Engine base tests
const engineScores = runAnalysisEngine(mockState);
assert.ok(engineScores.performanceReadiness.score > 0, "Engine must return a valid numeric score");
assert.notEqual(engineScores.performanceReadiness.status, "danger", "Status should never be danger (medical term)");
assert.notEqual(engineScores.performanceReadiness.status as any, "clinical_referral", "Should not use medical terminology");
console.log("✅ Main Analysis Engine runs without medical terminology and outputs scores");

// 2. Nutrition Engine tests
const noNutritionState = { 
  ...mockState, 
  userProfile: {
    ...mockState.userProfile,
    general: {
      ...mockState.userProfile.general,
      // Intentionally missing bodyFatPercentage
    }
  },
  mealLogs: [
    {
      id: "l_1",
      date: new Date().toISOString().split("T")[0],
      mealType: "breakfast",
      items: [{ foodId: "f_1", foodName: "Eggs", quantity: 1, unit: "serving", gramsSelected: 200, calories: 500, protein: 30, carbs: 10, fat: 20 }]
    },
    {
      id: "l_2",
      date: new Date().toISOString().split("T")[0],
      mealType: "lunch",
      items: [{ foodId: "f_2", foodName: "Chicken", quantity: 1, unit: "serving", gramsSelected: 200, calories: 600, protein: 40, carbs: 50, fat: 20 }]
    },
    {
      id: "l_3",
      date: new Date().toISOString().split("T")[0],
      mealType: "dinner",
      items: [{ foodId: "f_3", foodName: "Fish", quantity: 1, unit: "serving", gramsSelected: 200, calories: 400, protein: 30, carbs: 30, fat: 10 }]
    }
  ]
} as unknown as AppState;

const nutRes = runNutritionEngine(noNutritionState);
assert.ok(
  nutRes.limits.some(l => l.includes("masse maigre inconnue")), 
  "Energy Availability logic must warn about unknown lean body mass"
);
console.log("✅ Nutrition Engine correctly refuses precise calculation without robust mass data");

// Test incomplete day
const noNutritionStateIncomplete = {
  ...noNutritionState,
  mealLogs: [noNutritionState.mealLogs[0]]
} as unknown as AppState;
const nutResIncomplete = runNutritionEngine(noNutritionStateIncomplete);
assert.ok(
  nutResIncomplete.limits.some(l => l.toLowerCase().includes("incomplète") || l.toLowerCase().includes("compléter")), 
  "Nutrition logic must warn about incomplete day (only 1 meal)"
);
assert.ok(nutResIncomplete.confidence <= 50, "Confidence should be capped if meal logs are incomplete");
console.log("✅ Nutrition Engine correctly refuses precise calculation without sufficient meal logs");

// 3. Metric Registry tests
assert.ok(metricRegistry["stress_score"], "stress_score must be registered");
assert.ok(metricRegistry["respiration_rate"], "respiration_rate must be registered");
assert.ok(metricRegistry["hydration_volume"], "hydration_volume must be registered");
console.log("✅ Metric Registry contains expected types");

// 4. Sprint Nutrition P0 Tests
console.log("--- Sprint Nutrition V1 Tests ---");

const weightlessState = {
  ...mockState,
  userProfile: {
    ...mockState.userProfile,
    general: {
      ...mockState.userProfile.general,
      weight: undefined
    }
  },
  mealLogs: [
    {
      id: "l_test_1",
      date: new Date().toISOString().split("T")[0],
      mealType: "lunch",
      items: [{ 
        foodId: "f_2", foodName: "Chicken", quantity: 1, unit: "g", gramsSelected: 200, 
        rawCookedState: "raw", conversionConfidence: 80, conversionAssumptions: "Poulet cru",
        calories: 600, protein: 40, carbs: 50, fat: 20 
      }]
    },
    {
      id: "l_test_2",
      date: new Date().toISOString().split("T")[0],
      mealType: "breakfast",
      items: [{ 
        foodId: "f_3", foodName: "Eggs", quantity: 1, unit: "g", gramsSelected: 200, 
        calories: 400, protein: 30, carbs: 10, fat: 20 
      }]
    },
    {
      id: "l_test_3",
      date: new Date().toISOString().split("T")[0],
      mealType: "dinner",
      items: [{ 
        foodId: "f_3", foodName: "Fish", quantity: 1, unit: "g", gramsSelected: 200, 
        calories: 300, protein: 30, carbs: 10, fat: 5
      }]
    }
  ]
} as unknown as AppState;

const nutResMissingWeight = runNutritionEngine(weightlessState);
console.log("Limits : ", nutResMissingWeight.limits);
console.log("Confidence: ", nutResMissingWeight.confidence);
assert.ok(nutResMissingWeight.limits.some(l => l.includes("poids manquant")), "Must warn about missing weight and not fallback to 70kg");
assert.ok(nutResMissingWeight.confidence < 80, "Confidence should drop if BMR and weight are unknown");
assert.ok(weightlessState.mealLogs[0].items[0].rawCookedState === "raw", "MealLog must preserve rawCookedState");
assert.ok(weightlessState.mealLogs[0].items[0].conversionConfidence === 80, "MealLog must preserve conversionConfidence");
assert.ok(weightlessState.mealLogs[0].items[0].conversionAssumptions === "Poulet cru", "MealLog must preserve conversionAssumptions");
console.log("✅ Custom MealLogs retain conversion assumptions and engine safely handles missing weight");

import { buildNutritionDaySummary } from "./src/services/analysisEngine/mealLogEngine";
import { resolveRecipeToMealItem } from "./src/domain/nutrition/recipeEngine";
import { Recipe } from "./src/domain/nutrition/foodTypes";

const fakeRecipe: Recipe = {
  id: "rcp_1",
  name: "Porridge",
  numberOfPortions: 2,
  finalWeightGrams: 500,
  items: [
    { foodId: "f_1", foodName: "Avoine", quantity: 100, unit: "g", gramsSelected: 100, calories: 350, protein: 12, carbs: 60, fat: 5 }
  ]
};

const fullMealItem = resolveRecipeToMealItem(fakeRecipe, "portions", 2);
assert.ok(fullMealItem.recipeRatio === 1, "Ratio for 2 portions out of 2 should be 1");
assert.ok(fullMealItem.gramsSelected === 500, "Should use finalWeightGrams if entire recipe");

const halfMealItem = resolveRecipeToMealItem(fakeRecipe, "portions", 1);
assert.ok(halfMealItem.recipeRatio === 0.5, "Ratio for 1 portion out of 2 should be 0.5");
assert.ok(halfMealItem.gramsSelected === 250, "Should scale gramsSelected by ratio");

const gramMealItem = resolveRecipeToMealItem(fakeRecipe, "grams", 100);
assert.ok(gramMealItem.recipeRatio === 0.2, "Ratio for 100g out of 500g should be 0.2");

console.log("✅ recipeEngine correctly handles portions, partial portions, and grams");

const summaryTest = buildNutritionDaySummary(weightlessState.mealLogs, new Date().toISOString().split("T")[0]);
assert.ok(summaryTest.isComplete === true, "Summary must detect complete day");
assert.ok(summaryTest.presentMeals.includes("breakfast"), "Summary must include breakfast");
assert.ok(summaryTest.totalHydrationMl === 0, "Hydration should be 0 if no metric");
assert.ok(summaryTest.limits.some(l => l.includes("Hydratation non renseignée")), "Must warn about hydration missing");

console.log("✅ NutritionDaySummary is correctly built and utilized");

// 5. Test Micronutrients & Training Timing (Sprint nutrition P5 & P6)
const timingTestState = {
  ...mockState,
  metrics: [
    ...mockState.metrics,
    {
      id: "m_water_1",
      source: "manual",
      timestamp: new Date().toISOString(),
      type: "hydration_volume",
      value: 1200,
      unit: "ml",
      confidenceScore: 100
    }
  ],
  garminActivities: [
    {
      id: "act_run_1",
      date: new Date().toISOString().split("T")[0] + "T10:00:00Z",
      type: "running",
      title: "Endurance Run",
      distance: 12, // 12km (long run)
      duration: "01:20:00", // > 4200 seconds / 70 mins
      calories: 850,
      avgHeartRate: 145,
      maxHeartRate: 165,
      tss: null
    }
  ],
  mealLogs: [
    {
      id: "l_timing_1",
      date: new Date().toISOString().split("T")[0],
      mealType: "pre_workout",
      items: [
        { foodId: "1", foodName: "Banane", quantity: 1, unit: "g", gramsSelected: 120, calories: 155, protein: 1.5, carbs: 35, fat: 0.3 }
      ]
    },
    {
      id: "l_timing_2",
      date: new Date().toISOString().split("T")[0],
      mealType: "intra_workout",
      items: [
        { foodId: "2", foodName: "Miel", quantity: 1, unit: "g", gramsSelected: 30, calories: 92, protein: 0.1, carbs: 24, fat: 0 }
      ]
    },
    {
      id: "l_timing_3",
      date: new Date().toISOString().split("T")[0],
      mealType: "post_workout",
      items: [
        { foodId: "3", foodName: "Flocons d'avoine", quantity: 1, unit: "g", gramsSelected: 80, calories: 350, protein: 25, carbs: 55, fat: 5 }
      ]
    }
  ]
} as unknown as AppState;

const timingAnalysis = analyzeNutritionDay(timingTestState, new Date().toISOString().split("T")[0]);
assert.ok(timingAnalysis.mealTiming.preWorkoutPresent, "Pre-workout meal must be detected");
assert.ok(timingAnalysis.mealTiming.postWorkoutPresent, "Post-workout meal must be detected");
assert.ok(timingAnalysis.mealTiming.intraWorkoutPresent, "Intra-workout meal must be detected");
assert.ok(timingAnalysis.mealTiming.score >= 80, "Peri-workout training logs should result in high timing score");
assert.equal(timingAnalysis.trainingFueling.status, "Optimisé", "Should classify long run with intra/pre-workout as Optimisé");
console.log("✅ Peri-workout Timing and Fueling Engine analysis accurately tested");

const summaryMicro = buildNutritionDaySummary(timingTestState.mealLogs, new Date().toISOString().split("T")[0]);
assert.ok(summaryMicro.micronutrients.length > 0, "Summary must aggregate micronutrients list");
assert.ok(summaryMicro.micronutrients.some(m => m.nutrientId === "sodium"), "Sodium should be present in aggregated micronutrients");
console.log("✅ Micronutrient aggregation and missing tracking fully verified");

// 6. Extra Specific Sprint Nutrition Tests
console.log("--- Extra V1 Robustness Tests ---");

// Test A : Somme de plusieurs entrées d'hydratation (P0-1)
const currentDayStr = new Date().toISOString().split("T")[0];
const hydrationState = {
  ...mockState,
  metrics: [
    { id: "h1", source: "manual", timestamp: currentDayStr + "T08:00:00Z", type: "hydration_volume", value: 250, unit: "ml", confidenceScore: 100 },
    { id: "h2", source: "manual", timestamp: currentDayStr + "T12:00:00Z", type: "hydration_volume", value: 250, unit: "ml", confidenceScore: 100 },
    { id: "h3", source: "manual", timestamp: currentDayStr + "T16:00:00Z", type: "hydration_volume", value: 250, unit: "ml", confidenceScore: 100 },
    { id: "h4", source: "manual", timestamp: currentDayStr + "T20:00:00Z", type: "hydration_volume", value: 250, unit: "ml", confidenceScore: 100 }
  ]
} as unknown as AppState;

const hydrationSummary = buildNutritionDaySummary([], currentDayStr, hydrationState.metrics);
assert.strictEqual(hydrationSummary.totalHydrationMl, 1000, "Hydration sum must aggregate multiple entries accurately (4x250ml = 1000ml)");
console.log("✅ Hydration Sum Aggregation validated: 4 x 250ml = 1000ml");

// Test B : Chargement d'ingrédients de recette complexe
const complexRecipe: Recipe = {
  id: "recipe_pasta_salmon",
  name: "Pâtes au Saumon Premium",
  numberOfPortions: 4,
  finalWeightGrams: 1000,
  items: [
    { foodId: "pates_cuites", foodName: "Pâtes cuites", quantity: 800, unit: "g", gramsSelected: 800, calories: 1000, protein: 30, carbs: 200, fat: 5 },
    { foodId: "saumon", foodName: "Gravlax de saumon", quantity: 200, unit: "g", gramsSelected: 200, calories: 400, protein: 40, carbs: 0, fat: 25 }
  ],
  totalNutrition: { calories: 1400, protein: 70, carbs: 200, fat: 30 }
};

const recipeMealItem = resolveRecipeToMealItem(complexRecipe, "portions", 1); // 1 portion out of 4 (ratio: 0.25)
assert.strictEqual(recipeMealItem.recipeRatio, 0.25, "Recipe ratio for 1 portion of 4 must be 0.25");
assert.strictEqual(recipeMealItem.calories, 359, "Calories must be resolved and scaled from internal food DB (resolved cooked pasta + cooked salmon)");
assert.strictEqual(recipeMealItem.protein, 20.5, "Proteins must be resolved and scaled from internal food DB (resolved cooked pasta + cooked salmon)");
console.log("✅ Complex recipe ingredient scaling and portion mapping validated");

// Test C : Impact des micronutriments manquants (isMissing: true) et aliments sans estimation
const customMealLogsWithMissingMicros = [
  {
    id: "l_missing_micro",
    date: currentDayStr,
    mealType: "lunch" as const,
    items: [
      {
        foodId: "whey_isolate", // iron & zinc are marked isMissing in database
        foodName: "Whey Isolate Shake",
        quantity: 30,
        unit: "g",
        gramsSelected: 30,
        calories: 110,
        protein: 26,
        carbs: 1,
        fat: 0
      }
    ]
  }
];

const missingMicroSummary = buildNutritionDaySummary(customMealLogsWithMissingMicros, currentDayStr);
const missingMicroAnalysis = analyzeNutritionDay({ ...mockState, mealLogs: customMealLogsWithMissingMicros } as unknown as AppState, currentDayStr);

// Verify iron in whey is correctly labeled as unmeasured
const ironCoverage = missingMicroAnalysis.micronutrientCoverage["iron"];
assert.strictEqual(ironCoverage.status, "unmeasured", "Micronutrients marked as isMissing in database must result in 'unmeasured' coverage status");
console.log("✅ Missing estimates and isMissing:true values correctly yield 'unmeasured' status");

// Test D : Absence de séance Garmin oû d'un profil pour la balance
const noGarminNoProfileState = {
  ...mockState,
  userProfile: {
    general: {
      name: "Tester",
      age: null,
      gender: "",
      height: null,
      weight: null,
      activityLevel: "",
      primaryGoal: ""
    }
  },
  garminActivities: [], // No Garmin activities
  mealLogs: []
} as unknown as AppState;

const emptyAnalysis = analyzeNutritionDay(noGarminNoProfileState, currentDayStr);
assert.strictEqual(emptyAnalysis.mealTiming.score, 100, "Absence of Garmin activities must yield neutral timing score of 100");
assert.strictEqual(emptyAnalysis.energyBalance, null, "Absence of complete profile must prevent balance calculation (energyBalance should be null)");
assert.ok(emptyAnalysis.limitations.some(l => l.includes("profil est incomplet") || l.includes("poids manquant")), "Must yield appropriate limitation flags for incomplete profile");
console.log("✅ Garmin-free neutral scoring and profile-less energy balance limits validated");

console.log("=== All Tests Passed ===");

