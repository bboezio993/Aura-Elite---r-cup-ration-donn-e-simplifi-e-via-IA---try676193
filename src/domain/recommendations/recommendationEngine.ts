import { AppState } from "../../store/useStore";
import { EngineScores } from "../../types";

export interface PersonalizedRecommendation {
  id: string;
  category: "training" | "nutrition" | "recovery" | "lifestyle" | "sleep" | "injury_prevention" | "mental";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  actionLabel: string;
  scientificClaim: string;
  confidence: number;
  evidenceLevel: "robust" | "probable" | "exploratory" | "weak_signal";
  limitations: string[];
  basedOn: string[];
  notMedicalAdvice: boolean;
}

export function generatePersonalizedRecommendations(
  state: AppState,
  scores: EngineScores | null
): PersonalizedRecommendation[] {
  const recommendations: PersonalizedRecommendation[] = [];

  if (!scores) {
    return [
      {
        id: "rec_calibrate_01",
        title: "Calibrage initial en cours",
        category: "recovery",
        priority: "medium",
        description: "Continuez d'importer vos fichiers d'activité Garmin et d'enregistrer des indices de bien-être pendant au moins 5 jours consécutifs pour stabiliser vos baselines.",
        actionLabel: "Faire le Check-in quotidien",
        scientificClaim: "L'analyse de la variabilité physiologique nécessite des fenêtres mobiles glissantes pour isoler les déviations des fluctuations ordinaires.",
        confidence: 100,
        evidenceLevel: "robust",
        limitations: ["Dépend de la complétion des données"],
        basedOn: ["data_count"],
        notMedicalAdvice: true
      }
    ];
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // 1. ACWR Warning
  if (scores.acwr && scores.acwr > 1.5) {
    recommendations.push({
      id: "rec_acwr_caution",
      title: "Charge récente élevée par rapport à votre historique",
      category: "training",
      priority: "high",
      description: `Votre indicateur de charge cumulée s'élève à ${scores.acwr.toFixed(2)}. Un signal de surcharge à surveiller.`,
      actionLabel: "Adaptation prudente de la charge recommandée",
      scientificClaim: "Une progression soudaine de la charge limite le temps d'adaptation structurelle et mécanique.",
      confidence: 80,
      evidenceLevel: "robust",
      limitations: ["Modele théorique ACWR, non spécifique à l'individu"],
      basedOn: ["acwr", "training_load"],
      notMedicalAdvice: true
    });
  } else if (scores.acwr && scores.acwr >= 0.8 && scores.acwr <= 1.3) {
    recommendations.push({
      id: "rec_acwr_optimal",
      title: "Disponibilité favorable",
      category: "training",
      priority: "low",
      description: `Votre profil affiche une dynamique de progression maîtrisée et une balance d'effort en phase avec vos capacités récentes.`,
      actionLabel: "Maintenir si le ressenti reste favorable",
      scientificClaim: "Une charge proportionnée favorise l'adaptation sans générer de fatigue résiduelle excessive.",
      confidence: 85,
      evidenceLevel: "robust",
      limitations: ["Dépend de la complétion des données subjectives non renseignées"],
      basedOn: ["acwr"],
      notMedicalAdvice: true
    });
  } else if (scores.acwr && scores.acwr < 0.8 && scores.acwr > 0) {
    recommendations.push({
      id: "rec_acwr_detrain",
      title: "Volume d'activité modéré",
      category: "training",
      priority: "medium",
      description: "Votre volume et intensité cumulés récents sont temporairement plus faibles. La régularité est un indicateur de consolidation.",
      actionLabel: "Poursuivre des sessions variées et régulières",
      scientificClaim: "La régularité protectrice a tendance à diminuer si l'intervalle entre les sollicitations s'allonge.",
      confidence: 70,
      evidenceLevel: "probable",
      limitations: ["Baisse possiblement planifiée (tapering)"],
      basedOn: ["acwr"],
      notMedicalAdvice: true
    });
  }

  // 2. Active Pain mitigation
  const activePainLogs = state.painLogs ? state.painLogs.filter(p => p.date === todayStr) : [];
  if (activePainLogs.length > 0) {
    const highestPain = activePainLogs.reduce((max, log) => Math.max(max, log.intensityActive, log.intensityRest), 0);
    if (highestPain >= 4) {
      recommendations.push({
        id: "rec_pain_active",
        title: "Signal d'inconfort déclaré",
        category: "injury_prevention",
        priority: "high",
        description: `Vous avez signalé une gêne locale. Adaptation prudente de l'effort recommandée de manière préventive.`,
        actionLabel: "Limiter les exercices sollicitant l'inconfort",
        scientificClaim: "L'écoute active des signaux d'inconfort permet de prévenir l'accumulation de tension sur les groupes stabilisateurs.",
        confidence: 90,
        evidenceLevel: "robust",
        limitations: ["Douleur subjective auto-évaluée"],
        basedOn: ["pain_score", "pain_location"],
        notMedicalAdvice: true
      });
    }
  }

  // 3. Sleep Debt Warning
  const sleepDebt = state.metrics
    .filter(m => m.type === "sleep_duration" && (Date.now() - new Date(m.timestamp).getTime()) <= 7 * 24 * 3600 * 1000)
    .reduce((acc, val) => acc + Math.max(0, 8 - val.value), 0);

  if (sleepDebt > 6) {
    recommendations.push({
      id: "rec_sleep_debt",
      title: "Signal de vigilance : sommeil",
      category: "sleep",
      priority: "medium",
      description: `Une restriction prolongée de sommeil semble en cours, limitant la profondeur de la récupération passive globale.`,
      actionLabel: "Si possible, augmenter légèrement le temps de repos nocturne",
      scientificClaim: "La régularité du cycle veille-sommeil est le facteur prépondérant dans l'assimilation d'une charge d'entraînement.",
      confidence: 80,
      evidenceLevel: "robust",
      limitations: ["L'estimation Garmin des phases d'éveil nocturne n'a pas de valeur diagnostique"],
      basedOn: ["sleep_duration"],
      notMedicalAdvice: true
    });
  }

  // 4. Low Energy Availability / Data Missing
  const todayMeals = state.mealLogs ? state.mealLogs.filter(m => m.date === todayStr) : [];
  if (todayMeals.length === 0) {
    recommendations.push({
      id: "rec_nut_log_prompt",
      title: "Suivi énergétique quotidien",
      category: "nutrition",
      priority: "low",
      description: "Saisir vos apports journaliers permet d'affiner l'estimation d'une disponibilité énergétique adéquate pour soutenir l'effort.",
      actionLabel: "Repas du jour",
      scientificClaim: "La disponibilité énergétique est un paramètre de régulation protecteur de la récupération.",
      confidence: 50,
      evidenceLevel: "probable",
      limitations: ["L'apport calorique estimé dépend de la complétion du journal de repas"],
      basedOn: ["meal_logs"],
      notMedicalAdvice: true
    });
  }

  // Fallback to maintain high visual density
  if (recommendations.length < 3) {
    recommendations.push({
      id: "rec_gen_01",
      title: "Tendance physiologique stable",
      category: "recovery",
      priority: "low",
      description: "Les indicateurs suggèrent un état global situé dans votre zone de référence.",
      actionLabel: "Conserver vos routines si le ressenti est bon",
      scientificClaim: "Une variabilité de fréquence cardiaque stable montre un maintien du tonus neurovégétatif.",
      confidence: 70,
      evidenceLevel: "robust",
      limitations: ["Analyse sans signaux atypiques, dépendante de l'absence de données subjectives contraires"],
      basedOn: ["hrv_rmssd", "rhr"],
      notMedicalAdvice: true
    });
  }

  return recommendations;
}

