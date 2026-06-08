import React, { useState } from 'react';
import { Shield, Search, Filter, Cpu, CheckCircle } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditProps {
  logs: AuditLog[];
}

export default function AuditView({ logs }: AuditProps) {
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.comment || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.userRole.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = filterModule === 'all' || log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="audit-logs-view">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none flex items-center gap-2">
            <Shield className="w-8 h-8 text-slate-700 animate-pulse" />
            Libro de Acuerdos y Auditoría Digital
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Trazabilidad inmutable de acciones sensibles, inicios de sesión y autorizaciones fiscales en el Celler Gourmet.
          </p>
        </div>
      </div>

      {/* Info notice bar */}
      <div className="bg-slate-900 text-slate-300 rounded-xl p-4 flex gap-3 text-xs leading-relaxed font-mono">
        <Cpu className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">ENCRYPTED AUDIT PROTOCOL:</strong> Este ledger es de carácter read-only. De acuerdo a las normativas de control fiscal interno y anticorrupción del restaurante, la modificación de trazas o logs de auditoría por interfaz está bloqueada tanto para gerencia como personal técnico.
        </div>
      </div>

      {/* Search filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-205 shadow-sm flex flex-col sm:flex-row gap-3 text-xs font-sans">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por usuario responsable, tipo de acción sensible (ej. APROBACIÓN_SOLICITUD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-slate-850 transition"
            id="input-audit-search"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none"
            id="select-audit-module"
          >
            <option value="all">Todos los Módulos</option>
            <option value="Sesión">Módulo de Sesión (Login/Logout)</option>
            <option value="Productos">Módulo de Productos / Catálogo</option>
            <option value="Solicitudes">Módulo de Solicitudes Cocina</option>
            <option value="Compras">Módulo de Facturación y Compras</option>
            <option value="Inventario">Módulo de Inventarios y Almacén</option>
            <option value="Inventario Físico">Módulo de Inventario Físico / Reconciliación</option>
            <option value="Configuración">Configuraciones Generales</option>
          </select>
        </div>
      </div>

      {/* Secure table listing */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-55 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Estampa de Tiempo</th>
                <th className="p-4">Usuario responsable</th>
                <th className="p-4">Rol Operación</th>
                <th className="p-4 text-center">Módulo</th>
                <th className="p-4">Evento / Acción de Carga</th>
                <th className="p-4">Folio Afectado</th>
                <th className="p-4">Comentarios Auditoría</th>
                <th className="p-4">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]" id="audit-table-body">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                     No se han encontrado registros en el ledguer...
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition whitespace-nowrap">
                    {/* Timestamp */}
                    <td className="p-4 text-slate-500">
                      {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    {/* Member */}
                    <td className="p-4 text-slate-800 font-bold font-sans">{log.userName}</td>

                    {/* Role badge */}
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 py-0.5 px-2 rounded-md font-bold text-[9px] uppercase border font-sans">
                        {log.userRole}
                      </span>
                    </td>

                    {/* Module */}
                    <td className="p-4 text-center text-slate-600 font-semibold font-sans">{log.module}</td>

                    {/* Action */}
                    <td className="p-4 font-bold text-red-700">{log.action}</td>

                    {/* Record ID affected */}
                    <td className="p-4 text-slate-450">{log.recordId || '—'}</td>

                    {/* Message comments */}
                    <td className="p-4 text-slate-600 font-sans font-medium line-clamp-1 truncate max-w-sm">{log.comment || '—'}</td>

                    {/* Device IP agent metadata */}
                    <td className="p-4 text-slate-400 text-[10px] truncate max-w-[150px]">{log.device || 'Desktop Client'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export {};
