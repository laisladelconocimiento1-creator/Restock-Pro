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
  Plus,
  Clock,
  Boxes,
  Package,
  Info
} from 'lucide-react';
import { Product, Category, Unit, Provider, Role, MovementType, InventoryArea } from '../../types';
import { store } from '../../data/store';

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
  const [detailActiveTab, setDetailActiveTab] = useState<'stocks' | 'requisiciones' | 'kardex' | 'alertas'>('stocks');

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

      {/* CORE CONTENT GRID (No layout shifting - Ficha opens as a beautiful full modal overlay) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEDGER GRID (Table on Desktop, Cards on Mobile) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden lg:col-span-4">
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

        {/* INTERACTIVE DETAIL MULTI-SECTION SHEET MODAL */}
        {selectedProduct && (() => {
          // Calculate lists and metrics live from store
          const requestsList = store.getKitchenRequests();
          const movementsList = store.getMovements();
          const portionRules = store.getPortionRules();
          const portionBatches = store.getPortionBatches();
          const portionSales = store.getPortionSales();
          const portionMovements = store.getPortionMovements();

          // 1. Related requests
          const relatedRequests = requestsList.filter(r =>
            r.items.some(item => item.productId === selectedProduct.id)
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Requisitions count
          const reqsPendientes = relatedRequests.filter(r => r.status === 'Pendiente' || r.status === 'Enviada');
          const reqsAprobadas = relatedRequests.filter(r => r.status === 'Aprobada');

          // 2. Related movements
          const relatedMovements = movementsList.filter(m =>
            m.productId === selectedProduct.id
          ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // 3. Portion operations (if applicable)
          const rule = portionRules.find(r => r.productId === selectedProduct.id);
          const isPortionable = selectedProduct.portionsAvailable !== undefined || (rule && rule.requiresPortioning);
          
          const conversionFactor = rule ? rule.conversionFactor : 16; // e.g. 16oz/lb
          const portionSize = rule ? rule.standardPortionSize : 8; // e.g. 8oz

          // portions per purchase unit
          const portionsPerPurchaseUnit = portionSize > 0 ? (conversionFactor / portionSize) : 2; 

          // stock in kitchen and warehouse
          const kitchenStock = selectedProduct.areaStocks?.['Cocina'] || 0;
          const whStock = (selectedProduct.areaStocks?.['Almacén seco'] || 0) +
                           (selectedProduct.areaStocks?.['Refrigerados'] || 0) +
                           (selectedProduct.areaStocks?.['Congelados'] || 0);

          // Expected theoretical portions
          const expectedPortionsTheoretical = Math.round(kitchenStock * portionsPerPurchaseUnit);
          const realPortionsAvailable = selectedProduct.portionsAvailable || 0;

          // Sold today
          const soldTodayPortions = portionSales
            .filter(s => s.productId === selectedProduct.id)
            .reduce((sum, s) => sum + s.portionsSold, 0);

          // Portions in waste/merma
          const portionMermaQty = portionMovements
            .filter(pm => pm.productId === selectedProduct.id && pm.movementType === 'PORTION_WASTE')
            .reduce((sum, pm) => sum + pm.quantity, 0);

          // Cost per portion
          const costPerPortion = portionsPerPurchaseUnit > 0 
            ? (selectedProduct.averageCost / portionsPerPurchaseUnit) 
            : selectedProduct.averageCost;

          // Latest portion batch
          const latestBatch = portionBatches
            .filter(b => b.productId === selectedProduct.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          // 4. Live stock states
          const stockDisponibleAlmacen = whStock;
          const stockComprometidoReqs = reqsPendientes.reduce((sum, r) => {
            const item = r.items.find(i => i.productId === selectedProduct.id);
            return sum + (item ? item.qty : 0);
          }, 0);
          const stockTransferidoCocina = kitchenStock;
          const stockPendientePorcionar = isPortionable ? kitchenStock : 0;
          const stockPorcionadoDisponible = realPortionsAvailable;
          
          const stockEnMerma = relatedMovements
            .filter(m => m.type === 'Merma')
            .reduce((sum, m) => sum + Math.abs(m.qty), 0);

          const stockDañado = relatedMovements
            .filter(m => m.reason.toLowerCase().includes('dañ') || m.comment?.toLowerCase().includes('dañ'))
            .reduce((sum, m) => sum + Math.abs(m.qty), 0);

          const stockVencido = relatedMovements
            .filter(m => m.reason.toLowerCase().includes('venc') || m.comment?.toLowerCase().includes('venc'))
            .reduce((sum, m) => sum + Math.abs(m.qty), 0);

          const stockAjustado = relatedMovements
            .filter(m => m.type === 'Ajuste')
            .reduce((sum, m) => sum + m.qty, 0);

          // 5. Active Alerts Evaluator (Section 8)
          const productAlerts: string[] = [];
          
          if (whStock <= (selectedProduct.minStockWarehouse || selectedProduct.minStock * 0.6)) {
            productAlerts.push(`Bajo mínimo en almacén: Solo quedan ${whStock.toFixed(1)} ${getUnitCode(selectedProduct.unitId)}.`);
          }
          if (kitchenStock <= (selectedProduct.minStockKitchen || selectedProduct.minStock * 0.3)) {
            productAlerts.push(`Bajo mínimo en cocina: Solo quedan ${kitchenStock.toFixed(1)} ${getUnitCode(selectedProduct.unitId)} en cocina.`);
          }
          if (isPortionable && kitchenStock > 0 && realPortionsAvailable <= 5) {
            productAlerts.push(`Pendiente de porcionar: Hay ${kitchenStock} ${getUnitCode(selectedProduct.unitId)} de materia prima en cocina, pero solo hay ${realPortionsAvailable} porciones listas.`);
          }
          if (reqsPendientes.length > 0) {
            productAlerts.push(`Requisición pendiente: Existen ${reqsPendientes.length} requisiciones de cocina pendientes de surtir.`);
          }
          if (Math.abs(stockAjustado) > (selectedProduct.minStock * 0.5)) {
            productAlerts.push(`Diferencia de conteo: Historial muestra altas diferencias acumuladas en ajustes de auditoría.`);
          }
          if (selectedProduct.lastPrice > selectedProduct.averageCost) {
            productAlerts.push(`Costo aumentó: El último precio (RD$ ${selectedProduct.lastPrice}) superó al costo promedio histórico (RD$ ${selectedProduct.averageCost}).`);
          }
          if (stockEnMerma > (selectedProduct.minStock * 0.8)) {
            productAlerts.push(`Alto nivel de merma: El producto registra mermas acumuladas de ${stockEnMerma.toFixed(1)} ${getUnitCode(selectedProduct.unitId)}.`);
          }

          const statusInfo = getStockStatus(selectedProduct);

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="product-ficha-modal">
              <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/85 overflow-hidden flex flex-col my-8">
                
                {/* MODAL HEADER */}
                <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-orange-500 text-white px-2.5 py-0.5 rounded-full font-sans font-bold uppercase tracking-wider">
                      Consulta Integral de Insumo (Ficha Operativa)
                    </span>
                    <h2 className="text-2xl font-display font-black tracking-tight mt-1 flex items-center gap-2">
                      <Package className="w-6 h-6 text-orange-400" />
                      {selectedProduct.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="bg-slate-800 px-2 py-0.5 rounded-md font-mono">SKU: {(selectedProduct as any).sku || 'SIN CÓDIGO'}</span>
                      <span className="font-medium">• Categoría: {getCategoryName(selectedProduct.categoryId)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white self-start md:self-center"
                    title="Cerrar Ficha"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* MODAL BODY */}
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-150 content-start flex-grow">
                  
                  {/* LEFT COLUMN: Section 1 & 2 */}
                  <div className="p-6 bg-slate-50/50 space-y-6 lg:max-h-[70vh] overflow-y-auto">
                    
                    {/* SECTION 1 */}
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        1. Información General
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-y-3 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Nombre</span>
                          <strong className="text-slate-800 text-right">{selectedProduct.name}</strong>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Código SKU</span>
                          <strong className="font-mono text-slate-800 font-bold">{(selectedProduct as any).sku || 'SIN SKU'}</strong>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Categoría</span>
                          <span className="text-slate-800 font-semibold">{getCategoryName(selectedProduct.categoryId)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Proveedor Principal</span>
                          <span className="text-slate-850 font-medium truncate max-w-[150px]">{getProviderNames(selectedProduct.providerIds)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Unidad de Compra</span>
                          <span className="text-slate-800 font-mono">{(selectedProduct as any).purchaseUnitId ? units.find(u => u.id === (selectedProduct as any).purchaseUnitId)?.name : 'Libras (lb)'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Unidad Base</span>
                          <span className="text-slate-805 font-medium font-mono">{getUnitCode(selectedProduct.unitId)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Factor de Conversión</span>
                          <span className="text-slate-800 font-bold">1 {getUnitCode(selectedProduct.unitId)} = {conversionFactor} oz</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200/40 pb-1">
                          <span className="text-slate-400">Estatus</span>
                          <span className="text-slate-850 font-bold">{statusInfo.label}</span>
                        </div>
                      </div>

                      {/* Cost and investment */}
                      <div className="mt-4 p-3 bg-white rounded-xl border border-slate-200 shadow-3xs space-y-2">
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-slate-500">Costo Promedio</span>
                          <strong className="font-mono text-slate-800">RD$ {selectedProduct.averageCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-slate-500">Último Costo</span>
                          <strong className="font-mono text-slate-800">RD$ {selectedProduct.lastPrice.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="flex justify-between text-xs items-center pt-2 border-t border-dashed border-slate-100 font-semibold text-slate-950">
                          <span>Inversión Total</span>
                          <strong className="font-mono text-orange-600">RD$ {(selectedProduct.currentStock * selectedProduct.averageCost).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</strong>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2 */}
                    <div className="space-y-3">
                      <h3 className="text-xs uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        2. Configuración Operativa
                      </h3>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/50">
                          <span className="text-slate-500">Requiere Porcionamiento</span>
                          <strong className={`px-2 py-0.5 rounded text-[10px] uppercase ${isPortionable ? 'bg-sky-100 text-sky-800' : 'bg-slate-150 text-slate-600'}`}>{isPortionable ? 'Sí' : 'No'}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/50">
                          <span className="text-slate-500">Requiere Procesamiento</span>
                          <strong className="text-slate-700">{selectedProduct.requiresProcessing ? 'Sí' : 'No'}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/50">
                          <span className="text-slate-500">Se Usa en Recetas</span>
                          <strong className="text-slate-700">{selectedProduct.isUsedInRecipes ? 'Sí' : 'No'}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200/50">
                          <span className="text-slate-500">Se Consume Directo</span>
                          <strong className="text-slate-700">{selectedProduct.isConsumedDirect ? 'Sí' : 'No'}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                            <span className="text-slate-400 block text-[10px]">Unidad Operativa</span>
                            <strong className="text-slate-800">{isPortionable ? 'Porciones' : getUnitCode(selectedProduct.unitId)}</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                            <span className="text-slate-400 block text-[10px]">Tamaño Porción</span>
                            <strong className="text-slate-800 font-mono">{selectedProduct.portionSize ? `${selectedProduct.portionSize} oz` : isPortionable ? `${portionSize} oz` : 'No aplica'}</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                            <span className="text-slate-400 block text-[10px]">Rendimiento</span>
                            <strong className="text-slate-800 font-mono">{selectedProduct.expectedYield || (isPortionable ? '95%' : '100%')}</strong>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/50">
                            <span className="text-slate-400 block text-[10px]">Merma Esperada</span>
                            <strong className="text-slate-800 font-mono">{selectedProduct.expectedWaste || (isPortionable ? '5%' : '0%')}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PANEL */}
                  <div className="lg:col-span-2 flex flex-col h-full bg-white max-h-[70vh] overflow-y-auto">
                    
                    {/* TABS HEADER BAR */}
                    <div className="border-b border-slate-150 bg-slate-50 px-4 py-2 flex flex-wrap gap-1.5 sticky top-0 z-10">
                      {[
                        { id: 'stocks', label: 'Stocks y Operación', icon: Boxes },
                        { id: 'requisiciones', label: 'Requisiciones', icon: FileText },
                        { id: 'kardex', label: 'Evolución Kárdex', icon: Clock },
                        { id: 'alertas', label: `Alertas (${productAlerts.length})`, icon: AlertTriangle, badge: productAlerts.length }
                      ].map(tab => {
                        const TabIcon = tab.icon;
                        const isTabActive = detailActiveTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setDetailActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold font-sans uppercase transition duration-150 ${
                              isTabActive
                                ? 'bg-slate-800 text-white border-slate-850 shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <TabIcon className={`w-3.5 h-3.5 ${isTabActive ? 'text-orange-400' : 'text-slate-400'}`} />
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                              <span className={`ml-1 px-1.5 py-0.5 text-[9px] rounded-full font-bold ${isTabActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-650'}`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* ACTIVE TAB SPACE */}
                    <div className="p-6 space-y-6 flex-grow pb-16">
                      
                      {/* TAB 1 */}
                      {detailActiveTab === 'stocks' && (
                        <div className="space-y-6 animate-fade-in text-xs">
                          
                          {/* SECTION 3 */}
                          <div className="space-y-3">
                            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                              <span>3. Existencias por Área Física</span>
                              <span className="text-[10px] italic font-normal text-slate-400">Total Auditado = {selectedProduct.currentStock} {getUnitCode(selectedProduct.unitId)}</span>
                            </h4>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { name: 'Almacén seco', icon: '📦' },
                                { name: 'Refrigerados', icon: '❄️' },
                                { name: 'Congelados', icon: '🧊' },
                                { name: 'Cocina', icon: '🍳' },
                                { name: 'Área de procesamiento', icon: '🥩' },
                                { name: 'Bar', icon: '🍷' },
                                { name: 'Desechables', icon: '🥤' },
                                { name: 'Limpieza', icon: '🧹' }
                              ].map(area => {
                                const stockVal = selectedProduct.areaStocks?.[area.name as any] || 0;
                                return (
                                  <div key={area.name} className="p-3 rounded-xl border border-slate-150 flex flex-col justify-between space-y-2 bg-slate-50/40 relative hover:shadow-2xs transition">
                                    <div className="flex justify-between items-start">
                                      <span className="text-xl">{area.icon}</span>
                                      <span className="text-[8.5px] font-bold font-sans uppercase tracking-[0.05em] text-slate-400">{area.name.split(' ')[0]}</span>
                                    </div>
                                    <div className="pt-1">
                                      <p className="text-[10px] text-slate-500 font-semibold truncate leading-none mb-1">{area.name}</p>
                                      <p className="font-mono text-slate-900 text-sm font-black">
                                        {stockVal.toLocaleString('es-DO', { minimumFractionDigits: 1 })} <span className="text-[10px] text-slate-400 font-normal">{getUnitCode(selectedProduct.unitId)}</span>
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* SECTION 4 */}
                          <div className="space-y-3">
                            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider border-b border-slate-200 pb-1.5">
                              4. Stock por Estado Operativo
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {[
                                { name: 'Disponible en Almacén', value: stockDisponibleAlmacen, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-emerald-700 bg-emerald-50 border-emerald-100', desc: 'Existencia activa lista para surtir' },
                                { name: 'Comprometido en Requisiciones', value: stockComprometidoReqs, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-amber-700 bg-amber-50 border-amber-100', desc: 'Reservado en solicitudes pendientes' },
                                { name: 'Transferido a Cocina', value: stockTransferidoCocina, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-indigo-700 bg-indigo-50 border-indigo-100', desc: 'Insumos en tránsito de cocina' },
                                { name: 'Pendiente de Porcionar', value: stockPendientePorcionar, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-purple-700 bg-purple-50 border-purple-100', desc: 'Materia prima cruda en preparación', showOnly: isPortionable },
                                { name: 'Porcionado Disponible', value: stockPorcionadoDisponible, unit: 'porc', colorType: 'text-sky-700 bg-sky-50 border-sky-100', desc: 'Porciones listas listas para venta', showOnly: isPortionable },
                                { name: 'En Merma Registrada', value: stockEnMerma, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-red-700 bg-red-50 border-red-100', desc: 'Mermas y pérdidas del kárdex' },
                                { name: 'Dañado / Pérdida', value: stockDañado, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-rose-700 bg-rose-50 border-rose-150', desc: 'Producto no apto reportado' },
                                { name: 'Vencido / Caducado', value: stockVencido, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-orange-700 bg-orange-50 border-orange-100', desc: 'Fuera de vida útil asignada' },
                                { name: 'Ajustado (Auditoría)', value: stockAjustado, unit: getUnitCode(selectedProduct.unitId), colorType: 'text-slate-700 bg-slate-50 border-slate-100', desc: 'Diferencia neta por conteo físico' }
                              ].map(state => {
                                if (state.showOnly === false) return null;
                                return (
                                  <div key={state.name} className="p-3 bg-white border border-slate-205 rounded-xl space-y-1 hover:shadow-2xs transition flex flex-col justify-between">
                                    <div className="flex justify-between items-start gap-1">
                                      <span className="font-semibold text-slate-700 text-[11.5px] leading-tight">{state.name}</span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold leading-none ${state.colorType}`}>
                                        {state.value} {state.unit}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-snug mt-1">{state.desc}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* SECTION 5 */}
                          <div className="space-y-3">
                            <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                              <span>5. Stock Operativo de Rendimiento</span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                                {isPortionable ? 'Proteína / Porcionable' : 'Insumo Standard / No Porcionable'}
                              </span>
                            </h4>

                            {isPortionable ? (
                              <div className="bg-sky-50/50 border border-sky-150 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 border-r border-sky-100/75 pr-2">
                                  <span className="text-sky-800 font-bold block text-[10px] uppercase">Porciones Esperadas</span>
                                  <p className="text-xl font-mono font-black text-sky-950">{expectedPortionsTheoretical} <span className="text-xs font-normal">porc</span></p>
                                  <p className="text-[10px] text-sky-700">Teorico esperable sobre {kitchenStock} {getUnitCode(selectedProduct.unitId)} en cocina.</p>
                                </div>

                                <div className="space-y-1 border-r border-sky-100/75 pr-2 bg-white p-2.5 rounded-lg shadow-3xs">
                                  <span className="text-emerald-800 font-bold block text-[10px] uppercase">Reales Disponibles</span>
                                  <p className="text-xl font-mono font-black text-emerald-600">{realPortionsAvailable} <span className="text-xs font-normal">porciones</span></p>
                                  <p className="text-[10px] text-slate-400">Porciones listas registradas en cocina.</p>
                                </div>

                                <div className="space-y-2 flex flex-col justify-between">
                                  <div className="flex justify-between items-center text-[10.5px]">
                                    <span className="text-slate-500">Vendidas Hoy:</span>
                                    <strong className="text-slate-800 font-mono">{soldTodayPortions} porciones</strong>
                                  </div>
                                  <div className="flex justify-between items-center text-[10.5px]">
                                    <span className="text-slate-500 text-red-650">Merma Porción:</span>
                                    <strong className="text-red-600 font-mono">{portionMermaQty} porciones</strong>
                                  </div>
                                  <div className="bg-emerald-100/40 p-2 rounded-lg flex justify-between items-center text-[11px]">
                                    <span className="text-slate-550 font-bold">Costo x Porción</span>
                                    <strong className="font-mono text-emerald-700 font-bold">RD$ {costPerPortion.toFixed(2)}</strong>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                                <div className="p-2 bg-white rounded-lg border border-slate-150">
                                  <span className="text-slate-400 block text-[9.5px] uppercase">Stock Físico</span>
                                  <p className="text-sm font-mono font-black text-slate-850 mt-1">{selectedProduct.currentStock} {getUnitCode(selectedProduct.unitId)}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-150">
                                  <span className="text-slate-400 block text-[9.5px] uppercase">Cocina</span>
                                  <p className="text-sm font-mono font-black text-indigo-650 mt-1">{stockTransferidoCocina} {getUnitCode(selectedProduct.unitId)}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-150">
                                  <span className="text-slate-400 block text-[9.5px] uppercase">Est. Consumo receta</span>
                                  <p className="text-sm font-mono font-black text-purple-650 mt-1">{(stockEnMerma + stockTransferidoCocina * 0.4).toFixed(1)} {getUnitCode(selectedProduct.unitId)}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-150">
                                  <span className="text-slate-400 block text-[9.5px] uppercase">Bajo Mínimo</span>
                                  <p className={`text-xs font-sans font-bold uppercase mt-1 ${selectedProduct.currentStock <= selectedProduct.minStock ? 'text-red-600' : 'text-slate-500'}`}>
                                    {selectedProduct.currentStock <= selectedProduct.minStock ? 'Sí' : 'No'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 2 */}
                      {detailActiveTab === 'requisiciones' && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span>6. Requisiciones de Cocina Relacionadas</span>
                            <span className="text-[10px] font-mono text-slate-400">{relatedRequests.length} solicitudes</span>
                          </h4>

                          {relatedRequests.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 border border-slate-150 rounded-xl">
                              <p className="text-slate-400 italic">No existen solicitudes de cocina pendientes o históricas para este insumo.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold uppercase tracking-wider text-[9px]">
                                  <tr>
                                    <th className="p-3">Pedido Code</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Destino</th>
                                    <th className="p-3 text-right">Cantidad Solicitada</th>
                                    <th className="p-3 text-right">Cantidad Entregada</th>
                                    <th className="p-3 text-center">Estado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {relatedRequests.map(req => {
                                    const mItem = req.items.find(item => item.productId === selectedProduct.id);
                                    if (!mItem) return null;
                                    const qtyDelivered = ['Entregada', 'Procesada', 'Cerrada'].includes(req.status)
                                      ? mItem.qty
                                      : req.status === 'Parcialmente entregada' ? Math.round(mItem.qty * 0.7) : 0;
                                    return (
                                      <tr key={req.id} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-bold font-mono text-slate-900">{req.code}</td>
                                        <td className="p-3 text-slate-500">{new Date(req.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-slate-700 font-semibold">{req.requestingArea || 'Cocina'}</td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-800">{mItem.qty} {getUnitCode(selectedProduct.unitId)}</td>
                                        <td className="p-3 text-right font-mono font-bold text-slate-800">{qtyDelivered} {getUnitCode(selectedProduct.unitId)}</td>
                                        <td className="p-3 text-center">
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-205">
                                            {req.status}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3 */}
                      {detailActiveTab === 'kardex' && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                            <span>7. Movimientos de Kárdex Registrados</span>
                            <span className="text-[10px] text-slate-400 font-mono">{relatedMovements.length} transacciones</span>
                          </h4>

                          {relatedMovements.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 border border-slate-150 rounded-xl">
                              <p className="text-slate-400 italic">No hay historial de movimientos de kárdex ingresados.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto border border-slate-150 rounded-xl bg-white max-h-[300px] overflow-y-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 font-bold uppercase tracking-wider text-[9px] sticky top-0">
                                  <tr>
                                    <th className="p-3 bg-slate-50">Fecha / Hora</th>
                                    <th className="p-3 bg-slate-50">Operación</th>
                                    <th className="p-3 bg-slate-50">Área</th>
                                    <th className="p-3 bg-slate-50 text-right">Cantidad</th>
                                    <th className="p-3 bg-slate-50 text-right">Anterior</th>
                                    <th className="p-3 bg-slate-50 text-right font-semibold text-slate-850">Resultante</th>
                                    <th className="p-3 bg-slate-50">Detalle</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {relatedMovements.map(m => (
                                    <tr key={m.id} className="hover:bg-slate-50/50">
                                      <td className="p-3 font-mono text-slate-400">{new Date(m.date).toLocaleString()}</td>
                                      <td className="p-3">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                          m.type === 'Entrada' ? 'bg-emerald-50 text-emerald-800' :
                                          m.type === 'Salida' ? 'bg-rose-50 text-rose-800' :
                                          m.type === 'Transferencia' ? 'bg-sky-50 text-sky-800' :
                                          'bg-purple-50 text-purple-800'
                                        }`}>
                                          {m.type}
                                        </span>
                                      </td>
                                      <td className="p-3 font-semibold text-slate-700">{m.area}</td>
                                      <td className={`p-3 text-right font-mono font-bold ${m.qty < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {m.qty > 0 ? `+${m.qty}` : m.qty} {m.unitCode}
                                      </td>
                                      <td className="p-3 text-right font-mono text-slate-400">{m.quantityBefore}</td>
                                      <td className="p-3 text-right font-mono font-bold text-slate-800">{m.quantityAfter}</td>
                                      <td className="p-3 text-slate-500 italic max-w-xs truncate">{m.reason}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 4 */}
                      {detailActiveTab === 'alertas' && (
                        <div className="space-y-4 animate-fade-in text-xs">
                          <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider border-b border-slate-200 pb-1.5">
                            8. Alertas Operativas de Control de Riesgo
                          </h4>

                          {productAlerts.length === 0 ? (
                            <div className="p-8 text-center bg-emerald-50 border border-emerald-150 rounded-xl">
                              <span className="text-2xl block mb-1">🛡️</span>
                              <strong className="text-emerald-800 text-sm block">Ninguna Alerta Activa</strong>
                              <p className="text-emerald-600 mt-1">El insumo opera bajo parámetros operacionales ideales de stock y mermas.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {productAlerts.map((alt, idx) => (
                                <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900">
                                  <span className="text-base mt-0.5">⚠️</span>
                                  <div>
                                    <strong className="block font-bold">Riesgo Detectado</strong>
                                    <p className="text-[11px] mt-0.5 font-medium">{alt}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* REDIRECTS AND ACTIONS footer bar */}
                    <div className="border-t border-slate-150 p-5 bg-slate-50 flex flex-wrap gap-2.5 justify-end">
                      <button
                        onClick={() => handleOpenAdjustment(selectedProduct)}
                        className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-sans font-bold rounded-lg border border-orange-200 text-xs shadow-3xs"
                      >
                        Mover / Ajustar Stock
                      </button>
                      <button
                        onClick={() => handleOpenAdjustment(selectedProduct, 'Merma')}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-sans font-bold rounded-lg border border-red-200 text-xs shadow-3xs"
                      >
                        Registrar Merma
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(null);
                          onSwitchTab('movimientos', selectedProduct.id);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white font-sans font-bold rounded-lg text-xs shadow-3xs flex items-center gap-1"
                      >
                        Ver Kárdex Completo
                        <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
                      </button>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          );
        })()}
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
