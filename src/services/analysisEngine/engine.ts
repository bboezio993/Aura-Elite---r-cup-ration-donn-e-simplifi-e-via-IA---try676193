import { AppState } from "../../store/useStore";
import { EngineScores, GarminActivity, SessionRPE } from "../../types";

import { runBaselineEngine } from "./baselineEngine";
import { runRecoveryEngine } from "./recoveryEngine";
import { runSleepEngine } from "./sleepEngine";
import { runTrainingLoadEngine } from "./trainingLoadEngine";
import { runNutritionEngine } from "./nutritionEngine";
import { runMentalLoadEngine } from "./mentalLoadEngine";
import { runContextEngine } from "./contextEngine";
import { runRiskBoundaryEngine } from "./riskBoundaryEngine";
import { runReadinessEngine } from "./readinessEngine";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface Driver {
  metricId: string;
  label: string;
  impact: "positive" | "negative" | "neutral";
  value: string | number;
  note: string;
}

/**
 * Construit un tableau des charges quotidiennes sur les N derniers jours
 */
export const buildDailyLoads = (
  activities: GarminActivity[],
  rpeLogs: SessionRPE[],
  days: number,
  targetDate: Date,
): number[] => {
  const loads: number[] = new Array(days).fill(0);
  const targetTime = targetDate.getTime();

  for (let i = 0; i < days; i++) {
    const d = new Date(targetTime - i * MS_PER_DAY);
    const dateStr = d.toISOString().split("T")[0];

    let dailyLoad = 0;
    const dayActivities = activities.filter((a) => a.date.startsWith(dateStr));
    dayActivities.forEach((act) => {
      if (act.tss) {
        dailyLoad += act.tss;
      } else {
        const rpe = rpeLogs.find((r) => r.activityId === act.id);
        if (rpe) {
          dailyLoad += rpe.rpe * rpe.durationMinutes;
        } else {
          const durationMins = act.duration
            ? parseInt(act.duration.split(":")[0]) * 60 +
              parseInt(act.duration.split(":")[1])
            : 60;
          dailyLoad += durationMins * 5; // sRPE average guess (RPE 5)
        }
      }
    });
    loads[days - 1 - i] = dailyLoad;
  }
  return loads;
};

export const runAnalysisEngine = (state: AppState): EngineScores => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Execute each specialized sub-engine
  const baselineRes = runBaselineEngine(state);
  const recoveryRes = runRecoveryEngine(state);
  const sleepRes = runSleepEngine(state);
  const nutritionRes = runNutritionEngine(state);
  const mentalRes = runMentalLoadEngine(state);
  const trainingRes = runTrainingLoadEngine(state);
  const contextRes = runContextEngine(state);
  const riskRes = runRiskBoundaryEngine(state, trainingRes, recoveryRes, sleepRes, nutritionRes, contextRes);
  const readinessRes = runReadinessEngine(state, recoveryRes, trainingRes);

  const acwrValue = trainingRes.positiveDrivers.find(d => d.metricId === "acwr")?.value 
    || trainingRes.negativeDrivers.find(d => d.metricId === "acwr")?.value 
    || undefined;
  const numericAcwr = typeof acwrValue === "string" ? parseFloat(acwrValue) : acwrValue;

  return {
    date: todayStr,
    performanceReadiness: {
      score: readinessRes.score,
      confidence: readinessRes.confidence,
      status: readinessRes.status as any
    },
    recoveryStatus: {
      score: recoveryRes.score,
      confidence: recoveryRes.confidence,
      status: recoveryRes.status as any
    },
    sleepHealth: {
      score: sleepRes.score,
      confidence: sleepRes.confidence,
      status: sleepRes.status as any
    },
    nutritionAdequacy: {
      score: nutritionRes.score,
      confidence: nutritionRes.confidence,
      status: nutritionRes.status as any
    },
    psychologicalLoad: {
      score: mentalRes.score,
      confidence: mentalRes.confidence,
      status: mentalRes.status as any
    },
    riskBoundary: {
      flags: riskRes.flags,
      level: riskRes.level
    },
    globalActionPriority: riskRes.globalActionPriority,
    acwr: numericAcwr,
    trends: {
      hrv: baselineRes.trends?.hrv || "stable",
      recovery: recoveryRes.trends?.recovery || "stable"
    }
  };
};
