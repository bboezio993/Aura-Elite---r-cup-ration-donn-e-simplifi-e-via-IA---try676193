import { NormalizedMetric } from '../../types';

export function convertWeight(value: number, from: "g" | "kg" | "lbs", to: "g" | "kg" | "lbs"): number {
  if (from === to) return value;
  // Standardize to kg first
  let kg = value;
  if (from === "g") kg = value / 1000;
  else if (from === "lbs") kg = value * 0.45359237;

  // Convert from kg to target
  if (to === "g") return kg * 1000;
  if (to === "lbs") return kg / 0.45359237;
  return kg;
}

export function convertDistance(value: number, from: "m" | "km" | "mi", to: "m" | "km" | "mi"): number {
  if (from === to) return value;
  // Standardize to meters
  let meters = value;
  if (from === "km") meters = value * 1000;
  else if (from === "mi") meters = value * 1609.344;

  // Convert to target
  if (to === "km") return meters / 1000;
  if (to === "mi") return meters / 1609.344;
  return meters;
}

export function convertEnergy(value: number, from: "kcal" | "kJ", to: "kcal" | "kJ"): number {
  if (from === to) return value;
  if (from === "kcal" && to === "kJ") return value * 4.184;
  if (from === "kJ" && to === "kcal") return value / 4.184;
  return value;
}

export function convertVolume(value: number, from: "ml" | "L" | "oz", to: "ml" | "L" | "oz"): number {
  if (from === to) return value;
  // Standardize to ml
  let ml = value;
  if (from === "L") ml = value * 1000;
  else if (from === "oz") ml = value * 29.5735;

  // Convert to target
  if (to === "L") return ml / 1000;
  if (to === "oz") return ml / 29.5735;
  return ml;
}

export function convertDuration(value: number, from: "s" | "min" | "h", to: "s" | "min" | "h"): number {
  if (from === to) return value;
  // Standardize to seconds
  let seconds = value;
  if (from === "min") seconds = value * 60;
  else if (from === "h") seconds = value * 3600;

  // Convert to target
  if (to === "min") return seconds / 60;
  if (to === "h") return seconds / 3600;
  return seconds;
}

/**
 * Normalizes a metric's structure and guarantees units conform to Aura Elite standard:
 * - weight -> kg
 * - distance -> km
 * - active_calories / activity_calories -> kcal
 * - hydration_volume -> ml
 * - sleep_duration / activity_duration -> h/min
 */
export function normalizeMetric(metric: NormalizedMetric): NormalizedMetric {
  const norm = { ...metric };
  
  // Guard for invalid values
  if (isNaN(norm.value) || norm.value === null || norm.value === undefined) {
    norm.value = 0;
  }

  switch (norm.type) {
    case "weight":
      if (norm.unit === "lbs") {
        norm.value = convertWeight(norm.value, "lbs", "kg");
        norm.unit = "kg";
      } else if (norm.unit === "g") {
        norm.value = convertWeight(norm.value, "g", "kg");
        norm.unit = "kg";
      }
      break;
    case "steps":
      norm.unit = "steps";
      break;
    case "sleep_duration":
      if (norm.unit === "s" || norm.unit === "sec") {
        norm.value = convertDuration(norm.value, "s", "h");
        norm.unit = "h";
      } else if (norm.unit === "min") {
        norm.value = convertDuration(norm.value, "min", "h");
        norm.unit = "h";
      }
      break;
    case "active_calories":
    case "activity_calories":
    case "energy_intake_kcal":
      if (norm.unit === "kJ") {
        norm.value = convertEnergy(norm.value, "kJ", "kcal");
        norm.unit = "kcal";
      }
      break;
  }

  return norm;
}
