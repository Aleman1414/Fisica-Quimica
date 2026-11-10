import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { adminGetOverviewData } from '../../services/evaluationService';
import { exportToExcel, exportToPDF, formatDateTime, formatSeconds } from '../../utils/reportExporter';

export default function AdminResultadosPage() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [attemptFilter, setAttemptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState(null);

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
        <div className="py-12 text-center text-slate-400">Cargando resultados de evaluaciones...</div>
      </AdminLayout>
    );
  }

  const { results, participants, sections } = data;

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      !search ||
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.documento.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || r.subject === subjectFilter;
    const matchesSection = sectionFilter === 'all' || r.sectionId === sectionFilter;
    const matchesAttempt = attemptFilter === 'all' || String(r.attemptNumber) === attemptFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && r.percentage >= 70) ||
      (statusFilter === 'failed' && r.percentage < 70);
    return matchesSearch && matchesSubject && matchesSection && matchesAttempt && matchesStatus;
  });

  const filterSummary = `Asignatura: ${subjectFilter} | Sección: ${sectionFilter} | Intento: ${attemptFilter}`;

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Calificaciones y Auditoría de Resultados</h1>
          <p className="mt-1 text-sm text-slate-400">
            Consulta exclusiva para administradores: puntajes, tiempos empleados y desglose pregunta por pregunta.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportToExcel({ results: filteredResults, participants, sections, filterSummary })}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Exportar Selección Excel</span>
          </button>
          <button
            onClick={() => exportToPDF({ results: filteredResults, participants, sections, filterSummary })}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-500 cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            <span>Exportar Selección PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Estudiante o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-3 py-2 text-sm text-white"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todas las asignaturas</option>
          <option value="fisica">Física</option>
          <option value="quimica">Química</option>
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todas las secciones</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.code} — {sec.name}
            </option>
          ))}
        </select>

        <select
          value={attemptFilter}
          onChange={(e) => setAttemptFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todos los intentos (1, 2, 3)</option>
          <option value="1">Intento #1</option>
          <option value="2">Intento #2</option>
          <option value="3">Intento #3</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todos los estados</option>
          <option value="approved">Aprobados (&ge; 70%)</option>
          <option value="failed">Reprobados (&lt; 70%)</option>
        </select>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase text-slate-400">
                <th className="px-4 py-3.5">Documento</th>
                <th className="px-4 py-3.5">Estudiante</th>
                <th className="px-4 py-3.5">Sección</th>
                <th className="px-4 py-3.5">Asignatura</th>
                <th className="px-4 py-3.5">Intento</th>
                <th className="px-4 py-3.5">Puntaje</th>
                <th className="px-4 py-3.5">Porcentaje</th>
                <th className="px-4 py-3.5">Aciertos</th>
                <th className="px-4 py-3.5">Tiempo</th>
                <th className="px-4 py-3.5">Fecha</th>
                <th className="px-4 py-3.5 text-right">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                    No existen resultados de evaluaciones para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r) => (
                  <tr key={r.attemptId} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-mono text-xs text-indigo-300">{r.documento}</td>
                    <td className="px-4 py-3.5 font-semibold text-white">{r.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-300">{r.sectionCode || r.sectionName}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${
                          r.subject === 'fisica'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {r.subject === 'fisica' ? 'Física' : 'Química'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-300">#{r.attemptNumber}/3</td>
                    <td className="px-4 py-3.5 font-bold text-white">
                      {r.score} / {r.maxScore}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-extrabold ${
                          r.percentage >= 70
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      {r.correctCount} / {r.totalQuestions}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                      {formatSeconds(r.timeSpentSeconds)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{formatDateTime(r.completedAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedResult(r)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 px-2.5 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-600/30 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Desglose</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question-by-Question Breakdown Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase text-indigo-400">
                  Auditoría Detallada de Evaluación • Intento #{selectedResult.attemptNumber}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {selectedResult.fullName} ({selectedResult.documento})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Asignatura: {selectedResult.subject === 'fisica' ? 'Física' : 'Química'} | Calificación:{' '}
                  <strong className="text-emerald-400">
                    {selectedResult.percentage}% ({selectedResult.score}/{selectedResult.maxScore} pts)
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {(selectedResult.answersBreakdown || []).map((item, idx) => (
                <div
                  key={item.questionId || idx}
                  className={`rounded-xl border p-4 text-xs ${
                    item.isCorrect
                      ? 'border-emerald-500/30 bg-emerald-950/20'
                      : 'border-rose-500/30 bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm">
                      {idx + 1}. {item.prompt}
                    </span>
                    <span className="shrink-0 font-bold">
                      {item.isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" /> +{item.pointsEarned} pts
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400">
                          <XCircle className="h-4 w-4" /> 0 pts
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-slate-300">
                    <div>
                      <span className="text-slate-400">Respuesta del estudiante: </span>
                      <strong className={item.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
                        {item.chosenOptionText}
                      </strong>
                    </div>
                    {!item.isCorrect && (
                      <div>
                        <span className="text-slate-400">Respuesta correcta oficial: </span>
                        <strong className="text-emerald-300">{item.correctOptionText}</strong>
                      </div>
                    )}
                    {item.explanation && (
                      <div className="mt-1 text-slate-400 italic">Fundamento: {item.explanation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
