import React, { useMemo } from 'react';
import { Heart, Activity, AlertCircle, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScrollArea } from "@/components/ui/scroll-area";

export function Biometrics() {
  const metrics = useStore(state => state.metrics);
  
  const rhrData = useMemo(() => {
    return metrics
      .filter(m => m.type === 'rhr')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(m => ({
        date: m.timestamp.split('T')[0].split('-').slice(1).join('/'),
        rhr: m.value
      }));
  }, [metrics]);

  const hrvData = useMemo(() => {
    return metrics
      .filter(m => m.type === 'hrv_rmssd')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(m => ({
        date: m.timestamp.split('T')[0].split('-').slice(1).join('/'),
        hrv: m.value
      }));
  }, [metrics]);

  const hasData = rhrData.length > 0 || hrvData.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Heart size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Biométrie & Système Nerveux</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Pour analyser votre variabilité de fréquence cardiaque (HRV) et votre fréquence cardiaque au repos (RHR), 
          Aura Elite a besoin de données physiologiques continues.
        </p>
        
        <div className="bento-card max-w-2xl w-full text-left mb-8 bg-white">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-[#0071E3]" />
            Pourquoi mesurer la HRV ?
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            La HRV (Root Mean Square of Successive Differences - rMSSD) est le marqueur le plus fiable 
            de la récupération de votre système nerveux parasympathique. Une baisse soudaine indique 
            un stress systémique (entraînement, maladie, psychologique).
          </p>
          <div className="flex items-start gap-3 p-4 bg-[#F2F2F7] rounded-xl">
            <AlertCircle size={16} className="text-[#FF3B30] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D1D1F]">
              <strong>Important :</strong> Les mesures doivent être prises au réveil ou pendant le sommeil profond 
              pour être scientifiquement valides.
            </p>
          </div>
        </div>

        <Button nativeButton={false} render={<Link to="/connections/garmin" />} className="bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
          Importer depuis Garmin
        </Button>
      </div>
    );
  }

  const latestRhr = rhrData[rhrData.length - 1];
  const latestHrv = hrvData[hrvData.length - 1];

  return (
    <ScrollArea className="flex-1">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Biométrie & Système Nerveux</h2>
          <p className="text-muted-foreground">
            Analyse de votre fréquence cardiaque au repos et de votre variabilité cardiaque.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bento-card bento-blue text-center justify-center items-center">
            <div className="bento-title text-[#0071E3]">RHR (Dernier)</div>
            <div className="text-[42px] font-bold leading-tight text-[#0071E3]">{latestRhr?.rhr || '-'}<span className="text-xl ml-1 opacity-60 font-normal">bpm</span></div>
            <div className="text-sm text-[#0071E3]/80 mt-1">{latestRhr?.date || '-'}</div>
          </div>
          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">HRV (Dernier)</div>
            <div className="text-[42px] font-bold leading-tight">{latestHrv?.hrv || '-'}<span className="text-xl ml-1 text-[#86868B] font-normal">ms</span></div>
            <div className="text-sm text-muted-foreground mt-1">{latestHrv?.date || '-'}</div>
          </div>
        </div>

        {rhrData.length > 0 && (
          <div className="bento-card mb-8">
            <h3 className="text-lg font-semibold mb-6 text-[#0071E3]">Évolution de la Fréquence Cardiaque au Repos (RHR)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rhrData}>
                  <defs>
                    <linearGradient id="colorRhr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0071E3" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0071E3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                  <XAxis dataKey="date" stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rhr" 
                    stroke="#0071E3" 
                    fillOpacity={1} 
                    fill="url(#colorRhr)" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {hrvData.length > 0 && (
          <div className="bento-card mb-8">
            <h3 className="text-lg font-semibold mb-6">Évolution de la Variabilité Cardiaque (HRV)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hrvData}>
                  <defs>
                    <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                  <XAxis dataKey="date" stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E5EA', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="hrv" 
                    stroke="#34C759" 
                    fillOpacity={1} 
                    fill="url(#colorHrv)" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
