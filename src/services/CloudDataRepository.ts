import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  writeBatch,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  NormalizedMetric, 
  UserProfile, 
  MealLog, 
  Recipe, 
  HooperLog, 
  SessionRPE, 
  PainLog, 
  MenstrualLog, 
  LifeContextLog, 
  WeeklyScreeningLog, 
  AllergenBypassLog,
  GarminActivity,
  GarminImportLog
} from '../types';
import { useStore } from '../store/useStore';

/**
 * SOURCE OF TRUTH: CLOUD DATA REPOSITORY
 * =====================================
 * This service is the unified data persistence repository for all Aura Elite Next domains.
 * It directly interacts with Cloud Firestore to read and write records.
 * The local Zustand store behaves simply as an offline cache and UI state mirror.
 */

export interface FavoriteFood {
  id: string; // generated
  uid: string;
  foodProductId: string; // references barcode/ID
  displayName: string;
  brand: string;
  defaultPortion: number; // in grams or pieces
  defaultMealType: string;
  notes?: string;
  userNotes?: string;
  userCorrections?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  createdAt: string;
}

export interface UserFood {
  id: string;
  uid: string;
  productName: string;
  brand: string;
  nutrimentsPer100g: {
    calories: { value: number | null; unit: string; isMissing: boolean; missingReason?: string };
    protein: { value: number | null; unit: string; isMissing: boolean; missingReason?: string };
    carbs: { value: number | null; unit: string; isMissing: boolean; missingReason?: string };
    fat: { value: number | null; unit: string; isMissing: boolean; missingReason?: string };
    sugars?: { value: number | null; unit: string; isMissing: boolean; missingReason?: string };
    saturatedFat?: { value: number | null; unit: string; isMissing: boolean; missingReason?: string };
  };
  lastFetchedAt: string;
  createdAt: string;
}

export interface AiUsageLog {
  id: string;
  uid: string;
  feature: "meal_photo" | "label_ocr" | "recipe_text" | "voice_form";
  model: string;
  inputHash: string;
  cached: boolean;
  tokensIn?: number;
  tokensOut?: number;
  estimatedCost?: number;
  status: "draft" | "confirmed" | "rejected" | "expired";
  createdAt: string;
}

export interface NutritionDraft {
  id: string;
  uid: string;
  sourceType: "barcode" | "open_food_facts" | "meal_photo_ai" | "label_ocr" | "recipe_text_ai" | "voice_ai" | "manual";
  sourceRef: string; // barcode, photoId etc
  extractedJson: any;
  confidence: number;
  status: "draft" | "confirmed" | "rejected" | "expired";
  userCorrections?: any;
  createdAt: string;
  confirmedAt?: string;
}

export interface MigrationStatus {
  uid: string;
  migrationDate: string;
  isCompleted: boolean;
  schemaVersion: string;
  domainsMigrated: string[];
  itemCount: number;
  errors?: string[];
}

