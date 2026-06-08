import React, { useState } from 'react';
import {
  ChefHat,
  Plus,
  Eye,
  Check,
  X,
  ShoppingCart,
  Trash2,
  Calendar,
  User,
  MessageSquare,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { KitchenRequest, Product, Unit, Role, KitchenRequestStatus, KitchenRequestItem } from '../types';

interface KitchenRequestsProps {
  requests: KitchenRequest[];
  products: Product[];
  units: Unit[];
  currentUserRole: Role;
  currentUserId: string;
  currentUserName: string;
  onAddRequest: (req: KitchenRequest) => void;
  onUpdateRequest: (req: KitchenRequest) => void;
  onConvertRequestToPurchase: (req: KitchenRequest) => void;
}

export default function KitchenRequestsView({
  requests,
  products,
  units,
  currentUserRole,
  currentUserId,
  currentUserName,
  onAddRequest,
  onUpdateRequest,
  onConvertRequestToPurchase
}: KitchenRequestsProps) {
  // View states
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  // New Request Form States
  const [newNotes, setNewNotes] = useState('');
  const [formItems, setFormItems] = useState<{ productId: string; qty: number }[]>([
    { productId: products[0]?.id || '', qty: 1 }
  ]);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Authorization flags
  const isCocinaOrHigher = ['ADMIN', 'GERENTE', 'COCINA'].includes(currentUserRole);
  const isGerenteOrAdmin = ['ADMIN', 'GERENTE'].includes(currentUserRole);
  const isComprasOrHigher = ['ADMIN', 'COMPRAS', 'GERENTE'].includes(currentUserRole);

  const getStatusBadge = (status: KitchenRequestStatus) => {
    switch (status) {
      case 'Borrador': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Aprobada': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rechazada': return 'bg-red-100 text-red-800 border-red-200';
      case 'Convertida': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-850 border-gray-200';
    }
  };

  const handleAddProductRow = () => {
    setFormItems([...formItems, { productId: products[0]?.id || '', qty: 1 }]);
  };

  const handleRemoveProductRow = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: 'productId' | 'qty', value: any) => {
    const updated = [...formItems];
    if (field === 'productId') {
      updated[index].productId = value;
    } else {
      updated[index].qty = Number(value);
    }
    setFormItems(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCocinaOrHigher) {
      alert('No cuentas con permisos para registrar solicitudes internas de cocina.');
      return;
    }
    if (formItems.length === 0) {
      alert('Debes ingresar al menos un insumo en la solicitud.');
      return;
    }

    const itemsMapped: KitchenRequestItem[] = formItems.map(item => ({
      productId: item.productId,
      qty: item.qty,
      unitId: products.find(p => p.id === item.productId)?.unitId || 'uni-1'
    }));

    const newRequest: KitchenRequest = {
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      code: 'SOL-' + new Date().getFullYear() + '-' + String(requests.length + 1).padStart(3, '0'),
      date: new Date().toISOString(),
      items: itemsMapped,
      status: 'Pendiente', // Solicitud enviada directamente como Pendiente para flujo real
      creatorId: currentUserId,
      creatorName: currentUserName,
      notes: newNotes
    };

    onAddRequest(newRequest);
    alert('Solicitud de cocina enviada a aprobación correctamente.');
    setNewNotes('');
    setFormItems([{ productId: products[0]?.id || '', qty: 1 }]);
    setActiveView('list');
  };

  const selectedRequest = requests.find(r => r.id === selectedReqId);

  // Approval handler
  const handleApprove = () => {
    if (!selectedRequest) return;
    if (!isGerenteOrAdmin) {
      alert('Se requiere el rol de GERENTE o ADMIN para autorizar requisiciones.');
      return;
    }

    const updated: KitchenRequest = {
      ...selectedRequest,
      status: 'Aprobada',
      approvedById: currentUserId,
      approvedByName: currentUserName
    };

    onUpdateRequest(updated);
    alert('Solicitud autorizada. Ya puede ser surtida o comprada.');
    setActiveView('list');
  };

  // Rejection submit
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      alert('Se requiere un motivo obligatorio para el rechazo de la solicitud.');
      return;
    }

    const updated: KitchenRequest = {
      ...selectedRequest,
      status: 'Rechazada',
      reason: rejectionReason,
      approvedById: currentUserId,
      approvedByName: currentUserName
    };

    onUpdateRequest(updated);
    setRejectionReason('');
    setIsRejectModalOpen(false);
    alert('Solicitud rechazada con éxito.');
    setActiveView('list');
  };

  // Convert request to Purchase Order
  const handleConvertToPurchase = () => {
    if (!selectedRequest) return;
    if (!isComprasOrHigher) {
      alert('Se requiere rol de COMPRAS, GERENTE o ADMIN para convertir requisiciones a compras.');
      return;
    }

    onConvertRequestToPurchase(selectedRequest);
  };

  return (
    <div className="space-y-6" id="kitchen-requests-view">
      {/* View Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Requisiciones y Solicitudes de Cocina
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Control de desabasto interno, solicitudes de ingredientes de brigada culinaria y conversor de aprovisionamientos.
          </p>
        </div>

        {activeView === 'list' && (
          <button
            onClick={() => {
              if (!isCocinaOrHigher) {
                alert('Privilegios insuficientes. Tu rol no puede registrar suministros.');
                return;
              }
              setActiveView('create');
            }}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 rounded text-xs font-sans font-bold transition shadow-sm"
            id="btn-new-request"
          >
            <Plus className="w-4.5 h-4.5" />
            Crear Solicitud Cocina
          </button>
        )}
      </div>

      {/* RENDER VIEW: LIST */}
      {activeView === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Desktop/Tablet table representation */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Requisición</th>
                  <th className="p-4">Fecha Solicitada</th>
                  <th className="p-4">Solicitante</th>
                  <th className="p-4">Insumos</th>
                  <th className="p-4">Estatus</th>
                  <th className="p-4">Autorizado Por</th>
                  <th className="p-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="requests-table-body">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      No hay solicitudes registradas en este período.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-sans font-bold text-slate-800">{r.code}</td>
                      <td className="p-4 text-slate-550 font-medium">
                        {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-slate-600 font-semibold">{r.creatorName}</td>
                      <td className="p-4 text-slate-500 font-mono font-semibold">
                        {r.items.length} {r.items.length === 1 ? 'insumo' : 'insumos'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-semibold">{r.approvedByName || '—'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReqId(r.id);
                            setActiveView('detail');
                          }}
                          className="py-1 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition text-xs"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive cards list representation */}
          <div className="md:hidden divide-y divide-slate-100 text-xs" id="mobile-requests-list">
            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No hay solicitudes de cocina registradas.
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-slate-800 text-sm">{r.code}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        {new Date(r.date).toLocaleDateString()} {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-650 font-sans leading-relaxed">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Solicitante</span>
                      <span className="font-bold text-slate-705">{r.creatorName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Insumos</span>
                      <span className="font-mono text-slate-800 font-bold">{r.items.length} {r.items.length === 1 ? 'insumo' : 'insumos'}</span>
                    </div>
                  </div>

                  {r.approvedByName && (
                    <div className="bg-emerald-50/40 p-2.5 rounded-xl text-[10px] text-emerald-800 flex items-center gap-1.5 border border-emerald-100/50">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Autorizado por: <strong className="font-sans font-extrabold text-emerald-900">{r.approvedByName}</strong></span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-dashed border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedReqId(r.id);
                        setActiveView('detail');
                      }}
                      className="w-full py-2.5 bg-orange-55 border border-orange-200/80 hover:bg-orange-100 text-orange-700 font-sans font-bold rounded-xl transition text-center text-xs flex items-center justify-center gap-1"
                    >
                      Revisar Detalles &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW: CREATE REQUEST (FOR COCINA/STAFF) */}
      {activeView === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 max-w-3xl animate-fade-in" id="create-request-form">
          {/* Back breadcrumb */}
          <button
            onClick={() => setActiveView('list')}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Regresar al Listado
          </button>

          <div>
            <h3 className="font-display font-extrabold text-xl text-slate-800">
              Registrar Nueva Solicitud Excepcional de Insumos
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Las solicitudes autorizadas son consolidadas por el módulo de Compras para su reposición inmediata.
            </p>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-6 text-xs font-sans">
            {/* Form list rows selection */}
            <div className="space-y-3.5">
              <label className="block text-slate-500 font-bold uppercase text-[9px]">Ingredientes Requeridos *</label>

              {formItems.map((formItem, index) => {
                const selectedProd = products.find(p => p.id === formItem.productId);
                const uniCode = selectedProd ? units.find(u => u.id === selectedProd.unitId)?.code : 'und';

                return (
                  <div key={index} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {/* Item selector */}
                    <div className="flex-1 min-w-0">
                      <select
                        required
                        value={formItem.productId}
                        onChange={(e) => handleRowChange(index, 'productId', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800 outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({units.find(u => u.id === p.unitId)?.code}) — En Almacén: {p.currentStock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity field */}
                    <div className="w-28 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 text-slate-800">
                      <input
                        type="number"
                        step="any"
                        required
                        min="0.1"
                        value={formItem.qty}
                        onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
                        className="w-full bg-transparent p-2 text-center text-xs outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{uniCode}</span>
                    </div>

                    {/* Remove button */}
                    {formItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(index)}
                        className="p-2 text-red-650 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddProductRow}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold"
              >
                + Añadir renglón producto
              </button>
            </div>

            {/* General notes */}
            <div>
              <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1.5">Comentarios de Relevancia o Justificación de Urgencia</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ej. Requerimos aguacate Hass urgente, no tenemos reservas para la cena de hoy..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="px-4 py-2 border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold transition shadow-sm"
              >
                Enviar Solicitud a Revisión
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RENDER VIEW: KITCHEN REQUEST DETAILS AND APPROVAL PAGE */}
      {activeView === 'detail' && selectedRequest && (
        <div className="space-y-6 animate-fade-in text-xs font-sans" id="detail-request-view">
          {/* Return breadcrumbs button */}
          <button
            onClick={() => setActiveView('list')}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Regresar al Listado de Solicitudes
          </button>

          {/* Core Info Details card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadge(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
                <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-2.5 leading-none">
                  Requisición Interna {selectedRequest.code}
                </h3>
                <p className="text-slate-400 mt-1.5 font-medium">
                  Solicitante: <strong className="text-slate-600 font-semibold">{selectedRequest.creatorName}</strong> • Canalizada el {new Date(selectedRequest.date).toLocaleDateString()} a las {new Date(selectedRequest.date).toLocaleTimeString()}
                </p>
              </div>

              {/* Action Buttons depending on status */}
              <div className="flex flex-wrap gap-2">
                {selectedRequest.status === 'Pendiente' && isGerenteOrAdmin && (
                  <>
                    <button
                      onClick={() => {
                        if (!isGerenteOrAdmin) {
                          alert('Se requiere el rol de Gerente u Admin para rechazar requisiciones.');
                          return;
                        }
                        setIsRejectModalOpen(true);
                      }}
                      className="px-4 py-2 border border-red-250 text-red-650 hover:bg-red-50 rounded-xl font-bold transition"
                      id="btn-reject-request"
                    >
                      Rechazar Solicitud
                    </button>
                    <button
                      onClick={handleApprove}
                      className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold transition shadow-sm"
                      id="btn-approve-request"
                    >
                      Aprobar Solicitud
                    </button>
                  </>
                )}

                {selectedRequest.status === 'Aprobada' && isComprasOrHigher && (
                  <button
                    onClick={handleConvertToPurchase}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-md shadow-indigo-50"
                    id="btn-convert-request"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Surtir / Convertir en Orden de Compra
                  </button>
                )}
              </div>
            </div>

            {/* Rejection comment notice display in file detail */}
            {selectedRequest.status === 'Rechazada' && selectedRequest.reason && (
              <div className="p-4 bg-red-50 border border-red-150 rounded-xl text-red-900 leading-relaxed font-sans">
                <strong>Motivo de rechazo de solicitud (Gerencial):</strong> "{selectedRequest.reason}"
              </div>
            )}

            {/* Approved by and notes summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-xl font-sans text-slate-650">
                <span className="block font-bold text-slate-400 uppercase text-[9px] mb-1 leading-none">Comentarios de cocina:</span>
                <p className="italic leading-normal">"{selectedRequest.notes || 'Ninguno propiciado'}"</p>
              </div>

              {selectedRequest.approvedByName && (
                <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-xl font-sans text-slate-650">
                  <span className="block font-bold text-slate-400 uppercase text-[9px] mb-1 leading-none">Seguimiento de Autorización:</span>
                  <p className="leading-normal font-semibold">Procesado por <strong>{selectedRequest.approvedByName}</strong> con privilegios del Celler.</p>
                </div>
              )}
            </div>
          </div>

          {/* Requested Items Table list */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="font-bold text-slate-700">Insumos solicitados:</span>
              <span className="text-slate-400 font-medium">Cantidades oficiales autorizadas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Alimento o Producto</th>
                    <th className="p-4">Categoría del Catálogo</th>
                    <th className="p-4">Existencia Actual Almacén</th>
                    <th className="p-4 text-center">Cantidad Solicitada</th>
                    <th className="p-4 text-center">Unidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRequest.items.map((item) => {
                    const prod = products.find(p => p.id === item.productId);
                    const uni = units.find(u => u.id === item.unitId);

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-sans font-bold text-slate-800">{prod ? prod.name : 'Ingrediente Descatalogado'}</td>
                        <td className="p-4 text-slate-600 font-semibold">{prod ? products.find(p => p.id === item.productId)?.categoryId === 'cat-1' ? 'Carnes' : 'Verduras' : 'N/A'}</td>
                        <td className="p-4 font-mono font-medium text-slate-500">{prod ? prod.currentStock : 0} {uni?.code}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-800">{item.qty}</td>
                        <td className="p-4 text-center text-slate-400 font-mono font-medium">{uni ? uni.code : 'und'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG/MODAL: REJECTION FORM */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-reject-reason">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-sm text-slate-800">Indicar Motivo de Rechazo de Solicitud</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-4 space-y-4 font-sans text-xs">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Motivo de Rechazo (Obligatorio) *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Por favor explica por qué rechazas la solicitud. Ej. No hay presupuesto, usar inventario existente, compra programada..."
                  className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-3 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-red-650 hover:bg-red-500 text-white font-bold rounded-lg"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
