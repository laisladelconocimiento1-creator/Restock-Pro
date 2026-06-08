import React, { useState } from 'react';
import { ChefHat, HelpCircle, ArrowRight, Check, AlertCircle, RefreshCw } from 'lucide-react';

interface LoginViewProps {
  onLoginCompleted: (userId: string, isGoogleAccount: boolean) => void;
}

export default function LoginView({ onLoginCompleted }: LoginViewProps) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRolePreset, setSelectedRolePreset] = useState<'ADMIN' | 'GERENTE' | 'COCINA' | 'COMPRAS'>('ADMIN');

  const handleGoogleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      alert('Por favor introduce tu de Correo Electrónico de Google / Gmail.');
      return;
    }
    if (!googleEmail.includes('@')) {
      alert('Ingresa una dirección de correo Gmail válida.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Map based on the typed email, or map based on role preset
      let targetUserId = 'usr-1'; // Diana Alarcón (ADMIN)
      if (selectedRolePreset === 'GERENTE') targetUserId = 'usr-2';
      else if (selectedRolePreset === 'COMPRAS') targetUserId = 'usr-3';
      else if (selectedRolePreset === 'COCINA') targetUserId = 'usr-4';

      onLoginCompleted(targetUserId, true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" id="login-container">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 shadow-2xl rounded-xl p-6 space-y-6 text-xs text-slate-300 font-sans">

        {/* Logo and Greeting display */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center font-bold text-lg mx-auto shadow shadow-orange-500/20">
            <ChefHat className="w-5 h-5 shrink-0 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-extrabold text-white tracking-tight leading-none uppercase">
              Restock Pro Celler
            </h1>
            <p className="text-slate-500 mt-1.5 text-[11px] font-sans font-semibold tracking-wide">
              Silos de Control de Almacén y Auditoría • Celler Gourmet
            </p>
          </div>
        </div>

        {/* Info label about standard setup constraints */}
        <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-lg leading-relaxed text-slate-400 flex gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Verificación de Cuentas:</strong> Accede de forma segura integrando tu cuenta registrada de Google Workspace corporativa.
          </div>
        </div>

        <form onSubmit={handleGoogleLoginSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1">
            <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Correo de Gmail corporativo *</label>
            <input
              type="email"
              required
              placeholder="nombre.apellido@cellergourmet.com"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:bg-slate-900 focus:border-orange-500 rounded px-3 py-2 text-slate-100 text-xs font-sans outline-none transition placeholder-slate-650"
              id="google-login-email-input"
            />
          </div>

          {/* Test Profile Presets selector - awesome feature for testing */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider mb-1">Elegir perfil de ingreso (Pruebas / Demo) *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRolePreset('ADMIN');
                  setGoogleEmail('diana.alarcon@cellergourmet.com');
                }}
                className={`py-1.5 px-2.5 border rounded text-center font-bold transition text-[9px] uppercase ${
                  selectedRolePreset === 'ADMIN' ? 'bg-orange-600 border-orange-500 text-white shadow shadow-orange-600/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                ADMIN (Diana)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRolePreset('GERENTE');
                  setGoogleEmail('rodrigo.mendoza@cellergourmet.com');
                }}
                className={`py-1.5 px-2.5 border rounded text-center font-bold transition text-[9px] uppercase ${
                  selectedRolePreset === 'GERENTE' ? 'bg-orange-600 border-orange-500 text-white shadow shadow-orange-600/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                GERENTE (Rodrigo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRolePreset('COMPRAS');
                  setGoogleEmail('sandra.ortiz@cellergourmet.com');
                }}
                className={`py-1.5 px-2.5 border rounded text-center font-bold transition text-[9px] uppercase ${
                  selectedRolePreset === 'COMPRAS' ? 'bg-orange-600 border-orange-500 text-white shadow shadow-orange-600/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                COMPRAS (Sandra)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRolePreset('COCINA');
                  setGoogleEmail('carlos.chef@cellergourmet.com');
                }}
                className={`py-1.5 px-2.5 border rounded text-center font-bold transition text-[9px] uppercase ${
                  selectedRolePreset === 'COCINA' ? 'bg-orange-600 border-orange-500 text-white shadow shadow-orange-600/10' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                COCINA (Carlos)
              </button>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded font-bold transition font-sans flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/10 disabled:opacity-60"
              id="btn-google-sign-in"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-white" />
                  Verificando credenciales federadas...
                </>
              ) : (
                <>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                    alt="Google"
                    className="w-3.5 h-3.5 shrink-0 bg-white p-0.5 rounded-full"
                  />
                  Continuar con Google Workspace <ArrowRight className="w-3 h-3 shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="border-t border-slate-800 pt-4 text-center text-[9px] text-slate-550 font-mono">
          Celler Gourmet S.A. de C.V. — Todos los derechos reservados.
        </div>

      </div>
    </div>
  );
}
