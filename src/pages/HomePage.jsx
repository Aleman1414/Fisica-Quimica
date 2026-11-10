import React from 'react';
import { Link } from 'react-router-dom';
import {
  Atom,
  FlaskConical,
  ShieldCheck,
  Clock,
  Shuffle,
  Lock,
  RotateCcw,
  Award,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  FileBarChart2
} from 'lucide-react';
import { getSavedStudentSession } from '../services/evaluationService';

export default function HomePage() {
  const studentSession = getSavedStudentSession();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
              <Award className="h-4 w-4 text-indigo-400" />
              Plataforma Académica Oficial • Décimo Grado
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sistema de Evaluaciones de{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Física y Química
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Entorno seguro de evaluación diagnóstica y sumativa para estudiantes de Décimo Grado.
              Generación aleatoria de reactivos, control estricto de tres intentos por asignatura,
              recuperación automática de sesiones interrumpidas y resguardo confidencial de calificaciones.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {studentSession ? (
                <Link
                  to="/estudiante"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                >
                  <span>Ir a Mi Panel de Evaluaciones ({studentSession.fullName.split(' ')[0]})</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  to="/registro"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 text-base font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Registro e Ingreso de Estudiantes</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}

              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-6 py-4 text-base font-semibold text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 transition-all"
              >
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Panel Administrativo Docente</span>
              </Link>
            </div>
          </div>

          {/* Subject Highlight Cards */}
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-slate-900/95 to-indigo-950/30 p-7 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                    <Atom className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Asignatura 01</span>
                    <h2 className="text-2xl font-bold text-white">Física • Décimo Grado</h2>
                  </div>
                </div>
                <span className="rounded-lg bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                  Máx. 3 Intentos
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Evalúa competencias en magnitudes del Sistema Internacional, conversión de unidades, análisis vectorial,
                cinemática (MRU, MRUA, caída libre), leyes de Newton, trabajo, potencia, conservación de la energía mecánica y termodinámica.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>10 preguntas por intento</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span>25 minutos con autoguardado</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-900/95 to-emerald-950/30 p-7 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <FlaskConical className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Asignatura 02</span>
                    <h2 className="text-2xl font-bold text-white">Química • Décimo Grado</h2>
                  </div>
                </div>
                <span className="rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                  Máx. 3 Intentos
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Evalúa competencias en propiedades de la materia, estructura atómica, isótopos, configuración electrónica,
                tabla periódica, enlaces químicos, nomenclatura inorgánica, balanceo de ecuaciones, estequiometría, gases ideales y pH.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>10 preguntas por intento</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2 border border-slate-800">
                  <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>25 minutos con autoguardado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Operational Rules */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Normativa y Seguridad de Evaluación</h2>
            <p className="mt-2 text-sm text-slate-400">
              Arquitectura respaldada por Firebase Authentication, Cloud Firestore y Cloud Functions
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <Shuffle className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-base font-bold text-white">Reactivos y Opciones Aleatorias</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Cada intento selecciona aleatoriamente preguntas del banco oficial y baraja el orden de las opciones de respuesta.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <RotateCcw className="h-8 w-8 text-sky-400 mb-4" />
              <h3 className="text-base font-bold text-white">Recuperación de Sesión</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Si ocurre un corte de conexión o cierre accidental del navegador, las respuestas marcadas y el temporizador se recuperan automáticamente.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <Lock className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-base font-bold text-white">Ocultamiento de Respuestas</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Las respuestas correctas nunca se envían al navegador del estudiante. La calificación se procesa de forma confidencial para el docente.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <FileBarChart2 className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-base font-bold text-white">Control de 3 Intentos</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Cada participante dispone de un máximo estricto de 3 intentos en Física y 3 intentos en Química, auditados transaccionalmente.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
