import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Activity, Clock } from 'lucide-react';

export function SessionRPEForm({ activityId, onComplete }: { activityId: string, onComplete?: () => void }) {
  const addSessionRPE = useStore(state => state.addSessionRPE);
  
  const [rpe, setRpe] = useState([5]);
  const [duration, setDuration] = useState([60]);
  const [feeling, setFeeling] = useState([3]); // 1-5 scale
  const [pain, setPain] = useState([1]); // 1-10 scale

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addSessionRPE({
      id: `rpe-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      activityId,
      rpe: rpe[0],
      durationMinutes: duration[0],
      feeling: feeling[0],
      pain: pain[0].toString()
    });

    if (onComplete) onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground">
        Évaluez la difficulté globale de cette séance. Cette donnée (sRPE) est fondamentale pour calculer votre charge d'entraînement réelle (Couche C).
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base">
            <Activity size={18} className="text-[#0071E3]" />
            RPE (Effort Perçu)
          </Label>
          <span className="font-bold text-[#0071E3] text-lg">{rpe[0]} / 10</span>
        </div>
        <Slider 
          value={rpe} 
          onValueChange={setRpe} 
          max={10} 
          min={1} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Très facile (1)</span>
          <span>Effort maximal (10)</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base">
            <Clock size={18} className="text-gray-600" />
            Durée (Minutes)
          </Label>
          <span className="font-bold text-gray-700">{duration[0]} min</span>
        </div>
        <Slider 
          value={duration} 
          onValueChange={setDuration} 
          max={300} 
          min={10} 
          step={5} 
          className="py-2"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Ressenti Global</Label>
          <span className="font-bold">{feeling[0]} / 5</span>
        </div>
        <Slider 
          value={feeling} 
          onValueChange={setFeeling} 
          max={5} 
          min={1} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Très mauvais (1)</span>
          <span>Excellent (5)</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Douleur (Pendant/Après)</Label>
          <span className="font-bold text-red-500">{pain[0]} / 10</span>
        </div>
        <Slider 
          value={pain} 
          onValueChange={setPain} 
          max={10} 
          min={1} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Aucune (1)</span>
          <span>Insoutenable (10)</span>
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#0071E3] hover:bg-[#0071E3]/90 text-white">
        Enregistrer la charge (sRPE)
      </Button>
    </form>
  );
}