export const CloudDataRepository = {
  // --- Profile operations ---
  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `profiles/${uid}`;
    try {
      const clean = Object.fromEntries(Object.entries(profile).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'profiles', uid), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // --- Meal log operations ---
  async saveMealLog(mealLog: MealLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `mealLogs/${mealLog.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(mealLog).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'mealLogs', mealLog.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteMealLog(id: string): Promise<void> {
    if (!auth.currentUser) return;
    const path = `mealLogs/${id}`;
    try {
      await deleteDoc(doc(db, 'mealLogs', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // --- Recipe operations ---
  async saveRecipe(recipe: Recipe): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `recipes/${recipe.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(recipe).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'recipes', recipe.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteRecipe(id: string): Promise<void> {
    if (!auth.currentUser) return;
    const path = `recipes/${id}`;
    try {
      await deleteDoc(doc(db, 'recipes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // --- Food Products Master Collection ---
  async saveFoodProduct(foodProduct: any): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `foodProducts/${foodProduct.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(foodProduct).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'foodProducts', foodProduct.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getFoodProduct(barcode: string): Promise<any | null> {
    const path = `foodProducts/${barcode}`;
    try {
      const snap = await getDoc(doc(db, 'foodProducts', barcode));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      return null;
    }
  },

  // --- Favorite Foods (Personal usage of scannable/OFF foods) ---
  async saveFavoriteFood(fav: FavoriteFood): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `favoriteFoods/${fav.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(fav).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'favoriteFoods', fav.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async deleteFavoriteFood(id: string): Promise<void> {
    if (!auth.currentUser) return;
    const path = `favoriteFoods/${id}`;
    try {
      await deleteDoc(doc(db, 'favoriteFoods', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // --- Subjective Forms Saves ---
  async saveHooperLog(log: HooperLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `hooperLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'hooperLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveSessionRpe(log: SessionRPE): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `sessionRpeLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'sessionRpeLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async savePainLog(log: PainLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `painLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'painLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveMenstrualLog(log: MenstrualLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `menstrualLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'menstrualLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveContextLog(log: LifeContextLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `contextLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'contextLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveWeeklyScreeningLog(log: WeeklyScreeningLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `weeklyScreeningLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'weeklyScreeningLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveAllergenBypassLog(log: AllergenBypassLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `allergenBypassLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'allergenBypassLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // --- Garmin bulk saves ---
  async saveMetrics(metrics: NormalizedMetric[]): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const chunkSize = 500;
    for (let i = 0; i < metrics.length; i += chunkSize) {
      const chunk = metrics.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(m => {
        const clean = Object.fromEntries(Object.entries(m).filter(([_, v]) => v !== undefined));
        batch.set(doc(db, 'metrics', m.id), { ...clean, uid }, { merge: true });
      });
      try {
        await batch.commit();
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'metrics');
      }
    }
  },

  async saveActivities(activities: GarminActivity[]): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const chunkSize = 500;
    for (let i = 0; i < activities.length; i += chunkSize) {
      const chunk = activities.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(a => {
        const clean = Object.fromEntries(Object.entries(a).filter(([_, v]) => v !== undefined));
        batch.set(doc(db, 'activities', a.id), { ...clean, uid }, { merge: true });
      });
      try {
        await batch.commit();
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, 'activities');
      }
    }
  },

  async saveGarminImportLog(log: GarminImportLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `importLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'importLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // --- Draft UI Flow & Presaved AI Drafts ---
  async saveNutritionDraft(draft: NutritionDraft): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `nutritionDrafts/${draft.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(draft).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'nutritionDrafts', draft.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async saveAiUsageLog(log: AiUsageLog): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `aiUsageLogs/${log.id}`;
    try {
      const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'aiUsageLogs', log.id), { ...clean, uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // --- Quota, Daily Counters & Persist Server Checks ---
  async checkAndIncrementAiQuota(feature: "meal_photo" | "label_ocr" | "recipe_text" | "voice_form"): Promise<{ allowed: boolean; remaining: number }> {
    if (!auth.currentUser) return { allowed: true, remaining: 99 };
    const uid = auth.currentUser.uid;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayISO = startOfDay.toISOString();

    const q = query(
      collection(db, 'aiUsageLogs'),
      where('uid', '==', uid),
      where('createdAt', '>=', startOfDayISO),
      where('feature', '==', feature)
    );

    try {
      const snap = await getDocs(q);
      const usageCount = snap.size;
      const limits = {
        meal_photo: 5,
        label_ocr: 10,
        recipe_text: 15,
        voice_form: 15
      };
      const limit = limits[feature] || 15;
      if (usageCount >= limit) {
        return { allowed: false, remaining: 0 };
      }
      
      return { allowed: true, remaining: limit - usageCount };
    } catch (e) {
      console.warn("Error verifying AI quota in Firestore:", e);
      return { allowed: true, remaining: 5 }; // fallback
    }
  },

  // --- Persistent Migration Logs & Status ---
  async saveMigrationStatus(status: MigrationStatus): Promise<void> {
    if (!auth.currentUser) return;
    const path = `migrationLogs/${status.uid}`;
    try {
      const clean = Object.fromEntries(Object.entries(status).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'migrationLogs', status.uid), { ...clean, uid: status.uid }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  async getMigrationStatus(): Promise<MigrationStatus | null> {
    if (!auth.currentUser) return null;
    const uid = auth.currentUser.uid;
    const path = `migrationLogs/${uid}`;
    try {
      const snap = await getDoc(doc(db, 'migrationLogs', uid));
      if (snap.exists()) {
        return snap.data() as MigrationStatus;
      }
      return null;
    } catch (e) {
      console.warn("Could not retrieve migration status from Firestore:", e);
      return null;
    }
  },

  // --- Deletion & Purging By Domain ---
  async clearAllUserDataByDomain(domain: "metrics" | "meals" | "pains" | "menstrual" | "hooper" | "all"): Promise<void> {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    // Define target collections mapped to each domain
    const domainsMapping: Record<string, string[]> = {
      metrics: ['metrics', 'activities', 'importLogs'],
      meals: ['mealLogs', 'recipes', 'allergenBypassLogs', 'favoriteFoods', 'nutritionDrafts'],
      pains: ['painLogs'],
      menstrual: ['menstrualLogs'],
      hooper: ['hooperLogs', 'sessionRpeLogs', 'weeklyScreeningLogs', 'contextLogs'],
      all: []
    };

    let collectionsToClear = domainsMapping[domain] || [];
    if (domain === 'all') {
      collectionsToClear = Object.values(domainsMapping).flat();
    }

    for (const collName of collectionsToClear) {
      try {
        const snap = await getDocs(query(collection(db, collName), where('uid', '==', uid)));
        const batch = writeBatch(db);
        snap.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      } catch (e) {
        console.error(`Failed to purge collection ${collName} for user:`, e);
      }
    }
  },

  // --- Real-time listener trigger updates to Zustand cache ---
  setupZustandRealtimeListeners(uid: string, onUpdateComplete?: () => void) {
    if (!uid) return () => {};

    // Sync user profile
    const profileRef = doc(db, 'profiles', uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        // Direct setting Zustand state to prevent write sync loops
        useStore.setState({ userProfile: snap.data() as any });
      }
    });

    const metricsRef = collection(db, 'metrics');
    const unsubMetrics = onSnapshot(query(metricsRef, where('uid', '==', uid), limit(5000)), (snap) => {
      const loadedMetrics = snap.docs.map(d => d.data() as any);
      useStore.setState({ metrics: loadedMetrics });
    });

    const activitiesRef = collection(db, 'activities');
    const unsubActivities = onSnapshot(query(activitiesRef, where('uid', '==', uid), limit(1000)), (snap) => {
      const loadedActs = snap.docs.map(d => d.data() as any);
      useStore.setState({ garminActivities: loadedActs });
    });

    const logsRef = collection(db, 'importLogs');
    const unsubLogs = onSnapshot(query(logsRef, where('uid', '==', uid), limit(100)), (snap) => {
      const loadedImportLogs = snap.docs.map(d => d.data() as any);
      useStore.setState({ garminImportLogs: loadedImportLogs });
    });

    const unsubMealLogs = onSnapshot(query(collection(db, 'mealLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ mealLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    });

    const unsubRecipes = onSnapshot(query(collection(db, 'recipes'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ recipes: snap.docs.map(d => d.data() as any) });
    });

    const unsubHooper = onSnapshot(query(collection(db, 'hooperLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ hooperLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    });

    const unsubSessionRPE = onSnapshot(query(collection(db, 'sessionRpeLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ sessionRpeLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    });

    const unsubPain = onSnapshot(query(collection(db, 'painLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ painLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    });

    const unsubMenstrual = onSnapshot(query(collection(db, 'menstrualLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ menstrualLogs: snap.docs.map(d => d.data() as any) });
    });

    const unsubContext = onSnapshot(query(collection(db, 'contextLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ contextLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    });

    const unsubWeekly = onSnapshot(query(collection(db, 'weeklyScreeningLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ weeklyScreeningLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    });

    const unsubBypass = onSnapshot(query(collection(db, 'allergenBypassLogs'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ allergenBypassLogs: snap.docs.map(d => d.data() as any) });
    });

    const unsubFavs = onSnapshot(query(collection(db, 'favoriteFoods'), where('uid', '==', uid), limit(1000)), (snap) => {
      useStore.setState({ favoriteFoods: snap.docs.map(d => d.data() as any) });
    });

    return () => {
      unsubProfile();
      unsubMetrics();
      unsubActivities();
      unsubLogs();
      unsubMealLogs();
      unsubRecipes();
      unsubHooper();
      unsubSessionRPE();
      unsubPain();
      unsubMenstrual();
      unsubContext();
      unsubWeekly();
      unsubBypass();
      unsubFavs();
    };
  }
};
