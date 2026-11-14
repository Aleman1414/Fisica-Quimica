import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Atom,
  FlaskConical,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Save,
  Trophy,
  Calendar,
  Play
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  getSavedStudentSession,
  startOrResumeEvaluation,
  saveAttemptProgress,
  submitEvaluationAttempt
} from '../services/evaluationService';
import { formatSeconds, formatDateTime } from '../utils/reportExporter';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function EvaluacionPage() {
  const { asignatura } = useParams();
  const navigate = useNavigate();
  const subject = (asignatura || '').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [resumedBanner, setResumedBanner] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [savingState, setSavingState] = useState('guardado'); // 'guardando' | 'guardado' | 'error'
  const [submitting, setSubmitting] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);

  const autoSubmitTriggered = useRef(false);
  const latestAnswersRef = useRef({});

  useEffect(() => {
    latestAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  const loadEvaluationAttempt = useCallback(async () => {
    if (!['fisica', 'quimica'].includes(subject)) {
      navigate('/estudiante');
      return;
    }
    const student = getSavedStudentSession();
    if (!student) {
      navigate('/registro');
      return;
    }

    try {
      setLoading(true);
      setCompletedReceipt(null);
      autoSubmitTriggered.current = false;
      const res = await startOrResumeEvaluation({
        participantId: student.id,
        subject
      });
      setAttempt(res.attempt);
      setSelectedAnswers(res.attempt.selectedAnswers || {});
      setCurrentIdx(0);
      setResumedBanner(Boolean(res.resumed));

      const rem = Math.max(0, Math.floor((res.attempt.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(rem);
    } catch (err) {
      await Swal.fire({
        title: 'No es posible iniciar la evaluación',
        text: err.message || 'Ha alcanzado el límite de intentos o no tiene acceso.',
        icon: 'warning',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc'
      });
      navigate('/estudiante');
    } finally {
      setLoading(false);
    }
  }, [subject, navigate]);

  // Initialize or recover evaluation attempt
  useEffect(() => {
    loadEvaluationAttempt();
  }, [loadEvaluationAttempt]);

  // Finalize routine (manual or automatic timeout)
  const executeFinalSubmit = useCallback(
    async (reason = 'student_submit') => {
      if (!attempt || submitting || completedReceipt) return;
      try {
        setSubmitting(true);
        const response = await submitEvaluationAttempt({
          attemptId: attempt.attemptId,
          selectedAnswers: latestAnswersRef.current,
          reason
        });
        setCompletedReceipt(response.summary);
      } catch (err) {
        await Swal.fire({
          title: 'Aviso al procesar entrega',
          text: err.message || 'Error al registrar la evaluación.',
          icon: 'error',
          confirmButtonColor: '#4f46e5',
          background: '#0f172a',
          color: '#f8fafc'
        });
        navigate('/estudiante');
      } finally {
        setSubmitting(false);
      }
    },
    [attempt, submitting, completedReceipt, navigate]
  );

  // Server-synced 1-second countdown timer
  useEffect(() => {
    if (!attempt || completedReceipt) return;

    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.floor((attempt.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0 && !autoSubmitTriggered.current) {
        autoSubmitTriggered.current = true;
        clearInterval(interval);
        executeFinalSubmit('timeout_expired');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt, completedReceipt, executeFinalSubmit]);

  // Handle option selection with immediate server/local persistence
  const handleSelectOption = async (questionId, optionId) => {
    if (!attempt || submitting || completedReceipt || remainingSeconds <= 0) return;

    const updated = {
      ...selectedAnswers,
      [questionId]: optionId
    };
    setSelectedAnswers(updated);
    latestAnswersRef.current = updated;

    try {
      setSavingState('guardando');
      await saveAttemptProgress({
        attemptId: attempt.attemptId,
        selectedAnswers: updated
      });
      setSavingState('guardado');
    } catch {
      setSavingState('error');
    }
  };

  const handleManualSubmitClick = async () => {
    if (!attempt) return;
    const totalQuestions = attempt.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    const unansweredCount = totalQuestions - answeredCount;

    const confirm = await Swal.fire({
      title: '¿Finalizar y calificar evaluación?',
      html:
        unansweredCount > 0
          ? `Ha respondido <strong>${answeredCount} de ${totalQuestions}</strong> preguntas.<br/><span style="color:#fbbf24">Aún tiene ${unansweredCount} pregunta(s) sin responder.</span><br/>Una vez enviada, se calculará su calificación de este intento.`
          : `Ha respondido las <strong>${totalQuestions} preguntas</strong> de este intento.<br/>Una vez enviada, se mostrará su calificación y se actualizará su nota más alta.`,
      icon: unansweredCount > 0 ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, finalizar y calificar',
      cancelButtonText: 'Seguir revisando',
      background: '#0f172a',
      color: '#f8fafc'
    });

    if (confirm.isConfirmed) {
      await executeFinalSubmit('student_submit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-base font-bold">Preparando evaluación de {subject === 'fisica' ? 'Física' : 'Química'}...</p>
          <p className="text-xs text-slate-400">Generando orden aleatorio de preguntas y opciones</p>
        </div>
      </div>
    );
  }

  // Receipt screen after submission showing Attempt Score and Highest Final Grade
  if (completedReceipt) {
    const durationMinutes = Math.round((completedReceipt.durationSeconds || 1500) / 60);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 py-10">
        <div className="max-w-xl w-full rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 sm:p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
            Resultados de Evaluación • Intento #{completedReceipt.attemptNumber} de 3
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-white">
            ¡Evaluación de {subject === 'fisica' ? 'Física' : 'Química'} Finalizada!
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Cada estudiante cuenta con 3 intentos. Su <strong>Calificación Final</strong> corresponde a la calificación más alta obtenida.
          </p>

          {/* Current Attempt Grade vs Final (Highest) Grade */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Calificación de Este Intento (#{completedReceipt.attemptNumber})
              </div>
              <div className="mt-2 text-3xl font-extrabold text-white">
                {completedReceipt.percentage}%
              </div>
              <div className="mt-1 text-xs font-semibold text-indigo-300">
                {completedReceipt.score} / {completedReceipt.maxScore} puntos ({completedReceipt.correctCount}/{completedReceipt.totalQuestions} aciertos)
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-950/40 to-emerald-950/30 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-300">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Calificación Final (Nota Más Alta)</span>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-emerald-400">
                {completedReceipt.finalPercentage}%
              </div>
              <div className="mt-1 text-xs font-semibold text-amber-200">
                {completedReceipt.finalScore} / {completedReceipt.finalMaxScore} puntos (Intento #{completedReceipt.bestAttemptNumber})
              </div>
            </div>
          </div>

          {/* Start Time, Duration & Closing Time Details */}
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-xs space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Asignatura:</span>
              <span className="font-bold text-white">{subject === 'fisica' ? 'Física (10° Grado)' : 'Química (10° Grado)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hora de Inicio de la Prueba:</span>
              <span className="font-semibold text-white">{formatDateTime(completedReceipt.startedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duración de la Prueba:</span>
              <span className="font-semibold text-sky-300">
                {durationMinutes} min (Tiempo empleado: {formatSeconds(completedReceipt.timeSpentSeconds || 0)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hora de Cierre / Entrega:</span>
              <span className="font-semibold text-white">{formatDateTime(completedReceipt.completedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ventana General del Examen:</span>
              <span className="font-semibold text-indigo-300">Sáb 14 Nov 13:00 — Dom 15 Nov 23:59</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Intentos Restantes en esta Asignatura:</span>
              <span className="font-bold text-emerald-400">{completedReceipt.remainingAttempts} de 3</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            {completedReceipt.remainingAttempts > 0 && (
              <button
                onClick={loadEvaluationAttempt}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4" />
                <span>Realizar Intento #{completedReceipt.attemptNumber + 1} de 3</span>
              </button>
            )}
            <button
              onClick={() => navigate('/estudiante')}
              className="flex-1 rounded-xl bg-indigo-600 py-3.5 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              Volver a Mi Panel de Estudiante
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!attempt || !attempt.questions || attempt.questions.length === 0) {
    return null;
  }

  const currentQuestion = attempt.questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = attempt.questions.length;
  const isLowTime = remainingSeconds <= 300;
  const isCriticalTime = remainingSeconds <= 60;
  const attemptDurationMinutes = Math.round((attempt.durationSeconds || 1500) / 60);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Sticky Exam Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                subject === 'fisica'
                  ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-400'
                  : 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {subject === 'fisica' ? <Atom className="h-5 w-5" /> : <FlaskConical className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">
                  Evaluación de {subject === 'fisica' ? 'Física' : 'Química'}
                </h1>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-bold text-indigo-300">
                  Intento #{attempt.attemptNumber}/3
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Save className="h-3.5 w-3.5 text-emerald-400" />
                <span>
                  {savingState === 'guardando'
                    ? 'Sincronizando respuesta...'
                    : savingState === 'guardado'
                    ? 'Progreso autoguardado en tiempo real'
                    : 'Reintentando guardado...'}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown Timer & Submit */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-base font-extrabold ${
                isCriticalTime
                  ? 'border-rose-500 bg-rose-950/70 text-rose-300 animate-pulse'
                  : isLowTime
                  ? 'border-amber-500/60 bg-amber-950/50 text-amber-300'
                  : 'border-slate-700 bg-slate-950 text-white'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatSeconds(remainingSeconds)}</span>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleManualSubmitClick}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Finalizar Evaluación</span>
            </button>
          </div>
        </div>

        {/* Start Time, Duration & Closing Time Strip */}
        <div className="mx-auto mt-2.5 max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-slate-800/80 pt-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <span>
              <strong>Hora de Inicio:</strong> {formatDateTime(attempt.startedAt)} <span className="text-slate-400">(Apertura general: Sáb 14 Nov, 13:00)</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>
              <strong>Duración de la Prueba:</strong> {attemptDurationMinutes} minutos ({totalQuestions} preguntas)
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Hora de Cierre:</strong> {formatDateTime(attempt.expiresAt)} <span className="text-slate-400">(Cierre general: Dom 15 Nov, 23:59)</span>
            </span>
          </div>
        </div>
      </header>

      {/* Interrupted Recovery Banner */}
      {resumedBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <RotateCcw className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            <strong>Sesión recuperada exitosamente:</strong> Se han restaurado sus respuestas previas y el tiempo restante de su intento #{attempt.attemptNumber}.
          </span>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 grid gap-6 p-4 sm:p-6 lg:grid-cols-12">
        {/* Question Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-extrabold text-white">
                  Pregunta {currentIdx + 1} de {totalQuestions}
                </span>
                <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300">
                  {currentQuestion.topic}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                Valor: {currentQuestion.points} pts
              </span>
            </div>

            <h2 className="mt-6 text-lg sm:text-xl font-bold leading-relaxed text-white">
              {currentQuestion.prompt}
            </h2>

            {/* Randomized Options */}
            <div className="mt-6 space-y-3">
              {(currentQuestion.options || []).map((option, optIndex) => {
                const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                const letter = OPTION_LABELS[optIndex] || String(optIndex + 1);

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                    className={`w-full flex items-start gap-4 rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="pt-1 text-sm sm:text-base font-medium leading-relaxed">
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prev / Next Navigation Footer */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-5">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <span className="text-xs font-medium text-slate-400">
              Respondidas: <strong className="text-white">{answeredCount}</strong> de {totalQuestions}
            </span>

            {currentIdx < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(totalQuestions - 1, i + 1))}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSubmitClick}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Entregar Evaluación</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Map Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Mapa de Reactivos
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Seleccione cualquier número para saltar directamente a esa pregunta.
            </p>

            <div className="mt-4 grid grid-cols-5 gap-2.5">
              {attempt.questions.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                const isCurrent = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-white bg-indigo-600 text-white'
                        : isAnswered
                        ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                        : 'border border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-emerald-500/40 border border-emerald-500" />
                <span>Respondida ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-slate-950 border border-slate-700" />
                <span>Pendiente ({totalQuestions - answeredCount})</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-5 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Criterio de Calificación Final</span>
            </div>
            <p>
              Cuenta con <strong>3 intentos</strong> para realizar el examen. Al finalizar, se le mostrará su calificación final, la cual será la <strong>calificación más alta</strong> alcanzada entre sus intentos.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>Protección Activa</span>
            </div>
            <p>
              Cada selección se sincroniza automáticamente. Si recarga la página o pierde conexión temporalmente, podrá continuar exactamente donde se quedó mientras el temporizador siga activo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
