import { NutritionGoal } from "../domain/nutrition/foodTypes";

export type ReadinessScore = number; // 0-100

export type DataSource = "garmin" | "manual" | "derived";

export interface AllergenBypassLog {
  id: string;
  date: string;
  foodId: string;
  foodName: string;
  allergenDetected: string;
  mealType: string;
  userConfirmed: boolean;
  notes?: string;
}

export interface UserProfile {
  general: {
    name: string;
    age: number | null;
    gender: "male" | "female" | "non-binary" | "prefer-not-to-say" | "";
    height: number | null; // cm
    weight: number | null; // kg
    activityLevel:
      | "sedentary"
      | "light"
      | "moderate"
      | "active"
      | "athlete"
      | "";
    primaryGoal: string;
  };
  health: {
    conditions: string[];
    allergies: string[];
    injuries: string[];
    medications: string[];
  };
  sport: {
    primarySport: string;
    trainingFrequency: number; // sessions per week
    weeklyVolume: number; // hours
    intensity: "low" | "medium" | "high" | "variable" | "";
  };
  preferences: {
    units: "metric" | "imperial";
    enableMenstrualTracking: boolean;
    notificationsEnabled: boolean;
    dataSharingConsent: boolean;
  };
  nutritionGoal?: NutritionGoal;
  favoriteFoodIds?: string[];
  favoriteRecipeIds?: string[];
}

export interface MenstrualLog {
  id: string;
  date: string; // ISO 8601
  flow: "none" | "spotting" | "light" | "medium" | "heavy";
  painLevel: number; // 0-10
  symptoms: string[]; // e.g., 'cramps', 'headache', 'bloating', 'fatigue', 'mood_swings'
  sleepQuality: number; // 0-100
  notes: string;
}

export type MetricId = keyof typeof import("../domain/metrics/metricRegistry").metricRegistry;

export interface NormalizedMetric {
  id: string;
  source: DataSource;
  sourceId?: string; // Reference to the import log or file
  timestamp: string; // ISO 8601
  type: MetricId | string; // Cannonical ID defined in metricRegistry (string as fallback for parsing until stricted)
  value: number;
  unit: string;
  confidenceScore: number; // 0-100 (Couche A: Qualité de la donnée)
}

export interface RejectedMetric {
  id: string;
  metric: any; // Raw or partial metric
  reason: string;
  source: string;
  timestamp: string;
  typeProposed: string;
  value: number;
  unit: string;
  confidenceScore: number;
  importLogId?: string;
}

// Couche G: Monitoring Quotidien (Hooper Index étendu)
export interface HooperLog {
  id: string;
  date: string; // YYYY-MM-DD
  fatigue: number; // 1-7 (1 = Très en forme, 7 = Épuisé)
  stress: number; // 1-7 (1 = Très détendu, 7 = Très stressé)
  sleepQuality: number; // 1-7 (1 = Excellent, 7 = Très mauvais)
  soreness: number; // 1-7 (1 = Aucune douleur, 7 = Très douloureux)
  mood: number; // 1-7 (1 = Très motivé/Heureux, 7 = Déprimé/Apathique)
  motivation?: number; // 1-7
  painLevel?: number; // 0-10
  digestion?: number; // 1-5
  appetite?: number; // 1-5
  recovery?: number; // 1-10
  isIll?: boolean;
  notes?: string;
}

// Couche C: RPE de séance (Session RPE)
export interface SessionRPE {
  id: string;
  activityId: string; // Lien avec GarminActivity
  date: string;
  rpe: number; // 1-10 (Échelle de Borg modifiée CR10)
  durationMinutes: number;
  feeling: number; // 1-5 (1 = Très mauvais, 5 = Très bon)
  pain?: string; // Localisation douleur si existante
  muscularLoad?: number; // 0-10
  cardioLoad?: number; // 0-10
  painDuring?: boolean;
  postPainIntensity?: number; // 0-10
  techniqueSensation?: number; // 1-5
  conformanceToPlan?: boolean;
  comment?: string;
}

// Couche D: Contexte de Vie
export interface LifeContextLog {
  id: string;
  date: string; // YYYY-MM-DD
  travel: boolean;
  jetlag: boolean;
  alcohol: boolean;
  lateMeal: boolean;
  heat: boolean;
  altitude: boolean;
  stressEx: boolean;
  exams: boolean;
  meds: boolean;
  cycle: boolean;
  competition: boolean;
  interruptedNight: boolean;
  notes?: string;
}

// Couche G: Screening Hebdomadaire (Santé Mentale)
export interface WeeklyScreeningLog {
  id: string;
  date: string;
  pssScore: number; // Perceived Stress Scale (0-40)
  phq9Score: number; // Patient Health Questionnaire (0-27)
  gad7Score: number; // Generalized Anxiety Disorder (0-21)
}

