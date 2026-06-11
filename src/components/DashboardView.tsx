import React, { useState } from 'react';
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
  ArrowRight,
  Bell,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Check,
  X,
  AlertCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Product, Purchase, KitchenRequest, InventoryMovement, PhysicalSession, KitchenDailyClose } from '../types';

interface DashboardProps {
  products: Product[];
  purchases: Purchase[];
  requests: KitchenRequest[];
  movements: InventoryMovement[];
  physicalSessions: PhysicalSession[];
  dailyCloses?: KitchenDailyClose[];
  onNavigate: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

export default function DashboardView({
  products,
  purchases,
  requests,
  movements,
  physicalSessions,
  dailyCloses = [],
  onNavigate,
  onQuickAction
}: DashboardProps) {

  // Interactive Notification States
  const [activeAlertFilter, setActiveAlertFilter] = useState<'all' | 'critical' | 'stock' | 'invoice' | 'close'>('all');
  const [alertSearchQuery, setAlertSearchQuery] = useState('');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [showDismissed, setShowDismissed] = useState(false);

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

  // Priority-based Alert Type definition
  interface PriorityAlert {
    id: string;
    type: 'danger' | 'warning' | 'info';
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'stock' | 'invoice' | 'close' | 'request';
    title: string;
    text: string;
    actionTab: string;
    badge: string;
    date?: string;
  }

  const derivedAlerts: PriorityAlert[] = [];

  // 1. Stock alerts (Stock Bajo / Agotado)
  products.forEach(p => {
    if (p.currentStock <= 0) {
      derivedAlerts.push({
        id: `alert-out-${p.id}`,
        type: 'danger',
        priority: 'critical',
        category: 'stock',
        title: '¡Sin Existencias!',
        text: `El insumo "${p.name}" está totalmente agotado. Requiere reabastecimiento urgente.`,
        actionTab: 'Inventario',
        badge: 'Crítica'
      });
    } else if (p.currentStock <= p.minStock) {
      derivedAlerts.push({
        id: `alert-low-${p.id}`,
        type: 'warning',
        priority: 'high',
        category: 'stock',
        title: 'Stock Bajo Mínimo',
        text: `El nivel de "${p.name}" está en ${p.currentStock} (Mínimo establecido: ${p.minStock}).`,
        actionTab: 'Inventario',
        badge: 'Alta'
      });
    }
  });

  // 2. Pending Invoices (Facturas Pendientes de Recibir / Conciliar)
  purchases.forEach(p => {
    if (p.status === 'Pendiente') {
      derivedAlerts.push({
        id: `alert-pur-${p.id}`,
        type: 'info',
        priority: 'medium',
        category: 'invoice',
        title: 'Factura de Compra Pendiente',
        text: `La factura de compra ${p.invoiceNumber || p.code} del proveedor "${p.providerName}" por RD$${p.total.toLocaleString('es-DO')} continúa en estado Pendiente.`,
        actionTab: 'Compras',
        badge: 'Media',
        date: p.date
      });
    }
  });

  // 3. Kitchen closures with physical/count differences (Cierres Diarios con Diferencias)
  dailyCloses.forEach(c => {
    const hasDiff = c.items.some(it => it.difference !== 0);
    if (hasDiff) {
      const diffCount = c.items.filter(it => it.difference !== 0).length;
      const totalDiffValue = c.items.reduce((acc, it) => acc + Math.abs(it.differenceValue || 0), 0);
      derivedAlerts.push({
        id: `alert-close-${c.id}`,
        type: 'danger',
        priority: 'critical',
        category: 'close',
        title: 'Cierre Diario con Desviaciones',
        text: `Cierre del ${new Date(c.date + 'T12:00:00').toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })} presenta discrepancias de stock físico en ${diffCount} insumo(s). Valor de desviación: RD$${totalDiffValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`,
        actionTab: 'Porcionamiento',
        badge: 'Crítica',
        date: c.date
      });
    }
  });

  // 4. Kitchen Requisitions (Solicitudes)
  requests.forEach(r => {
    if (r.status === 'Pendiente') {
      derivedAlerts.push({
        id: `alert-req-${r.id}`,
        type: 'warning',
        priority: 'medium',
        category: 'request',
        title: 'Requisición de Cocina Pendiente',
        text: `Solicitud de insumos ${r.code} enviada por ${r.creatorName} requiere firmas y revisión autorizada para despacho.`,
        actionTab: 'Solicitudes de cocina',
        badge: 'Media'
      });
    }
  });

  // Filter and Search Alert list
  const visibleAlerts = derivedAlerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(alertSearchQuery.toLowerCase()) || 
                          alert.text.toLowerCase().includes(alertSearchQuery.toLowerCase());
    
    const isDismissed = dismissedAlerts.includes(alert.id);
    const matchesDismissed = showDismissed ? isDismissed : !isDismissed;

    let matchesCategory = true;
    if (activeAlertFilter === 'critical') {
      matchesCategory = alert.priority === 'critical' || alert.priority === 'high';
    } else if (activeAlertFilter === 'stock') {
      matchesCategory = alert.category === 'stock';
    } else if (activeAlertFilter === 'invoice') {
      matchesCategory = alert.category === 'invoice';
    } else if (activeAlertFilter === 'close') {
      matchesCategory = alert.category === 'close';
    }

    return matchesSearch && matchesDismissed && matchesCategory;
  });

  const criticalCount = derivedAlerts.filter(a => (a.priority === 'critical' || a.priority === 'high') && !dismissedAlerts.includes(a.id)).length;
  const stockCount = derivedAlerts.filter(a => a.category === 'stock' && !dismissedAlerts.includes(a.id)).length;
  const invoiceCount = derivedAlerts.filter(a => a.category === 'invoice' && !dismissedAlerts.includes(a.id)).length;
  const closeCount = derivedAlerts.filter(a => a.category === 'close' && !dismissedAlerts.includes(a.id)).length;
  const totalActiveCount = derivedAlerts.filter(a => !dismissedAlerts.includes(a.id)).length;

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
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between" id="notifications-priority-panel">
          <div className="space-y-4">
            {/* Header with quick stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 animate-fade-in">
              <div>
                <h3 className="font-display font-extrabold text-lg text-slate-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600 animate-bounce" />
                  Alerta General de Control
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium">
                  Monitoreo de desvíos, inventario crítico y trámites pendientes.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${totalActiveCount > 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {totalActiveCount} PENDIENTES
                </span>
                {dismissedAlerts.length > 0 && (
                  <button
                    onClick={() => setShowDismissed(!showDismissed)}
                    className={`p-1 border rounded text-[10px] font-bold flex items-center gap-1 transition ${showDismissed ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-250 text-slate-550'}`}
                    title={showDismissed ? "Ver activas" : "Ver archivadas"}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showDismissed ? 'Ver Activas' : 'Historial'} ({dismissedAlerts.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="space-y-3">
              {/* Category buttons list */}
              <div className="flex flex-wrap gap-1.5" id="alert-category-tabs">
                <button
                  onClick={() => setActiveAlertFilter('all')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition flex items-center gap-1 ${activeAlertFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Todas ({totalActiveCount + (showDismissed ? 0 : dismissedAlerts.length * 0)})
                </button>
                <button
                  onClick={() => setActiveAlertFilter('critical')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition flex items-center gap-1 ${activeAlertFilter === 'critical' ? 'bg-red-650 text-white animate-pulse' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-105'}`}
                >
                  {criticalCount > 0 && <span className="w-1.5 h-1.5 bg-white rounded-full block" />}
                  Críticas ({criticalCount})
                </button>
                <button
                  onClick={() => setActiveAlertFilter('stock')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition flex items-center gap-1 ${activeAlertFilter === 'stock' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-105'}`}
                >
                  Stock Bajo ({stockCount})
                </button>
                <button
                  onClick={() => setActiveAlertFilter('invoice')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition flex items-center gap-1 ${activeAlertFilter === 'invoice' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  Facturas ({invoiceCount})
                </button>
                <button
                  onClick={() => setActiveAlertFilter('close')}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition flex items-center gap-1 ${activeAlertFilter === 'close' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-105'}`}
                >
                  Diferencias Cierres ({closeCount})
                </button>
              </div>

              {/* Search input with search icon + Quick multi-actions */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={alertSearchQuery}
                    onChange={(e) => setAlertSearchQuery(e.target.value)}
                    placeholder="Filtrar por insumo, proveedor o estado..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white outline-none focus:ring-1 focus:ring-slate-300 font-sans"
                  />
                  {alertSearchQuery && (
                    <button onClick={() => setAlertSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!showDismissed && visibleAlerts.length > 1 && (
                  <button
                    onClick={() => {
                      const allVisibleIds = visibleAlerts.map(a => a.id);
                      setDismissedAlerts([...dismissedAlerts, ...allVisibleIds]);
                    }}
                    className="px-3 py-1.5 border border-slate-200/80 hover:bg-slate-50 text-slate-600 font-sans text-[10.5px] font-bold rounded-xl flex items-center gap-1 transition shrink-0"
                    title="Archivar Todo"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    Archivar Filtradas
                  </button>
                )}
              </div>
            </div>

            {/* List of priority notifications inside scroll container */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1" id="dashboard-alerts-list">
              {visibleAlerts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <div className="inline-flex w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Sin notificaciones reportadas</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                    {showDismissed 
                      ? 'No hay alertas en tu bandeja de archivados.' 
                      : '¡Buen trabajo! Todo está al día y bajo los rangos de tolerancia establecidos.'}
                  </p>
                </div>
              ) : (
                visibleAlerts.map((alert) => {
                  let borderClass = 'border-l-4 border-l-slate-400 bg-slate-50 border-slate-150';
                  let badgeColors = 'bg-slate-100 text-slate-600';
                  let bulletPulse = 'bg-slate-400';

                  if (alert.priority === 'critical') {
                    borderClass = 'border-l-4 border-l-red-600 bg-red-50/40 border-red-100 text-red-950';
                    badgeColors = 'bg-red-100 text-red-700 border border-red-200/50';
                    bulletPulse = 'bg-red-600';
                  } else if (alert.priority === 'high') {
                    borderClass = 'border-l-4 border-l-amber-500 bg-amber-50/40 border-amber-100 text-amber-955';
                    badgeColors = 'bg-amber-100 text-amber-800 border border-amber-200/50';
                    bulletPulse = 'bg-amber-600';
                  } else if (alert.priority === 'medium') {
                    borderClass = 'border-l-4 border-l-indigo-500 bg-indigo-50/40 border-indigo-100 text-indigo-950';
                    badgeColors = 'bg-indigo-100 text-indigo-700 border border-indigo-200/40';
                    bulletPulse = 'bg-indigo-505';
                  }

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start gap-4 transition hover:shadow-sm ${borderClass}`}
                    >
                      {/* Left: Indicator Bullet + Category Label */}
                      <div className="flex gap-2.5 items-start flex-1">
                        <div className="mt-1 flex-shrink-0">
                          <span className={`w-2 h-2 rounded-full block animate-pulse ${bulletPulse}`} />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-slate-800 text-[11.5px]">
                              {alert.title}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wider ${badgeColors}`}>
                              {alert.badge.toUpperCase()}
                            </span>
                            {alert.category === 'close' && (
                              <span className="bg-rose-55 text-rose-700 text-[8px] font-bold px-1.5 rounded uppercase border border-rose-150">
                                Desvío de Cierre
                              </span>
                            )}
                            {alert.category === 'invoice' && (
                              <span className="bg-indigo-55 text-indigo-700 text-[8px] font-bold px-1.5 rounded uppercase border border-indigo-155">
                                Pago Pendiente
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-sans text-slate-650 leading-relaxed font-semibold">
                            {alert.text}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions Button Container */}
                      <div className="flex items-center sm:self-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-205/60 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => onNavigate(alert.actionTab)}
                          className="px-2.5 py-1 text-[10.5px] font-sans font-extrabold flex items-center gap-1 text-slate-700 hover:text-slate-900 border border-slate-250 hover:bg-slate-50 bg-white rounded-lg transition"
                        >
                          Ir a sección
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {showDismissed ? (
                          <button
                            onClick={() => setDismissedAlerts(dismissedAlerts.filter(id => id !== alert.id))}
                            className="p-1 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg transition"
                            title="Restaurar de archivados"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setDismissedAlerts([...dismissedAlerts, alert.id])}
                            className="p-1 border border-slate-200 hover:bg-slate-50 text-slate-550 hover:text-slate-700 rounded-lg transition"
                            title="Archivar notificación"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {lastApprovedPhysSession && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
              <span className="font-medium flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                Diferencia última conciliación física: <strong className="font-bold">{lastApprovedPhysSession.code}</strong>
              </span>
              <span className={`font-semibold py-0.5 px-2 rounded-full ${physicalDifferenceCost < 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {physicalDifferenceCost < 0 ? '-' : '+'}RD${Math.abs(physicalDifferenceCost).toLocaleString('es-DO')}
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
