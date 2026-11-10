import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Atom,
  FlaskConical,
  Clock,
  Play,
  RotateCcw,
  Lock,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Award,
  RefreshCw,
  FileCheck2
} from 'lucide-react';
import {
  getSavedStudentSession,
  getStudentDashboardStatus
} from '../services/evaluationService';
import { formatDateTime } from '../utils/reportExporter';

export default function EstudianteDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    const saved = getSavedStudentSession();
    if (!saved) {
      navigate('/registro');
      return;
    }
    try {
      setLoading(true);
      const data = await getStudentDashboardStatus(saved.id);
      setDashboard(data);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar el estado de las evaluaciones.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  if (loading && !dashboard) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Verificando estado de intentos y sesiones activas...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-white">Sesión no disponible</h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Link
            to="/registro"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            Volver al Registro / Ingreso
          </Link>
        </div>
      </div>
    );
  }

  const { participant, subjects } = dashboard;

  const renderSubjectCard = (key, title, subtitle, IconComponent, accentColor) => {
    const info = subjects[key];
    const isFisica = key === 'fisica';

    return (
      <div
        key={key}
        className={`rounded-2xl border p-6 sm:p-8 shadow-xl transition-all ${
          isFisica
            ? 'border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950/25'
            : 'border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/25'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`flex h-13 w-13 items-center justify-center rounded-xl border ${
                isFisica
                  ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-400'
                  : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <IconComponent className="h-7 w-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{subtitle}</span>
              <h2 className="text-2xl font-extrabold text-white">{title}</h2>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={`rounded-full px-3.5 py-1 text-xs font-bold border ${
                info.remainingAttempts > 0
                  ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                  : 'border-rose-500/30 bg-rose-500/15 text-rose-300'
              }`}
            >
              Intentos completados: {info.completedCount} / {info.maxAttempts}
            </span>
            <span className="mt-1 text-xs text-slate-400">
              Disponibles: <strong>{info.remainingAttempts}</strong>
            </span>
          </div>
        </div>

        {/* Attempt Progress Dots */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((num) => {
            const isDone = num <= info.completedCount;
            const isInProgress = info.activeAttempt && info.activeAttempt.attemptNumber === num;
            return (
              <div
                key={num}
                className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold ${
                  isDone
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : isInProgress
                    ? 'border-amber-500/50 bg-amber-950/40 text-amber-200 animate-pulse'
                    : 'border-slate-800 bg-slate-950/60 text-slate-500'
                }`}
              >
                <div>Intento #{num}</div>
                <div className="mt-0.5 text-[11px] font-normal">
                  {isDone ? 'Completado' : isInProgress ? 'En curso (Recuperable)' : 'Disponible'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interrupted Attempt Alert */}
        {info.activeAttempt && (
          <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <RotateCcw className="h-4 w-4 animate-spin" />
              <span>Evaluación en curso detectada (Intento #{info.activeAttempt.attemptNumber})</span>
            </div>
            <p className="mt-1 text-amber-200/90">
              Tiene {info.activeAttempt.answeredCount} de {info.activeAttempt.totalQuestions} preguntas respondidas guardadas.
              Presione el botón inferior para retomar su evaluación antes de que finalice el tiempo.
            </p>
          </div>
        )}

        {/* Exam Metadata */}
        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Duración: <strong>{info.durationMinutes} min</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileCheck2 className="h-4 w-4 text-slate-400" />
            <span>Reactivos aleatorios: <strong>{info.questionsPerAttempt} preguntas</strong></span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          {info.activeAttempt ? (
            <button
              onClick={() => navigate(`/evaluacion/${key}`)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 px-5 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 hover:bg-amber-400 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reanudar Evaluación Interrumpida (Intento #{info.activeAttempt.attemptNumber})</span>
            </button>
          ) : info.canStartNew ? (
            <button
              onClick={() => navigate(`/evaluacion/${key}`)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-sm font-bold text-white shadow-lg transition-all cursor-pointer ${
                isFisica
                  ? 'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-500'
                  : 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500'
              }`}
            >
              <Play className="h-4 w-4" />
              <span>Iniciar Intento #{info.completedCount + 1} de {title}</span>
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 py-3.5 px-5 text-sm font-semibold text-slate-400">
              <Lock className="h-4 w-4 text-rose-400" />
              <span>Ha completado los {info.maxAttempts} intentos permitidos en {title}</span>
            </div>
          )}
        </div>

        {/* Completed History (Scores strictly hidden from student) */}
        {info.completedHistory && info.completedHistory.length > 0 && (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Comprobantes de Intentos Enviados (Calificación confidencial)
            </h4>
            <div className="space-y-2">
              {info.completedHistory.map((h) => (
                <div
                  key={h.attemptId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-white">Intento #{h.attemptNumber}</span>
                    <span className="text-slate-400">• {formatDateTime(h.completedAt)}</span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    Registrado en servidor (Puntaje reservado al docente)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Student Identity Banner */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <UserCheck className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white">{participant.fullName}</h1>
                  <span className="rounded-md bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                    {participant.sectionName || participant.sectionCode}
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Documento / Carnet Verificado: <code className="text-slate-200 font-semibold">{participant.documento}</code> • Grado: Décimo Grado
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Los puntajes y respuestas correctas son de acceso exclusivo para el panel docente.
              </span>
            </div>
          </div>
        </div>

        {/* Physics & Chemistry Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {renderSubjectCard('fisica', 'Física', 'Ciencias Naturales • Décimo Grado', Atom, 'indigo')}
          {renderSubjectCard('quimica', 'Química', 'Ciencias Naturales • Décimo Grado', FlaskConical, 'emerald')}
        </div>
      </div>
    </div>
  );
}
