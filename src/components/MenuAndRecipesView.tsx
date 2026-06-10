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
  Info,
  List,
  FileSignature,
  FileSearch,
  Link2Off,
  AlertCircle,
  History,
  X,
  FileText,
  Workflow,
  Sparkles
} from 'lucide-react';
import { Product, Unit, MenuItem, MenuRecipe, MenuRecipeIngredient, MenuItemAlias, Combo, Category } from '../types';
import { store } from '../data/store';

// Fuzzy string similarity matching helper algorithms (Levenshtein based)
function editDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return costs[s2.length];
}

function computeSimilarity(s1: string, s2: string): number {
  let longer = (s1 || '').toLowerCase().trim();
  let shorter = (s2 || '').toLowerCase().trim();
  if (longer.length < shorter.length) {
    const temp = longer;
    longer = shorter;
    shorter = temp;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 100;
  }
  return Math.round(((longerLength - editDistance(longer, shorter)) / longerLength) * 100);
}

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
  const [subTab, setSubTab] = useState<'items' | 'manual_recipe' | 'import_recipes' | 'review_imports' | 'unlinked_ingredients' | 'incomplete_recipes' | 'recipe_history'>('items');

  // Sub-tab API & flow States
  const [unlinkedIngredients, setUnlinkedIngredients] = useState<any[]>([]);
  const [unlinkedLoading, setUnlinkedLoading] = useState<boolean>(false);
  const [incompleteRecipes, setIncompleteRecipes] = useState<any[]>([]);
  const [incompleteLoading, setIncompleteLoading] = useState<boolean>(false);
  const [recipeAudits, setRecipeAudits] = useState<any[]>([]);
  const [auditsLoading, setAuditsLoading] = useState<boolean>(false);

  // Manual Recipe Creation Form state
  const [manualRecipeForm, setManualRecipeForm] = useState({
    menuItemId: '',
    version: 'v1',
    status: 'ACTIVE',
    changeReason: 'Creación manual de ficha técnica',
    ingredients: [] as Array<{
      productId: string;
      portionProductId: string;
      quantity: string | number;
      unitId: string;
      wastePercentage: string | number;
      costUnit: string | number;
      deductionType: 'UNIT' | 'WEIGHT' | 'VOLUME' | 'PORTION';
      isOptional: boolean;
      notes: string;
    }>
  });

  // Recipe CSV Paste Import flow states
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');
  const [importSession, setImportSession] = useState<any>(null);
  const [importColumns, setImportColumns] = useState<any[]>([]);
  const [recipeColumnMappings, setRecipeColumnMappings] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any>(null);
  const [recipePreviewLoading, setRecipePreviewLoading] = useState<boolean>(false);
  const [recipeImportHistory, setRecipeImportHistory] = useState<any[]>([]);
  const [pastedCsvText, setPastedCsvText] = useState<string>('');

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
  const [importMode, setImportMode] = useState<'upload' | 'textbox'>('upload');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mapping Input States
  const [activeMappingRawName, setActiveMappingRawName] = useState<string>('');
  const [mappingMenuItemId, setMappedMenuItemId] = useState<string>('');

  // Manual Direct Sale Form and Advanced States
  const [manualSaleForm, setManualSaleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    menuItemId: '',
    quantity: '1',
    channel: 'RESTAURANT',
    shift: 'Turno completo',
    reference: 'Fila Manual',
    comment: '',
    responsibleOperator: store.getCurrentUser()?.name || 'Administrador',
    insufficientStockPolicy: 'B' // A: Block, B: Allow Negative, C: Skip Deduction
  });
  const [manualSalePreview, setManualSalePreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Bulk Upload Wizard States
  const [wizardStep, setWizardStep] = useState<'UPLOAD' | 'MAPPING' | 'REPORT' | 'HISTORY'>('UPLOAD');
  const [uploadedResult, setUploadedResult] = useState<any>(null);
  const [columnMappings, setColumnMappings] = useState<any>({
    saleDate: 'fecha',
    saleItemName: 'plato',
    qtySold: 'cantidad',
    channel: 'canal',
    reference: 'referencia',
    shift: 'turno',
    unitPrice: 'precio'
  });
  const [userEquivalencies, setUserEquivalencies] = useState<Record<string, string>>({});
  const [validationReport, setValidationReport] = useState<any>(null);
  const [insufficientStockPolicy, setInsufficientStockPolicy] = useState<string>('B');
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [selectedHistoryImport, setSelectedHistoryImport] = useState<any | null>(null);
  const [historyErrors, setHistoryErrors] = useState<any[]>([]);

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

  const loadUnlinkedIngredients = async () => {
    try {
      setUnlinkedLoading(true);
      const res = await fetch('/api/v1/recipes/unlinked-ingredients');
      const data = await res.json();
      if (data.success) {
        setUnlinkedIngredients(data.unlinkedIngredients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUnlinkedLoading(false);
    }
  };

  const loadIncompleteRecipes = async () => {
    try {
      setIncompleteLoading(true);
      const res = await fetch('/api/v1/recipes/incomplete-report');
      const data = await res.json();
      if (data.success) {
        setIncompleteRecipes(data.incomplete || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIncompleteLoading(false);
    }
  };

  const loadRecipeAudits = async () => {
    try {
      setAuditsLoading(true);
      const res = await fetch('/api/v1/recipes/audit-history');
      const data = await res.json();
      if (data.success) {
        setRecipeAudits(data.audits || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditsLoading(false);
    }
  };

  const loadImportHistory = async () => {
    try {
      const res = await fetch('/api/v1/recipes/import/history');
      const data = await res.json();
      if (data.success) {
        setRecipeImportHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'items') {
      if (subTab === 'unlinked_ingredients') {
        loadUnlinkedIngredients();
      } else if (subTab === 'incomplete_recipes') {
        loadIncompleteRecipes();
      } else if (subTab === 'recipe_history') {
        loadRecipeAudits();
      } else if (subTab === 'review_imports') {
        loadImportHistory();
      }
    }
  }, [subTab, activeTab]);

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

  // NEW DETAILED MANUAL SALES AND STEP-BY-STEP ADAPTIVE IMPORT WIZARD HANDLERS

  const triggerManualSalePreview = async (mId: string, qty: string) => {
    if (!mId || !qty || Number(qty) <= 0) {
      setManualSalePreview(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/v1/sales/manual/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: mId,
          quantity: Number(qty) || 1,
          products: products
        })
      });
      const data = await res.json();
      setPreviewLoading(false);
      if (data.success) {
        setManualSalePreview(data);
      } else {
        setManualSalePreview(null);
      }
    } catch (err) {
      setPreviewLoading(false);
      setManualSalePreview(null);
    }
  };

  const handleConfirmManualSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSaleForm.menuItemId || !manualSaleForm.quantity || Number(manualSaleForm.quantity) <= 0) {
      showToast('error', 'Por favor seleccione un plato y defina una cantidad de unidades válida.');
      return;
    }

    const item = menuItems.find(m => m.id === manualSaleForm.menuItemId);
    if (!item) return;

    setLoading(true);
    const currentUser = store.getCurrentUser() || { id: 'usr-admin', name: 'Administrador' };
    try {
      const res = await fetch('/api/v1/sales/manual/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: manualSaleForm.menuItemId,
          quantity: Number(manualSaleForm.quantity) || 1,
          date: manualSaleForm.date,
          time: manualSaleForm.time,
          channel: manualSaleForm.channel,
          shift: manualSaleForm.shift,
          reference: manualSaleForm.reference,
          comment: manualSaleForm.comment,
          products: products,
          userId: currentUser.id,
          userName: currentUser.name,
          insufficientStockPolicy: manualSaleForm.insufficientStockPolicy
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        if (data.updatedProducts) {
          store.saveProducts(data.updatedProducts);
        }
        if (data.generatedMovements?.length > 0) {
          const prevMovs = store.getMovements();
          store.saveMovements([...data.generatedMovements, ...prevMovs]);
        }
        if (data.generatedPortionMovements?.length > 0) {
          const prevPortionMovs = store.getPortionMovements();
          store.savePortionMovements([...data.generatedPortionMovements, ...prevPortionMovs]);
        }

        // Add audit log
        store.addAuditLog(
          'VENTA_MANUAL',
          'Ventas',
          `Venta manual registrada: ${item.name} x${manualSaleForm.quantity} uds. Canal: ${manualSaleForm.channel}. Operador: ${currentUser.name}`,
          data.saleRecord?.id
        );

        showToast('success', `Venta manual de ${manualSaleForm.quantity} x "${item.name}" consolidada con éxito.`);
        setShowDirectSaleModal(false); // Close Modal UI
        
        // Reset form
        setManualSaleForm({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          menuItemId: '',
          quantity: '1',
          channel: 'RESTAURANT',
          shift: 'Turno completo',
          reference: 'Fila Manual',
          comment: '',
          responsibleOperator: currentUser.name,
          insufficientStockPolicy: 'B'
        });
        setManualSalePreview(null);
        onRefreshInventory(); // reload parent inventory tables
        fetchMenuItems(); // recalculate cost margins
        fetchSalesHistory(); // updates sales graph
      } else {
        showToast('error', data.error || 'No se pudo completar la venta manual.');
      }
    } catch (err) {
      setLoading(false);
      showToast('error', 'Error del sistema de ventas manuales.');
    }
  };

  const fetchImportHistory = async () => {
    try {
      const res = await fetch('/api/v1/sales/import/history');
      const data = await res.json();
      if (data.success) {
        setImportHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error al obtener histórico de importaciones", err);
    }
  };

  const handleWizardUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    let fileContent = '';
    let fileName = '';

    if (importMode === 'upload') {
      if (!selectedFile) {
        showToast('error', 'Arrastre o seleccione un archivo antes de procesar.');
        return;
      }
      fileName = selectedFile.name;
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const b64 = event.target?.result as string;
        try {
          const res = await fetch('/api/v1/sales/import/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileContent: b64, fileName })
          });
          const data = await res.json();
          setLoading(false);
          if (data.success) {
            setUploadedResult(data);
            if (data.suggestedMappings) {
              setColumnMappings(data.suggestedMappings);
            }
            setWizardStep('MAPPING');
            showToast('success', 'Archivo procesado con éxito. Por favor pase al mapeo de columnas.');
          } else {
            showToast('error', data.error || 'No se pudo procesar la plantilla.');
          }
        } catch (err) {
          setLoading(false);
          showToast('error', 'Fallo asíncrono con el servicio de uploads.');
        }
      };
      reader.readAsDataURL(selectedFile);
    } else {
      if (!rawCsvText.trim()) {
        showToast('error', 'Suministre filas válidas en el recuadro CSV.');
        return;
      }
      fileName = csvFileName || 'carga_pegada_manual.csv';
      setLoading(true);
      try {
        const res = await fetch('/api/v1/sales/import/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileContent: btoa(unescape(encodeURIComponent(rawCsvText))), fileName })
        });
        const data = await res.json();
        setLoading(false);
        if (data.success) {
          setUploadedResult(data);
          if (data.suggestedMappings) {
            setColumnMappings(data.suggestedMappings);
          }
          setWizardStep('MAPPING');
          showToast('success', 'Campos de texto mapeados. Verifique el orden en pantalla.');
        } else {
          showToast('error', data.error || 'Líneas corruptas detectadas.');
        }
      } catch (err) {
        setLoading(false);
        showToast('error', 'Fallo formateando pegado CSV.');
      }
    }
  };

  const handleWizardValidate = async () => {
    if (!uploadedResult) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/sales/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawRows: uploadedResult.rawRows,
          mappings: columnMappings,
          equivalencies: userEquivalencies,
          products: products
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setValidationReport(data);
        setWizardStep('REPORT');
        showToast('info', 'Análisis en seco de ingredientes y platos completado.');
      } else {
        showToast('error', data.error || 'No se pudo simular la corrida de stock.');
      }
    } catch (err) {
      setLoading(false);
      showToast('error', 'Error simulando la importación.');
    }
  };

  const handleWizardConfirm = async () => {
    if (!validationReport) return;
    setLoading(true);
    const currentUser = store.getCurrentUser() || { id: 'usr-admin', name: 'Administrador' };
    try {
      const res = await fetch('/api/v1/sales/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validatedLines: validationReport.validatedLines,
          policy: insufficientStockPolicy,
          fileName: uploadedResult?.fileName || 'lote_ventas_excel.xlsx',
          userId: currentUser.id,
          userName: currentUser.name,
          products: products
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        if (data.updatedProducts) {
          store.saveProducts(data.updatedProducts);
        }
        if (data.generatedMovements?.length > 0) {
          const prevMovs = store.getMovements();
          store.saveMovements([...data.generatedMovements, ...prevMovs]);
        }
        if (data.generatedPortionMovements?.length > 0) {
          const prevPortionMovs = store.getPortionMovements();
          store.savePortionMovements([...data.generatedPortionMovements, ...prevPortionMovs]);
        }

        // Add audit log
        store.addAuditLog(
          'COMPROMISO_IMPORTACIÓN',
          'Ventas',
          `Carga masiva de ${data.importSummary?.importedRows} filas efectuada desde ${data.importSummary?.fileName}. Estado de lote: ${data.importSummary?.status}`,
          data.importSummary?.id
        );

        showToast('success', '¡Importación de ventas consolidada y descontada de inventario!');
        setWizardStep('UPLOAD');
        setSelectedFile(null);
        setRawCsvText('');
        setUploadedResult(null);
        setValidationReport(null);
        setUserEquivalencies({});

        onRefreshInventory(); 
        fetchMenuItems(); 
        fetchSalesHistory();
        fetchImportHistory();
      } else {
        showToast('error', data.error || 'No se pudo aplicar la deducción real.');
      }
    } catch (err) {
      setLoading(false);
      showToast('error', 'Fallo de red en consolidación del lote.');
    }
  };

  const loadHistoryErrors = async (importSession: any) => {
    setSelectedHistoryImport(importSession);
    try {
      const res = await fetch(`/api/v1/sales/import/${importSession.id}/errors`);
      const data = await res.json();
      if (data.success) {
        setHistoryErrors(data.errors || []);
      }
    } catch (err) {
      console.error("Fallo obteniendo las líneas erradas", err);
    }
  };

  // Run initial history loading on mount
  useEffect(() => {
    fetchImportHistory();
  }, []);

  // Save Name Mapping (Mapeador de Equivalencias)
  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMappingRawName || !mappingMenuItemId) {
      showToast('error', 'Selecciona el plato equivalente.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/v1/sales/map-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawSalesName: activeMappingRawName,
          menuItemId: mappingMenuItemId,
          products: products,
          movements: store.getMovements(),
          portionMovements: store.getPortionMovements()
        })
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        if (data.updatedProducts) {
          store.saveProducts(data.updatedProducts);
        }
        if (data.updatedMovements) {
          store.saveMovements(data.updatedMovements);
        }
        if (data.updatedPortionMovements) {
          store.savePortionMovements(data.updatedPortionMovements);
        }

        showToast('success', `Mapeo grabado. Se corrigieron ${data.correctedCount} transacciones pasadas y se dedujeron sus ingredientes.`);
        setActiveMappingRawName('');
        setMappedMenuItemId('');
        fetchUnmatchedItems();
        onRefreshInventory();
      } else {
        showToast('error', data.error || 'No se guardó el mapeo.');
      }
    } catch (err) {
      setLoading(false);
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
      <div className="w-full overflow-x-auto scrollbar-none border-b border-slate-200" id="menu-recipe-tabs-container">
        <div className="flex min-w-max" id="menu-recipe-tabs">
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
            ⚙️ Importador de Ventas
          </button>
          <button
            onClick={() => { setActiveTab('mapping'); setSelectedItemForRecipe(null); }}
            className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'mapping' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
            id="tab-mapping-aliases"
          >
            🔗 Equivalencias POS
            {unmatchedItems.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-red-100 text-red-650 rounded font-bold animate-pulse">
                {unmatchedItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENTS - PLATINGS & RECIPES */}
      {activeTab === 'items' && !selectedItemForRecipe && (
        <div className="space-y-4">
          {/* Sub Navigation Option Menu */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-2xl" id="recipes-sub-tabs">
            <button
              onClick={() => setSubTab('items')}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'items'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Catálogo de Platos
            </button>
            <button
              onClick={() => {
                setSubTab('manual_recipe');
                setManualRecipeForm({
                  menuItemId: '',
                  version: 'v1',
                  status: 'ACTIVE',
                  changeReason: 'Creación manual de ficha técnica',
                  ingredients: []
                });
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'manual_recipe'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5" />
              Crear Receta Manual
            </button>
            <button
              onClick={() => {
                setSubTab('import_recipes');
                setImportStep('upload');
                setPastedCsvText('');
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'import_recipes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Importar de Archivo
            </button>
            <button
              onClick={() => setSubTab('review_imports')}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'review_imports'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              Revisar Importaciones
            </button>
            <button
              onClick={() => setSubTab('unlinked_ingredients')}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'unlinked_ingredients'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <Link2Off className="w-3.5 h-3.5" />
              Ingredientes no Vinculados
              {unlinkedIngredients.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-700 text-[9px] rounded-full font-bold">
                  {unlinkedIngredients.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSubTab('incomplete_recipes')}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'incomplete_recipes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Recetas Incompletas
              {incompleteRecipes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-orange-100 text-orange-700 text-[9px] rounded-full font-bold">
                  {incompleteRecipes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSubTab('recipe_history')}
              className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl font-bold text-xs transition duration-200 ${
                subTab === 'recipe_history'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Historial de Cambios
            </button>
          </div>

          {subTab === 'items' && (
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
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-3 gap-y-2.5 bg-slate-50/60 p-3 rounded-2xl">
                          <div>
                            <span className="block text-[9px] text-slate-400 font-sans tracking-wide">Precio Venta</span>
                            <strong className="text-xs font-bold text-slate-800 font-mono">RD$ {price.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400 font-sans tracking-wide">Costo Teórico</span>
                            <strong className={`text-xs font-bold font-mono ${cost > price ? 'text-rose-600' : 'text-slate-800'}`}>
                              RD$ {cost.toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400 font-sans tracking-wide">Margen Bruto</span>
                            <strong className={`text-xs font-bold font-mono ${margin < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                              RD$ {margin.toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400 font-sans tracking-wide">Margen %</span>
                            <strong className={`text-xs font-bold font-mono ${hasLowMargin ? 'text-amber-600' : 'text-emerald-650'}`}>
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

          {/* VIEW 2: MANUAL RECIPE BUILDER */}
          {subTab === 'manual_recipe' && (
            <div className="p-6 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-orange-600" />
                  Configurar Ficha Técnica Manual
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Defina los insumos operativos que componen un plato para descontarlos del stock general con cada venta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Plato Comercial de Destino</label>
                  <select
                    value={manualRecipeForm.menuItemId}
                    onChange={e => {
                      const chosen = menuItems.find(m => m.id === e.target.value);
                      setManualRecipeForm({
                        ...manualRecipeForm,
                        menuItemId: e.target.value,
                        version: 'v' + String((chosen?.theoreticalCost ? 2 : 1))
                      });
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-slate-800"
                  >
                    <option value="">-- Seleccionar Plato del Menú --</option>
                    {menuItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.code} - {item.name} (RD$ {item.salePrice.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Versión de Ficha</label>
                  <input
                    type="text"
                    value={manualRecipeForm.version}
                    onChange={e => setManualRecipeForm({ ...manualRecipeForm, version: e.target.value })}
                    placeholder="v1"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Estado Inicial</label>
                  <select
                    value={manualRecipeForm.status}
                    onChange={e => setManualRecipeForm({ ...manualRecipeForm, status: e.target.value as any })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold"
                  >
                    <option value="ACTIVE text-slate-800">Activa (Reemplaza versiones previas)</option>
                    <option value="DRAFT text-slate-800">Borrador (Ficha inactiva temporalmente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Comentario / Motivo del Cambio</label>
                <input
                  type="text"
                  value={manualRecipeForm.changeReason}
                  onChange={e => setManualRecipeForm({ ...manualRecipeForm, changeReason: e.target.value })}
                  placeholder="Ej: Registro inicial por apertura de menú, ajuste de porciones, etc."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Ingredientes y Dosificación de Preparación</label>
                  <button
                    onClick={() => {
                      setManualRecipeForm({
                        ...manualRecipeForm,
                        ingredients: [
                          ...manualRecipeForm.ingredients,
                          { productId: '', portionProductId: '', quantity: '', unitId: 'un', wastePercentage: 0, costUnit: 0, deductionType: 'UNIT', isOptional: false, notes: '' }
                        ]
                      });
                    }}
                    className="py-1 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 shadow-sm font-sans"
                  >
                    + Agregar Insumo
                  </button>
                </div>

                {manualRecipeForm.ingredients.length === 0 ? (
                  <div className="py-6 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 text-xs">
                    Haga clic en "+ Agregar Insumo" para especificar los componentes de este plato comercial.
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 p-2.5 space-y-2 text-xs">
                    {manualRecipeForm.ingredients.map((ing, idx) => {
                      return (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm items-end relative">
                          <div className="md:col-span-3">
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Producto / Insumo</label>
                            <select
                              value={ing.productId}
                              onChange={e => {
                                const prod = products.find(p => p.id === e.target.value);
                                const updated = [...manualRecipeForm.ingredients];
                                updated[idx].productId = e.target.value;
                                updated[idx].unitId = prod?.unitId || 'und';
                                updated[idx].costUnit = prod?.averageCost || 0;
                                updated[idx].deductionType = prod?.portionsAvailable !== undefined ? 'PORTION' : 'UNIT';
                                setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                              }}
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-medium text-slate-800"
                            >
                              <option value="">-- Seleccionar --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.unitId || 'un'})</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Tipo Descuento</label>
                            <select
                              value={ing.deductionType}
                              onChange={e => {
                                const updated = [...manualRecipeForm.ingredients];
                                updated[idx].deductionType = e.target.value as any;
                                setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                              }}
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white"
                            >
                              <option value="UNIT">Por Unidad</option>
                              <option value="WEIGHT">Por Peso (g/kg)</option>
                              <option value="VOLUME">Por Volumen (ml/oz)</option>
                              <option value="PORTION">Porción Operativa</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Cantidad Usada</label>
                            <input
                              type="number"
                              step="any"
                              value={ing.quantity}
                              onChange={e => {
                                const updated = [...manualRecipeForm.ingredients];
                                updated[idx].quantity = e.target.value;
                                setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                              }}
                              placeholder="Cant"
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>

                          <div className="md:col-span-1">
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Merma %</label>
                            <input
                              type="number"
                              value={ing.wastePercentage}
                              onChange={e => {
                                const updated = [...manualRecipeForm.ingredients];
                                updated[idx].wastePercentage = e.target.value;
                                setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                              }}
                              placeholder="%"
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">Costo Unitario (RD$)</label>
                            <input
                              type="number"
                              step="any"
                              value={ing.costUnit}
                              onChange={e => {
                                const updated = [...manualRecipeForm.ingredients];
                                updated[idx].costUnit = e.target.value;
                                setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                              }}
                              placeholder="RD$"
                              className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-white font-mono"
                            />
                          </div>

                          <div className="md:col-span-2 flex items-center justify-between gap-1 pb-1">
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                id={`optional-${idx}`}
                                type="checkbox"
                                checked={ing.isOptional}
                                onChange={e => {
                                  const updated = [...manualRecipeForm.ingredients];
                                  updated[idx].isOptional = e.target.checked;
                                  setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                                }}
                                className="rounded text-orange-600 focus:ring-orange-500"
                              />
                              <label htmlFor={`optional-${idx}`} className="text-[9px] font-semibold text-slate-500 cursor-pointer select-none">Opcional</label>
                            </div>
                            <button
                              onClick={() => {
                                const updated = manualRecipeForm.ingredients.filter((_, i) => i !== idx);
                                setManualRecipeForm({ ...manualRecipeForm, ingredients: updated });
                              }}
                              className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center transition shrink-0 border border-rose-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {manualRecipeForm.menuItemId && (
                (() => {
                  const selectedPlate = menuItems.find(m => m.id === manualRecipeForm.menuItemId);
                  const sellingPrice = selectedPlate ? selectedPlate.salePrice : 0;
                  
                  let sumTheoreticalCost = 0;
                  manualRecipeForm.ingredients.forEach(ing => {
                    const qty = Number(ing.quantity || 0);
                    const cost = Number(ing.costUnit || 0);
                    const waste = Number(ing.wastePercentage || 0);
                    sumTheoreticalCost += qty * cost * (1 + waste / 100);
                  });

                  const foodCostPct = sellingPrice > 0 ? (sumTheoreticalCost / sellingPrice) * 100 : 0;
                  const grossMargin = sellingPrice - sumTheoreticalCost;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100" id="calculation-preview-summary-box">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costo Teórico Calculado</span>
                        <span className="text-base font-bold font-mono text-slate-800 mt-1">RD$ {sumTheoreticalCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Suma lineal de ingredientes y mermas</span>
                      </div>
                      <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Food Cost % estimado</span>
                        <span className={`text-base font-bold font-mono mt-1 ${foodCostPct > 35 ? "text-rose-600" : "text-emerald-700"}`}>
                          {foodCostPct.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Precio Venta plato: RD$ {sellingPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margen Bruto de Utilidad</span>
                        <span className="text-base font-bold font-mono text-slate-800 mt-1">RD$ {grossMargin.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Retorno teórico por porción vendida</span>
                      </div>
                    </div>
                  );
                })()
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setSubTab('items')}
                  className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 rounded-xl font-bold text-slate-600 text-xs transition border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!manualRecipeForm.menuItemId) {
                      showToast('error', 'Por favor, seleccione un plato de destino.');
                      return;
                    }
                    if (manualRecipeForm.ingredients.length === 0) {
                      showToast('error', 'Por favor, agregue al menos un insumo.');
                      return;
                    }

                    const hasInvalid = manualRecipeForm.ingredients.some(ing => !ing.productId || isNaN(Number(ing.quantity)) || Number(ing.quantity) <= 0);
                    if (hasInvalid) {
                      showToast('error', 'Por favor, complete adecuadamente todos los insumos y sus dosificaciones.');
                      return;
                    }

                    try {
                      let sumCost = 0;
                      manualRecipeForm.ingredients.forEach(i => {
                        const qty = Number(i.quantity);
                        const cost = Number(i.costUnit);
                        const waste = Number(i.wastePercentage);
                        sumCost += qty * cost * (1 + waste / 100);
                      });

                      const selPlate = menuItems.find(m => m.id === manualRecipeForm.menuItemId);
                      const rawPrice = selPlate ? selPlate.salePrice : 0;
                      const foodCostPct = rawPrice > 0 ? (sumCost / rawPrice) * 100 : 0;

                      const res = await fetch(`/api/v1/menu/items/${manualRecipeForm.menuItemId}/recipes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          version: manualRecipeForm.version,
                          status: manualRecipeForm.status,
                          changeReason: manualRecipeForm.changeReason,
                          theoreticalCost: sumCost,
                          foodCostPercentage: foodCostPct,
                          ingredients: manualRecipeForm.ingredients
                        })
                      });

                      const response = await res.json();
                      if (response.success) {
                        showToast('success', `Receta manual registrada de forma exitosa.`);
                        fetchMenuItems();
                        setSubTab('items');
                      } else {
                        showToast('error', response.error || 'Error al guardar.');
                      }
                    } catch (ex) {
                      showToast('error', 'Fallo de red al interactuar.');
                    }
                  }}
                  className="py-2.5 px-5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-orange-600/10"
                >
                  Guardar Ficha Técnica
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: FILE IMPORT FLOW */}
          {subTab === 'import_recipes' && (
            <div className="p-6 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-orange-600" />
                    Procesador Inteligente de Fichas Técnicas
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Cargue sus recetas masivamente pegando filas CSV o de Excel. El sistema identificará los nombres y vinculará a insumos.
                  </p>
                </div>
                <div className="flex gap-1.5 bg-slate-50 p-1 border border-slate-100 rounded-xl font-mono text-[10px] select-none">
                  <span className={`px-2 py-0.5 rounded-lg ${importStep === 'upload' ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-400'}`}>1. Cargar</span>
                  <span className={`px-2 py-0.5 rounded-lg ${importStep === 'mapping' ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-400'}`}>2. Mapear</span>
                  <span className={`px-2 py-0.5 rounded-lg ${importStep === 'preview' ? 'bg-white text-slate-800 font-bold shadow-sm' : 'text-slate-400'}`}>3. Validar</span>
                </div>
              </div>

              {importStep === 'upload' && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3 text-xs leading-normal text-orange-850">
                    <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Instrucciones:</strong> Copie y pegue filas desde su archivo Excel. El importador es inteligente y admite columnas de nombres variables (equivalencias heurísticas). El único requisito es declarar filas con campos similares a: <em>plato, codigo_plato, ingrediente, cantidad, unidad, merma, costo</em>.
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">Contenido CSV o Pegar desde Hoja de Cálculo</label>
                    <textarea
                      className="w-full h-44 p-4 border border-slate-200 rounded-2xl font-mono text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition"
                      placeholder="plato,codigo_plato,categoria_menu,precio_venta,ingrediente,cantidad,unidad,merma,costo_unitario&#10;Arepa de Pollo,AP-01,Arepas,250,Masa lista de arepa,80,g,0,0.50&#10;Arepa de Pollo,AP-01,Arepas,250,Pollo esmechado,1,porcion,0,60.00"
                      value={pastedCsvText}
                      onChange={e => setPastedCsvText(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2.5">
                    <button
                      onClick={() => {
                        setPastedCsvText(`plato,codigo_plato,categoria_menu,precio_venta,ingrediente,cantidad,unidad,merma,costo_unitario\nArepa de Pollo,AP-01,Arepas y Botanas,220,Masa lista de arepa,80,g,0,0.50\nArepa de Pollo,AP-01,Arepas y Botanas,220,Pollo esmechado,1,porcion,0,60.00\nArepa de Pollo,AP-01,Arepas y Botanas,220,Queso,30,g,5,0.45\nBurger Clasica,BC-01,Hamburguesas,350,Masa de res fresca,1,porcion,0,55.00\nBurger Clasica,BC-01,Hamburguesas,350,Pan Brioche,1,unidad,0,18.00\nBurger Clasica,bc-01,Hamburguesas,350,Queso Cheddar lonja,1,unidad,0,12.00`);
                      }}
                      className="py-2 px-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                    >
                      Cargar Ejemplo Demo
                    </button>
                    <button
                      onClick={async () => {
                        if (!pastedCsvText.trim()) {
                          showToast('error', 'Pegue filas de recetas en el cuadro de texto.');
                          return;
                        }

                        try {
                          const res = await fetch('/api/v1/recipes/import/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ csvText: pastedCsvText, fileName: 'Recetas_Cargadas.csv' })
                          });
                          const data = await res.json();
                          if (data.success) {
                            setImportSession(data.data);
                            setImportColumns(data.columns);
                            
                            const initialMappings: Record<string, string> = {};
                            data.columns.forEach((col: any) => {
                              initialMappings[col.originalName] = col.selectedField;
                            });
                            setRecipeColumnMappings(initialMappings);
                            setImportStep('mapping');
                          } else {
                            showToast('error', data.error || 'No se interpretó el CSV.');
                          }
                        } catch (ex) {
                          showToast('error', 'Fallo de conectividad de red.');
                        }
                      }}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition"
                    >
                      Configurar Columnas &gt;
                    </button>
                  </div>
                </div>
              )}

              {importStep === 'mapping' && importSession && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl text-xs">
                    <h4 className="text-xs font-bold text-slate-700 font-sans">Mapear Columnas de Origen</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">Asocie los nombres de sus columnas de Excel con los parámetros que utiliza el motor de costeo.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 text-xs">
                    {importColumns.map(col => (
                      <div key={col.id} className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl shadow-sm">
                        <span className="font-mono font-bold text-slate-705 truncate max-w-[150px]">📁 {col.originalName}</span>
                        <select
                          value={recipeColumnMappings[col.originalName] || 'ignorar'}
                          onChange={e => setRecipeColumnMappings({ ...recipeColumnMappings, [col.originalName]: e.target.value })}
                          className="w-40 p-1.5 border border-slate-200 rounded-lg bg-white select-inner focus:border-slate-400 font-bold text-slate-800 text-[11px]"
                        >
                          <option value="ignorar">🚫 Ignorar columna</option>
                          <option value="plato">🍴 Nombre del Plato</option>
                          <option value="codigo_plato">🔢 Código del Plato</option>
                          <option value="categoria_menu">📂 Categoría Menú</option>
                          <option value="precio_venta">💵 Precio de Venta (Comercial)</option>
                          <option value="ingrediente">🥩 Insumo / Ingrediente</option>
                          <option value="cantidad">⚖️ Cantidad Dosificación</option>
                          <option value="unidad">📏 Unidad de Medida</option>
                          <option value="tipo_ingrediente">⚙️ Tipo Insumo</option>
                          <option value="merma">📉 Merma %</option>
                          <option value="costo_unitario">💰 Costo Unitario Insumo</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs">
                    <button
                      onClick={() => setImportStep('upload')}
                      className="py-2 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`/api/v1/recipes/import/${importSession.id}/map-columns`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ columnMappings: recipeColumnMappings })
                          });

                          const resAnalyze = await fetch(`/api/v1/recipes/import/${importSession.id}/analyze`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ products })
                          });
                          const dataAnalyze = await resAnalyze.json();

                          if (dataAnalyze.success) {
                            setRecipePreviewLoading(true);
                            setImportStep('preview');
                            const resPreview = await fetch(`/api/v1/recipes/import/${importSession.id}/preview?products=${encodeURIComponent(JSON.stringify(products))}`);
                            const dataPreview = await resPreview.json();
                            if (dataPreview.success) {
                              setPreviewData(dataPreview);
                            } else {
                              showToast('error', dataPreview.error || 'Error previsualizando.');
                            }
                          } else {
                            showToast('error', dataAnalyze.error || 'Error al analizar el contenido.');
                          }
                        } catch (ex) {
                          showToast('error', 'Fallo catastrófico al procesar.');
                        } finally {
                          setRecipePreviewLoading(false);
                        }
                      }}
                      className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition"
                    >
                      Analizar Recetas &gt;
                    </button>
                  </div>
                </div>
              )}

              {importStep === 'preview' && (
                <div className="space-y-4 text-xs font-sans">
                  {recipePreviewLoading || !previewData ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
                      <p className="text-slate-400 text-xs font-semibold font-sans">Decodificando, emparejando de forma inteligente con el catálogo de Cocina...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Recetas Reconocidas</span>
                          <span className="text-base font-bold font-mono text-slate-850 mt-0.5">{previewData.totals.totalPlates}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200 pl-3">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nuevos Platos Comercial</span>
                          <span className="text-base font-bold font-mono text-blue-600 font-bold mt-0.5">+{previewData.totals.newPlates}</span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200 pl-3">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Insumos sin Código</span>
                          <span className={`text-base font-bold font-mono ${previewData.totals.unlinkedIngredients > 0 ? "text-amber-600 font-bold" : "text-emerald-705"} mt-0.5`}>
                            {previewData.totals.unlinkedIngredients}
                          </span>
                        </div>
                        <div className="flex flex-col border-l border-slate-200 pl-3">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Renglones con Error</span>
                          <span className={`text-base font-bold font-mono ${previewData.errorCount > 0 ? "text-red-500 font-bold" : "text-slate-500"} mt-0.5`}>
                            {previewData.errorCount}
                          </span>
                        </div>
                      </div>

                      {previewData.errorCount > 0 && (
                        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-[11px] flex items-center gap-2 max-h-24 overflow-y-auto">
                          <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
                          <div>
                            Se identificaron inconsistencias en {previewData.errorCount} renglones del archivo. Serán omitidos al agrupar.
                          </div>
                        </div>
                      )}

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {previewData.recipes.map((r: any, idx: number) => (
                          <div key={idx} className="bg-white border border-slate-150 rounded-2xl shadow-sm p-4 space-y-3" id={`grouped-preview-${idx}`}>
                            <div className="flex md:items-center justify-between flex-col md:flex-row gap-2 border-b border-slate-100 pb-2.5">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-550">{r.code || "NUEVO"}</span>
                                  <span className="text-xs font-bold text-slate-900">{r.name}</span>
                                  <span className="text-[10px] text-slate-400 font-medium font-sans">({r.category})</span>
                                </div>
                                <div className="text-[10px] text-slate-450 mt-0.5 font-sans leading-relaxed">
                                  Insumos detallados en ficha técnica: <strong>{r.ingredients.length}</strong>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Precio V.</span>
                                  <span className="text-xs font-bold font-mono text-slate-800">RD$ {r.salePrice.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col border-l border-slate-100 pl-3">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Costo Teo</span>
                                  <span className="text-xs font-bold font-mono text-slate-800">RD$ {r.theoreticalCost.toFixed(1)}</span>
                                </div>
                                <div className="flex flex-col border-l border-slate-100 pl-3">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Food Cost</span>
                                  <span className={`text-xs font-bold font-mono font-bold ${r.foodCostPercentage > 35 ? "text-rose-600" : "text-emerald-700"}`}>{r.foodCostPercentage.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="overflow-x-auto text-[10px] sm:text-xs">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase font-bold bg-slate-50/50">
                                    <th className="py-1 px-1.5">Insumo Declarado</th>
                                    <th className="py-1 px-1.5 text-right">Cantidad</th>
                                    <th className="py-1 px-1.5">Medida</th>
                                    <th className="py-1 px-1.5 text-right">Merma %</th>
                                    <th className="py-1 px-1.5 text-right">Costo U.</th>
                                    <th className="py-1 px-1.5 text-right">Total</th>
                                    <th className="py-1 px-1.5">Vínculo Inventario Real</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {r.ingredients.map((ing: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-50 text-[11px] hover:bg-slate-50/20 leading-relaxed font-sans">
                                      <td className="py-1 px-1.5 font-semibold text-slate-700">{ing.rawName}</td>
                                      <td className="py-1 px-1.5 text-right font-mono text-slate-650">{ing.quantity}</td>
                                      <td className="py-1 px-1.5 text-slate-505 font-mono">{ing.unitId || "und"}</td>
                                      <td className="py-1 px-1.5 text-right font-mono text-slate-400">{ing.wastePercentage}%</td>
                                      <td className="py-1 px-1.5 text-right font-mono text-slate-600">RD$ {ing.costUnit.toFixed(1)}</td>
                                      <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-750">RD$ {ing.totalCost.toFixed(1)}</td>
                                      <td className="py-1 px-1.5 flex items-center gap-1.5">
                                        {ing.linkedProduct ? (
                                          <div className="flex items-center gap-1">
                                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-bold">✓ Vinculado</span>
                                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">({ing.linkedProduct.name})</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 w-full text-xs">
                                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-800 rounded text-[9px] font-bold shrink-0">⚠️ Sin Código</span>
                                            <select
                                              onChange={e => {
                                                const match = products.find((p: any) => p.id === e.target.value);
                                                if (match) {
                                                  ing.linkedProduct = match;
                                                  ing.linkedProductId = match.id;
                                                  ing.isLinked = true;
                                                  setPreviewData({ ...previewData });
                                                }
                                              }}
                                              className="text-[9px] p-0.5 border border-slate-200 rounded outline-none max-w-[125px] bg-white text-slate-755 font-bold cursor-pointer"
                                              value={ing.linkedProductId || ''}
                                            >
                                              <option value="">-- Buscar... --</option>
                                              {products.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                              ))}
                                            </select>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 text-xs">
                        <button
                          onClick={() => setImportStep('mapping')}
                          className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition border border-slate-150"
                        >
                          Atrás
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/v1/recipes/import/${importSession.id}/confirm`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ recipes: previewData.recipes })
                                                  });
                              const confirmData = await res.json();
                              if (confirmData.success) {
                                showToast('success', confirmData.message || 'Se importó el catálogo exitosamente.');
                                fetchMenuItems();
                                setSubTab('items');
                              } else {
                                showToast('error', confirmData.error || 'Fallo de procesamiento.');
                              }
                            } catch (ex) {
                              showToast('error', 'Fallo al interactuar de red.');
                            }
                          }}
                          className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-orange-600/10"
                        >
                          ✓ Confirmar Importación de {previewData.recipes.length} Recetas
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW 4: PAST IMPORTS LOGS */}
          {subTab === 'review_imports' && (
            <div className="p-6 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                  <FileSearch className="w-5 h-5 text-orange-600" />
                  Auditoría de Sesiones de Importación
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Revise los procesos históricos de cargas bulk de platos y confirmaciones de fichas técnicas en su restaurante.
                </p>
              </div>

              {recipeImportHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  No se registran importaciones de archivos masivos aún.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="p-3">Ref ID</th>
                        <th className="p-3">Archivo / Tipo</th>
                        <th className="p-3 text-right">Renglones Leídos</th>
                        <th className="p-3 text-right font-sans">Agrupación Platos</th>
                        <th className="p-3 font-sans">Importado El</th>
                        <th className="p-3 font-sans">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipeImportHistory.map((h: any) => (
                        <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50/50 font-sans leading-relaxed">
                          <td className="p-3 font-mono font-bold text-slate-600">{h.id}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-805 block">{h.fileName}</span>
                            <span className="text-[10px] text-slate-405 font-mono">CSV Raw Text Import</span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold">{h.totalRows}</td>
                          <td className="p-3 text-right font-mono text-slate-700">{h.detectedRecipes}</td>
                          <td className="p-3 text-slate-505 font-mono">{new Date(h.createdAt || '').toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                              h.status === 'IMPORTED' ? 'bg-emerald-50 text-emerald-850 border border-emerald-100' :
                              h.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                              'bg-amber-50 text-amber-850 border border-amber-200'
                            }`}>
                              {h.status === 'IMPORTED' ? 'CONFIRMADO' : h.status === 'CANCELLED' ? 'DESCARGADO' : 'PENDIENTE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 5: UNLINKED INGREDIENTS */}
          {subTab === 'unlinked_ingredients' && (
            <div className="p-6 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-4">
              <div className="flex md:items-center justify-between flex-col md:flex-row gap-2 pb-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                    <Link2Off className="w-5 h-5 text-orange-600" />
                    Ingredientes sin Código Asociado
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Estos insumos fueron importados y carecen de un código de producto del inventario para aplicar el descuento de stock. Asócielos de forma general.
                  </p>
                </div>
                <button
                  onClick={loadUnlinkedIngredients}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-xl text-xs flex items-center gap-1 font-sans"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${unlinkedLoading ? 'animate-spin' : ''}`} />
                  Recargar base
                </button>
              </div>

              {unlinkedLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
                  <p className="text-slate-400 text-xs font-semibold">Buscando asociaciones sin configurar en recetas activas...</p>
                </div>
              ) : unlinkedIngredients.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-150 rounded-3xl max-w-lg mx-auto flex flex-col items-center justify-center p-6 bg-white">
                  <span className="text-3xl mb-1 select-none">🎉</span>
                  <h4 className="font-bold text-slate-800 text-xs">Vínculos Completamente Sanos</h4>
                  <p className="text-slate-500 text-[11px] mt-1 leading-normal max-w-xs">
                    No se registran ingredientes huérfanos. Todos los platos descontarán insumos configurados y valorados adecuadamente en la bodega.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-205 p-4 rounded-2xl flex gap-2.5 text-xs text-amber-850 leading-relaxed font-sans">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      Al asociar un insumo con un producto real de inventario, el sistema mapea la sincronización retroactivamente en todas sus fichas técnicas del restaurante de forma global.
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-155 rounded-2xl shadow-sm text-xs bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold uppercase tracking-wider text-slate-500 select-none">
                          <th className="p-3 font-sans">Insumo Huérfano</th>
                          <th className="p-3 font-sans">Plato Referencia</th>
                          <th className="p-3 font-sans">Dosificación Ficha</th>
                          <th className="p-3 font-sans">Definir Asociación Operativa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unlinkedIngredients.map((un: any, uIdx: number) => {
                          let suggestProd: any = null;
                          let bestScore = 0;
                          products.forEach((p: any) => {
                            const sc = computeSimilarity(p.name, un.rawIngredientName);
                            if (sc > bestScore) {
                              bestScore = sc;
                              suggestProd = p;
                            }
                          });

                          return (
                            <tr key={uIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-800">🥩 {un.rawIngredientName}</td>
                              <td className="p-3 text-slate-505 font-sans">🍲 {un.plateName || 'Menú comercial'}</td>
                              <td className="p-3 font-mono text-slate-650">{un.quantity} {un.unitId || 'un'}</td>
                              <td className="p-3 flex items-center gap-2 flex-wrap text-xs font-sans">
                                {bestScore >= 60 && suggestProd && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch('/api/v1/recipes/link-ingredient', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            rawIngredientName: un.rawIngredientName,
                                            productId: suggestProd.id
                                          })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          showToast('success', `Se vinculó exitosamente.`);
                                          loadUnlinkedIngredients();
                                          fetchMenuItems();
                                        }
                                      } catch (e) {
                                        showToast('error', 'Fallo de enlace.');
                                      }
                                    }}
                                    className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 rounded-lg text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    Asociar Sugerencia: <strong>{suggestProd.name}</strong>
                                  </button>
                                )}

                                <select
                                  onChange={async (e) => {
                                    if (!e.target.value) return;
                                    try {
                                      const res = await fetch('/api/v1/recipes/link-ingredient', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          rawIngredientName: un.rawIngredientName,
                                          productId: e.target.value
                                        })
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        showToast('success', `Enlasado globalmente.`);
                                        loadUnlinkedIngredients();
                                        fetchMenuItems();
                                      }
                                    } catch (e) {
                                      showToast('error', 'Fallo al enlazar.');
                                    }
                                  }}
                                  className="text-[10px] p-1 border border-slate-200 rounded-lg bg-white text-slate-705 outline-none focus:border-slate-450 font-bold"
                                  defaultValue=""
                                >
                                  <option value="">-- Vincular con... --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.unitId || 'un'})</option>
                                  ))}
                                </select>

                                <button
                                  onClick={async () => {
                                    const confirmCreate = confirm(`¿Desea crear un nuevo producto con nombre "${un.rawIngredientName}" en la base de datos de inventario?`);
                                    if (!confirmCreate) return;
                                    try {
                                      const newProd: Product = {
                                        id: "prod-uns-" + Math.random().toString(36).substr(2, 9),
                                        name: un.rawIngredientName,
                                        categoryId: "cat-general",
                                        unitId: un.unitId || "und",
                                        averageCost: Number(un.costUnit || 0),
                                        lastPrice: Number(un.costUnit || 0),
                                        currentStock: 0,
                                        minStock: 5,
                                        maxStock: 9999,
                                        description: "Insumo importado via recetas",
                                        providerIds: [],
                                        areaStocks: { "Cocina": 0 }
                                      };
                                      
                                      const updatedProds = [...products, newProd];
                                      store.saveProducts(updatedProds);
                                      if (onRefreshInventory) onRefreshInventory();

                                      const res = await fetch('/api/v1/recipes/link-ingredient', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          rawIngredientName: un.rawIngredientName,
                                          productId: newProd.id
                                        })
                                      });
                                      const data = await res.json();
                                      if (data.success) {
                                        showToast('success', `Se autogeneró el insumo en Cocina y se enlazó.`);
                                        loadUnlinkedIngredients();
                                        fetchMenuItems();
                                      }
                                    } catch (ex) {
                                      showToast('error', 'Fallo al procesar.');
                                    }
                                  }}
                                  className="py-1 px-2.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-[10.5px] font-bold hover:bg-blue-105 transition whitespace-nowrap"
                                >
                                  + Crear Insumo
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 6: INCOMPLETE RECIPES */}
          {subTab === 'incomplete_recipes' && (
            <div className="p-6 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-4 text-xs font-sans">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Auditoría de Inconsistencias de Fichas
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Listado de platos comerciales mapeados para descuento pero que poseen fichas técnicas vacías, ingredientes sin códigos, o costos nulos.
                </p>
              </div>

              {incompleteLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
                  <p className="text-slate-400 text-xs font-semibold">Ejecutando auditoría de recetas en tiempo real...</p>
                </div>
              ) : incompleteRecipes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm border-2 border-dashed border-slate-150 rounded-3xl max-w-lg mx-auto flex flex-col items-center justify-center p-6 bg-white">
                  <span className="text-3xl mb-1 select-none">🏆</span>
                  <h4 className="font-bold text-slate-800 text-xs text-sans">Salud de Catálogo al 100%</h4>
                  <p className="text-slate-500 text-[11px] mt-1 leading-normal max-w-xs">
                    Todos los platos configurados poseen recetas comercializables sanas, valoradas y con enlaces limpios en almacén.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incompleteRecipes.map((r: any, rIdx: number) => (
                    <div key={rIdx} className="p-4 bg-rose-50/30 border border-rose-150 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                          Peligro de Descuento
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">🥘 {r.item.name}</h4>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          🔴 <strong>Incidencia:</strong> {r.problem}
                        </p>
                        <p className="text-slate-505 text-[11px] leading-relaxed">
                          💡 <strong>Recomendación:</strong> {r.recommendation}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemForRecipe(r.item);
                          selectItemForRecipeEdit(r.item);
                        }}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10.5px] font-bold transition shrink-0 self-end sm:self-center"
                      >
                        Solucionar Ficha
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 7: RECIPE CHANGES AUDITS */}
          {subTab === 'recipe_history' && (
            <div className="p-6 bg-white border border-slate-150 rounded-3xl shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                  <History className="w-5 h-5 text-orange-600" />
                  Registro de Auditoría de Fichas Técnicas
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Bitácora con fines de auditoría estricta para controlar fraudes, errores o cambios injustificados de costes en cocina.
                </p>
              </div>

              {auditsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 font-sans">
                  <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
                  <p className="text-slate-400 text-xs font-semibold">Cargando bitácora central de cambios...</p>
                </div>
              ) : recipeAudits.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-mono bg-slate-50/50">
                  No se registran eventos de fichas técnicas en su cuenta.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-150 ml-4 pl-6 space-y-4 pb-2 text-xs">
                  {recipeAudits.map((aud: any) => (
                    <div key={aud.id} className="relative group text-slate-700">
                      <span className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white group-hover:bg-orange-600 transition" />
                      <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-slate-250 transition shadow-sm leading-normal">
                        <div className="flex items-center justify-between flex-wrap gap-1.5 text-[10px]">
                          <span className="font-bold text-slate-800">👤 {aud.userName} ({aud.userRole})</span>
                          <span className="text-slate-404 font-mono">{new Date(aud.date).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 pb-1">
                          <span className="px-1.5 py-0.2 bg-slate-200 rounded text-slate-650 font-bold text-[9px] tracking-wide uppercase">
                            {aud.action}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">ID: {aud.recordId}</span>
                        </div>
                        <p className="text-slate-650 font-semibold text-xs font-sans mt-0.5">{aud.comment}</p>

                        {aud.previousValue && (
                          <div className="mt-2 text-[10px] font-mono bg-white p-2 rounded-lg border border-slate-155 text-slate-505 leading-normal max-h-24 overflow-y-auto">
                            <strong>⏪ Previo: </strong>
                            <span>{aud.previousValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* TAB CONTENTS - DYNAMIC SALES MULTI-STEP IMPORTER WIZARD */}
      {activeTab === 'sales' && (
        <div className="space-y-6" id="sales-integrator-workspace">
          {/* Wizard Header Navigation progress bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                🔮
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Asistente de Importación y Deducción</h3>
                <p className="text-[10px] text-slate-400">Procesa lotes masivos de ventas para descargar materias primas de almacén de forma retrospectiva.</p>
              </div>
            </div>

            {/* Stepper badge index */}
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => setWizardStep('UPLOAD')}
                className={`px-3 py-1.5 rounded-xl transition ${wizardStep === 'UPLOAD' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                1. Archivo
              </button>
              <div className="text-slate-300">➔</div>
              <button
                disabled={!uploadedResult}
                onClick={() => setWizardStep('MAPPING')}
                className={`px-3 py-1.5 rounded-xl transition ${wizardStep === 'MAPPING' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 disabled:opacity-50'}`}
              >
                2. Columnas
              </button>
              <div className="text-slate-300">➔</div>
              <button
                disabled={!validationReport}
                onClick={() => setWizardStep('REPORT')}
                className={`px-3 py-1.5 rounded-xl transition ${wizardStep === 'REPORT' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 disabled:opacity-50'}`}
              >
                3. Pre-Reporte
              </button>
              <div className="text-slate-300">|</div>
              <button
                onClick={() => {
                  setWizardStep('HISTORY');
                  fetchImportHistory();
                }}
                className={`px-3 py-1.5 rounded-xl transition ${wizardStep === 'HISTORY' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-650 hover:bg-slate-200'}`}
              >
                📜 Sesiones
              </button>
            </div>
          </div>

          {/* STEP 1: UPLOAD FILE & LINE PARSING */}
          {wizardStep === 'UPLOAD' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <div className="border-b pb-3 border-slate-50 flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                    Paso 1: Especificar archivo o texto plano
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('upload')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${importMode === 'upload' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      📁 Plantilla Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('textbox')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${importMode === 'textbox' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      📝 Pegar Líneas
                    </button>
                  </div>
                </div>

                <form onSubmit={handleWizardUpload} className="space-y-4">
                  {importMode === 'upload' ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                      onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]); }}
                      onClick={() => document.getElementById('wizard-file-selector')?.click()}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                        dragActive ? 'border-orange-500 bg-orange-55/10' : selectedFile ? 'border-emerald-500 bg-emerald-50/5' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="file"
                        id="wizard-file-selector"
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                        onChange={(e) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); }}
                      />
                      <span className="text-3xl">🗂️</span>
                      {selectedFile ? (
                        <div>
                          <p className="text-xs font-bold text-slate-900">Formato Cargado:</p>
                          <p className="text-xs font-mono font-bold text-emerald-600 mt-1">{selectedFile.name}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block">(Click para cambiar de archivo)</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-extrabold text-slate-700">Arrastre aquí su Reporte de Ventas POS o Excel</p>
                          <p className="text-[11px] text-slate-400 mt-1">Soporta hojas de cálculo de excel y archivos planos CSV.</p>
                          <span className="inline-block mt-3 px-3 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-lg text-slate-600">Buscar archivo</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Identificador del lote</label>
                        <input
                          type="text"
                          placeholder="e.g. ventas_ventanilla_sabado.csv"
                          value={csvFileName}
                          onChange={(e) => setCsvFileName(e.target.value)}
                          className="w-full text-xs p-2.5 mt-1 border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Editor de Datos CSV</label>
                        <textarea
                          rows={6}
                          placeholder="Formato: Plato, Cantidad, Precio, Fecha, Referencia&#10;Hamburguesa Solo Queso, 8, 420, 2026-06-10, Mesa-4&#10;Arepa de Pollo, 12, 350, 2026-06-10, Delivery-POS"
                          value={rawCsvText}
                          onChange={(e) => setRawCsvText(e.target.value)}
                          className="w-full font-mono text-xs p-3.5 mt-1 border border-slate-200 rounded-2xl outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div>
                      {importMode === 'textbox' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRawCsvText(`fecha, plato, cantidad, canal, referencia, precio
2026-06-10, Hamburguesas Clásicas, 15, RESTAURANTE, POS-101, 450
2026-06-10, Arepa de Pollo, 10, DELIVERY, POS-102, 350
2026-06-10, Arepa con Queso, 8, TAKE_AWAY, POS-103, 220
2026-06-10, Mofongo de Pollo, 5, RESTAURANTE, POS-104, 550`);
                            setCsvFileName('ventas_grupo_dominicana.csv');
                            showToast('info', 'Demostración cargada.');
                          }}
                          className="text-[11px] text-orange-600 font-bold hover:underline"
                        >
                          💡 Cargar Datos de Demostración
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2.5 px-6 bg-slate-900 hover:bg-black disabled:bg-slate-350 text-white text-xs font-bold rounded-xl transition"
                    >
                      {loading ? 'Analizando archivo...' : 'Siguiente Paso (Esquema) ➔'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Informative Step instructions panel */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                  <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Instrucciones de Cabeceras</h5>
                  <p className="text-xs text-slate-500 leading-normal">
                    El sistema detectará automáticamente el formato de las columnas de su archivo. Recomendamos que su archivo contenga cabeceras sugeridas como:
                  </p>
                  <div className="space-y-2 text-xs font-mono text-slate-650 p-3 bg-slate-50 rounded-2xl">
                    <p>• <strong className="text-slate-800">Fecha / Date:</strong> En formato AAAA-MM-DD</p>
                    <p>• <strong className="text-slate-800">Plato / Item:</strong> Nombre comercial exacto</p>
                    <p>• <strong className="text-slate-800">Cantidad / Qty:</strong> Unidades comerciales</p>
                    <p>• <strong className="text-slate-800">Canal / Canal:</strong> RESTAURANT, DELIVERY</p>
                  </div>
                  <div className="p-3 bg-orange-50 text-orange-700 text-[11px] font-semibold rounded-2xl leading-relaxed">
                    🌟 Las ventas no descuentan simplemente el plato, sino cada ingrediente o porción definidos según su Ficha Técnica en tiempo real.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPINGS & PENDING MNEUMONIC MAPPING */}
          {wizardStep === 'MAPPING' && uploadedResult && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6 animate-fade-in">
              <div className="border-b pb-3 border-slate-50 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Paso 2: Confirmar Asociación de Columnas y Equivalencias
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Coteje sus cabeceras reales de Excel con los parámetros que requiere la base de datos para correr la lógica.
                  </p>
                </div>
                <button
                  onClick={() => setWizardStep('UPLOAD')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-bold rounded-xl"
                >
                  ◀ Regresar a selección
                </button>
              </div>

              {/* Column Selectors Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                {Object.keys(columnMappings).map((targetDbKey) => (
                  <div key={targetDbKey} className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      {targetDbKey === 'saleDate' ? '📅 FECHA DE TRANSACCIÓN' :
                       targetDbKey === 'saleItemName' ? '🍔 CLAVE PLATO COMERCIAL' :
                       targetDbKey === 'qtySold' ? '🔢 CANTIDAD VENTAS' :
                       targetDbKey === 'channel' ? '🛵 CANAL DELIVERY' :
                       targetDbKey === 'reference' ? '🏷️ CÓDIGO REF' :
                       targetDbKey === 'shift' ? '⏰ GRUPO TURNO' : '💵 PRECIO UNITARIO'}
                    </label>
                    <select
                      value={columnMappings[targetDbKey]}
                      onChange={(e) => setColumnMappings({ ...columnMappings, [targetDbKey]: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 bg-white rounded-xl focus:border-orange-500"
                    >
                      <option value="">(Ignorar este campo)</option>
                      {uploadedResult.columns.map((col: string) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* LOCAL MNEMONIC EQUIVALENCY RESOLVER ON-THE-FLY */}
              <div className="space-y-3">
                <div className="bg-orange-50/20 border border-orange-100 p-4 rounded-3xl">
                  <h5 className="text-xs font-bold text-orange-950 flex items-center gap-2">
                    💡 Localizador Inteligente de Equivalencias de Menú
                  </h5>
                  <p className="text-xs text-orange-850 mt-1">
                    Si el POS exportó nombres extraños (ej. <code className="bg-white/60 p-0.5 px-1 font-mono rounded text-[10px]">HAMB_CL_S</code>), asócielos a sus platos reales ahora mismo para salvar la regla retrospectivamente y no perder la ficha de rendimiento.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-3xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-bold tracking-wider divide-x divide-slate-100 border-b border-slate-100">
                        <th className="py-2.5 px-4 w-1/2">Nombre en Archivo POS</th>
                        <th className="py-2.5 px-4 w-1/2">Vincular al Plato Activo del Menú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {uploadedResult.rawRows.map((row: any) => row[columnMappings.saleItemName]).filter((v: any, i: number, a: any[]) => v && a.indexOf(v) === i).map((rawName: string) => {
                        const matchedItem = menuItems.find(it => it.name.toLowerCase() === rawName.toLowerCase());
                        const isAliasMatched = menuItems.some(it => it.id === userEquivalencies[rawName]);
                        
                        return (
                          <tr key={rawName} className="hover:bg-slate-50/30">
                            <td className="py-3 px-4 font-mono font-bold text-slate-700 text-[11px] truncate">
                              {rawName}
                            </td>
                            <td className="py-2 px-4">
                              <select
                                value={userEquivalencies[rawName] || (matchedItem ? matchedItem.id : '')}
                                onChange={(e) => setUserEquivalencies({ ...userEquivalencies, [rawName]: e.target.value })}
                                className="w-full max-w-sm text-xs p-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-orange-500/20"
                              >
                                <option value="">⚠️ Sin registrar (Aplica similitud automática dura)</option>
                                {menuItems.map(m => (
                                  <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action trigger footer */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={handleWizardValidate}
                  disabled={loading}
                  className="py-2.5 px-8 bg-slate-900 hover:bg-black disabled:bg-slate-350 text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {loading ? 'Simulando mermas...' : 'Simular Corrida e Impacto de Stock ➔'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DRY RUN REPORT SIMULATION PREVIEW & BLOCKING POLICIES */}
          {wizardStep === 'REPORT' && validationReport && (
            <div className="space-y-6 animate-fade-in">
              {/* Financial metrics dashboard cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Filas de Venta</span>
                  <strong className="text-xl font-mono text-slate-800 tracking-tight block mt-1">
                    {validationReport.totals.totalRows} uds.
                  </strong>
                  <div className="flex justify-center gap-1.5 text-[9px] mt-2 font-black">
                    <span className="text-emerald-600">✔ {validationReport.totals.validRows} Val.</span>
                    {validationReport.totals.warningRows > 0 && <span className="text-amber-500">⚠ {validationReport.totals.warningRows} Rep.</span>}
                    {validationReport.totals.errorRows > 0 && <span className="text-red-500">🗙 {validationReport.totals.errorRows} Fail</span>}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Ventas Estimadas</span>
                  <strong className="text-xl font-mono text-slate-800 tracking-tight block mt-1">
                    RD$ {validationReport.totals.totalRevenue}
                  </strong>
                  <span className="text-[9px] text-slate-405 block mt-2">Cálculo por sucursal / precios definidos</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Costo de Insumos</span>
                  <strong className="text-xl font-mono text-rose-600 tracking-tight block mt-1">
                    RD$ {validationReport.totals.totalTheoreticalCost}
                  </strong>
                  <span className="text-[9px] text-slate-405 block mt-2">Incluye mermas de fichas activas</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Margen de Contribución</span>
                  <strong className="text-xl font-mono text-emerald-600 tracking-tight block mt-1">
                    RD$ {validationReport.totals.marginAmount}
                  </strong>
                  <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 font-mono font-bold text-[9px] rounded-md">
                    {validationReport.totals.marginPercentage}% Margen teórico
                  </span>
                </div>
              </div>

              {/* INSUFFICIENT STOCK POLICY CONTROLLER */}
              <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h5 className="text-xs font-black text-amber-900 uppercase">Ajuste de Política de Carga en Lote</h5>
                  <p className="text-[11px] text-amber-700 mt-1 max-w-xl">
                    Se encontraron ingredientes u hortalizas frescas cuyos requerimientos en archivo exceden las existencias de almacén. ¿Cómo proceder al comprometer la descarga real?
                  </p>
                </div>
                <div className="shrink-0">
                  <select
                    value={insufficientStockPolicy}
                    onChange={(e) => setInsufficientStockPolicy(e.target.value)}
                    className="p-2 px-4 shadow-sm border border-slate-200 rounded-xl bg-white text-xs font-bold font-sans text-slate-700 outline-none"
                  >
                    <option value="B">Permitir saldos negativos (Recomendado)</option>
                    <option value="A">Bloquear y desbaratar lote ante fallos</option>
                    <option value="C">Ignorar la resta del ingrediente insuficiente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* INGREDIENTS DEDUCTIONS DRY RUN TABLE */}
                <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    📊 Simulación de Descuento de Materias Primas e Insumos
                  </h4>

                  <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-[11px] divide-y divide-slate-100">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-bold uppercase text-slate-450 tracking-wider">
                          <th className="py-2.5 px-4">Insumo / Ingrediente</th>
                          <th className="py-2.5 px-3 text-right">Resta Total</th>
                          <th className="py-2.5 px-3 text-right">Exist. Actual</th>
                          <th className="py-2.5 px-3 text-right">Stock Destino</th>
                          <th className="py-2.5 px-4 text-center">Analítica</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {validationReport.ingredientsToDeduct.map((req: any) => (
                          <tr key={req.productId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-bold text-slate-700">{req.name}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-xs text-rose-650 font-bold">-{req.requiredQty} <span className="text-[9px] text-slate-400">{req.unitCode}</span></td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">{req.currentStock} {req.unitCode}</td>
                            <td className={`py-2.5 px-3 text-right font-mono font-bold ${req.resultingStock < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                              {req.resultingStock} {req.unitCode}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {req.hasSufficientStock ? (
                                <span className="p-1 px-2.5 bg-emerald-50 text-emerald-600 text-[9px] rounded-md font-bold">STOCK OK</span>
                              ) : (
                                <span className="p-1 px-2.5 bg-orange-50 text-orange-600 text-[9px] rounded-md font-bold">DESCIELE</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {validationReport.ingredientsToDeduct.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                              No hay deducciones estimadas. Verifique equivalencias vinculadas.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* DETAILED VALIDATED ROWS TABLE */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    📋 Filas de Venta Analizadas ({validationReport.validatedLines.length})
                  </h4>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {validationReport.validatedLines.map((line: any) => (
                      <div key={line.index} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="block font-medium font-mono text-slate-900 max-w-[160px] truncate">{line.rawItemName}</span>
                          <span className="block text-[9px] text-slate-400 mt-1 font-mono">Cant: x{line.quantity} | Ref: {line.reference}</span>
                        </div>
                        <div className="text-right">
                          {line.status === 'VALID' ? (
                            <span className="inline-block p-1 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded-md">VÁLIDA</span>
                          ) : line.status === 'WARNING' ? (
                            <span className="inline-block p-1 bg-amber-50 text-amber-600 text-[8px] font-bold rounded-md" title={line.observation}>OBSERVACIÓN</span>
                          ) : (
                            <span className="inline-block p-1 bg-rose-50 text-rose-600 text-[8px] font-bold rounded-md" title={line.errorMessage}>ERRADA</span>
                          )}
                          <span className="block text-[10px] font-mono mt-1 text-slate-705">RD$ {line.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                <button
                  onClick={() => setWizardStep('MAPPING')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  ◀ Corregir equivalencias POS
                </button>

                <button
                  onClick={handleWizardConfirm}
                  disabled={loading}
                  className="py-3 px-8 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-350 text-white rounded-xl text-xs font-black tracking-wider transition shadow-lg flex items-center gap-2"
                >
                  ⚡ COMPROMETER LOTE Y REGISTRAR MOVIMIENTOS
                </button>
              </div>
            </div>
          )}

          {/* SESSIONS HISTORY PANEL */}
          {wizardStep === 'HISTORY' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              {/* Sessions historic records */}
              <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  📜 Sesiones de Ventas Importadas Históricamente
                </h4>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {importHistory.length === 0 ? (
                    <div className="bg-slate-50 p-12 rounded-3xl text-center text-xs text-slate-400">
                      No hay sesiones de importación masiva registradas en la base de datos persistente.
                    </div>
                  ) : (
                    importHistory.map((sess: any) => (
                      <div
                        key={sess.id}
                        onClick={() => loadHistoryErrors(sess)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                          selectedHistoryImport?.id === sess.id ? 'bg-orange-55 border-orange-200' : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-800">{sess.fileName}</span>
                            <span className={`p-0.5 px-2 rounded-md text-[8px] font-bold font-mono ${sess.status === 'IMPORTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {sess.status}
                            </span>
                          </div>
                          <span className="block text-[10px] text-slate-450 mt-1">
                            Lote subido el {new Date(sess.createdAt).toLocaleString()} por {sess.uploadedByUserId || 'Admin'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="block text-xs font-mono font-black text-slate-700">RD$ {sess.totalRevenue}</span>
                          <span className="block text-[9px] text-slate-400 mt-1">{sess.importedRows} corridas exitosas / {sess.skippedRows} omitidos</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Selected Session Warnings Detail */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  ⚠️ Bitácora de Observaciones de Sesión
                </h4>

                {selectedHistoryImport ? (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1 border border-slate-100">
                      <p className="text-slate-500 font-bold">Sesión: <span className="font-mono text-slate-800">{selectedHistoryImport.id}</span></p>
                      <p className="text-slate-500 font-bold">Filas Totales: <span className="font-mono text-slate-800">{selectedHistoryImport.totalRows}</span></p>
                      <p className="text-slate-550">Haga clic sobre cualquier sesión de la izquierda para extraer su reporte de auditoría.</p>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {historyErrors.length === 0 ? (
                        <div className="bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-400">
                          ✔ Ninguna advertencia reportada en esta importación.
                        </div>
                      ) : (
                        historyErrors.map((err: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800">
                            <strong>Fila {err.rowNumber}: {err.rawItemName}</strong>
                            <p className="mt-0.5 font-bold font-sans">Incidencia: {err.status === 'ERROR' ? 'Fila Omitida.' : 'Deducción Completa.'} {err.errorMessage}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-12 rounded-3xl text-center text-xs text-slate-400">
                    Haga clic en una importación de la izquierda para desplegar sus errores o advertencias específicas.
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* ADVANCED DYNAMIC MANUAL SALE CONFIGURATOR AND CONFIRMER */}
      {showDirectSaleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" id="modal-direct-sale-generator">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b pb-4 border-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="p-1 px-2 bg-orange-50 text-orange-600 rounded-lg text-xs">Manual</span>
                  Registrar Transacción de Venta Manual
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                  Registra un plato vendido y deduce de forma asíncrona la porción o ingredientes de su ficha técnica activa.
                </p>
              </div>
              <button onClick={() => setShowDirectSaleModal(false)} className="text-slate-400 hover:text-slate-900 font-bold transition">✕</button>
            </div>

            <form onSubmit={handleConfirmManualSaleSubmit} className="space-y-4 overflow-y-auto pr-1 py-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plate and Quantity */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Concepto Comercial / Plato</label>
                    <select
                      required
                      value={manualSaleForm.menuItemId}
                      onChange={e => {
                        const nextForm = { ...manualSaleForm, menuItemId: e.target.value };
                        setManualSaleForm(nextForm);
                        triggerManualSalePreview(e.target.value, nextForm.quantity);
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:border-orange-500"
                    >
                      <option value="">-- Elige Plato del Menú --</option>
                      {menuItems.map(m => (
                        <option key={m.id} value={m.id} disabled={!m.isActive}>
                          {m.code} - {m.name} {!m.isActive ? '(INACTIVO)' : `(RD$ ${m.salePrice})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Cantidad de Unidades Vendidas</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={manualSaleForm.quantity}
                      onChange={e => {
                        const nextForm = { ...manualSaleForm, quantity: e.target.value };
                        setManualSaleForm(nextForm);
                        triggerManualSalePreview(manualSaleForm.menuItemId, e.target.value);
                      }}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={manualSaleForm.date}
                        onChange={e => setManualSaleForm({ ...manualSaleForm, date: e.target.value })}
                        className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Hora</label>
                      <input
                        type="text"
                        required
                        value={manualSaleForm.time}
                        onChange={e => setManualSaleForm({ ...manualSaleForm, time: e.target.value })}
                        className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Metadata */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Canal de Distribución</label>
                    <select
                      value={manualSaleForm.channel}
                      onChange={e => setManualSaleForm({ ...manualSaleForm, channel: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50/50 outline-none"
                    >
                      <option value="RESTAURANT">🍽️ Restaurante Principal</option>
                      <option value="DELIVERY">🛵 Delivery / UberEats</option>
                      <option value="TAKE_AWAY">🛍️ Para Llevar</option>
                      <option value="EVENT">🎉 Evento Especial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Turno de Venta</label>
                    <input
                      type="text"
                      value={manualSaleForm.shift}
                      onChange={e => setManualSaleForm({ ...manualSaleForm, shift: e.target.value })}
                      placeholder="e.g. Turno Almuerzo"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Documento / Referencia POS</label>
                    <input
                      type="text"
                      value={manualSaleForm.reference}
                      onChange={e => setManualSaleForm({ ...manualSaleForm, reference: e.target.value })}
                      placeholder="e.g. Ticket #F-4902"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Policy Selector & Operator comments */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Política de Stock Insuficiente</span>
                    <span className="text-[9px] text-slate-400">¿Cómo actuar ante ingredientes con existencia crítica?</span>
                  </div>
                  <select
                    value={manualSaleForm.insufficientStockPolicy}
                    onChange={e => setManualSaleForm({ ...manualSaleForm, insufficientStockPolicy: e.target.value })}
                    className="text-[11px] p-1.5 px-3 border border-slate-200 bg-white rounded-lg outline-none font-bold text-slate-700"
                  >
                    <option value="B">Permitir saldos negativos</option>
                    <option value="A">Bloquear transacción</option>
                    <option value="C">Ignorar descuento de ingrediente</option>
                  </select>
                </div>
              </div>

              {/* LIVE SIMULATIVE PREVIEW PANEL */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  🔍 Análisis Proporcional de Descuento (Ficha Técnica)
                </h4>

                {previewLoading ? (
                  <div className="bg-slate-50 p-4 rounded-2xl text-center text-xs text-slate-400">
                    Calculando coeficientes e ingredientes...
                  </div>
                ) : manualSalePreview ? (
                  <div className="space-y-3">
                    {/* Ingredients table preview */}
                    <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-450 border-b border-slate-100">
                            <th className="py-2 px-3">Ingrediente</th>
                            <th className="py-2 px-2 text-right">Resta</th>
                            <th className="py-2 px-2 text-right">Exist. Actual</th>
                            <th className="py-2 px-2 text-right">Stock Final</th>
                            <th className="py-2 px-3 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {manualSalePreview.ingredients.map((ing: any) => (
                            <tr key={ing.productId} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-semibold text-slate-700">{ing.productName}</td>
                              <td className="py-2 px-2 text-right font-mono text-xs text-rose-650 font-bold">-{ing.requiredQty} <span className="text-[9px] text-slate-400">{ing.unitCode}</span></td>
                              <td className="py-2 px-2 text-right font-mono">{ing.currentStock} {ing.unitCode}</td>
                              <td className={`py-2 px-2 text-right font-mono font-bold ${ing.resultingStock < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                                {ing.resultingStock} {ing.unitCode}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {ing.hasSufficientStock ? (
                                  <span className="p-0.5 px-2 bg-emerald-50 text-emerald-600 text-[9px] font-extrabold rounded-md">OK</span>
                                ) : (
                                  <span className="p-0.5 px-2 bg-orange-50 text-orange-600 text-[9px] font-extrabold rounded-md">BAJO</span>
                                )}
                              </td>
                            </tr>
                          ))}
                          {manualSalePreview.ingredients.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-400 bg-slate-50/50 text-[11px]">
                                El plato no tiene ingredientes definidos (se deducirá directo por equivalencia simple).
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Estimators */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">VENTA</span>
                        <span className="font-mono font-extrabold text-slate-800 text-xs">RD$ {manualSalePreview.totalRevenue}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">COSTO TEÓRICO</span>
                        <span className="font-mono font-extrabold text-slate-800 text-xs">RD$ {manualSalePreview.totalCost}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">UTILIDAD</span>
                        <span className="font-mono font-extrabold text-emerald-600 text-xs">RD$ {manualSalePreview.marginAmount}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">MARGEN %</span>
                        <span className={`inline-block py-0.5 px-1.5 rounded-md font-mono font-bold text-[10px] ${manualSalePreview.marginPercentage > 50 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {manualSalePreview.marginPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Warnings List */}
                    {manualSalePreview.warnings?.length > 0 && (
                      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-1">
                        {manualSalePreview.warnings.map((warn: string, i: number) => (
                          <p key={i} className="text-[10px] text-amber-700 font-bold flex items-center gap-1.5">
                            ⚠️ {warn}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-2xl text-center text-xs text-slate-400">
                    Elija un plato comercial arriba para desplegar el análisis simulación del Kardex.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDirectSaleModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || previewLoading}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white rounded-xl font-extrabold text-xs transition shadow-md"
                >
                  {loading ? 'Confirmando...' : 'Confirmar y Consolidar'}
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
