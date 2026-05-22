import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Activity, Heart, Shield, Bell } from 'lucide-react';

export function Settings() {
  const profile = useStore(state => state.userProfile);
  const updateUserProfile = useStore(state => state.updateUserProfile);

  const [general, setGeneral] = useState(profile.general);
  const [sport, setSport] = useState(profile.sport);
  const [preferences, setPreferences] = useState(profile.preferences);

  const handleSaveGeneral = () => {
    updateUserProfile({ general });
  };

  const handleSaveSport = () => {
    updateUserProfile({ sport });
  };

  const handleSavePreferences = () => {
    updateUserProfile({ preferences });
  };

  return (
    <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Paramètres & Profil</h2>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles, vos préférences d'analyse et vos paramètres de confidentialité.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8 bg-secondary/50 p-1">
          <TabsTrigger value="general" className="gap-2"><User size={16} /> Général</TabsTrigger>
          <TabsTrigger value="sport" className="gap-2"><Activity size={16} /> Sport & Santé</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2"><Bell size={16} /> Préférences</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><Shield size={16} /> Confidentialité</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bento-card bg-white">
            <h3 className="text-lg font-semibold mb-4">Informations Personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom / Pseudonyme</Label>
                <Input id="name" value={general.name} onChange={e => setGeneral({...general, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Âge</Label>
                <Input id="age" type="number" value={general.age || ''} onChange={e => setGeneral({...general, age: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Taille (cm)</Label>
                <Input id="height" type="number" value={general.height || ''} onChange={e => setGeneral({...general, height: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Poids (kg)</Label>
                <Input id="weight" type="number" value={general.weight || ''} onChange={e => setGeneral({...general, weight: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveGeneral} className="bg-[#0071E3] text-white hover:bg-[#0071E3]/90">Sauvegarder</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sport" className="space-y-6">
          <div className="bento-card bg-white">
            <h3 className="text-lg font-semibold mb-4">Profil Sportif</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sport">Sport Principal</Label>
                <Input id="sport" value={sport.primarySport} onChange={e => setSport({...sport, primarySport: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="freq">Fréquence (séances/semaine)</Label>
                <Input id="freq" type="number" value={sport.trainingFrequency} onChange={e => setSport({...sport, trainingFrequency: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vol">Volume Hebdomadaire (heures)</Label>
                <Input id="vol" type="number" value={sport.weeklyVolume} onChange={e => setSport({...sport, weeklyVolume: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveSport} className="bg-[#0071E3] text-white hover:bg-[#0071E3]/90">Sauvegarder</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="bento-card bg-white">
            <h3 className="text-lg font-semibold mb-4">Fonctionnalités & Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-xl">
                <div>
                  <p className="font-medium">Suivi du Cycle Menstruel</p>
                  <p className="text-sm text-[#86868B]">Activer le module d'analyse et d'adaptation sportive lié au cycle.</p>
                </div>
                <input type="checkbox" checked={preferences.enableMenstrualTracking} onChange={e => {
                  const newPrefs = {...preferences, enableMenstrualTracking: e.target.checked};
                  setPreferences(newPrefs);
                  updateUserProfile({ preferences: newPrefs });
                }} className="toggle" />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F2F2F7] rounded-xl">
                <div>
                  <p className="font-medium">Notifications Intelligentes</p>
                  <p className="text-sm text-[#86868B]">Recevoir des alertes de récupération et d'entraînement.</p>
                </div>
                <input type="checkbox" checked={preferences.notificationsEnabled} onChange={e => {
                  const newPrefs = {...preferences, notificationsEnabled: e.target.checked};
                  setPreferences(newPrefs);
                  updateUserProfile({ preferences: newPrefs });
                }} className="toggle" />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <div className="bento-card bg-white border-destructive/20">
            <h3 className="text-lg font-semibold mb-4 text-destructive">Zone critique</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vos données de santé sont sensibles. Vous avez le contrôle total sur leur conservation.
            </p>
            <div className="flex gap-4">
              <Button variant="outline">Exporter mes données</Button>
              <Button variant="destructive">Supprimer mon compte</Button>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
