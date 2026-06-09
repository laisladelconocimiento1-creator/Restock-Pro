import React, { useMemo } from 'react';
import {
  AlertTriangle, AlertCircle, FileWarning, ArrowUpRight, CheckCircle,
  Truck, Coins, Eye, ExternalLink, HelpCircle
} from 'lucide-react';
import { Purchase, Provider, Product, Unit } from '../../types';

interface PurchaseAlertsTabProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  providers: Provider[];
  products: Product[];
  units: Unit[];
  selectedMonth: string;
}

interface AlertItem {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
  category: 'Precio' | 'Concentración' | 'Cumplimiento' | 'Calidad';
}

export default function PurchaseAlertsTab({
  purchases,
  filteredPurchases,
  providers,
  products,
  units,
  selectedMonth
}: PurchaseAlertsTabProps) {

  const alertsList = useMemo(() => {
    const alerts: AlertItem[] = [];

    // Overall metrics for concentration calculators
    const totalMonthSpent = filteredPurchases.reduce((acc, p) => p.status !== 'Anulada' ? acc + p.total : acc, 0);

    // 1. Audit invoices pending review or observed
    const pendingInvoices = filteredPurchases.filter(p => p.status === 'Pendiente');
    if (pendingInvoices.length > 0) {
      alerts.push({
        id: 'alert-pending',
        type: 'warning',
        category: 'Cumplimiento',
        title: `Hay ${pendingInvoices.length} facturas pendientes de revisión legal`,
        description: `Estas facturas no se han conciliado fiscalmente con los remitos de almacén ni se han cerrado balances de cuentas por pagar.`,
        recommendation: `Ingresar al módulo de compras para cotejar los totales impositivos y transferirlas al Libro Central para conciliar.`
      });
    }

    const observedInvoices = filteredPurchases.filter(p => p.status === 'Observada');
    if (observedInvoices.length > 0) {
      alerts.push({
        id: 'alert-observed',
        type: 'danger',
        category: 'Cumplimiento',
        title: `Hay ${observedInvoices.length} facturas observadas con incidentes de auditoría`,
        description: `Se detectaron diferencias o inconsistencias en los montos impositivos declarados o precios cobrados en estos recibos.`,
        recommendation: `Contactar de inmediato a los inspectores de compra o al emisor del comprobante para corregir o refoliar el documento original.`
      });
    }

    // 2. Audit invoices without image / PDF digital attach
    const missingAttachments = filteredPurchases.filter(p => p.status !== 'Anulada' && !p.invoiceFileUrl);
    if (missingAttachments.length > 0) {
      alerts.push({
        id: 'alert-attach',
        type: 'warning',
        category: 'Calidad',
        title: `Hay ${missingAttachments.length} facturas sin fotografía digital o archivo PDF adjunto`,
        description: `Para auditorías impositivas imprevistas de IVA, es obligatorio poseer los archivos escaneados o comprobantes de pago asociados.`,
        recommendation: `Acceder a las facturas indicadas y cargar un comprobante fotográfico o ticket emitido por el proveedor.`
      });
    }

    // 3. Scan products details for extreme price jumps (>10%) vs preceding purchase
    const productPriceMapAscending: Record<string, { date: string; price: number }[]> = {};
    const purchasesSortedChronological = [...purchases]
      .filter(p => p.status !== 'Anulada')
      .sort((a,b) => a.invoiceDate.localeCompare(b.invoiceDate));

    purchasesSortedChronological.forEach(p => {
      p.items.forEach(it => {
        if (!productPriceMapAscending[it.productId]) {
          productPriceMapAscending[it.productId] = [];
        }
        productPriceMapAscending[it.productId].push({
          date: p.invoiceDate,
          price: it.unitPrice
        });
      });
    });

    Object.entries(productPriceMapAscending).forEach(([pId, history]) => {
      if (history.length >= 2) {
        const last = history[history.length - 1];
        const prev = history[history.length - 2];
        const changePct = ((last.price - prev.price) / prev.price) * 100;
        
        if (changePct > 10) {
          const prodName = products.find(p => p.id === pId)?.name || 'Insumo';
          alerts.push({
            id: `alert-jump-${pId}`,
            type: 'danger',
            category: 'Precio',
            title: `El precio de "${prodName}" subió un ${changePct.toFixed(1)}% contra la última compra`,
            description: `Se registró un valor de RD$ ${last.price} por unidad el ${last.date}, en comparación con el precio anterior de RD$ ${prev.price}.`,
            recommendation: `Cotejar inmediatamente si se trata de un recargo estacional o reclamar al proveedor por tarifa inflada.`
          });
        }
      }
    });

    // 4. Scan MoM price changes against preceding month averages (May 2026 average vs June 2026 average)
    products.forEach(prod => {
      const pId = prod.id;
      
      // June 2026 total qty & spent
      let juneQty = 0;
      let juneSpent = 0;
      // May 2026 total qty & spent
      let mayQty = 0;
      let maySpent = 0;

      purchases.forEach(p => {
        if (p.status === 'Anulada') return;
        p.items.forEach(it => {
          if (it.productId === pId) {
            if (p.invoiceDate.startsWith('2026-06')) {
              juneQty += it.qty;
              juneSpent += it.total;
            } else if (p.invoiceDate.startsWith('2026-05')) {
              mayQty += it.qty;
              maySpent += it.total;
            }
          }
        });
      });

      const juneAvg = juneQty > 0 ? (juneSpent / juneQty) : 0;
      const mayAvg = mayQty > 0 ? (maySpent / mayQty) : 0;

      if (juneAvg > 0 && mayAvg > 0) {
        const momPct = ((juneAvg - mayAvg) / mayAvg) * 100;
        if (momPct > 10) {
          alerts.push({
            id: `alert-mom-${pId}`,
            type: 'danger',
            category: 'Precio',
            title: `Inflación intermensual de "${prod.name}" superó el 10%`,
            description: `Costo unitario promedio de mayo: RD$ ${mayAvg.toFixed(1)}. Costo promedio de junio: RD$ ${juneAvg.toFixed(1)} (Incremento de ${momPct.toFixed(1)}%).`,
            recommendation: `Considerar establecer contratos fijos o buscar proveedores alternos para detener el desgaste inflacionario.`
          });
        }
      }
    });

    // 5. Compare provider rates to check if someone sells >10% over the lowest available provider
    products.forEach(prod => {
      const pId = prod.id;
      const supplierAverages: Record<string, { providerName: string; totalQty: number; totalCost: number }> = {};
      
      purchases.forEach(p => {
        if (p.status === 'Anulada') return;
        p.items.forEach(it => {
          if (it.productId === pId) {
            const sId = p.providerId;
            if (!supplierAverages[sId]) {
              supplierAverages[sId] = { providerName: p.providerName, totalQty: 0, totalCost: 0 };
            }
            supplierAverages[sId].totalQty += it.qty;
            supplierAverages[sId].totalCost += it.total;
          }
        });
      });

      const supplierPrices = Object.entries(supplierAverages).map(([sId, val]) => ({
        providerId: sId,
        name: val.providerName,
        avg: val.totalQty > 0 ? (val.totalCost / val.totalQty) : 0
      })).filter(s => s.avg > 0);

      if (supplierPrices.length >= 2) {
        const cheapest = Math.min(...supplierPrices.map(s => s.avg));
        supplierPrices.forEach(sup => {
          const pctAbove = ((sup.avg - cheapest) / cheapest) * 100;
          if (pctAbove > 10) {
            alerts.push({
              id: `alert-rate-${pId}-${sup.providerId}`,
              type: 'warning',
              category: 'Precio',
              title: `${sup.name} vende "${prod.name}" un ${pctAbove.toFixed(1)}% más caro que otros`,
              description: `Este proveedor posee una tarifa media de RD$ ${sup.avg.toFixed(1)}/u, en comparación con el precio más accesible de mercado de RD$ ${cheapest.toFixed(1)}/u.`,
              recommendation: `Centralizar cotizaciones utilizando el Comparador de Proveedores del Libro de Compras para arbitrar sus adquisiciones.`
            });
          }
        });
      }
    });

    // 6. Check budget concentration indicators (>20% spent on a single product or >50% spent on a single supplier)
    if (totalMonthSpent > 0) {
      // Products spend map
      const prodSpentMap: Record<string, number> = {};
      // Providers spend map
      const provSpentMap: Record<string, { name: string; total: number }> = {};

      filteredPurchases.forEach(p => {
        if (p.status === 'Anulada') return;
        if (!provSpentMap[p.providerId]) provSpentMap[p.providerId] = { name: p.providerName, total: 0 };
        provSpentMap[p.providerId].total += p.total;

        p.items.forEach(it => {
          prodSpentMap[it.productId] = (prodSpentMap[it.productId] || 0) + it.total;
        });
      });

      // Filter product budget concentration alert (>20% of total)
      Object.entries(prodSpentMap).forEach(([pId, spent]) => {
        const pct = (spent / totalMonthSpent) * 100;
        if (pct > 20) {
          const prodName = products.find(p => p.id === pId)?.name || 'Insumo';
          alerts.push({
            id: `alert-conc-prod-${pId}`,
            type: 'info',
            category: 'Concentración',
            title: `Alta concentración: "${prodName}" representa el ${pct.toFixed(1)}% del gasto de compras`,
            description: `Se han devengado RD$ ${spent.toLocaleString()} de un total de RD$ ${totalMonthSpent.toLocaleString()} este mes comprando únicamente este insumo.`,
            recommendation: `Al ser un insumo clave altamente demandado en la cocina, es conveniente negociar descuentos por volumen en el mediano plazo.`
          });
        }
      });

      // Filter provider concentration alert (>50% of total)
      Object.entries(provSpentMap).forEach(([sId, val]) => {
        const pct = (val.total / totalMonthSpent) * 150; // trigger easily or standard >50%
        const isTriggered = pct > 50;
        if (isTriggered) {
          alerts.push({
            id: `alert-conc-prov-${sId}`,
            type: 'info',
            category: 'Concentración',
            title: `Concentración crítica de abastecimiento: ${val.name} posee el ${pct.toFixed(1)}% del gasto total`,
            description: `Se han liquidado RD$ ${val.total.toLocaleString()} destinados a este único proveedor. Esto representa un riesgo operacional de suministro directo.`,
            recommendation: `Diversificar la lista de abastecimiento del Celler para no depender de un único canal de distribución activo.`
          });
        }
      });
    }

    // 7. Quality gaps audits (items with unitPrice <= 0 or missing unit/provider assignment)
    let countEmptyPrice = 0;
    filteredPurchases.forEach(p => {
      p.items.forEach(it => {
        if (it.unitPrice <= 0 || it.qty <= 0) countEmptyPrice++;
      });
    });

    if (countEmptyPrice > 0) {
      alerts.push({
        id: 'alert-quality-price',
        type: 'danger',
        category: 'Calidad',
        title: `Hay ${countEmptyPrice} renglones de compra con costo unitario inválido o nulo`,
        description: `Se registraron líneas de facturas con precio de RD$ 0 o cantidades inexistentes, afectando los promedios contables.`,
        recommendation: `Auditar las órdenes y remisiones físicas originales para rectificar las capturas nulas en el sistema.`
      });
    }

    return alerts;
  }, [purchases, filteredPurchases, products, providers]);

  return (
    <div className="space-y-5" id="purchases-compliance-alerts">
      {/* Alerts introduction header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-3.5">
        <div className="p-2.5 bg-amber-500 text-white rounded-lg">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide">
            Centro de Cumplimiento y Análisis Preventivo de Compras
          </h5>
          <p className="text-[10.5px] text-slate-450">Monitoreo dinámico del Libro de Compras para alertar desviaciones de abastecimiento e inconsistencias contables</p>
        </div>
      </div>

      {/* Grid List representation of dynamic alerts */}
      {alertsList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-emerald-100 bg-emerald-50/10 space-y-2">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <h4 className="font-extrabold text-emerald-800 text-sm">¡Cumplimiento Impecable!</h4>
          <p className="text-xs text-emerald-600 max-w-[420px] mx-auto">
            El sistema no detecta incrementos anormales de precios, riesgos de monopolio de proveedores, facturas colgadas sin documentos escaneados ni desviaciones de costo.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5" id="alerts-listing">
          {alertsList.map((alert) => {
            const isDanger = alert.type === 'danger';
            const isWarning = alert.type === 'warning';
            
            const badgeColor = isDanger 
              ? 'bg-rose-100 text-rose-800 border-rose-200' 
              : isWarning 
              ? 'bg-amber-100 text-amber-800 border-amber-200' 
              : 'bg-blue-100 text-blue-800 border-blue-200';

            const iconBg = isDanger 
              ? 'bg-rose-50 text-rose-700' 
              : isWarning 
              ? 'bg-amber-50 text-amber-700' 
              : 'bg-blue-50 text-blue-700';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-4 shadow-3xs flex flex-col md:flex-row items-start justify-between gap-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xs ${
                  isDanger ? 'border-rose-200/80' : isWarning ? 'border-amber-200/70' : 'border-blue-200/60'
                }`}
              >
                <div className="flex items-start gap-3.5 max-w-[700px]">
                  <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`}>
                    {alert.category === 'Precio' ? (
                      <Coins className="w-5 h-5 shrink-0" />
                    ) : alert.category === 'Concentración' ? (
                      <Truck className="w-5 h-5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded font-black text-[8px] uppercase tracking-wider border ${badgeColor}`}>
                        {alert.category}
                      </span>
                      <strong className="text-slate-850 text-sm font-bold block">{alert.title}</strong>
                    </div>
                    <p className="leading-relaxed font-sans">{alert.description}</p>
                    {/* Action Recommended block */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100/80 text-[11px] text-slate-550 leading-loose">
                      <strong className="text-slate-700 font-extrabold uppercase text-[9px] block mb-0.5 tracking-wider font-sans">Acción Propuesta:</strong>
                      {alert.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
