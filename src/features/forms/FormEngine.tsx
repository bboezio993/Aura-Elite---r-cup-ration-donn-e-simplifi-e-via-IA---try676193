import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Smile, 
  Frown, 
  Brain, 
  Activity, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Heart,
  Sparkles
} from 'lucide-react';

interface FormProps {
  onSuccess?: () => void;
}

export function FormEngine() {
  const [activeForm, setActiveForm] = useState<'daily' | 'rpe' | 'pain' | 'context'>('daily');

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-6 bg-secondary/30 p-1.5 rounded-xl border border-border max-w-2xl">
        <button
          onClick={() => setActiveForm('daily')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeForm === 'daily' 
              ? 'bg-background text-foreground shadow-sm border border-border' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar size={15} />
          Check-in du jour
        </button>
        <button
          onClick={() => setActiveForm('rpe')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeForm === 'rpe' 
              ? 'bg-background text-foreground shadow-sm border border-border' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity size={15} />
          Post-séance RPE
        </button>
        <button
          onClick={() => setActiveForm('pain')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeForm === 'pain' 
              ? 'bg-background text-foreground shadow-sm border border-border' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle size={15} />
          Signaux & Douleurs
        </button>
        <button
          onClick={() => setActiveForm('context')}
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeForm === 'context' 
              ? 'bg-background text-foreground shadow-sm border border-border' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain size={15} />
          Contexte de vie
        </button>
      </div>

      <div className="border border-border/80 bg-background rounded-2xl p-6 shadow-sm">
        {activeForm === 'daily' && <DailyCheckInForm />}
        {activeForm === 'rpe' && <PostSessionRPEForm />}
        {activeForm === 'pain' && <PainInjuryForm />}
        {activeForm === 'context' && <ContextForm />}
      </div>
    </div>
  );
}

function DailyCheckInForm({ onSuccess }: FormProps) {
  const addHooperLog = useStore(state => state.addHooperLog);
  const addMetric = useStore(state => state.addMetric);
  const [success, setSuccess] = useState(false);

  // Default values
  const [fatigue, setFatigue] = useState(4);
  const [stress, setStress] = useState(4);
  const [sleep, setSleep] = useState(4);
  const [soreness, setSoreness] = useState(4);
  const [mood, setMood] = useState(4);
  const [motivation, setMotivation] = useState(4);
  const [painLevel, setPainLevel] = useState(0);
  const [digestion, setDigestion] = useState(3);
  const [appetite, setAppetite] = useState(3);
  const [recovery, setRecovery] = useState(5);
  const [isIll, setIsIll] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split('T')[0];
    const logId = `hooper_${Date.now()}`;

    // Add main HooperLog
    addHooperLog({
      id: logId,
      date: dateStr,
      fatigue,
      stress,
      sleepQuality: sleep,
      soreness,
      mood,
      motivation,
      painLevel,
      digestion,
      appetite,
      recovery,
      isIll,
      notes
    });

    // Populate separate metric indices
    const timestamp = new Date().toISOString();
    const metricsToTrigger = [
      { type: "subjective_fatigue" as const, value: fatigue, unit: "1-7" },
      { type: "subjective_stress" as const, value: stress, unit: "1-7" },
      { type: "subjective_sleep_quality" as const, value: sleep, unit: "1-7" },
      { type: "subjective_soreness" as const, value: soreness, unit: "1-7" },
      { type: "subjective_mood" as const, value: mood, unit: "1-7" },
      { type: "motivation" as const, value: motivation, unit: "1-7" },
      { type: "pain_score" as const, value: painLevel, unit: "0-10" },
      { type: "digestive_comfort" as const, value: digestion, unit: "1-5" },
      { type: "appetite" as const, value: appetite, unit: "1-5" },
      { type: "energy_level" as const, value: recovery, unit: "1-10" }
    ];

    metricsToTrigger.forEach((m, idx) => {
      addMetric({
        id: `m_manual_${dateStr}_${m.type}_${idx}`,
        source: "manual",
        timestamp,
        type: m.type,
        value: m.value,
        unit: m.unit,
        confidenceScore: 85
      });
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      if (onSuccess) onSuccess();
    }, 2000);
  };

  const getSliderLabel = (val: number, isGoodHigh = false) => {
    if (val <= 2) return isGoodHigh ? "Très bas ⚠️" : "Très en forme ✨";
    if (val === 4) return "Modéré";
    if (val >= 6) return isGoodHigh ? "Excellent ! 🎉" : "Épuisé / Très élevé ⚠️";
    return "Moyen";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-border">
        <div>
          <h3 className="text-lg font-bold">Check-in du jour — Hooper Index Étendu</h3>
          <p className="text-xs text-muted-foreground">Enregistrez vos indicateurs subjectifs complémentaires du matin.</p>
        </div>
        <Sparkles className="text-primary w-5 h-5 animate-pulse" />
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <CheckCircle size={28} />
          </div>
          <p className="font-semibold text-emerald-500">Check-in enregistré avec succès !</p>
          <p className="text-xs text-muted-foreground">Le moteur analytique Aura Elite a mis à jour votre score de Readiness.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sliders group */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Fatigue du matin :</span>
                  <span className="font-mono text-xs text-primary">{fatigue}/7 ({getSliderLabel(fatigue)})</span>
                </label>
                <input
                  type="range" min="1" max="7" value={fatigue}
                  onChange={(e) => setFatigue(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Stress général :</span>
                  <span className="font-mono text-xs text-primary">{stress}/7 ({getSliderLabel(stress)})</span>
                </label>
                <input
                  type="range" min="1" max="7" value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Sommeil ressenti :</span>
                  <span className="font-mono text-xs text-primary">{sleep}/7 ({getSliderLabel(sleep, true)})</span>
                </label>
                <input
                  type="range" min="1" max="7" value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Courbatures :</span>
                  <span className="font-mono text-xs text-primary">{soreness}/7 ({getSliderLabel(soreness)})</span>
                </label>
                <input
                  type="range" min="1" max="7" value={soreness}
                  onChange={(e) => setSoreness(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                />
              </div>
            </div>

            {/* Right Group */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Humeur & Moral :</span>
                  <span className="font-mono text-xs text-primary">{mood}/7 ({getSliderLabel(mood, true)})</span>
                </label>
                <input
                  type="range" min="1" max="7" value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1">Digestion (1-5)</label>
                  <select
                    value={digestion} onChange={(e) => setDigestion(Number(e.target.value))}
                    className="w-full text-sm rounded-lg border border-border bg-background p-2 focus:ring-1 focus:ring-primary"
                  >
                    <option value="1">Trig digestion pénible ⚠️</option>
                    <option value="3">Normale</option>
                    <option value="5">Parfaite 🥦</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Appétit (1-5)</label>
                  <select
                    value={appetite} onChange={(e) => setAppetite(Number(e.target.value))}
                    className="w-full text-sm rounded-lg border border-border bg-background p-2 focus:ring-1 focus:ring-primary"
                  >
                    <option value="1">Inexistant</option>
                    <option value="3">Normal</option>
                    <option value="5">Excellent appetit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Sensation globale récupération :</span>
                  <span className="font-mono text-xs text-primary">{recovery}/10</span>
                </label>
                <input
                  type="range" min="1" max="10" value={recovery}
                  onChange={(e) => setRecovery(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                />
              </div>

              <div>
                <label className="text-sm font-semibold flex justify-between">
                  <span>Douleur physique spécifique (0-10) :</span>
                  <span className="font-mono text-xs text-red-500 font-bold">{painLevel}/10</span>
                </label>
                <input
                  type="range" min="0" max="10" value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer mt-2 accent-red-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-secondary/10 border p-3 rounded-xl border-border">
            <input
              type="checkbox" id="isIllCheck" checked={isIll}
              onChange={(e) => setIsIll(e.target.checked)}
              className="rounded border-borderaccent-primary cursor-pointer w-4 h-4"
            />
            <label htmlFor="isIllCheck" className="text-xs font-medium cursor-pointer text-muted-foreground">
              Je me sens actuellement malade ou j'ai des symptômes actifs de grippe, rhume, fièvre.
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">Notes libres Contextuelles :</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Ex: Nuit interrompue par la chaleur, repas de fête bu un verre de vin..."
              className="w-full text-sm rounded-lg border border-border bg-background p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <Button type="submit" className="w-full bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
            Enregistrer le Check-In
          </Button>
        </>
      )}
    </form>
  );
}

function PostSessionRPEForm({ onSuccess }: FormProps) {
  const activities = useStore(state => state.garminActivities);
  const addSessionRPE = useStore(state => state.addSessionRPE);
  const [success, setSuccess] = useState(false);

  const [actId, setActId] = useState('');
  const [rpe, setRpe] = useState(5);
  const [muscLoad, setMuscLoad] = useState(5);
  const [cardioLoad, setCardioLoad] = useState(5);
  const [painDuring, setPainDuring] = useState(false);
  const [painLocation, setPainLocation] = useState('');
  const [postPain, setPostPain] = useState(0);
  const [technique, setTechnique] = useState(4);
  const [comform, setComform] = useState(true);
  const [comment, setComment] = useState('');

  const linkedAct = activities.find(a => a.id === actId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actId) return alert("Veuillez lier une activité Garmin.");

    const act = activities.find(a => a.id === actId);
    const durationMin = act?.duration 
      ? parseInt(act.duration.split(':')[0]) * 60 + parseInt(act.duration.split(':')[1])
      : 45;

    addSessionRPE({
      id: `rpe_${Date.now()}`,
      activityId: actId,
      date: act?.date ? act.date.split('T')[0] : new Date().toISOString().split('T')[0],
      rpe,
      durationMinutes: durationMin,
      feeling: technique,
      pain: painDuring ? painLocation : undefined,
      muscularLoad: muscLoad,
      cardioLoad: cardioLoad,
      painDuring,
      postPainIntensity: postPain,
      techniqueSensation: technique,
      conformanceToPlan: comform,
      comment
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      if (onSuccess) onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b pb-3 border-border">
        <h3 className="text-lg font-bold">Ressenti Post-Séance (Session RPE)</h3>
        <p className="text-xs text-muted-foreground">Qualifiez l'intensité perçue de votre dernière activité issue de votre montre.</p>
      </div>

      {success ? (
        <div className="flex flex-col items-center justify-center py-6 text-emerald-500 font-semibold space-y-2">
          <CheckCircle size={24} />
          <span>Ressenti de séance lié avec succès !</span>
        </div>
      ) : (
        <>
          <div>
            <label className="text-xs font-semibold block mb-1.5">Lier une séance Garmin récente :</label>
            <select
              value={actId} onChange={(e) => setActId(e.target.value)} required
              className="w-full text-sm rounded-lg border border-border bg-background p-2.5"
            >
              <option value="">-- Sélectionner l'activité correspondante --</option>
              {activities.slice(0, 8).map(a => (
                <option key={a.id} value={a.id}>
                  [{a.date.split('T')[0]}] {a.title} ({a.type}) - {a.distance} km - {a.duration}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">RPE Borg (0-10) effort :</label>
              <input
                type="number" min="0" max="10" value={rpe}
                onChange={(e) => setRpe(Math.min(10, Math.max(0, Number(e.target.value))))}
                className="w-full text-sm rounded-lg border border-border bg-background p-2"
              />
              <span className="text-[10px] text-muted-foreground block mt-1">(0 = rien, 10 = max absolu)</span>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Charge Musculaire (0-10) :</label>
              <input
                type="number" min="0" max="10" value={muscLoad}
                onChange={(e) => setMuscLoad(Math.min(10, Math.max(0, Number(e.target.value))))}
                className="w-full text-sm rounded-lg border border-border bg-background p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Charge Cardio (0-10) :</label>
              <input
                type="number" min="0" max="10" value={cardioLoad}
                onChange={(e) => setCardioLoad(Math.min(10, Math.max(0, Number(e.target.value))))}
                className="w-full text-sm rounded-lg border border-border bg-background p-2"
              />
            </div>
          </div>

          <div className="p-3 border rounded-xl border-border bg-secondary/10 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox" id="painDuring" checked={painDuring}
                onChange={(e) => setPainDuring(e.target.checked)}
                className="rounded border-border accent-primary cursor-pointer w-4 h-4"
              />
              <label htmlFor="painDuring" className="text-xs font-semibold text-muted-foreground">
                J'ai ressenti des douleurs aiguës inhabituelles au cours de la séance.
              </label>
            </div>

            {painDuring && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <label className="text-xs block mb-1">Localisation anatomique :</label>
                  <input
                    type="text" value={painLocation} onChange={(e) => setPainLocation(e.target.value)}
                    placeholder="Ex: Tendon d'Achille D"
                    className="w-full text-xs rounded border border-border bg-background p-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs block mb-1">Intensité douleur post-séance (0-10) :</label>
                  <input
                    type="number" min="0" max="10" value={postPain} onChange={(e) => setPostPain(Number(e.target.value))}
                    className="w-full text-xs rounded border border-border bg-background p-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Sensation technique / efficacité (1-5) :</label>
              <select
                value={technique} onChange={(e) => setTechnique(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-border bg-background p-2"
              >
                <option value="1">1 - Très laborieux</option>
                <option value="3">3 - Standard</option>
                <option value="5">5 - Fluide & Puissant</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Conforme au plan d'entraînement ?</label>
              <select
                value={comform ? "yes" : "no"} onChange={(e) => setComform(e.target.value === "yes")}
                className="w-full text-xs rounded-lg border border-border bg-background p-2"
              >
                <option value="yes">Oui, parfaitement</option>
                <option value="no">Non, écourté ou modifié</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Commentaire libre :</label>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)} rows={1}
              placeholder="Conditions météo, sensations..."
              className="w-full text-xs rounded border border-border bg-background p-2"
            />
          </div>

          <Button type="submit" disabled={!actId} className="w-full bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
            Lier le RPE à la séance Garmin
          </Button>
        </>
      )}
    </form>
  );
}

function PainInjuryForm({ onSuccess }: FormProps) {
  const addPainLog = useStore(state => state.addPainLog);
  const [success, setSuccess] = useState(false);

  const [location, setLocation] = useState('');
  const [side, setSide] = useState<'left' | 'right' | 'bilateral' | 'none'>('left');
  const [type, setType] = useState<'muscular' | 'tendinous' | 'articular' | 'osseux' | 'nervous' | 'unknown'>('muscular');
  const [intRest, setIntRest] = useState(0);
  const [intEffort, setIntEffort] = useState(0);
  const [onset, setOnset] = useState<'onset_sudden' | 'onset_gradual'>('onset_gradual');
  const [impact, setImpact] = useState('none');
  const [notes, setNotes] = useState('');
  const [aggravatedBy, setAggravatedBy] = useState('');
  const [relievedBy, setRelievedBy] = useState('');
  const [evolutionTime, setEvolutionTime] = useState('stable');
  const [historyEpisodes, setHistoryEpisodes] = useState('first_occurrence');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return alert("Spécifiez la localisation.");

    addPainLog({
      id: `pain_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      location,
      side,
      type,
      intensityRest: intRest,
      intensityActive: intEffort,
      onset,
      impact,
      notes,
      aggravatedBy: aggravatedBy || undefined,
      relievedBy: relievedBy || undefined,
      evolutionTime: evolutionTime || undefined,
      historyEpisodes: historyEpisodes || undefined
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      if (onSuccess) onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b pb-3 border-border">
        <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
          <AlertTriangle size={20} />
          Registre des Douleurs & Signaux Corporels
        </h3>
        <p className="text-xs text-muted-foreground">Une surveillance proactive permet de prévenir l'installation d'une pathologie mécanique.</p>
      </div>

      {success ? (
        <div className="text-center text-emerald-500 font-semibold py-6">
          <CheckCircle size={24} className="mx-auto mb-2" />
          <span>Douleur enregistrée. Aura Elite a recalibré vos seuils de protection.</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Localisation anatomique :</label>
              <input
                type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Genou externe, Tendon rotulien"
                className="w-full text-xs rounded border border-border bg-background p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Côté :</label>
              <select
                value={side} onChange={(e) => setSide(e.target.value as any)}
                className="w-full text-xs rounded border border-border bg-background p-2"
              >
                <option value="left">Gauche</option>
                <option value="right">Droite</option>
                <option value="bilateral">Bilatéral</option>
                <option value="none">S/O (Tronc ou central)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Type de structure suspectée :</label>
              <select
                value={type} onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs rounded border border-border bg-background p-2"
              >
                <option value="muscular">Musculaire (contracture, déchirure...)</option>
                <option value="tendinous">Tendineux (tendinopathie...)</option>
                <option value="articular">Articulaire (ligament, ménisque...)</option>
                <option value="osseux">Périosté / Osseux (fatigue...)</option>
                <option value="nervous">Paresthésie / Nerveux</option>
                <option value="unknown">Inconnu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Mode d'apparition :</label>
              <select
                value={onset} onChange={(e) => setOnset(e.target.value as any)}
                className="w-full text-xs rounded border border-border bg-background p-2"
              >
                <option value="onset_gradual">Progressif (surcharge chronique)</option>
                <option value="onset_sudden">Brutal (faux mouvement, torsion)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Facteurs aggravants :</label>
              <input
                type="text" value={aggravatedBy} onChange={(e) => setAggravatedBy(e.target.value)}
                placeholder="Ex: montée d'escaliers, course rapide"
                className="w-full text-xs rounded border border-border bg-background p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Facteurs soulageants :</label>
              <input
                type="text" value={relievedBy} onChange={(e) => setRelievedBy(e.target.value)}
                placeholder="Ex: étirements, repos, glaçage"
                className="w-full text-xs rounded border border-border bg-background p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Évolution récente :</label>
              <select
                value={evolutionTime} onChange={(e) => setEvolutionTime(e.target.value)}
                className="w-full text-xs rounded border border-border bg-background p-2"
              >
                <option value="progressive">S'aggrave progressivement ⚠️</option>
                <option value="stable">Stable</option>
                <option value="improving">S'améliore gentiment 📈</option>
                <option value="healing">En voie de guérison complète ✨</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Historique des épisodes :</label>
              <select
                value={historyEpisodes} onChange={(e) => setHistoryEpisodes(e.target.value)}
                className="w-full text-xs rounded border border-border bg-background p-2"
              >
                <option value="first_occurrence">Premier épisode de cette douleur</option>
                <option value="recurring">Douleur récurrente / habituelle</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold block mb-1">Intensité repos (0-10) :</label>
              <input
                type="number" min="0" max="10" value={intRest}
                onChange={(e) => setIntRest(Number(e.target.value))}
                className="w-full text-xs rounded border border-border bg-background p-2"
              />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1">Intensité à l'effort (0-10) :</label>
              <input
                type="number" min="0" max="10" value={intEffort}
                onChange={(e) => setIntEffort(Number(e.target.value))}
                className="w-full text-xs rounded border border-border bg-background p-2"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Impact immédiat sur votre planification :</label>
            <select
              value={impact} onChange={(e) => setImpact(e.target.value)}
              className="w-full text-xs rounded border border-border bg-background p-2"
            >
              <option value="none">Aucun impact (simple inconfort)</option>
              <option value="modified_training">Entraînement adapté (moins volumineux/intense)</option>
              <option value="no_training">Arrêt temporaire de l'entraînement</option>
            </select>
          </div>

          <div className="text-[10px] text-amber-600 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
            ⚠️ <strong>Avis de sécurité médicale :</strong> Aura Elite ne formule jamais de diagnostics médicaux. Si une douleur est forte (≥ 5/10), persiste plus de 7 jours ou s'aggrave rapidement, consultez immédiatement un médecin ou kinésithérapeute du sport.
          </div>

          <Button type="submit" className="w-full bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
            Signaler la douleur
          </Button>
        </>
      )}
    </form>
  );
}

function ContextForm({ onSuccess }: FormProps) {
  const addMetric = useStore(state => state.addMetric);
  const addContextLog = useStore(state => state.addContextLog);
  const [success, setSuccess] = useState(false);

  // Checkboxes for various context factors
  const [travel, setTravel] = useState(false);
  const [jetlag, setJetlag] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [lateMeal, setLateMeal] = useState(false);
  const [heat, setHeat] = useState(false);
  const [altitude, setAltitude] = useState(false);
  const [stressEx, setStressEx] = useState(false);
  const [exams, setExams] = useState(false);
  const [meds, setMeds] = useState(false);
  const [cycle, setCycle] = useState(false);
  const [competition, setCompetition] = useState(false);
  const [interruptedNight, setInterruptedNight] = useState(false);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split('T')[0];

    addContextLog({
      id: `context_${Date.now()}`,
      date: dateStr,
      travel,
      jetlag,
      alcohol,
      lateMeal,
      heat,
      altitude,
      stressEx,
      exams,
      meds,
      cycle,
      competition,
      interruptedNight,
      notes
    });

    addMetric({
      id: `m_context_${Date.now()}`,
      source: "manual",
      timestamp: new Date().toISOString(),
      type: "notes_context",
      value: 1, // trigger exists
      unit: "text",
      confidenceScore: 100
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      if (onSuccess) onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b pb-3 border-border">
        <h3 className="text-lg font-bold">Contexte de Vie & Facteurs Perturbateurs</h3>
        <p className="text-xs text-muted-foreground">Expliquez les baisses subites de HRV, d'efficacité du sommeil ou d'élévation cardiaque.</p>
      </div>

      {success ? (
        <div className="text-center text-emerald-500 font-semibold py-6">
          <CheckCircle size={24} className="mx-auto mb-2" />
          <span>Facteurs de contexte enregistrés !</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <ContextCheckbox label="Voyage récent" checked={travel} onChange={setTravel} />
            <ContextCheckbox label="Décalage horaire" checked={jetlag} onChange={setJetlag} />
            <ContextCheckbox label="Consommation alcool" checked={alcohol} onChange={setAlcohol} />
            <ContextCheckbox label="Dîner / Repas tardif" checked={lateMeal} onChange={setLateMeal} />
            <ContextCheckbox label="Chaleur excessive" checked={heat} onChange={setHeat} />
            <ContextCheckbox label="Altitude (> 1500m)" checked={altitude} onChange={setAltitude} />
            <ContextCheckbox label="Stress exceptionnel" checked={stressEx} onChange={setStressEx} />
            <ContextCheckbox label="Examens / Surcharge Pro" checked={exams} onChange={setExams} />
            <ContextCheckbox label="Prise de Médicaments" checked={meds} onChange={setMeds} />
            <ContextCheckbox label="Période du cycle sensible" checked={cycle} onChange={setCycle} />
            <ContextCheckbox label="Compétition imminente" checked={competition} onChange={setCompetition} />
            <ContextCheckbox label="Nuit coupée / interrompue" checked={interruptedNight} onChange={setInterruptedNight} />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Notes textuelles complémentaires :</label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Ex: Vol de nuit de 4 heures, déshydratation accentuée."
              className="w-full text-xs rounded border border-border bg-background p-2 focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full bg-[#0071E3] text-white hover:bg-[#0071E3]/90">
            Enregistrer le contexte
          </Button>
        </>
      )}
    </form>
  );
}

function ContextCheckbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer select-none transition-all text-xs font-medium ${
      checked ? 'bg-primary/5 border-primary/25 text-primary' : 'bg-background hover:bg-secondary/40 border-border text-muted-foreground'
    }`}>
      <input
        type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="rounded accent-primary w-3.5 h-3.5"
      />
      <span>{label}</span>
    </label>
  );
}
