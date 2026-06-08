import React, { useState } from 'react';
import { History, Search, Filter, HelpCircle, BadgeCheck, FileText, ArrowUpDown } from 'lucide-react';
import { InventoryMovement, Role } from '../types';

interface MovementsViewProps {
  movements: InventoryMovement[];
}

export default function MovementsView({ movements }: MovementsViewProps) {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.comment || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesArea = filterArea === 'all' || m.area === filterArea;

    return matchesSearch && matchesType && matchesArea;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="movements-view">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Kárdex Operativo de Movimientos
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Historial cronológico de entradas, salidas, mermas de cocina y ajustes por auditoría física. Registros estrictamente inalterables.
          </p>
        </div>
      </div>

      {/* Filters search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3.5 text-xs font-sans">
        {/* Search input */}
        <div className="flex-1 relative">
          <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Filtrar por término</span>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre de producto, usuario que registró o comentario de ajuste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 outline-none focus:bg-white focus:border-emerald-600 transition"
              id="input-movements-search"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-48">
          <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Tipo de Movilización</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
            id="select-movements-type"
          >
            <option value="all">Todos los Tipos</option>
            <option value="Entrada">Entrada (Compra / Carga)</option>
            <option value="Salida">Salida (Consumos)</option>
            <option value="Merma">Merma o Pérdida</option>
            <option value="Ajuste">Ajuste por Auditoría</option>
            <option value="Devolución">Devolución a Proveedor</option>
          </select>
        </div>

        {/* Area filter */}
        <div className="w-full sm:w-48">
          <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Área o Bodega</span>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none"
            id="select-movements-area"
          >
            <option value="all">Todas las Bodegas</option>
            <option value="Cocina">Cocina principal</option>
            <option value="Bar">Barra de bebidas</option>
            <option value="Almacén seco">Almacén seco</option>
            <option value="Refrigerados">Cámara refrigeradora</option>
            <option value="Congelados">Congelador</option>
            <option value="Limpieza">Almacén de limpieza</option>
            <option value="Desechables">Desechables</option>
            <option value="Otro">Otro silo</option>
          </select>
        </div>
      </div>

      {/* Movements Table Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Tipo Movimiento</th>
                <th className="p-4 text-right">Cantidad de desvío</th>
                <th className="p-4 text-center">Unidad</th>
                <th className="p-4 text-right">Existencia Anterior</th>
                <th className="p-4 text-right">Existencia Posterior</th>
                <th className="p-4">Bodega / Área</th>
                <th className="p-4">Responsable de Captura</th>
                <th className="p-4">Motivo / Explicación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans" id="movements-table-body">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400 font-medium font-sans">
                     No se han registrado movimientos todavía bajo esta selección...
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isPositive = m.qty > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition">
                      {/* Date */}
                      <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Product Name */}
                      <td className="p-4 font-sans font-bold text-slate-800">{m.productName}</td>

                      {/* Type Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          m.type === 'Entrada'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : m.type === 'Salida'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : m.type === 'Merma'
                            ? 'bg-rose-100 text-rose-800 border-rose-250'
                            : m.type === 'Ajuste'
                            ? 'bg-amber-50 text-amber-705 border-amber-200'
                            : 'bg-indigo-50 text-indigo-705 border-indigo-200'
                        }`}>
                          {m.type}
                        </span>
                      </td>

                      {/* Quantity desvío */}
                      <td className={`p-4 text-right font-mono font-extrabold text-sm ${isPositive ? 'text-emerald-750' : 'text-red-650'}`}>
                        {isPositive ? '+' : ''}{m.qty}
                      </td>

                      {/* Unit code */}
                      <td className="p-4 text-center font-mono text-slate-400 font-medium">{m.unitCode}</td>

                      {/* Prev stock */}
                      <td className="p-4 text-right font-mono text-slate-500">{m.quantityBefore.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>

                      {/* New stock */}
                      <td className="p-4 text-right font-mono font-bold text-slate-750">{m.quantityAfter.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>

                      {/* Area */}
                      <td className="p-4 font-semibold text-slate-600">{m.area}</td>

                      {/* responsible */}
                      <td className="p-4 font-semibold text-slate-600">{m.userName}</td>

                      {/* explanations */}
                      <td className="p-4 max-w-xs">
                        <p className="font-semibold text-slate-700 leading-normal">{m.reason}</p>
                        {m.comment && <p className="text-[10px] text-slate-400 italic mt-0.5">"{m.comment}"</p>}
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
export {};
