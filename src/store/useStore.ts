import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import { NormalizedMetric, ConnectionState, DataSource, UserProfile, MenstrualLog, GarminImportLog, GarminActivity, HooperLog, SessionRPE, LifeContextLog, EngineScores, WeeklyScreeningLog, MealLog, PainLog, RejectedMetric, Recipe, AllergenBypassLog } from '../types';
import { runAnalysisEngine } from '../services/analysisEngine/engine';
import { 
  syncProfileToFirestore, 
  syncMealLogToFirestore, 
  deleteMealLogFromFirestore, 
  syncRecipeToFirestore, 
  deleteRecipeFromFirestore, 
  syncHooperLogToFirestore, 
  syncSessionRpeToFirestore, 
  syncPainLogToFirestore, 
  syncMenstrualLogToFirestore, 
  syncContextLogToFirestore, 
  syncAllergenBypassLogToFirestore,
  syncWeeklyScreeningLogToFirestore
} from '../services/firebaseSync';
import { metricRegistry } from '../domain/metrics/metricRegistry';
import { createValidatedMetric } from '../domain/metrics/metricFactory';

// Custom storage for IndexedDB
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export interface AppState {
  metrics: NormalizedMetric[];
  rejectedMetrics: RejectedMetric[];
  connections: Record<DataSource, ConnectionState>;
  userProfile: UserProfile;
  menstrualLogs: MenstrualLog[];
  garminImportLogs: GarminImportLog[];
  garminActivities: GarminActivity[];
  hooperLogs: HooperLog[];
  sessionRpeLogs: SessionRPE[];
  weeklyScreeningLogs: WeeklyScreeningLog[];
  mealLogs: MealLog[];
  painLogs: PainLog[];
  contextLogs: LifeContextLog[];
  engineScores: EngineScores | null;
  recipes: Recipe[];
  allergenBypassLogs: AllergenBypassLog[];
  addMetric: (metric: NormalizedMetric) => void;
  addMetrics: (metrics: NormalizedMetric[]) => void;
  updateConnection: (source: DataSource, status: ConnectionState['status']) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  addMenstrualLog: (log: MenstrualLog) => void;
  addGarminImportLog: (log: GarminImportLog) => void;
  updateGarminImportLog: (id: string, updates: Partial<GarminImportLog>) => void;
  addGarminActivities: (activities: GarminActivity[]) => void;
  addHooperLog: (log: HooperLog) => void;
  addSessionRPE: (log: SessionRPE) => void;
  addWeeklyScreeningLog: (log: WeeklyScreeningLog) => void;
  addMealLog: (log: MealLog) => void;
  deleteMealLog: (id: string) => void;
  addPainLog: (log: PainLog) => void;
  addContextLog: (log: LifeContextLog) => void;
  addAllergenBypassLog: (log: AllergenBypassLog) => void;
  addRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  computeEngineScores: () => void;
  exportLocalData: () => string;
  clearDomainData: (domain: "metrics" | "meals" | "pains" | "menstrual" | "hooper" | "all") => void;
}

const initialProfile: UserProfile = {
  general: { name: 'Athlète Elite', age: 28, gender: 'female', height: 175, weight: 65, activityLevel: 'athlete', primaryGoal: 'Performance' },
  health: { conditions: [], allergies: [], injuries: [], medications: [] },
  sport: { primarySport: 'Triathlon', trainingFrequency: 6, weeklyVolume: 12, intensity: 'variable' },
  preferences: { units: 'metric', enableMenstrualTracking: true, notificationsEnabled: true, dataSharingConsent: true },
  nutritionGoal: {
    calories: { value: 2400, isUserDefined: false },
    proteinGPerKg: { value: 1.8, isUserDefined: false },
    carbsGPerKg: { value: 4.0, isUserDefined: false },
    fat: { value: 75, isUserDefined: false },
    fiber: { value: 30, isUserDefined: false },
    hydration: { value: 2500, isUserDefined: false },
    sodium: { value: 2300, isUserDefined: false },
    objective: "performance"
  },
  favoriteFoodIds: [],
  favoriteRecipeIds: []
};

