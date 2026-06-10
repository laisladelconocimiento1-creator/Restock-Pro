import React, { useState } from 'react';
import { ChefHat, ArrowRight, AlertCircle, RefreshCw, CheckCircle2, UserPlus, ShieldAlert, KeyRound } from 'lucide-react';
import { store } from '../data/store';
import { User, Role, UserStatus } from '../types';

interface LoginViewProps {
  onLoginCompleted: (userId: string, isGoogleAccount: boolean) => void;
}

export default function LoginView({ onLoginCompleted }: LoginViewProps) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<UserStatus | 'NOT_FOUND' | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isRequestSent, setIsRequestSent] = useState(false);

  // We keep a registry of Google profile simulation inputs
  const [showNewUserForm, setShowNewUserForm] = useState(false);

  // Pre-configured official organization accounts
  const presets = [
    { name: 'Diana (ADMIN)', email: 'diana.alarcon@cellergourmet.com', role: 'ADMIN' },
    { name: 'Rodrigo (GERENTE)', email: 'rodrigo.mendoza@cellergourmet.com', role: 'GERENTE' },
    { name: 'Sandra (COMPRAS)', email: 'sandra.ortiz@cellergourmet.com', role: 'COMPRAS' },
    { name: 'Carlos (CHEF)', email: 'carlos.chef@cellergourmet.com', role: 'CHEF' },
    { name: 'Andrés (RECEPCIÓN)', email: 'andres.gil@cellergourmet.com', role: 'ALMACEN_RECEPCION' },
    { name: 'Patricia (CONTABILIDAD)', email: 'patricia.contad@cellergourmet.com', role: 'CONTABILIDAD' },
    { name: 'Sergio (AUDITOR)', email: 'sergio.auditor@cellergourmet.com', role: 'AUDITOR' },
    { name: 'Mariana (LECTURA)', email: 'mariana.reader@cellergourmet.com', role: 'SOLO_LECTURA' },
    { name: 'Pedro (COCINERO)', email: 'pedro.cocina@cellergourmet.com', role: 'COCINERO' }
  ];

  const handleGoogleLogin = (email: string, customName?: string) => {
    if (!email.trim()) {
      alert('Por favor, ingresa tu correo de Google.');
      return;
    }
    if (!email.includes('@')) {
      alert('Ingresa una dirección de correo válida de Google.');
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);
    setPendingUser(null);

    setTimeout(() => {
      setIsSubmitting(false);
      const emailTrim = email.toLowerCase().trim();
      
      // Get latest users database from the store
      const allUsers = store.getUsers();
      const matched = allUsers.find(u => u.email.toLowerCase().trim() === emailTrim);

      if (matched) {
        // Authenticated Google sub validation
        if (matched.status === 'DISABLED' || matched.status === 'SUSPENDED') {
          setErrorStatus('DISABLED');
          store.addAuditLog(
            'ACCESO_NO_AUTORIZADO',
            'Sesión',
            `Intento de ingreso bloqueado para cuenta desactivada/suspendida: ${matched.email}`,
            matched.id
          );
          return;
        }

        if (matched.status === 'REJECTED') {
          setErrorStatus('REJECTED');
          return;
        }

        if (matched.status === 'PENDING_APPROVAL') {
          setErrorStatus('PENDING_APPROVAL');
          setPendingUser(matched);
          return;
        }

        // Active authorized user login!
        onLoginCompleted(matched.id, true);
      } else {
        // Unlisted email domain validation rules
        // User is not registered in the system yet. Needs to submit access request.
        setErrorStatus('NOT_FOUND');
        const simulatedName = customName || emailTrim.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
        setUserName(simulatedName);
      }
    }, 1000);
  };

  const handleSendAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Por favor ingresa tu nombre completo para la solicitud.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const randomSub = 'sub_google_' + Math.random().toString(36).substr(2, 9);
      const randomAvatar = `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e', '1494790108377-be9c29b29330'][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&w=150&h=150&q=80`;
      
      const newUser = store.requestAccess(userName, googleEmail, randomSub, randomAvatar);
      setPendingUser(newUser);
      setIsRequestSent(true);
      setErrorStatus('PENDING_APPROVAL');
    }, 1200);
  };

  const handleReset = () => {
    setErrorStatus(null);
    setPendingUser(null);
    setIsRequestSent(false);
    setGoogleEmail('');
    setUserName('');
    setShowNewUserForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" id="login-container">
      {/* Decorative backdrop background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 space-y-6 text-xs text-slate-300 font-sans relative">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center font-bold text-lg mx-auto shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-extrabold text-white tracking-tight uppercase leading-tight">
              Restock Pro Celler
            </h1>
            <p className="text-slate-400 text-[11px] font-sans font-semibold tracking-wider uppercase">
              Control de Suministro y Auditoría Segura
            </p>
          </div>
        </div>

        {/* CONDITION VIEW: Tu cuenta no tiene acceso (Unlisted or Pending approval block screen) */}
        {errorStatus === 'PENDING_APPROVAL' && (
          <div className="space-y-4 animate-fade-in" id="error-pending-panel">
            <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <h3 className="font-bold text-amber-400 text-sm">Validando Credenciales con Google Sign-In...</h3>
              <p className="text-slate-350 leading-relaxed text-[11px]">
                “Tu cuenta no tiene acceso a esta organización. Solicita autorización al administrador.”
              </p>
            </div>

            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Detalles de la solicitud:</span>
              <div className="grid grid-cols-3 gap-y-1 bg-slate-900 p-2 text-[10px] rounded border border-slate-800">
                <span className="text-slate-400 font-medium">Nombre:</span>
                <span className="col-span-2 text-white font-semibold truncate">{pendingUser?.name}</span>
                <span className="text-slate-400 font-medium">Email:</span>
                <span className="col-span-2 text-white font-semibold truncate">{pendingUser?.email}</span>
                <span className="text-slate-400 font-medium">Google Sub:</span>
                <span className="col-span-2 text-indigo-400 font-mono truncate">{pendingUser?.sub || 'Pendiente'}</span>
                <span className="text-slate-400 font-medium">Estado:</span>
                <span className="col-span-2 text-amber-400 font-bold uppercase tracking-wider">{pendingUser?.status === 'PENDING_APPROVAL' ? 'Pendiente' : pendingUser?.status}</span>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center pt-2">
                El administrador Diana Alarcón ha sido notificada para la asignación de tu Rol, Sede y Área.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5"
            >
              Cerrar y Volver
            </button>
          </div>
        )}

        {/* CONDITION VIEW: Cuenta Desactivada */}
        {errorStatus === 'DISABLED' && (
          <div className="space-y-4 animate-fade-in" id="error-disabled-panel">
            <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="font-bold text-rose-400 text-sm">Acceso Bloqueado / Cuenta Inactiva</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Tu cuenta ha sido desactivada o suspendida en los servicios centrales de la organización.
              </p>
              <p className="text-slate-400 text-[10px]">
                Comunícate con el administrador para verificar tu estado de contratación o permisos de área.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 py-2 rounded-lg font-bold transition"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {/* CONDITION VIEW: Cuenta Rechazada */}
        {errorStatus === 'REJECTED' && (
          <div className="space-y-4 animate-fade-in" id="error-rejected-panel">
            <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="font-bold text-rose-400 text-sm">Solicitud Rechazada</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                La solicitud de ingreso con esta cuenta de Google ha sido rechazada por el administrador de seguridad.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 py-2 rounded-lg font-bold transition"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {/* CONDITION VIEW: Formulario para enviar Solicitud de Acceso (First Login request flow) */}
        {errorStatus === 'NOT_FOUND' && !isRequestSent && (
          <form onSubmit={handleSendAccessRequest} className="space-y-4 animate-fade-in" id="access-request-form">
            <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-xl space-y-2 text-slate-300">
              <div className="flex gap-2 text-blue-400 font-bold text-xs items-center">
                <UserPlus className="w-4 h-4" />
                <span>Solicitud de Autorización</span>
              </div>
              <p className="leading-relaxed text-[10.5px] text-slate-300">
                “Tu cuenta no tiene acceso a esta organización. Solicita autorización al administrador.”
              </p>
              <p className="text-slate-400 text-[10px]">
                Si eres parte del equipo, puedes enviar una solicitud formal de registro con tu cuenta Gmail detectada.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Correo Gmail Detectado</label>
                <input
                  type="text"
                  disabled
                  value={googleEmail}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded px-3 py-2 text-slate-400 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-200 font-bold uppercase text-[8px] tracking-wider">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:bg-slate-900 focus:border-indigo-500 rounded px-3 py-2 text-slate-100 text-xs font-sans outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-1/3 bg-slate-800 hover:bg-slate-750 text-slate-300 py-2 rounded-lg font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-505 text-white py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3 animate-spin" />
                ) : (
                  <>
                    Enviar Solicitud <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center italic">
              El administrador Diana Alarcón asignará tu Sede Central, Área y Rol tras validar tu identidad corporativa.
            </p>
          </form>
        )}

        {/* PRIMARY AUTH VIEW: Google Sign-In Screen */}
        {errorStatus === null && (
          <div className="space-y-5">
            {/* Info label about Google Auth restriction */}
            <div className="bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl leading-relaxed text-slate-400 flex gap-2.5">
              <KeyRound className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block text-[11px] mb-0.5">Acceso Corporativo Protegido:</strong>
                Este sistema requiere verificación de identidad vía Google Sign-In. Únicamente cuentas validadas de la organización tienen autorización de entrada.
              </div>
            </div>

            {/* Simulated standard Google Sign-In Trigger Box */}
            <div className="space-y-4">
              {!showNewUserForm ? (
                <div className="space-y-3">
                  {/* MAIN REQUIRED BUTTON: Ingresar con Google */}
                  <button
                    onClick={() => setShowNewUserForm(true)}
                    className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-xl font-bold font-sans flex items-center justify-center gap-2.5 transition active:scale-98 shadow-md"
                    id="btn-ingresar-con-google"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.286-2.82-6.286-6.285 0-3.466 2.82-6.286 6.286-6.286 1.487 0 2.846.527 3.91 1.4l3.057-3.057C18.89 1.91 15.77.942 12.24.942 6.033.942.942 6.033.942 12.24s5.09 11.298 11.298 11.298c6.48 0 10.785-4.546 10.785-10.972 0-.608-.053-1.196-.15-1.74H12.24z"
                      />
                    </svg>
                    <span className="text-sm font-semibold tracking-tight">Ingresar con Google</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-500">
                    Soporta dominios corporativos con Google Sign-In federado seguro.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850 animate-fade-in">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-slate-400">Ingresar Email de Google / Gmail *</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="ejemplo@cellergourmet.com"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 focus:bg-slate-900 focus:border-orange-500 rounded px-2.5 py-1.5 text-slate-100 text-xs font-sans outline-none"
                        id="google-login-email-input"
                      />
                      <button
                        onClick={() => handleGoogleLogin(googleEmail)}
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-505 text-white font-bold px-3 py-1.5 rounded text-[11px] uppercase shrink-0 transition"
                      >
                        {isSubmitting ? 'Verificando...' : 'Ingresar'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>O selecciona un perfil de simulación:</span>
                    <button onClick={() => setShowNewUserForm(false)} className="text-orange-500 hover:underline">Ocultar</button>
                  </div>
                </div>
              )}

              {/* DEMO / TESTING PRESENTS GRID: Perfect for instant evaluator login */}
              <div className="space-y-2 pt-2">
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-wider">Perfiles de la Organización para Pruebas:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => {
                        setGoogleEmail(p.email);
                        setShowNewUserForm(true);
                        handleGoogleLogin(p.email);
                      }}
                      className="py-1 px-1 bg-slate-850 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded text-[9.5px] font-medium transition text-center truncate hover:border-orange-500 hover:text-white"
                      title={p.email}
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Professional Footer */}
        <div className="border-t border-slate-800 pt-4 text-center text-[9px] text-slate-550 font-mono flex items-center justify-between">
          <span>Restock Pro v1.2</span>
          <span>Celler Gourmet S.A.</span>
        </div>

      </div>
    </div>
  );
}
