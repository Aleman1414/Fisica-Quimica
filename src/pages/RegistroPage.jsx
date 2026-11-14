import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  LogIn,
  IdCard,
  User,
  Users,
  Mail,
  Phone,
  ShieldAlert,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
  getActiveSections,
  registerParticipant,
  loginParticipantByDocumento,
  getSavedStudentSession
} from '../services/evaluationService';
import ExamScheduleBanner from '../components/ExamScheduleBanner';

export default function RegistroPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('registro'); // 'registro' | 'ingreso'
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    documento: '',
    fullName: '',
    sectionId: '',
    email: '',
    phone: ''
  });

  // Login / Recovery Form State
  const [loginForm, setLoginForm] = useState({
    documento: '',
    sectionId: ''
  });

  useEffect(() => {
    const existing = getSavedStudentSession();
    if (existing) {
      navigate('/estudiante');
      return;
    }
    getActiveSections().then((list) => {
      setSections(list);
      if (list.length > 0) {
        setRegForm((prev) => ({ ...prev, sectionId: list[0].id }));
      }
    });
  }, [navigate]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const participant = await registerParticipant(regForm);
      await Swal.fire({
        title: '¡Registro Exitoso!',
        html: `Bienvenido(a), <strong>${participant.fullName}</strong>.<br/>Documento validado: <code>${participant.documento}</code>`,
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Ir a Mis Evaluaciones',
        background: '#0f172a',
        color: '#f8fafc'
      });
      navigate('/estudiante');
    } catch (err) {
      await Swal.fire({
        title: 'Validación de Registro',
        text: err.message || 'No se pudo completar el registro.',
        icon: 'warning',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc'
      });
      if (err.message?.includes('ya se encuentra registrado')) {
        setLoginForm({ documento: regForm.documento, sectionId: '' });
        setActiveTab('ingreso');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const participant = await loginParticipantByDocumento(loginForm);
      await Swal.fire({
        title: 'Identidad Verificada',
        html: `Sesión recuperada para <strong>${participant.fullName}</strong> (${participant.sectionName}).`,
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#f8fafc'
      });
      navigate('/estudiante');
    } catch (err) {
      await Swal.fire({
        title: 'No se pudo iniciar sesión',
        text: err.message || 'Verifique su número de documento o regístrese primero.',
        icon: 'error',
        confirmButtonColor: '#4f46e5',
        background: '#0f172a',
        color: '#f8fafc'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl mb-8">
        <ExamScheduleBanner durationMinutes={25} />
      </div>
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3.5 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
            Décimo Grado • Física y Química
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-white">Portal de Identificación Estudiantil</h1>
          <p className="mt-2 text-sm text-slate-400">
            Regístrese por única vez con su número de identidad o carnet estudiantil, o ingrese si ya se registró anteriormente.
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1.5 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('registro')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'registro'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Registro</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ingreso')}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'ingreso'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4" />
            <span>Ya estoy registrado</span>
          </button>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl">
          {activeTab === 'registro' ? (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Número de Identidad / Carnet Estudiantil *
                </label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. 0801201012345 o EST-10025"
                    value={regForm.documento}
                    onChange={(e) => setRegForm({ ...regForm, documento: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-400">
                  Se validará que no existan registros duplicados con este mismo documento.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Nombres y Apellidos Completos *
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. María Fernanda López Hernández"
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Sección de Décimo Grado *
                </label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <select
                    required
                    value={regForm.sectionId}
                    onChange={(e) => setRegForm({ ...regForm, sectionId: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>Seleccione su sección...</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.code} — {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="estudiante@colegio.edu"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="9999-9999"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3.5 text-xs text-indigo-200 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  Al registrarse tendrá acceso a un máximo de <strong>3 intentos en Física</strong> y{' '}
                  <strong>3 intentos en Química</strong>. Asegúrese de ingresar sus datos oficiales correctamente.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{loading ? 'Validando identidad...' : 'Completar Registro e Ingresar'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Número de Identidad / Carnet Registrado *
                </label>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ingrese su documento registrado"
                    value={loginForm.documento}
                    onChange={(e) => setLoginForm({ ...loginForm, documento: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Verificar Sección (Opcional)
                </label>
                <select
                  value={loginForm.sectionId}
                  onChange={(e) => setLoginForm({ ...loginForm, sectionId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Cualquier sección asignada a mi documento</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code} — {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Si tenía una evaluación en curso que se interrumpió, al ingresar con su documento podrá retomarla inmediatamente con sus respuestas guardadas.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{loading ? 'Verificando documento...' : 'Continuar a Mis Evaluaciones'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

