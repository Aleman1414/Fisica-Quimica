import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Award,
  BookOpen,
  FileBarChart2,
  UserCog,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  Mail,
  KeyRound,
  User,
  GraduationCap,
  Shield,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  getAdminSession,
  loginAdmin,
  registerTeacherAccount,
  logoutAdmin,
  DEFAULT_TEACHER_REGISTRATION_CODE
} from '../services/evaluationService';

const ADMIN_NAV = [
  { to: '/admin', label: 'Resumen General', icon: LayoutDashboard, exact: true },
  { to: '/admin/participantes', label: 'Participantes y Secciones', icon: Users },
  { to: '/admin/resultados', label: 'Calificaciones y Resultados', icon: Award },
  { to: '/admin/preguntas', label: 'Banco de Preguntas', icon: BookOpen },
  { to: '/admin/reportes', label: 'Estadísticas y Reportes', icon: FileBarChart2 },
  { to: '/admin/docentes', label: 'Accesos Docentes', icon: UserCog }
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(() => getAdminSession());
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // New Teacher Registration State
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    specialty: 'Física y Química',
    password: '',
    confirmPassword: '',
    registrationCode: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const session = await loginAdmin({ email, password });
      setAdmin(session);
      await Swal.fire({
        title: 'Acceso Docente Concedido',
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

  const handleRegisterTeacher = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      await Swal.fire({
        title: 'Contraseñas no coinciden',
        text: 'Verifique que ambas contraseñas sean idénticas.',
        icon: 'warning',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc'
      });
      return;
    }

    setLoading(true);
    try {
      const session = await registerTeacherAccount({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        specialty: regForm.specialty,
        registrationCode: regForm.registrationCode,
        autoLogin: true
      });
      setAdmin(session);
      await Swal.fire({
        title: '¡Docente Registrado Exitosamente!',
        html: `Cuenta creada para <strong>${session.name}</strong> (${session.email}).<br/>Acceso administrativo habilitado.`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Entrar al Panel Docente',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } catch (err) {
      await Swal.fire({
        title: 'No se pudo registrar el docente',
        text: err.message || 'Verifique los datos ingresados.',
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 py-10 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Portal de Acceso Docente</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              Inicie sesión con su cuenta docente o registre un nuevo acceso para administrar evaluaciones de Física y Química.
            </p>
          </div>

          {/* Switch Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="h-4 w-4" />
              <span>Iniciar Sesión Docente</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Registrar Nuevo Docente</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Correo Electrónico Docente *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="docente@institucion.edu.hn"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingrese su contraseña"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Cuenta de Coordinación Principal:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@ciencias10.edu.hn');
                        setPassword('AdminCiencias2026!');
                      }}
                      className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      Autocompletar Coordinación
                    </button>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-300">
                    admin@ciencias10.edu.hn | Clave: AdminCiencias2026!
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Lock className="h-4 w-4" />
                  <span>{loading ? 'Verificando credenciales...' : 'Ingresar al Panel Docente'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Nombre y Apellido del Docente *
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Lic. Roberto Carlos Mendoza"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Correo Institucional *
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="docente@colegio.edu"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Cátedra / Especialidad *
                    </label>
                    <div className="relative">
                      <GraduationCap className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <select
                        value={regForm.specialty}
                        onChange={(e) => setRegForm({ ...regForm, specialty: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="Física y Química">Física y Química</option>
                        <option value="Física">Física</option>
                        <option value="Química">Química</option>
                        <option value="Coordinación Académica">Coordinación Académica</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Contraseña (mín. 6 caracteres) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-emerald-300 mb-1.5">
                    Código Institucional de Autorización Docente *
                  </label>
                  <div className="relative">
                    <Shield className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-emerald-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. DOCENTE-2026"
                      value={regForm.registrationCode}
                      onChange={(e) => setRegForm({ ...regForm, registrationCode: e.target.value })}
                      className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 pl-10 pr-4 py-2.5 text-sm font-mono text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Evita que estudiantes se registren como docentes.</span>
                    <button
                      type="button"
                      onClick={() => setRegForm({ ...regForm, registrationCode: DEFAULT_TEACHER_REGISTRATION_CODE })}
                      className="text-emerald-400 font-semibold hover:underline cursor-pointer"
                    >
                      Usar código actual ({DEFAULT_TEACHER_REGISTRATION_CODE})
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{loading ? 'Registrando cuenta docente...' : 'Crear Cuenta Docente e Ingresar'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
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
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold transition-all ${
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
              Docente: <strong className="text-emerald-400">{admin.name || admin.email}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
