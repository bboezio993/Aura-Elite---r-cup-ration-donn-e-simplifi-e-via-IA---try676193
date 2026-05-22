import React, { useMemo } from "react";
import { Brain, Smile, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Mental() {
  const { hooperLogs, weeklyScreeningLogs, engineScores } = useStore();

  const hasData = hooperLogs.length > 0 || weeklyScreeningLogs.length > 0;

  const chartData = useMemo(() => {
    return hooperLogs.map((log) => ({
      date: log.date.split("-").slice(1).join("/"),
      stress: log.stress,
      mood: log.mood,
    }));
  }, [hooperLogs]);

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Brain size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Charge Cognitive & Stress</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Le stress psychologique a le même impact physiologique que le stress
          physique. Suivez votre charge allostatique.
        </p>

        <div className="bento-card max-w-2xl w-full text-left mb-8 bg-white">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Smile size={18} className="text-[#AF52DE]" />
            Le pouvoir des données subjectives
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            La littérature scientifique montre que le ressenti subjectif
            (humeur, stress perçu) est souvent un indicateur plus précoce de
            la fatigue accumulée que les biomarqueurs objectifs.
          </p>
          <div className="flex items-start gap-3 p-4 bg-[#F2F2F7] rounded-xl">
            <AlertCircle size={16} className="text-[#AF52DE] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D1D1F]">
              <strong>Action :</strong> Utilisez le bouton "Check-in Quotidien"
              sur le Dashboard tous les matins pour construire votre baseline
              psychologique.
            </p>
          </div>
        </div>

        <Button
          nativeButton={false}
          render={<Link to="/" />}
          className="bg-[#AF52DE] text-white hover:bg-[#AF52DE]/90"
        >
          Retour au Dashboard
        </Button>
      </div>
    );
  }

  const latestScreening = weeklyScreeningLogs[weeklyScreeningLogs.length - 1];
  const psychScore = engineScores?.psychologicalLoad;

  return (
    <ScrollArea className="flex-1">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Charge Cognitive & Psychologique
          </h2>
          <p className="text-muted-foreground">
            Analyse de votre charge allostatique et de votre bien-être mental.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div
            className="bento-card bento-gradient"
            style={{
              background: "linear-gradient(135deg, #AF52DE 0%, #5E5CE6 100%)",
            }}
          >
            <div className="bento-title text-white/80">
              Score Psychologique Global
            </div>
            <div className="text-[42px] font-bold leading-tight text-white">
              {psychScore ? psychScore.score.toFixed(0) : "-"}
              <span className="text-xl ml-1 opacity-60 font-normal">/100</span>
            </div>
            <div className="text-sm text-white/80 mt-1 capitalize">
              {psychScore?.status || "-"}
            </div>
          </div>

          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Dernier PSS (Stress Perçu)</div>
            <div className="text-[42px] font-bold leading-tight text-[#AF52DE]">
              {latestScreening?.pssScore ?? "-"}
              <span className="text-xl ml-1 text-[#86868B] font-normal">
                /40
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {latestScreening
                ? new Date(latestScreening.date).toLocaleDateString()
                : "-"}
            </div>
          </div>

          <div className="bento-card text-center justify-center items-center">
            <div className="bento-title">Humeur Moyenne (7j)</div>
            <div className="text-[42px] font-bold leading-tight">
              {hooperLogs.length > 0
                ? (
                    hooperLogs
                      .slice(-7)
                      .reduce((acc, log) => acc + log.mood, 0) /
                    Math.min(hooperLogs.length, 7)
                  ).toFixed(1)
                : "-"}
              <span className="text-xl ml-1 text-[#86868B] font-normal">
                /5
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Basé sur Hooper
            </div>
          </div>
        </div>

        {hooperLogs.length > 0 && (
          <div className="bento-card mb-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#AF52DE]" />
              Évolution du Stress et de l'Humeur (Quotidien)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E5EA"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#86868B", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#86868B", fontSize: 12 }}
                    domain={[1, 7]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#86868B", fontSize: 12 }}
                    domain={[1, 5]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="stress"
                    name="Stress (1-7)"
                    stroke="#FF3B30"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="mood"
                    name="Humeur (1-5)"
                    stroke="#34C759"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {weeklyScreeningLogs.length > 0 && (
          <div className="bento-card">
            <h3 className="text-lg font-semibold mb-4">
              Historique des Screenings Hebdomadaires
            </h3>
            <div className="space-y-4">
              {weeklyScreeningLogs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground mb-1">PSS</div>
                        <div className="font-semibold text-[#AF52DE]">
                          {log.pssScore}/40
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground mb-1">PHQ-9</div>
                        <div className="font-semibold">{log.phq9Score}/27</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground mb-1">GAD-7</div>
                        <div className="font-semibold">{log.gad7Score}/21</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
