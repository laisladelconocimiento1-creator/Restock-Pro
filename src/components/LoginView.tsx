import React, { useState } from 'react';
import { ChefHat, ArrowRight, AlertCircle, RefreshCw, CheckCircle2, UserPlus, ShieldAlert, KeyRound, Lock, ExternalLink } from 'lucide-react';
import { store } from '../data/store';
import { User, Role, UserStatus } from '../types';

interface LoginViewProps {
  onLoginCompleted: (userId: string, isGoogleAccount: boolean) => void;
}

export default function LoginView({ onLoginCompleted }: LoginViewProps) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<UserStatus | 'NOT_FOUND' | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [isRequestSent, setIsRequestSent] = useState(false);
  
  // Controls simulated external popup window for Google Accounts
  const [showGoogleWindow, setShowGoogleWindow] = useState(false);
  const [googleStep, setGoogleStep] = useState<1 | 2>(1); // 1: Email selection, 2: Password simulation

  // Pre-configured official organization accounts for rapid evaluator login
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

  // Executes the federated identity check simulation
  const handleGoogleLoginSubmit = (email: string, customName?: string) => {
    if (!email.trim() || !email.includes('@')) {
      alert('Por favor, ingresa una cuenta de Google o Gmail válida.');
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);
    setPendingUser(null);

    // Get current sucursal/restaurant config settings
    const config = store.getConfig();
    const emailTrim = email.toLowerCase().trim();
    const emailDomain = emailTrim.substring(emailTrim.indexOf('@') + 1);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowGoogleWindow(false); // Close Google popup window
      
      // Look up within integrated database representation
      const allUsers = store.getUsers();
      const matched = allUsers.find(u => u.email.toLowerCase().trim() === emailTrim);

      // Programmatic attributes log simulation
      console.log('--- BACKEND GOOGLE SIGN-IN INTERCEPTOR ---');
      console.log(`- Validate Subject Identifier (sub): sub_google_${emailTrim.replace(/[^a-z0-9]/g, '')}`);
      console.log(`- Validate Email: ${emailTrim}`);
      console.log(`- Validate Expected Organization: ${matched?.organizationId || 'Celler Gourmet S.A.'}`);
      console.log(`- Validate Role Assigned: ${matched?.role || 'NONE'}`);
      console.log(`- Validate Workspace Sede/Area: ${matched?.hq || 'NONE'} / ${matched?.area || 'NONE'}`);
      console.log(`- Validate Status: ${matched?.status || 'UNKNOWN'}`);
      console.log('------------------------------------------');

      if (matched) {
        // 1. Google sub, status and role validations
        if (matched.status === 'DISABLED' || matched.status === 'SUSPENDED') {
          setErrorStatus('DISABLED');
          store.addAuditLog(
            'ACCESO_NO_AUTORIZADO',
            'Sesión',
            `Bloqueado intento de acceso de cuenta de Google suspendida/desactivada: ${matched.email}`,
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
        // 2. Unregistered access check
        // Check "Dominio si se configura" (Domain configuration verification)
        const domainRestricted = !!config.allowedDomain;
        const matchesDomain = domainRestricted ? (emailDomain === config.allowedDomain.toLowerCase().trim()) : true;

        console.warn(`[Google Auth Interceptor]: Cuenta no encontrada. Dominio restringido: ${domainRestricted ? config.allowedDomain : 'Desactivado'}. Coincide: ${matchesDomain}`);

        // Renders access blocked with "No tienes acceso..." message
        setErrorStatus('NOT_FOUND');
        const simulatedName = customName || emailTrim.split('@')[0].split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' ');
        setUserName(simulatedName);
      }
    }, 1500);
  };

  const handleSendAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Por favor ingresa tu nombre completo.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedSub = 'sub_google_' + Math.random().toString(36).substr(2, 9);
      const randomAvatar = `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e', '1494790108377-be9c29b29330'][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&w=150&h=150&q=80`;
      
      const newUser = store.requestAccess(userName, googleEmail, generatedSub, randomAvatar);
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
    setGooglePassword('');
    setUserName('');
    setGoogleStep(1);
    setShowGoogleWindow(false);
  };

  const currentConfig = store.getConfig();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden" id="login-container">
      {/* Visual background ambient decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 text-xs text-slate-300 font-sans relative">
        
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg mx-auto shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-white tracking-tight uppercase leading-tight">
              Restock Pro Celler
            </h1>
            <p className="text-slate-400 text-[10px] font-sans font-bold tracking-widest uppercase">
              Control de Suministro y Auditoría Segura
            </p>
          </div>
        </div>

        {/* CONDITION VIEW: Tu cuenta no tiene acceso (Access Pending screen) */}
        {errorStatus === 'PENDING_APPROVAL' && (
          <div className="space-y-4 animate-fade-in" id="error-pending-panel">
            <div className="bg-amber-950/40 border border-amber-900/50 p-4.5 rounded-2xl text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <h3 className="font-bold text-amber-400 text-sm">Validando Credenciales con Google...</h3>
              <p className="text-slate-350 leading-relaxed text-[11px] font-semibold italic">
                “Tu cuenta no tiene acceso a esta organización. Solicita autorización al administrador.”
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Detalles del Perfil Google Detectado:</span>
              <div className="grid grid-cols-3 gap-y-1 bg-slate-900 p-3 text-[10px] rounded-xl border border-slate-800 font-mono">
                <span className="text-slate-400">Nombre:</span>
                <span className="col-span-2 text-white font-semibold truncate">{pendingUser?.name}</span>
                <span className="text-slate-400">Google Email:</span>
                <span className="col-span-2 text-white font-semibold truncate">{pendingUser?.email}</span>
                <span className="text-slate-400">Google Sub ID:</span>
                <span className="col-span-2 text-indigo-400 truncate">{pendingUser?.sub || 'sub_google_901358'}</span>
                <span className="text-slate-400">Org:</span>
                <span className="col-span-2 text-emerald-400">Celler Gourmet S.A.</span>
                <span className="text-slate-400">Estado:</span>
                <span className="col-span-2 text-amber-400 font-bold uppercase tracking-wider">Pendiente</span>
              </div>
              <p className="text-[10px] text-slate-405 italic text-center pt-2 leading-relaxed">
                El administrador principal ha recibido tu identificador único. Se te asignará tu Sede Central, Almacén y Rol una vez validado.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 py-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              Cerrar y Reintentar con otro Gmail
            </button>
          </div>
        )}

        {/* CONDITION VIEW: Cuenta Desactivada / Bloqueada */}
        {errorStatus === 'DISABLED' && (
          <div className="space-y-4 animate-fade-in" id="error-disabled-panel">
            <div className="bg-rose-950/40 border border-rose-900/50 p-5 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="font-bold text-rose-400 text-sm">Acceso Bloqueado / Cuenta Inactiva</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Tu acceso de Google Sign-In corporativo ha sido desactivado o suspendido en la organización.
              </p>
              <p className="text-slate-450 text-[10px] italic">
                Comunícate con Diana Alarcón en Administración para validar tu situación con el Celler Gourmet.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-850 hover:bg-slate-800 text-slate-200 py-2.5 rounded-xl font-bold transition cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        )}

        {/* CONDITION VIEW: Solicitud Rechazada */}
        {errorStatus === 'REJECTED' && (
          <div className="space-y-4 animate-fade-in" id="error-rejected-panel">
            <div className="bg-rose-950/40 border border-rose-900/50 p-5 rounded-box text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="font-bold text-rose-400 text-sm">Solicitud Rechazada</h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                La solicitud de ingreso ha sido formalmente denegada por motivos de políticas de seguridad.
              </p>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-205 py-2.5 rounded-lg font-bold transition cursor-pointer"
            >
              Volver al inicio
            </button>
          </div>
        )}

        {/* CONDITION VIEW: Tu cuenta no tiene acceso (Formulario para enviar Solicitud) */}
        {errorStatus === 'NOT_FOUND' && !isRequestSent && (
          <form onSubmit={handleSendAccessRequest} className="space-y-4 animate-fade-in" id="access-request-form">
            <div className="bg-rose-950/30 border border-rose-900/40 p-4.5 rounded-2xl space-y-2.5 text-slate-300">
              <div className="flex gap-2 text-rose-400 font-bold text-xs items-center">
                <ShieldAlert className="w-4 h-4" />
                <span>Advertencia de Control de Acceso</span>
              </div>
              <p className="leading-relaxed text-[11px] font-sans font-bold text-white bg-rose-900/10 p-2.5 rounded border border-rose-900/20 italic">
                “Tu cuenta no tiene acceso a esta organización. Solicita autorización al administrador.”
              </p>
              <p className="text-slate-400 text-[10px] leading-relaxed">
                El correo de Google verificado <strong className="text-slate-205 font-mono">{googleEmail}</strong> no está pre-autorizado en el padrón operacional de la sede. Envía tu solicitud para que Diana Alarcón te asigne áreas, sedes y rol.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Identidad Google Detectada</label>
                <input
                  type="text"
                  disabled
                  value={googleEmail}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded px-3 py-2.5 text-slate-400 text-xs font-mono outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-200 font-bold uppercase text-[8px] tracking-wider">Tu Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ing. Juan Mendoza"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:bg-slate-900 focus:border-orange-500 rounded px-3 py-2.5 text-slate-100 text-xs font-sans outline-none transition"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="w-1/3 bg-slate-800 hover:bg-slate-750 text-slate-300 py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-505 hover:to-amber-505 text-white py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    Solicitar Acceso <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 text-center italic leading-relaxed">
              Toda solicitud será auditada de forma inalterable para prevenir ataques de suplantación.
            </p>
          </form>
        )}

        {/* PRIMARY AUTH VIEW: Google Sign-In Screen */}
        {errorStatus === null && (
          <div className="space-y-5">
            {/* Info label about Google Auth restriction */}
            <div className="bg-slate-950/50 border border-slate-850 p-4 rounded-2xl leading-relaxed text-slate-400 flex gap-3">
              <KeyRound className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200 block text-[11px] mb-0.5">Acceso Corporativo Protegido:</strong>
                Este sistema requiere verificación de identidad vía Google Sign-In. Únicamente cuentas validadas de la organización tienen autorización de entrada.
                {currentConfig.allowedDomain && (
                  <span className="block text-[9.5px] mt-1 text-orange-400 font-mono font-semibold">
                    Restricción de dominio activa: *@{currentConfig.allowedDomain}
                  </span>
                )}
              </div>
            </div>

            {/* Simulated standard Google Sign-In Trigger Box */}
            <div className="space-y-4">
              <div className="space-y-3">
                {/* REQUIRED PRIMARY TRIGGER BUTTON */}
                <button
                  onClick={() => {
                    setShowGoogleWindow(true);
                    setGoogleStep(1);
                  }}
                  className="w-full bg-white hover:bg-slate-100 text-slate-900 py-3 rounded-xl font-bold font-sans flex items-center justify-center gap-2.5 transition active:scale-98 shadow-md cursor-pointer"
                  id="btn-ingresar-con-google"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.286-2.82-6.286-6.285 0-3.466 2.82-6.286 6.286-6.286 1.487 0 2.846.527 3.91 1.4l3.057-3.057C18.89 1.91 15.77.942 12.24.942 6.033.942.942 6.033.942 12.24s5.09 11.298 11.298 11.298c6.48 0 10.785-4.546 10.785-10.972 0-.608-.053-1.196-.15-1.74H12.24z"
                    />
                  </svg>
                  <span className="text-sm font-semibold tracking-tight text-slate-800">Ingresar con Google</span>
                </button>

                <p className="text-[10px] text-center text-slate-550 leading-relaxed font-semibold uppercase tracking-wider">
                  Soporta Single Sign-On (SSO) Federado Seguro
                </p>
              </div>

              {/* DEMO / TESTING PRESETS GRID: For immediate evaluation login */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <div className="flex justify-between items-center text-[9px] uppercase font-semibold text-slate-500 font-mono tracking-wider">
                  <span>Simulación de Red:</span>
                  <span className="text-emerald-500 font-bold">● Cuentas Celler</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-sans">
                  {presets.map((p) => (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => {
                        setGoogleEmail(p.email);
                        setShowGoogleWindow(true);
                        setGoogleStep(2);
                      }}
                      className="py-1 px-1 bg-slate-850 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded text-[9px] font-medium transition text-center truncate hover:border-orange-500 hover:text-white cursor-pointer"
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
          <span>{currentConfig.restaurantName}</span>
        </div>

      </div>

      {/* --- SIMULATED GOOGLE IDENTITY OAUTH FLOW ACCOUNTPOPUP CAPTURING --- */}
      {showGoogleWindow && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" id="google-auth-window-simulation">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl p-6 text-slate-700 font-sans border border-slate-250 relative">
            <button 
              onClick={() => {
                setShowGoogleWindow(false);
                setGoogleStep(1);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition outline-none cursor-pointer"
            >
              Cerrar
            </button>

            {/* Google accounts logo brand header */}
            <div className="text-center space-y-4 mb-6">
              <div className="flex justify-center">
                {/* Colored Google Logo */}
                <svg className="w-16 h-7" viewBox="0 0 74 24" fill="none">
                  <path d="M7.781 14.162c-2.148 0-3.984-1.782-3.984-4.004C3.797 7.915 5.633 6.15 7.78 6.15c1.153 0 2.11.455 2.766 1.085l2.004-2.004C11.313 4.043 9.695 3.195 7.78 3.195 4.195 3.195 1 6.236 1 10.158c0 3.922 3.195 6.963 6.781 6.963 1.954 0 3.493-.8 4.688-1.996l-1.95-1.95c-.65.617-1.57 1.087-2.738 1.087z" fill="#4285F4"/>
                  <path d="M16 3.65h3v13h-3v-13z" fill="#34A853"/>
                  <path d="M21.5 10.158c0-3.922 3.151-6.963 6.75-6.963 3.599 0 6.75 3.041 6.75 6.963 0 3.922-3.151 6.963-6.75 6.963-3.599 0-6.75-3.041-6.75-6.963zm10.5 0c0-2.222-1.791-4.004-3.75-4.004-1.959 0-3.75 1.782-3.75 4.004 0 2.222 1.791 4.004 3.75 4.004 1.959 0 3.75-1.782 3.75-4.004z" fill="#EA4335"/>
                  <path d="M37 10.158c0-3.922 3.151-6.963 6.75-6.963 3.599 0 6.75 3.041 6.75 6.963 0 3.922-3.151 6.963-6.75 6.963-3.599 0-6.75-3.041-6.75-6.963zm10.5 0c0-2.222-1.791-4.004-3.75-4.004-1.959 0-3.75 1.782-3.75 4.004 0 2.222 1.791 4.004 3.75 4.004 1.959 0 3.75-1.782 3.75-4.004z" fill="#FBBC05"/>
                  <path d="M52.3 17.12v-1.1h-.1c-.4.5-1.3 1.1-2.5 1.1-2.3 0-4.3-1.8-4.3-4.3s2-4.3 4.3-4.3c1.2 0 2.1.5 2.5 1h.1v-.8c0-1.6-1-2.5-2.6-2.5-1.3 0-2.1.9-2.4 1.6l-2.6-1.1c.8-1.9 2.8-3.1 5-3.1 3.4 0 5.4 2 5.4 5.6v8.8h-2.8zm-2.4-7c-1.3 0-2.4 1-2.4 2.4s1.1 2.4 2.4 2.4 2.4-1 2.4-2.4c.1-1.4-1-2.4-2.4-2.4z" fill="#4285F4"/>
                  <path d="M59.1 3.65h3v5.1l.1.1c.5-.6 1.4-1.2 2.7-1.2 2.3 0 3.6 1.5 3.6 3.9v5.6h-3v-5.2c0-1.4-.6-2.1-1.7-2.1-1.2 0-2 .9-2 2.1v5.2h-3v-13.5z" fill="#34A853"/>
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-medium text-slate-800">Iniciar sesión</h2>
                <p className="text-xs text-slate-500 mt-2">
                  Usa tu cuenta de Google. Tu identidad será validada de forma segura para <span className="font-semibold text-slate-700">Restock Pro Celler</span>.
                </p>
              </div>
            </div>

            {/* Simulated oauth steps */}
            {googleStep === 1 ? (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="space-y-1 relative">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Correo electrónico o teléfono</span>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com o @cellergourmet.com"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded p-3 text-sm text-slate-800 outline-none transition"
                    id="google-popup-email-input"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded text-[10.5px] leading-relaxed text-slate-500 border border-slate-150">
                  🛡 <strong>Compromiso de Privacidad Google:</strong> No requerimos acceso a tus recibos de Gmail ni permisos de lectura de bandeja. El inicio de sesión se limita exclusivamente a verificar tu <strong>Google Sub ID</strong> y autenticidad del correo institucional.
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmail('invitado.nuevo@gmail.com');
                    }}
                    className="text-blue-600 font-bold hover:underline py-1 text-[11px]"
                  >
                    Probar Email Nuevo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!googleEmail.trim()) {
                        alert('Por favor ingresa un correo electrónico.');
                        return;
                      }
                      setGoogleStep(2);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded text-xs transition cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center gap-2 border border-slate-200 p-2.5 rounded-full bg-slate-50 text-[11px] mb-2 shadow-xs">
                  <div className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    G
                  </div>
                  <span className="font-mono text-slate-700 truncate flex-1">{googleEmail}</span>
                  <button 
                    onClick={() => setGoogleStep(1)}
                    className="text-blue-600 text-[10px] hover:underline"
                  >
                    Cambiar
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-550 font-bold block">Introduce tu Contraseña (Simulado)</label>
                  <input
                    type="password"
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded p-3 text-sm text-slate-800 outline-none transition"
                  />
                </div>

                <p className="text-[10px] text-slate-450 italic leading-relaxed">
                  Para fines de demostración, la contraseña es autovalidada. Al dar click, se enviará el payload de Google sub, email y name al validador del backend.
                </p>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setGoogleStep(1)}
                    className="text-slate-550 hover:underline py-1"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleLoginSubmit(googleEmail)}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded text-xs transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3 animate-spin text-white" />
                    ) : (
                      'Autorizar e Ingresar'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
