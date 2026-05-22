import { NutrientDefinition } from "./foodTypes";

export const CoreNutrients: Record<string, NutrientDefinition> = {
  // Macros & Energy
  CALORIES: { id: "kcal", name: "Énergie", unit: "kcal", category: "macro" },
  KILOJOULES: { id: "kj", name: "Énergie (kJ)", unit: "kJ", category: "macro" },
  PROTEINS: { id: "protein", name: "Protéines", unit: "g", category: "macro" },
  CARBS: { id: "carbs", name: "Glucides", unit: "g", category: "macro" },
  FAT: { id: "fat", name: "Lipides", unit: "g", category: "macro" },
  FIBER: { id: "fiber", name: "Fibres", unit: "g", category: "macro" },
  SUGAR: { id: "sugar", name: "Sucres", unit: "g", category: "macro" },
  AMIDON: { id: "starch", name: "Amidon", unit: "g", category: "macro" },
  SAT_FAT: { id: "sat_fat", name: "Acides gras saturés", unit: "g", category: "macro" },
  MONO_UNSAT: { id: "mono_unsat", name: "Acides gras mono-insaturés", unit: "g", category: "macro" },
  POLY_UNSAT: { id: "poly_unsat", name: "Acides gras poly-insaturés", unit: "g", category: "macro" },
  TRANS_FAT: { id: "trans", name: "Acides gras trans", unit: "g", category: "macro" },
  OMEGA_3: { id: "omega_3", name: "Acides gras Oméga-3", unit: "g", category: "macro" },
  OMEGA_6: { id: "omega_6", name: "Acides gras Oméga-6", unit: "g", category: "macro" },
  CHOLESTEROL: { id: "cholesterol", name: "Cholestérol", unit: "mg", category: "macro" },
  POLYOLS: { id: "polyols", name: "Polyols", unit: "g", category: "macro" },
  WATER: { id: "water", name: "Eau", unit: "g", category: "macro" },
  WATER_FOOD: { id: "water_food", name: "Eau alimentaire", unit: "g", category: "macro" },

  // Minerals
  SODIUM: { id: "sodium", name: "Sodium", unit: "mg", category: "micro_mineral" },
  POTASSIUM: { id: "potassium", name: "Potassium", unit: "mg", category: "micro_mineral" },
  CALCIUM: { id: "calcium", name: "Calcium", unit: "mg", category: "micro_mineral" },
  MAGNESIUM: { id: "magnesium", name: "Magnésium", unit: "mg", category: "micro_mineral" },
  IRON: { id: "iron", name: "Fer", unit: "mg", category: "micro_mineral" },
  ZINC: { id: "zinc", name: "Zinc", unit: "mg", category: "micro_mineral" },
  PHOSPHORUS: { id: "phosphorus", name: "Phosphore", unit: "mg", category: "micro_mineral" },
  IODINE: { id: "iodine", name: "Iode", unit: "mcg", category: "micro_mineral" },
  SELENIUM: { id: "selenium", name: "Sélénium", unit: "mcg", category: "micro_mineral" },
  COPPER: { id: "copper", name: "Cuivre", unit: "mg", category: "micro_mineral" },
  MANGANESE: { id: "manganese", name: "Manganèse", unit: "mg", category: "micro_mineral" },

  // Vitamins
  VIT_A: { id: "vit_a", name: "Vitamine A", unit: "mcg", category: "micro_vitamin" },
  BETA_CAROTENE: { id: "beta_carotene", name: "Bêta-carotène", unit: "mcg", category: "micro_vitamin" },
  VIT_D: { id: "vit_d", name: "Vitamine D", unit: "mcg", category: "micro_vitamin" },
  VIT_E: { id: "vit_e", name: "Vitamine E", unit: "mg", category: "micro_vitamin" },
  VIT_K: { id: "vit_k", name: "Vitamine K", unit: "mcg", category: "micro_vitamin" },
  VIT_B1: { id: "vit_b1", name: "Vitamine B1 (Thiamine)", unit: "mg", category: "micro_vitamin" },
  VIT_B2: { id: "vit_b2", name: "Vitamine B2 (Riboflavine)", unit: "mg", category: "micro_vitamin" },
  VIT_B3: { id: "vit_b3", name: "Vitamine B3 (Niacine)", unit: "mg", category: "micro_vitamin" },
  VIT_B5: { id: "vit_b5", name: "Vitamine B5 (Acide pantothénique)", unit: "mg", category: "micro_vitamin" },
  VIT_B6: { id: "vit_b6", name: "Vitamine B6 (Pyridoxine)", unit: "mg", category: "micro_vitamin" },
  VIT_B8: { id: "vit_b8", name: "Vitamine B8 (Biotine)", unit: "mcg", category: "micro_vitamin" },
  VIT_B9: { id: "vit_b9", name: "Vitamine B9 (Acide folique)", unit: "mcg", category: "micro_vitamin" },
  VIT_B12: { id: "vit_b12", name: "Vitamine B12", unit: "mcg", category: "micro_vitamin" },
  VIT_C: { id: "vit_c", name: "Vitamine C", unit: "mg", category: "micro_vitamin" },

  // Others
  CAFFEINE: { id: "caffeine", name: "Caféine", unit: "mg", category: "other" },
  ALCOHOL: { id: "alcohol", name: "Alcool", unit: "g", category: "other" }
};
