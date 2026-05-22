import { AppState } from "../../store/useStore";
import { buildDailyLoads } from "./engine";
import { calculateEWMA_ACWR } from "./math";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";

export function runTrainingLoadEngine(state: AppState): ModularEngineResult {
  const today = new Date();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  let analysisDate = today;
  if (state.garminActivities.length > 0) {
    const lastActivityDate = new Date(state.garminActivities[0].date);
    if (today.getTime() - lastActivityDate.getTime() > 7 * MS_PER_DAY) {
      analysisDate = lastActivityDate;
    }
  }

  const dailyLoads35d = buildDailyLoads(
    state.garminActivities,
    state.sessionRpeLogs,
    35,
    analysisDate,
  );

  const acwrData = calculateEWMA_ACWR(dailyLoads35d);
  const acwr = acwrData.ratio;

  // Monotony & Strain
  const acuteMean = acwrData.acute;
  const acuteLoads = dailyLoads35d.slice(28); // 7 days
  const sumAcute = acuteLoads.reduce((a, b) => a + b, 0);
  const meanAcute = sumAcute / 7;
  const devAcuteSum = acuteLoads.reduce((a, b) => a + Math.pow(b - meanAcute, 2), 0);
  const stdAcute = Math.sqrt(devAcuteSum / 7) || 1;
  const monotony = meanAcute / stdAcute;
  const strain = sumAcute * monotony;

  const dataUsed = ["garmin_activities", "rpe_logs"];
  const dataMissing: string[] = [];
  const limits: string[] = [];
  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];

  if (state.garminActivities.length === 0 && state.sessionRpeLogs.length === 0) {
    dataMissing.push("garmin_activities", "rpe_logs");
    limits.push("Aucune session d'entraînement ou enregistrement RPE pour calculer la charge cumulée.");
  }

  const confidence = state.garminActivities.length > 0 ? 95 : 30;
  
  // Normalized score where 100 = perfect sweetspot (ACWR ~1.0) and declines if under or overtraining
  let score = 50;
  let status = "normal";
  let secureWording = "Volume et contrainte d'effort constants par rapport à votre historique habituel.";

  if (acwr > 0) {
    if (acwr >= 0.8 && acwr <= 1.3) {
      score = 90;
      status = "optimal";
      secureWording = "Ratio de progression optimal (zone idéale d'effort protecteur).";
      positiveDrivers.push({
        metricId: "acwr",
        label: "Ratio ACWR",
        impact: "positive",
        value: acwr.toFixed(2),
        note: "Indicateur d'équilibre de charge optimal."
      });
    } else if (acwr > 1.5) {
      score = 30;
      status = "strained";
      secureWording = "Augmentation brutale de l'intensité ou du volume d'activité relative à vos capacités habituelles.";
      negativeDrivers.push({
        metricId: "acwr",
        label: "Ratio ACWR",
        impact: "negative",
        value: acwr.toFixed(2),
        note: "Charge aiguë élevée par rapport à votre historique récent."
      });
    } else if (acwr < 0.8) {
      score = 45;
      status = "underloaded";
      secureWording = "Volume récent très bas, suggérant une réduction de l'accoutumance protectrice à l'effort.";
      limits.push("La sous-charge prolongée diminue l'adaptation physique.");
    }
  }

  return {
    score,
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
