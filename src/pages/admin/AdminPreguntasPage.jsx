import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  DatabaseBackup,
  CheckCircle2,
  XCircle,
  Atom,
  FlaskConical,
  X
} from 'lucide-react';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetOverviewData,
  adminSaveQuestion,
  adminDeleteQuestion,
  adminRestoreInitialQuestions
} from '../../services/evaluationService';

const EMPTY_QUESTION = {
  id: '',
  subject: 'fisica',
  topic: '',
  difficulty: 'Intermedio',
  prompt: '',
  points: 10,
  correctOptionId: 'a',
  active: true,
  explanation: '',
  options: [
    { id: 'a', text: '' },
    { id: 'b', text: '' },
    { id: 'c', text: '' },
    { id: 'd', text: '' }
  ]
};

export default function AdminPreguntasPage() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_QUESTION);

  const loadQuestions = useCallback(async () => {
    try {
      const overview = await adminGetOverviewData();
      setQuestions(overview.questions || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleOpenNew = (subject = 'fisica') => {
    setForm({
      ...EMPTY_QUESTION,
      subject,
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ]
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setForm({
      ...q,
      options: (q.options || []).map((o) => ({ ...o }))
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await adminSaveQuestion(form);
      setModalOpen(false);
      await loadQuestions();
      Swal.fire({
        title: 'Reactivo Guardado',
        text: 'El banco de preguntas ha sido actualizado.',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (err) {
      Swal.fire({
        title: 'Validación',
        text: err.message,
        icon: 'warning',
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  const handleDelete = async (q) => {
    const res = await Swal.fire({
      title: '¿Eliminar pregunta del banco?',
      text: q.prompt,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      await adminDeleteQuestion(q.id);
      await loadQuestions();
    }
  };

  const handleRestoreInitial = async () => {
    const res = await Swal.fire({
      title: '¿Sincronizar / Restaurar Banco Oficial?',
      text: 'Se asegurará que las 40 preguntas oficiales de Física y Química de Décimo Grado estén activas sin borrar las preguntas personalizadas que haya agregado.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sincronizar 40 preguntas base',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      await adminRestoreInitialQuestions();
      await loadQuestions();
      Swal.fire({
        title: 'Banco Oficial Sincronizado',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  const filtered = questions.filter((q) => {
    const matchesSearch =
      !search ||
      q.prompt.toLowerCase().includes(search.toLowerCase()) ||
      (q.topic || '').toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesSubject && matchesDiff;
  });

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Banco de Preguntas (Física y Química)</h1>
          <p className="mt-1 text-sm text-slate-400">
            Las respuestas correctas se resguardan en el servidor y nunca son expuestas durante la evaluación estudiantil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRestoreInitial}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <DatabaseBackup className="h-4 w-4 text-sky-400" />
            <span>Sincronizar Banco Oficial (40)</span>
          </button>
          <button
            onClick={() => handleOpenNew('fisica')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Pregunta Física</span>
          </button>
          <button
            onClick={() => handleOpenNew('quimica')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-emerald-500 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Pregunta Química</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por enunciado o tema curricular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2 text-sm text-white"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white"
        >
          <option value="all">Todas las asignaturas ({questions.length})</option>
          <option value="fisica">
            Física ({questions.filter((q) => q.subject === 'fisica').length})
          </option>
          <option value="quimica">
            Química ({questions.filter((q) => q.subject === 'quimica').length})
          </option>
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white"
        >
          <option value="all">Todas las dificultades</option>
          <option value="Básico">Básico</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
        </select>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    q.subject === 'fisica'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {q.subject === 'fisica' ? <Atom className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
                  {q.subject === 'fisica' ? 'Física' : 'Química'}
                </span>
                <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {q.topic}
                </span>
                <span className="rounded-lg border border-slate-700 px-2 py-0.5 text-xs text-slate-400">
                  {q.difficulty} • {q.points} pts
                </span>
                {q.active !== false ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Activa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold">
                    <XCircle className="h-3.5 w-3.5" /> Inactiva
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(q)}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm sm:text-base font-bold text-white">{q.prompt}</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(q.options || []).map((opt) => {
                const isCorrect = opt.id === q.correctOptionId;
                return (
                  <div
                    key={opt.id}
                    className={`rounded-xl border px-3 py-2 text-xs flex items-center justify-between ${
                      isCorrect
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    <span>
                      <strong className="uppercase mr-1.5">{opt.id})</strong>
                      {opt.text}
                    </span>
                    {isCorrect && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 shrink-0 ml-2">
                        Correcta
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {q.explanation && (
              <p className="mt-2.5 text-xs text-slate-400">
                <strong className="text-slate-300">Explicación docente:</strong> {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white">
                {form.id ? 'Editar Pregunta' : 'Crear Nueva Pregunta para Décimo Grado'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Asignatura *</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="fisica">Física</option>
                    <option value="quimica">Química</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Dificultad *</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Puntaje *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.points}
                    onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Tema Curricular *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cinemática - MRUA o Enlace Químico"
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Enunciado de la Pregunta *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escriba el planteamiento claro de la pregunta..."
                  value={form.prompt}
                  onChange={(e) => setForm({ ...form, prompt: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                  Opciones de Respuesta (Marque el radio de la opción correcta) *
                </label>
                <div className="space-y-2.5">
                  {form.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={form.correctOptionId === opt.id}
                        onChange={() => setForm({ ...form, correctOptionId: opt.id })}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      <span className="font-mono text-xs font-bold uppercase text-slate-400 w-5">{opt.id})</span>
                      <input
                        type="text"
                        required
                        placeholder={`Texto de la opción ${opt.id.toUpperCase()}...`}
                        value={opt.text}
                        onChange={(e) => {
                          const nextOpts = [...form.options];
                          nextOpts[idx] = { ...opt, text: e.target.value };
                          setForm({ ...form, options: nextOpts });
                        }}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Explicación Pedagógica / Solución (Sólo visible para Admin)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Por la Segunda Ley de Newton F = m * a..."
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={form.active !== false}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <span>Pregunta activa para ser seleccionada aleatoriamente en evaluaciones</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white"
                >
                  Guardar Pregunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

