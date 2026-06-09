import React, { useState, useMemo } from 'react';
import { Truck, MapPin, Phone, Mail, Award, Clock, HelpCircle, Package, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { Purchase, Provider, Product, Unit } from '../../types';

interface PurchaseProviderTabProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  providers: Provider[];
  products: Product[];
  units: Unit[];
}

export default function PurchaseProviderTab({
  purchases,
  filteredPurchases,
  providers,
  products,
  units
}: PurchaseProviderTabProps) {

  const [analyzedProviderId, setAnalyzedProviderId] = useState('prov-1');

  // Filter purchases for this provider
  const purchasesForProvider = useMemo(() => {
    return filteredPurchases.filter(p => p.providerId === analyzedProviderId);
  }, [filteredPurchases, analyzedProviderId]);

  const selectedProvider = providers.find(p => p.id === analyzedProviderId);

  // Spend and invoice counts
  const totalProviderSpent = purchasesForProvider.reduce((acc, p) => p.status !== 'Anulada' ? acc + p.total : acc, 0);
  const countProviderInvoices = purchasesForProvider.length;

  // Breakdown of products bought from this provider
  const productsBoughtFromProvider = useMemo(() => {
    const map: Record<string, { qty: number; total: number; min: number; max: number; unitCode: string }> = {};
    purchasesForProvider.forEach(p => {
      if (p.status === 'Anulada') return;
      p.items.forEach(it => {
        const prod = products.find(pr => pr.id === it.productId);
        const unit = prod ? units.find(u => u.id === prod.unitId) : null;
        const uCode = unit?.code || 'u';
        if (!map[it.productId]) {
          map[it.productId] = { qty: 0, total: 0, min: Infinity, max: -Infinity, unitCode: uCode };
        }
        map[it.productId].qty += it.qty;
        map[it.productId].total += it.total;
        if (it.unitPrice < map[it.productId].min) map[it.productId].min = it.unitPrice;
        if (it.unitPrice > map[it.productId].max) map[it.productId].max = it.unitPrice;
      });
    });

    return Object.entries(map).map(([pId, val]) => {
      const prod = products.find(pr => pr.id === pId);

      // Comparative rate helper: Check averages of other providers for the same product
      const otherProvidersAvg = (() => {
        let otherTotalQty = 0;
        let otherTotalCost = 0;
        purchases.forEach(p => {
          if (p.providerId !== analyzedProviderId && p.status !== 'Anulada') {
            p.items.forEach(it => {
              if (it.productId === pId) {
                otherTotalQty += it.qty;
                otherTotalCost += it.total;
              }
            });
          }
        });
        return otherTotalQty > 0 ? (otherTotalCost / otherTotalQty) : 0;
      })();

      return {
        productId: pId,
        name: prod?.name || 'Producto Desconocido',
        qty: val.qty,
        total: val.total,
        avgPrice: val.qty > 0 ? (val.total / val.qty) : 0,
        min: val.min === Infinity ? 0 : val.min,
        max: val.max === -Infinity ? 0 : val.max,
        unitCode: val.unitCode,
        otherAvg: otherProvidersAvg
      };
    }).sort((a, b) => b.total - a.total);
  }, [purchasesForProvider, purchases, products, units, analyzedProviderId]);

  // Latest purchase
  const latestPurchase = useMemo(() => {
    return [...purchasesForProvider].sort((a,b) => b.invoiceDate.localeCompare(a.invoiceDate))[0];
  }, [purchasesForProvider]);

  return (
    <div className="space-y-6" id="provider-purchase-analyzer">
      
      {/* Selector and Provider Meta Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            Empresa proveedora a evaluar
          </label>
          <p className="text-[11px] text-slate-500">Muestra volumetría, facturas pagadas/pendientes y comparativa de competitividad de insumos</p>
        </div>
        <select
          value={analyzedProviderId}
          onChange={(e) => setAnalyzedProviderId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none font-sans font-bold text-slate-700 min-w-[280px]"
        >
          {providers.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {purchasesForProvider.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-dotted border-slate-200 space-y-2">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="font-extrabold text-slate-705 text-sm">Sin compras para este periodo</h4>
          <p className="text-xs text-slate-400 max-w-[380px] mx-auto">
            No se han registrado facturas ligadas a {selectedProvider?.name} en el periodo de fecha y mes especificados.
          </p>
        </div>
      ) : (
        <>
          {/* Supplier Info and General Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Meta details */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800">{selectedProvider?.name}</h4>
                  <span className="text-[10px] text-slate-450 font-mono">RFC: {selectedProvider?.rfc}</span>
                </div>
                <div className="flex items-center gap-0.5 bg-yellow-50 text-yellow-700 font-bold px-2 py-0.5 rounded border border-yellow-100 text-[10px]">
                  <Award className="w-3 h-3" />
                  ★ {selectedProvider?.rating || 5}
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedProvider?.address || 'Asociado Celler'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedProvider?.phone || '809-555-0100'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedProvider?.email || 'p@caribe.com.do'}</span>
                </div>
              </div>

              {/* Invoices statistics */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Gasto Total Período</span>
                  <strong className="text-base font-mono font-semibold text-slate-800 tracking-tight">
                    RD$ {totalProviderSpent.toLocaleString('es-DO', { maximumFractionDigits: 0 })}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Facturas</span>
                  <strong className="text-base font-semibold text-slate-800 font-mono tracking-tight">
                    {countProviderInvoices} docs
                  </strong>
                </div>
              </div>

              {/* Latest Invoice indicators */}
              {latestPurchase && (
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-[9.5px] block text-slate-400 uppercase font-bold text-[8px]">Última Compra</span>
                      <strong className="text-slate-800 font-mono font-semibold">{latestPurchase.invoiceNumber}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{latestPurchase.invoiceDate}</span>
                    <strong className="text-slate-800 font-mono font-bold">RD$ {latestPurchase.total.toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* List of Products bought from Provider with Comparison */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Insumos Suministrados por este Proveedor & Comparativa de Precio
                </h5>
              </div>

              <div className="overflow-x-auto text-xs font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-right">Cant. Comprada</th>
                      <th className="p-3 text-right">Precio Promedio</th>
                      <th className="p-3 text-right">Comparativa Mercado</th>
                      <th className="p-3 text-right">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productsBoughtFromProvider.map((p, idx) => {
                      const difference = p.otherAvg > 0 ? p.avgPrice - p.otherAvg : 0;
                      const differencePct = p.otherAvg > 0 ? (difference / p.otherAvg) * 100 : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-bold text-slate-705 bg-slate-50/10">{p.name}</td>
                          <td className="p-3 text-right font-mono font-medium text-slate-605">{p.qty} {p.unitCode}</td>
                          <td className="p-3 text-right font-mono font-extrabold text-slate-800">RD$ {p.avgPrice.toLocaleString('es-DO', { maximumFractionDigits: 1 })}</td>
                          
                          {/* Mercado comparisons */}
                          <td className="p-3 text-right font-mono">
                            {p.otherAvg === 0 ? (
                              <span className="text-[9px] text-slate-400 font-bold font-sans bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">PROVEEDOR ÚNICO</span>
                            ) : differencePct > 1 ? (
                              <span className="inline-flex items-center text-rose-700 bg-rose-50 text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-rose-100/70" title={`Otros venden a RD$ ${p.otherAvg.toFixed(1)}/u (este es más caro)`}>
                                <ArrowUpRight className="w-3 h-3 mr-0.5 shrink-0" />+{differencePct.toFixed(1)}% caro
                              </span>
                            ) : differencePct < -1 ? (
                              <span className="inline-flex items-center text-emerald-800 bg-emerald-50 text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-emerald-100" title={`Otros venden a RD$ ${p.otherAvg.toFixed(1)}/u (este es más barato)`}>
                                <ArrowDownRight className="w-3 h-3 mr-0.5 shrink-0" />{differencePct.toFixed(1)}% barato
                              </span>
                            ) : (
                              <span className="text-[9.5px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" title="Precio emparejado con el mercado">IGUAL AL PROMEDIO</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">RD$ {p.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
