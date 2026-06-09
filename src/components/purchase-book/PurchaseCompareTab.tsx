import React, { useState, useMemo } from 'react';
import {
  Coins, ArrowRight, Table, HelpCircle, Package, ArrowUpRight,
  TrendingDown, CheckCircle, Percent, AlertCircle, RefreshCw
} from 'lucide-react';
import { Purchase, Provider, Product, Unit } from '../../types';

interface PurchaseCompareTabProps {
  purchases: Purchase[];
  providers: Provider[];
  products: Product[];
  units: Unit[];
  selectedMonth: string;
}

export default function PurchaseCompareTab({
  purchases,
  providers,
  products,
  units,
  selectedMonth
}: PurchaseCompareTabProps) {

  const [comparisonProductId, setComparisonProductId] = useState('prod-1');

  // Filter suppliers layout that sold this item in the filtered period / month
  const suppliersSellingProduct = useMemo(() => {
    const map: Record<string, {
      providerName: string;
      qty: number;
      spent: number;
      minPrice: number;
      maxPrice: number;
      lastDate: string;
      lastPrice: number;
    }> = {};

    purchases.forEach(p => {
      if (p.status === 'Anulada') return;
      // Filter by the active period month if set
      if (selectedMonth && selectedMonth !== 'all') {
        if (!p.invoiceDate.startsWith(selectedMonth)) return;
      }

      p.items.forEach(it => {
        if (it.productId === comparisonProductId) {
          const sId = p.providerId;
          if (!map[sId]) {
            map[sId] = {
              providerName: p.providerName,
              qty: 0,
              spent: 0,
              minPrice: Infinity,
              maxPrice: -Infinity,
              lastDate: '',
              lastPrice: 0
            };
          }
          map[sId].qty += it.qty;
          map[sId].spent += it.total;
          if (it.unitPrice < map[sId].minPrice) map[sId].minPrice = it.unitPrice;
          if (it.unitPrice > map[sId].maxPrice) map[sId].maxPrice = it.unitPrice;

          // Update latest buy details
          if (!map[sId].lastDate || p.invoiceDate > map[sId].lastDate) {
            map[sId].lastDate = p.invoiceDate;
            map[sId].lastPrice = it.unitPrice;
          }
        }
      });
    });

    return Object.entries(map).map(([sId, val]) => ({
      providerId: sId,
      name: val.providerName,
      qty: val.qty,
      spent: val.spent,
      avgPrice: val.qty > 0 ? (val.spent / val.qty) : 0,
      min: val.minPrice === Infinity ? 0 : val.minPrice,
      max: val.maxPrice === -Infinity ? 0 : val.maxPrice,
      lastDate: val.lastDate,
      lastPrice: val.lastPrice
    })).sort((a, b) => a.avgPrice - b.avgPrice); // cheapest average first!
  }, [purchases, comparisonProductId, selectedMonth]);

  const selectedProduct = products.find(p => p.id === comparisonProductId);
  const selectedUnit = selectedProduct ? units.find(u => u.id === selectedProduct.unitId) : null;
  const unitCode = selectedUnit ? selectedUnit.code : 'u';

  // Find cheapest and most expensive suppliers to calculate system divergent savings potentials
  const cheapestProvider = suppliersSellingProduct[0];
  const dearestProvider = suppliersSellingProduct[suppliersSellingProduct.length - 1];

  // total purchased across all suppliers in this period
  const totalVolumeBought = suppliersSellingProduct.reduce((acc, s) => acc + s.qty, 0);

  // ahorro_estimado = cantidad_total_comprada * (precio_mas_caro - precio_mas_barato)
  const savingsAhorroEstimado = useMemo(() => {
    if (suppliersSellingProduct.length < 2 || !cheapestProvider || !dearestProvider) return 0;
    
    // Formula applied directly to the maximum cost minus the minimum cost
    return totalVolumeBought * (dearestProvider.avgPrice - cheapestProvider.avgPrice);
  }, [suppliersSellingProduct, cheapestProvider, dearestProvider, totalVolumeBought]);

  return (
    <div className="space-y-6" id="suppliers-price-comparator">
      
      {/* Product sub-filter select card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            Selecciona el insumo a comparar side-by-side
          </label>
          <p className="text-[11px] text-slate-500">Muestra listado de precios unitarios por proveedor, desviación contra la tasa más económica y fugas financieras</p>
        </div>
        <select
          value={comparisonProductId}
          onChange={(e) => setComparisonProductId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-sans font-bold text-slate-700 min-w-[280px]"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {suppliersSellingProduct.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dotted border-slate-200 space-y-2">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-705 text-sm">Sin comparativa disponible</h4>
          <p className="text-xs text-slate-400 max-w-[420px] mx-auto">
            Este producto no registra compras distribuidas en múltiples proveedores en el mes o rango de tiempo seleccionado. Requiere compras de múltiples abastecedores para cotejar tasas.
          </p>
        </div>
      ) : (
        <>
          {/* Estimated Savings Potential Card Banner */}
          {suppliersSellingProduct.length >= 2 && cheapestProvider && dearestProvider && (
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
              <div className="space-y-1.5 max-w-[620px]">
                <h4 className="font-sans font-black uppercase text-[10.5px] tracking-wider text-emerald-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  Potencial de Optimización Financiera Estimado
                </h4>
                <p className="text-sm font-medium leading-relaxed">
                  Si hubieses comprado todo el lote total de <strong className="font-bold underline">{totalVolumeBought.toLocaleString()} {unitCode}</strong> de <strong className="font-semibold">{selectedProduct?.name}</strong> al proveedor más económico (<span className="text-slate-100 font-bold">{cheapestProvider.name}</span> @ RD$ {cheapestProvider.avgPrice.toFixed(0)}/{unitCode}) en lugar del proveedor más costoso (<span className="text-slate-100 font-bold">{dearestProvider.name}</span> @ RD$ {dearestProvider.avgPrice.toFixed(0)}/{unitCode}), habrías obtenido un ahorro real importante.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/20 text-center shrink-0 min-w-[170px]">
                <span className="text-[9.5px] uppercase font-bold text-emerald-100">Ahorro Estimado</span>
                <div className="text-2xl font-black font-mono text-emerald-100 mt-1">
                  RD$ {savingsAhorroEstimado.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                </div>
                <span className="text-[8.5px] text-white/70 block mt-1">Fórmula: Vol * (Max - Min)</span>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Grid Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100">
              <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Table className="w-4 h-4 text-emerald-600" />
                Matriz Comparativa de Oferentes de Suministro
              </h5>
            </div>

            <div className="overflow-x-auto text-xs font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Organización Proveedora</th>
                    <th className="p-4 text-right">Cant. Comprada</th>
                    <th className="p-4 text-right">Costo Promedio ({unitCode})</th>
                    <th className="p-4 text-right">Rango Min - Max</th>
                    <th className="p-4 text-right">Último Precio Unitario</th>
                    <th className="p-4 text-right">Diferencia Arbitraje</th>
                    <th className="p-4 text-right">Porcentaje Desviación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suppliersSellingProduct.map((sup, idx) => {
                    const isCheapest = idx === 0;
                    const diffCheapest = cheapestProvider ? sup.avgPrice - cheapestProvider.avgPrice : 0;
                    const pctDiff = cheapestProvider && cheapestProvider.avgPrice > 0 ? (diffCheapest / cheapestProvider.avgPrice) * 100 : 0;

                    return (
                      <tr key={idx} className={`hover:bg-slate-50/50 transition ${isCheapest ? 'bg-emerald-50/20' : ''}`}>
                        <td className="p-4 font-bold text-slate-800">
                          <span className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">MÁS ECONÓMICO</span>
                            )}
                            {idx === suppliersSellingProduct.length - 1 && suppliersSellingProduct.length > 1 && (
                              <span className="bg-rose-100 text-rose-800 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">MÁS CARO</span>
                            )}
                            {sup.name}
                          </span>
                        </td>
                        <td className="p-4 text-right font-mono font-medium text-slate-600">{sup.qty.toLocaleString()} {unitCode}</td>
                        <td className="p-4 text-right font-mono font-extrabold text-slate-850">RD$ {sup.avgPrice.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>
                        <td className="p-4 text-right font-mono text-slate-400">RD$ {sup.min} - {sup.max}</td>
                        <td className="p-4 text-right font-mono font-semibold text-slate-700">RD$ {sup.lastPrice} <span className="text-[9px] text-slate-400">({sup.lastDate})</span></td>
                        
                        {/* Difference in RD$ */}
                        <td className="p-4 text-right font-mono font-bold">
                          {isCheapest ? (
                            <span className="text-emerald-700">- Base -</span>
                          ) : (
                            <span className="text-rose-700 text-xs">+ RD$ {diffCheapest.toFixed(1)}</span>
                          )}
                        </td>

                        {/* Percent Divergence */}
                        <td className="p-4 text-right font-mono font-black">
                          {isCheapest ? (
                            <span className="text-emerald-700">0.00%</span>
                          ) : (
                            <span className="text-rose-700 text-xs">+{pctDiff.toFixed(2)}%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
