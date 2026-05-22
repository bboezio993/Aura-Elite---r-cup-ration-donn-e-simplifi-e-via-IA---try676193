import { AppState } from "../../store/useStore";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";

export function runReadinessEngine(state: AppState, recoveryRes: ModularEngineResult, trainingRes: ModularEngineResult): ModularEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0];

  let readinessScore = 50;
  let readinessConfidence = 0;
  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];
  const dataUsed: string[] = [];
  const dataMissing: string[] = [];
  const limits: string[] = [];

  const acwr = trainingRes.positiveDrivers.find(d => d.metricId === "acwr")?.value 
    || trainingRes.negativeDrivers.find(d => d.metricId === "acwr")?.value 
    || 0;
  const numericAcwr = typeof acwr === "string" ? parseFloat(acwr) : acwr;

  if (numericAcwr > 0) {
    readinessConfidence += 50;
    dataUsed.push("acwr");
    if (numericAcwr >= 0.8 && numericAcwr <= 1.3) {
      readinessScore += 20;
      positiveDrivers.push({ metricId: "acwr", label: "ACWR", value: numericAcwr, impact: "positive", note: "Dans la zone d'adaptation" });
    } else if (numericAcwr > 1.5) {
      readinessScore -= 30;
      negativeDrivers.push({ metricId: "acwr", label: "ACWR", value: numericAcwr, impact: "negative", note: "Surcharge détectée" });
    } else if (numericAcwr < 0.8) {
      readinessScore -= 10;
      negativeDrivers.push({ metricId: "acwr", label: "ACWR", value: numericAcwr, impact: "negative", note: "Sous-entraînement relatif" });
    }
  } else {
    dataMissing.push("acwr");
  }

  if (recoveryRes.confidence > 0) {
    readinessConfidence = Math.min(100, readinessConfidence + 50);
    readinessScore = (readinessScore + recoveryRes.score) / 2;
    dataUsed.push("recovery_score");
    if (recoveryRes.score > 70) {
      positiveDrivers.push({ metricId: "recovery_score", label: "Récupération", value: recoveryRes.score, impact: "positive", note: "Récupération suffisante" });
    } else if (recoveryRes.score < 40) {
      negativeDrivers.push({ metricId: "recovery_score", label: "Récupération", value: recoveryRes.score, impact: "negative", note: "Récupération limitée" });
    }
  } else {
    dataMissing.push("recovery_score");
    limits.push("Score de récupération non disponible pour nuancer la disponibilité.");
  }

  const latestHooper =
    state.hooperLogs.find((l) => l.date === todayStr) ||
    state.hooperLogs.find((l) => l.date === yesterdayStr);

  if (latestHooper) {
    dataUsed.push("hooper_log");
    if (latestHooper.fatigue >= 6) {
      readinessScore -= 15;
      negativeDrivers.push({ metricId: "subjective_fatigue", label: "Fatigue Perçue", value: latestHooper.fatigue, impact: "negative", note: "Fatigue importante" });
    }
    if (latestHooper.soreness >= 6) {
      readinessScore -= 10;
      negativeDrivers.push({ metricId: "subjective_soreness", label: "Douleurs", value: latestHooper.soreness, impact: "negative", note: "Courbatures importantes" });
    }
  } else {
    dataMissing.push("hooper_log");
  }

  const activePainLogs = state.painLogs ? state.painLogs.filter((p) => p.date === todayStr) : [];
  const maxPainIntensity = activePainLogs.reduce((max, log) => Math.max(max, log.intensityActive, log.intensityRest), 0);
  if (maxPainIntensity >= 7) {
    readinessScore = Math.min(30, readinessScore);
    negativeDrivers.push({ metricId: "pain_score", label: "Douleur Aiguë", value: maxPainIntensity, impact: "negative", note: "Plafond préventif appliqué" });
    dataUsed.push("pain_score");
    limits.push("La douleur a plafonné le score de readiness de manière préventive.");
  }

  const checkinWithIllness = state.hooperLogs.find((l) => (l.date === todayStr || l.date === yesterdayStr) && (l.isIll === true || l.notes?.toLowerCase().includes("malade")));
  if (checkinWithIllness) {
    readinessScore = Math.min(25, readinessScore);
    negativeDrivers.push({ metricId: "illness_symptoms", label: "Maladie", value: 1, impact: "negative", note: "Symptômes déclarés" });
    dataUsed.push("illness_symptoms");
    limits.push("Symptômes de maladie déclarés : readiness plafonnée de manière protectrice.");
  }

  readinessScore = Math.max(0, Math.min(100, readinessScore));

  let readinessStatus = "normal";
  if (numericAcwr > 1.5 || recoveryRes.score < 20 || maxPainIntensity >= 7) {
    readinessStatus = "caution";
  } else if (readinessScore > 75) {
    readinessStatus = "optimal";
  } else if (readinessScore > 40) {
    readinessStatus = "normal";
  } else {
    readinessStatus = "low";
  }

  return {
    score: Math.round(readinessScore),
    status: readinessStatus,
    confidence: readinessConfidence,
    positiveDrivers,
    negativeDrivers,
    dataUsed,
    dataMissing,
    limits,
    secureWording: "Disponibilité évaluée via charge (ACWR) et récupération."
  };
}
