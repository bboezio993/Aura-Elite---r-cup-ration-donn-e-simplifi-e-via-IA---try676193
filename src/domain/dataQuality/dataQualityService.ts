import { NormalizedMetric } from '../../types';

export interface DataQuality {
  completeness: number; // 0-100
  freshness: number; // 0-100
  plausibility: number; // 0-100
  sourceReliability: number; // 0-100
  userConfirmed: boolean;
  artifactRisk: "low" | "medium" | "high";
  finalConfidence: number; // 0-100
  flags: string[];
}

export function assessDataQuality(metric: NormalizedMetric, currentTimestamp = new Date().toISOString()): DataQuality {
  let completeness = 100;
  let freshness = 100;
  let plausibility = 100;
  let sourceReliability = 90;
  let userConfirmed = false;
  let artifactRisk: "low" | "medium" | "high" = "low";
  const flags: string[] = [];

  // 1. Freshness Check
  try {
    const metricDate = new Date(metric.timestamp).getTime();
    const currentDate = new Date(currentTimestamp).getTime();
    const diffHours = (currentDate - metricDate) / (1000 * 3600);
    if (diffHours > 24) {
      freshness = Math.max(0, 100 - Math.floor((diffHours - 24) * 2)); // decays after 24 hours
      flags.push("DONNÉE_ANCIENNE");
    }
  } catch (e) {
    freshness = 50;
  }

  // 2. Source Reliability
  if (metric.source === "manual") {
    sourceReliability = 85; // Manual human feeling is reliable but subjective
    userConfirmed = true;
  } else if (metric.source === "garmin") {
    sourceReliability = 95; // Wearables are highly structured
  } else if (metric.source === "derived") {
    sourceReliability = 90; // Calculations are only as reliable as input data
  }

  // 3. Plausibility & Physiologically Impossible Values (Quarantine Check)
  const val = metric.value;
  switch (metric.type) {
    case "hrv_rmssd":
      if (val < 5 || val > 300) {
        plausibility = 30;
        flags.push("HRV_HORS_LIMITES_PHYSIOLOGIQUES");
        artifactRisk = "high";
      } else if (val === 0) {
        plausibility = 0;
        flags.push("HRV_NULLE_IMPOSSIBLE");
      }
      break;
    case "rhr":
      if (val < 28 || val > 150) {
        plausibility = 20;
        flags.push("RHR_IMPOSSIBLE");
        artifactRisk = "high";
      }
      break;
    case "sleep_duration":
      if (val < 0 || val > 24) {
        plausibility = 0;
        flags.push("DURÉE_SOMMEIL_IMPOSSIBLE");
      } else if (val > 18) {
        plausibility = 50;
        flags.push("SOMMEIL_EXTRÊMEMENT_LONG_SUSPECT");
        artifactRisk = "medium";
      }
      break;
    case "sleep_score": // Garmin sleep score
      if (val < 0 || val > 100) {
        plausibility = 0;
        flags.push("SCORE_SOMMEIL_HORS_RANG_0_100");
      }
      break;
    case "weight":
      if (val < 30 || val > 250) {
        plausibility = 10;
        flags.push("POIDS_HORS_LIMITES");
      }
      break;
    case "active_calories":
    case "activity_calories":
    case "energy_intake_kcal":
      if (val < 0 || val > 15000) {
        plausibility = 10;
        flags.push("CALORIES_HORS_LIMITES");
        artifactRisk = "medium";
      }
      break;
    case "stress_score":
      if (val < 0 || val > 100) {
        plausibility = 0;
        flags.push("STRESS_SCORE_HORS_LIMITES");
      }
      break;
    case "respiration_rate":
      if (val < 4 || val > 50) {
        plausibility = 10;
        flags.push("FREQ_RESPIRATOIRE_ATYPIQUE");
      }
      break;
    case "hydration_volume":
      if (val < 0 || val > 10000) {
        plausibility = 10;
        flags.push("HYDRATATION_HORS_LIMITES");
      }
      break;
  }

  // Additional rules from the brief
  // Rule A: Garmin sleep with score but without duration -> flag
  if (metric.source === "garmin" && metric.type === "sleep_score" && metric.value > 0) {
    // Let caller layer metrics checks. If duration is checked together, list flag
  }

  // Rule B: Garmin calories used as estimate, never exact measure -> flag & reduce confidence slightly
  if (metric.source === "garmin" && (metric.type === "active_calories" || metric.type === "activity_calories" || metric.type === "training_load")) {
    flags.push("DONNÉE_ESTIMATIV_SUJET_A_VARIATION");
    sourceReliability = Math.min(sourceReliability, 85);
  }

  // Calcul final de confiance
  const finalConfidence = Math.round(
    (completeness * 0.15) + (freshness * 0.25) + (plausibility * 0.35) + (sourceReliability * 0.25)
  );

  return {
    completeness,
    freshness,
    plausibility,
    sourceReliability,
    userConfirmed,
    artifactRisk,
    finalConfidence,
    flags
  };
}
