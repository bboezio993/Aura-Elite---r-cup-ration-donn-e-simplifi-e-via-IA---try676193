import { writeBatch, doc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { NormalizedMetric, GarminActivity, GarminImportLog, UserProfile } from '../types';

/**
 * ARCHITECTURE DE DONNÉES / DATA PRIVACY
 * ====================================
 * Aura Elite Next est une application pleinement cloud-first.
 * Toutes les données utilisateur, y compris les mesures biométriques passives, les activités
 * Garmin, ainsi que les journaux subjectifs de nutrition, douleurs, cycles menstruels
 * et questionnaires Hooper, sont synchronisées en temps réel de manière sécurisée et isolée par UID
 * dans Firestore comme source de vérité. No IndexedDB acts only as a local offline cache.
 */

export const syncMetricsToFirestore = async (metrics: NormalizedMetric[]) => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  
  // Chunk into arrays of 500 for Firestore batches
  const chunkSize = 500;
  for (let i = 0; i < metrics.length; i += chunkSize) {
    const chunk = metrics.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    
    chunk.forEach(metric => {
      const cleanMetric = Object.fromEntries(Object.entries(metric).filter(([_, v]) => v !== undefined));
      const metricWithUid = { ...cleanMetric, uid };
      const ref = doc(db, 'metrics', metric.id);
      batch.set(ref, metricWithUid, { merge: true });
    });
    
    try {
      await batch.commit();
    } catch (e) {
       handleFirestoreError(e, OperationType.WRITE, 'metrics');
    }
  }
};

export const syncActivitiesToFirestore = async (activities: GarminActivity[]) => {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  
  const chunkSize = 500;
  for (let i = 0; i < activities.length; i += chunkSize) {
    const chunk = activities.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    
    chunk.forEach(activity => {
      const cleanActivity = Object.fromEntries(Object.entries(activity).filter(([_, v]) => v !== undefined));
      const activityWithUid = { ...cleanActivity, uid };
      const ref = doc(db, 'activities', activity.id);
      batch.set(ref, activityWithUid, { merge: true });
    });
    
    try {
      await batch.commit();
    } catch (e) {
       handleFirestoreError(e, OperationType.WRITE, 'activities');
    }
  }
};

export const syncLogToFirestore = async (log: GarminImportLog) => {
  if (!auth.currentUser) return;
  try {
    const cleanLog = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'importLogs', log.id);
    await setDoc(ref, { ...cleanLog, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `importLogs/${log.id}`);
  }
};

export const syncProfileToFirestore = async (profile: UserProfile) => {
  if (!auth.currentUser) return;
  try {
    const cleanProfile = Object.fromEntries(Object.entries(profile).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'profiles', auth.currentUser.uid);
    await setDoc(ref, { ...cleanProfile, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `profiles/${auth.currentUser.uid}`);
  }
};

// --- Cloud-First Active Synchronizers ---

export const syncMealLogToFirestore = async (mealLog: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(mealLog).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'mealLogs', mealLog.id);
    await setDoc(ref, { ...clean, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `mealLogs/${mealLog.id}`);
  }
};

export const deleteMealLogFromFirestore = async (id: string) => {
  if (!auth.currentUser) return;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const ref = doc(db, 'mealLogs', id);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `mealLogs/${id}`);
  }
};

export const syncRecipeToFirestore = async (recipe: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(recipe).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'recipes', recipe.id);
    await setDoc(ref, { ...clean, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `recipes/${recipe.id}`);
  }
};

export const deleteRecipeFromFirestore = async (id: string) => {
  if (!auth.currentUser) return;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const ref = doc(db, 'recipes', id);
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `recipes/${id}`);
  }
};

export const syncHooperLogToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'hooperLogs', log.id || log.date);
    const logId = log.id || log.date;
    await setDoc(ref, { ...clean, id: logId, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `hooperLogs/${log.id || log.date}`);
  }
};

export const syncSessionRpeToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'sessionRpeLogs', log.id || log.activityId);
    const rpeId = log.id || log.activityId;
    await setDoc(ref, { ...clean, id: rpeId, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `sessionRpeLogs/${log.id || log.activityId}`);
  }
};

export const syncPainLogToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'painLogs', log.id);
    await setDoc(ref, { ...clean, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `painLogs/${log.id}`);
  }
};

export const syncMenstrualLogToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'menstrualLogs', log.id || log.date);
    const logId = log.id || log.date;
    await setDoc(ref, { ...clean, id: logId, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `menstrualLogs/${log.id || log.date}`);
  }
};

export const syncContextLogToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'contextLogs', log.id || log.date);
    const logId = log.id || log.date;
    await setDoc(ref, { ...clean, id: logId, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `contextLogs/${log.id || log.date}`);
  }
};

export const syncWeeklyScreeningLogToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'weeklyScreeningLogs', log.id || log.date);
    const logId = log.id || log.date;
    await setDoc(ref, { ...clean, id: logId, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `weeklyScreeningLogs/${log.id || log.date}`);
  }
};

export const syncAllergenBypassLogToFirestore = async (log: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(log).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'allergenBypassLogs', log.id);
    await setDoc(ref, { ...clean, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `allergenBypassLogs/${log.id}`);
  }
};

export const syncFoodProductToFirestore = async (foodProduct: any) => {
  if (!auth.currentUser) return;
  try {
    const clean = Object.fromEntries(Object.entries(foodProduct).filter(([_, v]) => v !== undefined));
    const ref = doc(db, 'foodProducts', foodProduct.id);
    await setDoc(ref, { ...clean, uid: auth.currentUser.uid }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `foodProducts/${foodProduct.id}`);
  }
};

