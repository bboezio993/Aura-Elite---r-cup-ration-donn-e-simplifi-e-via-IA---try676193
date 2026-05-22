import React, { useMemo, useState } from "react";
import { Zap, Activity, AlertCircle, TrendingUp, Calendar, Clock, Flame, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { buildDailyLoads } from "../services/analysisEngine/engine";
import { calculateEWMA_ACWR } from "../services/analysisEngine/math";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#FF9500', '#0071E3', '#34C759', '#5856D6', '#FF2D55', '#AF52DE'];

export function Training() {
  const { garminActivities, engineScores } = useStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  const hasData = garminActivities.length > 0;

  const filteredActivities = useMemo(() => {
    const now = new Date();
    let daysToSubtract = 30;
    if (timeRange === 'week') daysToSubtract = 7;
    if (timeRange === 'year') daysToSubtract = 365;
    
    const cutoffDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
    
    return [...garminActivities]
      .filter(a => new Date(a.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [garminActivities, timeRange]);

  const chartData = useMemo(() => {
    // Generate dates from cutoff to now
    let daysToSubtract = 30;
    if (timeRange === 'week') daysToSubtract = 7;
    if (timeRange === 'year') daysToSubtract = 365;
    
    // We want the last X days, ending at the date of the most recent activity
    const now = new Date();
    let endDate = now;
    if (garminActivities.length > 0) {
      const lastActivityDate = new Date(garminActivities[0].date);
      // Give calendar a bit of buffer to show recent days if they are within a week, otherwise anchor to last activity
      if (now.getTime() - lastActivityDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
        endDate = lastActivityDate;
      }
    }

    const { sessionRpeLogs } = useStore.getState();

    // Generate historical ACWR
    // We compute 35 days of history for the EWMA math starting from each day in the chart
    const fullRangeLoads = buildDailyLoads(garminActivities, sessionRpeLogs, daysToSubtract + 35, endDate);
    
    const dataPoints = [];
    for (let i = 0; i < daysToSubtract; i++) {
        const d = new Date(endDate.getTime() - (daysToSubtract - 1 - i) * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        
        // Slicing the full historical loads up to the current day 'i'
        const loadsUpToThisDay = fullRangeLoads.slice(0, 35 + i + 1).slice(-35); // Always keep the last 35 days ending on this day
        const acwrForDay = calculateEWMA_ACWR(loadsUpToThisDay).ratio;

        const dayActivities = garminActivities.filter(a => a.date.startsWith(dateStr));
        const dayTss = dayActivities.reduce((acc, a) => acc + (a.tss || a.distance * 10 || 50), 0);
        const dayDuration = dayActivities.reduce((acc, a) => acc + (parseInt(a.duration.split(':')[0]) * 60 + parseInt(a.duration.split(':')[1] || '0')), 0);

        dataPoints.push({
            date: dateStr.split("-").slice(1).join("/"),
            tss: dayTss,
            duration: dayDuration,
            acwr: acwrForDay,
            title: dayActivities.length > 0 ? dayActivities[0].title : '',
            type: dayActivities.length > 0 ? dayActivities[0].type : ''
        });
    }

    return dataPoints;
  }, [garminActivities, timeRange]);

  const sportDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    filteredActivities.forEach(a => {
      dist[a.type] = (dist[a.type] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredActivities]);

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Zap size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">
          Charge d'Entraînement (ACWR)
        </h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Suivez les variations de charge aiguë (fatigue) sur charge chronique (fitness).
        </p>

        <div className="bento-card max-w-2xl w-full text-left mb-8 bg-white">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-[#FF9500]" />
            Le modèle ACWR (Acute:Chronic Workload Ratio)
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            Nous utilisons le modèle EWMA (Exponentially Weighted Moving
            Average) pour calculer votre charge. Il compare votre charge des 7
            derniers jours à celle des 28 derniers jours.
          </p>
          <ul className="text-sm text-[#86868B] space-y-2 mb-4 list-disc pl-5">
            <li>
              <strong>&lt; 0.8 :</strong> Sous-entraînement (Désentraînement)
            </li>
            <li>
              <strong>0.8 - 1.3 :</strong> Zone optimale (Sweet spot)
            </li>
            <li>
              <strong>&gt; 1.5 :</strong> Zone de vigilance (Charge aiguë élevée par rapport à l'historique)
            </li>
          </ul>
          <p className="text-[10px] text-muted-foreground italic mt-2 border-t border-border pt-1">
            À interpréter avec le sommeil, les douleurs, la fatigue et le contexte. L'ACWR ne prédit pas seul un événement de blessure.
          </p>
          <div className="flex items-start gap-3 p-4 bg-[#F2F2F7] rounded-xl">
            <AlertCircle size={16} className="text-[#FF3B30] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D1D1F]">
              <strong>Action requise :</strong> Synchronisez vos activités
              Garmin pour commencer à calculer votre ACWR.
            </p>
          </div>
        </div>

        <Button
          nativeButton={false}
          render={<Link to="/connections/garmin" />}
          className="bg-[#FF9500] text-white hover:bg-[#FF9500]/90"
        >
          Importer depuis Garmin
        </Button>
      </div>
    );
  }

  const acwr = engineScores?.acwr || (chartData.length > 0 ? chartData[chartData.length - 1].acwr : 0);
  let acwrStatus = "Inconnu";
  let acwrColor = "text-white/80";
  if (acwr > 0) {
    if (acwr < 0.8) {
      acwrStatus = "Sous-entraînement";
      acwrColor = "text-blue-200";
    } else if (acwr <= 1.3) {
      acwrStatus = "Zone Optimale";
      acwrColor = "text-green-200";
    } else if (acwr <= 1.5) {
      acwrStatus = "Surcharge contrôlée";
      acwrColor = "text-orange-200";
    } else {
      acwrStatus = "Zone de vigilance";
      acwrColor = "text-red-200";
    }
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Entraînement Pro</h2>
            <p className="text-muted-foreground">
              Analyse détaillée de la charge, distribution et intensité.
            </p>
          </div>
          <Tabs value={timeRange} onValueChange={(v: any) => setTimeRange(v)} className="w-[300px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">7 Jours</TabsTrigger>
              <TabsTrigger value="month">30 Jours</TabsTrigger>
              <TabsTrigger value="year">1 An</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Volume Total</div>
            <div className="text-[36px] font-bold leading-tight">
              {Math.round(chartData.reduce((acc, curr) => acc + curr.duration, 0) / 60)}<span className="text-lg text-muted-foreground font-normal ml-1">h</span>
            </div>
          </div>
          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Activités</div>
            <div className="text-[36px] font-bold leading-tight">
              {filteredActivities.length}
            </div>
          </div>
          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Charge Moyenne (TSS)</div>
            <div className="text-[36px] font-bold leading-tight text-[#FF9500]">
              {Math.round(chartData.reduce((acc, curr) => acc + curr.tss, 0) / (chartData.length || 1))}
            </div>
          </div>
          <div
            className="bento-card bento-gradient text-center justify-center items-center"
            style={{
              background: "linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)",
            }}
          >
            <div className="bento-title text-white/80">ACWR Actuel</div>
            <div className="text-[36px] font-bold leading-tight text-white">
              {acwr > 0 ? acwr.toFixed(2) : "-"}
            </div>
            <div className={`text-[12px] mt-1 ${acwrColor}`}>{acwrStatus}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bento-card lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6">Charge d'Entraînement (TSS)</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                  <XAxis dataKey="date" stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    cursor={{ fill: "#F2F2F7" }}
                  />
                  <Bar dataKey="tss" fill="#FF9500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bento-card">
            <h3 className="text-lg font-semibold mb-6">Distribution des Sports</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sportDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sportDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {sportDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bento-card mb-8">
          <h3 className="text-lg font-semibold mb-6">Évolution de l'ACWR (Acute:Chronic Workload Ratio)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                <XAxis dataKey="date" stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#86868B" fontSize={12} tickLine={false} axisLine={false} domain={[0, 2]} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                {/* Zones de référence ACWR */}
                <rect y={0} width="100%" height="100%" fill="#FF3B30" opacity={0.05} /> {/* Vigilance > 1.5 */}
                <rect y="25%" width="100%" height="10%" fill="#FF9500" opacity={0.05} /> {/* Surcharge 1.3 - 1.5 */}
                <rect y="35%" width="100%" height="25%" fill="#34C759" opacity={0.05} /> {/* Optimal 0.8 - 1.3 */}
                <rect y="60%" width="100%" height="40%" fill="#0071E3" opacity={0.05} /> {/* Sous-entraînement < 0.8 */}
                
                <Line 
                  type="stepAfter" 
                  dataKey="acwr"
                  name="ACWR Actuel"
                  stroke="#FF2D55" 
                  strokeWidth={3} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 rounded-sm"></div> Sous-entraînement (&lt;0.8)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 rounded-sm"></div> Optimal (0.8-1.3)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 rounded-sm"></div> Surcharge contrôlée (1.3-1.5)</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-100 rounded-sm"></div> Vigilance (&gt;1.5)</div>
          </div>
        </div>

        <div className="bento-card">
          <h3 className="text-lg font-semibold mb-4">Historique des Activités</h3>
          <div className="divide-y divide-border">
            {filteredActivities.map((activity) => (
              <div key={activity.id}>
                <Dialog>
                  <DialogTrigger render={
                    <button type="button" className="w-full text-left py-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 px-2 rounded-lg transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Activity size={20} className="text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-medium">{activity.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} /> {activity.date.split(" ")[0]}
                            </span>
                            <span>•</span>
                            <span>{activity.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {activity.distance > 0
                            ? `${activity.distance} km`
                            : activity.duration}
                        </div>
                        {activity.tss && (
                          <div className="text-sm text-muted-foreground mt-1">
                            TSS: {activity.tss}
                          </div>
                        )}
                      </div>
                    </button>
                  } />
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">{activity.title}</DialogTitle>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                        <Calendar size={14} /> {activity.date} • {activity.type}
                      </div>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
                      <div className="bg-secondary/50 p-4 rounded-xl text-center">
                        <Clock size={20} className="mx-auto mb-2 text-muted-foreground" />
                        <div className="font-bold text-lg">{activity.duration}</div>
                        <div className="text-xs text-muted-foreground">Durée</div>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-xl text-center">
                        <Activity size={20} className="mx-auto mb-2 text-muted-foreground" />
                        <div className="font-bold text-lg">{activity.distance > 0 ? `${activity.distance} km` : '-'}</div>
                        <div className="text-xs text-muted-foreground">Distance</div>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-xl text-center">
                        <Heart size={20} className="mx-auto mb-2 text-red-500" />
                        <div className="font-bold text-lg">{activity.avgHeartRate || '-'} bpm</div>
                        <div className="text-xs text-muted-foreground">FC Moyenne</div>
                      </div>
                      <div className="bg-secondary/50 p-4 rounded-xl text-center">
                        <Flame size={20} className="mx-auto mb-2 text-orange-500" />
                        <div className="font-bold text-lg">{activity.calories || '-'} kcal</div>
                        <div className="text-xs text-muted-foreground">Calories</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold border-b pb-2">Métriques Avancées</h4>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-muted-foreground">Training Stress Score (TSS)</div>
                        <div className="font-medium text-right">{activity.tss || 'Non calculé'}</div>
                        
                        <div className="text-muted-foreground">FC Maximale</div>
                        <div className="font-medium text-right">{activity.maxHeartRate ? `${activity.maxHeartRate} bpm` : '-'}</div>
                        
                        <div className="text-muted-foreground">Source</div>
                        <div className="font-medium text-right capitalize">{activity.source}</div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
