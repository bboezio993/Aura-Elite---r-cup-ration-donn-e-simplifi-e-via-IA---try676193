import React, { useMemo } from 'react';
import { Moon, Clock, AlertCircle, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScrollArea } from "@/components/ui/scroll-area";

const formatDuration = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}`;
};

export function Sleep() {
  const metrics = useStore(state => state.metrics);
  
  const sleepScores = useMemo(() => {
    return metrics.filter(m => m.type === 'sleep_score').reduce((acc, m) => {
      const dateStr = m.timestamp.split('T')[0];
      if (!acc[dateStr] || m.value > acc[dateStr]) acc[dateStr] = m.value;
      return acc;
    }, {} as Record<string, number>);
  }, [metrics]);

  const sleepData = useMemo(() => {
    // Filter out absurd values (> 18h) that might have been saved from previous buggy imports
    const sleepMetrics = metrics.filter(m => m.type === 'sleep_duration' && m.value > 0 && m.value <= 18);
    
    // Group by date to handle potential multiple entries per day (e.g. naps)
    const groupedByDate = sleepMetrics.reduce((acc, m) => {
      const dateStr = m.timestamp.split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = 0;
      }
      // Take the max value for a given day to avoid summing overlapping imports
      acc[dateStr] = Math.max(acc[dateStr], m.value);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedByDate)
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, duration]) => ({
        date: date.split('-').slice(1).join('/'),
        fullDate: date,
        duration: Number(duration.toFixed(2)),
        score: sleepScores[date] || undefined
      }));
  }, [metrics, sleepScores]);

  const hasData = sleepData.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Moon size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Sommeil & Récupération</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Le sommeil est le pilier central de la performance. Suivez vos cycles, votre dette de sommeil 
          et l'efficacité de vos nuits.
        </p>
        
        <div className="bento-card max-w-2xl w-full text-left mb-8 bg-white">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-[#5856D6]" />
            L'importance des cycles
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            Aura Elite ne regarde pas seulement la durée, mais la structure de votre sommeil. 
            Le sommeil profond (N3) est crucial pour la récupération physique (hormone de croissance), 
            tandis que le sommeil paradoxal (REM) consolide la mémoire et la récupération cognitive.
          </p>
          <div className="flex items-start gap-3 p-4 bg-[#F2F2F7] rounded-xl">
            <AlertCircle size={16} className="text-[#0071E3] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D1D1F]">
              <strong>Le saviez-vous ?</strong> Un sommeil insuffisant ou irrégulier peut être associé à une récupération moindre et à une fatigue accrue. Ce signal doit être interprété avec le ressenti, la charge d’entraînement et le contexte.
            </p>
          </div>
        </div>

        <Button nativeButton={false} render={<Link to="/connections/garmin" />} className="bg-[#5856D6] text-white hover:bg-[#5856D6]/90">
          Importer depuis Garmin
        </Button>
      </div>
    );
  }

  const latestSleep = sleepData[sleepData.length - 1];
  const avgSleep = sleepData.length > 0 ? sleepData.reduce((acc, curr) => acc + curr.duration, 0) / sleepData.length : 0;
  
  let qualityText = "Bonne";
  let qualitySub = "Récupération mesurée";
  if (latestSleep?.score) {
    if (latestSleep.score >= 80) { qualityText = "Excellente"; qualitySub = "Restauration optimale"; }
    else if (latestSleep.score >= 60) { qualityText = "Moyenne"; qualitySub = "Récupération partielle"; }
    else { qualityText = "Faible"; qualitySub = "Dette de sommeil"; }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Sommeil & Récupération</h2>
          <p className="text-muted-foreground">
            Analyse de vos nuits et de votre récupération.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Dernière Nuit</div>
            <div className="text-[42px] font-bold leading-tight text-[#5856D6]">{formatDuration(latestSleep?.duration || 0)}</div>
            <div className="text-sm text-muted-foreground mt-1">{latestSleep?.date}</div>
          </div>
          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Moyenne (Période)</div>
            <div className="text-[42px] font-bold leading-tight">{formatDuration(avgSleep)}</div>
          </div>
          <div className="bento-card bento-gradient text-center justify-center items-center" style={{ background: 'linear-gradient(135deg, #5856D6 0%, #3F3D9B 100%)' }}>
            <div className="bento-title">Score Qualité (Est.)</div>
            <div className="text-[42px] font-bold leading-tight text-white">{latestSleep?.score ? `${latestSleep.score}/100` : qualityText}</div>
            <div className="text-[14px] text-white/80 mt-1">{qualitySub}</div>
          </div>
        </div>

        <div className="bento-card mb-8">
          <h3 className="text-lg font-semibold mb-6">Évolution de la durée du sommeil</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepData}>
                <defs>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5856D6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#5856D6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                <XAxis dataKey="date" stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} domain={[0, 12]} tickFormatter={(val) => `${val}h`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  formatter={(value: number) => [formatDuration(value), 'Durée']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="duration" 
                  stroke="#5856D6" 
                  fillOpacity={1} 
                  fill="url(#colorSleep)" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
