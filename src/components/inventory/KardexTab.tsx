import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  History,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  User,
  MapPin,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { InventoryMovement, Product, Unit } from '../../types';

interface KardexTabProps {
  movements: InventoryMovement[];
  products: Product[];
  units: Unit[];
  preSelectedProductId?: string | null;
  onClearPreselection?: () => void;
}

export default function KardexTab({
  movements,
  products,
  units,
  preSelectedProductId,
  onClearPreselection
}: KardexTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>(preSelectedProductId || 'all');

  // Sync state if pre-selected product changes via quick redirect
  useEffect(() => {
    if (preSelectedProductId) {
      setSelectedProductFilter(preSelectedProductId);
    }
  }, [preSelectedProductId]);

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'INITIAL_STOCK':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Entrada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Salida':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Merma':
        return 'bg-red-100 text-red-00 text-red-800 border-red-200';
      case 'Ajuste':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Transferencia':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filtered = movements.filter(m => {
    const matchesSearch = m.productName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || m.type === selectedType;
    const matchesArea = selectedArea === 'all' || m.area === selectedArea;
    const matchesProduct = selectedProductFilter === 'all' || m.productId === selectedProductFilter;

    return matchesSearch && matchesType && matchesArea && matchesProduct;
  });

  return (
    <div className="space-y-6 text-xs font-sans" id="kardex-tab-container">
      {/* Search Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por insumo, motivo, comentario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-orange-500 transition"
            />
          </div>

          {/* Product Selective filter */}
          <select
            value={selectedProductFilter}
            onChange={(e) => {
              setSelectedProductFilter(e.target.value);
              if (e.target.value === 'all' && onClearPreselection) {
                onClearPreselection();
              }
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none focus:bg-white"
          >
            <option value="all">📦 Filtrar Insumo (Todos)</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Category Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none focus:bg-white"
          >
            <option value="all">🔄 Tipo de Movimiento (Todos)</option>
            <option value="INITIAL_STOCK">Carga Inicial (INITIAL_STOCK)</option>
            <option value="Entrada">Entradas por Compra</option>
            <option value="Salida">Recetas / Consumos</option>
            <option value="Merma">Mermas / Desechos</option>
            <option value="Ajuste">Ajustes manuales</option>
            <option value="Transferencia">Transferencia de bodega</option>
          </select>

          {/* Area filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none"
          >
            <option value="all">📍 Área Física (Todos)</option>
            <option value="Cocina">Cocina principal</option>
            <option value="Bar">Barra de bebidas</option>
            <option value="Almacén seco">Almacén seco</option>
            <option value="Refrigerados">Cámara refrigeradora</option>
            <option value="Congelados">Cámara congeladora</option>
          </select>
        </div>

        {preSelectedProductId && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-orange-850">
            <span>Filtro activo: <strong>{products.find(p => p.id === preSelectedProductId)?.name}</strong></span>
            <button
              onClick={() => {
                setSelectedProductFilter('all');
                if (onClearPreselection) onClearPreselection();
              }}
              className="hover:bg-orange-200 rounded-full p-0.5 text-orange-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* HISTORIC MOVEMENT LOG GRAPHICS GRID */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            Historial de Kárdex Filtrado ({filtered.length} registros)
          </span>
          <span className="text-slate-400 font-mono">Registro oficial inmutable</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/40 border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="p-3">Fecha y Hora</th>
                <th className="p-3">ID Movimiento</th>
                <th className="p-3">Insumo / Producto</th>
                <th className="p-3">Evento</th>
                <th className="p-3 text-right">Cantidad</th>
                <th className="p-3 text-right">Anterior</th>
                <th className="p-3 text-right">Posterior</th>
                <th className="p-3">Ubicación</th>
                <th className="p-3">Operador</th>
                <th className="p-3">Motivo / Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="kardex-table-body">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 font-sans font-medium">
                    No se encontraron transacciones en el kárdex con estos filtros...
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const qtySign = ['Salida', 'Merma'].includes(m.type) || m.qty < 0 ? '-' : '+';
                  const isNegativeValue = qtySign === '-';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/30 transition">
                      <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">{m.id}</td>
                      <td className="p-3 font-bold text-slate-800">{m.productName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getMovementBadge(m.type)}`}>
                          {m.type === 'INITIAL_STOCK' ? 'STOCK INICIAL' : m.type}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">
                        <span className={`${isNegativeValue ? 'text-red-650' : 'text-emerald-700'}`}>
                          {qtySign}{Math.abs(m.qty).toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                        </span>{' '}
                        <span className="text-[9px] text-slate-400 font-normal">{m.unitCode}</span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-400">
                        {m.quantityBefore.toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-800 font-bold">
                        {m.quantityAfter.toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{m.area}</td>
                      <td className="p-3 text-slate-505 font-medium">{m.userName || 'Sistema'}</td>
                      <td className="p-3 max-w-[200px]" title={m.comment}>
                        <p className="font-semibold text-slate-700 truncate">{m.reason}</p>
                        {m.comment && <p className="text-[10px] text-slate-400 mt-0.5 italic truncate">{m.comment}</p>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
