import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDocFromServer } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from '../firebase';
import { useStore } from '../store/useStore';
import { CloudDataRepository } from '../services/CloudDataRepository';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2 } from 'lucide-react';

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

    const unsubscribeListeners = CloudDataRepository.setupZustandRealtimeListeners(user.uid);

    return () => {
      unsubscribeListeners();
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
