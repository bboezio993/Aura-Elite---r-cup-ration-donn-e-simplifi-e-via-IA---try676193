import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Activity, Brain, Moon, Zap, Smile } from 'lucide-react';

export function HooperForm({ onComplete }: { onComplete?: () => void }) {
  const addHooperLog = useStore(state => state.addHooperLog);
  
  const [fatigue, setFatigue] = useState([4]);
  const [stress, setStress] = useState([4]);
  const [sleepQuality, setSleepQuality] = useState([4]);
  const [soreness, setSoreness] = useState([4]);
  const [mood, setMood] = useState([4]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addHooperLog({
      id: `hooper-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      fatigue: fatigue[0],
      stress: stress[0],
      sleepQuality: sleepQuality[0],
      soreness: soreness[0],
      mood: mood[0],
      notes
    });

    if (onComplete) onComplete();
  };

  const renderSlider = (
    label: string, 
    value: number[], 
    setValue: (val: number[]) => void, 
    icon: React.ReactNode, 
    leftLabel: string, 
    rightLabel: string,
    invertColors: boolean = false
  ) => {
    // Determine color based on value (1-7 scale)
    // For fatigue/stress/soreness: 1 is good (green), 7 is bad (red)
    // For sleepQuality/mood: 1 is good (green), 7 is bad (red) - wait, usually 1 is bad for mood?
    // Let's standardize: 1 = Optimal/Good, 7 = Bad/Danger
    const isGood = value[0] <= 3;
    const isBad = value[0] >= 5;
    const colorClass = isGood ? 'text-green-500' : isBad ? 'text-red-500' : 'text-yellow-500';

    return (
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base">
            <span className={colorClass}>{icon}</span>
            {label}
          </Label>
          <span className={`font-bold ${colorClass}`}>{value[0]} / 7</span>
        </div>
        <Slider 
          value={value} 
          onValueChange={setValue} 
          max={7} 
          min={1} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="bg-muted/30 p-4 rounded-lg mb-6 text-sm text-muted-foreground">
        Ce questionnaire (Hooper Index) prend moins de 30 secondes. Il est crucial pour croiser votre ressenti subjectif avec vos données physiologiques objectives.
      </div>

      {renderSlider('Fatigue', fatigue, setFatigue, <Zap size={18} />, 'Très en forme (1)', 'Épuisé (7)')}
      {renderSlider('Niveau de Stress', stress, setStress, <Brain size={18} />, 'Très détendu (1)', 'Très stressé (7)')}
      {renderSlider('Qualité du Sommeil', sleepQuality, setSleepQuality, <Moon size={18} />, 'Excellente (1)', 'Très mauvaise (7)')}
      {renderSlider('Douleurs Musculaires', soreness, setSoreness, <Activity size={18} />, 'Aucune douleur (1)', 'Très douloureux (7)')}
      {renderSlider('Humeur / Motivation', mood, setMood, <Smile size={18} />, 'Très motivé (1)', 'Apathique (7)')}

      <div className="space-y-2 mb-6">
        <Label>Notes additionnelles (Optionnel)</Label>
        <Textarea 
          placeholder="Un contexte particulier aujourd'hui ? (ex: voyage, maladie, stress au travail...)" 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none"
        />
      </div>

      <Button type="submit" className="w-full bg-[#0071E3] hover:bg-[#0071E3]/90 text-white">
        Enregistrer mon état du jour
      </Button>
    </form>
  );
}
