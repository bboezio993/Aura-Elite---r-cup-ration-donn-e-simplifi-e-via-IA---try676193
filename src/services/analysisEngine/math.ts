export const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

export const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

export const calculateMAD = (values: number[], median?: number): number => {
  if (values.length === 0) return 0;
  const med = median !== undefined ? median : calculateMedian(values);
  const deviations = values.map(v => Math.abs(v - med));
  return calculateMedian(deviations) * 1.4826; // Scale factor for normal distribution
};

export const calculateStdDev = (values: number[], mean?: number): number => {
  if (values.length < 2) return 0;
  const m = mean !== undefined ? mean : calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

export const calculateZScore = (value: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
};

export const calculateCV = (mean: number, stdDev: number): number => {
  if (mean === 0) return 0;
  return (stdDev / mean) * 100;
};

/**
 * Exponentially Weighted Moving Average (EWMA)
 * Utilisé pour calculer la charge chronique (Chronic Training Load) ou aiguë (Acute Training Load).
 * @param values Tableau des valeurs quotidiennes (doit inclure les jours à 0)
 * @param lambda Constante de lissage (ex: 2 / (N + 1) où N = 7 ou 28)
 */
export const calculateEWMA = (values: number[], lambda: number): number => {
  if (values.length === 0) return 0;
  
  // Initialisation avec la première valeur (ou la moyenne des premières valeurs)
  let ewma = values[0];
  
  for (let i = 1; i < values.length; i++) {
    ewma = (values[i] * lambda) + (ewma * (1 - lambda));
  }
  
  return ewma;
};

/**
 * Calcule l'ACWR (Acute:Chronic Workload Ratio) en utilisant le modèle EWMA
 * @param dailyLoads Tableau des charges quotidiennes sur les 28-35 derniers jours
 */
export const calculateEWMA_ACWR = (dailyLoads: number[]): { acute: number, chronic: number, ratio: number } => {
  if (dailyLoads.length === 0) return { acute: 0, chronic: 0, ratio: 0 };
  
  const lambdaAcute = 2 / (7 + 1); // 7 jours
  const lambdaChronic = 2 / (28 + 1); // 28 jours
  
  const acute = calculateEWMA(dailyLoads, lambdaAcute);
  const chronic = calculateEWMA(dailyLoads, lambdaChronic);
  
  const ratio = chronic > 0 ? acute / chronic : 0;
  
  return { acute, chronic, ratio };
};
