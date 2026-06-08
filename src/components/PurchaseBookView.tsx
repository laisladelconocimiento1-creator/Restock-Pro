import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  User,
  ExternalLink,
  Tag,
  CheckCircle,
  Truck,
  Eye,
  AlertTriangle,
  Download
} from 'lucide-react';
import { Purchase, Provider, Role } from '../types';

interface PurchaseBookProps {
  purchases: Purchase[];
  providers: Provider[];
  onViewPurchase: (purchaseId: string) => void;
}

export default function PurchaseBookView({
  purchases,
  providers,
  onViewPurchase
}: PurchaseBookProps) {
  // Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProviderId, setFilterProviderId] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pendiente' | 'Recibida' | 'Anulada' | 'Observada'>('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtering logic
  const filteredBook = purchases.filter(p => {
    const matchesSearch = p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvider = filterProviderId === 'all' || p.providerId === filterProviderId;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || p.paymentMethod === filterPayment;

    let matchesDates = true;
    if (startDate) {
      matchesDates = matchesDates && new Date(p.invoiceDate) >= new Date(startDate);
    }
    if (endDate) {
      matchesDates = matchesDates && new Date(p.invoiceDate) <= new Date(endDate);
    }

    return matchesSearch && matchesProvider && matchesStatus && matchesPayment && matchesDates;
  });

  // Export filtered list to CSV (Real download!)
  const handleExportCSV = () => {
    if (filteredBook.length === 0) {
      alert('No hay información correspondiente para exportar.');
      return;
    }

    // CSV Headers
    const headers = [
      'Código Compra',
      'Proveedor',
      'Factura N°',
      'Fecha Factura',
      'Subtotal (DOP)',
      'Tasa IVA',
      'Monto IVA',
      'Total Facturado',
      'Forma de Pago',
      'Registrado Por',
      'Estatus',
      'Observaciones'
    ];

    // CSV Rows mapping
    const rows = filteredBook.map(p => [
      p.code,
      `"${p.providerName.replace(/"/g, '""')}"`,
      p.invoiceNumber,
      p.invoiceDate,
      p.subtotal,
      '16%',
      p.tax,
      p.total,
      p.paymentMethod,
      p.creatorName,
      p.status,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    // Build entire CSV string
    const csvContent =
      '\uFEFF' + // UTF-8 byte order mark to ensure Excel reads Spanish characters nicely (acentos, rfc, etc)
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    // Create a temporary link and click it to download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libro_de_Compras_Celler_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="purchase-book-view">
      {/* Title header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Libro de Compras Oficial
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Registro diario auxiliar del Celler. Auditorías impositivas de IVA, retenciones, cuentas por pagar y archivos adjuntos.
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-sans font-bold transition shadow-sm"
          id="btn-export-purchase-book-csv"
        >
          <Download className="w-4.5 h-4.5" />
          Exportar Libro (CSV)
        </button>
      </div>

      {/* Multipurpose Filters Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h4 className="font-sans font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filtros de Auditoría Impositiva
        </h4>

        {/* Filters inputs query row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 text-xs font-sans">
          {/* Search box query */}
          <div className="lg:col-span-2 relative">
            <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Buscar factura o proveedor</span>
            <input
              type="text"
              placeholder="Buscar folio, RFC o razón social..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-3 py-2 outline-none focus:bg-white focus:border-emerald-650 transition"
              id="input-book-search"
            />
          </div>

          {/* Supplier selector */}
          <div>
            <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">Proveedor</span>
            <select
              value={filterProviderId}
              onChange={(e) => setFilterProviderId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
              id="select-book-provider"
            >
              <option value="all">Todos</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">Estado de compra</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
              id="select-book-status"
            >
              <option value="all">Todos</option>
              <option value="Recibida">Recibida (Sincronizado)</option>
              <option value="Pendiente">Pendiente de recibir</option>
              <option value="Observada">Observada (Conflicto)</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">Desde fecha</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none font-mono"
            />
          </div>

          {/* Date to */}
          <div>
            <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1 font-sans">Hasta fecha</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Ledger general table view list */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-550 font-sans">
          <span>Mostrando <strong className="text-slate-800">{filteredBook.length} de {purchases.length}</strong> compras registradas en el Libro Central.</span>
          <span className="text-[10px] text-slate-400 font-mono">* Sincronización automática de remisiones</span>
        </div>

        {/* Desktop Ledger Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-55 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Folio Sistema</th>
                <th className="p-4">Factura N°</th>
                <th className="p-4">Fecha Factura</th>
                <th className="p-4">Proveedor / RFC</th>
                <th className="p-4">Método Pago</th>
                <th className="p-4 text-right">Subtotal Neto</th>
                <th className="p-4 text-right font-semibold text-slate-600">Impuestos (IVA)</th>
                <th className="p-4 text-right">Total Facturado</th>
                <th className="p-4 text-center">Factura Adjunta</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans" id="purchase-book-table-body">
              {filteredBook.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400 font-medium">
                    No se encontraron registros que cumplan con los filtros de búsqueda...
                  </td>
                </tr>
              ) : (
                filteredBook.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    {/* System code */}
                    <td className="p-4 font-mono font-bold text-slate-700">{p.code}</td>

                    {/* Invoice bill no */}
                    <td className="p-4 font-mono font-bold text-slate-800">{p.invoiceNumber}</td>

                    {/* Invoice Date */}
                    <td className="p-4 text-slate-650 font-medium">{p.invoiceDate}</td>

                    {/* Provider name */}
                    <td className="p-4">
                      <p className="font-bold text-slate-755 truncate max-w-[170px]">{p.providerName}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Asociado Celler</p>
                    </td>

                    {/* Payment strategy */}
                    <td className="p-4 text-slate-500 font-medium">{p.paymentMethod}</td>

                    {/* Subtotal */}
                    <td className="p-4 text-right font-mono font-medium text-slate-650">RD${p.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>

                    {/* Taxes */}
                    <td className="p-4 text-right font-mono text-slate-500 font-semibold">RD${p.tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>

                    {/* Final Net bill */}
                    <td className="p-4 text-right font-mono font-extrabold text-slate-800">RD${p.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>

                    {/* Evidence preview indicator */}
                    <td className="p-4 text-center">
                      {p.invoiceFileUrl ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                          ✔ SÍ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                          ✍ PENDIENTE
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        p.status === 'Recibida'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : p.status === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>

                    {/* Trigger detail on main module */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onViewPurchase(p.id)}
                        className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 font-bold rounded-lg transition"
                        title="Ir a gestionar compra"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile responsive cards list representation */}
        <div className="md:hidden divide-y divide-slate-100 text-xs" id="mobile-purchase-book-list">
          {filteredBook.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              No se encontraron registros que cumplan con los filtros de búsqueda...
            </div>
          ) : (
            filteredBook.map((p) => (
              <div key={p.id} className="p-4 space-y-3 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <strong className="text-slate-800 text-sm font-mono">{p.code}</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                      Facturado: {p.invoiceDate}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                    p.status === 'Recibida'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : p.status === 'Pendiente'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-650 font-sans leading-relaxed">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Proveedor</span>
                    <span className="font-bold text-slate-705 truncate max-w-[130px] block">{p.providerName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Total Factura</span>
                    <strong className="font-mono text-slate-850 text-xs">RD${p.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-5/50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 uppercase text-[8px] block font-bold">Num. Factura</span>
                    <span className="font-mono text-slate-700 font-bold">{p.invoiceNumber}</span>
                  </div>
                  <div className="text-right">
                    {p.invoiceFileUrl ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-750 px-2 py-0.5 rounded text-[8px] font-bold border border-emerald-100">
                        ✔ ADJUNTADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[8px] font-bold border border-amber-100">
                        ✍ EN ESPERA
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-100">
                  <button
                    onClick={() => onViewPurchase(p.id)}
                    className="w-full py-2.5 bg-orange-55 border border-orange-200/80 hover:bg-orange-100 text-orange-700 font-sans font-bold rounded-xl transition text-center text-xs flex items-center justify-center gap-1"
                  >
                    Ver Libro de Cuentas &rarr;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
