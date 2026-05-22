import { AppState } from "../../store/useStore";
import { calculateBaseline } from "./baselines";
import { ModularEngineResult } from "./types";

export function runBaselineEngine(state: AppState): ModularEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const trackedMetrics = ["hrv_rmssd", "rhr", "sleep_duration"];
  
  const datUsed: string[] = [];
  const datMissing: string[] = [];
  const limits: string[] = [];
  
  let totalScore = 0;
  let count = 0;
  let minMaturity = "robust";
  
  const maturityLevels = {
    insufficient: 0,
    exploratory: 1,
    preliminary: 2,
    usable: 3,
    robust: 4
  };
  
  let hrvTrend: "up" | "down" | "stable" = "stable";
  
  trackedMetrics.forEach(mId => {
    const baseline = calculateBaseline(state.metrics, mId as any, todayStr);
    if (baseline) {
      if (mId === "hrv_rmssd") {
        if (baseline.trend === "increasing") hrvTrend = "up";
        else if (baseline.trend === "decreasing") hrvTrend = "down";
      }
      datUsed.push(mId);
      totalScore += baseline.cv28d < 15 ? 90 : 70; // Low CV = better stability
      if (maturityLevels[baseline.maturity] < maturityLevels[minMaturity as keyof typeof maturityLevels]) {
        minMaturity = baseline.maturity;
      }
      count++;
    } else {
      datMissing.push(mId);
      minMaturity = "insufficient";
    }
  });
  
  const confidenceMap = {
    insufficient: 0,
    exploratory: 30,
    preliminary: 50,
    usable: 80,
    robust: 95
  };
  
  const confidence = confidenceMap[minMaturity as keyof typeof confidenceMap];
  const score = count > 0 ? Math.round(totalScore / count) : 0;
  
  let status = "calibrating";
  let secureWording = "Calibrage initial en cours. Vos données physiologiques de référence se stabilisent au fil des jours.";
  
  if (minMaturity === "robust") {
    status = "established";
    secureWording = "Profil de référence physiologique établi. Analyse temporelle robuste sur un cycle de 90 jours.";
  } else if (minMaturity === "usable") {
    status = "established";
    secureWording = "Profil de référence physiologique établi. Vos écarts journaliers sont comparés à vos normales sur 28 jours.";
  } else if (minMaturity === "preliminary") {
    status = "calibrating";
    secureWording = "Tendance préliminaire. (14 à 27 jours de recul). L'analyse est encore basique.";
  } else if (minMaturity === "exploratory") {
    status = "calibrating";
    secureWording = "Phase exploratoire. Moins de 14 jours de données disponibles. Interprétation prudente.";
    limits.push("Le recul est trop faible pour des déductions statistiques fiables.");
  } else {
    limits.push("Moins de 5 points de données enregistrés pour certaines métriques.");
  }
  
  return {
    score,
    status,
    confidence,
    positiveDrivers: [],
    negativeDrivers: [],
    dataUsed: datUsed,
    dataMissing: datMissing,
    limits,
    secureWording,
    trends: {
      hrv: hrvTrend
    }
  };
}
