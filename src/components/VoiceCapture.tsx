import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../components/FirebaseProvider';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  Mic, 
  MicOff, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  Loader2, 
  Sparkles, 
  VolumeX, 
  Heart, 
  Trash2, 
  ThumbsUp, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VoiceCaptureProps {
  formType: 'daily' | 'rpe' | 'nutrition' | 'pain' | 'context';
  onParsedResult: (parsedValues: any) => void;
  onClose?: () => void;
}

export function VoiceCapture({ formType, onParsedResult, onClose }: VoiceCaptureProps) {
  const store = useStore();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [vocalStatus, setVocalStatus] = useState<'idle' | 'listening' | 'finished'>('idle');
  
  // AI processing states
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<any | null>(null);
  const [hasSpeechSupported, setHasSpeechSupported] = useState(false);

  // Recognition refs
  const recognitionRef = useRef<any | null>(null);
  const timerRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'fr-FR';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => {
          // If we have final content, append it
          if (finalTrans) {
            return (prev.trim() + ' ' + finalTrans).trim();
          }
          return prev;
        });
      };

      rec.onerror = (errEvent: any) => {
        console.error("Speech Recognition Error:", errEvent.error);
        if (errEvent.error !== 'no-speech') {
          setError(`Erreur de dictée: ${errEvent.error}. Veuillez utiliser la saisie texte rapide.`);
          stopRecording();
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startRecording = () => {
    setError(null);
    setTranscript('');
    setRecordingSeconds(0);
    setIsRecording(true);
    setVocalStatus('listening');
    setAiDraft(null);

    // Setup micro session timer (15s - 45s target guidelines)
    timerRef.current = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 60) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);

    // Start recognition engine
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Speech recognition already running", e);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setVocalStatus('finished');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Stop error", e);
      }
    }
  };

  const clearAll = () => {
    setTranscript('');
    setAiDraft(null);
    setVocalStatus('idle');
    setError(null);
    setRecordingSeconds(0);
  };

  const handleProcessThroughAI = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError(null);
    setAiDraft(null);

    try {
      const res = await fetch("/api/gemini/parse-voice-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, formType })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "L'assistant n'a pas pu structurer votre dictée.");
      }
      const data = await res.json();
      setAiDraft(data);

      if (user && data.usageLog) {
        try {
          const usageDoc = doc(db, 'aiUsageLogs', data.usageLog.id);
          await setDoc(usageDoc, { ...data.usageLog, uid: user.uid });
        } catch (fsErr) {
          console.warn("Firestore usage log write skipped:", fsErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de structurer la dictée. Veuillez compléter ou reformuler.");
    } finally {
      setProcessing(false);
    }
  };

  const handleValidateDraft = () => {
    if (!aiDraft) return;
    // Map extracted AI items to properties
    onParsedResult(aiDraft);
    if (onClose) onClose();
  };

  return (
    <div className="space-y-4 text-xs font-sans">
      <div className="bg-secondary/10 p-4 rounded-2xl border border-border/80 text-center space-y-3">
        <h4 className="text-sm font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Mic className="text-primary w-4 h-4" />
          Assistant Vocal Intelligent ({formType.toUpperCase()})
        </h4>
        <p className="text-muted-foreground leading-relaxed text-[11px] max-w-md mx-auto">
          Dictez de manière naturelle votre état (ex: "Aujourd'hui, je me sens un peu crevée, fatigue à 5/7, stress bas à 2/7. J'ai super bien dormi. Pas de courbatures."). L'IA extraira et pré-remplira les potentielles barres de glissement !
        </p>

        <div className="flex justify-center items-center gap-4 py-2">
          {isRecording ? (
            <div className="flex flex-col items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={stopRecording}
                className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse shadow-md"
              >
                <MicOff className="w-6 h-6" />
              </Button>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-red-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                Enregistrement ({recordingSeconds}s / 60s max)
              </div>
              <div className="flex gap-1 justify-center items-end h-4 w-20">
                <span className="w-1 bg-red-500 rounded animate-[pulse_0.4s_infinite]" style={{ height: '40%' }} />
                <span className="w-1 bg-red-500 rounded animate-[pulse_0.6s_infinite]" style={{ height: '80%' }} />
                <span className="w-1 bg-red-500 rounded animate-[pulse_0.3s_infinite]" style={{ height: '30%' }} />
                <span className="w-1 bg-red-500 rounded animate-[pulse_0.5s_infinite]" style={{ height: '90%' }} />
                <span className="w-1 bg-red-500 rounded animate-[pulse_0.2s_infinite]" style={{ height: '50%' }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={startRecording}
                className="w-14 h-14 rounded-full border-primary/20 hover:border-primary/50 text-primary flex items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <Mic className="w-5 h-5" />
              </Button>
              <span className="text-[10px] text-muted-foreground font-semibold">Commencer la dictée</span>
            </div>
          )}
        </div>

        {!hasSpeechSupported && (
          <div className="p-2 border border-blue-500/20 bg-blue-500/5 rounded-xl text-[10px] text-muted-foreground flex items-center gap-1.5 justify-center">
            <VolumeX size={12} className="text-blue-500 shrink-0" />
            <span>Transcription native non disponible. Vous pouvez taper/coller votre dictée ci-dessous.</span>
          </div>
        )}
      </div>

      {/* Transcript text layout */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
          <span>Dictée transcrite ou texte copié :</span>
          {transcript && (
            <button onClick={clearAll} className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5 font-bold">
              <Trash2 size={11} />
              Réinitialiser
            </button>
          )}
        </label>
        <textarea
          rows={3}
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            setVocalStatus('finished');
          }}
          placeholder="Ex: Séance de 45 minutes d'endurance fondamentale. RPE ressenti de 4 sur 10. J'avais un super feeling aujourd'hui, j'avais un peu de douleur à la cuisse gauche mais rien de méchant."
          className="w-full text-xs rounded-lg border border-border bg-background p-3 focus:ring-1 focus:outline-none leading-relaxed"
        />
      </div>

      {vocalStatus === 'finished' && transcript && !aiDraft && (
        <div className="flex justify-end pt-1">
          <Button
            onClick={handleProcessThroughAI}
            disabled={processing || !transcript.trim()}
            className="text-xs h-9"
          >
            {processing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                Interprétation d'Intelligence Artificielle en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />
                Structurer mon formulaire avec l'IA ✨
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Structured results overview */}
      {aiDraft && (
        <div className="p-4 border rounded-2xl bg-secondary/5 border-border/80 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-muted-foreground block">Compte Rendu d'Analyse</span>
              <h5 className="font-bold text-foreground">Éléments extraits de la dictée :</h5>
            </div>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1 text-[10px]">
              <Sparkles size={10} />
              Structure Validée
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Displaying extracted parameters beautifully depending on formType */}
            {formType === 'daily' && (
              <div className="col-span-2 space-y-2 p-3 bg-secondary/20 rounded-xl border border-secondary border-t-2 border-t-emerald-500 grid grid-cols-2 gap-2">
                {aiDraft.fatigue !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Fatigue:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.fatigue}/7</span>
                  </div>
                )}
                {aiDraft.stress !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Stress:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.stress}/7</span>
                  </div>
                )}
                {aiDraft.sleepQuality !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Sommeil:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.sleepQuality}/7</span>
                  </div>
                )}
                {aiDraft.soreness !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Courbatures:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.soreness}/7</span>
                  </div>
                )}
                {aiDraft.mood !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Humeur:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.mood}/7</span>
                  </div>
                )}
                {aiDraft.motivation !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Motivation:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.motivation}/7</span>
                  </div>
                )}
                {aiDraft.painLevel !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Douleurs:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.painLevel}/10</span>
                  </div>
                )}
                {aiDraft.digestion !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Digestion:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.digestion}/5</span>
                  </div>
                )}
              </div>
            )}

            {formType === 'rpe' && (
              <div className="col-span-2 space-y-2 p-3 bg-secondary/20 rounded-xl border border-secondary border-t-2 border-t-emerald-500 grid grid-cols-2 gap-2">
                {aiDraft.rpe !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">RPE Borg:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.rpe}/10</span>
                  </div>
                )}
                {aiDraft.durationMinutes !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Durée:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.durationMinutes} min</span>
                  </div>
                )}
                {aiDraft.feeling !== undefined && (
                  <div className="p-1 px-2 bg-background border rounded flex justify-between items-center">
                    <span className="text-muted-foreground text-[10px]">Feeling:</span>
                    <span className="font-mono font-bold text-emerald-500">{aiDraft.feeling}/5</span>
                  </div>
                )}
                {aiDraft.comment && (
                  <div className="col-span-2 p-1 px-2 bg-background border rounded text-left">
                    <span className="text-muted-foreground text-[9px] block">Commentaire:</span>
                    <p className="text-[11px] text-foreground font-sans italic">{aiDraft.comment}</p>
                  </div>
                )}
              </div>
            )}

            {formType === 'nutrition' && (
              <div className="col-span-2 space-y-2 p-3 bg-secondary/20 rounded-xl border border-secondary border-t-2 border-t-emerald-500">
                <span className="text-muted-foreground text-[10px] block mb-1">Repas extrait par l'IA :</span>
                {aiDraft.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-1 px-2 bg-background border rounded flex justify-between items-center mb-1">
                    <span className="font-bold text-[11px]">{item.foodName}</span>
                    <span className="font-mono text-emerald-500">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {aiDraft.missingFields?.length > 0 && (
            <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-0.5 text-[10px]">
              <span className="font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Éléments omis de votre check-in (recommandés) :
              </span>
              <div className="flex flex-wrap gap-1 pl-1">
                {aiDraft.missingFields.map((field: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-[9px] text-amber-500/80 border-amber-500/20">{field}</Badge>
                ))}
              </div>
            </div>
          )}

          {aiDraft.uncertainFields?.length > 0 && (
            <div className="p-2 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-0.5 text-[10px]">
              <span className="font-bold text-blue-400 flex items-center gap-1">
                <HelpCircle size={12} />
                Incertitudes ou ambigüités détectées :
              </span>
              <ul className="list-disc list-inside text-muted-foreground pl-1 leading-tight space-y-0.5">
                {aiDraft.uncertainFields.map((field: string, idx: number) => (
                  <li key={idx} className="text-[10px]">{field}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-3 border-t flex justify-end gap-2">
            {onClose && (
              <Button onClick={onClose} variant="ghost" className="text-xs h-9">
                Annuler
              </Button>
            )}
            <Button
              onClick={handleValidateDraft}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-9"
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1" />
              Appliquer au formulaire actif
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
