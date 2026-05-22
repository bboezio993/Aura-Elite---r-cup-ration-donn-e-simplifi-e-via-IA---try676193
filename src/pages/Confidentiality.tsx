import React, { useRef, useState } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { useStore } from '../store/useStore';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  CheckCircle,
  CloudLightning,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function Confidentiality() {
  const { user } = useAuth();
  const store = useStore();
  const [syncing, setSyncing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats computed from local store
  const metricsCount = store.metrics?.length || 0;
  const activitiesCount = store.garminActivities?.length || 0;
  const mealLogsCount = store.mealLogs?.length || 0;
  const recipesCount = store.recipes?.length || 0;
  const healthLogsCount = (store.hooperLogs?.length || 0) + (store.painLogs?.length || 0) + (store.menstrualLogs?.length || 0);

  const handleExport = () => {
    try {
      const dataStr = store.exportLocalData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `aura_elite_export_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      setSuccessMsg("Données exportées avec succès.");
    } catch (e) {
      setErrorMsg("Échec de l'exportation des données.");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = e.target.files;
    if (!files || files.length === 0) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Merge into store
        useStore.setState({
          metrics: parsed.metrics || store.metrics,
          rejectedMetrics: parsed.rejectedMetrics || store.rejectedMetrics,
          menstrualLogs: parsed.menstrualLogs || store.menstrualLogs,
          garminActivities: parsed.garminActivities || store.garminActivities,
          hooperLogs: parsed.hooperLogs || store.hooperLogs,
          sessionRpeLogs: parsed.sessionRpeLogs || store.sessionRpeLogs,
          mealLogs: parsed.mealLogs || store.mealLogs,
          recipes: parsed.recipes || store.recipes,
          allergenBypassLogs: parsed.allergenBypassLogs || store.allergenBypassLogs,
          painLogs: parsed.painLogs || store.painLogs,
          contextLogs: parsed.contextLogs || store.contextLogs,
          userProfile: parsed.userProfile || store.userProfile,
        });

        // Recompute analytics engine
        store.computeEngineScores();

        setSuccessMsg("Données importées avec succès.");
        setErrorMsg(null);
      } catch (err) {
        setErrorMsg("Fichier JSON invalide ou corrompu.");
        setSuccessMsg(null);
      }
    };
    fileReader.readAsText(files[0]);
  };

  const handleTriggerImportClick = () => {
    fileInputRef.current?.click();
  };

  const handlePurge = () => {
    if (window.confirm("Êtes-vous certain de vouloir purger l'ensemble de vos données de l'application (local et cloud) ? Cette action est irréversible !")) {
      store.clearDomainData("all");
      setSuccessMsg("Données locales purgées avec succès.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-background max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-primary w-8 h-8" />
          Sécurité & Données Cloud
        </h1>
        <p className="text-muted-foreground">
          Aura Elite est une application souveraine. Vos données de biométrie active et de bien-être subjectif sont sécurisées sur un Cloud chiffré en temps réel.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>État de Synchronisation</CardTitle>
                <CardDescription>Tous vos enregistrements et journaux de bord sportifs</CardDescription>
              </div>
              <Badge variant={user ? "default" : "secondary"} className="gap-1 px-3 py-1 text-xs">
                <CloudLightning size={12} className="animate-pulse" />
                {user ? "Cloud Actif" : "Mode Local"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-secondary/40 p-4 rounded-xl border border-border/50 text-center">
                <span className="text-xs text-muted-foreground font-mono">Biométrie</span>
                <p className="text-2xl font-bold tracking-tight mt-1">{metricsCount}</p>
                <span className="text-[10px] text-muted-foreground block mt-1">signaux gérés</span>
              </div>
              <div className="bg-secondary/40 p-4 rounded-xl border border-border/50 text-center">
                <span className="text-xs text-muted-foreground font-mono">Activités</span>
                <p className="text-2xl font-bold tracking-tight mt-1">{activitiesCount}</p>
                <span className="text-[10px] text-muted-foreground block mt-1">séances GPS</span>
              </div>
              <div className="bg-secondary/40 p-4 rounded-xl border border-border/50 text-center">
                <span className="text-xs text-muted-foreground font-mono">Repas</span>
                <p className="text-2xl font-bold tracking-tight mt-1">{mealLogsCount}</p>
                <span className="text-[10px] text-muted-foreground block mt-1">compositions</span>
              </div>
              <div className="bg-secondary/40 p-4 rounded-xl border border-border/50 text-center">
                <span className="text-xs text-muted-foreground font-mono">Bien-être</span>
                <p className="text-2xl font-bold tracking-tight mt-1">{healthLogsCount}</p>
                <span className="text-[10px] text-muted-foreground block mt-1">formulaires</span>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-border rounded-xl bg-secondary/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Database size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Banque d'activité stockée localement dans IndexedDB</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user ? `Associé au compte Google : ${user.email}` : "Veuillez vous assurer d'être connecté pour synchroniser vers le Cloud."}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border/50 pt-6 flex justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
              <CheckCircle size={14} className="text-emerald-500" />
              Base à jour : {new Date().toLocaleTimeString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setSyncing(true);
                setTimeout(() => {
                  setSyncing(false);
                  store.computeEngineScores();
                  setSuccessMsg("Données réalignées et recalculées avec succès.");
                }, 1000);
              }}
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              Forcer un Recalcul
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Exporter & Import</CardTitle>
            <CardDescription>Conservez ou migrez votre souveraineté numérique.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <p className="text-xs text-muted-foreground">
              Téléchargez une copie complète au format JSON de l'ensemble de votre base locale et de vos métriques calculées.
            </p>
            <Button onClick={handleExport} variant="outline" className="w-full gap-2 text-sm">
              <Download size={16} />
              Télécharger ma base JSON
            </Button>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Restaurez une base exportée à partir d'un fichier .json existant sur votre ordinateur.
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              accept=".json" 
              className="hidden" 
            />
            <Button onClick={handleTriggerImportClick} variant="outline" className="w-full gap-2 text-sm bg-primary/5 border-primary/20 text-primary hover:bg-primary/10">
              <Upload size={16} />
              Restaurer une copie.json
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Trash2 size={18} />
            Zone de Danger : Purge des données
          </CardTitle>
          <CardDescription className="text-red-200/60">
            Ces actions effaceront de manière permanente tout l'historique de l'athlète.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-200/80 max-w-2xl">
            Si vous souhaitez réinitialiser complètement votre profil sportif, vider vos journaux de repas Open Food Facts, vos calculs d'exposition de charge et vos questionnaires Hooper, vous pouvez forcer la suppression immédiate.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePurge} variant="destructive" className="gap-2">
            Purger toutes mes données locales
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
