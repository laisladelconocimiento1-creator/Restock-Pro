import React, { useState, useMemo } from 'react';
import {
  BookOpen, Search, Filter, FileSpreadsheet, Calendar, User,
  ExternalLink, Tag, CheckCircle, Truck, Eye, AlertTriangle,
  Download, ArrowRight, Coins, RefreshCw, Layers, ClipboardList,
  AlertCircle, X
} from 'lucide-react';
import { Purchase, Provider, Product, Unit, Category } from '../types';

// Fallback backing models in case parent props has missing indices
import { 
  mockProducts, 
  mockUnits, 
  mockCategories 
} from '../data/mockData';

// Subcomponents modular layout
import PurchaseFilters from './purchase-book/PurchaseFilters';
import PurchaseSummaryTab from './purchase-book/PurchaseSummaryTab';
import PurchaseProductTab from './purchase-book/PurchaseProductTab';
import PurchaseProviderTab from './purchase-book/PurchaseProviderTab';
import PurchaseCompareTab from './purchase-book/PurchaseCompareTab';
import PurchaseTrendsTab from './purchase-book/PurchaseTrendsTab';
import PurchaseAlertsTab from './purchase-book/PurchaseAlertsTab';
import PurchaseExportTab from './purchase-book/PurchaseExportTab';

interface PurchaseBookProps {
  purchases: Purchase[];
  providers: Provider[];
  products?: Product[];
  units?: Unit[];
  categories?: Category[];
  onViewPurchase: (purchaseId: string) => void;
}

type TabType =
  | 'facturas'
  | 'resumen'
  | 'por_producto'
  | 'por_proveedor'
  | 'comparar_proveedores'
  | 'tendencia_precios'
  | 'alertas'
  | 'exportar';

