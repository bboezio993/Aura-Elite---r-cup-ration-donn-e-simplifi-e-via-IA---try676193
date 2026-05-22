import React from "react";
import { useStore } from "../store/useStore";
import { Calendar, AlertCircle, Activity, Droplets, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function MenstrualCycle() {
  const { userProfile: profile, menstrualLogs } = useStore();

  if (!profile.preferences.enableMenstrualTracking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <Droplets size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Suivi du Cycle Menstruel</h2>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Ce module est désactivé. Vous pouvez l'activer dans vos paramètres
          pour bénéficier d'analyses et d'adaptations d'entraînement basées sur
          votre cycle hormonal.
        </p>
      </div>
    );
  }

  const latestLog =
    menstrualLogs.length > 0 ? menstrualLogs[menstrualLogs.length - 1] : null;

  return (
    <div className="flex-1 overflow-auto p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Cycle Menstruel & Performance
          </h2>
          <p className="text-muted-foreground">
            Adaptation de la charge et analyse des biomarqueurs selon les phases
            hormonales.
          </p>
        </div>
        <Button className="bg-[#FF2D55] text-white hover:bg-[#FF2D55]/90">
          + Saisir les symptômes du jour
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Phase Overview */}
        <div className="bento-card md:col-span-2 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">Phase Actuelle</h3>
            <Badge className="bg-[#FF2D55]/10 text-[#FF2D55] hover:bg-[#FF2D55]/20 border-none">
              {latestLog ? "Phase en cours" : "Données insuffisantes"}
            </Badge>
          </div>

          <div className="relative h-4 bg-[#F2F2F7] rounded-full overflow-hidden mb-6">
            <div className="absolute top-0 left-0 h-full bg-[#FF2D55] w-[0%] rounded-full opacity-80" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-[#86868B] mb-1">Règles prévues dans</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div>
              <p className="text-[#86868B] mb-1">Durée moyenne</p>
              <p className="text-2xl font-bold">-</p>
            </div>
            <div>
              <p className="text-[#86868B] mb-1">Variation</p>
              <p className="text-2xl font-bold text-[#34C759]">-</p>
            </div>
          </div>
        </div>

        {/* Medical Alerts / Red Flags */}
        <div className="bento-card bg-[#FFF0F0] border border-[#FF3B30]/20">
          <h3 className="font-semibold text-[#FF3B30] flex items-center gap-2 mb-4">
            <AlertCircle size={18} />
            Signaux d'alerte
          </h3>
          <p className="text-sm text-[#1D1D1F] mb-4">
            {latestLog && latestLog.painLevel > 7
              ? "Douleurs sévères signalées récemment."
              : "Aucun signal d'alerte détecté sur vos derniers cycles."}
          </p>
          <div className="text-xs text-[#86868B] space-y-2">
            <p>Aura Elite surveille :</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Aménorrhée (&gt; 3 mois)</li>
              <li>Douleurs sévères (Dysménorrhée)</li>
              <li>Saignements très abondants</li>
            </ul>
          </div>
        </div>

        {/* Sports Adaptation */}
        <div className="bento-card md:col-span-3 bg-white">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
            <Activity size={18} className="text-[#0071E3]" />
            Adaptation de l'Entraînement
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-[#F2F2F7] rounded-xl">
              <h4 className="font-medium mb-2">Physiologie</h4>
              <p className="text-sm text-[#86868B]">
                En attente de plus de données pour analyser les variations de
                votre RHR et HRV selon vos phases.
              </p>
            </div>
            <div className="p-4 bg-[#F2F2F7] rounded-xl">
              <h4 className="font-medium mb-2">Entraînement</h4>
              <p className="text-sm text-[#86868B]">
                Aura Elite ajustera vos recommandations d'intensité en fonction
                de votre phase hormonale.
              </p>
            </div>
            <div className="p-4 bg-[#F2F2F7] rounded-xl">
              <h4 className="font-medium mb-2">Nutrition</h4>
              <p className="text-sm text-[#86868B]">
                Enregistrez vos cycles pour obtenir des recommandations
                nutritionnelles adaptées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
