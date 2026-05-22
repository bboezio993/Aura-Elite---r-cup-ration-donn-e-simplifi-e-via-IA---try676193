export interface EvidenceItem {
  id: string;
  topic: string;
  claim: string;
  evidenceLevel: "guideline" | "systematic_review" | "controlled_trial" | "observational" | "expert_consensus" | "exploratory";
  applicability: string;
  limitations: string[];
  userFacingExplanation: string;
}

export const evidenceRegistry: Record<string, EvidenceItem> = {
  hrv_low: {
    id: "hrv_low",
    topic: "HRV (RMSSD)",
    claim: "Une baisse significative de la HRV RMSSD par rapport à la baseline individuelle de l'athlète peut suggérer une fatigue temporaire ou une fluctuation de l'équilibre du système nerveux autonome.",
    evidenceLevel: "systematic_review",
    applicability: "Athlètes de tous niveaux pratiquant des sports d'endurance ou de force.",
    limitations: [
      "Souffre de forte variabilité selon l'heure de mesure (préférer les valeurs de sommeil complet).",
      "Très sensible à la consommation d'alcool, de repas tardifs et au stress psychologique aigu."
    ],
    userFacingExplanation: "Une HRV basse peut être compatible avec une phase d'adaptation ou de récupération active face à une fatigue physique ou mentale. Votre niveau de récupération global est à surveiller."
  },
  rhr_elevated: {
    id: "rhr_elevated",
    topic: "Rythme Cardiaque de Repos (RHR)",
    claim: "Une augmentation de la fréquence cardiaque au repos de plus de 3-5 bpm par rapport à la moyenne à long terme est un signal compatible avec une fatigue temporaire ou de simples fluctuations physiologiques ordinaires, à surveiller avec le contexte.",
    evidenceLevel: "controlled_trial",
    applicability: "Idéalement mesuré en continu durant la phase stable du sommeil.",
    limitations: [
      "Peut être masqué par l'usage de bêta-bloquants.",
      "Fortement corrélé à la déshydratation temporaire ou d'un entraînement en soirée."
    ],
    userFacingExplanation: "Un rythme cardiaque au repos plus élevé de quelques battements peut être compatible avec des fluctuations normales de fatigue. À surveiller avec le sommeil et les entraînements."
  },
  sleep_debt: {
    id: "sleep_debt",
    topic: "Sommeil",
    claim: "Une restriction de sommeil (< 6h par nuit ou dette accumulée de > 4h sur une semaine) peut être compatible avec un épuisement plus rapide des réserves d'énergie estimées et à surveiller avec le ressenti global.",
    evidenceLevel: "controlled_trial",
    applicability: "Ajustable selon le profil génétique du dormeur (court vs long dormeur).",
    limitations: [
      "Le besoin absolu de sommeil est très individuel.",
      "La qualité globale perçue (efficacité) est parfois plus prédictive que la durée exacte chez certains athlètes."
    ],
    userFacingExplanation: "Vos nuits récentes peuvent être compatibles avec une récupération moindre et des ressentis de fatigue accrus. Ce signal est à surveiller selon votre ressenti de forme habituel."
  },
  acwr_caution: {
    id: "acwr_caution",
    topic: "Charge d'Entraînement (ACWR)",
    claim: "Un Acute:Chronic Workload Ratio (ratio charge aiguë / chronique) supérieur à 1.5 peut être associé à une fatigue prolongée, données insuffisantes pour conclure seul.",
    evidenceLevel: "systematic_review",
    applicability: "S'applique principalement aux sports d'endurance, de course à pied et de football.",
    limitations: [
      "Le ratio exact est sensible aux données manquantes.",
      "Ne prend pas en compte les variations de l'état psychologique qui agissent comme multiplicateurs."
    ],
    userFacingExplanation: "Votre volume/intensité d'entraînement a augmenté plus vite que votre moyenne habituelle. Une approche progressive de l'entraînement peut être compatible avec une meilleure assimilation de ce pic de stimulus."
  },
  rpe_mismatch: {
    id: "rpe_mismatch",
    topic: "Ressenti vs Capteur (RPE)",
    claim: "Un RPE subjectif anormalement élevé pour une charge externe faible (foulées lentes, puissance basse) est compatible avec une fatigue perçue ou une surcharge mentale sous-jacente.",
    evidenceLevel: "expert_consensus",
    applicability: "Analysé lors de la saisie post-séance par rapport aux zones de FC Garmin.",
    limitations: [
      "Demande une sincérité totale et un calibrage de l'échelle par l'utilisateur.",
      "N'est pas directement quantifiable par brute calcul."
    ],
    userFacingExplanation: "Vous avez trouvé la séance d'aujourd'hui plus exigeante que la métrique externe brute calculée. Ce décalage peut être compatible avec une fatigue passagère ou une récupération moindre, invitant à l'écoute personnelle."
  },
  low_energy_availability: {
    id: "low_energy_availability",
    topic: "Disponibilité Énergétique (EA)",
    claim: "Une faible disponibilité énergétique estimée (apport alimentaire - exercice < 30 kcal/kg masse maigre/jour) est parfois associée à des variations transitoires de récupération.",
    evidenceLevel: "guideline",
    applicability: "Surtout critique chez les athlètes de disciplines d'endurance.",
    limitations: [
      "Difficile à estimer sans mesure de l'intake calorique exact et de la composition corporelle précise, données insuffisantes pour conclure seul."
    ],
    userFacingExplanation: "Votre alimentation actuelle ne couvre peut-être pas les besoins combinés de votre quotidien et de vos séances de haute intensité, à interpréter avec le reste du contexte."
  }
};
