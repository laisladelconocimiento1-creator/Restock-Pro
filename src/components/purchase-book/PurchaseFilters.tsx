import React from 'react';
import { Filter, Calendar, Tag, Truck, Tag as CategoryIcon, Layers, Building } from 'lucide-react';
import { Provider, Product, Unit, Category } from '../../types';

interface PurchaseFiltersProps {
  providers: Provider[];
  products: Product[];
  units: Unit[];
  categories: Category[];
  availableMonths: string[];
  
  // States
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  selectedProductId: string;
  setSelectedProductId: (v: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (v: string) => void;
  selectedProviderId: string;
  setSelectedProviderId: (v: string) => void;
  selectedUnitId: string;
  setSelectedUnitId: (v: string) => void;
  selectedSede: string;
  setSelectedSede: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: any) => void;
  filterPayment: string;
  setFilterPayment: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

export default function PurchaseFilters({
  providers,
  products,
  units,
  categories,
  availableMonths,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedMonth,
  setSelectedMonth,
  selectedProductId,
  setSelectedProductId,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedProviderId,
  setSelectedProviderId,
  selectedUnitId,
  setSelectedUnitId,
  selectedSede,
  setSelectedSede,
  filterStatus,
  setFilterStatus,
  filterPayment,
  setFilterPayment,
  searchQuery,
  setSearchQuery
}: PurchaseFiltersProps) {

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split('-');
    const monthsEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthsEs[parseInt(month, 10) - 1] || month} ${year}`;
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('2026-06');
    setSelectedProductId('all');
    setSelectedCategoryId('all');
    setSelectedProviderId('all');
    setSelectedUnitId('all');
    setSelectedSede('all');
    setFilterStatus('all');
    setFilterPayment('all');
    setSearchQuery('');
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4" id="purchase-global-filters">
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <h4 className="font-sans font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filtros Globales del Libro de Compras
        </h4>
        <button
          onClick={handleClearFilters}
          className="text-xs text-rose-600 hover:text-rose-700 font-bold font-sans transition hover:underline"
        >
          Limpiar todos los filtros
        </button>
      </div>

      {/* Grid of Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs font-sans">
        
        {/* Search */}
        <div className="relative">
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Buscar Factura</span>
          <input
            type="text"
            placeholder="Buscar por folio, factura N°..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          />
        </div>

        {/* Mes */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Mes del Periodo</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Ver todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
            {!availableMonths.includes('2026-06') && (
              <option value="2026-06">Junio 2026</option>
            )}
            {!availableMonths.includes('2026-05') && (
              <option value="2026-05">Mayo 2026</option>
            )}
          </select>
        </div>

        {/* Proveedor */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Proveedor</span>
          <select
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Todos los proveedores</option>
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Producto */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Producto</span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Todos los productos</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Categoría */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Categoría</span>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Desde Fecha */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Desde Fecha</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:bg-white focus:border-emerald-600 transition font-mono"
          />
        </div>

        {/* Hasta Fecha */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Hasta Fecha</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none focus:bg-white focus:border-emerald-600 transition font-mono"
          />
        </div>

        {/* Estado factura */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Estado de Factura</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Todos los estados</option>
            <option value="Recibida">Recibida</option>
            <option value="Pendiente">Pendiente de Revisión</option>
            <option value="Observada">Observada (Conflicto)</option>
            <option value="Anulada">Anulada</option>
          </select>
        </div>

        {/* Método Pago */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Método de Pago</span>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Todos los métodos</option>
            <option value="Transferencia">Transferencia Bancaria</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Tarjeta">Tarjeta de Crédito</option>
            <option value="Crédito">Crédito del Proveedor</option>
          </select>
        </div>

        {/* Sede */}
        <div>
          <span className="block text-[9px] text-slate-400 font-extrabold uppercase mb-1">Sede de Operaciones</span>
          <select
            value={selectedSede}
            onChange={(e) => setSelectedSede(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:bg-white focus:border-emerald-600 transition"
          >
            <option value="all">Todas las sedes</option>
            <option value="Sede Principal">Sede Principal (Celler)</option>
            <option value="Sede Norte">Sede Zona Norte</option>
            <option value="Sede Sur">Sede Zona Sur</option>
          </select>
        </div>

      </div>
    </div>
  );
}
