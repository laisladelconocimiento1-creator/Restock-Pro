import React from 'react';
import { ShieldAlert, Users, CheckCircle, ShieldOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Role } from '../types';

interface MemberProfile {
  id: string;
  name: string;
  role: Role;
  email: string;
  status: string;
}

interface UsersRolesProps {
  currentUserRole: Role;
  currentUserId: string;
  onSwitchUser: (userId: string) => void;
}

export default function UsersRolesView({
  currentUserRole,
  currentUserId,
  onSwitchUser
}: UsersRolesProps) {

  // Registered operational profiles to test the platform layout
  const profiles: MemberProfile[] = [
    { id: 'usr-1', name: 'Diana Alarcón', role: 'ADMIN', email: 'diana.alarcon@cellergourmet.com', status: 'Activo' },
    { id: 'usr-2', name: 'Rodrigo Mendoza (Gerente)', role: 'GERENTE', email: 'rodrigo.mendoza@cellergourmet.com', status: 'Activo' },
    { id: 'usr-3', name: 'Sandra Ortiz (Compras)', role: 'COMPRAS', email: 'sandra.ortiz@cellergourmet.com', status: 'Activo' },
    { id: 'usr-4', name: 'Chef Carlos (Cocina)', role: 'COCINA', email: 'carlos.chef@cellergourmet.com', status: 'Activo' },
    { id: 'usr-5', name: 'Andrés Gil (Almacén)', role: 'RECEPCIÓN', email: 'andres.gil@cellergourmet.com', status: 'Activo' },
    { id: 'usr-6', name: 'Contadora Patricia', role: 'CONTABILIDAD', email: 'patricia.contad@cellergourmet.com', status: 'Activo' },
    { id: 'usr-7', name: 'Lic. Sergio Flores (Auditor)', role: 'AUDITOR', email: 'sergio.auditor@cellergourmet.com', status: 'Activo' },
    { id: 'usr-8', name: 'Mariana Ríos (Lectura)', role: 'LECTURA', email: 'mariana.reader@cellergourmet.com', status: 'Activo' }
  ];

  const getRoleDescription = (r: Role) => {
    switch (r) {
      case 'ADMIN': return 'Control absoluto. Puede crear productos, autorizar misiones de conteo, realizar ajustes y modificar configuraciones.';
      case 'GERENTE': return 'Ver Dashboards administrativos, autorizar o rechazar solicitudes de cocina, aprobar ajustes financieros y auditar kárdex.';
      case 'COMPRAS': return 'Dar de alta proveedores, registrar facturas y remisiones de almacén, y consultar el Libro de Compras oficial.';
      case 'COCINA': return 'Registrar misiones de conteo excepcionales y rellenar solicitudes de requisición para reposición urgente de ingredientes.';
      case 'RECEPCIÓN': return 'Registrar recepción física de mercaderías e ingredientes en andén y subir evidencia digital (remisiones firmadas).';
      case 'CONTABILIDAD': return 'Auditar costos promedio de valuación, revisar facturas, descargar el Libro de Compras y generar cortes SAT.';
      case 'AUDITOR': return 'Acceso read-only detallado a los módulos de auditoría digital, kárdex operativo, mermas de almacén, pero sin poder alterar la información.';
      case 'LECTURA': return 'Acceso general simple read-only de consulta autorizada.';
      default: return 'Perfil limitado.';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="users-roles-view">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Roles de Operación y Privilegios
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Soporte de seguridad basada en roles (RBAC). Simula y cambia de usuario para comprobar la restricción de botones de acción del Celler.
          </p>
        </div>
      </div>

      {/* Alert guidelines constraint explaining current active profile */}
      <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-999 flex gap-3 text-xs leading-relaxed font-sans">
        <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <span>
            Estatus simulado actual: Estás operando con el rol <strong className="font-extrabold text-emerald-900 bg-white border border-emerald-200 py-0.5 px-2 rounded-full uppercase text-[10px]">{currentUserRole}</strong>.
            Los formularios, botones de autorizar y el acceso a módulos de eliminación se ocultarán o activarán de inmediato según el perfil activo abajo.
          </span>
        </div>
      </div>

      {/* Profile selector matrix lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="profiles-simulation-grid">
        {profiles.map((prof) => {
          const isActive = prof.id === currentUserId;

          return (
            <div
              key={prof.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition gap-4 ${
                isActive ? 'border-emerald-600 shadowshadow-md shadow-emerald-50/10' : 'border-slate-200/80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center font-sans ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-650'
                    }`}>
                      {prof.name.split(' ')[0][0]}{prof.name.split(' ')[1] ? prof.name.split(' ')[1][0] : ''}
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 text-sm">{prof.name}</h4>
                      <span className="text-[10px] text-slate-400 font-medium font-mono">{prof.email}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                    isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-250' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {prof.role}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 leading-normal text-slate-650 font-sans mt-2 first-letter:uppercase">
                  {getRoleDescription(prof.role)}
                </div>
              </div>

              {/* Toggle switch Button */}
              <div>
                {isActive ? (
                  <div className="w-full py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-center font-sans text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Identidad Activa en este Turno
                  </div>
                ) : (
                  <button
                    onClick={() => onSwitchUser(prof.id)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition font-sans text-center text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Simular Entrar como {prof.name.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export {};
