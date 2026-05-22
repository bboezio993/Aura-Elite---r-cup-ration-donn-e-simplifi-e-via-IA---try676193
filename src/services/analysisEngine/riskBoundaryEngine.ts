import { AppState } from "../../store/useStore";
import { ModularEngineResult } from "./types";

export interface RiskEngineResult {
  flags: string[];
  level: "none" | "monitor" | "warning" | "professional_evaluation";
  globalActionPriority: string;
}

export function runRiskBoundaryEngine(
  state: AppState,
  trainingRes: ModularEngineResult,
  recoveryRes: ModularEngineResult,
  sleepRes: ModularEngineResult,
  nutritionRes: ModularEngineResult,
  contextRes: ModularEngineResult
): RiskEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const flags: string[] = [];

  // 1. Pain check
  const activePainLogs = state.painLogs ? state.painLogs.filter((p) => p.date === todayStr) : [];
  const maxPainIntensity = activePainLogs.reduce((max, log) => Math.max(max, log.intensityActive, log.intensityRest), 0);
  if (maxPainIntensity >= 7) {
    flags.push("Douleur déclarée nécessitant une attention particulière.");
  }

  // 2. Illness symptoms
  const checkinWithIllness = state.hooperLogs.find((l) => (l.date === todayStr || l.date === yesterdayStr) && (l.isIll === true || l.notes?.toLowerCase().includes("malade")));
  const isIllnessContext = contextRes.negativeDrivers.some((d) => d.metricId === "context_health");
  if (checkinWithIllness || isIllnessContext) {
    flags.push("Signal de surcharge lié à un état de fatigue extrême ou d'indisposition.");
  }

  // 3. Training Load ACWR warning
  // Grab real acwr from training load if possible
  const hasAcwrNeg = trainingRes.negativeDrivers.some((d) => d.metricId === "acwr");
  if (hasAcwrNeg || trainingRes.status === "strained") {
    flags.push("Charge aiguë élevée par rapport à votre historique récent.");
    flags.push("Adaptation prudente de la charge recommandée.");
  }

  // 4. Sleep debt check
  const isSleepDebt = sleepRes.status === "severe_debt";
  if (isSleepDebt) {
    flags.push("Signal de surcharge à surveiller (déficit de récupération cumulé).");
  }

  // 5. Energy availability check (under-fueling)
  const isNutritionDeficit = nutritionRes.status === "watch" || nutritionRes.status === "deficit";
  if (isNutritionDeficit) {
    flags.push("Disponibilité énergétique possiblement basse si les apports saisis sont complets.");
  }

  // If we have minimal data
  if (trainingRes.confidence < 30 && recoveryRes.confidence < 30) {
    flags.push("Données insuffisantes pour conclure à un risque individuel précis.");
  }

  let level: "none" | "monitor" | "warning" | "professional_evaluation" = "none";
  if (flags.length >= 3) {
    level = "professional_evaluation";
  } else if (flags.length > 0) {
    level = "warning";
  } else if (trainingRes.status === "underloaded" || sleepRes.status === "debt") {
    level = "monitor";
  }

  // Define action priorities adhering strictly to prudent, non-clinical french formulations:
  let globalActionPriority = "Maintien : Poursuivre la planification standard de l'entraînement.";
  if (level === "professional_evaluation") {
    globalActionPriority = "Vigilance : Signal de surcharge à surveiller. Si ce signal persiste, une évaluation professionnelle peut être pertinente.";
  } else if (level === "warning") {
    globalActionPriority = "Recommandation : Adaptation prudente de la charge d'entraînement recommandée de manière préventive.";
  } else if (trainingRes.status === "optimal" && recoveryRes.status === "recovered") {
    globalActionPriority = "Indication favorable : Assimilation positive constatée relative à vos historiques récents.";
  }

  return {
    flags,
    level,
    globalActionPriority,
  };
}
