import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Settings,
  Scale,
  Package,
  FileText,
  DollarSign,
  AlertCircle,
  X
} from 'lucide-react';
import { Product, Category, Unit, Provider, Role } from '../../types';

interface ProductosTabProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  providers: Provider[];
  currentUserRole: Role;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
}

export default function ProductosTab({
  products,
  categories,
  units,
  providers,
  currentUserRole,
  onAddProduct,
  onUpdateProduct
}: ProductosTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal open states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New/Edit form state
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodUnitId, setProdUnitId] = useState('');
  const [prodMinStock, setProdMinStock] = useState<number>(10);
  const [prodMaxStock, setProdMaxStock] = useState<number>(100);
  const [prodAvgCost, setProdAvgCost] = useState<number>(0);
  const [prodDescription, setProdDescription] = useState('');
  const [prodProviders, setProdProviders] = useState<string[]>([]);
  const [prodArea, setProdArea] = useState<string>('Cocina');
  const [reqPortions, setReqPortions] = useState<boolean>(false);

  const canEdit = ['ADMIN', 'GERENTE', 'COMPRAS'].includes(currentUserRole);

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || 'Sin Categoría';
  };

  const getUnitCode = (unitId: string) => {
    return units.find(u => u.id === unitId)?.code || 'und';
  };

  const getProviderNames = (ids: string[]) => {
    if (!ids || ids.length === 0) return 'Ninguno';
    return ids.map(id => providers.find(p => p.id === id)?.name || '').filter(Boolean).join(', ');
  };

  const handleOpenProductModal = (prod: Product | null = null) => {
    if (!canEdit) {
      alert('Tu rol (' + currentUserRole + ') no posee permisos de edición de catálogo.');
      return;
    }

    if (prod) {
      setEditingProduct(prod);
      setProdName(prod.name);
      setProdSku((prod as any).sku || '');
      setProdCategoryId(prod.categoryId || (categories[0]?.id || ''));
      setProdUnitId(prod.unitId || (units[0]?.id || ''));
      setProdMinStock(prod.minStock);
      setProdMaxStock(prod.maxStock);
      setProdAvgCost(prod.averageCost);
      setProdDescription(prod.description || '');
      setProdProviders(prod.providerIds || []);
      setProdArea((prod as any).area_almacen || 'Cocina');
      setReqPortions(prod.portionsAvailable !== undefined);
    } else {
      setEditingProduct(null);
      setProdName('');
      setProdSku('');
      setProdCategoryId(categories[0]?.id || '');
      setProdUnitId(units[0]?.id || '');
      setProdMinStock(10);
      setProdMaxStock(100);
      setProdAvgCost(0);
      setProdDescription('');
      setProdProviders([]);
      setProdArea('Cocina');
      setReqPortions(false);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert('Se requiere un nombre de producto válido.');
      return;
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : 'prod-' + Math.random().toString(36).substr(2, 9),
      name: prodName,
      categoryId: prodCategoryId,
      unitId: prodUnitId,
      currentStock: editingProduct ? editingProduct.currentStock : 0,
      minStock: Number(prodMinStock),
      maxStock: Number(prodMaxStock),
      averageCost: Number(prodAvgCost),
      lastPrice: editingProduct ? editingProduct.lastPrice : Number(prodAvgCost),
      description: prodDescription,
      providerIds: prodProviders
    };

    // Attach custom physical properties securely
    (payload as any).sku = prodSku;
    (payload as any).area_almacen = prodArea;

    if (reqPortions) {
      payload.portionsAvailable = editingProduct?.portionsAvailable ?? 0;
    }

    if (editingProduct) {
      onUpdateProduct(payload);
      alert('Producto actualizado en catálogo.');
    } else {
      onAddProduct(payload);
      alert('Nuevo insumo registrado con éxito en el catálogo de inventario.');
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const toggleProviderAssociation = (provId: string) => {
    setProdProviders(prev => {
      if (prev.includes(provId)) {
        return prev.filter(id => id !== provId);
      } else {
        return [...prev, provId];
      }
    });
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p as any).sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6" id="productos-tab">
      {/* FILTER BUTTONS ROW */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar en catálogo, descripción, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-orange-500 transition"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:bg-white transition"
          >
            <option value="all">📂 Filtrar Categorías (Todos)</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {canEdit && (
            <button
              onClick={() => handleOpenProductModal(null)}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center gap-1.5 shadow-sm"
              id="btn-add-product-catalog"
            >
              <Plus className="w-4 h-4" />
              Nuevo Insumo
            </button>
          )}
        </div>
      </div>

      {/* PRODUCTS LEDGER GRID */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="p-4">SKU / Código</th>
                <th className="p-4">Nombre del Insumo / Comercial</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Unidad de Medida</th>
                <th className="p-4 text-center">Configuración Stock</th>
                <th className="p-4 text-right">Costo Promedio</th>
                <th className="p-4">Proveedores Relacionados</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" id="productos-catalog-table-body">
              {filtered.map((p) => {
                const skuVal = (p as any).sku || 'N/A';
                return (
                  <tr key={p.id} className="hover:bg-slate-50/40 transition">
                    <td className="p-4 font-mono font-bold text-slate-600">{skuVal}</td>
                    <td className="p-4">
                      <div>
                        <strong className="text-slate-805 text-sm font-semibold">{p.name}</strong>
                        {p.portionsAvailable !== undefined && (
                          <span className="inline-flex ml-2 items-center px-1.5 py-0.2 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[9px] font-bold">
                            PORCIONABLE
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{p.description || 'Sin notas adicionales.'}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{getCategoryName(p.categoryId)}</td>
                    <td className="p-4 text-slate-500 font-mono font-semibold">{getUnitCode(p.unitId)}</td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                        Min {p.minStock} - Max {p.maxStock}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-700 font-bold">
                      RD${p.averageCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-slate-500 font-sans max-w-[150px] truncate">
                      {getProviderNames(p.providerIds)}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenProductModal(p)}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 rounded-lg text-slate-600 transition inline-flex items-center gap-1 font-bold text-[10px]"
                        title="Modificar ficha"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CATALOG CREATION / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-product-catalog">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden text-xs">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-base text-slate-800">
                {editingProduct ? 'Modificar Ficha Insumo' : 'Dar de Alta Insumo de Cocina'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Nombre Comercial del Insumo *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ej. Pechuga de Pollo"
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    placeholder="Ej. POL-001"
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-mono focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Categoría General *</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Unidad de Almacenamiento *</label>
                  <select
                    value={prodUnitId}
                    onChange={(e) => setProdUnitId(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Stock Mínimo *</label>
                  <input
                    type="number"
                    required
                    value={prodMinStock}
                    onChange={(e) => setProdMinStock(Number(e.target.value))}
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Stock Máximo *</label>
                  <input
                    type="number"
                    required
                    value={prodMaxStock}
                    onChange={(e) => setProdMaxStock(Number(e.target.value))}
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Costo Base Promedio (RD$) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={prodAvgCost}
                    onChange={(e) => setProdAvgCost(Number(e.target.value))}
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-mono focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Ubicación Física *</label>
                  <select
                    value={prodArea}
                    onChange={(e) => setProdArea(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 outline-none text-slate-800 font-semibold focus:bg-white"
                  >
                    <option value="Cocina">Cocina principal</option>
                    <option value="Bar">Barra / Bebidas</option>
                    <option value="Almacén seco">Almacén seco</option>
                    <option value="Refrigerados">Cámara refrigerados</option>
                    <option value="Congelados">Cámara congeladores</option>
                    <option value="Limpieza">Bodega Limpieza</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="chk-portions"
                    type="checkbox"
                    checked={reqPortions}
                    onChange={(e) => setReqPortions(e.target.checked)}
                    className="w-4.5 h-4.5 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="chk-portions" className="text-slate-700 font-bold uppercase text-[9.5px] cursor-pointer">
                    Habilitar Porcionamiento de Cocina
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1 font-mono">Asociar Proveedores Autorizados (Cuentas activas)</label>
                <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 bg-slate-50/50">
                  {providers.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`prov-${p.id}`}
                        checked={prodProviders.includes(p.id)}
                        onChange={() => toggleProviderAssociation(p.id)}
                        className="w-3.5 h-3.5 text-orange-500 border-slate-300 rounded"
                      />
                      <label htmlFor={`prov-${p.id}`} className="text-slate-600 font-medium cursor-pointer truncate max-w-xs">
                        {p.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Observaciones / Notas Técnicas</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Detalles sobre rendimiento, alérgenos, marcas aprobadas..."
                  className="w-full bg-slate-55 border border-slate-200 rounded-lg p-3 outline-none text-slate-800 focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-750 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Ficha Técnica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
