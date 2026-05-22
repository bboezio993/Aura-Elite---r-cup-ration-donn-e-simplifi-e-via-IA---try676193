import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Heart, 
  Moon, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  Info,
  Droplets,
  Brain,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider, Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { DailyMetrics, AnalysisResult, Recommendation } from '../types';
import { analyzeHealthData } from '../services/gemini';
import { HooperForm } from '../components/forms/HooperForm';
import { WeeklyScreeningForm } from '../components/forms/WeeklyScreeningForm';
import { EngineScoreCard } from '../components/dashboard/EngineScoreCard';
import { useStore } from '../store/useStore';
import { generatePersonalizedRecommendations } from '../domain/recommendations/recommendationEngine';

import { runExplainabilityLayer } from '../services/analysisEngine/explainabilityLayer';

export function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const storeState = useStore();
  const { metrics, garminActivities, engineScores, computeEngineScores, userProfile } = storeState;

  const personalizedRecs = useMemo(() => {
    return generatePersonalizedRecommendations(useStore.getState(), engineScores);
  }, [engineScores, metrics]);

  const fallbackExplainability = useMemo(() => {
    return runExplainabilityLayer(useStore.getState());
  }, [engineScores]);

  // Run engine on mount if needed
  useEffect(() => {
    if (!engineScores) {
      computeEngineScores();
    }
  }, []);

  const handleRefreshAnalysis = async () => {
    computeEngineScores();
    
    // Keep the Gemini analysis for the text summary/recommendations
    setLoading(true);
    try {
      const result = await analyzeHealthData(userProfile, []);
      setAnalysis(result);
    } catch (error) {
      console.error("Error refreshing analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasData = metrics.length > 0 || garminActivities.length > 0;

  const lastGarmin = useMemo(() => {
    const dates = garminActivities.map(a => new Date(a.date).getTime());
    return dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : 'Jamais';
  }, [garminActivities]);

  const lastManual = useMemo(() => {
    const dates = useStore.getState().hooperLogs.map(l => new Date(l.date).getTime());
    return dates.length > 0 ? new Date(Math.max(...dates)).toLocaleDateString() : 'Jamais';
  }, [useStore.getState().hooperLogs]);

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Activity size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Bienvenue sur Aura Elite</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Votre tableau de bord est vide. Connectez vos sources de données ou saisissez vos premières métriques pour démarrer l'analyse.
        </p>
        <div className="flex gap-4">
          <Button nativeButton={false} render={<Link to="/connections" />} className="bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
            Importer mes fichiers Garmin
          </Button>
          <Dialog>
            <DialogTrigger render={
              <Button variant="outline" className="gap-2">
                <Plus size={16} />
                Saisie Manuelle
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Check-in Quotidien (Hooper)</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[80vh] pr-4">
                <HooperForm onComplete={() => {}} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Floating Actions */}
        <div className="absolute top-4 right-8 z-10 flex items-center gap-4">
          <Dialog>
            <DialogTrigger render={
              <Button size="sm" variant="outline" className="gap-2 shadow-sm">
                <Brain size={16} />
                Screening Hebdo
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Screening Psychologique (Hebdomadaire)</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[80vh] pr-4">
                <WeeklyScreeningForm onComplete={() => {
                  console.log("Screening saved");
                }} />
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={
              <Button size="sm" className="gap-2 shadow-sm bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
                <Plus size={16} />
                Check-in Quotidien
              </Button>
            } />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Check-in Quotidien (Hooper)</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[80vh] pr-4">
                <HooperForm onComplete={() => {
                  console.log("Hooper saved");
                }} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleRefreshAnalysis} disabled={loading} className="bg-white/50 backdrop-blur-sm">
            {loading ? "Analyse..." : "Rafraîchir l'Analyse"}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold mb-2 tracking-tight">Aura Elite Engine</h1>
              <p className="text-muted-foreground">
                Analyse multicouche de votre physiologie et de votre charge d'entraînement.
              </p>
            </div>

            {/* Engine Score Card (Couches C, D, E, G & Fusion) */}
            {engineScores ? (
              <EngineScoreCard scores={engineScores} />
            ) : (
              <div className="p-8 text-center bg-secondary rounded-xl">
                <RefreshCw className="animate-spin mx-auto mb-4 text-muted-foreground" />
                <p>Calcul des scores du moteur en cours...</p>
              </div>
            )}

            {/* AI Summary (Gemini) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Summary */}
                <div className="bento-card bg-white">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-[#0071E3]" />
                    Synthèse pédagogique
                  </h3>
                  
                  {analysis ? (
                    <div className="space-y-4">
                      <p className="text-[#1D1D1F] leading-relaxed">
                        {analysis.summary}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 size={12} /> Reformulé par IA
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[#1D1D1F] leading-relaxed font-medium">
                        {fallbackExplainability.shortSummary}
                      </p>
                      <p className="text-[#1D1D1F] leading-relaxed text-muted-foreground">
                        {fallbackExplainability.naturalLanguageExplanation}
                      </p>
                      <div className="pt-2">
                        <Button onClick={handleRefreshAnalysis} disabled={loading} size="sm" variant="outline" className="gap-2">
                          {loading ? <RefreshCw className="animate-spin" size={14} /> : <Brain size={14} />}
                          Reformuler avec Gemini
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <ArrowRight size={18} className="text-[#5856D6]" />
                    Recommandations d'entraînement et de récupération
                  </h3>
                  <div className="grid gap-4">
                    {personalizedRecs.map(rec => (
                      <div key={rec.id} className="bento-card bg-background border border-border/80 hover:border-primary/25 transition-all shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground mr-2 tracking-wider">
                              {rec.category}
                            </Badge>
                            <h4 className="font-bold text-sm text-foreground inline-block mt-1">{rec.title}</h4>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            rec.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                            rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>
                        
                        <div className="mt-2.5 flex items-center gap-1.5 bg-secondary/25 p-2 rounded-lg text-xs font-semibold text-primary">
                          <CheckCircle2 size={13} className="shrink-0" />
                          <span>Action recommandée : {rec.actionLabel}</span>
                        </div>

                        {rec.scientificClaim && (
                          <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertCircle size={13} className="text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-[11px] text-muted-foreground italic leading-normal">
                                <strong>Base scientifique :</strong> {rec.scientificClaim}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                              <div className="p-1 px-2 rounded-md bg-secondary/15 text-[10px] space-y-0.5">
                                <span className="text-[8px] text-muted-foreground uppercase font-semibold block">Preuves</span>
                                <span className={`font-bold uppercase text-[9px] ${
                                  rec.evidenceLevel === 'robust' ? 'text-emerald-400' :
                                  rec.evidenceLevel === 'probable' ? 'text-indigo-400' :
                                  'text-amber-500'
                                }`}>
                                  {rec.evidenceLevel === 'robust' ? 'Robuste' : rec.evidenceLevel === 'probable' ? 'Probable' : 'Exploratoire'}
                                </span>
                              </div>
                              <div className="p-1 px-2 rounded-md bg-secondary/15 text-[10px] space-y-0.5 font-mono">
                                <span className="text-[8px] text-muted-foreground uppercase font-semibold block font-sans">Confiance</span>
                                <span className="text-foreground font-bold">{rec.confidence}%</span>
                              </div>
                              <div className="p-1 px-2 rounded-md bg-secondary/15 text-[10px] space-y-0.5 col-span-2">
                                <span className="text-[8px] text-muted-foreground uppercase font-semibold block">Données mobilisées</span>
                                <span className="text-foreground font-semibold truncate block">
                                  {rec.basedOn?.map(b => b.replace('_', ' ')).join(', ') || 'Historique'}
                                </span>
                              </div>
                            </div>

                            {rec.limitations && rec.limitations.length > 0 && (
                              <div className="text-[9.5px] text-muted-foreground bg-secondary/10 p-2 rounded-lg leading-tight flex gap-1 items-start">
                                <span className="font-bold text-amber-500 shrink-0 uppercase text-[8px] mt-0.5">Limites :</span>
                                <span>{rec.limitations.join('. ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Context */}
              <div className="space-y-6">
                <div className="bento-card bg-[#F2F2F7]">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[#86868B]">Contexte Biométrique</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#1D1D1F]">Tendance HRV</span>
                      <span className={`text-sm font-medium ${analysis?.trends.hrv === 'up' ? 'text-green-600' : analysis?.trends.hrv === 'down' ? 'text-red-600' : 'text-[#86868B]'}`}>
                        {analysis?.trends.hrv === 'up' ? '↗ En hausse' : analysis?.trends.hrv === 'down' ? '↘ En baisse' : '→ Stable'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#1D1D1F]">Récupération</span>
                      <span className={`text-sm font-medium ${analysis?.trends.recovery === 'improving' ? 'text-green-600' : analysis?.trends.recovery === 'declining' ? 'text-red-600' : 'text-[#86868B]'}`}>
                        {analysis?.trends.recovery === 'improving' ? '↗ S\'améliore' : analysis?.trends.recovery === 'declining' ? '↘ Se dégrade' : '→ Stable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bento-card">
                  <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-[#86868B]">Sources Actives</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${lastGarmin === 'Jamais' ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                      <span className="text-sm font-medium">Garmin Connect</span>
                      <span className="text-xs text-muted-foreground ml-auto">{lastGarmin}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${lastManual === 'Jamais' ? 'bg-gray-300' : 'bg-green-500'}`}></div>
                      <span className="text-sm font-medium">Saisie Manuelle</span>
                      <span className="text-xs text-muted-foreground ml-auto">{lastManual}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
