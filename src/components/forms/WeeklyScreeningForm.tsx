import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Brain, AlertCircle } from 'lucide-react';

export function WeeklyScreeningForm({ onComplete }: { onComplete?: () => void }) {
  const addWeeklyScreeningLog = useStore(state => state.addWeeklyScreeningLog);
  
  // Simplified versions for quick entry
  const [pss, setPss] = useState([15]); // 0-40
  const [phq9, setPhq9] = useState([2]); // 0-27
  const [gad7, setGad7] = useState([2]); // 0-21

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addWeeklyScreeningLog({
      id: `screening-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      pssScore: pss[0],
      phq9Score: phq9[0],
      gad7Score: gad7[0]
    });

    if (onComplete) onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground">
        Ce screening hebdomadaire permet de détecter les signaux faibles de surcharge psychologique, d'anxiété ou de dépression (Couche G).
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base">
            <Brain size={18} className="text-[#AF52DE]" />
            Perceived Stress Scale (PSS)
          </Label>
          <span className="font-bold text-[#AF52DE] text-lg">{pss[0]} / 40</span>
        </div>
        <Slider 
          value={pss} 
          onValueChange={setPss} 
          max={40} 
          min={0} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Stress faible (0)</span>
          <span>Stress sévère (40)</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base">
            <AlertCircle size={18} className="text-gray-600" />
            PHQ-9 (Symptômes Dépressifs)
          </Label>
          <span className="font-bold text-gray-700">{phq9[0]} / 27</span>
        </div>
        <Slider 
          value={phq9} 
          onValueChange={setPhq9} 
          max={27} 
          min={0} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Aucun (0)</span>
          <span>Sévère (27)</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base">
            <AlertCircle size={18} className="text-gray-600" />
            GAD-7 (Anxiété)
          </Label>
          <span className="font-bold text-gray-700">{gad7[0]} / 21</span>
        </div>
        <Slider 
          value={gad7} 
          onValueChange={setGad7} 
          max={21} 
          min={0} 
          step={1} 
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Aucune (0)</span>
          <span>Sévère (21)</span>
        </div>
      </div>

      <Button type="submit" className="w-full bg-[#AF52DE] hover:bg-[#AF52DE]/90 text-white">
        Enregistrer le Screening
      </Button>
    </form>
  );
}
