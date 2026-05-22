import { NormalizedMetric, BaselineStats } from '../../types';
import { calculateMean, calculateStdDev, calculateZScore, calculateCV, calculateMedian, calculateMAD } from './math';

/**
 * Filtre les métriques d'un certain type sur une période donnée (en jours)
 */
const getMetricsForPeriod = (
  metrics: NormalizedMetric[], 
  type: NormalizedMetric['type'], 
  targetDate: Date, 
  days: number
): number[] => {
  const targetTime = targetDate.getTime();
  const periodMs = days * 24 * 60 * 60 * 1000;
  
  return metrics
    .filter(m => m.type === type)
    .filter(m => {
      const mTime = new Date(m.timestamp).getTime();
      return mTime <= targetTime && mTime > (targetTime - periodMs);
    })
    .map(m => m.value);
};

/**
 * Couche B : Calcule la baseline individuelle pour une métrique spécifique à une date donnée.
 * Ne se compare pas à une norme populationnelle, mais à l'historique de l'athlète.
 */
export const calculateBaseline = (
  metrics: NormalizedMetric[],
  type: NormalizedMetric['type'],
  targetDateStr: string
): BaselineStats | null => {
  const targetDate = new Date(targetDateStr);
  
  // Récupérer la valeur du jour (ou la plus récente dans les 24h)
  const todayValues = getMetricsForPeriod(metrics, type, targetDate, 1);
  if (todayValues.length === 0) return null;
  
  const currentValue = todayValues[todayValues.length - 1]; // Prendre la dernière si plusieurs
  
  // Récupérer l'historique étendu
  const values7d = getMetricsForPeriod(metrics, type, targetDate, 7);
  const values14d = getMetricsForPeriod(metrics, type, targetDate, 14);
  const values28d = getMetricsForPeriod(metrics, type, targetDate, 28);
  const values42d = getMetricsForPeriod(metrics, type, targetDate, 42);
  const values90d = getMetricsForPeriod(metrics, type, targetDate, 90);
  
  const count = values90d.length;
  
  let maturity: "insufficient" | "exploratory" | "preliminary" | "usable" | "robust" = "insufficient";
  if (count >= 90) maturity = "robust";
  else if (count >= 28) maturity = "usable";
  else if (count >= 14) maturity = "preliminary";
  else if (count >= 5) maturity = "exploratory";
  
  if (maturity === "insufficient") {
    return null;
  }

  const mean7d = calculateMean(values7d);
  const std7d = calculateStdDev(values7d, mean7d);
  const mean14d = calculateMean(values14d);
  const mean28d = calculateMean(values28d);
  const std28d = calculateStdDev(values28d, mean28d);
  const mean42d = calculateMean(values42d);
  const mean90d = calculateMean(values90d);
  
  const median28d = calculateMedian(values28d);
  const mad28d = calculateMAD(values28d, median28d);
  
  const zScore7d = calculateZScore(currentValue, mean7d, std7d);
  const zScore28d = calculateZScore(currentValue, mean28d, std28d);
  const robustZScore28d = mad28d > 0 ? (currentValue - median28d) / mad28d : 0;
  
  const cv28d = calculateCV(mean28d, std28d);
  
  // Détermination de la tendance (très basique pour l'instant)
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (mean7d > mean28d + (std28d * 0.5)) trend = 'increasing';
  if (mean7d < mean28d - (std28d * 0.5)) trend = 'decreasing';

  return {
    currentValue,
    count,
    maturity,
    mean7d,
    std7d,
    mean14d,
    mean28d,
    std28d,
    mean42d,
    mean90d,
    median28d,
    mad28d,
    zScore7d,
    zScore28d,
    robustZScore28d,
    cv28d,
    trend
  };
};
