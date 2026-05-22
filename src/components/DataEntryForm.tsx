import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DailyMetrics } from "../types";

interface DataEntryFormProps {
  onSave: (metrics: Partial<DailyMetrics>) => void;
}

export function DataEntryForm({ onSave }: DataEntryFormProps) {
  const [rpe, setRpe] = useState([5]);
  const [stress, setStress] = useState([3]);
  const [soreness, setSoreness] = useState([2]);

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="weight">Poids (kg)</Label>
        <Input id="weight" type="number" step="0.1" placeholder="75.0" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Label>Intensité perçue (RPE)</Label>
          <span className="text-sm font-mono">{rpe[0]}/10</span>
        </div>
        <Slider 
          value={rpe} 
          onValueChange={setRpe} 
          max={10} 
          step={1} 
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Label>Niveau de Stress</Label>
          <span className="text-sm font-mono">{stress[0]}/10</span>
        </div>
        <Slider 
          value={stress} 
          onValueChange={setStress} 
          max={10} 
          step={1} 
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Label>Douleurs musculaires (DOMS)</Label>
          <span className="text-sm font-mono">{soreness[0]}/10</span>
        </div>
        <Slider 
          value={soreness} 
          onValueChange={setSoreness} 
          max={10} 
          step={1} 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mood">Humeur / État Mental</Label>
        <Input id="mood" placeholder="Ex: En forme, Fatigué, Motivé..." />
      </div>

      <Button className="w-full" onClick={() => onSave({
        rpe: rpe[0],
        stressLevel: stress[0],
        soreness: soreness[0],
        mood: (document.getElementById('mood') as HTMLInputElement)?.value || 'Normal',
        weight: parseFloat((document.getElementById('weight') as HTMLInputElement)?.value) || 75
      })}>
        Enregistrer les données
      </Button>
    </div>
  );
}