export default function PurchaseBookView({
  purchases,
  providers,
  products = mockProducts,
  units = mockUnits,
  categories = mockCategories,
  onViewPurchase
}: PurchaseBookProps) {

  // Current tab state
  const [activeTab, setActiveTab] = useState<TabType>('facturas');

  // Selected Detailed Invoice Drawer state
  const [detailedInvoiceId, setDetailedInvoiceId] = useState<string | null>(null);

  // Global filters states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-06'); // preloaded to June 2026 to showcase the pollo pechuga scenario
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedProviderId, setSelectedProviderId] = useState('all');
  const [selectedUnitId, setSelectedUnitId] = useState('all');
  const [selectedSede, setSelectedSede] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect available unique months from raw purchases for preloading
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    purchases.forEach(p => {
      if (p.invoiceDate && p.invoiceDate.length >= 7) {
        monthsSet.add(p.invoiceDate.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [purchases]);

  // Compute the main dynamically filtered dataset
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      // 1. Search Query on code, supplier, or invoice
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = p.invoiceNumber.toLowerCase().includes(query) ||
                        p.providerName.toLowerCase().includes(query) ||
                        p.code.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // 2. Date Range boundaries
      if (startDate && p.invoiceDate < startDate) return false;
      if (endDate && p.invoiceDate > endDate) return false;

      // 3. Month selection
      if (selectedMonth && selectedMonth !== 'all') {
        if (!p.invoiceDate.startsWith(selectedMonth)) return false;
      }

      // 4. Provider ID
      if (selectedProviderId && selectedProviderId !== 'all') {
        if (p.providerId !== selectedProviderId) return false;
      }

      // 5. Status
      if (filterStatus && filterStatus !== 'all') {
        if (p.status !== filterStatus) return false;
      }

      // 6. Payment Method matches
      if (filterPayment && filterPayment !== 'all') {
        if (p.paymentMethod !== filterPayment) return false;
      }

      // 7. Product ID nested loop check
      if (selectedProductId && selectedProductId !== 'all') {
        const hasProd = p.items.some(it => it.productId === selectedProductId);
        if (!hasProd) return false;
      }

      // 8. Category ID resolution
      if (selectedCategoryId && selectedCategoryId !== 'all') {
        const hasCat = p.items.some(it => {
          const pr = products.find(prod => prod.id === it.productId);
          return pr && pr.categoryId === selectedCategoryId;
        });
        if (!hasCat) return false;
      }

      // 9. Unit ID resolution
      if (selectedUnitId && selectedUnitId !== 'all') {
        const hasUnit = p.items.some(it => {
          const pr = products.find(prod => prod.id === it.productId);
          return pr && pr.unitId === selectedUnitId;
        });
        if (!hasUnit) return false;
      }

      // 10. Sede resolution (Using code indices checksum to simulate diverse stores mapping)
      if (selectedSede && selectedSede !== 'all') {
        const assignedSede = p.id.charCodeAt(0) % 3 === 0 ? "Sede Principal" : p.id.charCodeAt(0) % 3 === 1 ? "Sede Norte" : "Sede Sur";
        if (assignedSede !== selectedSede) return false;
      }

      return true;
    });
  }, [
    purchases, searchQuery, startDate, endDate, selectedMonth,
    selectedProviderId, filterStatus, filterPayment, selectedProductId,
    selectedCategoryId, selectedUnitId, selectedSede, products
  ]);

  // Active details computed
  const detailedInvoice = useMemo(() => {
    return purchases.find(p => p.id === detailedInvoiceId);
  }, [purchases, detailedInvoiceId]);

  return (
    <div className="space-y-6" id="compras-libro-principal">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-800 tracking-tight leading-none">
            Libro de Compras & Analítica
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Registro diario auxiliar del Celler. Auditorías impositivas de IVA, arbitraje de precios por proveedor y control preventivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredPurchases.filter(p => p.status === 'Pendiente').length > 0 && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider motion-safe:animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-800" />
              Facturas sin revisar
            </span>
          )}
        </div>
      </div>

      {/* Modern Filter Subcomponent */}
      <PurchaseFilters
        providers={providers}
        products={products}
        units={units}
        categories={categories}
        availableMonths={availableMonths}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedProductId={selectedProductId}
        setSelectedProductId={setSelectedProductId}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        selectedProviderId={selectedProviderId}
        setSelectedProviderId={setSelectedProviderId}
        selectedUnitId={selectedUnitId}
        setSelectedUnitId={setSelectedUnitId}
        selectedSede={selectedSede}
        setSelectedSede={setSelectedSede}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterPayment={filterPayment}
        setFilterPayment={setFilterPayment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Internal Sub Navigation Tabs */}
      <div className="border-b border-slate-200" id="libro-compras-sub-tabs">
        <nav className="flex flex-wrap -mb-px gap-1 md:gap-2">
          {[
            { id: 'facturas', label: 'FACTURAS', icon: ClipboardList },
            { id: 'resumen', label: 'RESUMEN', icon: FileSpreadsheet },
            { id: 'por_producto', label: 'POR PRODUCTO', icon: Tag },
            { id: 'por_proveedor', label: 'POR PROVEEDOR', icon: Truck },
            { id: 'comparar_proveedores', label: 'COMPARA PROVEEDORES', icon: Coins },
            { id: 'tendencia_precios', label: 'TENDENCIA DE PRECIOS', icon: RefreshCw },
            { id: 'alertas', label: 'ALERTAS', icon: AlertTriangle },
            { id: 'exportar', label: 'EXPORTAR', icon: Download }
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  setDetailedInvoiceId(null); // Clear selected drawer on switch
                }}
                className={`py-3 px-4 text-[10.5px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition duration-150 font-sans outline-none ${
                  isSel
                    ? 'border-emerald-600 text-emerald-705 font-black bg-slate-50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Master Main Body Container Switching Tabs */}
      <div className="py-2" id="libro-tab-viewport">
        
        {/* ACTIVE TAB: FACTURAS (Table registry list) */}
        {activeTab === 'facturas' && (
          <div className="space-y-4" id="facturas-tabular-and-drawer">
            {/* Table box card header */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 font-sans gap-2">
                <span>
                  Resultados del periodo: Mostrando <strong className="text-slate-755">{filteredPurchases.length} de {purchases.length}</strong> compras conciliadas.
                </span>
                <span className="text-[10px] text-slate-400 font-mono">* Sincronización automática de remisiones</span>
              </div>

              {/* Invoices Desktop Table layout */}
              <div className="hidden md:block overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-105 bg-slate-50/30 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Folio ID</th>
                      <th className="p-4">Factura N°</th>
                      <th className="p-4">Fecha Emisión</th>
                      <th className="p-4">Proveedor / RFC</th>
                      <th className="p-4">Forma Pago</th>
                      <th className="p-4 text-right">Subtotal</th>
                      <th className="p-4 text-right">IVA Tax</th>
                      <th className="p-4 text-right">Monto Total</th>
                      <th className="p-4 text-center">Adjunto</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Operaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-12 text-center text-slate-400 font-medium font-sans">
                          No se encontraron facturas o comprobantes de gasto con los criterios de filtrado seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map((p) => {
                        const isDetailed = detailedInvoiceId === p.id;
                        return (
                          <tr key={p.id} className={`hover:bg-slate-50/50 transition duration-150 ${isDetailed ? 'bg-emerald-50/10' : ''}`}>
                            <td className="p-4 font-mono font-bold text-slate-600">{p.code}</td>
                            <td className="p-4 font-mono font-extrabold text-slate-800">{p.invoiceNumber}</td>
                            <td className="p-4 text-slate-600 font-medium">{p.invoiceDate}</td>
                            <td className="p-4">
                              <p className="font-bold text-slate-700 truncate max-w-[160px]">{p.providerName}</p>
                              <span className="text-[9px] text-slate-400 font-mono block">RFC: {p.id.split('-').reverse()[0]}</span>
                            </td>
                            <td className="p-4 font-medium text-slate-500">{p.paymentMethod}</td>
                            <td className="p-4 text-right font-mono text-slate-600">RD$ {p.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>
                            <td className="p-4 text-right font-mono text-slate-400">RD$ {p.tax.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>
                            <td className="p-4 text-right font-mono font-extrabold text-slate-900">RD$ {p.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                            <td className="p-4 text-center">
                              {p.invoiceFileUrl ? (
                                <span className="bg-blue-50 text-blue-700 text-[8.5px] px-1.5 py-0.5 rounded border border-blue-100 font-black">✔ PDF</span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 text-[8.5px] px-1.5 py-0.5 rounded border border-amber-100 font-black">PEND</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border ${
                                p.status === 'Recibida'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : p.status === 'Pendiente'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => {
                                  setDetailedInvoiceId(isDetailed ? null : p.id);
                                }}
                                className="p-1.5 px-3 bg-slate-100 hover:bg-slate-205 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg transition text-[11px]"
                              >
                                {isDetailed ? 'Cerrar' : 'Ver Detalle'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile details lists cards layout */}
              <div className="md:hidden divide-y divide-slate-100 text-xs">
                {filteredPurchases.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">
                    No se encontraron facturas o comprobantes de gasto con los criterios activos.
                  </div>
                ) : (
                  filteredPurchases.map((p) => {
                    const isDetailed = detailedInvoiceId === p.id;
                    return (
                      <div key={p.id} className="p-4 space-y-3 bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-slate-800 text-sm font-mono">{p.code}</strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Fecha: {p.invoiceDate}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                            p.status === 'Recibida'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : p.status === 'Pendiente'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] leading-relaxed">
                          <div>
                            <span className="text-slate-400 text-[8.5px] uppercase block font-bold">Proveedor</span>
                            <span className="font-bold text-slate-700">{p.providerName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[8.5px] uppercase block font-bold">Total DOP</span>
                            <strong className="font-mono text-slate-900 text-sm">RD$ {p.total.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-[10px]">
                          <span>Metodo: <strong className="font-semibold text-slate-700">{p.paymentMethod}</strong></span>
                          <span>Folio: <strong className="font-semibold font-mono text-slate-700">{p.invoiceNumber}</strong></span>
                        </div>

                        <button
                          onClick={() => setDetailedInvoiceId(isDetailed ? null : p.id)}
                          className="w-full bg-slate-900 text-white font-bold text-center py-2.5 rounded-lg border border-slate-800 transition"
                        >
                          {isDetailed ? 'Cerrar Despeje de Renglones' : 'Desglosar Recibo de Compra'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* FLYOUT DRAWER: Dynamic Inline Items Table visualization when click Detailed Invoice */}
            {detailedInvoice && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-840 shadow-lg space-y-4 animate-fade-in" id="invoice-details-drawer">
                <div className="flex justify-between items-start border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 rounded-lg shrink-0">
                      <ClipboardList className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase tracking-wide">Desglose Físico de Compra ({detailedInvoice.code})</h4>
                      <p className="text-[10px] text-slate-400">
                        Cotejo del Folio Fiscal {detailedInvoice.invoiceNumber} • Emitido el {detailedInvoice.invoiceDate} por {detailedInvoice.providerName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailedInvoiceId(null)}
                    className="p-1 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sub items matching */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[9.5px]">
                        <th className="p-3">Insumo / Renglón Registrado</th>
                        <th className="p-3 text-right">Cantidad de Carga (Vol)</th>
                        <th className="p-3 text-right">Precio Unitario Convenido</th>
                        <th className="p-3 text-right font-bold text-emerald-400">Total Renglón (DOP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {detailedInvoice.items && detailedInvoice.items.length > 0 ? (
                        detailedInvoice.items.map((it: any, idx: number) => {
                          const pObj = products.find(prod => prod.id === it.productId);
                          const pName = pObj ? pObj.name : 'Insumo Adicionado';
                          const uSuffix = pObj ? (units.find(u => u.id === pObj.unitId)?.code || 'u') : 'u';
                          
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition">
                              <td className="p-3 font-bold text-slate-100">{pName}</td>
                              <td className="p-3 text-right font-mono font-semibold text-slate-300">{it.qty.toLocaleString()} {uSuffix}</td>
                              <td className="p-3 text-right font-mono text-slate-300">RD$ {it.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 1 })}</td>
                              <td className="p-3 text-right font-mono font-black text-emerald-400">RD$ {it.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-450 italic">Esta factura posee un cargo global pre-aprobado sin desglosar renglones sueltos.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown banner inside drawer */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 p-4 rounded-xl border border-white/10 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[9px] uppercase font-bold block">Consignado de Firma</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-600 text-white flex items-center justify-center rounded-full text-[9px] font-bold">
                        {detailedInvoice.creatorName.charAt(0)}
                      </div>
                      <span className="text-slate-200">Revisado y validado en sistema por: <strong className="font-extrabold text-white">{detailedInvoice.creatorName}</strong></span>
                    </div>
                  </div>

                  <div className="text-right space-y-1 font-mono sm:border-l sm:border-white/10 sm:pl-5">
                    <div className="text-[10px] text-slate-400">Subtotal: RD$ {detailedInvoice.subtotal.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">ITBIS (16%): RD$ {detailedInvoice.tax.toLocaleString()}</div>
                    <div className="text-sm font-black text-emerald-400">TOTAL NETO: RD$ {detailedInvoice.total.toLocaleString()}</div>
                  </div>
                </div>

                {/* Trigger manager function block */}
                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    onClick={() => onViewPurchase(detailedInvoice.id)}
                    className="bg-white hover:bg-slate-200 text-slate-900 font-extrabold text-xs px-4 py-2 rounded-lg transition"
                  >
                    Editar y Modificar Factura en Libro Diario &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACTIVE TAB: RESUMEN (Dashboard indicators) */}
        {activeTab === 'resumen' && (
          <PurchaseSummaryTab
            filteredPurchases={filteredPurchases}
            purchases={purchases}
            providers={providers}
            products={products}
            categories={categories}
            selectedMonth={selectedMonth}
          />
        )}

        {/* ACTIVE TAB: POR PRODUCTO (Product analysis) */}
        {activeTab === 'por_producto' && (
          <PurchaseProductTab
            purchases={purchases}
            filteredPurchases={filteredPurchases}
            providers={providers}
            products={products}
            units={units}
          />
        )}

        {/* ACTIVE TAB: POR PROVEEDOR (Provider analysis) */}
        {activeTab === 'por_proveedor' && (
          <PurchaseProviderTab
            purchases={purchases}
            filteredPurchases={filteredPurchases}
            providers={providers}
            products={products}
            units={units}
          />
        )}

        {/* ACTIVE TAB: COMPARAR PROVEEDORES (Arbitrage sheet) */}
        {activeTab === 'comparar_proveedores' && (
          <PurchaseCompareTab
            purchases={purchases}
            providers={providers}
            products={products}
            units={units}
            selectedMonth={selectedMonth}
          />
        )}

        {/* ACTIVE TAB: TENDENCIA DE PRECIOS (Inflation index) */}
        {activeTab === 'tendencia_precios' && (
          <PurchaseTrendsTab
            purchases={purchases}
            providers={providers}
            products={products}
            units={units}
          />
        )}

        {/* ACTIVE TAB: ALERTAS (Warnings and logs) */}
        {activeTab === 'alertas' && (
          <PurchaseAlertsTab
            purchases={purchases}
            filteredPurchases={filteredPurchases}
            providers={providers}
            products={products}
            units={units}
            selectedMonth={selectedMonth}
          />
        )}

        {/* ACTIVE TAB: EXPORTAR (Download options) */}
        {activeTab === 'exportar' && (
          <PurchaseExportTab
            purchases={purchases}
            filteredPurchases={filteredPurchases}
            providers={providers}
            products={products}
            units={units}
            selectedMonth={selectedMonth}
          />
        )}

      </div>

    </div>
  );
}
