import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';
import { NormalizedMetric, ConnectionState, DataSource, UserProfile, MenstrualLog, GarminImportLog, GarminActivity, HooperLog, SessionRPE, LifeContextLog, EngineScores, WeeklyScreeningLog, MealLog, PainLog, RejectedMetric, Recipe, AllergenBypassLog } from '../types';
import { runAnalysisEngine } from '../services/analysisEngine/engine';
import { CloudDataRepository, FavoriteFood } from '../services/CloudDataRepository';
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

export interface SyncItem {
  id: string; // generated unique key e.g. "meal_id"
  domain: 'meals' | 'recipes' | 'favorites' | 'metrics' | 'forms' | 'allergens' | 'profile';
  status: 'pending' | 'synced' | 'failed';
  error?: string;
  updatedAt: string;
}

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
  favoriteFoods: FavoriteFood[];
  isMigratedToCloud?: boolean;
  syncStatuses: Record<string, SyncItem>;
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
  addFavoriteFood: (fav: FavoriteFood) => void;
  deleteFavoriteFood: (id: string) => void;
  computeEngineScores: () => void;
  exportLocalData: () => string;
  clearDomainData: (domain: "metrics" | "meals" | "pains" | "menstrual" | "hooper" | "all") => void;
  retrySync: (key: string) => Promise<void>;
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

