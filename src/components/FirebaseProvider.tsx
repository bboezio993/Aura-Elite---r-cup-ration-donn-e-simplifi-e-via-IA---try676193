import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer, onSnapshot, collection, query, limit, setDoc, getDocs, where } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle, logout } from '../firebase';
import { useStore } from '../store/useStore';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineError, setOfflineError] = useState(false);
  const isMigratedToCloud = useStore(state => state.isMigratedToCloud);
  const { 
    addMetrics, 
    addGarminActivities, 
    updateUserProfile,
    addGarminImportLog
  } = useStore();

  useEffect(() => {
    // Connection test as required
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
          setOfflineError(true);
        }
      }
    }
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || isMigratedToCloud !== true) return;

    // Sync user profile
    const profileRef = doc(db, 'profiles', user.uid);
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        updateUserProfile(snap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `profiles/${user.uid}`));

    // Sync Metrics
    const metricsRef = collection(db, 'metrics');
    const unsubMetrics = onSnapshot(query(metricsRef, where('uid', '==', user.uid), limit(5000)), (snap) => {
      const loadedMetrics = snap.docs.map(d => d.data() as any);
      useStore.setState({ metrics: loadedMetrics });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'metrics'));

    // Sync Activities
    const activitiesRef = collection(db, 'activities');
    const unsubActivities = onSnapshot(query(activitiesRef, where('uid', '==', user.uid), limit(1000)), (snap) => {
      const loadedActs = snap.docs.map(d => d.data() as any);
      useStore.setState({ garminActivities: loadedActs });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'activities'));

    // Sync Import Logs
    const logsRef = collection(db, 'importLogs');
    const unsubLogs = onSnapshot(query(logsRef, where('uid', '==', user.uid), limit(100)), (snap) => {
      const loadedImportLogs = snap.docs.map(d => d.data() as any);
      useStore.setState({ garminImportLogs: loadedImportLogs });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'importLogs'));

    // Sync Meal Logs (No snap.size checks to synchronize empty cloud states)
    const unsubSubjectiveMealLogs = onSnapshot(query(collection(db, 'mealLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ mealLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'mealLogs'));

    const unsubSubjectiveRecipes = onSnapshot(query(collection(db, 'recipes'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ recipes: snap.docs.map(d => d.data() as any) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'recipes'));

    const unsubSubjectiveHooper = onSnapshot(query(collection(db, 'hooperLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ hooperLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'hooperLogs'));

    const unsubSubjectiveSessionRPE = onSnapshot(query(collection(db, 'sessionRpeLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ sessionRpeLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sessionRpeLogs'));

    const unsubSubjectivePain = onSnapshot(query(collection(db, 'painLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ painLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'painLogs'));

    const unsubSubjectiveMenstrual = onSnapshot(query(collection(db, 'menstrualLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ menstrualLogs: snap.docs.map(d => d.data() as any) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'menstrualLogs'));

    const unsubSubjectiveContext = onSnapshot(query(collection(db, 'contextLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ contextLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'contextLogs'));

    const unsubSubjectiveWeekly = onSnapshot(query(collection(db, 'weeklyScreeningLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ weeklyScreeningLogs: snap.docs.map(d => d.data() as any) });
      useStore.getState().computeEngineScores();
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'weeklyScreeningLogs'));

    const unsubSubjectiveBypass = onSnapshot(query(collection(db, 'allergenBypassLogs'), where('uid', '==', user.uid), limit(1000)), (snap) => {
      useStore.setState({ allergenBypassLogs: snap.docs.map(d => d.data() as any) });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'allergenBypassLogs'));

    return () => {
      unsubProfile();
      unsubMetrics();
      unsubActivities();
      unsubLogs();
      unsubSubjectiveMealLogs();
      unsubSubjectiveRecipes();
      unsubSubjectiveHooper();
      unsubSubjectiveSessionRPE();
      unsubSubjectivePain();
      unsubSubjectiveMenstrual();
      unsubSubjectiveContext();
      unsubSubjectiveWeekly();
      unsubSubjectiveBypass();
    };
  }, [user, isMigratedToCloud]); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
      <Loader2 className="animate-spin mb-4" />
      <p>Chargement de l'espace membre...</p>
    </div>;
  }

  if (offlineError) {
    return <div className="h-screen w-screen flex flex-col items-center justify-center p-4">
       <h1 className="text-xl font-bold text-red-500 mb-2">Erreur de Connexion</h1>
       <p className="text-muted-foreground">La configuration Firebase est hors ligne ou incorrecte.</p>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut: logout }}>
      {user ? children : (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-4 space-y-4">
          <div className="text-center max-w-sm">
            <h1 className="text-2xl font-bold mb-2">AURA ELITE</h1>
            <p className="text-muted-foreground mb-8">Connectez-vous pour sécuriser et sauvegarder l'historique complet de votre santé sur le Cloud.</p>
            <Button onClick={signIn} size="lg" className="w-full flex items-center justify-center gap-2">
              <LogIn size={20} />
              Continuer avec Google
            </Button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
