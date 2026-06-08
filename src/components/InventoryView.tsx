import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  FileText,
  BadgeAlert,
  Sliders,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  RefreshCw,
  Tags,
  Compass
} from 'lucide-react';
import { Product, Category, Unit, Provider, Role, MovementType, InventoryArea } from '../types';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  providers: Provider[];
  currentUserRole: Role;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onAddCategory: (cat: Category) => void;
  onAddUnit: (unit: Unit) => void;
  onApplyAdjustment: (
    productId: string,
    quantity: number,
    type: MovementType,
    area: InventoryArea,
    reason: string,
    comment: string
  ) => void;
}

export default function InventoryView({
  products,
  categories,
  units,
  providers,
  currentUserRole,
  onAddProduct,
  onUpdateProduct,
  onAddCategory,
  onAddUnit,
  onApplyAdjustment
}: InventoryProps) {
  // Navigation tabs inside Inventory module
  const [subTab, setSubTab] = useState<'products' | 'categories' | 'units'>('products');

  // Search and general filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<'all' | 'low' | 'out'>('all');

  // Selected item detail view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal open states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Adjustment form states
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjType, setAdjType] = useState<MovementType>('Ajuste');
  const [adjArea, setAdjArea] = useState<InventoryArea>('Cocina');
  const [adjReason, setAdjReason] = useState('Diferencia menor detectada');
  const [adjComment, setAdjComment] = useState('');

  // Category and Unit form states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');

  // New/Edit product form states
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodUnitId, setProdUnitId] = useState('');
  const [prodMinStock, setProdMinStock] = useState<number>(10);
  const [prodMaxStock, setProdMaxStock] = useState<number>(100);
  const [prodAvgCost, setProdAvgCost] = useState<number>(0);
  const [prodLastPrice, setProdLastPrice] = useState<number>(0);
  const [prodDescription, setProdDescription] = useState('');
  const [prodProviders, setProdProviders] = useState<string[]>([]);

  // Page index
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Authorization checking helper
  const canEdit = ['ADMIN', 'GERENTE', 'COMPRAS'].includes(currentUserRole);
  const canAdjust = ['ADMIN', 'GERENTE', 'COCINA', 'RECEPCIÓN'].includes(currentUserRole);

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;

    let matchesStatus = true;
    if (selectedStockStatus === 'low') {
      matchesStatus = p.currentStock > 0 && p.currentStock <= p.minStock;
    } else if (selectedStockStatus === 'out') {
      matchesStatus = p.currentStock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Handlers
  const handleOpenProductModal = (prod: Product | null = null) => {
    if (!canEdit) {
      alert('Tu rol (' + currentUserRole + ') no posee permisos de edición de catálogo.');
      return;
    }
    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdCategoryId(prod.categoryId);
      setProdUnitId(prod.unitId);
      setProdMinStock(prod.minStock);
      setProdMaxStock(prod.maxStock);
      setProdAvgCost(prod.averageCost);
      setProdLastPrice(prod.lastPrice);
      setProdDescription(prod.description);
      setProdProviders(prod.providerIds);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdCategoryId(categories[0]?.id || '');
      setProdUnitId(units[0]?.id || '');
      setProdMinStock(10);
      setProdMaxStock(100);
      setProdAvgCost(0);
      setProdLastPrice(0);
      setProdDescription('');
      setProdProviders([]);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    if (editingProduct) {
      // Update
      const updated: Product = {
        ...editingProduct,
        name: prodName,
        categoryId: prodCategoryId,
        unitId: prodUnitId,
        minStock: Number(prodMinStock),
        maxStock: Number(prodMaxStock),
        averageCost: Number(prodAvgCost),
        lastPrice: Number(prodLastPrice),
        description: prodDescription,
        providerIds: prodProviders
      };
      onUpdateProduct(updated);
      setSelectedProduct(updated);
    } else {
      // Create
      const created: Product = {
        id: 'prod-' + Math.random().toString(36).substr(2, 9),
        name: prodName,
        categoryId: prodCategoryId,
        unitId: prodUnitId,
        currentStock: 0, // Crear con 0 de stock. Toda variación pasa por movimientos de inventario!
        minStock: Number(prodMinStock),
        maxStock: Number(prodMaxStock),
        averageCost: Number(prodAvgCost),
        lastPrice: Number(prodLastPrice),
        description: prodDescription,
        providerIds: prodProviders
      };
      onAddProduct(created);
    }
    setIsProductModalOpen(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    onAddCategory({
      id: 'cat-' + Math.random().toString(36).substr(2, 9),
      name: catName,
      description: catDesc
    });
    setCatName('');
    setCatDesc('');
    setIsCategoryModalOpen(false);
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim() || !unitName.trim()) return;
    onAddUnit({
      id: 'uni-' + Math.random().toString(36).substr(2, 9),
      code: unitCode.toLowerCase(),
      name: unitName
    });
    setUnitCode('');
    setUnitName('');
    setIsUnitModalOpen(false);
  };

  const handleApplyAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (adjQty === 0) {
      alert('La cantidad de ajuste no puede ser cero.');
      return;
    }
    if (!adjComment.trim()) {
      alert('Es obligatorio ingresar un comentario detallando el motivo del ajuste.');
      return;
    }

    onApplyAdjustment(
      selectedProduct.id,
      Number(adjQty),
      adjType,
      adjArea,
      adjReason,
      adjComment
    );

    // Refresh selectedProduct local state
    const freshlyAdjusted = products.find(p => p.id === selectedProduct.id);
    if (freshlyAdjusted) {
      // Note that the parent component updates the list, which updates this through props
      setTimeout(() => {
        const after = products.find(p => p.id === selectedProduct.id);
        if (after) setSelectedProduct(after);
      }, 50);
    }

    setAdjQty(0);
    setAdjComment('');
    setIsAdjustmentModalOpen(false);
  };

  const toggleProviderAssociation = (provId: string) => {
    if (prodProviders.includes(provId)) {
      setProdProviders(prodProviders.filter(id => id !== provId));
    } else {
      setProdProviders([...prodProviders, provId]);
    }
  };

  return (
    <div className="space-y-6" id="inventory-view">
      {/* Tab Navigation header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div className="flex items-center gap-6">
          <button
            onClick={() => { setSubTab('products'); setPage(1); }}
            className={`font-display font-bold text-xl pb-1 px-1 transition relative ${
              subTab === 'products' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-inv-products"
          >
            Suministros e Ingredientes {subTab === 'products' && <span className="absolute bottom-[-21px] left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
          </button>
          <button
            onClick={() => setSubTab('categories')}
            className={`font-display font-medium text-lg pb-1 px-1 transition relative ${
              subTab === 'categories' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-inv-categories"
          >
            Categorías {subTab === 'categories' && <span className="absolute bottom-[-21px] left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
          </button>
          <button
            onClick={() => setSubTab('units')}
            className={`font-display font-medium text-lg pb-1 px-1 transition relative ${
              subTab === 'units' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-inv-units"
          >
            Unidades de Medida {subTab === 'units' && <span className="absolute bottom-[-21px] left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
          </button>
        </div>

        {/* Action Button depending on subtab */}
        {subTab === 'products' ? (
          <button
            onClick={() => handleOpenProductModal(null)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-sans font-bold transition shadow-md shadow-emerald-50"
            id="btn-add-product"
          >
            <Plus className="w-4.5 h-4.5" />
            Nuevo Producto
          </button>
        ) : subTab === 'categories' ? (
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-sans font-bold transition shadow-md shadow-emerald-50"
            id="btn-add-category"
          >
            <Plus className="w-4.5 h-4.5" />
            Nueva Categoría
          </button>
        ) : (
          <button
            onClick={() => setIsUnitModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-sans font-bold transition shadow-md shadow-emerald-50"
            id="btn-add-unit"
          >
            <Plus className="w-4.5 h-4.5" />
            Nueva Unidad
          </button>
        )}
      </div>

      {/* RENDER PRODUCTS CATALOG TAB */}
      {subTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Products List & Search Filters (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search + Filter controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
              {/* Search textbox */}
              <div className="flex-1 relative">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Buscar por ingrediente, corte o descripción..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                  id="input-inv-search"
                />
              </div>

              {/* Category filter dropdown */}
              <div className="w-full sm:w-48 relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-emerald-600 transition appearance-none"
                  id="select-inv-cat-filter"
                >
                  <option value="all">Todas las Categorías</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Filter className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none top-3.5" />
              </div>

              {/* Stock status filter dropdown */}
              <div className="w-full sm:w-44 relative">
                <select
                  value={selectedStockStatus}
                  onChange={(e) => { setSelectedStockStatus(e.target.value as any); setPage(1); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:bg-white focus:border-emerald-600 transition appearance-none"
                  id="select-inv-stock-filter"
                >
                  <option value="all">Todo el Stock</option>
                  <option value="low">Suministros Bajos</option>
                  <option value="out">Sin Existencia</option>
                </select>
                <BadgeAlert className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none top-3.5" />
              </div>
            </div>

            {/* Products grid list cards */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Producto</th>
                      <th className="p-4">Categoría</th>
                      <th className="p-4 text-center">Unidad</th>
                      <th className="p-4 text-right">Existencia Física</th>
                      <th className="p-4 text-right">Costo Promedio</th>
                      <th className="p-4 text-center">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100" id="inv-products-table-body">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                          No se encontraron alimentos correspondientes a la consulta...
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((p) => {
                        const isOutOfStock = p.currentStock <= 0;
                        const isUnderMin = p.currentStock > 0 && p.currentStock <= p.minStock;
                        const cat = categories.find(c => c.id === p.categoryId);
                        const uni = units.find(u => u.id === p.unitId);

                        return (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className={`cursor-pointer transition duration-150 ${
                              selectedProduct?.id === p.id
                                ? 'bg-emerald-50/50 hover:bg-emerald-50'
                                : 'hover:bg-slate-50/50'
                            }`}
                          >
                            {/* Product Info */}
                            <td className="p-4">
                              <div className="font-sans font-bold text-slate-800 text-sm leading-tight">{p.name}</div>
                              <div className="text-[10px] text-slate-400 font-sans tracking-wide truncate max-w-[200px] mt-0.5">{p.description}</div>
                            </td>

                            {/* Category */}
                            <td className="p-4 text-slate-600 font-semibold">{cat ? cat.name : 'N/A'}</td>

                            {/* Unit */}
                            <td className="p-4 text-center text-slate-500 font-mono font-medium">{uni ? uni.code : 'und'}</td>

                            {/* Current Stock */}
                            <td className="p-4 text-right font-mono font-bold">
                              <span className={isOutOfStock ? 'text-red-600' : isUnderMin ? 'text-amber-600' : 'text-slate-800'}>
                                {p.currentStock.toLocaleString('es-DO', { minimumFractionDigits: 1 })}
                              </span>
                            </td>

                            {/* Average cost */}
                            <td className="p-4 text-right font-mono font-semibold text-slate-600">
                              ${p.averageCost.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Status label badge */}
                            <td className="p-4 text-center">
                              {isOutOfStock ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-200">
                                  Sin Stock
                                </span>
                              ) : isUnderMin ? (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                  Bajo Mínimo
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Estable
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs text-slate-600">
                  <span>Página {page} de {totalPages}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 px-3 bg-white border border-slate-200 rounded hover:bg-slate-50 transition disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1 px-3 bg-white border border-slate-200 rounded hover:bg-slate-50 transition disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Detail Sidebar Drawer inside view (4 cols) */}
          <div className="lg:col-span-4">
            {selectedProduct ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sticky top-[95px] space-y-6" id="inventory-detail-card">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold font-sans uppercase text-emerald-600 tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                      Ficha de Producto
                    </span>
                    <h3 className="font-display font-extrabold text-xl text-slate-800 mt-2 leading-snug">
                      {selectedProduct.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* KPI stats detail */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Existencia</span>
                    <p className="text-xl font-mono font-bold mt-1 text-slate-800">
                      {selectedProduct.currentStock} <span className="text-xs text-slate-400">{units.find(u => u.id === selectedProduct.unitId)?.code || 'lb'}</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Costo Promedio</span>
                    <p className="text-xl font-mono font-bold mt-1 text-slate-800">
                      ${selectedProduct.averageCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Additional Details info list */}
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Descripción</h4>
                    <p className="text-slate-600 mt-1 leading-relaxed">{selectedProduct.description || 'Sin descripción detallada.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Mínimo Teórico</h4>
                      <p className="text-slate-700 font-semibold font-mono mt-0.5">{selectedProduct.minStock} {units.find(u => u.id === selectedProduct.unitId)?.code || 'lb'}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Máximo Teórico</h4>
                      <p className="text-slate-700 font-semibold font-mono mt-0.5">{selectedProduct.maxStock} {units.find(u => u.id === selectedProduct.unitId)?.code || 'lb'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Último Costo de Factura</h4>
                    <p className="text-slate-700 font-bold font-mono text-sm mt-0.5">${selectedProduct.lastPrice.toFixed(2)}</p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">Proveedores Registrados</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.providerIds.length === 0 ? (
                        <span className="text-slate-400 italic">No tiene proveedores asociados.</span>
                      ) : (
                        selectedProduct.providerIds.map(id => {
                          const prov = providers.find(p => p.id === id);
                          return (
                            <span key={id} className="py-1 px-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 bg-slate-50">
                              {prov ? prov.name : 'N/A'}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Operational actions */}
                <div className="pt-4 border-t border-slate-100 flex gap-2.5">
                  <button
                    onClick={() => handleOpenProductModal(selectedProduct)}
                    disabled={!canEdit}
                    className="flex-1 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1 group disabled:opacity-40"
                    id="btn-edit-selected-product"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    Editar Catálogo
                  </button>

                  <button
                    onClick={() => {
                      if (!canAdjust) {
                        alert('Tu rol actual (' + currentUserRole + ') no cuenta con permisos para registrar ajustes manuales.');
                        return;
                      }
                      setAdjQty(0);
                      setAdjComment('');
                      setIsAdjustmentModalOpen(true);
                    }}
                    disabled={!canAdjust}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 shadow-md shadow-amber-50 disabled:opacity-40"
                    id="btn-adjust-selected-product"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Ajuste Manual
                  </button>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/55 text-[10px] text-emerald-800 leading-relaxed font-sans">
                  <strong>Regla de negocio:</strong> De acuerdo a políticas de auditoría interna, las modificaciones directas de inventario están deshabilitadas. Todo cambio de existencia genera su registro en el kárdex operacional de movimientos.
                </div>
              </div>
            ) : (
              <div className="bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center h-48 sticky top-[95px]">
                <Compass className="w-10 h-10 text-slate-400 mb-2" />
                <p className="font-semibold text-slate-600">Ficha de Información de Stock</p>
                <p className="text-slate-400 mt-1 max-w-[200px]">Haz clic en cualquier renglón del listado de inventario para ver detalles y auditoría.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER CATEGORIES TAB */}
      {subTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">Categorías de Suministros</h3>
              <p className="text-slate-400 text-xs font-sans mt-0.5">Clasificación lógica para reportes de costo y órdenes.</p>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
              id="btn-add-category-tab"
            >
              Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(c => {
              const prodQty = products.filter(p => p.categoryId === c.id).length;
              return (
                <div key={c.id} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition">
                  <h4 className="font-sans font-bold text-slate-800 text-base flex items-center gap-2">
                    <Tags className="w-4 h-4 text-emerald-600" />
                    {c.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 h-8">{c.description || 'Sin descripción registrada.'}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Fórmula ID: <strong className="font-mono text-[9px]">{c.id}</strong></span>
                    <span className="font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{prodQty} productos</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER UNITS TAB */}
      {subTab === 'units' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-800">Unidades de Medida</h3>
              <p className="text-slate-400 text-xs font-sans mt-0.5">Estandarización formal de compras y conteos.</p>
            </div>
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition"
              id="btn-add-unit-tab"
            >
              Nueva Unidad
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {units.map(u => {
              const prodQty = products.filter(p => p.unitId === u.id).length;
              return (
                <div key={u.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 text-center flex flex-col justify-between">
                  <div>
                    <span className="inline-block w-10 h-10 bg-emerald-50 text-emerald-700 font-bold font-mono text-sm leading-10 rounded-full mb-3">
                      {u.code}
                    </span>
                    <h4 className="font-sans font-bold text-slate-800 text-sm">{u.name}</h4>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                    Utilizada por: <strong className="font-sans text-slate-600">{prodQty} productos</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-product">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-lg text-slate-800">
                {editingProduct ? 'Editar Producto / Ficha de Suministro' : 'Agregar Nuevo Producto al Catálogo'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Nombre Comercial del Suministro *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ej. Pechuga de Pollo Fresca, Tomate Saladet..."
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Categoría Operativa</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Measurement Unit */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Unidad de Gestión</label>
                  <select
                    value={prodUnitId}
                    onChange={(e) => setProdUnitId(e.target.value)}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>

                {/* Minimum stock */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Stock Mínimo Sólido (Alerta)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(Number(e.target.value))}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono"
                  />
                  <p className="text-[9px] text-slate-400 mt-0.5">Disparador de alertas críticas en dashboard.</p>
                </div>

                {/* Maximum stock */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Capacidad Máxima Almacén</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={prodMaxStock}
                    onChange={(e) => setProdMaxStock(Number(e.target.value))}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono"
                  />
                </div>

                {/* Cost values */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Costo Promedio Inicial (RD$) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={prodAvgCost}
                    onChange={(e) => setProdAvgCost(Number(e.target.value))}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Último Precio Compra (Factura)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={prodLastPrice}
                    onChange={(e) => setProdLastPrice(Number(e.target.value))}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Descripción de Formato o Mermas frecuentes</label>
                  <textarea
                    rows={2}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Ej. Paquete al vacío, merma promedio de 8% en descongelación, etc..."
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-3 outline-none"
                  />
                </div>

                {/* Providers Association */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1.5">Asociar Proveedor(es) Autorizado(s)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-150 p-2.5 rounded-lg bg-slate-50/50">
                    {providers.map(prov => {
                      const isSelected = prodProviders.includes(prov.id);
                      return (
                        <div
                          key={prov.id}
                          onClick={() => toggleProviderAssociation(prov.id)}
                          className={`p-2 border rounded-lg flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate max-w-[190px]">{prov.name}</span>
                          <span className="text-[8px] font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                            {isSelected ? 'SI' : 'NO'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-150 pt-5 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">Todo el registro es auditado bajo ley fiscal y de operación.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 border border-slate-250 hover:bg-slate-150 font-bold rounded-lg"
                  >
                    Calcelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ADJUSTMENT */}
      {isAdjustmentModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-adjustment">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800">Ajuste Manual e Ingreso de Movimiento</h3>
                <p className="text-[10px] text-slate-400 font-sans tracking-wide">Para: {selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustmentSubmit} className="p-5 space-y-4 font-sans text-xs">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-[11px] text-emerald-800">
                <span className="font-bold">Existencia actual en sistema:</span> {selectedProduct.currentStock} {units.find(u => u.id === selectedProduct.unitId)?.code || 'lb'}
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Adjustment Quantity (positive or negative) */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Cantidad de Variación *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Usa valores negativos (-) para salidas o pérdidas"
                    value={adjQty === 0 ? '' : adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value))}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono text-slate-800"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Escribe <strong className="text-red-600">-5</strong> para dar salida a 5 unidades; escribe <strong className="text-emerald-700">10</strong> para ingresar 10.</p>
                </div>

                {/* Type of movement */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Tipo de Movimiento</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="Ajuste">Ajuste de inventario</option>
                    <option value="Entrada">Entrada (Donación / Carga manual)</option>
                    <option value="Salida">Salida (Consumo no registrado)</option>
                    <option value="Merma">Merma o Desperdicio por Cocina</option>
                    <option value="Devolución">Devolución a Proveedor</option>
                  </select>
                </div>

                {/* Target area */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Área o Bodega de Origen/Destino</label>
                  <select
                    value={adjArea}
                    onChange={(e) => setAdjArea(e.target.value as any)}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="Almacén seco">Almacén seco</option>
                    <option value="Cocina">Cocina principal</option>
                    <option value="Bar">Barra de bebidas</option>
                    <option value="Refrigerados">Bodega refrigerados</option>
                    <option value="Congelados">Cámara congeladora</option>
                    <option value="Limpieza">Almacén productos de limpieza</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Quick reason */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Clasificación de Motivo</label>
                  <input
                    type="text"
                    required
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    placeholder="Ej. Diferencia menor detectada, Derrame accidental..."
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  />
                </div>

                {/* Detailed Comment (Mandatory) */}
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Comentario Explicativo Obligatorio *</label>
                  <textarea
                    required
                    rows={2}
                    value={adjComment}
                    onChange={(e) => setAdjComment(e.target.value)}
                    placeholder="Explica a auditoría por qué se está realizando este ajuste manual..."
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-3 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-100 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition"
                >
                  Confirmar e Ingresar Kárdex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CATEGORY */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-category">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-sm text-slate-800">Nueva Categoría de Alimentos</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-4 space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre Comercial de la Categoría *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ej. Panadería, Lácteos SELECTOS"
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Descripción Breve o Tipo Coste</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Descripción de control interno para almaceneras..."
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg p-2.5 outline-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Añadir categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE UNIT OF MEASURE */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-unit">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-sm text-slate-800">Nueva Unidad de Medida</h3>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUnit} className="p-4 space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Código de Unidad *</label>
                <input
                  type="text"
                  required
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value)}
                  placeholder="Ej. lb, l, pz, gal, pack"
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Ej. Kilogramos, Galones de Limpieza"
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none"
                />
              </div>
              <div className="pt-3 border-t border-slate-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg font-bold"
                >
                  Añadir unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
