import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Coins,
  Percent,
  Layers,
  Package,
  RefreshCw,
  Play,
  ArrowRight,
  Upload,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { Product, Unit, MenuItem, MenuRecipe, MenuRecipeIngredient, MenuItemAlias, Combo, Category } from '../types';

interface MenuAndRecipesViewProps {
  products: Product[];
  units: Unit[];
  currentUserRole: string;
  onRefreshInventory: () => void;
}

export default function MenuAndRecipesView({
  products,
  units,
  currentUserRole,
  onRefreshInventory
}: MenuAndRecipesViewProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'items' | 'combos' | 'sales' | 'mapping'>('items');

  // Core API State
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [unmatchedItems, setUnmatchedItems] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  // Loading indicator states
  const [loading, setLoading] = useState<boolean>(false);
  const [categoryLoading, setCategoryLoading] = useState<boolean>(false);

  // Filter States
  const [itemSearch, setItemSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Selected Active Recipe Editor State
  const [selectedItemForRecipe, setSelectedItemForRecipe] = useState<MenuItem | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<MenuRecipe | null>(null);
  const [ingredients, setIngredients] = useState<MenuRecipeIngredient[]>([]);
  const [recipeVersions, setRecipeVersions] = useState<MenuRecipe[]>([]);

  // Modal control states
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showComboModal, setShowComboModal] = useState<boolean>(false);
  const [showDirectSaleModal, setShowDirectSaleModal] = useState<boolean>(false);

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    salePrice: '0',
    deductsInventory: true,
    requiresRecipe: true,
    productionArea: 'Cocina',
    preparationTime: '15',
    notes: ''
  });

  // New Category Form
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // New Ingredient Input Form (Row creation inside Recipe Panel)
  const [newIngredientForm, setNewIngredientForm] = useState({
    productId: '',
    portionProductId: '',
    quantity: '1',
    unitId: '',
    wastePercentage: '5',
    deductionType: 'RAW_STOCK' as 'RAW_STOCK' | 'PORTIONS' | 'PREP_RECIPE',
    isOptional: false,
    notes: ''
  });

  // Batch Sales upload stats
  const [uploadStats, setUploadStats] = useState<{
    processed: number;
    unmapped: number;
    movements: number;
  } | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [csvFileName, setCsvFileName] = useState<string>('');

  // Mapping Input States
  const [activeMappingRawName, setActiveMappingRawName] = useState<string>('');
  const [mappingMenuItemId, setMappedMenuItemId] = useState<string>('');

  // Manual Direct Sale Form
  const [directSaleForm, setDirectSaleForm] = useState({
    menuItemId: '',
    quantity: '1',
    tableNo: 'Mesa 1',
    customerName: 'Cliente General'
  });

  // Combo Form
  const [newComboForm, setNewComboForm] = useState({
    code: '',
    name: '',
    salePrice: '0',
    isActive: true,
    description: '',
    items: [] as { menuItemId: string; qty: number }[]
  });
  const [comboItemInput, setComboItemInput] = useState({ menuItemId: '', qty: '1' });

  // Notifications feedback toast helper
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // On component Mount, fetch all tables
  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
    fetchCombos();
    fetchUnmatchedItems();
    fetchSalesHistory();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);
      const res = await fetch('/api/v1/menu/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/menu/items');
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    try {
      const res = await fetch('/api/v1/menu/combos');
      const data = await res.json();
      if (data.success) {
        setCombos(data.combos);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnmatchedItems = async () => {
    try {
      const res = await fetch('/api/v1/sales/unmatched-items');
      const data = await res.json();
      if (data.success) {
        setUnmatchedItems(data.unmatchedItems);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalesHistory = async () => {
    try {
      const res = await fetch('/api/v1/menu/items'); // Load sales through standard list
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch recipe for specific selection
  const selectItemForRecipeEdit = async (item: MenuItem) => {
    setSelectedItemForRecipe(item);
    try {
      const res = await fetch(`/api/v1/menu/items/${item.id}/recipe`);
      const data = await res.json();
      if (data.success) {
        setActiveRecipe(data.activeRecipe);
        setIngredients(data.ingredients || []);
        if (data.versions) {
          setRecipeVersions(data.versions);
        }
      } else {
        setActiveRecipe(null);
        setIngredients([]);
        setRecipeVersions([]);
      }
    } catch (err) {
      showToast('error', 'Error cargando receta operacional');
    }
  };

  // Submit Menu Item
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.code || !newItemForm.name || !newItemForm.categoryId) {
      showToast('error', 'Por favor llena los campos requeridos');
      return;
    }
    try {
      const payload = {
        code: newItemForm.code,
        name: newItemForm.name,
        categoryId: newItemForm.categoryId,
        salePrice: parseFloat(newItemForm.salePrice) || 0,
        deductsInventory: newItemForm.deductsInventory,
        requiresRecipe: newItemForm.requiresRecipe,
        productionArea: newItemForm.productionArea,
        preparationTime: parseInt(newItemForm.preparationTime) || 15,
        notes: newItemForm.notes
      };

      const res = await fetch('/api/v1/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Se creó el plato "${payload.name}" exitosamente.`);
        setShowItemModal(false);
        fetchMenuItems();
        // Reset form
        setNewItemForm({
          code: '',
          name: '',
          categoryId: '',
          salePrice: '0',
          deductsInventory: true,
          requiresRecipe: true,
          productionArea: 'Cocina',
          preparationTime: '15',
          notes: ''
        });
      } else {
        showToast('error', data.error || 'No se pudo guardar el plato.');
      }
    } catch (err) {
      showToast('error', 'Fallo de red al crear plato');
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      const res = await fetch('/api/v1/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Categoría "${newCategoryName}" registrada.`);
        setNewCategoryName('');
        setNewCategoryDesc('');
        setShowCategoryModal(false);
        fetchCategories();
      } else {
        showToast('error', data.error || 'No se pudo crear la categoría');
      }
    } catch (err) {
      showToast('error', 'Fallo de red al crear categoría');
    }
  };

  // Recipe Creation Version
  const handleAddNewVersionRecipe = async () => {
    if (!selectedItemForRecipe) return;
    try {
      const res = await fetch(`/api/v1/menu/items/${selectedItemForRecipe.id}/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: `v${recipeVersions.length + 1}`,
          theoreticalCost: 0,
          foodCostPercentage: 0
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Creada versión ${data.recipe.version} de la ficha técnica.`);
        selectItemForRecipeEdit(selectedItemForRecipe);
        onRefreshInventory();
      } else {
        showToast('error', data.error || 'Error al versionar la receta');
      }
    } catch (err) {
      showToast('error', 'Fallo de red al crear la versión');
    }
  };

  // Add Recipe Ingredient
  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRecipe || !activeRecipe) {
      showToast('error', 'Debes tener una receta activa seleccionada.');
      return;
    }
    const isPortion = newIngredientForm.deductionType === 'PORTIONS';
    const targetRefId = isPortion ? newIngredientForm.portionProductId : newIngredientForm.productId;

    if (!targetRefId) {
      showToast('error', 'Selecciona el ingrediente físico o de porción.');
      return;
    }

    try {
      const payload = {
        productId: isPortion ? null : newIngredientForm.productId,
        portionProductId: isPortion ? newIngredientForm.portionProductId : null,
        quantity: parseFloat(newIngredientForm.quantity) || 0,
        unitId: newIngredientForm.unitId,
        wastePercentage: parseFloat(newIngredientForm.wastePercentage) || 0,
        deductionType: newIngredientForm.deductionType,
        isOptional: newIngredientForm.isOptional,
        notes: newIngredientForm.notes
      };

      const res = await fetch(`/api/v1/menu/items/${selectedItemForRecipe.id}/recipe/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: activeRecipe.id,
          ...payload
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Ingrediente agregado a la ficha técnica.');
        // Refresh local display arrays
        selectItemForRecipeEdit(selectedItemForRecipe);
        // Reset ingredient row input form
        setNewIngredientForm({
          productId: '',
          portionProductId: '',
          quantity: '1',
          unitId: '',
          wastePercentage: '0',
          deductionType: 'RAW_STOCK',
          isOptional: false,
          notes: ''
        });
        fetchMenuItems(); // Refresh aggregate cost stats
        onRefreshInventory();
      } else {
        showToast('error', data.error || 'No se pudo guardar el ingrediente.');
      }
    } catch (err) {
      showToast('error', 'Fallo de red al agregar ingrediente.');
    }
  };

  // Delete Recipe Ingredient
  const handleDeleteIngredient = async (ingredientId: string) => {
    if (!selectedItemForRecipe || !activeRecipe) return;
    if (!confirm('¿Seguro que deseas remover este ingrediente de la ficha técnica?')) return;

    try {
      const res = await fetch(`/api/v1/menu/items/${selectedItemForRecipe.id}/recipe/ingredients`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientId, recipeId: activeRecipe.id })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Ingrediente eliminado.');
        selectItemForRecipeEdit(selectedItemForRecipe);
        fetchMenuItems();
        onRefreshInventory();
      } else {
        showToast('error', data.error || 'Error al remover');
      }
    } catch (err) {
      showToast('error', 'Error de conexión');
    }
  };

  // Toggle MenuItem status (Active / Inactive)
  const toggleMenuItemActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/menu/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Plato ${!currentStatus ? 'activado' : 'desactivado'}.`);
        fetchMenuItems();
      }
    } catch (err) {
      showToast('error', 'Fallo de red al alternar estado');
    }
  };

  // Parse list of portions
  const portionsList = products.filter(p => p.portionsAvailable !== undefined);

  // Manual Direct Sale Calculation (Simulate selling an item and checking theoretical deductions in real time)
  const handleProcessDirectSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directSaleForm.menuItemId || !directSaleForm.quantity) {
      showToast('error', 'Faltan parámetros requeridos');
      return;
    }
    const item = menuItems.find(m => m.id === directSaleForm.menuItemId);
    if (!item) return;

    try {
      const res = await fetch('/api/v1/sales/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleItemName: item.name,
          qtySold: parseInt(directSaleForm.quantity) || 1,
          date: new Date().toISOString().split('T')[0],
          reference: `Venta Directa POS (${directSaleForm.tableNo})`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Venta de ${directSaleForm.quantity} x "${item.name}" registrada con éxito.`);
        setShowDirectSaleModal(false);
        onRefreshInventory(); // Refresh stock metrics in Sidebar/App
        fetchMenuItems(); // Refresh price indicators
      } else {
        showToast('error', data.error || 'No se pudo procesar la venta.');
      }
    } catch (err) {
      showToast('error', 'Fallo de red al registrar venta');
    }
  };

  // CSV Excel Sales Processing Simulation
  const handleProcessCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawCsvText.trim()) {
      showToast('error', 'El cuadro de CSV está vacío.');
      return;
    }

    try {
      // Send raw lines to backend
      const res = await fetch('/api/v1/sales/import-and-deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: csvFileName || 'pos_import.csv',
          rawCsv: rawCsvText
        })
      });
      const data = await res.json();
      if (data.success) {
        setUploadStats({
          processed: data.summary.processedCount || 0,
          unmapped: data.summary.unmappedCount || 0,
          movements: data.summary.deductedMovementsCount || 0
        });
        showToast('success', `Carga operada: ${data.summary.processedCount} procesados, ${data.summary.unmappedCount} pendientes de mapeo.`);
        fetchUnmatchedItems();
        onRefreshInventory();
      } else {
        showToast('error', data.error || 'Fallo al procesar CSV');
      }
    } catch (err) {
      showToast('error', 'Error al transmitir archivo de importación.');
    }
  };

  // Save Name Mapping (Mapeador de Equivalencias)
  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMappingRawName || !mappingMenuItemId) {
      showToast('error', 'Selecciona el plato equivalente.');
      return;
    }

    try {
      const res = await fetch('/api/v1/sales/map-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawSalesName: activeMappingRawName,
          menuItemId: mappingMenuItemId
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Mapeo grabado. Se corrigieron ${data.correctedCount} transacciones pasadas y se dedujeron sus ingredientes.`);
        setActiveMappingRawName('');
        setMappedMenuItemId('');
        fetchUnmatchedItems();
        onRefreshInventory();
      } else {
        showToast('error', data.error || 'No se guardó el mapeo.');
      }
    } catch (err) {
      showToast('error', 'Fallo de comunicación en mapeo');
    }
  };

  // Combos compound handlers
  const handleAddComboItem = () => {
    if (!comboItemInput.menuItemId || !comboItemInput.qty) return;
    const item = menuItems.find(m => m.id === comboItemInput.menuItemId);
    if (!item) return;

    const exists = newComboForm.items.some(i => i.menuItemId === item.id);
    if (exists) {
      setNewComboForm({
        ...newComboForm,
        items: newComboForm.items.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + parseInt(comboItemInput.qty) } : i)
      });
    } else {
      setNewComboForm({
        ...newComboForm,
        items: [...newComboForm.items, { menuItemId: item.id, qty: parseInt(comboItemInput.qty) }]
      });
    }
    setComboItemInput({ menuItemId: '', qty: '1' });
  };

  const handleCreateComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComboForm.code || !newComboForm.name || newComboForm.items.length === 0) {
      showToast('error', 'Llene el código, nombre y añada al menos un plato.');
      return;
    }

    try {
      const res = await fetch('/api/v1/menu/combos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newComboForm.code,
          name: newComboForm.name,
          salePrice: parseFloat(newComboForm.salePrice) || 0,
          isActive: newComboForm.isActive,
          description: newComboForm.description,
          items: newComboForm.items
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Combo "${newComboForm.name}" habilitado para venta.`);
        setShowComboModal(false);
        setNewComboForm({
          code: '',
          name: '',
          salePrice: '0',
          isActive: true,
          description: '',
          items: []
        });
        fetchCombos();
      } else {
        showToast('error', data.error || 'Error al guardar el Combo');
      }
    } catch (err) {
      showToast('error', 'Fallo de red al crear Combo');
    }
  };

  // Helper calculation metrics: Cost of item recipe
  const getDeductionTypeText = (type: string) => {
    switch (type) {
      case 'RAW_STOCK': return 'Inventario Crudo';
      case 'PORTIONS': return 'Porción Operativa';
      case 'PREP_RECIPE': return 'Sub-receta Pre-elaborada';
      default: return 'Frecuente';
    }
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase()) || item.code.toLowerCase().includes(itemSearch.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'ALL' || item.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Alert Feedback */}
      {toast && (
        <div className={`fixed right-6 top-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl border animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-55 border-emerald-250 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-55 border-rose-250 text-rose-800' :
          'bg-blue-55 border-blue-250 text-blue-800'
        }`} id="toast-notif">
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-650" /> : <CheckCircle className="w-5 h-5 text-emerald-650" />}
          <span className="font-semibold text-xs tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Hero Header Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm" id="menu-hero-header">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 bg-orange-100 rounded-xl text-orange-600">🍴</span>
            Fichas Técnicas y Recetas Operativas
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-xl">
            Cargue su menu comercial y asocie platos con recetas para descontar insumos o porciones operativas.
            Calcule costos matemáticos teóricos en tiempo real.
          </p>
        </div>
        <div className="flex sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowDirectSaleModal(true)}
            className="flex-1 sm:flex-initial py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2"
            id="btn-direct-sale-quick"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            + Vender Plato
          </button>
          {currentUserRole !== 'LECTURA' && (
            <>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                id="btn-add-category"
              >
                + Categoría
              </button>
              <button
                onClick={() => setShowItemModal(true)}
                className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-orange-600/10"
                id="btn-add-menuitem-top"
              >
                + Nuevo Plato
              </button>
            </>
          )}
        </div>
      </div>

      {/* Module Hub Navigation Tabs */}
      <div className="flex border-b border-slate-200" id="menu-recipe-tabs">
        <button
          onClick={() => { setActiveTab('items'); setSelectedItemForRecipe(null); }}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'items' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab-plating-recipes"
        >
          🍴 Platos y Fichas Técnicas
          <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 rounded text-slate-500 font-sans">{menuItems.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('combos'); setSelectedItemForRecipe(null); }}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'combos' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab-combos-pack"
        >
          📦 Combos de Menú
          <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 rounded text-slate-500 font-sans">{combos.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('sales'); setSelectedItemForRecipe(null); }}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'sales' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab-sales-connector"
        >
          ⚙️ Importador de Ventas CSV
        </button>
        <button
          onClick={() => { setActiveTab('mapping'); setSelectedItemForRecipe(null); }}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'mapping' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab-mapping-aliases"
        >
          🔗 Mapeador de Equivalencias POS
          {unmatchedItems.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-red-100 text-red-650 rounded font-bold animate-pulse">
              {unmatchedItems.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENTS - PLATINGS & RECIPES */}
      {activeTab === 'items' && !selectedItemForRecipe && (
        <div className="space-y-4">
          {/* Filtering Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between" id="recipe-search-toolbar">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar plato por nombre o código..."
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition"
                id="search-items-input"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="w-full sm:w-auto text-xs py-2 pl-3.5 pr-8 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                id="filter-category-select"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platos Grid Layout */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-slate-400 text-xs font-semibold">Cargando platos comerciales y fichas técnicas...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 flex flex-col items-center text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 text-xl font-bold mb-4">
                🔍
              </div>
              <h4 className="font-bold text-slate-900 text-sm">No se encontraron platos</h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Ningún artículo en el menú coincide con los filtros especificados. Registre un nuevo plato para configurarlo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="menu-items-grid">
              {filteredItems.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                // Calculate actual metrics status
                const cost = item.theoreticalCost || 0;
                const price = item.salePrice || 0;
                const margin = price - cost;
                const percentage = price > 0 ? Math.round((cost / price) * 100) : 0;
                const marginPercent = price > 0 ? 100 - percentage : 0;

                const hasLowMargin = marginPercent < 40 && price > 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-5 border shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                      item.isActive ? 'border-slate-100' : 'border-slate-205 bg-slate-50/50'
                    }`}
                    id={`menuitem-card-${item.id}`}
                  >
                    <div>
                      {/* Card Header information labels */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 tracking-wider">
                            {item.code}
                          </span>
                          <span className="ml-1.5 text-[10px] text-slate-400">
                            {category ? category.name : 'Sin Categoría'}
                          </span>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} title={item.isActive ? 'Activo' : 'De baja'} />
                      </div>

                      {/* Display title or description */}
                      <h3 className="font-bold text-slate-950 text-sm leading-tight mt-2.5">
                        {item.name}
                      </h3>
                      {item.notes && <p className="text-[11px] text-slate-400 mt-1 truncate">{item.notes}</p>}

                      {/* Recipe & Stock mapping status badge */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.8 rounded-lg text-[9px] bg-slate-50 text-slate-600 flex items-center gap-1">
                          ⏲️ {item.preparationTime} min
                        </span>
                        {item.requiresRecipe ? (
                          <span className={`px-2 py-0.8 rounded-lg text-[9px] flex items-center gap-1 ${cost > 0 ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'bg-amber-50 text-amber-600 font-semibold animate-pulse'}`}>
                            {cost > 0 ? '✅ Ficha Activa' : '⚠️ Sin Ficha Técnica'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.8 rounded-lg text-[9px] bg-slate-100 text-slate-600 font-semibold">
                            Inventario Directo
                          </span>
                        )}
                        {item.deductsInventory && (
                          <span className="px-1.5 py-0.8 rounded-lg text-[9px] bg-sky-50 text-sky-600 border border-sky-100">
                            Descuento Auto
                          </span>
                        )}
                      </div>

                      {/* Calculated Financial Performance Dashboard */}
                      {item.requiresRecipe && (
                        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 bg-slate-50/50 p-2.5 rounded-2xl">
                          <div className="text-center">
                            <span className="block text-[9px] text-slate-400 font-sans">Precio Venta</span>
                            <strong className="text-xs font-bold text-slate-800">RD$ {price.toLocaleString()}</strong>
                          </div>
                          <div className="text-center">
                            <span className="block text-[9px] text-slate-400 font-sans">Costo Teórico</span>
                            <strong className={`text-xs font-bold ${cost > price ? 'text-rose-600' : 'text-slate-800'}`}>
                              RD$ {cost.toLocaleString()}
                            </strong>
                          </div>
                          <div className="text-center">
                            <span className="block text-[9px] text-slate-400 font-sans">Margen %</span>
                            <strong className={`text-xs font-bold ${hasLowMargin ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {marginPercent}%
                            </strong>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer panel */}
                    <div className="mt-5 flex items-center gap-2">
                      {item.requiresRecipe && (
                        <button
                          onClick={() => selectItemForRecipeEdit(item)}
                          className="flex-1 py-1.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1"
                          id={`btn-view-recipe-${item.id}`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Ficha Técnica {cost === 0 && '✏️'}
                        </button>
                      )}
                      {currentUserRole !== 'LECTURA' && (
                        <button
                          onClick={() => toggleMenuItemActive(item.id, item.isActive)}
                          className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition border ${
                            item.isActive
                              ? 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-200'
                              : 'bg-emerald-55 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {item.isActive ? 'Inactivar' : 'Reactivar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DETAILED ACTIVE RECIPE EDITOR VIEW */}
      {activeTab === 'items' && selectedItemForRecipe && (
        <div className="space-y-6" id="technical-recipe-editor-panel">
          {/* Breadcrumb back list links */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedItemForRecipe(null)}
              className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold transition flex items-center gap-1.5"
              id="btn-back-menu-items"
            >
              ← Regresar al Menú
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Ficha técnica seleccionada:</span>
              <strong className="text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-sans uppercase">
                {selectedItemForRecipe.code} - {selectedItemForRecipe.name}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Versioning and Ingredient list column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recipe Version Control Header banner bar */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Versiones de la Receta</h3>
                    <p className="text-[11px] text-slate-400">Toda modificación genera auditorías y almacena versiones pasadas.</p>
                  </div>
                  {currentUserRole !== 'LECTURA' && (
                    <button
                      onClick={handleAddNewVersionRecipe}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs transition"
                    >
                      + Clonar a Nueva Versión
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {recipeVersions.length === 0 ? (
                    <span className="text-xs text-slate-400">Sin historial de versiones. Se aplicará versión actual por defecto.</span>
                  ) : (
                    recipeVersions.map((v, idx) => (
                      <span
                        key={v.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          activeRecipe?.id === v.id
                            ? 'bg-orange-55 border-orange-250 text-orange-700 font-semibold shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        Versión {v.version} {v.isActive && '🔵 (Activa)'}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Ingredient List Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm mb-4">Ingredientes & Consumos de Cocina</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600" id="table-recipe-ingredients">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                        <th className="py-2.5 px-3">Ingrediente Físico</th>
                        <th className="py-2.5 px-3">Tipo Descuento</th>
                        <th className="py-2.5 px-3 text-right">Cantidad Mandataria</th>
                        <th className="py-2.5 px-3 text-right">Merma %</th>
                        <th className="py-2.5 px-3 text-right">Costo Unitario</th>
                        <th className="py-2.5 px-3 text-right">Costo Total</th>
                        {currentUserRole !== 'LECTURA' && <th className="py-2.5 px-3 text-center">Acciones</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ingredients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                            No hay ingredientes cargados en esta versión de receta operativa. Agrega uno debajo para calcular costos.
                          </td>
                        </tr>
                      ) : (
                        ingredients.map(ing => {
                          // Find physical references to map descriptors
                          const rawProd = products.find(p => p.id === ing.productId);
                          const portProd = products.find(p => p.id === ing.portionProductId);

                          const targetName = ing.deductionType === 'PORTIONS' 
                            ? `${portProd?.name || 'Porción sin nombre'} (Unidad Porcionada)`
                            : `${rawProd?.name || 'Insumo sin nombre'} (Stock Crudo)`;

                          const u = units.find(unit => unit.id === ing.unitId);

                          return (
                            <tr key={ing.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-3 font-semibold text-slate-800">
                                {targetName}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium leading-relaxed ${
                                  ing.deductionType === 'PORTIONS' ? 'bg-purple-105 text-purple-700' : 'bg-blue-105 text-blue-700'
                                }`}>
                                  {getDeductionTypeText(ing.deductionType)}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold">
                                {ing.quantity} {u ? u.code : ''}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-500">
                                {ing.wastePercentage}%
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-600">
                                RD$ {ing.costUnit.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                                RD$ {ing.totalCost.toLocaleString()}
                              </td>
                              {currentUserRole !== 'LECTURA' && (
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => handleDeleteIngredient(ing.id)}
                                    className="p-1 text-slate-400 hover:text-red-650 transition rounded-lg hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Create Ingredient Form Row */}
                {currentUserRole !== 'LECTURA' && activeRecipe && (
                  <form onSubmit={handleAddIngredient} className="mt-8 pt-6 border-t border-slate-100 space-y-4" id="form-recipe-add-ingredient">
                    <h4 className="font-semibold text-slate-900 text-xs">Añadir Ingrediente a Receta</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Tipo de Ingrediente</label>
                        <select
                          value={newIngredientForm.deductionType}
                          onChange={e => setNewIngredientForm({
                            ...newIngredientForm,
                            deductionType: e.target.value as 'RAW_STOCK' | 'PORTIONS' | 'PREP_RECIPE',
                            productId: '',
                            portionProductId: ''
                          })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white"
                        >
                          <option value="RAW_STOCK">Materia Prima Directa (Crudo)</option>
                          <option value="PORTIONS">Porción de Obra (Cocina)</option>
                        </select>
                      </div>

                      {newIngredientForm.deductionType === 'RAW_STOCK' ? (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Item de Inventario Crudo</label>
                          <select
                            value={newIngredientForm.productId}
                            onChange={e => {
                              const prod = products.find(p => p.id === e.target.value);
                              setNewIngredientForm({
                                ...newIngredientForm,
                                productId: e.target.value,
                                unitId: prod ? prod.unitId : ''
                              });
                            }}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white"
                          >
                            <option value="">-- Selecciona Insumo --</option>
                            {products.filter(p => !p.portionsAvailable).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.currentStock} disponibles)</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Subproducto Porcionado</label>
                          <select
                            value={newIngredientForm.portionProductId}
                            onChange={e => {
                              const prod = products.find(p => p.id === e.target.value);
                              setNewIngredientForm({
                                ...newIngredientForm,
                                portionProductId: e.target.value,
                                unitId: prod ? prod.unitId : ''
                              });
                            }}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white font-semibold text-purple-750"
                          >
                            <option value="">-- Selecciona Porción --</option>
                            {portionsList.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.portionsAvailable} porciones disponibles @ RD$ {p.averageCost})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Cantidad Neta</label>
                          <input
                            type="number"
                            step="any"
                            value={newIngredientForm.quantity}
                            onChange={e => setNewIngredientForm({ ...newIngredientForm, quantity: e.target.value })}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white font-mono text-right"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">U.M</label>
                          <select
                            value={newIngredientForm.unitId}
                            onChange={e => setNewIngredientForm({ ...newIngredientForm, unitId: e.target.value })}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white"
                          >
                            <option value="">U.M</option>
                            {units.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Merma de Preparación %</label>
                        <input
                          type="number"
                          value={newIngredientForm.wastePercentage}
                          onChange={e => setNewIngredientForm({ ...newIngredientForm, wastePercentage: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white font-mono"
                          placeholder="e.g. 10 para 10%"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Observaciones</label>
                        <input
                          type="text"
                          value={newIngredientForm.notes}
                          onChange={e => setNewIngredientForm({ ...newIngredientForm, notes: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg outline-none bg-white"
                          placeholder="Instrucción de picado, marca recomendada..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="py-2 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                      >
                        Añadir Ingrediente
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Financial Analysis column summary */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] bg-white/10 text-orange-400 font-bold px-2.5 py-1 rounded-lg uppercase tracking-widest leading-loose">
                      Ficha Analítica
                    </span>
                    <h2 className="text-xl font-bold font-sans mt-3">{selectedItemForRecipe.name}</h2>
                    <p className="text-slate-400 text-xs mt-1">Cálculo en base a costos de materias primas directas operantes.</p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Price display row */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs text-slate-400 font-sans">Precio de Venta</span>
                      <strong className="text-lg font-bold text-white font-mono">RD$ {selectedItemForRecipe.salePrice.toLocaleString()}</strong>
                    </div>

                    {/* Cost of recipe row */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs text-slate-400 font-sans font-medium">Costo Teórico Receta</span>
                      <strong className="text-lg font-bold text-amber-400 font-mono">RD$ {(activeRecipe?.theoreticalCost || 0).toLocaleString()}</strong>
                    </div>

                    {/* Food cost percentage ratio display */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs text-slate-400 font-sans">Ratio de Costo (Food Cost %)</span>
                      <strong className={`text-lg font-bold font-mono ${
                        (activeRecipe?.foodCostPercentage || 0) > 40 ? 'text-red-400' : 'text-emerald-450'
                      }`}>
                        {activeRecipe?.foodCostPercentage || 0}%
                      </strong>
                    </div>

                    {/* Leftover margin row */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-sans">Margen Bruto</span>
                      <div className="text-right">
                        <strong className="block text-xl font-extrabold text-emerald-400 font-mono">
                          RD$ {(selectedItemForRecipe.salePrice - (activeRecipe?.theoreticalCost || 0)).toLocaleString()}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {activeRecipe ? (100 - activeRecipe.foodCostPercentage) : 0}% de rentabilidad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-slate-500 leading-normal">
                  💡 <strong>Recomendación:</strong> Se mantiene un ratio saludable de Costo si ronda de un 25% a 35%. Si tu porcentaje supera el 40%, renegocia costos de compra, porciona de manera estricta o aumenta el precio del plato.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENTS - COMBOS */}
      {activeTab === 'combos' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Administrador de Combos y Packs</h3>
              <p className="text-slate-500 text-xs mt-0.5">Configure combos conformados por múltiples artículos del menú. Las ventas del combo se propagarán para descontar ingredientes individuales.</p>
            </div>
            {currentUserRole !== 'LECTURA' && (
              <button
                onClick={() => setShowComboModal(true)}
                className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                + Nuevo Combo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 border border-slate-100 flex flex-col items-center text-center col-span-full max-w-lg mx-auto">
                <span className="text-3xl">📦</span>
                <h4 className="font-bold text-slate-950 text-sm mt-3">Sin Combos Registrados</h4>
                <p className="text-slate-500 text-xs mt-1">Cree combos para agrupar platillos complementarios y simplificar las cargas del POS.</p>
              </div>
            ) : (
              combos.map(combo => (
                <div key={combo.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-150 text-slate-700 uppercase tracking-wider">{combo.code}</span>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight mt-1.5">{combo.name}</h4>
                    </div>
                    <span className="text-sm font-bold text-orange-600 font-mono">RD$ {combo.salePrice.toLocaleString()}</span>
                  </div>

                  {combo.description && <p className="text-xs text-slate-400 mt-1">{combo.description}</p>}

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Platos Incluidos:</span>
                    <ul className="space-y-1.5">
                      {combo.items && combo.items.map((ci, idx) => {
                        const item = menuItems.find(m => m.id === ci.menuItemId);
                        return (
                          <li key={idx} className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                            <span className="font-medium">{item ? item.name : 'Plato Desconocido'}</span>
                            <span className="font-mono font-bold text-slate-800">x{ci.qty}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENTS - SALES FILE CONNECTOR */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sales-integrator-workspace">
          {/* Form instructions column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                Cargar Archivo de Ventas Diarias (POS / Excel)
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                Copie y pegue los registros de ventas de su sistema de facturación o POS. El sistema analizará las cantidades vendidas, cruzará cada plato con su Ficha Técnica, calculará las mermas promedio e incrementará el Libro de Ventas restando insumos de inventario en segundos.
              </p>

              <form onSubmit={handleProcessCsvUpload} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Nombre Identificador de Operaciones</label>
                  <input
                    type="text"
                    placeholder="e.g. ventas_pos_sabado.csv"
                    value={csvFileName}
                    onChange={e => setCsvFileName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Pegue las Líneas CSV o Datos del POS</label>
                  <textarea
                    rows={8}
                    placeholder="Formato requerido: saleItemName, qtySold, unitPrice, date, reference&#10;ejemplo:&#10;Hamburguesa Clásica, 10, 450, 2026-06-09, Factura POS-102&#10;Pechuga al Grill, 5, 380, 2026-06-09, Factura POS-103&#10;Mofongo Dominicano, 3, 550, 2026-06-09, Factura POS-104"
                    value={rawCsvText}
                    onChange={e => setRawCsvText(e.target.value)}
                    className="w-full font-mono text-xs p-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                    id="sales-csv-textarea"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRawCsvText(`saleItemName, qtySold, unitPrice, date, reference
Hamburguesa Clásica, 15, 450, ${new Date().toISOString().split('T')[0]}, POS-SABADO-1
Pechuga de Pollo al Grill, 8, 380, ${new Date().toISOString().split('T')[0]}, POS-SABADO-2
Mofongo Dominicano, 12, 590, ${new Date().toISOString().split('T')[0]}, POS-SABADO-3
HAMB_CL_S, 4, 450, ${new Date().toISOString().split('T')[0]}, POS-SABADO-4`);
                      setCsvFileName('ventas_muestras_dominicanas.csv');
                    }}
                    className="text-xs text-orange-600 hover:underline font-bold"
                  >
                    💡 Cargar Muestra Dominicana
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-6 bg-slate-850 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Procesar y Descontar Inventario
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Import summary / tutorial column */}
          <div className="space-y-6">
            {uploadStats && (
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h4 className="font-bold text-slate-900 text-xs text-center border-b border-slate-100 pb-2.5">RESULTADO DE LA ÚLTIMA IMPORTACIÓN</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-slate-400 font-sans uppercase">Procesadas</span>
                    <strong className="text-lg text-slate-800 font-mono">{uploadStats.processed}</strong>
                  </div>
                  <div className="bg-red-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-red-400 font-sans uppercase">Pendientes</span>
                    <strong className="text-lg text-red-600 font-mono">{uploadStats.unmapped}</strong>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-2xl">
                    <span className="block text-[10px] text-indigo-400 font-sans uppercase">Ajustes</span>
                    <strong className="text-lg text-indigo-700 font-mono">{uploadStats.movements}</strong>
                  </div>
                </div>
                {uploadStats.unmapped > 0 && (
                  <div className="bg-rose-55 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-850 leading-relaxed space-y-2">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-rose-650" />
                      ¡Se encontraron nombres sin mapear!
                    </p>
                    <p className="text-[11px]">
                      Se catalogaron nombres de compra (por ejemplo, del POS) que no están codificados directamente en tu Menú. Ve a la pestaña de <strong>Mapeador de Equivalencias</strong> para vincularlos y automatizar su descuento.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Flujo de Descuento Automatizado</h4>
              <ul className="space-y-3.5 text-xs text-slate-500 leading-relaxed">
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>El POS emite un ticket de venta en sucursal.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>Usted descarga e importa su reporte aquí. El sistema coteja nombres e inicializa equivalencias grabadas.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>Se restan del almacén las materias primas crudas del inventario central o las porciones de bolsas preparadas de cocina.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-[10px] shrink-0">4</span>
                  <span>Se recalculan existencias para auditoría física.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENTS - MAPPING ALIASES (Equivalencias POS) */}
      {activeTab === 'mapping' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="mapping-equivalencias-workspace">
          {/* Active Pending List Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Transacciones Pendientes de Mapeo</h3>
            <p className="text-slate-500 text-xs leading-normal">
              A continuación se listan las cadenas de texto crudas capturadas del POS que el sistema aún no ha podido emparejar con sus platos del menú. Seleccione una para asignarle correspondencia.
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unmatchedItems.length === 0 ? (
                <div className="bg-slate-50 p-8 rounded-2xl text-center text-xs text-slate-400">
                  🎉 ¡Excelente! No tienes registros de ventas de POS sin asociar.
                </div>
              ) : (
                unmatchedItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveMappingRawName(item.rawSalesName);
                      // Auto prefill score lookup if possible
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between ${
                      activeMappingRawName === item.rawSalesName
                        ? 'bg-orange-55 border-orange-250 text-orange-800 font-semibold shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-mono font-bold">{item.rawSalesName}</span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        Aparece {item.occurrences} veces en el historial de ventas cargado.
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Mapping Resolver Form Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Vincular Código del POS con Plato del Menú</h3>
            <p className="text-slate-500 text-xs">
              Asociar una equivalencia resolverá de inmediato todas las transacciones pasadas acumuladas y guardará una regla mnemotécnica inteligente para automatizar futuros cierres.
            </p>

            {activeMappingRawName ? (
              <form onSubmit={handleSaveMapping} className="space-y-4" id="form-resolver-equivalencia">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <span className="block text-[9px] text-slate-400 tracking-wider uppercase font-bold">Concepto POS Detectado</span>
                  <strong className="text-sm font-mono text-slate-900 block mt-1">{activeMappingRawName}</strong>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Plato Físico Correspondiente</label>
                  <select
                    value={mappingMenuItemId}
                    onChange={e => setMappedMenuItemId(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500"
                    id="select-mapping-menu-target"
                  >
                    <option value="">-- Elige Plato del Menú --</option>
                    {menuItems.map(m => (
                      <option key={m.id} value={m.id}>{m.code} - {m.name} (RD$ {m.salePrice})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMappingRawName('');
                      setMappedMenuItemId('');
                    }}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition"
                  >
                    Asociar y Descontar
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-50/50 p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Seleccione una transacción de la lista de la izquierda para desplegarlas en el panel de mapeo y emparejarlas.
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK NEW MENU ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="modal-menu-item-creator">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">➕ Agregar Plato Comercial al Menú</h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-450 hover:text-slate-950 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Código del Plato (POS)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MONF-DOM-1"
                    value={newItemForm.code}
                    onChange={e => setNewItemForm({ ...newItemForm, code: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mofongo Dominicano"
                    value={newItemForm.name}
                    onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Categoría del Plato</label>
                  <select
                    required
                    value={newItemForm.categoryId}
                    onChange={e => setNewItemForm({ ...newItemForm, categoryId: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="">-- Elige Categoría --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Precio de Venta al Público (RD$)</label>
                  <input
                    type="number"
                    required
                    value={newItemForm.salePrice}
                    onChange={e => setNewItemForm({ ...newItemForm, salePrice: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Tiempo de Preparación (Minutos)</label>
                  <input
                    type="number"
                    value={newItemForm.preparationTime}
                    onChange={e => setNewItemForm({ ...newItemForm, preparationTime: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Área Productiva Destino</label>
                  <select
                    value={newItemForm.productionArea}
                    onChange={e => setNewItemForm({ ...newItemForm, productionArea: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none bg-white"
                  >
                    <option value="Cocina">Cocina Caliente</option>
                    <option value="Bar">Barra de Bebidas</option>
                    <option value="Postres">Estación de Repostería</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 border-t border-slate-100 pt-3">
                <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemForm.requiresRecipe}
                    onChange={e => setNewItemForm({ ...newItemForm, requiresRecipe: e.target.checked })}
                    className="rounded border-slate-200 focus:ring-0 text-orange-600"
                  />
                  <span>¿Requiere vincular Ficha Técnica?</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItemForm.deductsInventory}
                    onChange={e => setNewItemForm({ ...newItemForm, deductsInventory: e.target.checked })}
                    className="rounded border-slate-200 focus:ring-0 text-orange-600"
                  />
                  <span>¿Descontar ingredientes en ventas?</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Notas Internas</label>
                <textarea
                  rows={2}
                  value={newItemForm.notes}
                  onChange={e => setNewItemForm({ ...newItemForm, notes: e.target.value })}
                  placeholder="Detalles de alérgenos, presentación al cliente..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-orange-600/10"
                >
                  Guardar Plato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK NEW CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="modal-category-creator">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">➕ Crear Nueva Categoría de Menú</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-450 hover:text-slate-950 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Nombre de la Categoría</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Entradas, Platos Fuertes, Bebidas..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  id="category-name-input"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Aperitivos y bocadillos calientes..."
                  value={newCategoryDesc}
                  onChange={e => setNewCategoryDesc(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs"
                >
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MANUAL DIRECT SALE MODAL */}
      {showDirectSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="modal-direct-sale-generator">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">🛒 Registrar Venta Individual</h3>
              <button onClick={() => setShowDirectSaleModal(false)} className="text-slate-450 hover:text-slate-950 font-bold">✕</button>
            </div>

            <form onSubmit={handleProcessDirectSale} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Plato del Menú para Descontar</label>
                <select
                  required
                  value={directSaleForm.menuItemId}
                  onChange={e => setDirectSaleForm({ ...directSaleForm, menuItemId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white outline-none"
                  id="direct-sale-item-select"
                >
                  <option value="">-- Elige Plato --</option>
                  {menuItems.filter(m => m.isActive).map(m => (
                    <option key={m.id} value={m.id}>{m.code} - {m.name} (RD$ {m.salePrice})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Cantidad Vendida</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={directSaleForm.quantity}
                  onChange={e => setDirectSaleForm({ ...directSaleForm, quantity: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Mesa / Ubicación</label>
                <input
                  type="text"
                  value={directSaleForm.tableNo}
                  onChange={e => setDirectSaleForm({ ...directSaleForm, tableNo: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirectSaleModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
                >
                  Registrar Venta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK NEW COMBO MODAL */}
      {showComboModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="modal-combo-creator">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">➕ Crear Combo de Menú</h3>
              <button onClick={() => setShowComboModal(false)} className="text-slate-450 hover:text-slate-950 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateComboSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Código Combo</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COM-3GOLPES"
                    value={newComboForm.code}
                    onChange={e => setNewComboForm({ ...newComboForm, code: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Nombre Combo</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gran Combo Tres Golpes"
                    value={newComboForm.name}
                    onChange={e => setNewComboForm({ ...newComboForm, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Precio Combo (RD$)</label>
                  <input
                    type="number"
                    required
                    value={newComboForm.salePrice}
                    onChange={e => setNewComboForm({ ...newComboForm, salePrice: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Descripción</label>
                  <input
                    type="text"
                    placeholder="e.g. Incluye mangú con salami, queso y huevos."
                    value={newComboForm.description}
                    onChange={e => setNewComboForm({ ...newComboForm, description: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Add Combo Items selector sub-panel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Paso 1: Agregar Platos al Combo</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={comboItemInput.menuItemId}
                      onChange={e => setComboItemInput({ ...comboItemInput, menuItemId: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Elige Plato --</option>
                      {menuItems.filter(m => m.isActive).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      className="w-16 text-xs p-2 border border-slate-200 rounded-lg text-center"
                      value={comboItemInput.qty}
                      onChange={e => setComboItemInput({ ...comboItemInput, qty: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={handleAddComboItem}
                      className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Sub items display list */}
                {newComboForm.items.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="block text-[10px] font-semibold text-slate-500">Elementos del Combo:</span>
                    <div className="max-h-24 overflow-y-auto space-y-1">
                      {newComboForm.items.map((it, idx) => {
                        const original = menuItems.find(m => m.id === it.menuItemId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-700 bg-white px-2 py-1 rounded border border-slate-100">
                            <span>{original ? original.name : 'Plato Desconocido'}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">x{it.qty}</span>
                              <button
                                type="button"
                                onClick={() => setNewComboForm({
                                  ...newComboForm,
                                  items: newComboForm.items.filter((_, i) => i !== idx)
                                })}
                                className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs"
                >
                  Crear Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
