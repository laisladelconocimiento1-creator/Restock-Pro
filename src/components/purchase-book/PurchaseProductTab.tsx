import React, { useState, useMemo } from 'react';
import {
  Tag, TrendingUp, TrendingDown, DollarSign, Layers,
  ShoppingBag, HelpCircle, ArrowUpRight, ArrowDownRight, ClipboardList
} from 'lucide-react';
import { Purchase, Provider, Product, Unit } from '../../types';

interface PurchaseProductTabProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  providers: Provider[];
  products: Product[];
  units: Unit[];
}

export default function PurchaseProductTab({
  purchases,
  filteredPurchases,
  providers,
  products,
  units
}: PurchaseProductTabProps) {

  // Primary product analyzer state
  const [analyzedProductId, setAnalyzedProductId] = useState('prod-1');

  // Filter line items containing this product from the filtered list of purchases
  const lineItemsForProduct = useMemo(() => {
    const list: { purchase: Purchase; qty: number; unitPrice: number; total: number }[] = [];
    filteredPurchases.forEach(p => {
      p.items.forEach(it => {
        if (it.productId === analyzedProductId) {
          list.push({
            purchase: p,
            qty: it.qty,
            unitPrice: it.unitPrice,
            total: it.total
          });
        }
      });
    });
    return list.sort((a, b) => b.purchase.invoiceDate.localeCompare(a.purchase.invoiceDate));
  }, [filteredPurchases, analyzedProductId]);

  const selectedProduct = products.find(p => p.id === analyzedProductId);
  const selectedUnit = selectedProduct ? units.find(u => u.id === selectedProduct.unitId) : null;
  const unitSuffix = selectedUnit ? selectedUnit.code : 'u';

  // Math totals for the product
  const totalQty = lineItemsForProduct.reduce((acc, item) => acc + item.qty, 0);
  const totalCostProduct = lineItemsForProduct.reduce((acc, item) => acc + item.total, 0);
  const costoPromedioUnitario = totalQty > 0 ? (totalCostProduct / totalQty) : 0;

  const minUnitCost = lineItemsForProduct.length > 0 ? Math.min(...lineItemsForProduct.map(it => it.unitPrice)) : 0;
  const maxUnitCost = lineItemsForProduct.length > 0 ? Math.max(...lineItemsForProduct.map(it => it.unitPrice)) : 0;
  const lastUnitCost = lineItemsForProduct.length > 0 ? lineItemsForProduct[0].unitPrice : 0;

  // Month-over-Month logic
  // Compare selected month/period average unit price against preceding month (May 2026)
  const previousMonthAverageCost = useMemo(() => {
    const prevMonthStr = '2026-05';
    let prevQty = 0;
    let prevTotal = 0;
    purchases.forEach(p => {
      if (p.invoiceDate.startsWith(prevMonthStr)) {
        p.items.forEach(it => {
          if (it.productId === analyzedProductId) {
            prevQty += it.qty;
            prevTotal += it.total;
          }
        });
      }
    });
    return prevQty > 0 ? (prevTotal / prevQty) : 110; // Default to preloaded historical cost
  }, [purchases, analyzedProductId]);

  const variationValue = costoPromedioUnitario - previousMonthAverageCost;
  const variationPercentage = previousMonthAverageCost > 0 ? (variationValue / previousMonthAverageCost) * 100 : 0;

  // Supplier breakdown for the product
  const supplierBreakdownForProduct = useMemo(() => {
    const map: Record<string, { name: string; qty: number; spent: number; minPrice: number; maxPrice: number }> = {};
    lineItemsForProduct.forEach(it => {
      const sId = it.purchase.providerId;
      const sName = it.purchase.providerName;
      if (!map[sId]) {
        map[sId] = { name: sName, qty: 0, spent: 0, minPrice: Infinity, maxPrice: -Infinity };
      }
      map[sId].qty += it.qty;
      map[sId].spent += it.total;
      if (it.unitPrice < map[sId].minPrice) map[sId].minPrice = it.unitPrice;
      if (it.unitPrice > map[sId].maxPrice) map[sId].maxPrice = it.unitPrice;
    });

    return Object.entries(map).map(([sId, val]) => ({
      providerId: sId,
      name: val.name,
      qty: val.qty,
      spent: val.spent,
      avgPrice: val.qty > 0 ? (val.spent / val.qty) : 0,
      minPrice: val.minPrice === Infinity ? 0 : val.minPrice,
      maxPrice: val.maxPrice === -Infinity ? 0 : val.maxPrice
    })).sort((a, b) => b.spent - a.spent);
  }, [lineItemsForProduct]);

  return (
    <div className="space-y-6" id="product_purchase_analyzer">
      {/* Product Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Selecciona un producto para auditar
          </label>
          <p className="text-[11px] text-slate-500">Muestra precios unitarios, volúmenes de compra y comparaciones históricas por proveedor</p>
        </div>
        <select
          value={analyzedProductId}
          onChange={(e) => setAnalyzedProductId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-sans font-bold text-slate-700 min-w-[280px]"
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {lineItemsForProduct.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dotted border-slate-200 space-y-2">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-705 text-sm">Sin datos para este periodo</h4>
          <p className="text-xs text-slate-400 max-w-[380px] mx-auto">
            No se han registrado facturas ni órdenes de compra para el producto <strong>{selectedProduct?.name}</strong> en el trimestre o filtros cargados.
          </p>
        </div>
      ) : (
        <>
          {/* Metrics KPIs Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Cantidad Total Comprada */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Volumen Comprado</span>
              <strong className="text-2xl font-extrabold text-slate-800 font-mono block mt-1.5">
                {totalQty.toLocaleString('es-DO')} <span className="text-xs font-normal text-slate-500 font-sans">{unitSuffix}</span>
              </strong>
              <div className="text-[10px] text-slate-500 mt-2">
                Unidad oficial: <strong className="text-slate-700">{selectedUnit?.name}</strong>
              </div>
            </div>

            {/* Costo Total Comprado */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monto Gastado Neto</span>
              <strong className="text-2xl font-extrabold text-slate-800 font-mono block mt-1.5">
                RD$ {totalCostProduct.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </strong>
              <div className="text-[10px] text-slate-400 mt-2">
                Aporte al presupuesto de compras
              </div>
            </div>

            {/* Costo Promedio Unitario */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 p-5 rounded-2xl border border-emerald-100 shadow-xs">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Costo Promedio Unitario</span>
              <strong className="text-2xl font-extrabold text-emerald-800 font-mono block mt-1.5">
                RD$ {costoPromedioUnitario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                <span className="text-xs font-normal text-slate-500 font-sans">/{unitSuffix}</span>
              </strong>
              <div className="flex items-center gap-1 text-[10px] mt-2">
                {variationPercentage >= 0 ? (
                  <span className="inline-flex items-center text-rose-600 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +{variationPercentage.toFixed(1)}% vs anterior
                  </span>
                ) : (
                  <span className="inline-flex items-center text-emerald-700 font-bold">
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> {variationPercentage.toFixed(1)}% vs anterior
                  </span>
                )}
              </div>
            </div>

            {/* Rango de Precios */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rango & Último Precio</span>
              <strong className="text-sm font-extrabold text-slate-800 font-mono block mt-1.5">
                RD$ {lastUnitCost.toLocaleString('es-DO')} <span className="text-[9.5px] font-normal text-slate-400 font-sans">(Última compra)</span>
              </strong>
              <div className="grid grid-cols-2 gap-1 text-[9.5px] text-slate-500 mt-2.5 border-t border-slate-100 pt-2 font-mono">
                <div>MIN: <strong className="text-slate-755">RD$ {minUnitCost}</strong></div>
                <div>MAX: <strong className="text-slate-755">RD$ {maxUnitCost}</strong></div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Supplier breakdown Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  Compras Detalladas por Proveedor para {selectedProduct?.name}
                </h5>
              </div>

              <div className="overflow-x-auto text-xs font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Proveedor</th>
                      <th className="p-3 text-right">Cant. Comprada</th>
                      <th className="p-3 text-right">Precio Promedio</th>
                      <th className="p-3 text-right">Rango Precios</th>
                      <th className="p-3 text-right">Gasto Neto (DOP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierBreakdownForProduct.map((sup, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-bold text-slate-700">{sup.name}</td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-600">{sup.qty.toLocaleString()} {unitSuffix}</td>
                        <td className="p-3 text-right font-mono font-extrabold text-slate-800">RD$ {sup.avgPrice.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>
                        <td className="p-3 text-right font-mono text-slate-400 text-[10px]">RD$ {sup.minPrice} - {sup.maxPrice}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">RD$ {sup.spent.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Associated Invoices list */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  Facturas Relacionadas
                </h5>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto font-sans text-xs">
                {lineItemsForProduct.map((item, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-50/50 transition flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {item.purchase.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.purchase.invoiceDate}</span>
                      </div>
                      <p className="text-slate-500 font-medium truncate max-w-[190px]">{item.purchase.providerName}</p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="block font-mono text-slate-800 font-extrabold text-[12px]">
                        RD$ {item.unitPrice} <span className="text-[9px] text-slate-400 font-normal">/{unitSuffix}</span>
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {item.qty} {unitSuffix} (total: RD$ {item.total})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
