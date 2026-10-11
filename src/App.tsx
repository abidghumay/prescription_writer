import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrescriptionPage from './pages/PrescriptionPage';
import DrugSearchPage from './pages/DrugSearchPage';
import PatientsPage from './pages/PatientsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PrescriptionPage />} />
        <Route path="search" element={<DrugSearchPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
