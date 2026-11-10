import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileText,
  BarChart3,
  TrendingUp
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
  LineChart,
  Line
} from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import { adminGetOverviewData } from '../../services/evaluationService';
import { exportToExcel, exportToPDF } from '../../utils/reportExporter';

export default function AdminReportesPage() {
  const [data, setData] = useState(null);
  const [sectionFilter, setSectionFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      const overview = await adminGetOverviewData();
      setData(overview);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!data) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-slate-400">Generando modelos analíticos y reportes...</div>
      </AdminLayout>
    );
  }

  const { results, participants, sections } = data;

  const filteredResults = results.filter((r) => {
    const matchSec = sectionFilter === 'all' || r.sectionId === sectionFilter;
    const matchSub = subjectFilter === 'all' || r.subject === subjectFilter;
    return matchSec && matchSub;
  });

  // 1. Progress by Attempt Number (Attempt 1 vs 2 vs 3)
  const attemptProgressionData = [1, 2, 3].map((attNum) => {
    const fis = filteredResults.filter((r) => r.subject === 'fisica' && r.attemptNumber === attNum);
    const qui = filteredResults.filter((r) => r.subject === 'quimica' && r.attemptNumber === attNum);
    return {
      intento: `Intento #${attNum}`,
      Física: fis.length ? Math.round(fis.reduce((a, r) => a + r.percentage, 0) / fis.length) : 0,
      Química: qui.length ? Math.round(qui.reduce((a, r) => a + r.percentage, 0) / qui.length) : 0,
      Evaluaciones: fis.length + qui.length
    };
  });

  // 2. Accuracy by Curricular Topic
  const topicStatsMap = {};
  filteredResults.forEach((r) => {
    (r.answersBreakdown || []).forEach((ans) => {
      const key = ans.topic || 'General';
      if (!topicStatsMap[key]) {
        topicStatsMap[key] = { topic: key, total: 0, correct: 0 };
      }
      topicStatsMap[key].total += 1;
      if (ans.isCorrect) topicStatsMap[key].correct += 1;
    });
  });

  const topicChartData = Object.values(topicStatsMap)
    .map((t) => ({
      tema: t.topic.length > 22 ? t.topic.slice(0, 22) + '…' : t.topic,
      Efectividad: t.total ? Math.round((t.correct / t.total) * 100) : 0,
      Respuestas: t.total
    }))
    .slice(0, 10);

  const filterSummary = `Sección: ${sectionFilter === 'all' ? 'Todas' : sectionFilter} | Asignatura: ${
    subjectFilter === 'all' ? 'Física y Química' : subjectFilter
  }`;

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Analítica Académica y Exportación de Reportes</h1>
          <p className="mt-1 text-sm text-slate-400">
            Generación de libros Excel (.xlsx) multipestaña y actas oficiales en PDF (.pdf) a partir de datos reales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-white"
          >
            <option value="all">Todas las secciones</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-white"
          >
            <option value="all">Física y Química</option>
            <option value="fisica">Solo Física</option>
            <option value="quimica">Solo Química</option>
          </select>

          <button
            onClick={() => exportToExcel({ results: filteredResults, participants, sections, filterSummary })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Descargar Reporte Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => exportToPDF({ results: filteredResults, participants, sections, filterSummary })}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Descargar Acta PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Evolución de Promedios por Número de Intento</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Progresión del rendimiento académico entre el 1°, 2° y 3° intento permitido
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attemptProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="intento" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Física" stroke="#6366f1" strokeWidth={3} />
                <Line type="monotone" dataKey="Química" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Porcentaje de Dominio por Tema Curricular</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Efectividad de respuestas correctas desglosada por unidad temática
          </p>
          {topicChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-slate-500">
              Complete al menos una evaluación para visualizar el dominio por tema curricular.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="tema" type="category" width={150} stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  />
                  <Bar dataKey="Efectividad" fill="#38bdf8" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Section Summary Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
        <h2 className="text-base font-bold text-white mb-4">Cuadro Resumen Oficial por Sección (Décimo Grado)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold uppercase text-slate-400">
                <th className="py-3">Código</th>
                <th className="py-3">Nombre de Sección</th>
                <th className="py-3">Inscritos</th>
                <th className="py-3">Intentos Física</th>
                <th className="py-3">Promedio Física</th>
                <th className="py-3">Intentos Química</th>
                <th className="py-3">Promedio Química</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sections.map((sec) => {
                const secPart = participants.filter((p) => p.sectionId === sec.id);
                const secFis = results.filter((r) => r.sectionId === sec.id && r.subject === 'fisica');
                const secQui = results.filter((r) => r.sectionId === sec.id && r.subject === 'quimica');
                const avgFis = secFis.length
                  ? Math.round((secFis.reduce((a, r) => a + r.percentage, 0) / secFis.length) * 10) / 10
                  : 0;
                const avgQui = secQui.length
                  ? Math.round((secQui.reduce((a, r) => a + r.percentage, 0) / secQui.length) * 10) / 10
                  : 0;

                return (
                  <tr key={sec.id}>
                    <td className="py-3.5 font-mono font-bold text-indigo-300">{sec.code}</td>
                    <td className="py-3.5 font-semibold text-white">{sec.name}</td>
                    <td className="py-3.5 text-slate-300">{secPart.length} estudiantes</td>
                    <td className="py-3.5 text-slate-300">{secFis.length}</td>
                    <td className="py-3.5 font-bold text-indigo-300">{avgFis}%</td>
                    <td className="py-3.5 text-slate-300">{secQui.length}</td>
                    <td className="py-3.5 font-bold text-emerald-300">{avgQui}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