const initialConnections: Record<DataSource, ConnectionState> = {
  garmin: { source: 'garmin', status: 'disconnected', name: 'Garmin Connect', icon: 'garmin', description: 'Import par fichiers ZIP, CSV, JSON ou FIT (Sommeil, HRV, Activités, Charge).' },
  manual: { source: 'manual', status: 'connected', name: 'Saisie Manuelle', icon: 'edit', description: 'Formulaires journaliers, RPE, nutrition, hydratation, douleurs.' },
  derived: { source: 'derived', status: 'connected', name: 'Aura Analytics (Calculé)', icon: 'cpu', description: 'Indicateurs de charge ACWR, Readiness, scores fatigues cumulés.' }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      metrics: [],
      rejectedMetrics: [],
      connections: initialConnections,
      userProfile: initialProfile,
      menstrualLogs: [],
      garminImportLogs: [],
      garminActivities: [],
      hooperLogs: [],
      sessionRpeLogs: [],
      weeklyScreeningLogs: [],
      mealLogs: [],
      painLogs: [],
      contextLogs: [],
      engineScores: null,
      recipes: [],
      allergenBypassLogs: [],
      addMetric: (metric) => {
        const result = createValidatedMetric({
          source: metric.source,
          timestamp: metric.timestamp,
          type: metric.type,
          value: metric.value,
          unit: metric.unit,
          sourceId: metric.sourceId
        });
        if (!result.success) {
          console.warn(`[Store] Metric raw validation rejected:`, result.reason);
          set((state) => ({
            rejectedMetrics: [
              ...state.rejectedMetrics,
              {
                id: crypto.randomUUID(),
                metric: result.metric || metric,
                reason: result.reason || "Validation failed",
                source: metric.source,
                timestamp: metric.timestamp,
                typeProposed: result.typeProposed,
                value: result.valueProposed,
                unit: metric.unit,
                confidenceScore: result.quality?.finalConfidence || 0,
                importLogId: metric.sourceId
              }
            ]
          }));
          return;
        }
        const validated = result.metric!;
        set((state) => ({ metrics: [...state.metrics, validated] }));
        get().computeEngineScores();
      },
      addMetrics: (metrics) => {
        const rejected: RejectedMetric[] = [];
        const validMetrics: NormalizedMetric[] = [];
        metrics.forEach(m => {
          const result = createValidatedMetric({
            source: m.source,
            timestamp: m.timestamp,
            type: m.type,
            value: m.value,
            unit: m.unit,
            sourceId: m.sourceId
          });
          if (!result.success) {
            rejected.push({
              id: crypto.randomUUID(),
              metric: result.metric || m,
              reason: result.reason || "Validation failed",
              source: m.source,
              timestamp: m.timestamp,
              typeProposed: result.typeProposed,
              value: result.valueProposed,
              unit: m.unit,
              confidenceScore: result.quality?.finalConfidence || 0,
              importLogId: m.sourceId
            });
          } else {
            validMetrics.push(result.metric!);
          }
        });
        set((state) => {
          const metricMap = new Map(state.metrics.map(m => [m.id, m]));
          validMetrics.forEach(m => {
            const existing = metricMap.get(m.id);
            // Update if it doesn't exist, or if the new one has a higher confidence score
            if (!existing || m.confidenceScore >= existing.confidenceScore) {
              metricMap.set(m.id, m);
            }
          });
          return {
            metrics: Array.from(metricMap.values()),
            rejectedMetrics: [...state.rejectedMetrics, ...rejected]
          };
        });
        
        // Debounce computation to avoid huge performance hit during mass imports
        if ((window as any).engineDebounce) clearTimeout((window as any).engineDebounce);
        (window as any).engineDebounce = setTimeout(() => {
          get().computeEngineScores();
        }, 1000);
      },
      updateConnection: (source, status) => set((state) => ({
        connections: {
          ...state.connections,
          [source]: { 
            ...state.connections[source], 
            status, 
            lastSync: status === 'connected' ? new Date().toISOString() : state.connections[source].lastSync 
          }
        }
      })),
      updateUserProfile: (profile) => {
        set((state) => {
           const newProfile = { ...state.userProfile, ...profile };
           // Don't sync if called from the firebase real-time listener (usually profile comes fully populated and matching)
           // If called from the UI, we should sync to firestore
           syncProfileToFirestore(newProfile).catch(() => {});
           return { userProfile: newProfile };
        });
      },
      addMenstrualLog: (log) => set((state) => {
        syncMenstrualLogToFirestore(log).catch(() => {});
        return { menstrualLogs: [...state.menstrualLogs, log] };
      }),
      addGarminImportLog: (log) => set((state) => ({ garminImportLogs: [log, ...state.garminImportLogs] })),
      updateGarminImportLog: (id, updates) => set((state) => ({
        garminImportLogs: state.garminImportLogs.map(log => log.id === id ? { ...log, ...updates } : log)
      })),
      addGarminActivities: (activities) => {
        set((state) => {
          const activityMap = new Map(state.garminActivities.map(a => [a.id, a]));
          activities.forEach(a => {
            activityMap.set(a.id, a); // Upsert activity
          });
          // Sort by date descending
          const sortedActivities = Array.from(activityMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return { garminActivities: sortedActivities };
        });
        
        // Debounce computation to avoid huge performance hit during mass imports
        if ((window as any).engineDebounce) clearTimeout((window as any).engineDebounce);
        (window as any).engineDebounce = setTimeout(() => {
          get().computeEngineScores();
        }, 1000);
      },
      addHooperLog: (log) => {
        set((state) => {
          syncHooperLogToFirestore(log).catch(() => {});
          const filtered = state.hooperLogs.filter(l => l.date !== log.date);
          return { hooperLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) };
        });
        get().computeEngineScores();
      },
      addSessionRPE: (log) => {
        set((state) => {
          syncSessionRpeToFirestore(log).catch(() => {});
          const filtered = state.sessionRpeLogs.filter(l => l.activityId !== log.activityId);
          return { sessionRpeLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      addWeeklyScreeningLog: (log) => {
        set((state) => {
          syncWeeklyScreeningLogToFirestore(log).catch(() => {});
          const filtered = state.weeklyScreeningLogs.filter(l => l.date !== log.date);
          return { weeklyScreeningLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) };
        });
        get().computeEngineScores();
      },
      addMealLog: (log) => {
        set((state) => {
          syncMealLogToFirestore(log).catch(() => {});
          const filtered = state.mealLogs.filter(l => l.id !== log.id);
          return { mealLogs: [...filtered, log] };
        });
        // Integrate into global metrics so that nutrition calculations get processed in real-time
        get().computeEngineScores();
      },
      deleteMealLog: (id) => {
        set((state) => {
          deleteMealLogFromFirestore(id).catch(() => {});
          return {
            mealLogs: state.mealLogs.filter(l => l.id !== id)
          };
        });
        get().computeEngineScores();
      },
      addPainLog: (log) => {
        set((state) => {
          syncPainLogToFirestore(log).catch(() => {});
          const filtered = state.painLogs.filter(l => l.id !== log.id);
          return { painLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      addContextLog: (log) => {
        set((state) => {
          syncContextLogToFirestore(log).catch(() => {});
          const filtered = state.contextLogs.filter(l => l.id !== log.id);
          return { contextLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      addAllergenBypassLog: (log) => {
        set((state) => {
          syncAllergenBypassLogToFirestore(log).catch(() => {});
          return { allergenBypassLogs: [...(state.allergenBypassLogs || []), log] };
        });
      },
      addRecipe: (recipe) => {
        set((state) => {
          syncRecipeToFirestore(recipe).catch(() => {});
          const filtered = (state.recipes || []).filter(r => r.id !== recipe.id);
          return { recipes: [...filtered, recipe] };
        });
      },
      deleteRecipe: (id) => {
        set((state) => {
          deleteRecipeFromFirestore(id).catch(() => {});
          return {
            recipes: (state.recipes || []).filter(r => r.id !== id)
          };
        });
      },
      computeEngineScores: () => {
        const state = get();
        const scores = runAnalysisEngine(state);
        set({ engineScores: scores });
      },
      exportLocalData: () => {
        const state = get();
        const exportObj = {
          metrics: state.metrics,
          rejectedMetrics: state.rejectedMetrics,
          menstrualLogs: state.menstrualLogs,
          garminActivities: state.garminActivities,
          hooperLogs: state.hooperLogs,
          sessionRpeLogs: state.sessionRpeLogs,
          mealLogs: state.mealLogs,
          recipes: state.recipes,
          allergenBypassLogs: state.allergenBypassLogs,
          painLogs: state.painLogs,
          contextLogs: state.contextLogs,
          userProfile: state.userProfile,
          exportDate: new Date().toISOString()
        };
        return JSON.stringify(exportObj, null, 2);
      },
      clearDomainData: (domain) => {
        set((state) => {
          const updates: Partial<AppState> = {};
          if (domain === "metrics" || domain === "all") {
            updates.metrics = [];
            updates.rejectedMetrics = [];
            updates.garminActivities = [];
            updates.garminImportLogs = [];
          }
          if (domain === "meals" || domain === "all") {
            updates.mealLogs = [];
            updates.recipes = [];
            updates.allergenBypassLogs = [];
          }
          if (domain === "pains" || domain === "all") {
            updates.painLogs = [];
          }
          if (domain === "menstrual" || domain === "all") {
            updates.menstrualLogs = [];
          }
          if (domain === "hooper" || domain === "all") {
            updates.hooperLogs = [];
            updates.sessionRpeLogs = [];
            updates.weeklyScreeningLogs = [];
            updates.contextLogs = [];
          }
          return updates;
        });
        get().computeEngineScores();
      }
    }),
    {
      name: 'aura-elite-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
