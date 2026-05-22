import { AppState } from "../../store/useStore";
import { calculateBaseline } from "./baselines";
import { runContextEngine } from "./contextEngine";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";

export function runRecoveryEngine(state: AppState): ModularEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const hrvBaseline = calculateBaseline(state.metrics, "hrv_rmssd", todayStr);
  const rhrBaseline = calculateBaseline(state.metrics, "rhr", todayStr);
  const latestHooper =
    state.hooperLogs.find((l) => l.date === todayStr) ||
    state.hooperLogs.find((l) => l.date === yesterdayStr);

  const contextResult = runContextEngine(state);

  const dataUsed: string[] = [];
  const dataMissing: string[] = [];
  const limits: string[] = [];
  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];

  let recoveryScore = 50;
  let confidence = 0;

  if (hrvBaseline && rhrBaseline) {
    confidence += 60;
    dataUsed.push("hrv_rmssd", "rhr");

    const hrvZ = hrvBaseline.zScore28d;
    const rhrZ = rhrBaseline.zScore28d;

    const hrvFactor = Math.max(-2, Math.min(2, hrvZ)) * 10;
    const rhrFactor = Math.max(-2, Math.min(2, -rhrZ)) * 10;

    recoveryScore = 50 + hrvFactor + rhrFactor;

    const hrvDriver: Driver = {
      metricId: "hrv_rmssd",
      label: "Variabilité Cardiaque (HRV)",
      impact: hrvZ > 0.5 ? "positive" : hrvZ < -0.5 ? "negative" : "neutral",
      value: `${Math.round(hrvBaseline.currentValue)} ms`,
      note: `Z-Score de ${hrvZ.toFixed(1)}.`
    };
    if (hrvZ > 0.5) positiveDrivers.push(hrvDriver);
    else if (hrvZ < -0.5) negativeDrivers.push(hrvDriver);

    const rhrDriver: Driver = {
      metricId: "rhr",
      label: "Fréquence Cardiaque au repos (RHR)",
      impact: rhrZ < -0.5 ? "positive" : rhrZ > 0.5 ? "negative" : "neutral",
      value: `${Math.round(rhrBaseline.currentValue)} bpm`,
      note: `Z-Score de ${rhrZ.toFixed(1)}.`
    };
    if (rhrZ < -0.5) positiveDrivers.push(rhrDriver);
    else if (rhrZ > 0.5) negativeDrivers.push(rhrDriver);
  } else {
    dataMissing.push("hrv_rmssd", "rhr");
    limits.push("Données HRV ou RHR de référence incomplètes pour évaluer la récupération cardiaque.");
  }

  if (latestHooper) {
    confidence += 40;
    dataUsed.push("hooper_fatigue", "hooper_soreness");
    const subjFactor = (8 - latestHooper.fatigue + (8 - latestHooper.soreness)) / 2;
    const normalizedSubj = (subjFactor - 4) * 10;
    recoveryScore += normalizedSubj;

    const fatigueDriver: Driver = {
      metricId: "subjective_fatigue",
      label: "Fatigue Subjective",
      impact: latestHooper.fatigue < 3 ? "positive" : latestHooper.fatigue > 5 ? "negative" : "neutral",
      value: `${latestHooper.fatigue}/7`,
      note: "Indice Hooper quotidien."
    };
    if (latestHooper.fatigue < 3) positiveDrivers.push(fatigueDriver);
    else if (latestHooper.fatigue > 5) negativeDrivers.push(fatigueDriver);
  } else {
    dataMissing.push("hooper_checkin");
    limits.push("Formulaire de bien-être du matin manquant.");
  }

  // Adjust confidence if context travel is active (as requested)
  const isTravelActive = contextResult.negativeDrivers.some(d => d.metricId === "context_travel");
  if (isTravelActive) {
    confidence = Math.max(20, confidence - 15);
  }

  recoveryScore = Math.max(0, Math.min(100, recoveryScore));
  const roundedScore = Math.round(recoveryScore);

  let status: "recovered" | "adapting" | "fatigued" | "exhausted" = "adapting";
  if (roundedScore > 75) status = "recovered";
  else if (roundedScore > 40) status = "adapting";
  else if (roundedScore > 20) status = "fatigued";
  else status = "exhausted";

  let secureWording = "Indicateurs d'adaptation autonomes stables. Votre organisme absorbe le rythme d'entraînement standard.";
  if (status === "recovered") {
    secureWording = "Excellente réponse physiologique de récupération active détectée.";
  } else if (status === "fatigued" || status === "exhausted") {
    secureWording = "Diminution transitoire observée des réserves d'adaptation parasympathiques. Séquences à surveiller.";
  }

  // contextual explainability
  const isAlcoholOrLateMeal = contextResult.negativeDrivers.some(d => d.metricId === "context_digestive");
  if (isAlcoholOrLateMeal && (status === "fatigued" || status === "exhausted")) {
    secureWording += " Une récupération perturbée peut être corrélée au repas tardif ou à l'apport d'alcool signalé.";
  }

  let recoveryTrend: "improving" | "declining" | "stable" = "stable";
  if (hrvBaseline && rhrBaseline) {
    if (hrvBaseline.trend === "increasing" && (rhrBaseline.trend === "decreasing" || rhrBaseline.trend === "stable")) {
      recoveryTrend = "improving";
    } else if (hrvBaseline.trend === "decreasing" && (rhrBaseline.trend === "increasing" || rhrBaseline.trend === "stable")) {
      recoveryTrend = "declining";
    }
  }

  return {
    score: roundedScore,
    status,
    confidence,
    positiveDrivers,
    negativeDrivers,
    dataUsed,
    dataMissing,
    limits,
    secureWording,
    trends: {
      recovery: recoveryTrend
    }
  };
}
