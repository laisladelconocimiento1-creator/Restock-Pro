import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Eye,
  Camera,
  Upload,
  User,
  Trash2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
  Link2
} from 'lucide-react';
import { Purchase, Product, Provider, Unit, Role, PurchaseItem, PurchaseStatus } from '../types';
import { store } from '../data/store';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  providers: Provider[];
  units: Unit[];
  currentUserRole: Role;
  currentUserId: string;
  currentUserName: string;
  convertingFromRequest: { id: string; code: string; items: { productId: string; qty: number }[] } | null;
  onClearConvertingRequest: () => void;
  onAddPurchase: (purchase: Purchase) => void;
  onUpdatePurchase: (purchase: Purchase) => void;
}

export default function PurchasesView({
  purchases,
  products,
  providers,
  units,
  currentUserRole,
  currentUserId,
  currentUserName,
  convertingFromRequest,
  onClearConvertingRequest,
  onAddPurchase,
  onUpdatePurchase
}: PurchasesViewProps) {
  // Navigation
  const [activeView, setActiveView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [showOcrWizard, setShowOcrWizard] = useState(false);
  const [mobileStep, setMobileStep] = useState(1);

  // New Purchase Form states
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDateForm, setInvoiceDateForm] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethodForm, setPaymentMethodForm] = useState<'Transferencia' | 'Efectivo' | 'Crédito' | 'Tarjeta'>('Transferencia');
  const [purchaseStatusForm, setPurchaseStatusForm] = useState<PurchaseStatus>('Recibida');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Invoice File uploads states
  const [invoiceFileUrl, setInvoiceFileUrl] = useState<string | null>(null);
  const [invoiceFileName, setInvoiceFileName] = useState('');

  // Items list inside current purchase
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; qty: number; unitPrice: number }[]>([
    { productId: products[0]?.id || '', qty: 1, unitPrice: products[0]?.lastPrice || 10 }
  ]);

  // Handle incoming conversion requests
  useEffect(() => {
    if (convertingFromRequest) {
      // Find a provider associated to one of the products
      let defaultProv = providers[0]?.id || '';
      const firstProd = products.find(p => p.id === convertingFromRequest.items[0]?.productId);
      if (firstProd && firstProd.providerIds.length > 0) {
        defaultProv = firstProd.providerIds[0];
      }

      setSelectedProviderId(defaultProv);
      setInvoiceNo('FAC-REQ-' + convertingFromRequest.code.split('-')[2]);
      setPurchaseNotes(`Reabastecimiento automático creado desde solicitud de cocina ${convertingFromRequest.code}`);

      // Map request items to purchase item rows
      const mapped = convertingFromRequest.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          qty: item.qty,
          unitPrice: prod ? prod.lastPrice : 10
        };
      });
      setPurchaseItems(mapped);

      // Open screen
      setMobileStep(1);
      setActiveView('create');
    }
  }, [convertingFromRequest, products, providers]);

  // Authorization checker
  const canCreate = ['ADMIN', 'COMPRAS', 'GERENTE'].includes(currentUserRole);

  const handleAddRow = () => {
    const firstProd = products[0];
    setPurchaseItems([...purchaseItems, { productId: firstProd?.id || '', qty: 1, unitPrice: firstProd?.lastPrice || 10 }]);
  };

  const handleRemoveRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: 'productId' | 'qty' | 'unitPrice' | 'requiresPortioning', value: any) => {
    const updated = [...purchaseItems];
    if (field === 'productId') {
      updated[index].productId = value;
      // auto set previous cost as helper hint
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].unitPrice = prod.lastPrice;
        // Auto check if product requires portioning
        const rules = store.getPortionRules();
        updated[index].requiresPortioning = rules.some(r => r.productId === value && r.requiresPortioning);
      }
    } else if (field === 'qty') {
      updated[index].qty = Math.max(0.1, Number(value));
    } else if (field === 'unitPrice') {
      updated[index].unitPrice = Math.max(0, Number(value));
    } else if (field === 'requiresPortioning') {
      updated[index].requiresPortioning = !!value;
    }
    setPurchaseItems(updated as any);
  };

  // Mocking Invoice file uploads
  const handleUploadSampleInvoice = (sampleType: 'liquor' | 'meat' | 'veg') => {
    let url = 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&h=800&q=80';
    let name = 'remision_bodega_vinos.jpg';
    if (sampleType === 'meat') {
      url = 'https://images.unsplash.com/photo-1543083505-590d411bfe65?auto=format&fit=crop&w=600&h=800&q=80';
      name = 'remision_carnes_norte.jpg';
    } else if (sampleType === 'veg') {
      url = 'https://images.unsplash.com/photo-1586075010923-2dd45e9b2d4f?auto=format&fit=crop&w=600&h=800&q=80';
      name = 'remision_vegetales_campo.jpg';
    }
    setInvoiceFileUrl(url);
    setInvoiceFileName(name);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoiceFileName(file.name);
      setInvoiceFileUrl('https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&h=800&q=80'); // Sim
    }
  };

  // Tax and general financial calculations
  const calculateTotals = () => {
    let subtotal = 0;
    purchaseItems.forEach(item => {
      subtotal += item.qty * item.unitPrice;
    });
    const tax = subtotal * 0.16; // 16% IVA standard
    const discounts = 0;
    const total = subtotal + tax - discounts;

    return { subtotal, tax, discounts, total };
  };

  const totals = calculateTotals();

  const handleSavePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      alert('Tu rol (' + currentUserRole + ') no posee privilegios para registrar facturas.');
      return;
    }
    if (!selectedProviderId) {
      alert('Es obligatorio designar un proveedor.');
      return;
    }
    if (!invoiceNo.trim()) {
      alert('Debes indicar el número de factura/remisión.');
      return;
    }

    const provider = providers.find(p => p.id === selectedProviderId);

    // Map rows to formal Purchase Items
    const finalItems: PurchaseItem[] = purchaseItems.map(item => {
      const sub = item.qty * item.unitPrice;
      const t = sub * 0.16;
      return {
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        subtotal: sub,
        tax: t,
        discount: 0,
        total: sub + t,
        requiresPortioning: (item as any).requiresPortioning
      };
    });

    const newPurchase: Purchase = {
      id: 'pur-' + Math.random().toString(36).substr(2, 9),
      code: 'COMP-' + new Date().getFullYear() + '-' + String(purchases.length + 1).padStart(3, '0'),
      date: new Date().toISOString(),
      providerId: selectedProviderId,
      providerName: provider ? provider.name : 'Proveedor Desconocido',
      items: finalItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discounts: totals.discounts,
      total: totals.total,
      invoiceNumber: invoiceNo,
      invoiceDate: invoiceDateForm,
      receivedDate: purchaseStatusForm === 'Recibida' ? new Date().toISOString() : undefined,
      status: purchaseStatusForm,
      paymentMethod: paymentMethodForm,
      invoiceFileUrl: invoiceFileUrl || undefined,
      fileName: invoiceFileName || undefined,
      creatorId: currentUserId,
      creatorName: currentUserName,
      notes: purchaseNotes
    };

    onAddPurchase(newPurchase);
    alert(`Compra ${newPurchase.code} registrada exitosamente${purchaseStatusForm === 'Recibida' ? ' e ingresada automáticamente al inventario general.' : '.'}`);

    // Reset forms
    setSelectedProviderId('');
    setInvoiceNo('');
    setPurchaseNotes('');
    setInvoiceFileUrl(null);
    setInvoiceFileName('');
    setPurchaseItems([{ productId: products[0]?.id || '', qty: 1, unitPrice: products[0]?.lastPrice || 10 }]);

    if (convertingFromRequest) {
      onClearConvertingRequest();
    }

    setActiveView('list');
  };

  const selectedPurchase = purchases.find(p => p.id === selectedPurchaseId);

  // Transition pendiente to recibida explicitly
  const handleMarkAsReceived = (pur: Purchase) => {
    const updated: Purchase = {
      ...pur,
      status: 'Recibida',
      receivedDate: new Date().toISOString()
    };
    onUpdatePurchase(updated);
    alert(`Compra ${pur.code} recibida correctamente. Se han actualizado las existencias de stock.`);
    // Keep user in same view but refresh
    setSelectedPurchaseId(updated.id);
  };

  return (
    <div className="space-y-6" id="purchases-module-view">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Registro de Compras y Facturación
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Entrada de mercadería del Celler, subida de pruebas fiscales electrónicas ( Remisiones, Facturas) y recalibración de costos promedio.
          </p>
        </div>

        {activeView === 'list' && (
          <button
            onClick={() => {
              if (!canCreate) {
                alert('Privilegios insuficientes. Tu rol no puede registrar compras.');
                return;
              }
              setMobileStep(1);
              setActiveView('create');
            }}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-1.5 rounded text-xs font-sans font-bold transition shadow-sm"
            id="btn-add-purchase-view"
          >
            <Plus className="w-4.5 h-4.5" />
            Nueva Factura / Compra
          </button>
        )}
      </div>

      {/* RENDER VIEW: PURCHASES LIST */}
      {activeView === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Desktop/Tablet view representation */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Código</th>
                  <th className="p-4">Proveedor</th>
                  <th className="p-4">Factura N°</th>
                  <th className="p-4">Fecha Factura</th>
                  <th className="p-4">Subtotal</th>
                  <th className="p-4">Total Real (IVA)</th>
                  <th className="p-4">Pago</th>
                  <th className="p-4">Factura Adjunta</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="purchases-table-body">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-sans font-bold text-slate-800">{p.code}</td>
                    <td className="p-4 text-slate-600 font-semibold">{p.providerName}</td>
                    <td className="p-4 font-mono font-semibold text-slate-600">{p.invoiceNumber}</td>
                    <td className="p-4 text-slate-500 font-medium">{new Date(p.invoiceDate).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-slate-500 font-semibold">RD${p.subtotal.toLocaleString('es-DO')}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">RD${p.total.toLocaleString('es-DO')}</td>
                    <td className="p-4 text-slate-550 font-medium">{p.paymentMethod}</td>
                    <td className="p-4 text-slate-400">
                      {p.invoiceFileUrl ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-750 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                          <FileText className="w-3 h-3 text-blue-400" />
                          PDF/IMG
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Sin archivo</span>
                      )}
                    </td>
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
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPurchaseId(p.id);
                          setActiveView('detail');
                        }}
                        className="py-1 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition"
                      >
                        Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive cards list representation */}
          <div className="md:hidden divide-y divide-slate-100 text-xs" id="mobile-purchases-list">
            {purchases.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-medium">
                No hay compras alternativas registradas.
              </div>
            ) : (
              purchases.map((p) => (
                <div key={p.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <strong className="text-slate-800 text-sm">{p.code}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                        Fecha: {new Date(p.invoiceDate).toLocaleDateString()}
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
                      <span className="font-bold text-slate-705 truncate max-w-[120px] block">{p.providerName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase block font-extrabold mb-0.5">Total Real RD$</span>
                      <strong className="font-mono text-slate-850 text-xs">RD${p.total.toLocaleString('es-DO')}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 uppercase text-[8px] block font-bold">N° Factura</span>
                      <span className="font-mono text-slate-700 font-bold">{p.invoiceNumber}</span>
                    </div>
                    <div className="text-right">
                      {p.invoiceFileUrl ? (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-750 px-2 py-0.5 rounded text-[9px] font-bold border border-blue-100">
                          <FileText className="w-3 h-3 text-blue-400" />
                          PDF/IMG
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 italic">Sin comprobante</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedPurchaseId(p.id);
                        setActiveView('detail');
                      }}
                      className="w-full py-2.5 bg-orange-55 border border-orange-200/80 hover:bg-orange-100 text-orange-700 font-sans font-bold rounded-xl transition text-center text-xs flex items-center justify-center gap-1"
                    >
                      Ver Detalle de Compra &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW: CREATE PURCHASE/BILLING INPUT */}
      {activeView === 'create' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 animate-fade-in" id="create-purchase-form">
          {/* Return link */}
          <button
            onClick={() => {
              if (convertingFromRequest) {
                onClearConvertingRequest();
              }
              setActiveView('list');
            }}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Regresar al Listado de Compras
          </button>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded">
              Aprovisionamiento Celler
            </span>
            <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-2.5">
              Registrar Compra o Subir Factura Electrónica
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {convertingFromRequest ? `Procesando consolidación para la solicitud de cocina ${convertingFromRequest.code}.` : 'Completa los datos de la factura fiscal y asocia los ingredientes surtidos.'}
            </p>
          </div>

          {/* Mobile Step Header */}
          <div className="block md:hidden bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-2 font-sans">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2">
              <span className="uppercase tracking-wide text-[10px] text-orange-600">Paso {mobileStep} de 4</span>
              <span className="text-slate-600">
                {mobileStep === 1 && "📋 Proveedor y Datos"}
                {mobileStep === 2 && "📸 Evidencia Visual"}
                {mobileStep === 3 && "🥩 Ingredientes"}
                {mobileStep === 4 && "🔍 Notas y Revisión"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    stepNum <= mobileStep ? "bg-orange-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSavePurchaseSubmit} className="space-y-6 text-xs font-sans">
            {/* Quick warning block */}
            <div className="bg-blue-50 border border-blue-150 p-4 rounded-xl text-blue-900 flex gap-3 leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Alineación en Kárdex:</strong> Marcar el estatus de la compra como <strong className="font-bold">"Recibida"</strong> incrementará las existencias físicas en almacén de forma inmediata y calculará los nuevos costos unitarios promedio para valuaciones.
              </div>
            </div>

            {/* STEP 1: Provider and Billing metadata */}
            <div className={mobileStep === 1 ? "block" : "hidden md:block"}>
              <div className="bg-slate-50/30 p-4 rounded-xl border border-slate-100 md:bg-transparent md:p-0 md:border-0">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 md:hidden">Datos del Proveedor e Impuestos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1">Carga Proveedor Compra *</label>
                    <select
                      required
                      value={selectedProviderId}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none"
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {providers.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.name} (RFC: {prov.rfc})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1">Factura o Folio de Remisión N° *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. FAC-20092, REM-00129"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1">Fecha de la Factura *</label>
                    <input
                      type="date"
                      required
                      value={invoiceDateForm}
                      onChange={(e) => setInvoiceDateForm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1">Forma de Pago Surtido</label>
                    <select
                      value={paymentMethodForm}
                      onChange={(e) => setPaymentMethodForm(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                    >
                      <option value="Transferencia">Transferencia STP</option>
                      <option value="Crédito">Crédito Comercial (Cuentas por Pagar)</option>
                      <option value="Efectivo">Efectivo (Caja Chica)</option>
                      <option value="Tarjeta">Tarjeta de Crédito Corporativa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1">Estatus del Pedido</label>
                    <select
                      value={purchaseStatusForm}
                      onChange={(e) => setPurchaseStatusForm(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none"
                    >
                      <option value="Recibida">Recibida (Ingresar Stock de inmediato)</option>
                      <option value="Pendiente">Pendiente (Por Recibir)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Document upload visual section split (Take photo of invoice) */}
            <div className={mobileStep === 2 ? "block" : "hidden md:block"}>
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                <label className="block text-slate-600 font-bold uppercase text-[10px] tracking-wide">
                  Evidencia Digital (Foto / Remisión Firmada / Factura PDF)
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Upload drag drop zone */}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center flex flex-col items-center justify-center bg-white">
                    <Camera className="w-10 h-10 text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">Arrastra archivo o captura foto</p>
                    <p className="text-[10px] text-slate-400 mt-1 mb-4">Formatos válidos: PDF, JPG, PNG (Max 15MB)</p>

                    <div className="flex gap-2">
                      <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition">
                        Examinar Archivo...
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleCustomFileUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Pre-made bills mock helper presets */}
                      <button
                        type="button"
                        onClick={() => handleUploadSampleInvoice('meat')}
                        className="bg-emerald-50 text-emerald-800 text-[11px] font-bold py-1.5 px-3 rounded-lg border border-emerald-200"
                      >
                        Cargar Demo Remisión
                      </button>
                    </div>
                  </div>

                  {/* Invoice picture preview */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 h-40 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    {invoiceFileUrl ? (
                      <>
                        <img
                          src={invoiceFileUrl}
                          alt="Preview remisión"
                          className="absolute inset-0 w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-2">
                          <span className="text-white text-[10px] font-semibold font-mono truncate max-w-full">
                            📂 {invoiceFileName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setInvoiceFileUrl(null); setInvoiceFileName(''); }}
                          className="absolute top-2 right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="p-4 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-slate-650">Vista Previa de Factura Electrónica</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">La prueba visual es almacenada de forma inalterable para revisiones fiscales.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: Products grid input list */}
            <div className={mobileStep === 3 ? "block" : "hidden md:block"}>
              <div className="space-y-4">
                <label className="block text-slate-500 font-bold uppercase text-[9px]">Ingredientes Surtidos en esta Factura *</label>

                <div className="space-y-3">
                  {purchaseItems.map((row, index) => {
                    const prod = products.find(p => p.id === row.productId);
                    const uniCode = prod ? units.find(u => u.id === prod.unitId)?.code : 'und';

                    return (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-4 border border-slate-200 rounded-xl relative shadow-sm">
                        {/* Item Selector */}
                        <div className="w-full sm:flex-1 min-w-0">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Suministro o Insumo *</span>
                          <select
                            value={row.productId}
                            onChange={(e) => handleRowChange(index, 'productId', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:bg-white text-xs text-slate-800 outline-none mt-1"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({units.find(u => u.id === p.unitId)?.code || 'lb'})</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 sm:flex gap-3 w-full sm:w-auto items-center mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                          {/* Quantity */}
                          <div className="w-full sm:w-28">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Cantidad *</span>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg items-center px-2 mt-1">
                              <input
                                type="number"
                                step="any"
                                required
                                min="0.1"
                                value={row.qty}
                                onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
                                className="w-full bg-transparent p-2 text-center font-mono font-bold text-xs"
                              />
                              <span className="text-[9px] text-slate-400 font-semibold font-mono uppercase">{uniCode}</span>
                            </div>
                          </div>

                          {/* Unit Price */}
                          <div className="w-full sm:w-32">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Precio Unitario *</span>
                            <div className="flex bg-slate-50 border border-slate-200 rounded-lg items-center px-1.5 mt-1">
                              <span className="text-slate-400 font-bold text-xs">$</span>
                              <input
                                type="number"
                                step="any"
                                required
                                value={row.unitPrice}
                                onChange={(e) => handleRowChange(index, 'unitPrice', e.target.value)}
                                className="w-full bg-transparent p-2 text-right font-mono font-bold text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-dashed border-slate-100">
                          {/* Portioning requirements flag */}
                          <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:w-20">
                            <span className="text-[9px] block text-slate-400 font-bold uppercase">Porcionar</span>
                            <label className="flex items-center gap-1.5 sm:mt-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!(row as any).requiresPortioning}
                                onChange={(e) => handleRowChange(index, 'requiresPortioning', e.target.checked)}
                                className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4 cursor-pointer border-slate-300"
                              />
                              <span className="text-[10px] text-slate-500 font-bold">{(row as any).requiresPortioning ? 'Sí' : 'No'}</span>
                            </label>
                          </div>

                          {/* Total Row */}
                          <div className="text-right sm:w-24">
                            <span className="text-[9px] block text-slate-400 font-bold uppercase">Importe</span>
                            <span className="font-mono font-bold text-xs text-slate-700 block mt-1">RD${(row.qty * row.unitPrice).toLocaleString('es-DO')}</span>
                          </div>
                        </div>

                        {/* Delete button */}
                        {purchaseItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(index)}
                            className="absolute top-2 right-2 p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remover fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full sm:w-auto py-2.5 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 font-bold text-xs shadow-xs active:scale-98 transition"
                >
                  + Registrar otro ingrediente
                </button>
              </div>
            </div>

            {/* STEP 4: Calculations summaries and notes */}
            <div className={mobileStep === 4 ? "block" : "hidden md:block"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-150">
                <div>
                  <label className="block text-slate-500 font-bold uppercase text-[9px] mb-1">Notas, Observaciones o No Conformidades</label>
                  <textarea
                    rows={3}
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    placeholder="Ej. Surtido completo, empaques sanos. Pendiente de firmar por supervisor..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none text-xs"
                  />
                </div>

                {/* Math summaries breakdown table */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-2.5 font-sans">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal Factura:</span>
                    <span className="font-mono font-semibold">RD${totals.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Impuesto Fiscal (16% IVA):</span>
                    <span className="font-mono font-semibold">RD${totals.tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 border-b border-slate-200 pb-2.5">
                    <span>Descuentos u ofertas:</span>
                    <span className="font-mono font-semibold">-RD$0.00</span>
                  </div>
                  <div className="flex justify-between text-base text-slate-800 font-bold pt-1.5">
                    <span className="font-display uppercase tracking-wider text-xs">Total Facturado DOP:</span>
                    <span className="font-mono text-lg text-emerald-800 font-extrabold">RD${totals.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop-only action trigger panel footer */}
            <div className="hidden md:flex p-4 border-t border-slate-150 pt-5 justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (convertingFromRequest) {
                    onClearConvertingRequest();
                  }
                  setActiveView('list');
                }}
                className="px-4 py-2 border border-slate-250 hover:bg-slate-50 font-bold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded transition shadow-sm"
              >
                Guardar Factura y Procesar
              </button>
            </div>

            {/* Mobile-only step controls */}
            <div className="flex md:hidden justify-between items-center pt-4 border-t border-slate-100 gap-3">
              {mobileStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setMobileStep(prev => prev - 1)}
                  className="flex-1 py-3 text-center bg-slate-100 font-bold rounded-xl text-slate-700 font-sans cursor-pointer active:scale-95 transition text-xs"
                >
                  Anterior
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (convertingFromRequest) onClearConvertingRequest();
                    setActiveView('list');
                  }}
                  className="flex-1 py-3 text-center bg-slate-100 font-bold rounded-xl text-slate-500 font-sans cursor-pointer active:scale-95 transition text-xs"
                >
                  Cancelar
                </button>
              )}

              {mobileStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (mobileStep === 1) {
                      if (!selectedProviderId) {
                        alert('Es obligatorio designar un proveedor.');
                        return;
                      }
                      if (!invoiceNo.trim()) {
                        alert('Debes indicar el número de factura/remisión.');
                        return;
                      }
                    }
                    setMobileStep(prev => prev + 1);
                  }}
                  className="flex-1 py-3 text-center bg-orange-600 font-bold rounded-xl text-white font-sans cursor-pointer active:scale-95 transition text-xs"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex-1 py-3 text-center bg-emerald-600 font-bold rounded-xl text-white font-sans cursor-pointer active:scale-95 transition text-xs"
                >
                  Confirmar y Guardar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* RENDER VIEW: DETAILED TRANSACTION DISCLOSURE PREVIEW */}
      {activeView === 'detail' && selectedPurchase && (
        <div className="space-y-6 animate-fade-in text-xs font-sans" id="detail-purchase-view">
          {/* Breadcrumbs return link */}
          <button
            onClick={() => setActiveView('list')}
            className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Regresar al Listado de Compras
          </button>

          {/* Details Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                    selectedPurchase.status === 'Recibida'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : selectedPurchase.status === 'Pendiente'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                    {selectedPurchase.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Código Único de Registro: {selectedPurchase.id}</span>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-2.5 leading-none">
                  Orden de Surtido {selectedPurchase.code}
                </h3>
                <p className="text-slate-400 mt-1.5 font-medium">
                  Proveedor: <strong className="text-slate-700 font-semibold">{selectedPurchase.providerName}</strong> • Registrada por: <strong className="text-slate-600 font-semibold">{selectedPurchase.creatorName}</strong> el {new Date(selectedPurchase.date).toLocaleString()}
                </p>
              </div>

              {/* Standalone state transition: Recibir Compra */}
              {selectedPurchase.status === 'Pendiente' && (
                <button
                  onClick={() => handleMarkAsReceived(selectedPurchase)}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  id="btn-mark-received"
                >
                  <CheckCircle className="w-4.5 h-4.5" />
                  Recibir Mercadería e Incrementar Stock
                </button>
              )}
            </div>

            {/* Split row: Details info specs (Left) + Invoice pic visualization (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: General info fields list */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1.5">Metadatos de la Factura de Compra</h4>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">Número de Factura:</span>
                      <strong className="text-xs text-slate-700 mt-1 block font-mono">{selectedPurchase.invoiceNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">Fecha de Expedición:</span>
                      <strong className="text-xs text-slate-700 mt-1 block">{new Date(selectedPurchase.invoiceDate).toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">Método de Surtido:</span>
                      <strong className="text-xs text-slate-700 mt-1 block">{selectedPurchase.paymentMethod}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none text-red-700">Subtotal Factura:</span>
                      <strong className="text-xs font-mono text-slate-750 mt-1 block">RD${selectedPurchase.subtotal.toLocaleString('es-DO')}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold leading-none">Tasa IVA (16%):</span>
                      <strong className="text-xs font-mono text-slate-750 mt-1 block">RD${selectedPurchase.tax.toLocaleString('es-DO')}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-800 block font-extrabold leading-none">Total Real Fiscal:</span>
                      <strong className="text-sm font-mono text-emerald-700 mt-1 block font-extrabold">RD${selectedPurchase.total.toLocaleString('es-DO')}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-1">Notas de Control Auditoría</h4>
                  <p className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-650 italic mt-1 leading-relaxed">
                    "{selectedPurchase.notes || 'Sin anotación de no conformidades o notas.'}"
                  </p>
                </div>
              </div>

              {/* Right Side: Factura File view block */}
              <div>
                <h4 className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-2">Comprobante Fiscal / Evidencia Digital</h4>

                {selectedPurchase.invoiceFileUrl ? (
                  <div className="border border-slate-200 rounded-2xl p-2 bg-slate-100 h-64 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedPurchase.invoiceFileUrl}
                      alt="Factura preview image"
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/65 text-white py-1 px-2.5 rounded-lg text-[9px] font-semibold font-mono shadow">
                      📂 Comprobante: {selectedPurchase.fileName || 'factura_fiscal.jpg'}
                    </div>
                    <a
                      href={selectedPurchase.invoiceFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-3 right-3 bg-white hover:bg-slate-50 p-1.5 rounded-full shadow text-slate-700 flex items-center justify-center"
                      title="Ver en pestaña completa"
                    >
                      <Link2 className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-250 rounded-2xl p-8 bg-slate-50 text-center text-slate-400 flex flex-col items-center justify-center h-48">
                    <AlertTriangle className="w-8 h-8 opacity-40 mb-2" />
                    <p className="font-semibold text-slate-600">Este registro carece de remisión digital adjunta.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[220px]">Puedes subir evidencia editando esta compra o registrando nuevas remisiones.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Surted Items table list recap */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="font-bold text-slate-700">Artículos consolidados de abasto:</span>
              <span className="text-slate-400 font-medium">Amparados bajo esta remisión</span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Ingrediente surtido</th>
                    <th className="p-4 text-center">Unidad</th>
                    <th className="p-4 text-right">Cantidad Facturada</th>
                    <th className="p-4 text-right">Precio Unitario</th>
                    <th className="p-4 text-right">Subtotal Neto</th>
                    <th className="p-4 text-right">IVA Trasladado</th>
                    <th className="p-4 text-right">Total Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans" id="purchase-items-table-recap">
                  {selectedPurchase.items.map((row) => {
                    const prod = products.find(p => p.id === row.productId);
                    return (
                      <tr key={row.productId} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-sans font-bold text-slate-800">{prod ? prod.name : 'Producto descatalogado'}</td>
                        <td className="p-4 text-center text-slate-400 font-mono font-medium">{prod ? units.find(u => u.id === prod.unitId)?.code : 'und'}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-750">{row.qty}</td>
                        <td className="p-4 text-right font-mono text-slate-600">RD${row.unitPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-mono text-slate-500">RD${row.subtotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-mono text-slate-500">RD${row.tax.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right font-mono font-bold text-slate-800">RD${row.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
