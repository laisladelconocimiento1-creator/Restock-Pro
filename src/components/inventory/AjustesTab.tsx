import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  History,
  CheckCircle,
  TrendingDown,
  Warehouse,
  Scale
} from 'lucide-react';
import { Product, Category, Unit, Role, MovementType, InventoryArea } from '../../types';

interface AjustesTabProps {
  products: Product[];
  units: Unit[];
  currentUserRole: Role;
  currentUserId: string;
  currentUserName: string;
  onApplyAdjustment: (
    productId: string,
    quantity: number,
    type: MovementType,
    area: InventoryArea,
    reason: string,
    comment: string
  ) => void;
  onSwitchTab: (tab: string) => void;
}

export default function AjustesTab({
  products,
  units,
  currentUserRole,
  currentUserId,
  currentUserName,
  onApplyAdjustment,
  onSwitchTab
}: AjustesTabProps) {
  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjType, setAdjType] = useState<MovementType>('Ajuste');
  const [adjArea, setAdjArea] = useState<InventoryArea>('Cocina');
  const [adjQty, setAdjQty] = useState<number>(0);
  const [reason, setReason] = useState('Auditoría física semanal');
  const [comment, setComment] = useState('');

  const [lastLoggedAdjustments, setLastLoggedAdjustments] = useState<any[]>([]);

  const isOperator = ['ADMIN', 'GERENTE', 'COCINA', 'RECEPCIÓN'].includes(currentUserRole);

  const getUnitCode = (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return 'und';
    return units.find(u => u.id === p.unitId)?.code || 'und';
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOperator) {
      alert('Tu rol de usuario (' + currentUserRole + ') no cuenta con permisos suficientes para realizar ajustes manuales directos.');
      return;
    }

    if (!selectedProductId) {
      alert('Debe seleccionar obligatoriamente un producto comercial de la lista.');
      return;
    }

    if (adjQty <= 0) {
      alert('Especifique una cantidad real de ajuste mayor a cero.');
      return;
    }

    if (!comment.trim()) {
      alert('Debes incluir comentarios detallados de auditoría explicando la discrepancia.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    // Trigger store event
    onApplyAdjustment(selectedProductId, adjQty, adjType, adjArea, reason, comment);

    // Keep locally to show instantaneous confirmation log
    const receipt = {
      id: 'ajs-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
      productName: prod.name,
      qty: adjQty,
      type: adjType,
      area: adjArea,
      reason: reason,
      date: new Date().toLocaleTimeString(),
      comment: comment
    };

    setLastLoggedAdjustments(prev => [receipt, ...prev]);

    // Reset Form
    setAdjQty(0);
    setComment('');
    alert('Ajuste operacional registrado exitosamente. Se ha sincronizado el Kárdex en tiempo real.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-xs" id="ajustes-tab-container">
      {/* Policy Warning Card */}
      <div className="bg-amber-50 border border-amber-205 rounded-xl p-4 flex gap-3 text-amber-900 leading-relaxed font-sans">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Política Estricta de Gestión de Almacén:</strong> 
          En cumplimiento con procesos de auditoría del restaurante, las modificaciones directas a la columna de stock están deshabilitadas. Todo aumento o mitigación física de mercancía debe ser registrado a través de este panel y se verá reflejado en el Kárdex de movimientos.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* INPUT ADJUSTMENT FORM */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h3 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Warehouse className="w-4.5 h-4.5 text-orange-500" />
            Declaración de Movimiento / Ajuste Operacional
          </h3>

          <form onSubmit={handleApply} className="space-y-4 pt-4">
            <div>
              <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Insumo a modificar *</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setAdjQty(0);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold outline-none focus:bg-white focus:border-orange-500 transition"
              >
                <option value="">-- Seleccionar el Insumo del Catálogo --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock Actual: {p.currentStock} {getUnitCode(p.id)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Tipo de Evento *</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as MovementType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:bg-white transition"
                >
                  <option value="Ajuste">Ajuste Manual (Diferencia Física)</option>
                  <option value="Merma">Merma (Daño o Descomposición)</option>
                  <option value="Transferencia">Transferencia Interna</option>
                  <option value="Entrada">Carga Extra (Entrada)</option>
                  <option value="Salida">Consumo Interno (Salida)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Área / Almacén de impacto *</label>
                <select
                  value={adjArea}
                  onChange={(e) => setAdjArea(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:bg-white"
                >
                  <option value="Cocina">Cocina principal</option>
                  <option value="Bar">Barra de bebidas y licores</option>
                  <option value="Almacén seco">Almacén seco</option>
                  <option value="Refrigerados">Refrigerados</option>
                  <option value="Congelados">Congelados</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Cantidad del Ajuste *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={adjQty === 0 ? '' : adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value))}
                    placeholder="Cantidad real"
                    className="w-full bg-slate-55 border border-slate-205 rounded-lg pl-3 pr-10 py-2 outline-none text-slate-850 font-bold font-mono focus:bg-white focus:border-orange-500"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-mono font-semibold">
                    {selectedProductId ? getUnitCode(selectedProductId) : 'und'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Causa del Movimiento *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Daño de empaque, auditoría nocturna..."
                  className="w-full bg-slate-55 border border-slate-205 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Explicación para Auditoría (MANDATORIO) *</label>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Explique las causas operativas de este ajuste. Detalle quién autorizó o bajo qué circunstancias se detectó la desviación (ej. Se detectó merma de merluza por corte de refrigerador)."
                className="w-full bg-slate-55 border border-slate-205 rounded-lg p-3 outline-none text-slate-800 focus:bg-white focus:border-orange-500"
              />
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <span className="text-slate-650">Ingresado por: <strong>{currentUserName}</strong> ({currentUserRole})</span>
              <span className="text-[9.5px] uppercase bg-white px-2 py-0.5 rounded font-mono font-bold text-indigo-700">Audit Trace Activado</span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onSwitchTab('existencias')}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 font-bold rounded-lg"
              >
                Volver a Existencias
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition"
              >
                Registrar Movimiento e Inyectar en Kárdex
              </button>
            </div>
          </form>
        </div>

        {/* RECENT STREAM FEEDBACK */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-550 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-400" />
            Registro de la Sesión Actual
          </h3>

          {lastLoggedAdjustments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-100/60 text-slate-400">
              <FileText className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="text-[11px]">No se han registrado modificaciones en esta sesión de trabajo.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {lastLoggedAdjustments.map((a) => (
                <div key={a.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold">{a.id}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{a.date}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight">{a.productName}</h4>
                    <span className="text-[10px] text-slate-500 font-medium">{a.type} • {a.area}</span>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-slate-50/60 p-2 border border-slate-100 rounded">
                    <strong>Motivo:</strong> {a.reason}
                    <p className="mt-1 italic text-[10px] text-slate-500">"{a.comment}"</p>
                  </div>

                  <span className="text-[10.5px] block font-semibold text-emerald-700 text-right">Cantidad: +{a.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
