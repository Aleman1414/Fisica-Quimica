import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import RegistroPage from './pages/RegistroPage';
import EstudianteDashboard from './pages/EstudianteDashboard';
import EvaluacionPage from './pages/EvaluacionPage';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminParticipantesPage from './pages/admin/AdminParticipantesPage';
import AdminResultadosPage from './pages/admin/AdminResultadosPage';
import AdminPreguntasPage from './pages/admin/AdminPreguntasPage';
import AdminReportesPage from './pages/admin/AdminReportesPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/registro" element={<RegistroPage />} />
            <Route path="/estudiante" element={<EstudianteDashboard />} />
            <Route path="/evaluacion/:asignatura" element={<EvaluacionPage />} />
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/participantes" element={<AdminParticipantesPage />} />
            <Route path="/admin/resultados" element={<AdminResultadosPage />} />
            <Route path="/admin/preguntas" element={<AdminPreguntasPage />} />
            <Route path="/admin/reportes" element={<AdminReportesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
