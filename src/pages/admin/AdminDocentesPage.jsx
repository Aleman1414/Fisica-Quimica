import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  UserCog,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Trash2,
  KeyRound,
  GraduationCap,
  Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import AdminLayout from '../../components/AdminLayout';
import {
  adminGetTeachers,
  registerTeacherAccount,
  adminToggleTeacherStatus,
  adminDeleteTeacher,
  getExamSettings,
  adminSaveSettings,
  getAdminSession
} from '../../services/evaluationService';
import { formatDateTime } from '../../utils/reportExporter';

export default function AdminDocentesPage() {
  const [teachers, setTeachers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    specialty: 'Física y Química',
    password: ''
  });

  const currentAdmin = getAdminSession();

  const loadTeachersAndSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [list, cfg] = await Promise.all([adminGetTeachers(), getExamSettings()]);
      setTeachers(list);
      setSettings(cfg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeachersAndSettings();
  }, [loadTeachersAndSettings]);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      await registerTeacherAccount({
        ...newTeacher,
        autoLogin: false
      });
      setModalOpen(false);
      setNewTeacher({ name: '', email: '', specialty: 'Física y Química', password: '' });
      await loadTeachersAndSettings();
      await Swal.fire({
        title: 'Docente Registrado',
        text: 'El nuevo acceso docente ha sido creado en Firebase y habilitado inmediatamente.',
        icon: 'success',
        timer: 1600,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (err) {
      await Swal.fire({
        title: 'No se pudo registrar',
        text: err.message,
        icon: 'error',
        background: '#0f172a',
        color: '#f8fafc'
      });
    }
  };

  const handleToggleActive = async (teacher) => {
    const nextState = teacher.active === false;
    await adminToggleTeacherStatus(teacher.uid || teacher.id, nextState);
    await loadTeachersAndSettings();
  };

  const handleDelete = async (teacher) => {
    const res = await Swal.fire({
      title: `¿Revocar y eliminar acceso de ${teacher.name}?`,
      text: `El correo ${teacher.email} ya no podrá acceder al panel administrativo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, eliminar acceso',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      try {
        await adminDeleteTeacher(teacher.uid || teacher.id);
        await loadTeachersAndSettings();
      } catch (err) {
        Swal.fire({
          title: 'Acción no permitida',
          text: err.message,
          icon: 'warning',
          background: '#0f172a',
          color: '#f8fafc'
        });
      }
    }
  };

  const handleSaveRegCode = async (e) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const updated = await adminSaveSettings(settings);
      setSettings(updated);
      Swal.fire({
        title: 'Código de Registro Docente Actualizado',
        text: `Nuevo código institucional: ${updated.teacherRegistrationCode}`,
        icon: 'success',
        timer: 1500,
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

  const filteredTeachers = teachers.filter(
    (t) =>
      !search ||
      (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.specialty || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Gestión de Accesos Docentes</h1>
          <p className="mt-1 text-sm text-slate-400">
            Registre nuevos profesores de Física y Química, administre permisos y configure el código institucional de alta docente.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Registrar Nuevo Docente</span>
        </button>
      </div>

      {/* Institutional Teacher Registration Code Card */}
      {settings && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5">
          <form onSubmit={handleSaveRegCode} className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                <KeyRound className="h-4 w-4" />
                <span>Código Institucional para Autoregistro de Docentes</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Los profesores también pueden crear su propia cuenta desde la pestaña <strong>"Registrar Nuevo Docente"</strong> en la pantalla de inicio de sesión ingresando este código de seguridad.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                required
                value={settings.teacherRegistrationCode || 'DOCENTE-2026'}
                onChange={(e) =>
                  setSettings({ ...settings, teacherRegistrationCode: e.target.value.toUpperCase() })
                }
                className="rounded-xl border border-emerald-500/40 bg-slate-950 px-3.5 py-2 font-mono text-sm font-bold text-emerald-300"
              />
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
              >
                Actualizar Código
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-5 relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar docente por nombre, correo o especialidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500"
        />
      </div>

      {/* Teachers Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-bold uppercase text-slate-400">
                <th className="px-4 py-3.5">Nombre del Docente</th>
                <th className="px-4 py-3.5">Correo Institucional</th>
                <th className="px-4 py-3.5">Cátedra / Especialidad</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Fecha de Registro</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Cargando directorio de docentes...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron docentes con ese criterio.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelf = currentAdmin && (currentAdmin.uid === t.uid || currentAdmin.email === t.email);
                  return (
                    <tr key={t.uid || t.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{t.name || 'Docente Evaluador'}</span>
                          {isSelf && (
                            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                              Sesión actual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-300">{t.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200">
                          <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                          {t.specialty || 'Física y Química'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {t.active !== false ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-300">
                            <XCircle className="h-3.5 w-3.5" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400">{formatDateTime(t.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {!isSelf && (
                            <>
                              <button
                                onClick={() => handleToggleActive(t)}
                                className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
                              >
                                {t.active !== false ? 'Desactivar' : 'Activar'}
                              </button>
                              <button
                                onClick={() => handleDelete(t)}
                                className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                                title="Eliminar acceso docente"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
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

      {/* Modal to Register a New Teacher directly from Admin Panel */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">Registrar Nuevo Acceso Docente</h3>
            <p className="mt-1 text-xs text-slate-400">
              Cree una cuenta administrativa para otro profesor de Física o Química sin cerrar su sesión actual.
            </p>

            <form onSubmit={handleCreateTeacher} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Nombre y Apellido del Docente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MSc. Claudia Patricia Reyes"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Correo Institucional *
                </label>
                <input
                  type="email"
                  required
                  placeholder="claudia.reyes@institucion.edu.hn"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Especialidad / Cátedra *
                </label>
                <select
                  value={newTeacher.specialty}
                  onChange={(e) => setNewTeacher({ ...newTeacher, specialty: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white"
                >
                  <option value="Física y Química">Física y Química</option>
                  <option value="Física">Física</option>
                  <option value="Química">Química</option>
                  <option value="Coordinación Académica">Coordinación Académica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  Contraseña Temporal / Inicial (mín. 6 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={newTeacher.password}
                  onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white"
                />
              </div>

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
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  Crear Acceso Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
