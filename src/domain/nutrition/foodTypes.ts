export interface NutrientDefinition {
  id: string;
  name: string;
  unit: "g" | "mg" | "mcg" | "kcal" | "IU" | string;
  category: "macro" | "micro_mineral" | "micro_vitamin" | "other";
}

export interface FoodNutrientValue {
  nutrientId: string;
  valuePer100g?: number;
  unit: string;
  isMissing: boolean;
  confidence: number;
  source?: string;
  missingReason?: "unknown" | "not_applicable" | "trace" | "not_measured";
}

export interface FoodItem {
  id: string;
  source: "ciqual" | "usda_fdc" | "user" | "internal";
  sourceFoodId?: string;
  sourceVersion?: string;
  sourceName?: string;
  importDate?: string;
  name: string;
  normalizedName: string;
  brand?: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  locale: "fr" | "en" | "multi";
  defaultUnit: "g" | "ml" | "piece" | "serving";
  ediblePortionFactor?: number;
  densityGPerMl?: number;
  rawCookedState?: "raw" | "cooked" | "prepared" | "unknown";
  confidence: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Base macros (for quick computation)
  calories: number; // kcal
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber?: number; // g
  sugars?: number; // g
  saturatedFat?: number; // g
  sodium?: number; // mg
  
  // Extended micronutrients
  micronutrients?: FoodNutrientValue[];
}

export interface ServingUnit {
  id: string;
  foodId?: string;
  label: string;
  gramsEquivalent?: number;
  mlEquivalent?: number;
  unitType: "mass" | "volume" | "piece" | "household" | "serving";
  confidence: number;
  assumptions?: string;
}

export interface MealItem {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: "g" | "ml" | "piece" | "serving" | string;
  gramsSelected: number;
  conversionConfidence?: number;
  conversionAssumptions?: string;
  
  sourceFoodId?: string;
  nutritionVersion?: string;
  missingNutrients?: string[];

  sourceType?: "food" | "recipe";
  recipeId?: string;
  recipeServingCount?: number;
  recipeServingWeightGrams?: number;
  recipeRatio?: number;
  expandedIngredients?: RecipeIngredient[];

  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  rawCookedState?: "raw" | "cooked" | "prepared" | "unknown";
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "intra_workout" | "post_workout";
  items: MealItem[];
  photoIds?: string[];
  hungerBefore?: number; // 1-5
  satietyAfter?: number; // 1-5
  digestionAfter?: number; // 1-5
  notes?: string;
}

export interface RecipeIngredient {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  gramsSelected: number;
  conversionConfidence?: number;
  conversionAssumptions?: string;
  rawCookedState?: "raw" | "cooked" | "prepared" | "unknown";
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  items: RecipeIngredient[];
  finalWeightGrams?: number;
  numberOfPortions?: number;
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  nutritionPerPortion?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  createdAt?: string;
  nutritionVersion?: string;
}

export interface NutritionDaySummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugars: number;
  totalSaturatedFat: number;
  totalHydrationMl: number;
  
  sodium: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  iron: number;
  zinc: number;
  vitC: number;
  vitD: number;
  vitB12: number;

  presentMeals: ("breakfast" | "lunch" | "dinner" | "snack" | "pre_workout" | "intra_workout" | "post_workout")[];
  missingMeals: ("breakfast" | "lunch" | "dinner")[];
  
  isComplete: boolean;
  confidence: number;
  limits: string[];
  missingNutrients: string[];
  
  approximatedPortions: number;
  recipesWithoutClearPortions: number;
  foodsWithoutSource: number;
  micronutrients: any[];
}

export interface CookingYieldFactor {
  foodId?: string;
  category?: string;
  fromState: "raw" | "cooked";
  toState: "raw" | "cooked";
  factor: number; // weight multiplier: raw * factor = cooked
  confidence: number;
  note: string;
}

export interface MealTimingAnalysis {
  score: number;
  notes: string[];
  preWorkoutPresent: boolean;
  postWorkoutPresent: boolean;
  intraWorkoutPresent: boolean;
  hasSufficientCarbsBeforeLongRun: boolean;
  hasSufficientProteinPostWorkout: boolean;
}

export interface MicronutrientCoverageValue {
  value: number;
  unit: string;
  ratio?: number;
  status: "met" | "low" | "unmeasured";
}

export interface NutritionAnalysisResult {
  date: string;
  energyIntakeKcal: number;
  estimatedExpenditureKcal: number | null;
  energyBalance: number | null;
  proteinTotalG: number;
  proteinGPerKg: number | null;
  carbsTotalG: number;
  carbsGPerKg: number | null;
  fatTotalG: number;
  fiberG: number;
  hydrationMl: number;
  micronutrientCoverage: Record<string, MicronutrientCoverageValue>;
  mealTiming: MealTimingAnalysis;
  trainingFueling: {
    score: number;
    status: string;
    notes: string[];
  };
  energyAvailability: number | null;
  confidence: number;
  limitations: string[];
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    hydration: number;
    sodium: number;
    objective: string;
    targetStatuses?: {
      calories: "manual" | "estimated_from_profile" | "generic_placeholder" | "undefined";
      protein: "manual" | "estimated_from_profile" | "generic_placeholder" | "undefined";
      carbs: "manual" | "estimated_from_profile" | "generic_placeholder" | "undefined";
      fat: "manual" | "estimated_from_profile" | "generic_placeholder" | "undefined";
      hydration: "manual" | "estimated_from_profile" | "generic_placeholder" | "undefined";
      sodium: "manual" | "estimated_from_profile" | "generic_placeholder" | "undefined";
    };
  };
}

export interface NutritionGoal {
  calories: { value: number; isUserDefined: boolean };
  proteinGPerKg: { value: number; isUserDefined: boolean };
  carbsGPerKg: { value: number; isUserDefined: boolean };
  fat: { value: number; isUserDefined: boolean };
  fiber: { value: number; isUserDefined: boolean };
  hydration: { value: number; isUserDefined: boolean };
  sodium: { value: number; isUserDefined: boolean };
  objective: "maintenance" | "performance" | "recovery" | "recomposition" | "other";
  updatedAt?: string;
  source?: string;
}


