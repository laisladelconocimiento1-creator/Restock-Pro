import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Calendar, FileSpreadsheet,
  Truck, Tag, Folder, AlertCircle, Info, Clock, CheckCircle
} from 'lucide-react';
import { Purchase, Provider, Product, Category } from '../../types';

interface PurchaseSummaryTabProps {
  filteredPurchases: Purchase[];
  purchases: Purchase[];
  providers: Provider[];
  products: Product[];
  categories: Category[];
  selectedMonth: string;
}

export default function PurchaseSummaryTab({
  filteredPurchases,
  purchases,
  providers,
  products,
  categories,
  selectedMonth
}: PurchaseSummaryTabProps) {

  // 1. Total Comprado en el Período
  const totalCompradoPeriodo = useMemo(() => {
    return filteredPurchases.reduce((acc, p) => p.status !== 'Anulada' ? acc + p.total : acc, 0);
  }, [filteredPurchases]);

  // 2. Cantidad de Facturas
  const countFacturas = filteredPurchases.length;

  // 3. Proveedor con Mayor Gasto
  const topProvider = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    filteredPurchases.forEach(p => {
      if (p.status === 'Anulada') return;
      if (!map[p.providerId]) map[p.providerId] = { name: p.providerName, total: 0 };
      map[p.providerId].total += p.total;
    });
    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    return sorted[0] || { name: 'Ninguno', total: 0 };
  }, [filteredPurchases]);

  // 4. Producto con Mayor Gasto
  const topProduct = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    filteredPurchases.forEach(p => {
      if (p.status === 'Anulada') return;
      p.items.forEach(it => {
        const prod = products.find(pr => pr.id === it.productId);
        const name = prod ? prod.name : 'Desconocido';
        if (!map[it.productId]) map[it.productId] = { name, total: 0 };
        map[it.productId].total += it.total;
      });
    });
    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    return sorted[0] || { name: 'Ninguno', total: 0 };
  }, [filteredPurchases, products]);

  // 5. Categoría con Mayor Gasto
  const topCategory = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    filteredPurchases.forEach(p => {
      if (p.status === 'Anulada') return;
      p.items.forEach(it => {
        const prod = products.find(pr => pr.id === it.productId);
        const catId = prod ? prod.categoryId : 'uncat';
        const cat = categories.find(c => c.id === catId);
        const name = cat ? cat.name : 'Sin Categoría';
        if (!map[catId]) map[catId] = { name, total: 0 };
        map[catId].total += it.total;
      });
    });
    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    return sorted[0] || { name: 'Ninguno', total: 0 };
  }, [filteredPurchases, products, categories]);

  // 6. Facturas Pendientes / Observadas
  const countPendientes = filteredPurchases.filter(p => p.status === 'Pendiente').length;
  const countObservadas = filteredPurchases.filter(p => p.status === 'Observada').length;

  // 7. Promedio Diario de Compras
  const promedioDiario = useMemo(() => {
    const dates = Array.from(new Set(filteredPurchases.map(p => p.invoiceDate)));
    const activeDays = Math.max(1, dates.length);
    return totalCompradoPeriodo / activeDays;
  }, [filteredPurchases, totalCompradoPeriodo]);

  // 8. Comparación contra el Período Anterior (Hombro con hombro con el mes anterior)
  const statsMesAnterior = useMemo(() => {
    let prevMonthStr = '2026-05';
    if (selectedMonth && selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-');
      let prevYr = parseInt(year, 10);
      let prevMt = parseInt(month, 10) - 1;
      if (prevMt === 0) {
        prevMt = 12;
        prevYr -= 1;
      }
      prevMonthStr = `${prevYr}-${prevMt.toString().padStart(2, '0')}`;
    }

    const totalPrev = purchases
      .filter(p => p.status !== 'Anulada' && p.invoiceDate.startsWith(prevMonthStr))
      .reduce((acc, p) => acc + p.total, 0);

    return {
      monthStr: prevMonthStr,
      total: totalPrev
    };
  }, [purchases, selectedMonth]);

  const variationPct = useMemo(() => {
    if (statsMesAnterior.total === 0) return 0;
    return ((totalCompradoPeriodo - statsMesAnterior.total) / statsMesAnterior.total) * 100;
  }, [totalCompradoPeriodo, statsMesAnterior]);

  // Gasto por Categoría Data for Charting
  const chartCategoryData = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    filteredPurchases.forEach(p => {
      if (p.status === 'Anulada') return;
      p.items.forEach(it => {
        const prod = products.find(pr => pr.id === it.productId);
        const catId = prod ? prod.categoryId : 'uncat';
        const name = prod ? (categories.find(c => c.id === prod.categoryId)?.name || 'Sin Categoría') : 'Sin Categoría';
        if (!map[catId]) map[catId] = { name, total: 0 };
        map[catId].total += it.total;
      });
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  }, [filteredPurchases, products, categories]);

  // Gasto por Proveedor Data for Charting
  const chartProviderData = useMemo(() => {
    const map: Record<string, { name: string; total: number }> = {};
    filteredPurchases.forEach(p => {
      if (p.status === 'Anulada') return;
      if (!map[p.providerId]) map[p.providerId] = { name: p.providerName, total: 0 };
      map[p.providerId].total += p.total;
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  }, [filteredPurchases]);

  return (
    <div className="space-y-6" id="compras-summary-panel">
      {/* Executive Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total período */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 translate-x-5 -translate-y-5">
            <FileSpreadsheet className="w-40 h-40" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Comprado (Período)</span>
          <div className="text-2xl font-extrabold mt-1.5 font-mono">
            RD$ {totalCompradoPeriodo.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            {variationPct >= 0 ? (
              <span className="inline-flex items-center text-emerald-400 font-bold">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{variationPct.toFixed(1)}%
              </span>
            ) : (
              <span className="inline-flex items-center text-rose-400 font-bold">
                <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {variationPct.toFixed(1)}%
              </span>
            )}
            <span className="text-slate-400 text-[10px]">vs mes anterior ({statsMesAnterior.monthStr})</span>
          </div>
        </div>

        {/* Cantidad Facturas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 text-slate-100 -translate-x-1 translate-y-1">
            <Calendar className="w-16 h-16" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cantidad de Facturas</span>
          <div className="text-2xl font-extrabold mt-1.5 text-slate-800 font-mono">
            {countFacturas} <span className="text-xs font-normal text-slate-400 font-sans">recibos</span>
          </div>
          <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-sans border-t border-slate-100 pt-2">
            <span>Día promedio: <strong className="font-mono text-slate-700">RD$ {promedioDiario.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</strong></span>
          </div>
        </div>

        {/* Proveedor Concentración */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 text-slate-100 -translate-x-1 translate-y-1">
            <Truck className="w-16 h-16" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mayor Gasto (Proveedor)</span>
          <div className="text-base font-extrabold mt-2 text-slate-800 truncate" title={topProvider.name}>
            {topProvider.name}
          </div>
          <div className="mt-1 font-mono text-sm text-slate-500 font-bold">
            RD$ {topProvider.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Producto Concentración */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 text-slate-100 -translate-x-1 translate-y-1">
            <Tag className="w-16 h-16" />
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mayor Gasto (Producto)</span>
          <div className="text-base font-extrabold mt-2 text-slate-800 truncate" title={topProduct.name}>
            {topProduct.name}
          </div>
          <div className="mt-1 font-mono text-sm text-slate-500 font-bold">
            RD$ {topProduct.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Audit Invoices Mini-Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Facturas Pendientes</span>
            <span className="text-sm font-bold text-slate-700 font-mono">{countPendientes} facturas por revisar</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Facturas Observadas</span>
            <span className="text-sm font-bold text-slate-705 font-mono">{countObservadas} en conflicto legal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Mayor Categoría de Gasto</span>
            <span className="text-sm font-bold text-slate-700 truncate block max-w-[180px]">{topCategory.name}</span>
          </div>
        </div>
      </div>

      {/* Horizontal Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Gasto por Categoría */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h5 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-emerald-600" />
              Gasto Consolidado por Categoría de Producto
            </h5>
            <p className="text-[10px] text-slate-400">Análisis porcentual de erogaciones por categoría en el período activo</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {chartCategoryData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                No hay compras correspondientes para graficar esta sección.
              </div>
            ) : (
              chartCategoryData.map((cat, idx) => {
                const pct = totalCompradoPeriodo > 0 ? (cat.total / totalCompradoPeriodo) * 100 : 0;
                const colors = ['bg-emerald-600', 'bg-slate-800', 'bg-indigo-650', 'bg-amber-600', 'bg-rose-600'];
                const selectedBg = colors[idx % colors.length];
                
                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-bold flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedBg}`} />
                        {cat.name}
                      </span>
                      <span className="font-mono text-slate-500">
                        RD$ {cat.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                        <strong className="text-slate-800 ml-1.5 font-bold">({pct.toFixed(1)}%)</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${selectedBg} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 2: Gasto por Proveedor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h5 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-650" />
              Participación de Gasto por Proveedor
            </h5>
            <p className="text-[10px] text-slate-400">Concentración de compras asignadas por intermediario de suministro</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {chartProviderData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                No hay compras correspondientes para graficar esta sección.
              </div>
            ) : (
              chartProviderData.map((prov, idx) => {
                const pct = totalCompradoPeriodo > 0 ? (prov.total / totalCompradoPeriodo) * 100 : 0;
                const colors = ['bg-indigo-650', 'bg-slate-840', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
                const selectedBg = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-bold flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${selectedBg}`} />
                        {prov.name}
                      </span>
                      <span className="font-mono text-slate-500">
                        RD$ {prov.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                        <strong className="text-slate-805 ml-1.5 font-bold">({pct.toFixed(1)}%)</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${selectedBg} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
