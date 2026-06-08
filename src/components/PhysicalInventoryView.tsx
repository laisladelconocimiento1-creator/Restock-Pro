import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  ChevronRight,
  AlertTriangle,
  Play,
  Save,
  Check,
  X,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { PhysicalSession, Product, Unit, Role, InventoryArea, PhysicalSessionStatus, PhysicalSessionItem } from '../types';

interface PhysicalInventoryProps {
  sessions: PhysicalSession[];
  products: Product[];
  units: Unit[];
  currentUserRole: Role;
  currentUserId: string;
  currentUserName: string;
  onAddSession: (session: PhysicalSession) => void;
  onUpdateSession: (session: PhysicalSession) => void;
}

export default function PhysicalInventoryView({
  sessions,
  products,
  units,
  currentUserRole,
  currentUserId,
  currentUserName,
  onAddSession,
  onUpdateSession
}: PhysicalInventoryProps) {
  // Navigation states
  const [activeView, setActiveView] = useState<'list' | 'live-counting' | 'session-detail'>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // New Session Creator States
  const [newArea, setNewArea] = useState<InventoryArea>('Cocina');
  const [newNotes, setNewNotes] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Rejection modal states
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  // Live Count Editing Temp States
  // Map of productId -> temporary input count
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});

  // Roles access checker
  const isGerenteOrAdmin = ['ADMIN', 'GERENTE'].includes(currentUserRole);
  const isCocinaOrHigher = ['ADMIN', 'GERENTE', 'COCINA'].includes(currentUserRole);

  const getStatusBadge = (status: PhysicalSessionStatus) => {
    switch (status) {
      case 'Borrador': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'En revisión': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Aprobado': return 'bg-emerald-100 text-emerald-800 border-emerald-20 border-emerald-200';
      case 'Rechazado': return 'bg-red-100 text-red-800 border-red-200';
      case 'Cerrado': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCocinaOrHigher) {
      alert('Tu rol (' + currentUserRole + ') no cuenta con permisos para crear sesiones de inventario.');
      return;
    }

    // Capture theoretical stocks of all products at of this moment
    const sessionItems: PhysicalSessionItem[] = products.map(p => ({
      productId: p.id,
      productName: p.name,
      theoreticalStock: p.currentStock,
      physicalStock: null, // Empty count
      difference: null,
      cost: p.averageCost
    }));

    const newSession: PhysicalSession = {
      id: 'phys-' + Math.random().toString(36).substr(2, 9),
      code: 'FIS-' + new Date().getFullYear() + '-' + String(sessions.length + 1).padStart(3, '0'),
      area: newArea,
      date: new Date().toISOString(),
      creatorId: currentUserId,
      creatorName: currentUserName,
      status: 'Borrador',
      items: sessionItems,
      notes: newNotes
    };

    onAddSession(newSession);
    setIsCreatorOpen(false);
    setNewNotes('');

    // Immediately kick of the counting screen!
    setSelectedSessionId(newSession.id);
    // Preset count draft mapping to make it easier for user
    const presetDrafts: Record<string, number> = {};
    sessionItems.forEach(item => {
      // populate with theoretical first as visual hint
      presetDrafts[item.productId] = item.theoreticalStock;
    });
    setDraftCounts(presetDrafts);
    setActiveView('live-counting');
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Resume a session count
  const handleOpenCounting = (session: PhysicalSession) => {
    setSelectedSessionId(session.id);
    const presets: Record<string, number> = {};
    session.items.forEach(item => {
      presets[item.productId] = item.physicalStock === null ? item.theoreticalStock : item.physicalStock;
    });
    setDraftCounts(presets);
    setActiveView('live-counting');
  };

  const handleOpenDetail = (session: PhysicalSession) => {
    setSelectedSessionId(session.id);
    setActiveView('session-detail');
  };

  // Live Count Draft updating
  const handleCountChange = (productId: string, val: string) => {
    setDraftCounts(prev => ({
      ...prev,
      [productId]: Number(val)
    }));
  };

  // Submit counts / Save Borrador
  const handleSaveDraft = (sendToReview = false) => {
    if (!selectedSession) return;

    const updatedItems: PhysicalSessionItem[] = selectedSession.items.map(item => {
      const physical = draftCounts[item.productId] !== undefined ? draftCounts[item.productId] : 0;
      const difference = physical - item.theoreticalStock;
      return {
        ...item,
        physicalStock: physical,
        difference: difference
      };
    });

    const updatedSession: PhysicalSession = {
      ...selectedSession,
      items: updatedItems,
      status: sendToReview ? 'En revisión' : 'Borrador'
    };

    onUpdateSession(updatedSession);
    alert(sendToReview ? 'Inventario enviado a revisión de Gerencia.' : 'Borrador guardado localmente.');
    setActiveView('list');
  };

  // Approve Stock Physical counts
  const handleApproveSession = () => {
    if (!selectedSession) return;
    if (!isGerenteOrAdmin) {
      alert('Se requiere un rol de GERENTE o ADMIN para aprobar diferencias físicas.');
      return;
    }

    const approvedSession: PhysicalSession = {
      ...selectedSession,
      status: 'Aprobado',
      approvedById: currentUserId,
      approvedByName: currentUserName
    };

    onUpdateSession(approvedSession);
    alert('Conteo físico aprobado. El stock de productos ha sido actualizado e ingresado al kárdex.');
    setActiveView('list');
  };

  // Reject session differences trigger
  const handleRejectSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    if (!rejectionReason.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }

    const rejectedSession: PhysicalSession = {
      ...selectedSession,
      status: 'Rechazado',
      rejectionReason: rejectionReason,
      approvedById: currentUserId,
      approvedByName: currentUserName
    };

    onUpdateSession(rejectedSession);
    setRejectionReason('');
    setIsRejectionModalOpen(false);
    alert('Sesión de conteo RECHAZADA. Regresa a borrador de edición.');
    setActiveView('list');
  };

  return (
    <div className="space-y-6" id="physical-inventory-view">
      {/* View Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Inventarios Físicos (Auditoría de Almacén)
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Realiza misiones de conteo, calcula mermas/ajustes y sincroniza diferencias del almacén teórico vs físico.
          </p>
        </div>

        {activeView === 'list' && (
          <button
            onClick={() => {
              if (!isCocinaOrHigher) {
                alert('Privilegios insuficientes. Tu rol no puede programar misiones de conteo.');
                return;
              }
              setIsCreatorOpen(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-sans font-bold transition shadow-md shadow-emerald-50"
            id="btn-create-audit-session"
          >
            <Plus className="w-4.5 h-4.5" />
            Programar Conteo Físico
          </button>
        )}
      </div>

      {/* RENDER VIEW: SESSIONS LIST CONTAINER */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Quick info alert notice card */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-amber-900 font-sans">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Normativa Gastronómica obligatoria:</strong> Para evitar fraudes u omisiones, los ajustes teoréticos no se actualizan editando el registro. Aprobar una sesión física escribe de forma inmediata los correspondientes registros en el kárdex operacional de movimientos.
            </div>
          </div>

          {/* Session history tables */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Desktop Ledger Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Sesión</th>
                    <th className="p-4">Área de Auditoría</th>
                    <th className="p-4">Fecha Planificada</th>
                    <th className="p-4">Planificado Por</th>
                    <th className="p-4">Estatus</th>
                    <th className="p-4 text-center">Productos</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100" id="physical-sessions-table">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                        No hay registros de auditorías físicas creadas...
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-sans font-bold text-slate-800">{s.code}</td>
                        <td className="p-4 text-slate-600 font-semibold">{s.area}</td>
                        <td className="p-4 text-slate-500 font-medium">
                          {new Date(s.date).toLocaleDateString()} {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4 text-slate-500 font-semibold">{s.creatorName}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadge(s.status)}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-500 font-semibold">{s.items.length}</td>
                        <td className="p-4 text-right flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleOpenDetail(s)}
                            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-600 transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(s.status === 'Borrador' || s.status === 'Rechazado') && (
                            <button
                              onClick={() => handleOpenCounting(s)}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-1.5 rounded-lg text-emerald-700 transition"
                              title="Continuar Conteo"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile responsive cards list representation */}
            <div className="md:hidden divide-y divide-slate-100 text-xs" id="mobile-physical-sessions-list">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  No hay registros de auditorías físicas creadas...
                </div>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-slate-800 text-sm font-semibold">{s.code}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          Planificado: {new Date(s.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-650 font-sans leading-relaxed">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Área Auditoría</span>
                        <span className="font-bold text-slate-705">{s.area}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Insumos Registrados</span>
                        <strong className="font-sans text-slate-800 font-bold">{s.items.length} productos</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Organizador: <strong className="font-sans font-bold text-slate-600">{s.creatorName}</strong></span>
                    </div>

                    <div className="pt-2 border-t border-dashed border-slate-100 flex gap-2">
                      <button
                        onClick={() => handleOpenDetail(s)}
                        className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-sans font-bold rounded-xl transition text-center text-xs flex items-center justify-center gap-1"
                      >
                        <Eye className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        Auditar Conteo
                      </button>

                      {(s.status === 'Borrador' || s.status === 'Rechazado') && (
                        <button
                          onClick={() => handleOpenCounting(s)}
                          className="flex-1 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-sans font-bold rounded-xl transition text-center text-xs flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          Conteo Real
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: LIVE COUNTING FORM (For Cocina/Admin to register counts) */}
      {activeView === 'live-counting' && selectedSession && (
        <div className="space-y-6 animate-fade-in" id="counting-session-view">
          {/* Back button */}
          <button
            onClick={() => setActiveView('list')}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Regresar al Historial de Sesiones
          </button>

          {/* Counting status card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-150 text-red-800 font-extrabold py-0.5 px-2 rounded-full uppercase">
                  CONTEO EN PROGRESO
                </span>
                <h3 className="font-display font-extrabold text-xl text-slate-800">
                  {selectedSession.code} — Área: "{selectedSession.area}"
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium font-sans">
                Creado por {selectedSession.creatorName} • Fecha: {new Date(selectedSession.date).toLocaleDateString()}
              </p>
              {selectedSession.notes && (
                <p className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-600 italic mt-3 max-w-xl">
                  Notas de control: "{selectedSession.notes}"
                </p>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-end justify-center">
              <button
                onClick={() => handleSaveDraft(false)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                id="btn-save-draft"
              >
                <Save className="w-4 h-4" />
                Guardar Borrador
              </button>
              <button
                onClick={() => handleSaveDraft(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-50"
                id="btn-send-to-review"
              >
                <Check className="w-4 h-4" />
                Finalizar y Enviar a Revisión
              </button>
            </div>
          </div>

          {/* Counts recording table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Por favor, registra el conteo físico real de cada ingrediente activo:</span>
              <span className="text-slate-400 font-medium">Se muestran cantidades teóricas como base de referencia.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Ingrediente comercial</th>
                    <th className="p-4 text-right">Existencia Teórica</th>
                    <th className="p-4 text-center">Unidad</th>
                    <th className="p-4 text-center">Conteo Físico Real *</th>
                    <th className="p-4 text-right">Diferencia</th>
                    <th className="p-4 text-right">Costo unitario promedio</th>
                    <th className="p-4 text-right">Impacto Financiero</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100" id="counting-items-table-body">
                  {selectedSession.items.map((item) => {
                    const enteredCount = draftCounts[item.productId] !== undefined ? draftCounts[item.productId] : item.theoreticalStock;
                    const diff = enteredCount - item.theoreticalStock;
                    const diffCostValue = diff * item.cost;
                    const prod = products.find(p => p.id === item.productId);
                    const isOutOfStock = enteredCount <= 0;
                    const isDiffNegative = diff < 0;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/50 transition">
                        {/* Name */}
                        <td className="p-4">
                          <p className="font-sans font-bold text-slate-800 text-sm leading-tight">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{prod ? prod.description : ''}</p>
                        </td>

                        {/* Theoretical stock */}
                        <td className="p-4 text-right font-mono text-slate-500 font-semibold">
                          {item.theoreticalStock.toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                        </td>

                        {/* Unit code */}
                        <td className="p-4 text-center text-slate-400 font-mono font-medium">
                          {prod ? units.find(u => u.id === prod.unitId)?.code : 'und'}
                        </td>

                        {/* Counter Input */}
                        <td className="p-4 text-center w-40">
                          <input
                            type="number"
                            step="any"
                            value={enteredCount}
                            onChange={(e) => handleCountChange(item.productId, e.target.value)}
                            className="w-24 text-center bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-lg py-1.5 text-xs font-mono font-bold text-slate-800"
                          />
                        </td>

                        {/* Differences */}
                        <td className={`p-4 text-right font-mono font-bold ${diff === 0 ? 'text-slate-400' : isDiffNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                          {diff === 0 ? 'Sin desvío' : `${diff > 0 ? '+' : ''}${diff.toLocaleString('es-DO', { minimumFractionDigits: 1 })}`}
                        </td>

                        {/* Average cost */}
                        <td className="p-4 text-right font-mono font-semibold text-slate-500">
                          RD${item.cost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Discrepancy Cost impact */}
                        <td className={`p-4 text-right font-mono font-bold ${diffCostValue === 0 ? 'text-slate-400' : diffCostValue < 0 ? 'text-red-600' : 'text-emerald-650'}`}>
                          {diffCostValue === 0 ? 'RD$0.00' : `${diffCostValue < 0 ? '-' : '+'}$${Math.abs(diffCostValue).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: SESSION DETAILED DATA SUMMARY (Review, approve, or reject) */}
      {activeView === 'session-detail' && selectedSession && (
        <div className="space-y-6 animate-fade-in" id="detail-session-view">
          {/* Breadcrumb */}
          <button
            onClick={() => setActiveView('list')}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Regresar al Historial de Sesiones
          </button>

          {/* Session Overview header details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(selectedSession.status)}`}>
                    {selectedSession.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono tracking-wide">Código Único: {selectedSession.id}</span>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-2">
                  Auditoría Física: {selectedSession.code}
                </h3>
                <p className="text-xs text-slate-400 font-sans font-medium mt-1">
                  Área: <strong className="text-slate-600 font-semibold">"{selectedSession.area}"</strong> • Planificador: <strong className="text-slate-600 font-semibold">{selectedSession.creatorName}</strong> • Creado el {new Date(selectedSession.date).toLocaleString()}
                </p>
              </div>

              {/* Approval controls for ADMIN and GERENTE */}
              {selectedSession.status === 'En revisión' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!isGerenteOrAdmin) {
                        alert('Privilegios insuficientes. Solo administradores o gerentes de restaurante pueden rechazar conteos.');
                        return;
                      }
                      setIsRejectionModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-red-250 text-red-650 hover:bg-red-50 rounded-xl text-xs font-bold transition"
                    id="btn-reject-session"
                  >
                    <XCircle className="w-4.5 h-4.5" />
                    Rechazar Conteo
                  </button>
                  <button
                    onClick={handleApproveSession}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-50"
                    id="btn-approve-session"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    Aprobar y Ajustar Stock
                  </button>
                </div>
              )}
            </div>

            {/* Rejection notice box if rejected */}
            {selectedSession.status === 'Rechazado' && selectedSession.rejectionReason && (
              <div className="p-4 bg-red-50 border border-red-150 rounded-xl text-xs text-red-900 leading-relaxed font-sans">
                <strong>Motivo de rechazo por Gerencia:</strong> "{selectedSession.rejectionReason}"
              </div>
            )}

            {/* Approved by logs info */}
            {selectedSession.status === 'Aprobado' && selectedSession.approvedByName && (
              <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-xs text-emerald-900 leading-relaxed font-sans flex items-center justify-between">
                <span>
                  ✔ <strong>Movimientos operacionales sincronizados:</strong> Sesión auditada y firmada digitalmente por <strong>{selectedSession.approvedByName}</strong>.
                </span>
                <span className="text-[10px] font-mono font-medium text-emerald-600 uppercase bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Kárdex cerrado
                </span>
              </div>
            )}
          </div>

          {/* Suministros table recap */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Recapitulación de Diferencias:</span>
              <span className="text-slate-400 font-medium">Comparativa oficial consolidada de existencias.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Ingrediente comercial</th>
                    <th className="p-4 text-right">Existencia Teorética</th>
                    <th className="p-4 text-center">Unidad</th>
                    <th className="p-4 text-right">Conteo Físico Real</th>
                    <th className="p-4 text-right">Diferencia</th>
                    <th className="p-4 text-right">Costo promedio</th>
                    <th className="p-4 text-right">Impacto Financiero</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100" id="detail-items-table-body">
                  {selectedSession.items.map((item) => {
                    const physical = item.physicalStock === null ? 'Pendiente' : item.physicalStock;
                    const diff = item.difference ?? 0;
                    const isDiffNegative = diff < 0;
                    const currentCostVal = diff * item.cost;
                    const prod = products.find(p => p.id === item.productId);

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-sans font-bold text-slate-800">{item.productName}</td>
                        <td className="p-4 text-right font-mono font-medium text-slate-500">
                          {item.theoreticalStock.toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                        </td>
                        <td className="p-4 text-center text-slate-400 font-mono">
                          {prod ? units.find(u => u.id === prod.unitId)?.code : 'und'}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-700">
                          {typeof physical === 'number' ? physical.toLocaleString('es-DO', { minimumFractionDigits: 1 }) : physical}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${diff === 0 ? 'text-slate-400' : isDiffNegative ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.physicalStock === null ? '-' : diff === 0 ? '0.0' : `${diff > 0 ? '+' : ''}${diff.toLocaleString('es-DO', { minimumFractionDigits: 1 })}`}
                        </td>
                        <td className="p-4 text-right font-mono font-semibold text-slate-500">
                          RD${item.cost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${currentCostVal === 0 ? 'text-slate-400' : currentCostVal < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                          {item.physicalStock === null ? '-' : currentCostVal === 0 ? 'RD$0.00' : `${currentCostVal < 0 ? '-' : '+'}$${Math.abs(currentCostVal).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG/MODAL: PROGRAM NEW SESSION */}
      {isCreatorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-session-creator">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base text-slate-800">Programar Sesión de Inventario Físico</h3>
              <button onClick={() => setIsCreatorOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-5 space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Área / Almacén a Auditar *</label>
                <select
                  required
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value as any)}
                  className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none"
                >
                  <option value="Cocina">Cocina principal</option>
                  <option value="Bar">Barra de bebidas y licores</option>
                  <option value="Almacén seco">Almacén seco (Abarrotes y conservas)</option>
                  <option value="Refrigerados">Cámara fría (Refrigerados)</option>
                  <option value="Congelados">Cámara congeladores</option>
                  <option value="Limpieza">Bodega artículos de limpieza</option>
                  <option value="Desechables">Almacén desechables</option>
                  <option value="Otro">Otro silo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Notas de Control / Objetivo de Auditoría</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ej. Realizar al cierre del turno. Concentrarse en cortes de carne, mermas de tomate..."
                  className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-3 outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl leading-relaxed text-[11px] text-blue-900">
                <strong className="font-bold">Información de captura:</strong> La carga pre-configurará instantáneamente todos los ingredientes del catálogo y sus existencias teóricas actuales para iniciar el conteo.
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatorOpen(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded transition shadow-sm"
                >
                  Iniciar Conteo Físico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG/MODAL: REJECT THEORETICAL DIFFERENCES */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-session-rejection">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-sm text-slate-800">Indicar Motivo de Rechazo</h3>
              <button onClick={() => setIsRejectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSessionSubmit} className="p-4 space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Explicación del Rechazo (Obligatorio) *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej. Cantidades incongruentes en Rioja, favor de volver a contar o solicitar recalibración de balanza..."
                  className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-3 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectionModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                >
                  Guardar rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
