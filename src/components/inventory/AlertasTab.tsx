import React from 'react';
import {
  AlertTriangle,
  BadgeAlert,
  Sliders,
  DollarSign,
  Truck,
  CheckCircle,
  TrendingDown,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Product, Category, Unit, Provider } from '../../types';

interface AlertasTabProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  providers: Provider[];
  onSwitchTab: (tabId: string, filterProductId?: string) => void;
}

export default function AlertasTab({
  products,
  categories,
  units,
  providers,
  onSwitchTab
}: AlertasTabProps) {
  // Analytical triggers
  const outOfStock = products.filter(p => p.currentStock <= 0);
  const lowStock = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock);
  const unassignedProviders = products.filter(p => !p.providerIds || p.providerIds.length === 0);
  const unassignedCosts = products.filter(p => p.averageCost <= 0);
  const pendingPortions = products.filter(p => p.portionsAvailable !== undefined && p.portionsAvailable <= 0);

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || 'Sin Categoría';
  };

  const getUnitCode = (unitId: string) => {
    return units.find(u => u.id === unitId)?.code || 'und';
  };

  const hasCritialIssues = outOfStock.length > 0 || lowStock.length > 0;

  return (
    <div className="space-y-6 text-xs font-sans" id="alertas-tab-container">
      {/* SUMMARIZED STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total products */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Catálogo Activo</span>
            <strong className="text-slate-800 text-lg font-bold font-mono">{products.length} insumos</strong>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${outOfStock.length > 0 ? 'bg-red-50 text-red-650' : 'bg-slate-50 text-slate-400'} flex items-center justify-center`}>
            <BadgeAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Sin Existencia (0)</span>
            <strong className={`${outOfStock.length > 0 ? 'text-red-650' : 'text-slate-500'} text-lg font-bold font-mono`}>
              {outOfStock.length} alertas
            </strong>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${lowStock.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center`}>
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Bajo Mínimo</span>
            <strong className={`${lowStock.length > 0 ? 'text-amber-600' : 'text-slate-500'} text-lg font-bold font-mono`}>
              {lowStock.length} alertas
            </strong>
          </div>
        </div>

        {/* No Cost */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${unassignedCosts.length > 0 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Consistencia Costos</span>
            <strong className={`${unassignedCosts.length > 0 ? 'text-orange-600' : 'text-slate-500'} text-lg font-bold font-mono`}>
              {unassignedCosts.length} vacíos
            </strong>
          </div>
        </div>

        {/* No supplier */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${unassignedProviders.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center`}>
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Falta Proveedor</span>
            <strong className={`${unassignedProviders.length > 0 ? 'text-indigo-600' : 'text-slate-500'} text-lg font-bold font-mono`}>
              {unassignedProviders.length} sin vincular
            </strong>
          </div>
        </div>
      </div>

      {/* DETAILED ISSUES LAYOUT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* STOCK BREAKAGES SEVERE PANELS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
          <h3 className="font-display font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
            Alertas Críticas de Desabasto (Stock Crítico)
          </h3>

          {!hasCritialIssues ? (
            <div className="p-8 text-center text-slate-500 leading-relaxed font-sans bg-slate-50/50 rounded-xl border border-dashed border-slate-205">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-750 text-xs">¡Impecable! Cero Rupturas de Stock</h4>
              <p className="text-[11px] text-slate-500 mt-1">Todos los ingredientes comerciales cuentan con un stock activo superior a los requerimientos de seguridad diarios.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {/* Out of stock list */}
              {outOfStock.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50/60 border border-red-150 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-850">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{getCategoryName(p.categoryId)}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono text-red-750 font-bold bg-white border border-red-200 px-2 py-0.5 rounded">0.0 {getUnitCode(p.unitId)}</span>
                    <button
                      onClick={() => onSwitchTab('existencias')}
                      className="text-red-700 hover:text-red-900 border-l border-red-200 pl-3 font-semibold hover:underline"
                    >
                      Ajustar Stock
                    </button>
                  </div>
                </div>
              ))}

              {/* Low stock list */}
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-205 rounded-xl">
                  <div>
                    <h4 className="font-bold text-slate-850">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">Bajo Mínimo (Mín: {p.minStock} {getUnitCode(p.unitId)})</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="font-mono text-amber-700 font-bold bg-white border border-amber-200 px-2.5 py-0.5 rounded">
                      {p.currentStock.toLocaleString()} {getUnitCode(p.unitId)}
                    </span>
                    <button
                      onClick={() => onSwitchTab('existencias')}
                      className="text-amber-800 hover:text-amber-950 border-l border-amber-200 pl-3 font-semibold hover:underline"
                    >
                      Ajustar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OPERATIONS CONSISTENCY STRUCTURAL ERRORS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
          <h3 className="font-display font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4.5 h-4.5 text-slate-500" />
            Consistencia Operativa y Vacíos de Ficha
          </h3>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {/* Costs inconsistencies */}
            {unassignedCosts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-orange-600 flex items-center gap-1 font-mono uppercase text-[9.5px]">
                  <span>⚠ SIN COSTO PROMEDIO CONFIGURADO ({unassignedCosts.length})</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  {unassignedCosts.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-650 font-semibold">{p.name}</span>
                      <button
                        onClick={() => onSwitchTab('productos')}
                        className="text-slate-500 hover:text-orange-600 hover:underline"
                      >
                        Establecer Costo
                      </button>
                    </div>
                  ))}
                  {unassignedCosts.length > 5 && <p className="text-[10px] text-slate-400 italic text-center pt-1">+ {unassignedCosts.length - 5} productos más sin costo</p>}
                </div>
              </div>
            )}

            {/* Providers unassigned */}
            {unassignedProviders.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-indigo-600 flex items-center gap-1 font-mono uppercase text-[9.5px]">
                  <span>⚠ SIN PROVEEDORES AUTORIZADOS ({unassignedProviders.length})</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                  {unassignedProviders.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-650 font-semibold">{p.name}</span>
                      <button
                        onClick={() => onSwitchTab('productos')}
                        className="text-slate-500 hover:text-indigo-600 hover:underline"
                      >
                        Vincular Proveedor
                      </button>
                    </div>
                  ))}
                  {unassignedProviders.length > 5 && <p className="text-[10px] text-slate-400 italic text-center pt-1">+ {unassignedProviders.length - 5} productos más sin proveedor</p>}
                </div>
              </div>
            )}

            {/* Pending portions available */}
            {pendingPortions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-sky-700 flex items-center gap-1 font-mono uppercase text-[9.5px]">
                  <span>⚠ INSUMOS PORCIONABLES SIN PORCIONES ({pendingPortions.length})</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5 bg-sky-50/50 p-2.5 rounded-lg border border-sky-150">
                  {pendingPortions.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-[10.5px]">
                      <span className="text-sky-900 font-bold">{p.name}</span>
                      <span className="text-slate-400 font-medium">Baches agotados</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unassignedCosts.length === 0 && unassignedProviders.length === 0 && pendingPortions.length === 0 && (
              <div className="text-center p-8 text-slate-400 font-sans">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p>Las características técnicas de todas las fichas están al día y son consistentes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