// Couche B: Structure de Baseline Individuelle
export interface BaselineStats {
  currentValue: number;
  count: number;
  maturity: "insufficient" | "exploratory" | "preliminary" | "usable" | "robust";
  mean7d: number;
  std7d: number;
  mean14d: number;
  mean28d: number;
  std28d: number;
  mean42d: number;
  mean90d: number;
  median28d: number;
  mad28d: number;
  zScore7d: number; // (current - mean7d) / std7d
  zScore28d: number;
  robustZScore28d: number; // (current - median28d) / mad28d
  cv28d: number; // Coefficient de variation (std/mean)
  trend: "increasing" | "decreasing" | "stable";
}

// Moteur de Fusion: Les 6 Scores Principaux
export interface EngineScores {
  date: string;
  performanceReadiness: {
    score: number;
    confidence: number;
    status: "optimal" | "normal" | "low" | "reduced" | "caution";
  };
  recoveryStatus: {
    score: number;
    confidence: number;
    status: "recovered" | "adapting" | "fatigued" | "exhausted";
  };
  sleepHealth: {
    score: number;
    confidence: number;
    status: "optimal" | "adequate" | "debt" | "severe_debt";
  };
  nutritionAdequacy: {
    score: number;
    confidence: number;
    status: "optimal" | "adequate" | "low" | "incomplete" | "watch";
  };
  psychologicalLoad: {
    score: number;
    confidence: number;
    status: "low" | "moderate" | "high" | "overload";
  };
  riskBoundary: {
    flags: string[];
    level: "none" | "monitor" | "warning" | "professional_evaluation";
  };
  globalActionPriority: string; // ex: "Priorité Sommeil", "Feu Vert Entraînement", "Vigilance Charge"
  acwr?: number; // Acute:Chronic Workload Ratio
  trends?: {
    hrv: "up" | "down" | "stable";
    recovery: "improving" | "declining" | "stable";
  };
}

export interface ConnectionState {
  source: DataSource;
  status: "disconnected" | "connected" | "error" | "syncing";
  lastSync?: string;
  name: string;
  icon: string;
  description: string;
}

export interface DailyMetrics {
  date: string;
  hrv: number; // Variabilité de la fréquence cardiaque
  rhr: number; // Fréquence cardiaque au repos
  sleepDuration: number; // en heures
  sleepQuality: number; // 0-100
  rpe: number; // Intensité perçue (0-10)
  stressLevel: number; // 0-10
  mood: string;
  soreness: number; // 0-10
  weight: number;
}

export interface Recommendation {
  id: string;
  category: "training" | "nutrition" | "recovery" | "lifestyle";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  scientificBasis?: string;
}

export interface AnalysisResult {
  readinessScore: ReadinessScore;
  status: "optimal" | "stable" | "strained" | "critical";
  summary: string;
  recommendations: Recommendation[];
  trends: {
    hrv: "up" | "down" | "stable";
    recovery: "improving" | "declining" | "stable";
  };
}

// --- Garmin Import Hub Types ---

export type GarminImportType = "history" | "wellness" | "activity";

export interface GarminImportLog {
  id: string;
  type: GarminImportType;
  filename: string;
  importDate: string; // ISO 8601
  dateCovered?: string; // For wellness/activity, the specific date it covers
  status:
    | "success"
    | "partial"
    | "error"
    | "duplicate"
    | "warning"
    | "processing";
  recordsAdded: number;
  recordsIgnored?: number;
  errorMessage?: string;
  details?: Record<string, any>;
}

export interface GarminActivity {
  id: string; // Robust hash or composite key
  sourceId?: string; // Reference to the import log
  date: string; // ISO 8601
  type: string;
  title: string;
  distance: number; // km
  duration: string; // HH:MM:SS
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  calories: number | null;
  tss: number | null;
  // ... other metrics can be added as needed
}

export * from '../domain/nutrition/foodTypes';

export interface PainLog {
  id: string;
  date: string; // YYYY-MM-DD
  location: string; // e.g., 'Knee', 'Lower Back'
  side: "left" | "right" | "bilateral" | "none";
  type: "muscular" | "tendinous" | "articular" | "osseux" | "nervous" | "unknown";
  intensityRest: number; // 0-10
  intensityActive: number; // 0-10
  onset: "onset_sudden" | "onset_gradual";
  aggravatedBy?: string;
  relievedBy?: string;
  impact: string; // 'none' | 'modified_training' | 'no_training'
  notes?: string;
  evolutionTime?: string; // progressive, stable, improvement, healing
  historyEpisodes?: string; // first occurrence, recurring
}


