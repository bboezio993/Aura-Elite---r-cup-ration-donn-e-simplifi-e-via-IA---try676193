import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { internalFoodDatabase, servingUnits, convertPortionToGrams, internalRecipes } from '../../domain/nutrition/foodDatabase';
import { resolveRecipeToMealItem } from '../../domain/nutrition/recipeEngine';
import { foodNutrientDatabase } from '../../domain/nutrition/foodNutrientValues';
import { CoreNutrients } from '../../domain/nutrition/nutrientDefinitions';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, Search, ChevronRight, Apple, Flame, Award, AlertTriangle, Clipboard, BookOpen, Heart } from 'lucide-react';
import { MealItem, MealLog, Recipe } from '../../types';

const frequentMealPresets = [
  {
    name: "Porridge Énergie Élite ⚡",
    description: "Flocons d'avoine brute cuits, pomme fraîche croquante et isolat de whey protéine.",
    calories: 618,
    mealType: "breakfast",
    items: [
      { foodId: "flocons_avoine", foodName: "Flocons d'avoine brute", quantity: 100, unit: "g", gramsSelected: 100 },
      { foodId: "pomme", foodName: "Pomme crue avec peau", quantity: 1, unit: "piece", gramsSelected: 150 },
      { foodId: "whey_isolate", foodName: "Isolat de protéine (Whey Isolate)", quantity: 1, unit: "piece", gramsSelected: 30 }
    ]
  },
  {
    name: "Assiette Volaille Métabolique 🔄",
    description: "Blanc de poulet tendre cuit, portion de riz blanc cuit avec filet d'huile d'olive de qualité.",
    calories: 574,
    mealType: "lunch",
    items: [
      { foodId: "poulet_blanc", foodName: "Blanc de poulet cuit", quantity: 150, unit: "g", gramsSelected: 150 },
      { foodId: "riz_cuit", foodName: "Riz blanc cuit", quantity: 200, unit: "g", gramsSelected: 200 },
      { foodId: "huile_olive", foodName: "Huile d'olive extra vierge", quantity: 15, unit: "ml", gramsSelected: 13.7 }
    ]
  },
  {
    name: "Shaker d'Effort Post-Course 🥛",
    description: "Isolat de whey protéine ultra-pur mélangé à une banane pour reconstituer le glycogène.",
    calories: 215,
    mealType: "post_workout",
    items: [
      { foodId: "whey_isolate", foodName: "Isolat de protéine (Whey Isolate)", quantity: 1, unit: "piece", gramsSelected: 30 },
      { foodId: "banane", foodName: "Banane fraîche", quantity: 1, unit: "piece", gramsSelected: 118 }
    ]
  }
];

