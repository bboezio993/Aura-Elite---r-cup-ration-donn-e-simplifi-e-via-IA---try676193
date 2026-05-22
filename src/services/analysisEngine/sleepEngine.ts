import { AppState } from "../../store/useStore";
import { calculateBaseline } from "./baselines";
import { runContextEngine } from "./contextEngine";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";

export function runSleepEngine(state: AppState): ModularEngineResult {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const sleepBaseline = calculateBaseline(state.metrics, "sleep_duration", todayStr);
  const latestHooper =
    state.hooperLogs.find((l) => l.date === todayStr) ||
    state.hooperLogs.find((l) => l.date === yesterdayStr);

  const contextResult = runContextEngine(state);

  const dataUsed: string[] = [];
  const dataMissing: string[] = [];
  const limits: string[] = [];
  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];

  let sleepScore = 50;
  let confidence = 0;
  let sleepDebt = 0;

  if (sleepBaseline) {
    confidence += 70;
    dataUsed.push("sleep_duration");

    const recentSleep = state.metrics
      .filter((m) => m.type === "sleep_duration" && new Date(m.timestamp).getTime() > today.getTime() - 7 * MS_PER_DAY)
      .map((m) => m.value);

    // Sum up sleep debt (8hr target)
    sleepDebt = recentSleep.reduce((acc, val) => acc + Math.max(0, 8 - val), 0);

    const durationFactor = Math.max(-2, Math.min(2, sleepBaseline.zScore28d)) * 15;
    sleepScore = 50 + durationFactor - sleepDebt * 2;

    const durationDriver: Driver = {
      metricId: "sleep_duration",
      label: "Durée de Sommeil",
      impact: sleepBaseline.zScore28d > -0.5 ? "positive" : "negative",
      value: `${sleepBaseline.currentValue.toFixed(1)}h`,
      note: `Moyenne récente : ${sleepBaseline.mean7d.toFixed(1)}h. Dette de ${sleepDebt.toFixed(1)}h.`
    };
    if (sleepBaseline.zScore28d > -0.5) positiveDrivers.push(durationDriver);
    else negativeDrivers.push(durationDriver);
  } else {
    dataMissing.push("sleep_duration");
    limits.push("Données de sommeil manquantes pour évaluer la régularité.");
  }

  if (latestHooper) {
    confidence += 30;
    dataUsed.push("hooper_sleep_quality");
    const subjSleep = 8 - latestHooper.sleepQuality;
    sleepScore += (subjSleep - 4) * 10;

    const qualityDriver: Driver = {
      metricId: "subjective_sleep_quality",
      label: "Qualité de Sommeil Subjective",
      impact: latestHooper.sleepQuality > 4 ? "positive" : "negative",
      value: `${latestHooper.sleepQuality}/7`,
      note: "Note de confort matinal."
    };
    if (latestHooper.sleepQuality > 4) positiveDrivers.push(qualityDriver);
    else negativeDrivers.push(qualityDriver);
  } else {
    dataMissing.push("hooper_checkin");
    limits.push("Évaluation subjective de la nuit manquante.");
  }

  // Nuance sleep calculations based on context (heat & travel)
  const isTravel = contextResult.negativeDrivers.some(d => d.metricId === "context_travel");
  const isHeat = contextResult.negativeDrivers.some(d => d.metricId === "context_environment");
  
  if (isTravel) {
    confidence = Math.max(20, confidence - 15);
  }

  sleepScore = Math.max(0, Math.min(100, sleepScore));
  const roundedScore = Math.round(sleepScore);

  let status: "optimal" | "adequate" | "debt" | "severe_debt" = "adequate";
  if (sleepDebt > 10 || roundedScore < 25) {
    status = "severe_debt";
  } else if (sleepDebt > 5 || roundedScore < 50) {
    status = "debt";
  } else if (roundedScore > 75) {
    status = "optimal";
  }

  let secureWording = "Profil de récupération nocturne suffisant. Votre cycle veille-sommeil soutient les demandes d'entraînement.";
  if (status === "severe_debt" || status === "debt") {
    secureWording = `Attention : Une restriction prolongée de sommeil détériore la récupération passive globale. Séquence cumulative à combler.`;
  } else if (status === "optimal") {
    secureWording = "Excellente phase d'assimilation et d'architecture de sommeil réparatrice.";
  }

  if (isHeat && (status === "debt" || status === "severe_debt")) {
    secureWording += " Des températures ambiantes élevées déclarées peuvent perturber naturellement la profondeur de votre repos.";
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
    secureWording
  };
}
