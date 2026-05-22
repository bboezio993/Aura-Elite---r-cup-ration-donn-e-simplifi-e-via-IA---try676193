import { AppState } from "../../store/useStore";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";

export function runMentalLoadEngine(state: AppState): ModularEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const latestHooper =
    state.hooperLogs.find((l) => l.date === todayStr) ||
    state.hooperLogs.find((l) => l.date === yesterdayStr);

  const dataUsed: string[] = [];
  const dataMissing: string[] = [];
  const limits: string[] = [];
  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];

  let psychScore = 50;
  let confidence = 0;

  if (latestHooper) {
    confidence += 50;
    dataUsed.push("hooper_stress", "hooper_mood");
    // Hooper stress & mood are 1-7. Lower is better.
    // Normalized representation
    psychScore = ((latestHooper.stress + latestHooper.mood) / 14) * 100;

    const stressDriver: Driver = {
      metricId: "subjective_stress",
      label: "Tension nerveuse perçue",
      impact: latestHooper.stress > 4 ? "negative" : "positive",
      value: `${latestHooper.stress}/7`,
      note: "Indice stress journalier."
    };
    if (latestHooper.stress > 4) negativeDrivers.push(stressDriver);
    else positiveDrivers.push(stressDriver);
  } else {
    dataMissing.push("hooper_checkin");
    limits.push("Aucun check-in d'état mental quotidien récent.");
  }

  const latestScreening = state.weeklyScreeningLogs && state.weeklyScreeningLogs.length > 0
    ? state.weeklyScreeningLogs[state.weeklyScreeningLogs.length - 1]
    : null;

  if (latestScreening) {
    confidence += 50;
    dataUsed.push("weekly_screening_pss", "weekly_screening_phq9", "weekly_screening_gad7");

    const pssNorm = 100 - (latestScreening.pssScore / 40) * 100;
    const phq9Norm = 100 - (latestScreening.phq9Score / 27) * 100;
    const gad7Norm = 100 - (latestScreening.gad7Score / 21) * 100;
    const screeningScore = pssNorm * 0.4 + phq9Norm * 0.3 + gad7Norm * 0.3;
    const invertedScreening = 100 - screeningScore;

    if (confidence === 100) {
      psychScore = psychScore * 0.4 + invertedScreening * 0.6;
    } else {
      psychScore = invertedScreening;
    }

    positiveDrivers.push({
      metricId: "weekly_screening",
      label: "Questionnaire hebdomadaire",
      impact: invertedScreening < 40 ? "positive" : "neutral",
      value: "Complété",
      note: `Scores : PSS=${latestScreening.pssScore}, PHQ9=${latestScreening.phq9Score}.`
    });
  } else {
    dataMissing.push("weekly_screening_log");
    limits.push("Pas de questionnaire d'évaluation psychosociale de base réalisé cette semaine.");
  }

  psychScore = Math.max(0, Math.min(100, psychScore));
  const roundedScore = Math.round(psychScore);

  let status: "low" | "moderate" | "high" | "overload" = "moderate";
  if (roundedScore > 80) status = "overload";
  else if (roundedScore > 60) status = "high";
  else if (roundedScore > 30) status = "moderate";
  else status = "low";

  let secureWording = "Niveau de stress perçu et d'énergie mentale sous contrôle.";
  if (status === "high" || status === "overload") {
    secureWording = "Disponibilité d'attention réduite sous l'effet de tensions émotionnelles ou cognitives temporaires.";
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
