import { NormalizedMetric, DataSource } from "../../types";
import { metricRegistry } from "./metricRegistry";
import { assessDataQuality, DataQuality } from "../dataQuality/dataQualityService";

export interface MetricCreationResult {
  success: boolean;
  metric?: NormalizedMetric;
  quality?: DataQuality;
  reason?: string;
  typeProposed: string;
  valueProposed: number;
}

/**
 * Unique metric factory designed to enforce runtime constraints
 * on all imported (Garmin), manual (user checks), and calculated (internal) metrics.
 */
export function createValidatedMetric(params: {
  source: DataSource;
  timestamp: string;
  type: string;
  value: number;
  unit: string;
  sourceId?: string;
}): MetricCreationResult {
  const { source, timestamp, type, value, unit, sourceId } = params;

  // 1. Confirm inclusion in reference registry
  if (!metricRegistry[type]) {
    return {
      success: false,
      reason: `Type de métrique inconnu dans le registre : "${type}"`,
      typeProposed: type,
      valueProposed: value,
    };
  }

  const def = metricRegistry[type];

  // 2. Unit normalization check if mismatched
  let finalUnit = unit;
  let finalValue = value;

  // Simple convert if allowedUnits is defined but doesn't match
  if (def.allowedUnits.length > 0 && !def.allowedUnits.includes(unit)) {
    // Attempt automatic conversion for known standard mismatched patterns
    if (unit === "L" && def.allowedUnits.includes("ml")) {
      finalValue = value * 1000;
      finalUnit = "ml";
    } else if (unit === "ml" && def.allowedUnits.includes("L")) {
      finalValue = value / 1000;
      finalUnit = "L";
    } else if (unit === "sec" && def.allowedUnits.includes("min")) {
      finalValue = value / 60;
      finalUnit = "min";
    } else {
      // Keep it but alert in warnings index or fallback
      finalUnit = def.unit;
    }
  }

  // Ensure hydration volume does not mismatch with session calories
  if (type === "hydration_volume" && finalUnit === "kcal") {
    return {
      success: false,
      reason: "Incohérence d'unité flagrante : hydratation mesurée en kilocalories !",
      typeProposed: type,
      valueProposed: value,
    };
  }

  const normalizedMetric: NormalizedMetric = {
    id: `${type}_${timestamp}_${source}_${Math.random().toString(36).substring(2, 7)}`,
    source,
    sourceId,
    timestamp,
    type,
    value: finalValue,
    unit: finalUnit,
    confidenceScore: 100, // will be evaluated
  };

  // 3. Assess Data Quality (Freshness, Plausibility, Source, Artifact Risk)
  const quality = assessDataQuality(normalizedMetric);
  normalizedMetric.confidenceScore = quality.finalConfidence;

  // 4. Quarantine Check: Reject under 50% confidence (Physiologically impossible, negative etc.)
  if (quality.finalConfidence < 50) {
    const reasonText = `Donnée de faible qualité (${quality.finalConfidence}%) : ${quality.flags.join(", ") || "hors limites physiologiques."}`;
    return {
      success: false,
      reason: reasonText,
      typeProposed: type,
      valueProposed: value,
      metric: normalizedMetric, // Keep original candidate for quarantine logging
      quality,
    };
  }

  return {
    success: true,
    metric: normalizedMetric,
    quality,
    typeProposed: type,
    valueProposed: value,
  };
}
