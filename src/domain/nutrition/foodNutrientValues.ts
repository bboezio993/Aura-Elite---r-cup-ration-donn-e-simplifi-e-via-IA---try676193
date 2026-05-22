import { FoodNutrientValue } from "./foodTypes";

export const foodNutrientDatabase: Record<string, FoodNutrientValue[]> = {
  // 1. Blanc de poulet cuit (poulet_blanc)
  "poulet_blanc": [
    { nutrientId: "fiber", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 0.5, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 68, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 330, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 15, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 25, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 1.0, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 1.5, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_measured", confidence: 50, unit: "mcg" },
    { nutrientId: "vit_b12", valuePer100g: 0.3, unit: "mcg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "water_food", valuePer100g: 65, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 2. Pâtes sèches standards (crues) (pates_crues)
  "pates_crues": [
    { nutrientId: "fiber", valuePer100g: 3.5, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 3.0, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 0.3, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 5, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 200, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 20, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 50, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 1.5, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 1.0, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 10, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 3. Pâtes cuites à l'eau (sans sel) (pates_cuites)
  "pates_cuites": [
    { nutrientId: "fiber", valuePer100g: 1.2, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 1.0, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 0.1, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 2, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 44, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 7, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 18, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 0.5, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 0.3, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 70, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 4. Riz blanc cru (riz_cru)
  "riz_cru": [
    { nutrientId: "fiber", valuePer100g: 1.0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 0.2, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 0.2, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 4, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 110, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 10, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 25, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 0.8, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 1.0, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 12, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 5. Riz blanc cuit (riz_cuit)
  "riz_cuit": [
    { nutrientId: "fiber", valuePer100g: 0.4, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 0.1, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 0.1, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 1, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 35, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 3, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 9, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 0.3, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 0.4, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 68, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 6. Banane fraîche (banane)
  "banane": [
    { nutrientId: "fiber", valuePer100g: 2.6, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "sugar", valuePer100g: 12.2, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "sat_fat", valuePer100g: 0.1, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "sodium", valuePer100g: 1, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "potassium", valuePer100g: 358, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "calcium", valuePer100g: 5, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "magnesium", valuePer100g: 27, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "iron", valuePer100g: 0.3, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "zinc", valuePer100g: 0.15, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "vit_c", valuePer100g: 8.7, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 75, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" }
  ],

  // 7. Huile d'olive extra vierge (huile_olive)
  "huile_olive": [
    { nutrientId: "fiber", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 14.0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 0, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 1, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 1, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 0, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 0.5, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 0.05, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 0.1, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 8. Œuf de poule (cuit) (oeuf_entier)
  "oeuf_entier": [
    { nutrientId: "fiber", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 0.7, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 3.0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 124, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 126, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 50, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 10, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 1.2, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 1.1, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", valuePer100g: 2.0, unit: "mcg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "vit_b12", valuePer100g: 1.1, unit: "mcg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "water_food", valuePer100g: 75, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 9. Flocons d'avoine brute (flocons_avoine)
  "flocons_avoine": [
    { nutrientId: "fiber", valuePer100g: 10.0, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "sugar", valuePer100g: 1.0, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "sat_fat", valuePer100g: 1.1, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "sodium", valuePer100g: 2, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "potassium", valuePer100g: 429, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "calcium", valuePer100g: 54, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "magnesium", valuePer100g: 177, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "iron", valuePer100g: 4.7, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "zinc", valuePer100g: 4.0, unit: "mg", isMissing: false, confidence: 100, source: "USDA FDC" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 8, unit: "g", isMissing: false, confidence: 100, source: "USDA FDC" }
  ],

  // 10. Pavé de saumon cuit au four (saumon)
  "saumon": [
    { nutrientId: "fiber", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 2.4, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 45, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 360, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 12, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 28, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 0.3, unit: "mg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 0.4, unit: "mg", isMissing: false, confidence: 90, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", valuePer100g: 11.0, unit: "mcg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "vit_b12", valuePer100g: 3.2, unit: "mcg", isMissing: false, confidence: 95, source: "Ciqual 2020" },
    { nutrientId: "water_food", valuePer100g: 62, unit: "g", isMissing: false, confidence: 95, source: "Ciqual 2020" }
  ],

  // 11. Isolat de protéine de lactosérum (whey_isolate)
  "whey_isolate": [
    { nutrientId: "fiber", valuePer100g: 0, unit: "g", isMissing: false, confidence: 100, source: "User input" },
    { nutrientId: "sugar", valuePer100g: 1.0, unit: "g", isMissing: false, confidence: 95, source: "User input" },
    { nutrientId: "sat_fat", valuePer100g: 0.5, unit: "g", isMissing: false, confidence: 95, source: "User input" },
    { nutrientId: "sodium", valuePer100g: 150, unit: "mg", isMissing: false, confidence: 100, source: "User input" },
    { nutrientId: "potassium", valuePer100g: 100, unit: "mg", isMissing: false, confidence: 90, source: "User input" },
    { nutrientId: "calcium", valuePer100g: 120, unit: "mg", isMissing: false, confidence: 90, source: "User input" },
    { nutrientId: "magnesium", valuePer100g: 30, unit: "mg", isMissing: false, confidence: 90, source: "User input" },
    { nutrientId: "iron", isMissing: true, missingReason: "not_measured", confidence: 50, unit: "mg" },
    { nutrientId: "zinc", isMissing: true, missingReason: "not_measured", confidence: 50, unit: "mg" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_measured", confidence: 50, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 4, unit: "g", isMissing: false, confidence: 90, source: "User input" }
  ],

  // 12. Pomme crue avec peau (pomme)
  "pomme": [
    { nutrientId: "fiber", valuePer100g: 2.4, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 10.4, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 0.05, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 1, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 107, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 6, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 5, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 0.1, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 0.04, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "vit_c", valuePer100g: 4.6, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 85, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" }
  ],

  // 13. Amandes douces emondées (amandes)
  "amandes": [
    { nutrientId: "fiber", valuePer100g: 12.5, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sugar", valuePer100g: 4.4, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sat_fat", valuePer100g: 3.8, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "sodium", valuePer100g: 1, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "potassium", valuePer100g: 733, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "calcium", valuePer100g: 269, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "magnesium", valuePer100g: 270, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "iron", valuePer100g: 3.7, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "zinc", valuePer100g: 3.1, unit: "mg", isMissing: false, confidence: 100, source: "Ciqual 2020" },
    { nutrientId: "vit_c", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mg" },
    { nutrientId: "vit_d", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "vit_b12", isMissing: true, missingReason: "not_applicable", confidence: 100, unit: "mcg" },
    { nutrientId: "water_food", valuePer100g: 5, unit: "g", isMissing: false, confidence: 100, source: "Ciqual 2020" }
  ]
};
