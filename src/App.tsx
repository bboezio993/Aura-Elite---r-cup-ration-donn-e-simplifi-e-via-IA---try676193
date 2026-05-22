/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Biometrics } from './pages/Biometrics';
import { Sleep } from './pages/Sleep';
import { Training } from './pages/Training';
import { Nutrition } from './pages/Nutrition';
import { Mental } from './pages/Mental';
import { Connections } from './pages/Connections';
import { GarminImportHub } from './pages/GarminImportHub';
import { Settings } from './pages/Settings';
import { MenstrualCycle } from './pages/MenstrualCycle';
import { Confidentiality } from './pages/Confidentiality';
import { FirebaseProvider } from './components/FirebaseProvider';

export default function App() {
  return (
    <FirebaseProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="biometrics" element={<Biometrics />} />
            <Route path="sleep" element={<Sleep />} />
            <Route path="cycle" element={<MenstrualCycle />} />
            <Route path="training" element={<Training />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="mental" element={<Mental />} />
            <Route path="connections" element={<Connections />} />
            <Route path="connections/garmin" element={<GarminImportHub />} />
            <Route path="settings" element={<Settings />} />
            <Route path="confidentiality" element={<Confidentiality />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FirebaseProvider>
  );
}