export const triggerSyncHelper = async (
  key: string,
  domain: SyncItem['domain'],
  supplier: () => Promise<any>,
  set: any
) => {
  set((state: any) => ({
    syncStatuses: {
      ...(state.syncStatuses || {}),
      [key]: {
        id: key,
        domain,
        status: 'pending',
        updatedAt: new Date().toISOString()
      }
    }
  }));

  try {
    await supplier();
    set((state: any) => ({
      syncStatuses: {
        ...(state.syncStatuses || {}),
        [key]: {
          id: key,
          domain,
          status: 'synced',
          updatedAt: new Date().toISOString()
        }
      }
    }));
  } catch (err: any) {
    console.error(`Sync failed for ${key} in domain ${domain}:`, err);
    set((state: any) => ({
      syncStatuses: {
        ...(state.syncStatuses || {}),
        [key]: {
          id: key,
          domain,
          status: 'failed',
          error: err?.message || "Erreur de synchronisation Firestore",
          updatedAt: new Date().toISOString()
        }
      }
    }));
  }
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
      favoriteFoods: [],
      isMigratedToCloud: undefined,
      syncStatuses: {},
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
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`metric_${validated.id}`, 'metrics', () => CloudDataRepository.saveMetrics([validated]), set);
          }
          return { metrics: [...state.metrics, validated] };
        });
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
            if (!existing || m.confidenceScore >= existing.confidenceScore) {
              metricMap.set(m.id, m);
            }
          });
          if (state.isMigratedToCloud && validMetrics.length > 0) {
            triggerSyncHelper(`metrics_batch_${Date.now()}`, 'metrics', () => CloudDataRepository.saveMetrics(validMetrics), set);
          }
          return {
            metrics: Array.from(metricMap.values()),
            rejectedMetrics: [...state.rejectedMetrics, ...rejected]
          };
        });
        
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
           if (state.isMigratedToCloud) {
             triggerSyncHelper('profile', 'profile', () => CloudDataRepository.saveUserProfile(newProfile), set);
           }
           return { userProfile: newProfile };
        });
      },
      addMenstrualLog: (log) => set((state) => {
        if (state.isMigratedToCloud) {
          triggerSyncHelper(`menstrual_${log.id || log.date}`, 'forms', () => CloudDataRepository.saveMenstrualLog(log), set);
        }
        return { menstrualLogs: [...state.menstrualLogs, log] };
      }),
      addGarminImportLog: (log) => set((state) => {
        if (state.isMigratedToCloud) {
          triggerSyncHelper(`importLog_${log.id}`, 'metrics', () => CloudDataRepository.saveGarminImportLog(log), set);
        }
        return { garminImportLogs: [log, ...state.garminImportLogs] };
      }),
      updateGarminImportLog: (id, updates) => set((state) => {
        const updatedLogs = state.garminImportLogs.map(log => log.id === id ? { ...log, ...updates } : log);
        const targetLog = updatedLogs.find(l => l.id === id);
        if (state.isMigratedToCloud && targetLog) {
          triggerSyncHelper(`importLog_${id}`, 'metrics', () => CloudDataRepository.saveGarminImportLog(targetLog), set);
        }
        return { garminImportLogs: updatedLogs };
      }),
      addGarminActivities: (activities) => {
        set((state) => {
          const activityMap = new Map(state.garminActivities.map(a => [a.id, a]));
          activities.forEach(a => {
            activityMap.set(a.id, a);
          });
          if (state.isMigratedToCloud && activities.length > 0) {
            triggerSyncHelper(`activities_batch_${Date.now()}`, 'metrics', () => CloudDataRepository.saveActivities(activities), set);
          }
          const sortedActivities = Array.from(activityMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          return { garminActivities: sortedActivities };
        });
        
        if ((window as any).engineDebounce) clearTimeout((window as any).engineDebounce);
        (window as any).engineDebounce = setTimeout(() => {
          get().computeEngineScores();
        }, 1000);
      },
      addHooperLog: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`hooper_${log.id || log.date}`, 'forms', () => CloudDataRepository.saveHooperLog(log), set);
          }
          const filtered = state.hooperLogs.filter(l => l.date !== log.date);
          return { hooperLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) };
        });
        get().computeEngineScores();
      },
      addSessionRPE: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`rpe_${log.id || log.activityId}`, 'forms', () => CloudDataRepository.saveSessionRpe(log), set);
          }
          const filtered = state.sessionRpeLogs.filter(l => l.activityId !== log.activityId);
          return { sessionRpeLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      addWeeklyScreeningLog: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`screening_${log.id || log.date}`, 'forms', () => CloudDataRepository.saveWeeklyScreeningLog(log), set);
          }
          const filtered = state.weeklyScreeningLogs.filter(l => l.date !== log.date);
          return { weeklyScreeningLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) };
        });
        get().computeEngineScores();
      },
      addMealLog: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`meal_${log.id}`, 'meals', () => CloudDataRepository.saveMealLog(log), set);
          }
          const filtered = state.mealLogs.filter(l => l.id !== log.id);
          return { mealLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      deleteMealLog: (id) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            CloudDataRepository.deleteMealLog(id).catch(() => {});
          }
          return {
            mealLogs: state.mealLogs.filter(l => l.id !== id)
          };
        });
        get().computeEngineScores();
      },
      addPainLog: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`pain_${log.id}`, 'forms', () => CloudDataRepository.savePainLog(log), set);
          }
          const filtered = state.painLogs.filter(l => l.id !== log.id);
          return { painLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      addContextLog: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`context_${log.id}`, 'forms', () => CloudDataRepository.saveContextLog(log), set);
          }
          const filtered = state.contextLogs.filter(l => l.id !== log.id);
          return { contextLogs: [...filtered, log] };
        });
        get().computeEngineScores();
      },
      addAllergenBypassLog: (log) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`allergenBypass_${log.id}`, 'allergens', () => CloudDataRepository.saveAllergenBypassLog(log), set);
          }
          return { allergenBypassLogs: [...(state.allergenBypassLogs || []), log] };
        });
      },
      addRecipe: (recipe) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`recipe_${recipe.id}`, 'recipes', () => CloudDataRepository.saveRecipe(recipe), set);
          }
          const filtered = (state.recipes || []).filter(r => r.id !== recipe.id);
          return { recipes: [...filtered, recipe] };
        });
      },
      deleteRecipe: (id) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            CloudDataRepository.deleteRecipe(id).catch(() => {});
          }
          return {
            recipes: (state.recipes || []).filter(r => r.id !== id)
          };
        });
      },
      addFavoriteFood: (fav) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            triggerSyncHelper(`favorite_${fav.id}`, 'favorites', () => CloudDataRepository.saveFavoriteFood(fav), set);
          }
          const filtered = (state.favoriteFoods || []).filter(f => f.id !== fav.id);
          return {
            favoriteFoods: [...filtered, fav]
          };
        });
      },
      deleteFavoriteFood: (id) => {
        set((state) => {
          if (state.isMigratedToCloud) {
            CloudDataRepository.deleteFavoriteFood(id).catch(() => {});
          }
          return {
            favoriteFoods: (state.favoriteFoods || []).filter(f => f.id !== id)
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
      },
      retrySync: async (key) => {
        const state = get();
        const item = state.syncStatuses[key];
        if (!item) return;

        let supplier: (() => Promise<any>) | null = null;
        if (key === 'profile') {
          supplier = () => CloudDataRepository.saveUserProfile(state.userProfile);
        } else if (key.startsWith('meal_')) {
          const id = key.substring(5);
          const val = state.mealLogs.find(m => m.id === id);
          if (val) supplier = () => CloudDataRepository.saveMealLog(val);
        } else if (key.startsWith('recipe_')) {
          const id = key.substring(7);
          const val = state.recipes.find(r => r.id === id);
          if (val) supplier = () => CloudDataRepository.saveRecipe(val);
        } else if (key.startsWith('favorite_')) {
          const id = key.substring(9);
          const val = state.favoriteFoods.find(f => f.id === id);
          if (val) supplier = () => CloudDataRepository.saveFavoriteFood(val);
        } else if (key.startsWith('metric_')) {
          const id = key.substring(7);
          const val = state.metrics.find(m => m.id === id);
          if (val) supplier = () => CloudDataRepository.saveMetrics([val]);
        } else if (key.startsWith('hooper_')) {
          const id = key.substring(7);
          const val = state.hooperLogs.find(h => h.id === id);
          if (val) supplier = () => CloudDataRepository.saveHooperLog(val);
        } else if (key.startsWith('rpe_')) {
          const id = key.substring(4);
          const val = state.sessionRpeLogs.find(r => r.id === id);
          if (val) supplier = () => CloudDataRepository.saveSessionRpe(val);
        } else if (key.startsWith('pain_')) {
          const id = key.substring(5);
          const val = state.painLogs.find(p => p.id === id);
          if (val) supplier = () => CloudDataRepository.savePainLog(val);
        } else if (key.startsWith('context_')) {
          const id = key.substring(8);
          const val = state.contextLogs.find(c => c.id === id);
          if (val) supplier = () => CloudDataRepository.saveContextLog(val);
        } else if (key.startsWith('screening_')) {
          const id = key.substring(10);
          const val = state.weeklyScreeningLogs.find(s => s.id === id);
          if (val) supplier = () => CloudDataRepository.saveWeeklyScreeningLog(val);
        } else if (key.startsWith('allergenBypass_')) {
          const id = key.substring(15);
          const val = state.allergenBypassLogs.find(a => a.id === id);
          if (val) supplier = () => CloudDataRepository.saveAllergenBypassLog(val);
        }

        if (supplier) {
          await triggerSyncHelper(key, item.domain, supplier, set);
        }
      }
    }),
    {
      name: 'aura-elite-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => {
        // Exclude syncStatuses fromIndexedDB persistence to ensure fresh hydration
        const { syncStatuses, ...rest } = state;
        return rest;
      }
    }
  )
);
