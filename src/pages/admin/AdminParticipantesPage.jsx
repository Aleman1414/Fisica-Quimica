import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  Trash2,
  Plus,
  Edit3,
  CheckCircle2,
  XCircle,
  Layers
} from 'lucide-react';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetOverviewData,
  adminResetParticipantAttempts,
  adminDeleteParticipant,
  adminSaveSection,
  adminDeleteSection
} from '../../services/evaluationService';
import { formatDateTime } from '../../utils/reportExporter';

export default function AdminParticipantesPage() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  // Section Modal State
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState({
    id: '',
    code: '',
    name: '',
    active: true
  });

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

  const handleResetAttempts = async (participant, subject) => {
    const label = subject === 'all' ? 'Física y Química' : subject === 'fisica' ? 'Física' : 'Química';
    const res = await Swal.fire({
      title: `¿Reiniciar intentos de ${label}?`,
      text: `El estudiante ${participant.fullName} volverá a tener 3 intentos disponibles en ${label}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, reiniciar intentos',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      await adminResetParticipantAttempts(participant.id, subject);
      await loadData();
      Swal.fire({
        title: 'Intentos reiniciados',
        icon: 'success',
        timer: 1300,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  const handleDeleteParticipant = async (participant) => {
    const res = await Swal.fire({
      title: '¿Eliminar registro del participante?',
      text: `Se eliminará a ${participant.fullName} (${participant.documento}).`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Eliminar participante',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      await adminDeleteParticipant(participant.id);
      await loadData();
    }
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      await adminSaveSection(editingSection);
      setSectionModalOpen(false);
      await loadData();
      Swal.fire({
        title: 'Sección Guardada',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  const handleDeleteSection = async (sec) => {
    const res = await Swal.fire({
      title: `¿Eliminar sección ${sec.code}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      await adminDeleteSection(sec.id);
      await loadData();
    }
  };

  if (!data) {
    return (
      <AdminLayout>
        <div className="py-12 text-center text-slate-400">Cargando participantes y secciones...</div>
      </AdminLayout>
    );
  }

  const { participants, sections, results } = data;

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      !search ||
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.documento.toLowerCase().includes(search.toLowerCase());
    const matchesSection = sectionFilter === 'all' || p.sectionId === sectionFilter;
    return matchesSearch && matchesSection;
  });

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Gestión de Participantes y Secciones</h1>
          <p className="mt-1 text-sm text-slate-400">
            Control de identidad, intentos disponibles por asignatura y administración de secciones de Décimo Grado.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSection({ id: '', code: '', name: '', active: true });
            setSectionModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Sección de 10° Grado</span>
        </button>
      </div>

      {/* Sections Management Strip */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Secciones Oficiales de Décimo Grado ({sections.length})
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((sec) => {
            const count = participants.filter((p) => p.sectionId === sec.id).length;
            return (
              <div
                key={sec.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-indigo-300">{sec.code}</span>
                    {sec.active !== false ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="text-xs text-slate-300 truncate max-w-[160px]">{sec.name}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{count} estudiantes inscritos</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingSection(sec);
                      setSectionModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                    title="Editar sección"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSection(sec)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 cursor-pointer"
                    title="Eliminar sección"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento / carnet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="all">Todas las secciones ({participants.length})</option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.code} — {sec.name}
            </option>
          ))}
        </select>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase text-slate-400">
                <th className="px-4 py-3.5">Documento</th>
                <th className="px-4 py-3.5">Estudiante</th>
                <th className="px-4 py-3.5">Sección</th>
                <th className="px-4 py-3.5">Física (Intentos / Mejor Nota)</th>
                <th className="px-4 py-3.5">Química (Intentos / Mejor Nota)</th>
                <th className="px-4 py-3.5">Registro</th>
                <th className="px-4 py-3.5 text-right">Acciones Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No se encontraron participantes con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const pFis = results.filter((r) => r.participantId === p.id && r.subject === 'fisica');
                  const pQui = results.filter((r) => r.participantId === p.id && r.subject === 'quimica');
                  const bestFis = pFis.length ? Math.max(...pFis.map((r) => r.percentage)) : null;
                  const bestQui = pQui.length ? Math.max(...pQui.map((r) => r.percentage)) : null;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-indigo-300">{p.documento}</td>
                      <td className="px-4 py-3.5 font-semibold text-white">{p.fullName}</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">
                          {p.sectionCode || p.sectionName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.attemptsCount?.fisica || 0}/3</span>
                          {bestFis !== null && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                                bestFis >= 70
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              Máx: {bestFis}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.attemptsCount?.quimica || 0}/3</span>
                          {bestQui !== null && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                                bestQui >= 70
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              Máx: {bestQui}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{formatDateTime(p.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleResetAttempts(p, 'all')}
                            title="Reiniciar contador de intentos"
                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reiniciar Intentos</span>
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p)}
                            title="Eliminar participante"
                            className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section Create/Edit Modal */}
      {sectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">
              {editingSection.id ? 'Editar Sección' : 'Crear Nueva Sección de Décimo Grado'}
            </h3>
            <form onSubmit={handleSaveSection} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Código de Sección *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 10-E"
                  value={editingSection.code}
                  onChange={(e) => setEditingSection({ ...editingSection, code: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Nombre Descriptivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Décimo Grado - Sección E"
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={editingSection.active !== false}
                  onChange={(e) => setEditingSection({ ...editingSection, active: e.target.checked })}
                />
                <span>Sección activa para registro estudiantil</span>
              </label>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white"
                >
                  Guardar Sección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
