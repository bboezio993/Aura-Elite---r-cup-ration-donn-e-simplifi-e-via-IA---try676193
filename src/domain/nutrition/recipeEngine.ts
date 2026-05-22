import { Recipe, MealItem } from "./foodTypes";
import { internalFoodDatabase } from "./foodDatabase";

export function resolveRecipeToMealItem(
  recipe: Recipe,
  mode: "portions" | "grams" | "entire",
  portionsOrGrams: number
): MealItem {
  let ratio = 1;
  let label = "Recette entière";
  let servingGrams = recipe.finalWeightGrams || 0;
  
  if (mode === "portions") {
    ratio = portionsOrGrams / (recipe.numberOfPortions || 1);
    label = `${portionsOrGrams} portion(s)`;
    if (servingGrams > 0) servingGrams = servingGrams * ratio;
  } else if (mode === "grams") {
    if (recipe.finalWeightGrams && recipe.finalWeightGrams > 0) {
      ratio = portionsOrGrams / recipe.finalWeightGrams;
      label = `${portionsOrGrams}g servis`;
      servingGrams = portionsOrGrams;
    } else {
      ratio = 1;
      label = "Grammes (poids final inconnu, base 100%)";
    }
  }

  const resolvedCalories = recipe.items.reduce((acc, it) => {
    const dbFood = internalFoodDatabase.find(f => f.id === it.foodId);
    const scaledGrams = it.gramsSelected * ratio;
    return acc + (dbFood ? Math.round(dbFood.calories * (scaledGrams / 100)) : 0);
  }, 0);
  
  const resolvedProtein = recipe.items.reduce((acc, it) => {
    const dbFood = internalFoodDatabase.find(f => f.id === it.foodId);
    const scaledGrams = it.gramsSelected * ratio;
    return acc + (dbFood ? Number((dbFood.protein * (scaledGrams / 100)).toFixed(1)) : 0);
  }, 0);
  
  const resolvedCarbs = recipe.items.reduce((acc, it) => {
    const dbFood = internalFoodDatabase.find(f => f.id === it.foodId);
    const scaledGrams = it.gramsSelected * ratio;
    return acc + (dbFood ? Number((dbFood.carbs * (scaledGrams / 100)).toFixed(1)) : 0);
  }, 0);
  
  const resolvedFat = recipe.items.reduce((acc, it) => {
    const dbFood = internalFoodDatabase.find(f => f.id === it.foodId);
    const scaledGrams = it.gramsSelected * ratio;
    return acc + (dbFood ? Number((dbFood.fat * (scaledGrams / 100)).toFixed(1)) : 0);
  }, 0);

  return {
    foodId: recipe.id,
    foodName: `${recipe.name} (${label})`,
    quantity: portionsOrGrams,
    unit: mode === "portions" ? "portion(s)" : "g",
    gramsSelected: servingGrams,
    sourceType: "recipe" as const,
    recipeId: recipe.id,
    recipeServingCount: mode === "portions" ? portionsOrGrams : undefined,
    recipeServingWeightGrams: servingGrams > 0 ? servingGrams : undefined,
    recipeRatio: ratio,
    expandedIngredients: recipe.items,
    calories: resolvedCalories,
    protein: Number(resolvedProtein.toFixed(1)),
    carbs: Number(resolvedCarbs.toFixed(1)),
    fat: Number(resolvedFat.toFixed(1))
  };
}
