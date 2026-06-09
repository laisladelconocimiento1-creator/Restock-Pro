import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Clock, HelpCircle, Package, ArrowUpRight,
  ArrowDownRight, Calendar, ArrowRight, DollarSign, BookOpen
} from 'lucide-react';
import { Purchase, Provider, Product, Unit } from '../../types';

interface PurchaseTrendsTabProps {
  purchases: Purchase[];
  providers: Provider[];
  products: Product[];
  units: Unit[];
}

export default function PurchaseTrendsTab({
  purchases,
  providers,
  products,
  units
}: PurchaseTrendsTabProps) {

  const [trendProductId, setTrendProductId] = useState('prod-1');

  // Compute pricing chronological list of purchases of this specific product (Ascending order)
  const priceTrendList = useMemo(() => {
    const list: {
      id: string;
      date: string;
      providerName: string;
      qty: number;
      unitPrice: number;
      total: number;
      invoiceNumber: string;
      variation: number;
      variationPct: number;
      deviationFromMean: number;
    }[] = [];

    const productPurchases = purchases
      .filter(p => p.status !== 'Anulada' && p.items.some(it => it.productId === trendProductId))
      .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));

    // Calculate grand total average
    let grandQty = 0;
    let grandCost = 0;
    productPurchases.forEach(p => {
      p.items.forEach(it => {
        if (it.productId === trendProductId) {
          grandQty += it.qty;
          grandCost += it.total;
        }
      });
    });
    const overallMean = grandQty > 0 ? (grandCost / grandQty) : 0;

    let lastPrice = 0;
    productPurchases.forEach(p => {
      p.items.forEach(it => {
        if (it.productId === trendProductId) {
          const variation = lastPrice > 0 ? (it.unitPrice - lastPrice) : 0;
          const variationPct = lastPrice > 0 ? (variation / lastPrice) * 100 : 0;
          const deviationFromMean = overallMean > 0 ? ((it.unitPrice - overallMean) / overallMean) * 100 : 0;

          list.push({
            id: p.id,
            date: p.invoiceDate,
            providerName: p.providerName,
            qty: it.qty,
            unitPrice: it.unitPrice,
            total: it.total,
            invoiceNumber: p.invoiceNumber,
            variation,
            variationPct,
            deviationFromMean
          });

          lastPrice = it.unitPrice;
        }
      });
    });

    return list.reverse(); // Reverse list to show newest on top in tabular view representation
  }, [purchases, trendProductId]);

  const selectedProduct = products.find(p => p.id === trendProductId);
  const selectedUnit = selectedProduct ? units.find(u => u.id === selectedProduct.unitId) : null;
  const unitSuffix = selectedUnit ? selectedUnit.code : 'u';

  // SVG Trend Chart Dimensions and Calculations
  const chartPoints = useMemo(() => {
    if (priceTrendList.length < 2) return [];
    
    // sort chronological list to draw from left to right (dates ascending)
    const sortedChronological = [...priceTrendList].sort((a,b) => a.date.localeCompare(b.date));
    const prices = sortedChronological.map(it => it.unitPrice);
    
    const minPrice = Math.min(...prices) * 0.95; // padding
    const maxPrice = Math.max(...prices) * 1.05; // padding
    const priceRange = Math.max(1, maxPrice - minPrice);
    
    const width = 600;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const countPoints = sortedChronological.length;
    
    return sortedChronological.map((it, idx) => {
      const x = paddingLeft + (idx / Math.max(1, countPoints - 1)) * (width - paddingLeft - paddingRight);
      const y = height - paddingBottom - ((it.unitPrice - minPrice) / priceRange) * (height - paddingTop - paddingBottom);
      return { x, y, it };
    });
  }, [priceTrendList]);

  const svgPathStr = useMemo(() => {
    if (chartPoints.length === 0) return '';
    return chartPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [chartPoints]);

  return (
    <div className="space-y-6" id="price-trends-auditor">
      {/* Product sub-filter select card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Control de Fluctuaciones e Inflación por Insumo
          </label>
          <p className="text-[11px] text-slate-500">Muestra la serie cronológica de tarifas cobradas, oscilación contra facturas anteriores y contra el costo histórico de almacén</p>
        </div>
        <select
          value={trendProductId}
          onChange={(e) => setTrendProductId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-sans font-bold text-slate-700 min-w-[280px]"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {priceTrendList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dotted border-slate-200 space-y-2">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-705 text-sm">Sin historial de precios</h4>
          <p className="text-xs text-slate-400 max-w-[420px] mx-auto">
            El producto <strong>{selectedProduct?.name}</strong> no posee movimientos de compra confirmados en el libro auxiliar aún. Registra facturas para comenzar el muestreo inflacionario.
          </p>
        </div>
      ) : (
        <>
          {/* Timeline Visual Chart Panel */}
          {chartPoints.length >= 2 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h5 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Línea de Tiempo de Costo de Compra (DOP por {unitSuffix})
                </h5>
                <p className="text-[10px] text-slate-400">Trayectoria de precios cobrados en las últimas facturas del insumo</p>
              </div>

              {/* Responsive SVG Chart */}
              <div className="w-full overflow-x-auto pt-2">
                <svg viewBox="0 0 600 180" className="w-full min-w-[600px] h-[180px] select-none text-[8.5px] font-mono fill-slate-450">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="580" y2="20" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="70" x2="580" y2="70" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="120" x2="580" y2="120" stroke="#f1f5f9" strokeDasharray="3" />
                  <line x1="40" y1="150" x2="580" y2="150" stroke="#e2e8f0" strokeWidth="1.5" />
                  
                  {/* Line Draw string path */}
                  <path d={svgPathStr} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Circles and details markers */}
                  {chartPoints.map((pt, idx) => (
                    <g key={idx} className="cursor-pointer group">
                      <circle cx={pt.x} cy={pt.y} r="5" className="fill-emerald-600 hover:fill-slate-800 transition" stroke="#fff" strokeWidth="1.5" />
                      {/* Price tag overhead */}
                      <text x={pt.x} y={pt.y - 10} textAnchor="middle" className="font-bold fill-emerald-800 text-[8px] font-mono leading-none bg-white font-bold">
                        RD$ {pt.it.unitPrice.toFixed(0)}
                      </text>
                      {/* Date label underneath bottom axis */}
                      <text x={pt.x} y="165" textAnchor="middle" className="fill-slate-400 text-[7px] font-mono font-medium">
                        {pt.it.date.split('T')[0] || pt.it.date}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* Tabular chronological details lists representation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100">
              <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Historial Cronológico de Compras & Cotejo de Precios
              </h5>
            </div>

            <div className="overflow-x-auto text-xs font-sans">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Fecha Factura</th>
                    <th className="p-4">Proveedor</th>
                    <th className="p-4">Factura N°</th>
                    <th className="p-4 text-right">Cant. Comprada</th>
                    <th className="p-4 text-right">Precio Unitario</th>
                    <th className="p-4 text-right">Variación Compra Prev.</th>
                    <th className="p-4 text-right">Desviación Promedio</th>
                    <th className="p-4 text-right">Total Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {priceTrendList.map((pt, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition leading-snug">
                        <td className="p-4 font-semibold text-slate-800">{pt.date}</td>
                        <td className="p-4 font-bold text-slate-700 truncate max-w-[190px]">{pt.providerName}</td>
                        <td className="p-4 font-mono font-bold text-slate-500">{pt.invoiceNumber}</td>
                        <td className="p-4 text-right font-mono font-medium text-slate-650">{pt.qty.toLocaleString()} {unitSuffix}</td>
                        <td className="p-4 text-right font-mono font-extrabold text-slate-900">RD$ {pt.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>
                        
                        {/* Variation against previous purchase in DOP */}
                        <td className="p-4 text-right font-mono">
                          {pt.variation === 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium">—</span>
                          ) : pt.variation > 0 ? (
                            <span className="inline-flex items-center text-rose-700 font-bold text-[10.5px]">
                              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />+RD$ {pt.variation.toFixed(0)} ({pt.variationPct.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-emerald-800 font-bold text-[10.5px]">
                              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />-RD$ {Math.abs(pt.variation).toFixed(0)} ({Math.abs(pt.variationPct).toFixed(1)}%)
                            </span>
                          )}
                        </td>

                        {/* Deviation from cumulative average price MTD */}
                        <td className="p-4 text-right font-mono font-bold">
                          {pt.deviationFromMean === 0 ? (
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1 py-0.5 rounded">0.0%</span>
                          ) : pt.deviationFromMean > 0 ? (
                            <span className="text-rose-700 text-[10.5px]">+{pt.deviationFromMean.toFixed(1)}%</span>
                          ) : (
                            <span className="text-emerald-800 text-[10.5px]">{pt.deviationFromMean.toFixed(1)}%</span>
                          )}
                        </td>

                        <td className="p-4 text-right font-mono font-bold text-slate-900">RD$ {pt.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
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
