import { AppState } from "../../store/useStore";
import { ModularEngineResult } from "./types";
import { Driver } from "./engine";

export function runContextEngine(state: AppState): ModularEngineResult {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const latestContext =
    state.contextLogs.find((l) => l.date === todayStr) ||
    state.contextLogs.find((l) => l.date === yesterdayStr);

  const dataUsed: string[] = [];
  const dataMissing: string[] = [];
  const limits: string[] = [];
  const positiveDrivers: Driver[] = [];
  const negativeDrivers: Driver[] = [];

  let score = 100;
  let status = "neutral";
  let secureWording = "Aucun facteur contextuel ou environnemental atypique déclaré.";

  if (latestContext) {
    dataUsed.push("context_log");
    const activeFactors: string[] = [];

    if (latestContext.travel || latestContext.jetlag) {
      activeFactors.push("Déplacement / Décalage");
      score -= 15;
      negativeDrivers.push({
        metricId: "context_travel",
        label: "Déplacement / Décalage horaire",
        impact: "negative",
        value: "Actif",
        note: "Nuance l'évaluation de la qualité du sommeil."
      });
    }

    if (latestContext.alcohol || latestContext.lateMeal) {
      activeFactors.push("Repas tardif ou alcool");
      score -= 20;
      negativeDrivers.push({
        metricId: "context_digestive",
        label: "Repas tardif ou alcool",
        impact: "negative",
        value: "Actif",
        note: "Facteur explicatif courant d'une baisse transitoire de la variabilité cardiaque."
      });
    }

    if (latestContext.heat || latestContext.altitude) {
      activeFactors.push("Contrainte thermique ou altitude");
      score -= 10;
      negativeDrivers.push({
        metricId: "context_environment",
        label: "Environnement atypique",
        impact: "negative",
        value: "Actif",
        note: "Peut accentuer la contrainte cardiovasculaire passive durant le sommeil."
      });
    }

    if (latestContext.competition) {
      activeFactors.push("Compétition");
      positiveDrivers.push({
        metricId: "context_comp",
        label: "Jour d'effort maximal",
        impact: "positive",
        value: "Compétition",
        note: "Niveaux de charge élevés prévus et planifiés."
      });
    }

    if (latestContext.stressEx || latestContext.exams) {
      activeFactors.push("Charge psycho-sociale temporaire");
      score -= 15;
      negativeDrivers.push({
        metricId: "context_mental_stress",
        label: "Charge académique / Stress inhabituel",
        impact: "negative",
        value: "Élevé",
        note: "Peut influencer la perception globale de l'effort."
      });
    }

    if (latestContext.meds) {
      activeFactors.push("Fatigue / Indisposition déclarée");
      score -= 30;
      negativeDrivers.push({
        metricId: "context_health",
        label: "Indisposition passagère",
        impact: "negative",
        value: "Signalé",
        note: "Disponibilité de l'organisme réduite de manière préventive."
      });
    }

    if (activeFactors.length > 0) {
      status = "atypical";
      secureWording = `Interprétation des métriques nuancée par des facteurs contextuels actifs : ${activeFactors.join(", ")}.`;
    }
  } else {
    dataMissing.push("context_log");
    limits.push("Aucun check-in de contexte de vie enregistré sur les dernières 48 heures.");
  }

  score = Math.max(0, Math.min(100, score));
  const confidence = latestContext ? 100 : 30;

  return {
    score,
    status,
    confidence,
    positiveDrivers,
    negativeDrivers,
    dataUsed,
    dataMissing,
    limits,
    secureWording
  };
}
