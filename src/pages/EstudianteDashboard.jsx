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
  FileCheck2,
  Trophy,
  Calendar
} from 'lucide-react';
import {
  getSavedStudentSession,
  getStudentDashboardStatus
} from '../services/evaluationService';
import { formatDateTime, formatSeconds } from '../utils/reportExporter';
import ExamScheduleBanner from '../components/ExamScheduleBanner';

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
          <p className="text-sm font-medium">Verificando estado de intentos y calificaciones...</p>
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

  const renderSubjectCard = (key, title, subtitle, IconComponent) => {
    const info = subjects[key];
    const isFisica = key === 'fisica';
    const finalGrade = info.finalGrade;

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
              Intentos realizados: {info.completedCount} / {info.maxAttempts}
            </span>
            <span className="mt-1 text-xs text-slate-400">
              Intentos disponibles: <strong>{info.remainingAttempts}</strong>
            </span>
          </div>
        </div>

        {/* Final Grade Banner (Highest Score across attempts) */}
        {finalGrade && (
          <div className="mt-5 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 p-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                      {info.remainingAttempts === 0
                        ? 'Calificación Final Definitiva (Nota Más Alta)'
                        : 'Calificación Final Actual (Nota Más Alta)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Mejor resultado obtenido en el <strong>Intento #{finalGrade.attemptNumber}</strong> ({finalGrade.correctCount}/{finalGrade.totalQuestions} aciertos)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-emerald-400">
                  {finalGrade.percentage}%
                </div>
                <div className="text-xs font-bold text-slate-300">
                  {finalGrade.score} / {finalGrade.maxScore} pts
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attempt Progress Dots (3 Attempts) */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map((num) => {
            const attemptRecord = (info.completedHistory || []).find((h) => h.attemptNumber === num);
            const isDone = Boolean(attemptRecord) || num <= info.completedCount;
            const isInProgress = info.activeAttempt && info.activeAttempt.attemptNumber === num;
            const isHighest = finalGrade && attemptRecord && finalGrade.attemptNumber === num;

            return (
              <div
                key={num}
                className={`rounded-xl border px-3 py-2.5 text-center text-xs font-semibold ${
                  isHighest
                    ? 'border-amber-500/60 bg-amber-950/40 text-amber-200'
                    : isDone
                    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                    : isInProgress
                    ? 'border-amber-500/50 bg-amber-950/40 text-amber-200 animate-pulse'
                    : 'border-slate-800 bg-slate-950/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Intento #{num}</span>
                  {isHighest && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
                </div>
                <div className="mt-0.5 text-[11px] font-normal">
                  {attemptRecord
                    ? `${attemptRecord.percentage}% (${attemptRecord.score}/${attemptRecord.maxScore} pts)`
                    : isDone
                    ? 'Completado'
                    : isInProgress
                    ? 'En curso (Recuperable)'
                    : 'Disponible'}
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
              Inicio: <strong>{formatDateTime(info.activeAttempt.startedAt)}</strong> • Cierre del intento:{' '}
              <strong>{formatDateTime(info.activeAttempt.expiresAt)}</strong>. Tiene{' '}
              {info.activeAttempt.answeredCount} de {info.activeAttempt.totalQuestions} preguntas respondidas.
            </p>
          </div>
        )}

        {/* Exam Schedule & Metadata */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-indigo-400" />
              <span>Hora de Inicio</span>
            </div>
            <div className="mt-0.5 font-bold text-white">Sáb 14 Nov, 13:00</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-sky-400" />
              <span>Duración</span>
            </div>
            <div className="mt-0.5 font-bold text-white">
              {info.durationMinutes} min ({info.questionsPerAttempt} preg.)
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-emerald-400" />
              <span>Hora de Cierre</span>
            </div>
            <div className="mt-0.5 font-bold text-white">Dom 15 Nov, 23:59</div>
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
            <div className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 py-3.5 px-5 text-sm font-semibold text-slate-300">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>
                Ha completado los {info.maxAttempts} intentos permitidos • Calificación Final:{' '}
                <strong className="text-emerald-400">
                  {finalGrade ? `${finalGrade.percentage}% (${finalGrade.score}/${finalGrade.maxScore} pts)` : 'Completado'}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Completed History with Start Time, Duration, End Time, and Grade */}
        {info.completedHistory && info.completedHistory.length > 0 && (
          <div className="mt-6 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Desglose de Intentos Realizados (Nota Final = Calificación Más Alta)
              </h4>
            </div>
            <div className="space-y-2.5">
              {info.completedHistory.map((h) => {
                const isBest = finalGrade && finalGrade.attemptNumber === h.attemptNumber;
                return (
                  <div
                    key={h.attemptId}
                    className={`rounded-xl border px-4 py-3 text-xs ${
                      isBest
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-950/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${isBest ? 'text-amber-400' : 'text-emerald-400'}`} />
                        <span className="font-bold text-white">Intento #{h.attemptNumber}</span>
                        {isBest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                            <Trophy className="h-3 w-3" />
                            Calificación Más Alta
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 font-extrabold text-emerald-400">
                          {h.score} / {h.maxScore} pts ({h.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-400">
                      <div>
                        Inicio: <span className="text-slate-200">{formatDateTime(h.startedAt)}</span>
                      </div>
                      <div>
                        Duración: <span className="text-slate-200">{Math.round((h.durationSeconds || 1500) / 60)} min ({formatSeconds(h.timeSpentSeconds || 0)} usados)</span>
                      </div>
                      <div>
                        Cierre: <span className="text-slate-200">{formatDateTime(h.completedAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Official Exam Schedule & Live Timer */}
        <ExamScheduleBanner durationMinutes={25} />

        {/* Student Identity Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-lg">
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

            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-xs text-amber-200 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Dispone de <strong>3 intentos por examen</strong>. Su <strong>Calificación Final</strong> será la calificación más alta obtenida.
              </span>
            </div>
          </div>
        </div>

        {/* Physics & Chemistry Cards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {renderSubjectCard('fisica', 'Física', 'Ciencias Naturales • Décimo Grado', Atom)}
          {renderSubjectCard('quimica', 'Química', 'Ciencias Naturales • Décimo Grado', FlaskConical)}
        </div>
      </div>
    </div>
  );
}
