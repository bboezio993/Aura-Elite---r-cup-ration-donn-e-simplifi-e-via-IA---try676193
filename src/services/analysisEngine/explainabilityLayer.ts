import { AppState } from "../../store/useStore";
import { runTrainingLoadEngine } from "./trainingLoadEngine";
import { runRecoveryEngine } from "./recoveryEngine";
import { runSleepEngine } from "./sleepEngine";
import { runNutritionEngine } from "./nutritionEngine";
import { runMentalLoadEngine } from "./mentalLoadEngine";
import { runContextEngine } from "./contextEngine";

export interface ExplanationPayload {
  shortSummary: string;
  pedagogicalReformulation: string;
  naturalLanguageExplanation: string;
  activeCapsApplied: string[];
}

export function runExplainabilityLayer(state: AppState): ExplanationPayload {
  const todayStr = new Date().toISOString().split("T")[0];
  
  const training = runTrainingLoadEngine(state);
  const recovery = runRecoveryEngine(state);
  const sleep = runSleepEngine(state);
  const nutrition = runNutritionEngine(state);
  const mental = runMentalLoadEngine(state);
  const context = runContextEngine(state);

  const activeCapsApplied: string[] = [];
  const explanations: string[] = [];

  // Pain capping checks
  const activePainLogs = state.painLogs ? state.painLogs.filter((p) => p.date === todayStr) : [];
  const maxPainIntensity = activePainLogs.reduce((max, log) => Math.max(max, log.intensityActive, log.intensityRest), 0);
  if (maxPainIntensity >= 7) {
    activeCapsApplied.push("Cap de douleur intense (la disponibilité globale est plafonnée par précaution).");
    explanations.push("Votre score global de disponibilité a été volontairement ajusté à la baisse suite au signalement de douleurs intenses.");
  }

  // Illness symptoms
  const checkinWithIllness = state.hooperLogs.find((l) => (l.date === todayStr) && (l.isIll === true || l.notes?.toLowerCase().includes("malade")));
  if (checkinWithIllness) {
    activeCapsApplied.push("Cap de fatigue extrême ou indisposition déclarée.");
    explanations.push("La déclaration d'une fatigue extrême ou d'une indisposition induit un plafonnement préventif des indicateurs de forme.");
  }

  // Digest factors
  const isAlcoholOrLateMeal = context.negativeDrivers.some((d) => d.metricId === "context_digestive");
  if (isAlcoholOrLateMeal && (recovery.status === "fatigued" || recovery.status === "exhausted")) {
    explanations.push("Le repos cardiovasculaire nocturne habituel semble impacté par un repas tardif ou l'ingestion d'alcool déclarés la veille.");
  }

  // Travel / Jetlag factors
  const isTravel = context.negativeDrivers.some((d) => d.metricId === "context_travel");
  if (isTravel) {
    explanations.push("Les perturbations constatées sur le rythme circadien et la durée de sommeil se placent dans un contexte de déplacement déclaré.");
  }

  // Build natural language texts
  const shortSummary = explanations.length > 0
    ? explanations.join(" ")
    : "Indicateurs globaux stables. La relation charge-récupération se maintient dans des proportions habituelles.";

  const pedagogicalReformulation = "Le corps réagit en permanence aux stimuli combinés de l'entraînement, de l'environnement, de l'alimentation et du sommeil. Un épuisement partiel ou passager (comme une mauvaise nuit après un repas tardif) est une réaction saine d'adaptation temporaire qui ne compromet pas votre entraînement si la charge cumulée est contrôlée.";

  const naturalLanguageExplanation = `Votre profil actuel indique une charge d'entraînement ${training.status === "optimal" ? "optimale (Sweet Spot)" : training.status === "strained" ? "accrue" : "légère"}. La récupération cardiovasculaire (HRV/RHR) montre un état ${recovery.status === "recovered" ? "favorable" : "d'adaptation ordinaire"}. Le maintien de la régularité du sommeil et le respect des apports énergétiques restent les meilleurs remparts préventifs contre tout inconfort physique prolongé.`;

  return {
    shortSummary,
    pedagogicalReformulation,
    naturalLanguageExplanation,
    activeCapsApplied
  };
}
