import { FoodItem, ServingUnit, Recipe } from './foodTypes';

export const internalFoodDatabase: FoodItem[] = [
  {
    id: "poulet_blanc",
    source: "ciqual",
    sourceFoodId: "26002",
    sourceVersion: "2020",
    sourceName: "Ciqual 2020",
    importDate: "2026-05-22",
    name: "Blanc de poulet cuit",
    normalizedName: "blanc de poulet cuit",
    category: "Viandes, œufs, poissons",
    subcategory: "Volaille",
    locale: "fr",
    defaultUnit: "g",
    calories: 121,
    protein: 26,
    carbs: 0.1,
    fat: 1.8,
    fiber: 0,
    sodium: 68,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "pates_crues",
    source: "ciqual",
    sourceFoodId: "9312",
    sourceVersion: "2020",
    sourceName: "Ciqual 2020",
    importDate: "2026-05-22",
    name: "Pâtes sèches standards (crues)",
    normalizedName: "pates seches standards crues",
    category: "Céréales et pommes de terre",
    subcategory: "Pâtes alimentaires",
    locale: "fr",
    defaultUnit: "g",
    rawCookedState: "raw",
    calories: 350,
    protein: 12.5,
    carbs: 71,
    fat: 1.5,
    fiber: 3.5,
    sodium: 5,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "pates_cuites",
    source: "ciqual",
    sourceFoodId: "9313",
    sourceVersion: "2020",
    sourceName: "Ciqual 2020",
    importDate: "2026-05-22",
    name: "Pâtes cuites à l'eau (sans sel)",
    normalizedName: "pates cuites a l eau sans sel",
    category: "Céréales et pommes de terre",
    subcategory: "Pâtes alimentaires",
    locale: "fr",
    defaultUnit: "g",
    rawCookedState: "cooked",
    calories: 130,
    protein: 4.5,
    carbs: 26,
    fat: 0.5,
    fiber: 1.2,
    sodium: 2,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "riz_cru",
    source: "ciqual",
    name: "Riz blanc cru",
    normalizedName: "riz blanc cru",
    category: "Céréales et pommes de terre",
    subcategory: "Grains",
    locale: "fr",
    defaultUnit: "g",
    rawCookedState: "raw",
    calories: 360,
    protein: 7,
    carbs: 78,
    fat: 0.8,
    fiber: 1,
    sodium: 4,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "riz_cuit",
    source: "ciqual",
    name: "Riz blanc cuit",
    normalizedName: "riz blanc cuit",
    category: "Céréales et pommes de terre",
    subcategory: "Grains",
    locale: "fr",
    defaultUnit: "g",
    rawCookedState: "cooked",
    calories: 135,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
    sodium: 1,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "banane",
    source: "usda_fdc",
    name: "Banane fraîche",
    normalizedName: "banane fraiche",
    category: "Fruits, légumes, légumineuses",
    subcategory: "Fruits",
    locale: "fr",
    defaultUnit: "piece",
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
    sodium: 1,
    confidence: 98,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "huile_olive",
    source: "ciqual",
    name: "Huile d'olive extra vierge",
    normalizedName: "huile d olive extra vierge",
    category: "Matières grasses",
    subcategory: "Huiles végétales",
    locale: "fr",
    defaultUnit: "ml",
    densityGPerMl: 0.915,
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    fiber: 0,
    sodium: 0,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "oeuf_entier",
    source: "ciqual",
    name: "Œuf de poule (cuit)",
    normalizedName: "oeuf de poule cuit",
    category: "Viandes, œufs, poissons",
    subcategory: "Œufs",
    locale: "fr",
    defaultUnit: "piece",
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    fiber: 0,
    sodium: 124,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "flocons_avoine",
    source: "usda_fdc",
    name: "Flocons d'avoine brute",
    normalizedName: "flocons d avoine brute",
    category: "Céréales et pommes de terre",
    subcategory: "Grains",
    locale: "fr",
    defaultUnit: "g",
    calories: 379,
    protein: 13,
    carbs: 68,
    fat: 6.5,
    fiber: 10,
    sodium: 2,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "saumon",
    source: "ciqual",
    name: "Pavé de saumon cuit au four",
    normalizedName: "pave de saumon cuit au four",
    category: "Viandes, œufs, poissons",
    subcategory: "Poissons",
    locale: "fr",
    defaultUnit: "g",
    calories: 198,
    protein: 23,
    carbs: 0,
    fat: 11.5,
    fiber: 0,
    sodium: 45,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "whey_isolate",
    source: "user",
    name: "Isolat de protéine de lactosérum (Whey Isolate)",
    normalizedName: "isolat de proteine de lactoserum whey isolate",
    category: "Produits de supplémentation",
    subcategory: "Poudres protéinées",
    locale: "multi",
    defaultUnit: "piece", // represents a scoop (typically 30g)
    calories: 370,
    protein: 85,
    carbs: 3,
    fat: 1.5,
    fiber: 0,
    sodium: 150,
    confidence: 90,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "pomme",
    source: "ciqual",
    name: "Pomme crue avec peau",
    normalizedName: "pomme crue avec peau",
    category: "Fruits, légumes, légumineuses",
    subcategory: "Fruits",
    locale: "fr",
    defaultUnit: "piece",
    calories: 52,
    protein: 0.3,
    carbs: 11.6,
    fat: 0.2,
    fiber: 2.4,
    sodium: 1,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "amandes",
    source: "ciqual",
    name: "Amandes douces emondées",
    normalizedName: "amandes douces emondees",
    category: "Fruits, légumes, légumineuses",
    subcategory: "Légumineuses et fruits à coque",
    locale: "fr",
    defaultUnit: "g",
    calories: 610,
    protein: 22,
    carbs: 5.4,
    fat: 53.5,
    fiber: 12.5,
    sodium: 1,
    confidence: 100,
    verified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const servingUnits: ServingUnit[] = [
  // Banane
  { id: "ban_moyen", foodId: "banane", label: "1 unité moyenne (pelée)", gramsEquivalent: 118, unitType: "piece", confidence: 90 },
  { id: "ban_gros", foodId: "banane", label: "1 grande banane", gramsEquivalent: 150, unitType: "piece", confidence: 80 },
  // Oeuf
  { id: "egg_moyen", foodId: "oeuf_entier", label: "1 œuf gros (L)", gramsEquivalent: 55, unitType: "piece", confidence: 95 },
  { id: "egg_petit", foodId: "oeuf_entier", label: "1 œuf moyen (M)", gramsEquivalent: 48, unitType: "piece", confidence: 90 },
  // Huile d'olive
  { id: "oil_cs", foodId: "huile_olive", label: "1 cuillère à soupe (15ml)", gramsEquivalent: 13.7, mlEquivalent: 15, unitType: "household", confidence: 90 },
  { id: "oil_cc", foodId: "huile_olive", label: "1 cuillère à café (5ml)", gramsEquivalent: 4.6, mlEquivalent: 5, unitType: "household", confidence: 90 },
  // Whey
  { id: "whey_scoop", foodId: "whey_isolate", label: "1 dose / scoop (30g)", gramsEquivalent: 30, unitType: "piece", confidence: 95 },
  // Pomme
  { id: "apple_moyen", foodId: "pomme", label: "1 pomme moyenne", gramsEquivalent: 150, unitType: "piece", confidence: 85 }
];

export function convertPortionToGrams(
  foodId: string, 
  quantity: number, 
  unit: string
): { grams: number; confidence: number; assumptions: string[] } {
  const food = internalFoodDatabase.find(f => f.id === foodId);
  if (!food) {
    return { grams: quantity, confidence: 50, assumptions: ["Aliment introuvable, par défaut équivalent-grammes."] };
  }

  if (unit === "g") {
    return { grams: quantity, confidence: 100, assumptions: ["Saisie directe en grammes."] };
  }

  // Check specific matching servingUnit
  const matchUnit = servingUnits.find(su => su.foodId === foodId && (su.id === unit || su.label.toLowerCase().includes(unit.toLowerCase())));
  if (matchUnit) {
    const val = (matchUnit.gramsEquivalent ?? 0) * quantity;
    return { 
      grams: val, 
      confidence: matchUnit.confidence, 
      assumptions: [`Utilisation de l'équivalent portion défini : ${matchUnit.label}.`] 
    };
  }

  // Generic portions
  if (unit === "piece" && foodId === "banane") {
    return { grams: 118 * quantity, confidence: 80, assumptions: [ "Approximation d'une banane moyenne (118g)." ] };
  }
  if (unit === "piece" && foodId === "oeuf_entier") {
    return { grams: 55 * quantity, confidence: 90, assumptions: [ "Approximation d'un œuf large (55g)." ] };
  }
  if (unit === "piece" && foodId === "pomme") {
    return { grams: 150 * quantity, confidence: 80, assumptions: [ "Approximation d'une pomme moyenne (150g)." ] };
  }
  if (unit === "piece" && foodId === "whey_isolate") {
    return { grams: 30 * quantity, confidence: 95, assumptions: [ "Par défaut 1 scoop = 30g." ] };
  }

  // Density fallback for fluids (ml)
  if (unit === "ml") {
    const density = food.densityGPerMl ?? 1.0;
    return {
      grams: quantity * density,
      confidence: 90,
      assumptions: [`Portion volumétrique ml convertie avec densité de ${density} g/ml.`]
    };
  }

  return { 
    grams: quantity, 
    confidence: 60, 
    assumptions: ["Unité non identifiée, repli sur 1g pour 1 unité."] 
  };
}

export const cookingYieldFactors = [
  { foodId: "pates_crues", fromState: "raw", toState: "cooked", factor: 2.7, note: "100g de pâtes crues donnent environ 270g de pâtes cuites." },
  { foodId: "riz_cru", fromState: "raw", toState: "cooked", factor: 2.8, note: "100g de riz cru absorbent l'eau et atteignent 280g de riz cuit." }
];

export const internalRecipes: Recipe[] = [
  {
    id: "recette_shaker_recup",
    name: "Shaker Récupération Hydrates & Protéines 🥛",
    description: "Le shake de récupération par excellence après une séance de course longue ou d'intervalles.",
    items: [
      { foodId: "whey_isolate", foodName: "Whey Isolate (Isolat de lactosérum)", quantity: 1, unit: "piece", gramsSelected: 30, calories: 110, protein: 26, carbs: 0.8, fat: 0.2 },
      { foodId: "banane", foodName: "Banane fraîche", quantity: 1, unit: "piece", gramsSelected: 118, calories: 105, protein: 1.3, carbs: 26.9, fat: 0.4 }
    ]
  },
  {
    id: "recette_pates_saumon",
    name: "Pâtes au Saumon de l'Athlète 🍝",
    description: "Un apport riche en acides gras oméga-3 et en glycogène pour favoriser la réparation nerveuse et musculaire.",
    items: [
      { foodId: "pates_cuites", foodName: "Pâtes cuites à l'eau (sans sel)", quantity: 250, unit: "g", gramsSelected: 250, calories: 325, protein: 11.3, carbs: 65, fat: 1.3 },
      { foodId: "saumon", foodName: "Pavé de saumon cuit au four", quantity: 120, unit: "g", gramsSelected: 120, calories: 238, protein: 27.6, carbs: 0, fat: 13.8 },
      { foodId: "huile_olive", foodName: "Huile d'olive extra vierge", quantity: 5, unit: "ml", gramsSelected: 4.6, calories: 41, protein: 0, carbs: 0, fat: 4.6 }
    ]
  },
  {
    id: "recette_porridge_endurance",
    name: "Porridge Endurance & Avoine Matinal 🥣",
    description: "Une libération lente d'énergie pour soutenir les sorties d'endurance fondamentales ou sorties longues.",
    items: [
      { foodId: "flocons_avoine", foodName: "Flocons d'avoine brute", quantity: 80, unit: "g", gramsSelected: 80, calories: 303, protein: 10.4, carbs: 54.4, fat: 5.2 },
      { foodId: "banane", foodName: "Banane fraîche", quantity: 0.5, unit: "piece", gramsSelected: 59, calories: 53, protein: 0.7, carbs: 13.5, fat: 0.2 },
      { foodId: "oeuf_entier", foodName: "Œuf de poule (cuit)", quantity: 1, unit: "piece", gramsSelected: 55, calories: 79, protein: 6.9, carbs: 0.4, fat: 5.2 }
    ]
  }
];