export function NutritionLogger() {
  const addMealLog = useStore(state => state.addMealLog);
  const storeRecipes = useStore(state => state.recipes) || [];
  const addRecipeToStore = useStore(state => state.addRecipe);
  const deleteRecipeFromStore = useStore(state => state.deleteRecipe);
  const addAllergenBypassLog = useStore(state => state.addAllergenBypassLog);
  const userProfile = useStore(state => state.userProfile);
  const updateUserProfile = useStore(state => state.updateUserProfile);

  const favoriteFoodIds = userProfile?.favoriteFoodIds || [];
  const favoriteRecipeIds = userProfile?.favoriteRecipeIds || [];

  const toggleFavoriteFood = (foodId: string) => {
    let updated: string[];
    if (favoriteFoodIds.includes(foodId)) {
      updated = favoriteFoodIds.filter(id => id !== foodId);
    } else {
      updated = [...favoriteFoodIds, foodId];
    }
    updateUserProfile({ favoriteFoodIds: updated });
  };

  const toggleFavoriteRecipe = (recipeId: string) => {
    let updated: string[];
    if (favoriteRecipeIds.includes(recipeId)) {
      updated = favoriteRecipeIds.filter(id => id !== recipeId);
    } else {
      updated = [...favoriteRecipeIds, recipeId];
    }
    updateUserProfile({ favoriteRecipeIds: updated });
  };

  const [mealType, setMealType] = useState<MealLog['mealType']>('breakfast');
  const [search, setSearch] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('g');
  const [mealItemRawCooked, setMealItemRawCooked] = useState<"raw" | "cooked">("raw");
  
  // Interactive Tab Selection
  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes' | 'favorites'>('ingredients');

  // Custom Recipe Creator states
  const [showRecipeCreator, setShowRecipeCreator] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeNumberOfPortions, setRecipeNumberOfPortions] = useState<number>(1);
  const [recipeWeightGrams, setRecipeWeightGrams] = useState<number>(0);
  const [recipeSaveSuccess, setRecipeSaveSuccess] = useState(false);

  // Allergies
  const userAllergies = userProfile?.health?.allergies || [];
  const [bypassAllergenFoodId, setBypassAllergenFoodId] = useState<string | null>(null);

  // Temporary list of items in the current meal being composed
  const [items, setItems] = useState<Array<{
    foodId: string;
    foodName: string;
    quantity: number;
    unit: string;
    gramsSelected: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>>([]);

  const [notes, setNotes] = useState('');
  const [hungerBefore, setHungerBefore] = useState(3);
  const [satietyAfter, setSatietyAfter] = useState(3);
  const [digestionAfter, setDigestionAfter] = useState(3);
  const [success, setSuccess] = useState(false);

  const isAllergic = (foodName: string) => {
    const nameLower = foodName.toLowerCase();
    for (const allergy of userAllergies) {
      const aLower = allergy.toLowerCase().trim();
      if (!aLower) continue;
      
      // Gluten
      if (aLower === "gluten" && (nameLower.includes("pâte") || nameLower.includes("pates") || nameLower.includes("avoine") || nameLower.includes("farine") || nameLower.includes("pain") || nameLower.includes("blé") || nameLower.includes("orge"))) {
        return "Gluten";
      }
      // Lactose
      if (aLower === "lactose" && (nameLower.includes("whey") || nameLower.includes("lait") || nameLower.includes("fromage") || nameLower.includes("yaourt") || nameLower.includes("crème") || nameLower.includes("creme") || nameLower.includes("beurre"))) {
        return "Lactose (Produits laitiers)";
      }
      // Eggs
      if (aLower === "oeufs" || aLower === "oeuf" || aLower === "œuf" || aLower === "œufs") {
        if (nameLower.includes("oeuf") || nameLower.includes("œuf")) {
          return "Œuf de poule";
        }
      }
      // Fish
      if (aLower === "poisson" && (nameLower.includes("saumon") || nameLower.includes("poisson") || nameLower.includes("cabillaud") || nameLower.includes("thon") || nameLower.includes("sardine"))) {
        return "Poisson";
      }
      // Nuts
      if ((aLower === "arachide" || aLower === "arachides" || aLower === "noix" || aLower === "amandes") && (nameLower.includes("amande") || nameLower.includes("noix") || nameLower.includes("cacahuète") || nameLower.includes("noisette") || nameLower.includes("beurre de cacahuète") || nameLower.includes("arachide"))) {
        return "Arachides / Fruits à coque";
      }
      if (nameLower.includes(aLower)) {
        return allergy;
      }
    }
    return null;
  };

  const handleBypassAllergen = (food: typeof internalFoodDatabase[0], allergen: string) => {
    addAllergenBypassLog({
      id: `bypass_${Date.now()}`,
      date: new Date().toISOString(),
      foodId: food.id,
      foodName: food.name,
      allergenDetected: allergen,
      mealType,
      userConfirmed: true
    });
    setBypassAllergenFoodId(food.id);
  };

  const handleCreateRecipe = () => {
    if (!recipeName || items.length === 0) return;
    
    const maxConfidence = 100;
    const nutritionTotal = items.reduce((acc, it) => ({
      calories: acc.calories + (it.calories || 0),
      protein: acc.protein + (it.protein || 0),
      carbs: acc.carbs + (it.carbs || 0),
      fat: acc.fat + (it.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const totalRawGrams = items.reduce((acc, it) => acc + (it.gramsSelected || 0), 0);
    const resolvedFinalWeight = recipeWeightGrams > 0 ? recipeWeightGrams : totalRawGrams;
    const portions = recipeNumberOfPortions > 0 ? recipeNumberOfPortions : 1;

    const newRecipe: Recipe = {
      id: `recipe_${Date.now()}`,
      name: recipeName,
      description: recipeDescription || "Mélange personnalisé de récupération",
      finalWeightGrams: resolvedFinalWeight,
      numberOfPortions: portions,
      totalNutrition: nutritionTotal,
      nutritionPerPortion: {
        calories: Number((nutritionTotal.calories / portions).toFixed(0)),
        protein: Number((nutritionTotal.protein / portions).toFixed(1)),
        carbs: Number((nutritionTotal.carbs / portions).toFixed(1)),
        fat: Number((nutritionTotal.fat / portions).toFixed(1))
      },
      createdAt: new Date().toISOString(),
      nutritionVersion: "1.0",
      items: items.map(it => ({
        foodId: it.foodId,
        foodName: it.foodName,
        quantity: it.quantity,
        unit: it.unit,
        gramsSelected: it.gramsSelected,
        rawCookedState: it.rawCookedState,
        conversionConfidence: it.conversionConfidence,
        conversionAssumptions: it.conversionAssumptions,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat
      }))
    };
    addRecipeToStore(newRecipe);
    setRecipeName('');
    setRecipeDescription('');
    setRecipeNumberOfPortions(1);
    setRecipeWeightGrams(0);
    setShowRecipeCreator(false);
    setRecipeSaveSuccess(true);
    setTimeout(() => setRecipeSaveSuccess(false), 3000);
  };

  const [importingRecipe, setImportingRecipe] = useState<Recipe | null>(null);
  const [importRecipePortions, setImportRecipePortions] = useState<number>(1);
  const [importRecipeMode, setImportRecipeMode] = useState<"portions" | "grams" | "entire">("portions");
  const [importRecipeGrams, setImportRecipeGrams] = useState<number>(0);

  const handleConfirmImportRecipe = () => {
    if (!importingRecipe) return;

    const value = importRecipeMode === "portions" ? importRecipePortions : importRecipeGrams;
    const recipeItem = resolveRecipeToMealItem(importingRecipe, importRecipeMode, value);

    setItems([...items, recipeItem]);
    setImportingRecipe(null);
  };

  // Search filter
  const foundFoods = internalFoodDatabase.filter(food => 
    food.name.toLowerCase().includes(search.toLowerCase()) ||
    food.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedFood = internalFoodDatabase.find(f => f.id === selectedFoodId);
  const relatedUnits = selectedFoodId ? servingUnits.filter(su => su.foodId === selectedFoodId) : [];

  const handleSelectFood = (foodId: string) => {
    setSelectedFoodId(foodId);
    setSearch('');
    // reset unit & quantity back to defaults
    const food = internalFoodDatabase.find(f => f.id === foodId);
    if (food) {
      setUnit(food.defaultUnit);
      setQuantity(food.defaultUnit === 'piece' ? 1 : 100);
    }
  };

  const handleAddItemToMeal = () => {
    if (!selectedFood) return;

    // Convert portion to grams
    const { grams, confidence, assumptions } = convertPortionToGrams(selectedFood.id, quantity, unit);

    // Calculate nutritional breakdown per 100g base
    const factor = grams / 100;
    const calories = Math.round(selectedFood.calories * factor);
    const protein = Number((selectedFood.protein * factor).toFixed(1));
    const carbs = Number((selectedFood.carbs * factor).toFixed(1));
    const fat = Number((selectedFood.fat * factor).toFixed(1));

    setItems([...items, {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      quantity,
      unit,
      gramsSelected: grams,
      rawCookedState: unit === 'g' ? mealItemRawCooked : undefined,
      conversionConfidence: confidence,
      conversionAssumptions: assumptions.join('; '),
      calories,
      protein,
      carbs,
      fat
    }]);

    // reset selection
    setSelectedFoodId('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSaveMealLog = () => {
    if (items.length === 0) return;

    const newLog: MealLog = {
      id: `meal_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      mealType,
      items: items.map(it => ({
        foodId: it.foodId,
        foodName: it.foodName,
        quantity: it.quantity,
        unit: it.unit,
        gramsSelected: it.gramsSelected,
        rawCookedState: it.rawCookedState,
        conversionConfidence: it.conversionConfidence,
        conversionAssumptions: it.conversionAssumptions,
        sourceType: it.sourceType,
        recipeId: it.recipeId,
        recipeServingCount: it.recipeServingCount,
        recipeServingWeightGrams: it.recipeServingWeightGrams,
        recipeRatio: it.recipeRatio,
        expandedIngredients: it.expandedIngredients,
        nutritionVersion: it.nutritionVersion,
        missingNutrients: it.missingNutrients,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat
      })),
      hungerBefore,
      satietyAfter,
      digestionAfter,
      notes
    };

    addMealLog(newLog);

    setItems([]);
    setNotes('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  // Calculate total macros currently composed
  const composedCalories = items.reduce((acc, i) => acc + i.calories, 0);
  const composedProtein = items.reduce((acc, i) => acc + i.protein, 0);
  const composedCarbs = items.reduce((acc, i) => acc + i.carbs, 0);
  const composedFat = items.reduce((acc, i) => acc + i.fat, 0);

  return (
    <div className="space-y-6">
      <div className="border-b pb-3 border-border">
        <h4 className="font-bold text-base flex items-center gap-2">
          <Apple className="text-emerald-500" size={18} />
          Saisie Nutritionnelle de Précision
        </h4>
        <p className="text-xs text-muted-foreground">Recherchez vos aliments pour composer un repas et évaluer les apports macro-nutritionnels.</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
          <Check size={16} />
          Repas enregistré avec succès et intégré au Moteur Physiologique !
        </div>
      )}

      {recipeSaveSuccess && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2">
          <Check size={16} />
          Recette enregistrée avec succès dans votre base d'athlète !
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search, Selections & Recipes catalog */}
        <div className="lg:col-span-7 space-y-4 border-r border-border/60 pr-0 lg:pr-6">
          {/* Selection tabs */}
          <div className="flex border-b border-border/80">
            <button
              onClick={() => { setActiveTab('ingredients'); setSelectedFoodId(''); }}
              type="button"
              className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === 'ingredients' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Apple size={14} />
                Ingrédients
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('recipes'); setSelectedFoodId(''); }}
              type="button"
              className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === 'recipes' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <BookOpen size={14} />
                Recettes ({internalRecipes.length + storeRecipes.length})
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('favorites'); setSelectedFoodId(''); }}
              type="button"
              className={`flex-1 pb-2 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === 'favorites' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Heart size={14} className="text-red-500 fill-red-500" />
                Saisie Rapide & Favoris
              </span>
            </button>
          </div>

          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as any)}
                  className="text-xs font-bold rounded-lg border border-border bg-secondary/35 p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="breakfast">Petit-Déjeuner 🍳</option>
                  <option value="lunch">Déjeuner 🥗</option>
                  <option value="dinner">Dîner 🍲</option>
                  <option value="snack">Collation 🍎</option>
                  <option value="pre_workout">Pré-Workout ⚡</option>
                  <option value="intra_workout">Intra-Workout 💧</option>
                  <option value="post_workout">Post-Workout 🥛</option>
                </select>

                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher banane, riz, poulet, whey..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs rounded-lg border border-border bg-background py-2 pl-9 pr-4 focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {search && (
                <div className="border rounded-xl border-border bg-background shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-1 z-35 relative">
                  {foundFoods.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground text-center">Aucun aliment correspondant trouvé.</div>
                  ) : (
                    foundFoods.map(f => {
                      const allergen = isAllergic(f.name);
                      const isFav = favoriteFoodIds.includes(f.id);
                      return (
                        <div
                          key={f.id}
                          className={`w-full p-1.5 hover:bg-secondary/35 rounded-xl text-xs flex justify-between items-center transition-all border border-transparent hover:border-border/40 ${
                            allergen ? 'border-l-2 border-red-500 pl-3 bg-red-500/5' : ''
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectFood(f.id);
                              setBypassAllergenFoodId(null);
                            }}
                            className="flex-1 text-left"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{f.name}</span>
                                {allergen && (
                                  <Badge variant="outline" className="border-red-500/20 text-red-500 text-[8px] font-bold px-1.5">
                                    ⚠️ Allergène : {allergen}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground block">{f.category}</span>
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge variant="secondary" className="font-mono text-[9px]">{f.calories} kcal/100g</Badge>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteFood(f.id);
                              }}
                              className={`p-1 rounded-lg hover:bg-red-500/10 transition-colors ${
                                isFav ? 'text-red-500 font-bold' : 'text-muted-foreground hover:text-red-500'
                              }`}
                              title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                            >
                              <Heart size={13} className={isFav ? "fill-current text-red-400" : ""} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="space-y-4">
              <p className="text-[11px] text-muted-foreground">
                Sélectionnez une formule pré-enregistrée ou créée par vos soins pour configurer rapidement des groupes d'aliments.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {[...internalRecipes, ...storeRecipes].map((rcp) => {
                  const containedAllergens = rcp.items
                    .map(it => isAllergic(it.foodName))
                    .filter((allergen): allergen is string => allergen !== null);

                  const uniqueAllergens = Array.from(new Set(containedAllergens));

                  const totCals = rcp.items.reduce((sum, item) => {
                    const dbFood = internalFoodDatabase.find(f => f.id === item.foodId);
                    return sum + (dbFood ? Math.round(dbFood.calories * (item.gramsSelected / 100)) : 0);
                  }, 0);
                  const totProts = rcp.items.reduce((sum, item) => {
                    const dbFood = internalFoodDatabase.find(f => f.id === item.foodId);
                    return sum + (dbFood ? Number((dbFood.protein * (item.gramsSelected / 100)).toFixed(1)) : 0);
                  }, 0);

                  return (
                    <div 
                      key={rcp.id}
                      className={`p-3 border rounded-xl flex flex-col justify-between h-44 bg-background transition-all hover:border-indigo-500/40 relative ${
                        uniqueAllergens.length > 0 ? 'border-red-500/20 bg-red-500/[0.01]' : 'border-border'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h6 className="font-bold text-xs leading-none mt-0.5">{rcp.name}</h6>
                          {storeRecipes.some(r => r.id === rcp.id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteRecipeFromStore(rcp.id);
                              }}
                              type="button"
                              className="text-red-500 hover:bg-red-500/10 p-1 rounded shrink-0"
                              title="Supprimer cette recette personnalisée"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        {rcp.description && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-tight">
                            {rcp.description}
                          </p>
                        )}
                        {uniqueAllergens.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1 p-1 bg-red-500/5 rounded-md border border-red-500/10">
                            <AlertTriangle size={10} className="text-red-500 shrink-0" />
                            <span className="text-[9px] font-semibold text-red-500 truncate">
                              Allergie : {uniqueAllergens.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-2 mt-2 flex justify-between items-center">
                        <div className="text-[9px] font-mono text-muted-foreground">
                          <span className="font-bold text-foreground">{totCals} kcal</span> • {Math.round(totProts)}g prot
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setImportingRecipe(rcp);
                            setImportRecipeMode("portions");
                            setImportRecipePortions(1);
                            setImportRecipeGrams(rcp.finalWeightGrams || 0);
                          }}
                          disabled={uniqueAllergens.length > 0}
                          className={`text-[10px] h-7 px-2.5 rounded-lg py-1 font-semibold ${
                            uniqueAllergens.length > 0
                              ? 'bg-secondary text-muted-foreground cursor-not-allowed border-none'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          Importer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {importingRecipe && (
                <div className="p-4 mt-4 border rounded-2xl bg-indigo-50/50 border-indigo-500/20 space-y-4">
                  <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2">
                    <h5 className="font-bold text-xs text-indigo-700 uppercase tracking-wide">Importer : {importingRecipe.name}</h5>
                    <button onClick={() => setImportingRecipe(null)} className="text-muted-foreground hover:text-foreground">
                      X
                    </button>
                  </div>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-indigo-900">
                      <input type="radio" value="portions" checked={importRecipeMode === 'portions'} onChange={() => setImportRecipeMode('portions')} className="accent-indigo-600" />
                      Par Portion
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-indigo-900">
                      <input type="radio" value="grams" checked={importRecipeMode === 'grams'} onChange={() => setImportRecipeMode('grams')} className="accent-indigo-600" />
                      Par Grammes
                    </label>
                  </div>

                  {importRecipeMode === 'portions' ? (
                    <div>
                      <label className="text-[10px] font-bold block text-indigo-900/70 mb-1">Nombre de portions (Recette originale : {importingRecipe.numberOfPortions || 1})</label>
                      <input
                        type="number" step="0.1"
                        value={importRecipePortions}
                        onChange={(e) => setImportRecipePortions(Number(e.target.value))}
                        className="w-full text-xs rounded-lg border border-indigo-200 text-foreground p-2 font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold block text-indigo-900/70 mb-1">
                        Grammes consommés (Recette totale : {importingRecipe.finalWeightGrams ? importingRecipe.finalWeightGrams + 'g' : 'Inconnu'})
                      </label>
                      <input
                        type="number"
                        value={importRecipeGrams}
                        onChange={(e) => setImportRecipeGrams(Number(e.target.value))}
                        className="w-full text-xs rounded-lg border border-indigo-200 text-foreground p-2 font-mono"
                      />
                    </div>
                  )}

                  <Button onClick={handleConfirmImportRecipe} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 mt-2">
                    Confirmer l'Import
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <div>
                <h5 className="text-xs font-bold uppercase text-foreground mb-1">⚡ Saisie Immédiate (&lt; 10 sec)</h5>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Ajoutez un repas d’effort ou une formule métabolique type en un clic pour maintenir la régularité sans effort.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {frequentMealPresets.map((preset, idx) => (
                    <div key={idx} className="p-3.5 border border-border bg-gradient-to-br from-emerald-500/[0.02] to-secondary/35 rounded-2xl flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[9px] uppercase font-black text-emerald-500 font-mono tracking-wider">{preset.mealType === 'breakfast' ? 'Matin 🍳' : preset.mealType === 'lunch' ? 'Midi 🥗' : preset.mealType === 'post_workout' ? 'Récupération 🥛' : 'Collation 🍎'}</span>
                        <h6 className="font-bold text-xs text-foreground mt-0.5">{preset.name}</h6>
                        <p className="text-[10.5px] text-muted-foreground font-medium leading-snug mt-1">{preset.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="font-mono text-[10.5px] font-bold text-emerald-500">{preset.calories} kcal</span>
                        <Button
                          onClick={() => {
                            // Map preset items to full MealItems (calculating nutrients from database)
                            const loggedItems = preset.items.map(it => {
                              const food = internalFoodDatabase.find(f => f.id === it.foodId);
                              const factor = it.gramsSelected / 100;
                              return {
                                foodId: it.foodId,
                                foodName: it.foodName,
                                quantity: it.quantity,
                                unit: it.unit,
                                gramsSelected: it.gramsSelected,
                                calories: food ? Math.round(food.calories * factor) : 0,
                                protein: food ? Number((food.protein * factor).toFixed(1)) : 0,
                                carbs: food ? Number((food.carbs * factor).toFixed(1)) : 0,
                                fat: food ? Number((food.fat * factor).toFixed(1)) : 0
                              };
                            });

                            const log: MealLog = {
                              id: `meal_frequent_${Date.now()}`,
                              date: new Date().toISOString().split('T')[0],
                              mealType: preset.mealType as any,
                              items: loggedItems,
                              hungerBefore: 3,
                              satietyAfter: 3,
                              digestionAfter: 3,
                              notes: `Saisie rapide : ${preset.name}`
                            };

                            addMealLog(log);
                            setSuccess(true);
                            setTimeout(() => setSuccess(false), 3000);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] h-7 px-3.5 py-1 font-bold rounded-lg"
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-3">
                <h5 className="text-xs font-bold uppercase text-foreground">❤️ Vos Ingrédients Favoris</h5>
                {favoriteFoodIds.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic leading-normal">
                    Aucun ingrédient favori. Cliquez sur le cœur à côté d'un aliment dans l'onglet "Ingrédients" pour le retrouver ici.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {internalFoodDatabase
                      .filter(f => favoriteFoodIds.includes(f.id))
                      .map(f => (
                        <div key={f.id} className="p-2.5 border border-border bg-background rounded-xl flex justify-between items-center bg-secondary/5">
                          <div className="truncate pr-2">
                            <span className="font-bold text-xs truncate block">{f.name}</span>
                            <span className="text-[9.5px] text-muted-foreground font-mono">{f.calories} kcal / 100g</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              onClick={() => {
                                toggleFavoriteFood(f.id);
                              }}
                              className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10 shrink-0"
                              title="Retirer des favoris"
                            >
                              <Heart size={12} className="fill-current" />
                            </Button>
                            <Button
                              onClick={() => {
                                handleSelectFood(f.id);
                                setActiveTab('ingredients');
                              }}
                              className="h-7 px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9.5px] font-bold rounded-lg"
                            >
                              Saisir
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 pt-4 space-y-3">
                <h5 className="text-xs font-bold uppercase text-foreground">❤️ Vos Recettes Favorites</h5>
                {favoriteRecipeIds.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic leading-normal">
                    Aucune recette favorite. Marquez vos recettes comme favorites pour un import instantané.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[...internalRecipes, ...storeRecipes]
                      .filter(r => favoriteRecipeIds.includes(r.id))
                      .map(rcp => {
                        const totCals = rcp.items.reduce((sum, item) => {
                          const dbFood = internalFoodDatabase.find(f => f.id === item.foodId);
                          return sum + (dbFood ? Math.round(dbFood.calories * (item.gramsSelected / 100)) : 0);
                        }, 0);

                        return (
                          <div key={rcp.id} className="p-2.5 border border-border bg-background rounded-xl flex justify-between items-center bg-secondary/5">
                            <div className="truncate pr-2">
                              <span className="font-bold text-xs truncate block">{rcp.name}</span>
                              <span className="text-[9.5px] text-muted-foreground font-mono">{totCals} kcal</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  toggleFavoriteRecipe(rcp.id);
                                }}
                                className="h-7 w-7 p-0 text-red-500 hover:bg-red-500/10 shrink-0"
                                title="Retirer des favoris"
                              >
                                <Heart size={12} className="fill-current" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setImportingRecipe(rcp);
                                  setImportRecipeMode("portions");
                                  setImportRecipePortions(1);
                                  setImportRecipeGrams(rcp.finalWeightGrams || 0);
                                  setActiveTab('recipes');
                                }}
                                className="h-7 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-bold rounded-lg"
                              >
                                Importer
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedFood && (
            <div className="p-4 border rounded-2xl bg-secondary/10 border-border/80 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-xs text-foreground uppercase tracking-wide">Configuration de l'ingrédient</h5>
                  <p className="text-xs font-semibold text-primary">{selectedFood.name}</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono translate-y-[-2px]">
                  Confiance : {selectedFood.confidence}%
                </Badge>
              </div>

              {isAllergic(selectedFood.name) && bypassAllergenFoodId !== selectedFood.id ? (
                <div className="p-3 border border-red-500/20 bg-red-500/5 rounded-xl space-y-3">
                  <div className="flex gap-2.5 text-red-500 items-start">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold font-sans">Attention allergène déclaré</span>
                      <p className="text-[10px] text-muted-foreground leading-normal">
                        Cet ingrédient correspond à une allergie que vous avez renseignée (<span className="text-red-500 font-bold">{isAllergic(selectedFood.name)}</span>). Cette vérification repose sur les informations que vous avez renseignées et sur le nom des aliments. Elle ne remplace pas la lecture d'une étiquette ou l'avis d'un professionnel en cas d'allergie sévère.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1 border-t border-red-500/10">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setSelectedFoodId('')}
                      className="text-[10px] text-muted-foreground py-1 h-7 border-border bg-background"
                    >
                      Annuler la sélection
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleBypassAllergen(selectedFood, isAllergic(selectedFood.name) as string)}
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] py-1 h-7 font-bold rounded-lg"
                    >
                      Confirmer malgré l'alerte
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold block text-muted-foreground mb-1">Unité portion :</label>
                      <select 
                        value={unit} 
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full text-xs rounded-lg border border-border bg-background p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="g">Grammes (g)</option>
                        <option value="ml">Millilitres (ml)</option>
                        <option value="piece">Unité / Pièce standard</option>
                        {relatedUnits.map(ru => (
                          <option key={ru.id} value={ru.id}>{ru.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold block text-muted-foreground mb-1">Quantité :</label>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full text-xs rounded-lg border border-border bg-background p-2 font-mono"
                      />
                    </div>
                  </div>

                  {unit === 'g' && (
                    <div className="pt-2 border-t border-border mt-2">
                      <label className="text-[10px] font-bold block text-muted-foreground mb-2">État du produit pesé (Poids cru ou Poids cuit ?) :</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs">
                          <input type="radio" value="raw" checked={mealItemRawCooked === 'raw'} onChange={() => setMealItemRawCooked('raw')} className="accent-emerald-500" />
                          Cru (sèche)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs">
                          <input type="radio" value="cooked" checked={mealItemRawCooked === 'cooked'} onChange={() => setMealItemRawCooked('cooked')} className="accent-emerald-500" />
                          Cuit (préparé)
                        </label>
                      </div>
                    </div>
                  )}

                  {foodNutrientDatabase[selectedFood.id] && (
                    <div className="pt-3 border-t border-border mt-3 space-y-2">
                      <h6 className="text-[10px] font-bold text-muted-foreground uppercase">Détails Micronutritionnels (pour 100g)</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {foodNutrientDatabase[selectedFood.id].map(nut => {
                          const def = Object.values(CoreNutrients).find(n => n.id === nut.nutrientId);
                          return (
                            <div key={nut.nutrientId} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30 text-[10px]">
                              <span className="font-semibold">{def?.name || nut.nutrientId}</span>
                              {nut.isMissing ? (
                                <span className="text-orange-500 italic" title={nut.missingReason}>Non disponible</span>
                              ) : (
                                <div className="text-right">
                                  <span className="font-mono font-bold text-foreground">{nut.valuePer100g} {nut.unit}</span>
                                  {nut.source && <span className="block text-[8px] text-muted-foreground">Source: {nut.source} (Conf: {nut.confidence}%)</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 mt-3 border-t border-border">
                    <Button 
                      onClick={handleAddItemToMeal} 
                      type="button" 
                      className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 text-xs py-1.5 font-bold"
                    >
                      Ajouter au Repas
                    </Button>
                    <Button 
                      onClick={() => setSelectedFoodId('')} 
                      type="button" 
                      variant="outline" 
                      className="text-xs py-1.5"
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Current Composing Meal summary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Composition actuelle</h5>
            <Badge variant="outline" className="font-bold text-[10px] bg-emerald-500/10 text-emerald-500">
              {mealType.toUpperCase()}
            </Badge>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl border-border bg-secondary/5 text-center min-h-36">
              <span className="text-xs text-muted-foreground">Aucun aliment ajouté dans ce repas</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 border rounded-xl border-border bg-background shadow-xs hover:border-red-500/20 group transition-all">
                    <div>
                      <p className="text-xs font-bold">{it.foodName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {it.quantity} {it.unit} &rarr; approx {Math.round(it.gramsSelected)}g • {it.calories} kcal
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="opacity-40 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Composition nutrition macros */}
              <div className="p-3 bg-secondary/35 border rounded-xl border-border/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold">Calories Totales:</span>
                  <span className="font-black font-mono text-emerald-500">{composedCalories} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t text-[10px] text-center font-semibold">
                  <div className="p-1.5 bg-background rounded-lg">
                    <span className="text-muted-foreground block text-[9px] uppercase">Protéines</span>
                    <span className="font-mono text-indigo-400">{composedProtein}g</span>
                  </div>
                  <div className="p-1.5 bg-background rounded-lg">
                    <span className="text-muted-foreground block text-[9px] uppercase">Glucides</span>
                    <span className="font-mono text-amber-500">{composedCarbs}g</span>
                  </div>
                  <div className="p-1.5 bg-background rounded-lg">
                    <span className="text-muted-foreground block text-[9px] uppercase">Lipides</span>
                    <span className="font-mono text-red-400">{composedFat}g</span>
                  </div>
                </div>
              </div>

              {/* Subjective metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground block uppercase mb-1">Faim avant</label>
                  <select 
                    value={hungerBefore} 
                    onChange={(e) => setHungerBefore(Number(e.target.value))}
                    className="w-full text-xs rounded border border-border bg-background p-1 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="1">Faible</option>
                    <option value="3">Moyenne</option>
                    <option value="5">Intense</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground block uppercase mb-1">Satiété après</label>
                  <select 
                    value={satietyAfter} 
                    onChange={(e) => setSatietyAfter(Number(e.target.value))}
                    className="w-full text-xs rounded border border-border bg-background p-1 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="1">Affamé</option>
                    <option value="3">Idéal</option>
                    <option value="5">Surchargé</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-muted-foreground block uppercase mb-1">Digestion</label>
                  <select 
                    value={digestionAfter} 
                    onChange={(e) => setDigestionAfter(Number(e.target.value))}
                    className="w-full text-xs rounded border border-border bg-background p-1 focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="1">Lourde</option>
                    <option value="3">Standard</option>
                    <option value="5">Légère</option>
                  </select>
                </div>
              </div>

              <textarea
                placeholder="Notes de digestion ou suppléments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-[10px] rounded border border-border bg-background p-2 h-14 focus:ring-1 focus:ring-primary focus:outline-none"
              />

              <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
                <Button 
                  onClick={handleSaveMealLog} 
                  className="w-full bg-[#0071E3] hover:bg-[#0071E3]/90 text-white py-2 font-bold text-xs"
                >
                  Enregistrer le repas complet
                </Button>

                {!showRecipeCreator ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRecipeCreator(true)}
                    className="w-full text-[10px] text-indigo-400 hover:text-indigo-500 border-indigo-500/10 hover:border-indigo-500/20 py-2"
                  >
                    Enregistrer comme Recette Personnalisée 📋
                  </Button>
                ) : (
                  <div className="p-3 border rounded-xl border-indigo-500/20 bg-indigo-500/[0.01] flex flex-col gap-3">
                    <div>
                      <h6 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <Clipboard size={12} />
                        Sauvegarde de formule
                      </h6>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Enregistrez ces proportions d'ingrédients pour un futur import instantané.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Ex: Shaker d'Après Course Élite ⚡"
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        className="w-full text-xs p-2 bg-background border border-border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Ex: Whey + Banane frais (Facultatif)"
                        value={recipeDescription}
                        onChange={(e) => setRecipeDescription(e.target.value)}
                        className="w-full text-xs p-2 bg-background border border-border rounded-lg"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Poids final net (g)"
                          value={recipeWeightGrams > 0 ? recipeWeightGrams : ''}
                          onChange={(e) => setRecipeWeightGrams(parseInt(e.target.value) || 0)}
                          className="w-1/2 text-xs p-2 bg-background border border-border rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Nombre de portions"
                          value={recipeNumberOfPortions > 0 ? recipeNumberOfPortions : ''}
                          onChange={(e) => setRecipeNumberOfPortions(parseInt(e.target.value) || 1)}
                          className="w-1/2 text-xs p-2 bg-background border border-border rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setShowRecipeCreator(false)}
                        className="text-[10px] h-7 px-2.5 text-muted-foreground"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCreateRecipe}
                        disabled={!recipeName}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] h-7 px-3.5"
                      >
                        Créer Recette
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
