import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Timer, Hourglass, CheckCircle2, AlertCircle } from 'lucide-react';

export const EXAM_WINDOW_START_ISO = '2026-11-14T13:00:00-06:00';
export const EXAM_WINDOW_END_ISO = '2026-11-15T23:59:59-06:00';

export const EXAM_START_TIMESTAMP = new Date(EXAM_WINDOW_START_ISO).getTime();
export const EXAM_END_TIMESTAMP = new Date(EXAM_WINDOW_END_ISO).getTime();

function splitDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
    totalSeconds
  };
}

export default function ExamScheduleBanner({ durationMinutes = 25, compact = false }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isBeforeStart = now < EXAM_START_TIMESTAMP;
  const isActiveWindow = now >= EXAM_START_TIMESTAMP && now <= EXAM_END_TIMESTAMP;
  const isEnded = now > EXAM_END_TIMESTAMP;

  const targetDelta = isBeforeStart
    ? EXAM_START_TIMESTAMP - now
    : isActiveWindow
    ? EXAM_END_TIMESTAMP - now
    : 0;

  const countdown = splitDuration(targetDelta);
  const totalWindowMs = EXAM_END_TIMESTAMP - EXAM_START_TIMESTAMP;
  const elapsedPercent = isActiveWindow
    ? Math.min(100, Math.max(0, Math.round(((now - EXAM_START_TIMESTAMP) / totalWindowMs) * 100)))
    : isEnded
    ? 100
    : 0;

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900 to-indigo-950/35 p-5 sm:p-6 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left: Title & Status Badge */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold border ${
                isActiveWindow
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : isBeforeStart
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
              }`}
            >
              {isActiveWindow ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>PRUEBA ACTIVA • EN CURSO</span>
                </>
              ) : isBeforeStart ? (
                <>
                  <Hourglass className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span>PROGRAMADA • CUENTA REGRESIVA PARA APERTURA</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  <span>PERÍODO DE EVALUACIÓN FINALIZADO</span>
                </>
              )}
            </span>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300">
              3 Intentos por Asignatura • Nota Final = Calificación Más Alta
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <Timer className="h-5 w-5 text-indigo-400 shrink-0" />
            <span>Cronograma y Temporizador Oficial de la Prueba</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            {isBeforeStart
              ? 'El temporizador indica el tiempo restante para la apertura oficial del examen el sábado 14 de noviembre a las 13:00.'
              : isActiveWindow
              ? 'La evaluación se encuentra habilitada. El temporizador muestra el tiempo restante hasta el cierre el domingo 15 de noviembre a las 23:59.'
              : 'La ventana oficial de evaluación concluyó el domingo 15 de noviembre a las 23:59.'}
          </p>
        </div>

        {/* Right: Digital Countdown */}
        <div className="flex flex-col items-start lg:items-end shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-2">
            {isBeforeStart
              ? 'Inicia en (Sáb 14 Nov, 13:00):'
              : isActiveWindow
              ? 'Tiempo restante para el cierre (Dom 15 Nov, 23:59):'
              : 'Temporizador culminado:'}
          </span>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 min-w-[60px]">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-white">{countdown.days}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Días</div>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 min-w-[60px]">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-indigo-300">{countdown.hours}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Horas</div>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-2 min-w-[60px]">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-sky-300">{countdown.minutes}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Min</div>
            </div>
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-3 py-2 min-w-[60px]">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-300">{countdown.seconds}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">Seg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Time, Duration & Closing Time Cards */}
      {!compact && (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-slate-800/90 pt-4">
          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hora de Inicio de la Prueba
              </div>
              <div className="mt-0.5 text-sm font-extrabold text-white">
                Sábado 14 de noviembre de 2026
              </div>
              <div className="text-xs font-semibold text-indigo-300">13:00 hrs (1:00 p. m.)</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Duración de la Prueba
              </div>
              <div className="mt-0.5 text-sm font-extrabold text-white">
                {durationMinutes} minutos por intento
              </div>
              <div className="text-xs font-semibold text-sky-300">
                Vigencia total: 34 h 59 min • Máx. 3 intentos
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/75 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hora de Cierre de la Prueba
              </div>
              <div className="mt-0.5 text-sm font-extrabold text-white">
                Domingo 15 de noviembre de 2026
              </div>
              <div className="text-xs font-semibold text-emerald-300">23:59 hrs (11:59 p. m.)</div>
            </div>
          </div>
        </div>
      )}

      {isActiveWindow && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Apertura: Sáb 14 Nov, 13:00</span>
            <span>Progreso del período: {elapsedPercent}%</span>
            <span>Cierre: Dom 15 Nov, 23:59</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
