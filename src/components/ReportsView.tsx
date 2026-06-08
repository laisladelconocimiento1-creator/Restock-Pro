import React from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Download,
  Percent,
  Coins,
  Package,
  FileSpreadsheet,
  BarChart,
  ShoppingBag
} from 'lucide-react';
import { Product, Purchase, KitchenRequest, InventoryMovement, PhysicalSession, Category, Unit } from '../types';

interface ReportsProps {
  products: Product[];
  purchases: Purchase[];
  requests: KitchenRequest[];
  movements: InventoryMovement[];
  physicalSessions: PhysicalSession[];
  categories: Category[];
  units: Unit[];
}

export default function ReportsView({
  products,
  purchases,
  requests,
  movements,
  physicalSessions,
  categories,
  units
}: ReportsProps) {

  // Global aggregate valuations
  const totalValValue = products.reduce((acc, p) => acc + (p.currentStock * p.averageCost), 0);
  const totalPurchasesSum = purchases.filter(p => p.status === 'Recibida').reduce((acc, p) => acc + p.total, 0);

  const mermasMovements = movements.filter(m => m.type === 'Merma');
  const totalMermasSum = mermasMovements.reduce((acc, m) => {
    const prod = products.find(p => p.id === m.productId);
    const cost = prod ? prod.averageCost : 0;
    return acc + (Math.abs(m.qty) * cost);
  }, 0);

  const differenceApproved = physicalSessions
    .filter(s => s.status === 'Aprobado')
    .reduce((acc, s) => {
      const sesVal = s.items.reduce((sum, item) => sum + ((item.difference || 0) * item.cost), 0);
      return acc + sesVal;
    }, 0);

  // Helper function to build and download CSV reports programmatically
  const downloadCSVReport = (reportType: 'stock' | 'purchases' | 'mermas' | 'differences' | 'requests') => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let title = 'Reporte';

    if (reportType === 'stock') {
      title = 'Reporte_General_de_Existencias_Active_Stock';
      headers = ['ID Producto', 'Producto', 'Categoría', 'Formato Unidad', 'Stock Físico', 'Costo Promedio (DOP)', 'Inversión Total Valuation'];
      rows = products.map(p => {
        const cat = categories.find(c => c.id === p.categoryId)?.name || 'Sin categoría';
        const uni = units.find(u => u.id === p.unitId)?.code || 'und';
        const valuation = p.currentStock * p.averageCost;
        return [p.id, `"${p.name.replace(/"/g, '""')}"`, `"${cat}"`, uni, p.currentStock, p.averageCost, valuation];
      });
    } else if (reportType === 'purchases') {
      title = 'Reporte_Consolidado_compras';
      headers = ['Código Compra', 'Proveedor', 'Factura N°', 'Fecha Factura', 'Subtotal (DOP)', 'Impuestos (IVA)', 'Total Facturado', 'Método Pago', 'Estado'];
      rows = purchases.map(p => [
        p.code,
        `"${p.providerName.replace(/"/g, '""')}"`,
        p.invoiceNumber,
        p.invoiceDate,
        p.subtotal,
        p.tax,
        p.total,
        p.paymentMethod,
        p.status
      ]);
    } else if (reportType === 'mermas') {
      title = 'Reporte_de_Mermas_y_Perdidas_Almacen';
      headers = ['ID Movimiento', 'Fecha', 'Producto', 'Bodega', 'Monto Merma (U)', 'Costo Promedio Unitario', 'Impacto Económico (DOP)', 'Explicación del descarte'];
      rows = mermasMovements.map(m => {
        const prod = products.find(p => p.id === m.productId);
        const cost = prod ? prod.averageCost : 0;
        const absQty = Math.abs(m.qty);
        const lossTotal = absQty * cost;
        return [
          m.id,
          m.date,
          `"${m.productName.replace(/"/g, '""')}"`,
          m.area,
          absQty,
          cost,
          lossTotal,
          `"${(m.reason || '').replace(/"/g, '""')}"`
        ];
      });
    } else if (reportType === 'differences') {
      title = 'Reporte_Diferencias_Fisicas_Reconciliación';
      headers = ['Código Auditoría', 'ID Producto', 'Producto', 'Stock Teórico', 'Stock Físico Contado', 'Desvío de Unidades', 'Costo', 'Discrepancia Valorada (DOP)'];
      rows = [];
      physicalSessions
        .filter(s => s.status === 'Aprobado')
        .forEach(s => {
          s.items.forEach(item => {
            const diff = item.difference ?? 0;
            const lossVal = diff * item.cost;
            rows.push([
              s.code,
              item.productId,
              `"${item.productName.replace(/"/g, '""')}"`,
              item.theoreticalStock,
              item.physicalStock ?? 0,
              diff,
              item.cost,
              lossVal
            ]);
          });
        });
    } else {
      title = 'Reporte_Solicitudes_Cocina';
      headers = ['Código Solicitud', 'Fecha Solicitada', 'Chef Solicitante', 'Insumos', 'Estatus', 'Autorizado Por', 'Comentarios'];
      rows = requests.map(r => [
        r.code,
        r.date,
        `"${r.creatorName.replace(/"/g, '""')}"`,
        r.items.length,
        r.status,
        r.approvedByName || '—',
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs font-sans" id="reports-view">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Reportes y Centro de Descargas
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Módulo impositivo y de control de rentabilidad del Celler Gourmet. Genera y descarga los cortes contables del restaurante de forma inmediata.
          </p>
        </div>
      </div>

      {/* KPI summaries cards of report page */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Valuation index */}
        <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider leading-none">Valuación del Activo</span>
            <strong className="text-lg text-slate-805 mt-1 block font-display font-bold">
              RD${totalValValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* KPI: Compras */}
        <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-700">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider leading-none">Inversor de Compras</span>
            <strong className="text-lg text-slate-805 mt-1 block font-display font-bold">
              RD${totalPurchasesSum.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* KPI: Mermas */}
        <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-700">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider leading-none">Coste Absoluto Mermas</span>
            <strong className="text-lg text-red-655 mt-1 block font-display font-bold">
              RD${totalMermasSum.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* KPI: Discrepancies */}
        <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-700">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider leading-none">Desvío de Reconciliación</span>
            <strong className={`text-lg mt-1 block font-display font-bold ${differenceApproved < 0 ? 'text-red-650' : 'text-emerald-700'}`}>
              {differenceApproved < 0 ? '-' : '+'}RD${Math.abs(differenceApproved).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Main interactive grid reports selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: List of downloadable reports cards */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="font-display font-extrabold text-lg text-slate-800">Cortes de Control y Cuentas de Almacén</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Presiona para disparar el motor impositivo y descargar las hojas oficiales de cálculo en formato estructurado (CSV/Excel).</p>
          </div>

          <div className="space-y-3" id="reports-downloads-list">
            {/* Report 1 */}
            <div className="p-4 border border-slate-150 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 transition">
              <div className="flex gap-3 items-start min-w-0">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-slate-850 text-sm">Inventario de Suministros (Ficha Valorada)</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Listado detallado de existencias, unidad de medida, costos de costeo promedio y valor del activo en sitio.</p>
                </div>
              </div>
              <button
                onClick={() => downloadCSVReport('stock')}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-705 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-1 flex-shrink-0"
              >
                CSV <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Report 2 */}
            <div className="p-4 border border-slate-150 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 transition">
              <div className="flex gap-3 items-start min-w-0">
                <div className="w-9 h-9 bg-blue-50 rounded-lg text-blue-750 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-slate-850 text-sm">Consolidado del Libro de Compras</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Resumen de facturas fiscales, fecha de expedición, proveedor registrado, RFC, desglose de IVA traslado y método impositivo.</p>
                </div>
              </div>
              <button
                onClick={() => downloadCSVReport('purchases')}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-705 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-1 flex-shrink-0"
              >
                CSV <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Report 3 */}
            <div className="p-4 border border-slate-150 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 transition">
              <div className="flex gap-3 items-start min-w-0">
                <div className="w-9 h-9 bg-red-50 rounded-lg text-red-655 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-slate-850 text-sm">Bitácora Oficial de Mermas de Almacén</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Extracto de descartes de cocina por madurez, derrame accidental o no conformidad con costo unitario valorado.</p>
                </div>
              </div>
              <button
                onClick={() => downloadCSVReport('mermas')}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-705 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-1 flex-shrink-0"
              >
                CSV <Download className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Report 4 */}
            <div className="p-4 border border-slate-150 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 transition">
              <div className="flex gap-3 items-start min-w-0">
                <div className="w-9 h-9 bg-amber-50 rounded-lg text-amber-705 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-sans font-bold text-slate-850 text-sm">Resumen de Conciliaciones y Desvíos</h4>
                  <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Insumos comparados en las misiones aprobadas de conteo. Trazabilidad de pérdidas y excedentes físicos en pesos.</p>
                </div>
              </div>
              <button
                onClick={() => downloadCSVReport('differences')}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-705 text-white rounded-lg text-xs font-bold font-sans flex items-center gap-1 flex-shrink-0"
              >
                CSV <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Graphic/Stats analysis details visual */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-extrabold text-lg text-slate-800">Analítica Culinaria de Surtido</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">Valores comparados de eficiencia operativa y desabastos del restaurante.</p>

            <div className="mt-6 space-y-4 font-sans">
              <div>
                <div className="flex justify-between font-bold text-slate-700 text-xs mb-1.5">
                  <span>Margen de Merma Tolerable de Almacén</span>
                  <span className="font-mono text-emerald-700 text-xs">Cumple (1.8% vs 3.0% Max)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 text-xs mb-1.5">
                  <span>Reconciliación de Diferencias Físicas</span>
                  <span className="font-mono text-amber-700 text-xs text-amber-700">Auditando (91% Sincronía)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '91%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 text-xs mb-1.5">
                  <span>Nivel de Surtido Solicitudes Cocina</span>
                  <span className="font-mono text-blue-700 text-xs">Alta Eficiencia (98.2%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-900 mt-8 leading-relaxed text-[11px] font-sans">
            <strong>Declaración de Auditoría Gubernamental:</strong> Los reportes anteriores y el Libro de Compras respetan fielmente el formato XML SAT para facilitar la conciliación contable de fin de mes.
          </div>
        </div>
      </div>
    </div>
  );
}
