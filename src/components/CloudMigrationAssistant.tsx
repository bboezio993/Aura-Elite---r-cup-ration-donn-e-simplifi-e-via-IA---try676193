import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from './FirebaseProvider';
import { 
  CloudLightning, 
  Download, 
  Play, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  AlertTriangle, 
  FileJson,
  Database,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  syncProfileToFirestore,
  syncMetricsToFirestore,
  syncActivitiesToFirestore,
  syncMealLogToFirestore,
  syncRecipeToFirestore,
  syncHooperLogToFirestore,
  syncSessionRpeToFirestore,
  syncPainLogToFirestore,
  syncMenstrualLogToFirestore,
  syncContextLogToFirestore,
  syncWeeklyScreeningLogToFirestore,
  syncAllergenBypassLogToFirestore
} from '../services/firebaseSync';

type MigrationDomain = 
  | 'profil' 
  | 'metriques' 
  | 'activites' 
  | 'repas' 
  | 'recettes' 
  | 'formulaires_hooper' 
  | 'douleurs' 
  | 'contexte' 
  | 'allergens';

interface DomainState {
  name: string;
  count: number;
  status: 'idle' | 'running' | 'success' | 'failed' | 'skipped';
  error?: string;
}

export function CloudMigrationAssistant() {
  const { user } = useAuth();
  const store = useStore();
  
  // States of migration
  const [showPanel, setShowPanel] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [backupExported, setBackupExported] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [domains, setDomains] = useState<Record<MigrationDomain, DomainState>>({
    profil: { name: 'Profil Utilisateur', count: 1, status: 'idle' },
    metriques: { name: 'Métriques Physiologiques', count: 0, status: 'idle' },
    activites: { name: 'Activités Garmin', count: 0, status: 'idle' },
    repas: { name: 'Repas & Nutrition', count: 0, status: 'idle' },
    recettes: { name: 'Recettes Personnalisées', count: 0, status: 'idle' },
    formulaires_hooper: { name: 'Formulaires Hooper / RPE / Screening', count: 0, status: 'idle' },
    douleurs: { name: 'Suivi des Douleurs', count: 0, status: 'idle' },
    contexte: { name: 'Contexte de Vie', count: 0, status: 'idle' },
    allergens: { name: "Contournements d'Allergènes", count: 0, status: 'idle' },
  });

  useEffect(() => {
    if (!user) return;

    // Detect if we actually have local data that needs migration
    const metricsCount = store.metrics?.length || 0;
    const activitiesCount = store.garminActivities?.length || 0;
    const mealsCount = store.mealLogs?.length || 0;
    const recipesCount = store.recipes?.length || 0;
    const hooperCount = store.hooperLogs?.length || 0;
    const rpeCount = store.sessionRpeLogs?.length || 0;
    const screeningCount = store.weeklyScreeningLogs?.length || 0;
    const painCount = store.painLogs?.length || 0;
    const contextCount = store.contextLogs?.length || 0;
    const allergenCount = store.allergenBypassLogs?.length || 0;

    const totalLocalItems = 
      metricsCount + 
      activitiesCount + 
      mealsCount + 
      recipesCount + 
      hooperCount + 
      rpeCount + 
      screeningCount + 
      painCount + 
      contextCount + 
      allergenCount;

    // If there is absolutely no local data, we consider it migrated or new
    if (totalLocalItems === 0) {
      if (store.isMigratedToCloud !== true) {
        useStore.setState({ isMigratedToCloud: true });
      }
      return;
    }

    // If already marked migrated, bypass
    if (store.isMigratedToCloud === true) {
      return;
    }

    // Update counts dynamically for presentation
    setDomains({
      profil: { name: 'Profil Utilisateur', count: 1, status: 'idle' },
      metriques: { name: 'Métriques Physiologiques', count: metricsCount, status: 'idle' },
      activites: { name: 'Activités Garmin', count: activitiesCount, status: 'idle' },
      repas: { name: 'Repas & Nutrition', count: mealsCount, status: 'idle' },
      recettes: { name: 'Recettes Personnalisées', count: recipesCount, status: 'idle' },
      formulaires_hooper: { name: 'Formulaires Hooper / RPE / Screening', count: hooperCount + rpeCount + screeningCount, status: 'idle' },
      douleurs: { name: 'Suivi des Douleurs', count: painCount, status: 'idle' },
      contexte: { name: 'Contexte de Vie', count: contextCount, status: 'idle' },
      allergens: { name: "Contournements d'Allergènes", count: allergenCount, status: 'idle' },
    });

    setShowPanel(true);
  }, [user, store.isMigratedToCloud, store.metrics, store.garminActivities, store.mealLogs, store.recipes, store.hooperLogs, store.sessionRpeLogs, store.painLogs, store.contextLogs, store.allergenBypassLogs]);

  const handleExportBackup = () => {
    try {
      const dataStr = store.exportLocalData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const filename = `backup_sauvegarde_aura_migration_${new Date().toISOString().slice(0,10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', filename);
      linkElement.click();
      
      setBackupExported(true);
    } catch (e) {
      console.error("Backup export failed before migration:", e);
    }
  };

  const executeMigration = async () => {
    if (!backupExported) {
      alert("Veuillez sauvegarder un export de sécurité JSON avant de démarrer la migration.");
      return;
    }

    setInProgress(true);
    setOverallProgress(5);

    const keys = Object.keys(domains) as MigrationDomain[];
    let successCount = 0;

    for (let i = 0; i < keys.length; i++) {
      const domainKey = keys[i];
      const domain = domains[domainKey];

      if (domain.count === 0) {
        setDomains(prev => ({
          ...prev,
          [domainKey]: { ...prev[domainKey], status: 'skipped' }
        }));
        successCount++;
        setOverallProgress(Math.round(((i + 1) / keys.length) * 100));
        continue;
      }

      setDomains(prev => ({
        ...prev,
        [domainKey]: { ...prev[domainKey], status: 'running' }
      }));

      try {
        // Run migration based on domain type
        switch (domainKey) {
          case 'profil':
            await syncProfileToFirestore(store.userProfile);
            break;
          case 'metriques':
            await syncMetricsToFirestore(store.metrics);
            break;
          case 'activites':
            await syncActivitiesToFirestore(store.garminActivities);
            break;
          case 'repas':
            await Promise.all(store.mealLogs.map(log => syncMealLogToFirestore(log)));
            break;
          case 'recettes':
            await Promise.all(store.recipes.map(rec => syncRecipeToFirestore(rec)));
            break;
          case 'formulaires_hooper':
            await Promise.all([
              ...store.hooperLogs.map(log => syncHooperLogToFirestore(log)),
              ...store.sessionRpeLogs.map(log => syncSessionRpeToFirestore(log)),
              ...store.weeklyScreeningLogs.map(log => syncWeeklyScreeningLogToFirestore(log))
            ]);
            break;
          case 'douleurs':
            await Promise.all(store.painLogs.map(log => syncPainLogToFirestore(log)));
            break;
          case 'contexte':
            await Promise.all(store.contextLogs.map(log => syncContextLogToFirestore(log)));
            break;
          case 'allergens':
            await Promise.all(store.allergenBypassLogs.map(log => syncAllergenBypassLogToFirestore(log)));
            break;
          default:
            break;
        }

        setDomains(prev => ({
          ...prev,
          [domainKey]: { ...prev[domainKey], status: 'success' }
        }));
        successCount++;
      } catch (err: any) {
        setDomains(prev => ({
          ...prev,
          [domainKey]: { 
            ...prev[domainKey], 
            status: 'failed', 
            error: err.message || "Erreur de connexion Firestore" 
          }
        }));
      }

      setOverallProgress(Math.round(((i + 1) / keys.length) * 100));
    }

    setInProgress(false);
    if (successCount === keys.length) {
      setCompleted(true);
    }
  };

  const handleValidateAndDone = () => {
    // Save isMigratedToCloud flag to Zustand store which persists to IDB key
    useStore.setState({ isMigratedToCloud: true });
    setShowPanel(false);
  };

  const handleDismissTemporarily = () => {
    setShowPanel(false);
  };

  if (!showPanel) return null;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl text-xs animate-fade-in">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <CloudLightning size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Assistant de Migration Cloud Aura</h2>
              <p className="text-muted-foreground">La source de vérité de l'application passe sur le Cloud (Firestore).</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500">
            PHASE 0 & 1 CONSOLIDATION ⚡
          </Badge>
        </div>

        <div className="p-4 bg-secondary/20 rounded-xl leading-relaxed space-y-2 text-muted-foreground">
          <p>
            Nous avons détecté des données stockées uniquement dans cet appareil (Zustand / IndexedDB). Afin de garantir une synchronisation cross-device bidirectionnelle et d'éviter les pertes de données lors de la purge des navigateurs, ces données doivent être migrées.
          </p>
          <div className="flex gap-2 items-center text-amber-400 font-bold bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-[10px]">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Vos données locales resteront sécurisées et ne seront pas purgées avant validation finale.</span>
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold text-muted-foreground block uppercase">Étapes préparatoires requises :</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${backupExported ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-secondary/10'} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <FileJson size={13} className="text-blue-500" />
                  1. Backup de Sécurité
                </span>
                {backupExported && <span className="text-emerald-500 font-bold">✔ OK</span>}
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Exportez vos données actuelles sous forme de fichier JSON par précaution d'intégrité de vos performances.
              </p>
              <Button 
                onClick={handleExportBackup} 
                variant="outline" 
                size="sm" 
                className="w-full gap-1.5 h-8 text-[11px]"
              >
                <Download size={12} />
                Exporter ma base locale JSON
              </Button>
            </div>

            <div className={`p-3 rounded-lg border ${completed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-secondary/10'} space-y-1.5 flex flex-col justify-between`}>
              <div>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Database size={13} className="text-amber-500" />
                  2. Migration par lot
                </span>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Téléversez de façon atomique vos profils, repas, recettes, scores Hooper et évaluations de douleurs.
                </p>
              </div>
              <Button 
                onClick={executeMigration}
                disabled={!backupExported || inProgress || completed}
                className="w-full gap-1.5 h-8 text-[11px] font-bold font-sans bg-amber-500 hover:bg-amber-600 text-black"
              >
                {inProgress ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Migration en cours...
                  </>
                ) : completed ? (
                  <>
                    <CheckCircle size={12} className="text-white fill-emerald-500" />
                    Migration Complétée !
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    Lancer la migration cloud 🚀
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {overallProgress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
              <span>Avancement Global :</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} />
          </div>
        )}

        <div className="border rounded-xl divide-y overflow-hidden max-h-56 overflow-y-auto bg-background/40">
          {Object.entries(domains).map(([key, domain]) => {
            const state = domain as DomainState;
            return (
              <div key={key} className="p-2.5 flex justify-between items-center">
                <div className="min-w-0">
                  <span className="font-medium text-foreground block">{state.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{state.count} enregistrement(s) trouvé(s)</span>
                </div>
                <div>
                  {state.status === 'idle' && (
                    <Badge variant="secondary" className="text-[10px]">En attente</Badge>
                  )}
                  {state.status === 'running' && (
                    <Badge variant="default" className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse">Envoi...</Badge>
                  )}
                  {state.status === 'success' && (
                    <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle size={10} />
                      Migré
                    </Badge>
                  )}
                  {state.status === 'skipped' && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Vide (Ignoré)</Badge>
                  )}
                  {state.status === 'failed' && (
                    <Badge variant="destructive" className="text-[10px] flex items-center gap-1" title={state.error}>
                      <XCircle size={10} />
                      Échec
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <button 
            onClick={handleDismissTemporarily}
            disabled={inProgress}
            className="text-muted-foreground hover:text-foreground text-[10px] font-bold underline px-1 py-0.5 disabled:opacity-50"
          >
            Plus tard (Mode Dégrade Local) ⏳
          </button>
          <div className="flex gap-2">
            <Button
              onClick={handleValidateAndDone}
              disabled={!completed}
              className="bg-emerald-500 hover:bg-emerald-600 font-bold font-sans h-9 px-4 text-white"
            >
              Confirmer la Migration & Basculer Cloud ✔
              <ArrowRight size={13} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
