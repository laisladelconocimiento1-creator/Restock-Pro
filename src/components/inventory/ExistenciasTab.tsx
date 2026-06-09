import React, { useState } from 'react';
import {
  Search,
  Filter,
  DollarSign,
  Truck,
  FileText,
  AlertTriangle,
  AlertCircle,
  Eye,
  Settings,
  Scale,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  X,
  Plus
} from 'lucide-react';
import { Product, Category, Unit, Provider, Role, MovementType, InventoryArea } from '../../types';

interface ExistenciasTabProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  providers: Provider[];
  currentUserRole: Role;
  onApplyAdjustment: (
    productId: string,
    quantity: number,
    type: MovementType,
    area: InventoryArea,
    reason: string,
    comment: string
  ) => void;
  onSwitchTab: (tab: string, productId?: string) => void;
}

export default function ExistenciasTab({
  products,
  categories,
  units,
  providers,
  currentUserRole,
  onApplyAdjustment,
  onSwitchTab
}: ExistenciasTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('all');

  // Drawer / Detail Side panel
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjType, setAdjType] = useState<MovementType>('Ajuste');
  const [adjArea, setAdjArea] = useState<InventoryArea>('Cocina');
  const [adjReason, setAdjReason] = useState('Corrección física');
  const [adjComment, setAdjComment] = useState('');

  const canAdjust = ['ADMIN', 'GERENTE', 'COCINA', 'RECEPCIÓN'].includes(currentUserRole);

  const getStockStatus = (p: Product) => {
    if (p.currentStock <= 0) return { label: 'Sin existencia', color: 'bg-rose-100 text-rose-800 border-rose-200', code: 'out' };
    if (p.currentStock <= p.minStock) return { label: 'Bajo mínimo', color: 'bg-amber-100 text-amber-800 border-amber-200', code: 'low' };
    if (p.maxStock > 0 && p.currentStock > p.maxStock) return { label: 'Sobre stock', color: 'bg-purple-100 text-purple-800 border-purple-200', code: 'over' };
    return { label: 'Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', code: 'normal' };
  };

  const getUnitCode = (unitId: string) => {
    const u = units.find(unit => unit.id === unitId);
    return u ? u.code : 'unid';
  };

  const getCategoryName = (catId: string) => {
    const c = categories.find(cat => cat.id === catId);
    return c ? c.name : 'Sin Categoría';
  };

  const getProviderNames = (prodProviders: string[]) => {
    if (!prodProviders || prodProviders.length === 0) return 'Ninguno asignado';
    return prodProviders
      .map(id => providers.find(p => p.id === id)?.name || '')
      .filter(name => name !== '')
      .join(', ');
  };

  // Filter
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p as any).sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    
    // Check if designated area or product holds stock there
    const matchesArea = selectedArea === 'all' || 
                        p.initialReceptionArea?.toLowerCase() === selectedArea.toLowerCase() ||
                        (p.areaStocks && (p.areaStocks[selectedArea as any] || 0) > 0);

    const status = getStockStatus(p);
    let matchesStatus = true;
    if (selectedStockStatus === 'low') matchesStatus = status.code === 'low';
    else if (selectedStockStatus === 'out') matchesStatus = status.code === 'out';
    else if (selectedStockStatus === 'over') matchesStatus = status.code === 'over';
    else if (selectedStockStatus === 'normal') matchesStatus = status.code === 'normal';
    else if (selectedStockStatus === 'portion') matchesStatus = p.portionsAvailable !== undefined;

    return matchesSearch && matchesCategory && matchesArea && matchesStatus;
  });

  const handleOpenAdjustment = (prod: Product, defaultType: MovementType = 'Ajuste') => {
    if (!canAdjust) {
      alert('Tu rol no cuenta con permisos para registrar movimientos o ajustes de almacén.');
      return;
    }
    setAdjustingProduct(prod);
    setAdjType(defaultType);
    setAdjQty(0);
    setAdjReason(defaultType === 'Merma' ? 'Merma operativa de cocina' : 'Corrección física');
    setAdjComment('');
    setIsAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (adjQty <= 0) {
      alert('Por favor ingrese una cantidad válida mayor a cero.');
      return;
    }
    if (!adjComment.trim()) {
      alert('El comentario explicativo de la auditoría es requerido.');
      return;
    }

    // Apply adjustment
    onApplyAdjustment(adjustingProduct.id, adjQty, adjType, adjArea, adjReason, adjComment);
    setIsAdjustmentModalOpen(false);
    setAdjustingProduct(null);

    // Refresh detail sheet
    if (selectedProduct && selectedProduct.id === adjustingProduct.id) {
      const updated = products.find(p => p.id === selectedProduct.id);
      if (updated) setSelectedProduct(updated);
    }
    alert('Ajuste operacional de almacén registrado con éxito.');
  };

  return (
    <div className="space-y-6" id="existencias-tab-container">
      {/* FILTER SHEETS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-205 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por insumo o código SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-orange-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-orange-500 transition"
          >
            <option value="all">📁 Todas las Categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Area */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-orange-500 transition"
          >
            <option value="all">📍 Ubicación (Todos)</option>
            <option value="cocina">Cocina</option>
            <option value="bar">Bar</option>
            <option value="almacén seco">Almacén seco</option>
            <option value="refrigerados">Refrigerados</option>
            <option value="congelados">Congelados</option>
          </select>

          {/* Status */}
          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white focus:border-orange-500 transition"
          >
            <option value="all">🟢 Todos los Estados</option>
            <option value="normal">Normal</option>
            <option value="low">⚠️ Bajo Mínimo</option>
            <option value="out">🛑 Sin Existencia</option>
            <option value="over">Sobre stock</option>
            <option value="portion">Porcionables</option>
          </select>

          <span className="text-xs text-slate-500 font-mono">
            {filteredProducts.length} productos
          </span>
        </div>
      </div>

      {/* CORE CONTENT GRID (Side Drawer + Table list) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEDGER GRID (Table on Desktop, Cards on Mobile) */}
        <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden ${selectedProduct ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4 text-right">Existencia Actual</th>
                  <th className="p-4 text-center">Estatus</th>
                  <th className="p-4 text-right">Costo Promedio</th>
                  <th className="p-4 text-right">Valuación Total</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" id="existencias-table-body">
                {filteredProducts.map((p) => {
                  const status = getStockStatus(p);
                  const totalValue = p.currentStock * p.averageCost;
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition ${selectedProduct?.id === p.id ? 'bg-orange-50/20' : ''}`}
                    >
                      <td className="p-4">
                        <div>
                          <strong className="text-slate-800 text-sm font-semibold">{p.name}</strong>
                          {(p as any).sku && <span className="block text-[10px] text-slate-400 font-mono mt-0.5">SKU: {(p as any).sku}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{getCategoryName(p.categoryId)}</td>
                      <td className="p-4 text-slate-500 font-semibold">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-800 font-medium">{p.initialReceptionArea || 'Almacén seco'}</span>
                          <span className="text-[10px] text-slate-400">Destino: {p.habitualDestinationArea || 'Cocina'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-800 font-bold">
                        {p.currentStock.toLocaleString('es-DO', { minimumFractionDigits: 1 })} <span className="text-[10px] text-slate-400 font-normal">{getUnitCode(p.unitId)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-slate-600">
                        RD${p.averageCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-800 font-bold">
                        RD${totalValue.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-slate-600 transition"
                            title="Ver Fila Completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAdjustment(p)}
                            className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 px-2 py-1 rounded text-[10px] font-bold"
                            title="Mover o Ajustar"
                          >
                            Ajustar
                          </button>
                          <button
                            onClick={() => handleOpenAdjustment(p, 'Merma')}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2 py-1 rounded text-[10px] font-bold"
                            title="Reportar Merma"
                          >
                            Merma
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile responsive Cards Layout */}
          <div className="md:hidden divide-y divide-slate-105 text-xs" id="existencias-mobile-cards">
            {filteredProducts.map((p) => {
              const status = getStockStatus(p);
              const totalValue = p.currentStock * p.averageCost;
              return (
                <div key={p.id} onClick={() => setSelectedProduct(p)} className="p-4 bg-white hover:bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-slate-800 text-base leading-snug">{p.name}</strong>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Cat: {getCategoryName(p.categoryId)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-600 text-xs py-1.5">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock</span>
                      <strong className="font-mono text-slate-800 text-sm">{p.currentStock.toLocaleString()} {getUnitCode(p.unitId)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor total</span>
                      <strong className="font-mono text-slate-900 text-sm">RD${totalValue.toLocaleString('es', { minimumFractionDigits: 1 })}</strong>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-dashed border-slate-100 justify-end" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenAdjustment(p)}
                      className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold rounded-lg text-[10px]"
                    >
                      Ajustar Stock
                    </button>
                    <button
                      onClick={() => handleOpenAdjustment(p, 'Merma')}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg text-[10px]"
                    >
                      Registrar Merma
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE DETAIL SIDE PANEL DRAW */}
        {selectedProduct && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm p-5 space-y-6 lg:col-span-1 animate-fade-in text-xs">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">FICHA RÁPIDA DE STOCK</span>
                <h3 className="font-display font-extrabold text-base text-slate-800 leading-tight mt-0.5">{selectedProduct.name}</h3>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Código SKU</span>
                <p className="font-mono text-slate-800 font-bold">{(selectedProduct as any).sku || 'SIN CÓDIGO'}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Proveedor Recomendado</span>
                <p className="font-sans text-slate-800 flex items-center gap-1 mt-0.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {getProviderNames(selectedProduct.providerIds)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mínimo Auditoría</span>
                  <p className="font-mono font-medium text-slate-700">{selectedProduct.minStock} {getUnitCode(selectedProduct.unitId)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Máximo de Capacidad</span>
                  <p className="font-mono font-medium text-slate-700">{selectedProduct.maxStock} {getUnitCode(selectedProduct.unitId)}</p>
                </div>
              </div>

              {/* STOCK BY AREA DISTRIBUTION BREAKDOWN */}
              <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 space-y-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Distribución por Área</span>
                <div className="space-y-1.5 divide-y divide-slate-200/50">
                  {Object.entries(selectedProduct.areaStocks || {}).map(([areaName, qty]) => {
                    const stockQty = qty as number;
                    if (stockQty <= 0) return null;
                    return (
                      <div key={areaName} className="flex justify-between items-center text-[11px] pt-1.5 first:pt-0">
                        <span className="text-slate-600 font-medium">{areaName}</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {stockQty.toLocaleString('es-DO', { minimumFractionDigits: 1 })} <span className="text-[9px] text-slate-400 font-normal">{getUnitCode(selectedProduct.unitId)}</span>
                        </span>
                      </div>
                    );
                  })}
                  {Object.values(selectedProduct.areaStocks || {}).every(qty => (qty as number) <= 0) && (
                    <p className="text-[10px] text-slate-400 italic">Sin existencia registrada en ninguna ubicación.</p>
                  )}
                </div>
              </div>

              {selectedProduct.portionsAvailable !== undefined && (
                <div className="bg-sky-50 border border-sky-150 rounded-xl p-3">
                  <span className="text-[10.5px] text-sky-800 font-bold flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-sky-500" />
                    CONFIGURACIÓN DE PORCIÓN
                  </span>
                  <p className="text-xs text-sky-700 mt-1">
                    Este producto es porcionable. Dispone de <strong className="font-mono text-slate-900">{selectedProduct.portionsAvailable} porciones</strong> listas para la operación del salón.
                  </p>
                </div>
              )}

              <div className="p-4 bg-white rounded-xl border border-slate-200/60 shadow-xs space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Último Costo Compra</span>
                  <strong className="font-mono text-slate-800">RD${(selectedProduct.lastPrice || 0).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Costo Promedio Diario</span>
                  <strong className="font-mono text-slate-800 font-bold">RD${selectedProduct.averageCost.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-slate-100">
                  <span className="text-slate-850 font-bold">Inversión Financiera</span>
                  <strong className="font-mono text-orange-600 text-sm font-extrabold">
                    RD${(selectedProduct.currentStock * selectedProduct.averageCost).toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Redirections links inside the module */}
            <div className="pt-4 border-t border-slate-205 space-y-2">
              <button
                onClick={() => onSwitchTab('movimientos', selectedProduct.id)}
                className="w-full text-left py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100/60 rounded-xl font-bold flex items-center justify-between text-slate-700 transition"
              >
                <span>Ver Movimientos Kárdex</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onSwitchTab('conteo')}
                className="w-full text-left py-2 px-3 bg-white border border-slate-200 hover:bg-slate-100/60 rounded-xl font-bold flex items-center justify-between text-slate-700 transition"
              >
                <span>Iniciar Auditoría Conteo</span>
                <Scale className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MANUAL ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-manual-adjustment">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden text-xs font-sans">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[9px] bg-amber-150 text-amber-800 font-bold py-0.5 px-2 rounded-full uppercase">
                  AUDITORÍA INTERNA MANDATORIA
                </span>
                <h3 className="font-display font-bold text-base text-slate-800 mt-1">Registrar Ajuste en Kárdex</h3>
              </div>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Estableciendo cambio para <strong>{adjustingProduct.name}</strong>. Stock Actual: <strong>{adjustingProduct.currentStock} {getUnitCode(adjustingProduct.unitId)}</strong>.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Tipo de Ajuste *</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as MovementType)}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white"
                  >
                    <option value="Ajuste">Ajuste (Manual)</option>
                    <option value="Merma">Merma (Daño, descomposición)</option>
                    <option value="Transferencia">Transferencia (Entre Áreas)</option>
                    <option value="Entrada">Entrada (Simulada)</option>
                    <option value="Salida">Salida (Consumo General)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Área / Ubicación *</label>
                  <select
                    value={adjArea}
                    onChange={(e) => setAdjArea(e.target.value as any)}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white"
                  >
                    <option value="Cocina">Cocina principal</option>
                    <option value="Bar">Barra de licores</option>
                    <option value="Almacén seco">Almacén seco</option>
                    <option value="Refrigerados">Cámara refrigeradora</option>
                    <option value="Congelados">Cámara congeladores</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Cantidad del movimiento *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={adjQty === 0 ? '' : adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value))}
                    placeholder={`Ej. 5.1 ${getUnitCode(adjustingProduct.unitId)}`}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-850 font-bold focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Motivo operativo *</label>
                  <input
                    type="text"
                    required
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    placeholder="Ej. Diferencia conteo nocturno"
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-805 font-semibold focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Comentario Explicativo Auditoría (Requerido) *</label>
                <textarea
                  rows={2}
                  required
                  value={adjComment}
                  onChange={(e) => setAdjComment(e.target.value)}
                  placeholder="Favor detalle por qué se aplica este ajuste manual (p.ej. Se quebró el frasco al mover, merma por desconexión en cámaras...)"
                  className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-3 outline-none text-slate-800 focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Registrar Ajuste Seguro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
