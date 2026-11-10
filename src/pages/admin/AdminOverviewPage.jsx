import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  Atom,
  FlaskConical,
  BookOpen,
  Settings,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';
import { adminGetOverviewData, adminSaveSettings } from '../../services/evaluationService';
import { exportToExcel, exportToPDF, formatDateTime } from '../../utils/reportExporter';

const PIE_COLORS = ['#10b981', '#f43f5e', '#6366f1', '#f59e0b'];

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const overview = await adminGetOverviewData();
      setData(overview);
      setSettingsForm(overview.settings);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await adminSaveSettings(settingsForm);
      setSettingsForm(updated);
      await Swal.fire({
        title: 'Parámetros Actualizados',
        text: 'La configuración de tiempo, cantidad de reactivos y límite de intentos se ha guardado.',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
      loadData();
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setSavingSettings(false);
    }
  };

  if (!data) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-slate-400">Cargando estadísticas administrativas...</div>
      </AdminLayout>
    );
  }

  const { participants, results, questions, sections, activeAttempts } = data;
  const fisicaResults = results.filter((r) => r.subject === 'fisica');
  const quimicaResults = results.filter((r) => r.subject === 'quimica');

  const avgFisica = fisicaResults.length
    ? Math.round((fisicaResults.reduce((a, r) => a + r.percentage, 0) / fisicaResults.length) * 10) / 10
    : 0;
  const avgQuimica = quimicaResults.length
    ? Math.round((quimicaResults.reduce((a, r) => a + r.percentage, 0) / quimicaResults.length) * 10) / 10
    : 0;

  const approvedCount = results.filter((r) => r.percentage >= 70).length;
  const failedCount = results.length - approvedCount;

  // Section comparison chart data
  const sectionChartData = sections.map((sec) => {
    const sFis = fisicaResults.filter((r) => r.sectionId === sec.id);
    const sQui = quimicaResults.filter((r) => r.sectionId === sec.id);
    return {
      name: sec.code,
      Física: sFis.length ? Math.round(sFis.reduce((a, r) => a + r.percentage, 0) / sFis.length) : 0,
      Química: sQui.length ? Math.round(sQui.reduce((a, r) => a + r.percentage, 0) / sQui.length) : 0,
      Evaluaciones: sFis.length + sQui.length
    };
  });

  const approvalPieData = [
    { name: 'Aprobados (>=70%)', value: approvedCount },
    { name: 'Reprobados (<70%)', value: failedCount }
  ];

  return (
    <AdminLayout>
      {/* Header & Quick Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Panel de Control • Física y Química (10° Grado)
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitoreo en tiempo real de participantes, intentos, calificaciones confidenciales y banco de reactivos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportToExcel({ results, participants, sections })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => exportToPDF({ results, participants, sections })}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Exportar Acta PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Estudiantes</span>
            <Users className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{participants.length}</div>
          <div className="mt-1 text-xs text-slate-400">En {sections.length} secciones activas</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Evaluaciones</span>
            <Award className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{results.length}</div>
          <div className="mt-1 text-xs text-emerald-400">
            {activeAttempts.length} en curso ahora mismo
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5">
          <div className="flex items-center justify-between text-indigo-300 text-xs font-bold uppercase">
            <span>Promedio Física</span>
            <Atom className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{avgFisica}%</div>
          <div className="mt-1 text-xs text-indigo-300/80">{fisicaResults.length} intentos calificados</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase">
            <span>Promedio Química</span>
            <FlaskConical className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">{avgQuimica}%</div>
          <div className="mt-1 text-xs text-emerald-300/80">{quimicaResults.length} intentos calificados</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Banco Activo</span>
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {questions.filter((q) => q.active !== false).length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Física: {questions.filter((q) => q.subject === 'fisica').length} | Química:{' '}
            {questions.filter((q) => q.subject === 'quimica').length}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-12 mb-8">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <h2 className="text-base font-bold text-white mb-1">
            Rendimiento Promedio (%) por Sección y Asignatura
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Comparativa directa de calificaciones obtenidas en Física y Química en Décimo Grado
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Legend />
                <Bar dataKey="Física" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Química" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <h2 className="text-base font-bold text-white mb-1">
            Índice de Aprobación Global (Criterio &ge; 70%)
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Distribución de intentos aprobados vs. reprobados sobre {results.length} evaluaciones
          </p>
          {results.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Aún no se han registrado intentos finalizados.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {approvalPieData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Recent Evaluations & System Settings */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Últimas Evaluaciones Calificadas</h2>
            <Link
              to="/admin/resultados"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {results.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
              No hay evaluaciones finalizadas todavía. Cuando un estudiante complete un intento, aparecerá aquí con su calificación.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase">
                    <th className="pb-2.5">Estudiante</th>
                    <th className="pb-2.5">Sección</th>
                    <th className="pb-2.5">Asignatura</th>
                    <th className="pb-2.5">Intento</th>
                    <th className="pb-2.5">Nota</th>
                    <th className="pb-2.5">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {results.slice(0, 6).map((r) => (
                    <tr key={r.attemptId} className="hover:bg-slate-800/40">
                      <td className="py-3 font-semibold text-white">{r.fullName}</td>
                      <td className="py-3 text-slate-300">{r.sectionCode || r.sectionName}</td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 font-bold ${
                            r.subject === 'fisica'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {r.subject === 'fisica' ? 'Física' : 'Química'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">#{r.attemptNumber}/3</td>
                      <td className="py-3">
                        <span
                          className={`font-extrabold ${
                            r.percentage >= 70 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {r.percentage}% ({r.score}/{r.maxScore})
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{formatDateTime(r.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exam Configuration Form */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Parámetros Oficiales de Evaluación</h2>
          </div>

          {settingsForm && (
            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Duración Física (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={settingsForm.fisicaDurationMinutes}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, fisicaDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Duración Química (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={settingsForm.quimicaDurationMinutes}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, quimicaDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Preguntas por Intento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={settingsForm.questionsPerAttempt}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, questionsPerAttempt: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Límite de Intentos / Asignatura
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settingsForm.maxAttemptsPerSubject}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, maxAttemptsPerSubject: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full rounded-xl bg-indigo-600 py-2.5 px-4 font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
              >
                {savingSettings ? 'Guardando...' : 'Guardar Configuración de Evaluaciones'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
