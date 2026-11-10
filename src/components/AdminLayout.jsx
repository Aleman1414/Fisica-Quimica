import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Award,
  BookOpen,
  FileBarChart2,
  LogOut,
  Lock,
  Mail,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import { getAdminSession, loginAdmin, logoutAdmin } from '../services/evaluationService';

const ADMIN_NAV = [
  { to: '/admin', label: 'Resumen General', icon: LayoutDashboard, exact: true },
  { to: '/admin/participantes', label: 'Participantes y Secciones', icon: Users },
  { to: '/admin/resultados', label: 'Calificaciones y Resultados', icon: Award },
  { to: '/admin/preguntas', label: 'Banco de Preguntas', icon: BookOpen },
  { to: '/admin/reportes', label: 'Estadísticas y Reportes', icon: FileBarChart2 }
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(() => getAdminSession());
  const [email, setEmail] = useState('admin@ciencias10.edu.hn');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await loginAdmin({ email, password });
      setAdmin(session);
      await Swal.fire({
        title: 'Acceso Administrativo Concedido',
        text: `Bienvenido(a), ${session.name}`,
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (err) {
      await Swal.fire({
        title: 'Acceso Denegado',
        text: err.message || 'Credenciales inválidas.',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setAdmin(null);
    navigate('/');
  };

  // Protected Gate: Require valid admin session
  if (!admin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-white">Panel Administrativo Docente</h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Acceso exclusivo para docentes y coordinadores autorizados de Física y Química (Décimo Grado).
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Institucional *
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ciencias10.edu.hn"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña de Administrador *
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la clave administrativa"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>Credencial institucional inicial:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@ciencias10.edu.hn');
                    setPassword('AdminCiencias2026!');
                  }}
                  className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                >
                  Autocompletar Demo Docente
                </button>
              </div>
              <div className="mt-1 font-mono text-[11px] text-slate-300">
                Usuario: admin@ciencias10.edu.hn | Clave: AdminCiencias2026!
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>{loading ? 'Verificando rol administrativo...' : 'Ingresar al Panel Administrativo'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      {/* Sub-navigation bar for Admin modules */}
      <div className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-slate-400">
              Rol verificado: <strong className="text-emerald-400">{admin.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
