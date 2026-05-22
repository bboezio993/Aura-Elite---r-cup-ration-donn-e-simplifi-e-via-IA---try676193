import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { GarminImportType, GarminImportLog } from '../types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Activity, Calendar, History, AlertTriangle } from 'lucide-react';
import { processGarminFile } from '../services/garmin/pipeline';
import { SessionRPEForm } from '../components/forms/SessionRPEForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GarminImportHub() {
  const { garminImportLogs, garminActivities, sessionRpeLogs, addGarminImportLog } = useStore();
  
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<GarminImportType>('history');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0], activeTab);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0], activeTab);
    }
  };

  const processFile = async (file: File, type: GarminImportType) => {
    const logId = Date.now().toString();
    const newLog: GarminImportLog = {
      id: logId,
      type,
      filename: file.name,
      importDate: new Date().toISOString(),
      status: 'processing',
      recordsAdded: 0,
    };
    
    addGarminImportLog(newLog);

    // Send to debug endpoint (ONLY FILE TREE TO AVOID 50MB LIMIT)
    try {
      let fileTree: string[] = [];
      
      if (file.name.endsWith('.zip')) {
        import('jszip').then(async (JSZip) => {
          const zip = new JSZip.default();
          const contents = await zip.loadAsync(file);
          fileTree = Object.keys(contents.files);
          
          await fetch('/api/debug/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name + '.tree.json',
              type: 'json',
              content: JSON.stringify(fileTree, null, 2)
            })
          });
        });
      }
    } catch (e) {
      console.error("Failed to send debug file", e);
    }

    // Run pipeline asynchronously
    processGarminFile(file, type, logId);
  };

  const renderDropZone = (type: GarminImportType, title: string, description: string, icon: React.ReactNode) => (
    <div className="bg-card border border-border rounded-xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm font-medium mb-1">Glissez-déposez votre fichier ici</p>
        <p className="text-xs text-muted-foreground mb-4">ou cliquez pour parcourir vos fichiers</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileSelect}
          accept={type === 'activity' ? '.csv' : type === 'history' ? '.zip' : '.zip,.json,.fit'}
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          Sélectionner un fichier
        </Button>
      </div>
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none"><CheckCircle2 size={12} className="mr-1"/> Succès</Badge>;
      case 'partial': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none"><CheckCircle2 size={12} className="mr-1"/> Partiel</Badge>;
      case 'error': return <Badge variant="destructive"><AlertCircle size={12} className="mr-1"/> Erreur</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none"><AlertTriangle size={12} className="mr-1"/> Attention</Badge>;
      case 'duplicate': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none"><AlertCircle size={12} className="mr-1"/> Doublon</Badge>;
      case 'processing': return <Badge variant="outline" className="animate-pulse"><Clock size={12} className="mr-1"/> Traitement...</Badge>;
      default: return null;
    }
  };

  const filteredLogs = garminImportLogs.filter(log => log.type === activeTab);

  return (
    <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Centre d'Import Garmin</h2>
        <p className="text-muted-foreground">
          Gérez vos imports de données Garmin. Commencez par un export complet, puis mettez à jour régulièrement avec vos données quotidiennes et vos activités.
        </p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-border pb-px">
        <button 
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'history' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="flex items-center gap-2"><History size={16} /> Historique Complet</span>
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button 
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'wellness' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('wellness')}
        >
          <span className="flex items-center gap-2"><Calendar size={16} /> Wellness Journalier</span>
          {activeTab === 'wellness' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
        <button 
          className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'activity' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('activity')}
        >
          <span className="flex items-center gap-2"><Activity size={16} /> Activités</span>
          {activeTab === 'activity' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'history' && renderDropZone(
        'history', 
        'Import Initial (Archive Complète)', 
        'Importez le fichier .zip contenant tout votre historique Garmin. ATTENTION : Vous devez utiliser l\'export complet (GDPR) de Garmin qui fournit des fichiers JSON. Allez sur garmin.com > Compte > Gérer vos données > Exporter vos données.',
        <History size={20} />
      )}

      {activeTab === 'wellness' && renderDropZone(
        'wellness', 
        'Données Quotidiennes (Wellness)', 
        'Importez un fichier ZIP (ou les fichiers .JSON en masse) venant de l\'export Profil Garmin. L\'export FIT quotidien ne contient pas les data vitales de Sommeil/VFC en clair. Utilisez plutôt un export périodique de vos données.',
        <Calendar size={20} />
      )}

      {activeTab === 'activity' && renderDropZone(
        'activity', 
        'Activités Sportives', 
        'Importez vos fichiers .csv d\'activités pour enrichir l\'analyse de votre charge d\'entraînement.',
        <Activity size={20} />
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold">Journal des imports ({activeTab})</h3>
        </div>
        
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>Aucun import réalisé pour cette catégorie.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <FileText size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{log.filename}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{new Date(log.importDate).toLocaleString('fr-FR')}</span>
                      {log.recordsAdded > 0 && (
                        <span>• {log.recordsAdded} éléments ajoutés</span>
                      )}
                      {log.details?.filesProcessed !== undefined && (
                        <span>• {log.details.filesProcessed} fichiers traités</span>
                      )}
                    </div>
                    {log.errorMessage && (
                      <p className="text-xs text-destructive mt-1">{log.errorMessage}</p>
                    )}
                    {log.details?.debugFileContents && Object.keys(log.details.debugFileContents).length > 0 && (
                      <details className="mt-2 text-xs bg-muted p-2 rounded max-w-[500px]">
                        <summary className="cursor-pointer text-muted-foreground font-medium">Contenu pour analyse profonde (Cliquez ici)</summary>
                        <div className="mt-2 max-h-[200px] overflow-auto whitespace-pre-wrap text-[10px] font-mono select-all">
                          {"// Copiez-collez ce contenu dans votre prochain message de prompt pour l'analyse :\n" +
                            JSON.stringify(log.details.debugFileContents, null, 2)}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
                <div>
                  {getStatusBadge(log.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'activity' && garminActivities.length > 0 && (
        <div className="mt-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold">Dernières activités importées</h3>
          </div>
          <div className="divide-y divide-border">
            {garminActivities.slice(0, 5).map(activity => {
              const hasRpe = sessionRpeLogs.some(r => r.activityId === activity.id);
              return (
                <div key={activity.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.date} • {activity.type}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p>{activity.distance > 0 ? `${activity.distance} km` : activity.duration}</p>
                      {activity.tss && <p className="text-xs text-muted-foreground">TSS: {activity.tss}</p>}
                    </div>
                    {!hasRpe ? (
                      <Dialog>
                        <DialogTrigger render={
                          <Button size="sm" variant="outline" className="h-8 text-xs">
                            Saisir sRPE
                          </Button>
                        } />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Charge de la séance (sRPE)</DialogTitle>
                          </DialogHeader>
                          <SessionRPEForm activityId={activity.id} />
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="h-8 flex items-center px-3 text-xs font-medium text-green-600 bg-green-50 rounded-md">
                        sRPE Validé
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
