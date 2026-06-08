import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Plus,
  Box,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Product, Purchase, KitchenRequest, InventoryMovement, PhysicalSession } from '../types';

interface DashboardProps {
  products: Product[];
  purchases: Purchase[];
  requests: KitchenRequest[];
  movements: InventoryMovement[];
  physicalSessions: PhysicalSession[];
  onNavigate: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

export default function DashboardView({
  products,
  purchases,
  requests,
  movements,
  physicalSessions,
  onNavigate,
  onQuickAction
}: DashboardProps) {

  // Calculate live statistics
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.currentStock * p.averageCost), 0);
  const lowStockProductsCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockProductsCount = products.filter(p => p.currentStock <= 0).length;

  const currentMonthPurchasesTotal = purchases
    .filter(p => p.status === 'Recibida')
    .reduce((acc, p) => acc + p.total, 0);

  const pendingInvoicesCount = purchases.filter(p => p.status === 'Pendiente').length;
  const pendingRequestsCount = requests.filter(r => r.status === 'Pendiente').length;

  // Differences values from Physical sessions
  const lastApprovedPhysSession = physicalSessions.find(s => s.status === 'Aprobado');
  let physicalDifferenceCost = 0;
  if (lastApprovedPhysSession) {
    physicalDifferenceCost = lastApprovedPhysSession.items.reduce((acc, item) => {
      if (item.difference !== null) {
        return acc + (item.difference * item.cost);
      }
      return acc;
    }, 0);
  }

  // Mermas totals
  const totalMermasCost = movements
    .filter(m => m.type === 'Merma')
    .reduce((acc, m) => {
      const prod = products.find(p => p.id === m.productId);
      const cost = prod ? prod.averageCost : 0;
      return acc + (Math.abs(m.qty) * cost);
    }, 0);

  // Top products consumed (Salida)
  const productConsumptionMap: Record<string, { name: string; qty: number; unit: string; value: number }> = {};
  movements
    .filter(m => m.type === 'Salida')
    .forEach(m => {
      const prod = products.find(p => p.id === m.productId);
      const cost = prod ? prod.averageCost : 0;
      const absQty = Math.abs(m.qty);
      if (!productConsumptionMap[m.productId]) {
        productConsumptionMap[m.productId] = { name: m.productName, qty: 0, unit: m.unitCode, value: 0 };
      }
      productConsumptionMap[m.productId].qty += absQty;
      productConsumptionMap[m.productId].value += absQty * cost;
    });

  const topConsumed = Object.values(productConsumptionMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  // Category values distribution for quick bento chart
  const categoryMap: Record<string, number> = {};
  products.forEach(p => {
    categoryMap[p.categoryId] = (categoryMap[p.categoryId] || 0) + (p.currentStock * p.averageCost);
  });

  // Critical alerts list
  const alerts: { id: string; type: 'danger' | 'warning' | 'info'; text: string; actionTab: string }[] = [];

  products.forEach(p => {
    if (p.currentStock <= 0) {
      alerts.push({
        id: `alert-out-${p.id}`,
        type: 'danger',
        text: `¡Sin existencias! El producto "${p.name}" está totalmente agotado.`,
        actionTab: 'inventory'
      });
    } else if (p.currentStock <= p.minStock) {
      alerts.push({
        id: `alert-low-${p.id}`,
        type: 'warning',
        text: `Stock bajo mínimo: "${p.name}" tiene ${p.currentStock} lb/pz (Mínimo requerido: ${p.minStock}).`,
        actionTab: 'inventory'
      });
    }
  });

  purchases.forEach(p => {
    if (p.status === 'Pendiente') {
      alerts.push({
        id: `alert-pur-${p.id}`,
        type: 'info',
        text: `Factura pendiente del proveedor ${p.providerName}. Número: ${p.invoiceNumber} por RD$${p.total.toLocaleString('es-DO')}.`,
        actionTab: 'purchases'
      });
    }
  });

  requests.forEach(r => {
    if (r.status === 'Pendiente') {
      alerts.push({
        id: `alert-req-${r.id}`,
        type: 'warning',
        text: `Solicitud urgente de cocina pendiente de aprobación: ${r.code} por ${r.creatorName}.`,
        actionTab: 'requests'
      });
    }
  });

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Dashboard Operativo
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Métricas de control, alertas críticas en tiempo real e indicadores del Celler Gourmet.
          </p>
        </div>

        {/* Quick Actions Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onQuickAction('create-request')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 text-white px-3.5 py-1.5 text-xs font-sans font-bold rounded transition shadow-sm"
            id="btn-quick-create-request"
          >
            <Plus className="w-3.5 h-3.5 text-orange-400" />
            Nueva Requisición Cocina
          </button>
          <button
            onClick={() => onQuickAction('create-purchase')}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 text-xs font-sans font-bold rounded transition shadow-sm"
            id="btn-quick-create-purchase"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Compra / Factura
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="dashboard-kpi-grid">
        {/* KPI 1: Inventory Value */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400">
              Valor Total Inventario
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-slate-800">
              RD${totalInventoryValue.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-sans font-medium text-slate-400">DOP</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-sans font-medium text-slate-500">
            <span>Control de <strong className="font-bold text-slate-700">{products.length}</strong> productos activos</span>
          </div>
        </div>

        {/* KPI 2: Critical Stocks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400">
              Stocks Críticos
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${lowStockProductsCount + outOfStockProductsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-2xl font-display font-bold ${lowStockProductsCount + outOfStockProductsCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {lowStockProductsCount + outOfStockProductsCount}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">Productos</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-sans font-bold text-slate-500">
            <span className="text-red-600 font-extrabold">{outOfStockProductsCount} sin stock</span>
            <span>•</span>
            <span className="text-amber-600">{lowStockProductsCount} bajo mínimo</span>
          </div>
        </div>

        {/* KPI 3: Monthly Purchases */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400">
              Compras del Mes
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-slate-800">
              RD${currentMonthPurchasesTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-sans font-medium text-slate-400">RECIBIDAS</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-sans font-medium text-slate-500">
            <span className="font-bold text-blue-600">{pendingInvoicesCount} facturas</span>
            <span>pendientes de recepción</span>
          </div>
        </div>

        {/* KPI 4: Pending Operations */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400">
              Trámites de Cocina
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-purple-600">
              {pendingRequestsCount}
            </span>
            <span className="text-xs font-sans font-medium text-slate-400">Pendientes</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[11px] font-sans font-medium text-slate-500">
            <span>Requieren aprobación de Gerencia</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Alerts + Bento Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Alertas Críticas (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alertas y Pendientes Críticos
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5 mb-5 font-medium">Acciones operativas que requieren atención inmediata.</p>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1" id="dashboard-alerts-list">
              {alerts.length === 0 ? (
                <div className="text-center py-10">
                  <div className="inline-flex w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-3">
                    ✔
                  </div>
                  <p className="text-sm font-medium text-slate-600">¡Todo al día!</p>
                  <p className="text-xs text-slate-400">No hay alertas de stock bajo ni facturas críticas pendientes.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition hover:shadow-sm ${
                      alert.type === 'danger'
                        ? 'bg-red-50/50 border-red-100 text-red-900'
                        : alert.type === 'warning'
                        ? 'bg-amber-50/50 border-amber-100 text-amber-900'
                        : 'bg-blue-50/50 border-blue-100 text-blue-900'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full block animate-pulse ${
                        alert.type === 'danger' ? 'bg-red-600' : alert.type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-sans font-semibold leading-relaxed truncate-3-lines">
                        {alert.text}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate(alert.actionTab)}
                      className="text-xs font-semibold flex items-center text-slate-600 hover:text-slate-900 underline flex-shrink-0"
                    >
                      Ver <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {lastApprovedPhysSession && (
            <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                Última reconciliación física aprobada: <strong className="font-bold">{lastApprovedPhysSession.code}</strong>
              </span>
              <span className={`font-semibold py-0.5 px-2 rounded-full ${physicalDifferenceCost < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                Discrepancia: {physicalDifferenceCost < 0 ? '-' : '+'}RD${Math.abs(physicalDifferenceCost).toLocaleString('es-DO')}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Mini charts / Bento Stats (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          {/* Top consuming list & Mermas chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="font-display font-bold text-lg text-slate-800">Top Consumo e Ingredientes</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5 mb-5 font-medium">Mayor desplazamiento económico directo de cocina.</p>

            <div className="space-y-4" id="dashboard-top-consumed">
              {topConsumed.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">Registra movimientos de salida o solicitudes aprobadas para ver analíticas.</p>
              ) : (
                topConsumed.map((item, index) => {
                  const maxVal = topConsumed[0]?.value || 1;
                  const pct = Math.round((item.value / maxVal) * 100);
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-sans font-bold text-slate-700 truncate max-w-[190px]">
                          {index + 1}. {item.name}
                        </span>
                        <span className="font-mono font-semibold text-slate-600">
                          {item.qty} {item.unit} (RD${Math.round(item.value).toLocaleString('es-DO')})
                        </span>
                      </div>
                      <div className="w-full bg-slate-150 rounded-full h-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-sans text-slate-450 block font-bold uppercase tracking-wider">Total Mermas / Pérdidas:</span>
                <span className="text-base font-display font-bold text-red-600">
                  RD${totalMermasCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={() => onNavigate('movements')}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
              >
                Auditar mermas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Stats list Category percentages */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-400 uppercase tracking-wider">Distribución Económica</h3>
              <h4 className="font-sans font-bold text-base text-slate-700 mt-1">Capital Activo en Almacenes</h4>
            </div>

            <div className="space-y-2.5 mt-4">
              {Object.entries(categoryMap).slice(0, 3).map(([catId, value]) => {
                const totalVal = Object.values(categoryMap).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((value / totalVal) * 100);
                const catName = products.find(p => p.categoryId === catId) ? products.find(p => p.categoryId === catId)!.categoryId : 'Otros';
                // let's translate catId
                const name = catId === 'cat-1' ? 'Carnes' : catId === 'cat-2' ? 'Verduras' : catId === 'cat-3' ? 'Lácteos' : catId === 'cat-4' ? 'Abarrotes' : catId === 'cat-5' ? 'Bebidas' : 'Otros';
                return (
                  <div key={catId} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">RD${Math.round(value).toLocaleString('es-DO')}</span>
                      <span className="font-sans font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onNavigate('reports')}
              className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border border-slate-200 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Ver Reportes Financieros Completos
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Latest Purchases & Latest Movements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Latest Purchases */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-base text-slate-800">Historial de Compras Recientes</h3>
            <button
              onClick={() => onNavigate('purchases')}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5"
            >
              Ver compras <ChevronRight className="w-4 h-4 text-orange-500" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {/* Desktop and Tablet table view */}
            <table className="hidden sm:table w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5">Código</th>
                  <th className="py-2.5">Proveedor</th>
                  <th className="py-2.5">Monto</th>
                  <th className="py-2.5">Método de pago</th>
                  <th className="py-2.5 text-right font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="dashboard-latest-purchases">
                {purchases.slice(0, 4).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-semibold text-slate-800">{p.code}</td>
                    <td className="py-3 text-slate-600 font-semibold truncate max-w-[150px]">{p.providerName}</td>
                    <td className="py-3 font-mono font-bold text-slate-700">RD${p.total.toLocaleString('es-DO')}</td>
                    <td className="py-3 text-slate-500 font-medium">{p.paymentMethod}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                        p.status === 'Recibida'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : p.status === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile card-based list */}
            <div className="sm:hidden space-y-3" id="dashboard-latest-purchases-mobile">
              {purchases.slice(0, 4).length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Sin compras recientes registradas</p>
              ) : (
                purchases.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="font-sans font-bold text-slate-800">{p.code}</strong>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                        p.status === 'Recibida'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : p.status === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Proveedor:</span>
                      <strong className="text-slate-800 truncate max-w-[150px]">{p.providerName}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Método:</span>
                      <span className="font-medium text-slate-700">{p.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 mt-1">
                      <span className="text-slate-450 uppercase text-[9px] font-bold">Total:</span>
                      <strong className="font-mono text-emerald-700 font-extrabold text-sm">RD${p.total.toLocaleString('es-DO')}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Latest Movements */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-slate-800">Últimos Movimientos de Stock</h3>
            <button
              onClick={() => onNavigate('movements')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
            >
              Ver kárdex <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1" id="dashboard-latest-movements">
            {movements.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-dashed border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    m.type === 'Entrada'
                      ? 'bg-emerald-50 text-emerald-600'
                      : m.type === 'Salida'
                      ? 'bg-red-50 text-red-600'
                      : m.type === 'Merma'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {m.type.substr(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-sans font-bold text-slate-700 truncate leading-snug">{m.productName}</p>
                    <p className="text-[10px] text-slate-400 font-sans tracking-wide">
                      {m.type} • {m.area} • Por {m.userName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold text-xs ${m.qty > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {m.qty > 0 ? '+' : ''}{m.qty} {m.unitCode}
                  </span>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                    {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
