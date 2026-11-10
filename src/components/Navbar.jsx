import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Atom, FlaskConical, ShieldCheck, UserCheck, LogOut, ClipboardCheck, Home } from 'lucide-react';
import { getSavedStudentSession, clearStudentSession, getAdminSession } from '../services/evaluationService';
import Swal from 'sweetalert2';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const studentSession = getSavedStudentSession();
  const adminSession = getAdminSession();

  // Hide global navbar inside active evaluation screen to prevent accidental navigation distractions
  if (location.pathname.startsWith('/evaluacion/')) {
    return null;
  }

  const handleStudentLogout = async () => {
    const res = await Swal.fire({
      title: '¿Cerrar sesión estudiantil?',
      text: 'Podrá volver a ingresar en cualquier momento con su número de documento.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#f8fafc'
    });
    if (res.isConfirmed) {
      clearStudentSession();
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-emerald-500 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Atom className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-white">EvalCiencias</span>
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                10° Grado
              </span>
            </div>
            <p className="text-xs text-slate-400">Sistema Oficial de Evaluaciones de Física y Química</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>

          {studentSession ? (
            <div className="flex items-center gap-2">
              <Link
                to="/estudiante"
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                  location.pathname === '/estudiante'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{studentSession.fullName}</span>
                <span className="hidden md:inline rounded bg-indigo-950/80 px-1.5 py-0.5 text-xs text-indigo-200">
                  {studentSession.sectionCode || '10°'}
                </span>
              </Link>
              <button
                onClick={handleStudentLogout}
                title="Cambiar de estudiante"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:border-rose-500/50 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/registro"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                location.pathname === '/registro'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-indigo-600/90 text-white hover:bg-indigo-500'
              }`}
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>Portal Estudiantil</span>
            </Link>
          )}

          <Link
            to="/admin"
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all ${
              location.pathname.startsWith('/admin')
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-700 bg-slate-900/90 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">{adminSession ? 'Panel Admin' : 'Acceso Docente'}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
