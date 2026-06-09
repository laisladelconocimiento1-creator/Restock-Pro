import React, { useState, useEffect } from 'react';
import { store } from '../data/store';
import {
  Product,
  Category,
  Unit,
  User,
  PortionRule,
  PortionBatch,
  PortionMovement,
  PortionSale,
  SalesChannel,
  Recipe,
  KitchenDailyClose,
  KitchenDailyCloseItem
} from '../types';
import {
  Scale,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  History,
  ShoppingBag,
  Info,
  Calendar,
  Check,
  Search,
  Upload,
  DollarSign,
  Beef,
  ChevronRight,
  Filter,
  Users,
  Settings,
  Lock,
  LockOpen,
  FileSpreadsheet,
  AlertOctagon
} from 'lucide-react';

interface PortionManagementViewProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  currentUser: User;
  onReloadData: () => void;
}

export default function PortionManagementView({
  products,
  categories,
  units,
  currentUser,
  onReloadData
}: PortionManagementViewProps) {
  // Operational lists from store
  const [rules, setRules] = useState<PortionRule[]>([]);
  const [batches, setBatches] = useState<PortionBatch[]>([]);
  const [movements, setMovements] = useState<PortionMovement[]>([]);
  const [sales, setSales] = useState<PortionSale[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [dailyCloses, setDailyCloses] = useState<KitchenDailyClose[]>([]);

  // Navigation sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'lotes' | 'reglas' | 'inventario_cocina' | 'recetas' | 'ventas' | 'cierres' | 'historial'>('dashboard');

  // Modal open states
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showRealCountModal, setShowRealCountModal] = useState<PortionBatch | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<PortionBatch | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Core Rule Form Fields
  const [ruleForm, setRuleForm] = useState({
    productId: '',
    purchaseUnitId: 'uni-1',
    baseUnitId: 'uni-6',
    conversionFactor: 16,
    standardPortionSize: 8,
    portionUnitId: 'uni-9',
    expectedYieldPercentage: 95,
    expectedWastePercentage: 5,
    requiresPortioning: true,
    sellByPortion: true,
    isActive: true
  });

  // Batch manual form fields (Fallback)
  const [batchForm, setBatchForm] = useState({
    productId: '',
    purchaseId: '',
    quantityPurchased: 10,
    comment: ''
  });

  // Real count action fields
  const [realPortionsCount, setRealPortionsCount] = useState<number>(0);
  const [realCountComment, setRealCountComment] = useState<string>('');
  const [rejectionComment, setRejectionComment] = useState<string>('');

  // Sales Manual & CSV fields
  const [saleForm, setSaleForm] = useState({
    productId: '',
    isRecipe: false,
    recipeId: '',
    portionsSold: 1,
    channel: 'RESTAURANT' as SalesChannel,
    reference: ''
  });

  const [csvText, setCsvText] = useState<string>(
    "fecha,nombre_producto,cantidad,canal,referencia\n2026-06-08,Filete de Pollo Pechuga,12,RESTAURANT,Mesa 4\n2026-06-08,Corte de Res Lomo Angus,5,DELIVERY,Ubereats #21\n2026-06-08,Salmón Fresco Chileno,8,RESTAURANT,Mesa 10"
  );
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);

  // Kitchen Chef manual movement form State
  const [movementForm, setMovementForm] = useState({
    productId: '',
    movementType: 'PORTION_WASTE' as 'PORTION_WASTE' | 'PORTION_INTERNAL_CONSUMPTION' | 'PORTION_ADJUSTMENT',
    quantity: 1,
    adjustmentDirection: 'Faltante (-)' as 'Sobrante (+)' | 'Faltante (-)',
    reason: '',
    comment: '',
    responsibleName: currentUser.name
  });

  // Recipe Form Fields
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    price: 350,
    ingredients: [] as { productId: string; quantity: number; isPortion: boolean }[]
  });
  const [newIngredient, setNewIngredient] = useState({ productId: '', quantity: 1, isPortion: true });

  // Daily Closing Interactive Form State
  const [selectedCloseDate, setSelectedCloseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [closeFields, setCloseFields] = useState<Record<string, {
    physicalCount: number;
    reason?: 'Errores de conteo' | 'Consumo no registrado' | 'Robo/pérdida' | 'Daño de producto' | 'Otros';
    comment?: string;
  }>>({});
  const [closingNotes, setClosingNotes] = useState<string>('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Load state on mount and reload
  useEffect(() => {
    loadData();
  }, [products]);

  const loadData = () => {
    setRules(store.getPortionRules());
    setBatches(store.getPortionBatches());
    setMovements(store.getPortionMovements());
    setSales(store.getPortionSales());
    setRecipes(store.getRecipes());
    setDailyCloses(store.getDailyCloses());
  };

  const handleRefresh = () => {
    onReloadData();
    loadData();
  };

  // Rule configuration CRUD
  const handleOpenNewRule = () => {
    setEditingRuleId(null);
    const available = products.find(p => !rules.some(r => r.productId === p.id));
    setRuleForm({
      productId: available ? available.id : (products[0]?.id || ''),
      purchaseUnitId: 'uni-1',
      baseUnitId: 'uni-6',
      conversionFactor: 16,
      standardPortionSize: 8,
      portionUnitId: 'uni-9',
      expectedYieldPercentage: 95,
      expectedWastePercentage: 5,
      requiresPortioning: true,
      sellByPortion: true,
      isActive: true
    });
    setShowRuleModal(true);
  };

  const handleOpenEditRule = (rule: PortionRule) => {
    setEditingRuleId(rule.id);
    setRuleForm({
      productId: rule.productId,
      purchaseUnitId: rule.purchaseUnitId,
      baseUnitId: rule.baseUnitId,
      conversionFactor: rule.conversionFactor,
      standardPortionSize: rule.standardPortionSize,
      portionUnitId: rule.portionUnitId,
      expectedYieldPercentage: rule.expectedYieldPercentage,
      expectedWastePercentage: rule.expectedWastePercentage,
      requiresPortioning: rule.requiresPortioning,
      sellByPortion: rule.sellByPortion,
      isActive: rule.isActive
    });
    setShowRuleModal(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.productId) {
      alert("Por favor seleccione un producto");
      return;
    }

    if (editingRuleId) {
      const updated: PortionRule = {
        id: editingRuleId,
        ...ruleForm,
        updatedAt: new Date().toISOString(),
        createdAt: rules.find(r => r.id === editingRuleId)?.createdAt || new Date().toISOString()
      };
      store.updatePortionRule(updated);
    } else {
      if (rules.some(r => r.productId === ruleForm.productId)) {
        alert("Ya existe una norma técnica para este producto.");
        return;
      }
      const created: PortionRule = {
        id: 'rule-' + Math.random().toString(36).substr(2, 9),
        ...ruleForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.addPortionRule(created);
    }

    setShowRuleModal(false);
    handleRefresh();
  };

  const handleDeleteRule = (id: string) => {
    if (confirm("¿Eliminar norma técnica de porcionamiento?")) {
      store.deletePortionRule(id);
      handleRefresh();
    }
  };

  // Batches manual creations (Fallback)
  const handleOpenNewBatch = () => {
    const activeRules = rules.filter(r => r.isActive);
    if (activeRules.length === 0) {
      alert("Configure primero normas técnicas de porciones.");
      return;
    }
    setBatchForm({
      productId: activeRules[0].productId,
      purchaseId: '',
      quantityPurchased: 10,
      comment: ''
    });
    setShowBatchModal(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const rule = rules.find(r => r.productId === batchForm.productId && r.isActive);
    if (!rule) {
      alert("Norma técnica no encontrada o inactiva");
      return;
    }

    const prod = products.find(p => p.id === batchForm.productId);
    if (!prod) return;

    const baseQuantity = batchForm.quantityPurchased * rule.conversionFactor;
    const theoreticalPortions = Math.floor(baseQuantity / rule.standardPortionSize);
    const totalCost = prod.averageCost * batchForm.quantityPurchased;
    const estimatedCostPerPortion = theoreticalPortions > 0 ? Math.round((totalCost / theoreticalPortions) * 100) / 100 : 0;

    const newBatch: PortionBatch = {
      id: 'batch-m-' + Math.random().toString(36).substr(2, 9),
      purchaseId: batchForm.purchaseId || undefined,
      productId: batchForm.productId,
      quantityPurchased: batchForm.quantityPurchased,
      purchaseUnit: units.find(u => u.id === rule.purchaseUnitId)?.code || 'lb',
      baseQuantity,
      baseUnit: units.find(u => u.id === rule.baseUnitId)?.code || 'oz',
      standardPortionSize: rule.standardPortionSize,
      theoreticalPortions,
      realPortions: 0,
      differencePortions: 0,
      expectedYieldPercentage: rule.expectedYieldPercentage,
      realYieldPercentage: 0,
      totalCost,
      estimatedCostPerPortion,
      realCostPerPortion: estimatedCostPerPortion,
      status: 'PENDING',
      responsibleUserId: currentUser.id,
      createdAt: new Date().toISOString()
    };

    store.addPortionBatch(newBatch);
    setShowBatchModal(false);
    handleRefresh();
  };

  // Batch Actions
  const handleStartBatch = (id: string) => {
    store.startPortionBatch(id);
    handleRefresh();
  };

  const handleOpenRealCount = (batch: PortionBatch) => {
    setShowRealCountModal(batch);
    setRealPortionsCount(batch.theoreticalPortions);
    setRealCountComment('');
  };

  const handleSaveRealCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRealCountModal) return;

    const diff = realPortionsCount - showRealCountModal.theoreticalPortions;
    if (diff !== 0 && !realCountComment.trim()) {
      alert("Por favor proporcione una justificación para la diferencia");
      return;
    }

    const scrapImage = diff < 0 ? "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80" : undefined;

    store.registerRealPortions(
      showRealCountModal.id,
      realPortionsCount,
      realCountComment,
      scrapImage
    );

    setShowRealCountModal(null);
    handleRefresh();
  };

  const handleApproveBatch = (batch: PortionBatch) => {
    store.approvePortionBatch(batch.id, currentUser.id, currentUser.name);
    handleRefresh();
  };

  const handleOpenReject = (batch: PortionBatch) => {
    setShowRejectModal(batch);
    setRejectionComment('');
  };

  const handleSaveReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRejectModal) return;
    if (!rejectionComment.trim()) {
      alert("Proporcione un motivo para el rechazo");
      return;
    }
    store.rejectPortionBatch(showRejectModal.id, rejectionComment, currentUser.id, currentUser.name);
    setShowRejectModal(null);
    handleRefresh();
  };

  // Chef manual adjustment handler (REGLA CRÍTICA)
  const handleOpenManualMovement = (pid: string) => {
    setMovementForm({
      productId: pid,
      movementType: 'PORTION_WASTE',
      quantity: 1,
      adjustmentDirection: 'Faltante (-)',
      reason: '',
      comment: '',
      responsibleName: currentUser.name
    });
    setShowMovementModal(true);
  };

  const handleSaveManualMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === movementForm.productId);
    if (!prod) return;

    if (!movementForm.reason.trim() || !movementForm.comment.trim()) {
      alert("Fecha, motivo y comentario detallado son obligatorios.");
      return;
    }

    let finalQty = movementForm.quantity;
    if (movementForm.movementType === 'PORTION_WASTE' || movementForm.movementType === 'PORTION_INTERNAL_CONSUMPTION') {
      finalQty = -Math.abs(movementForm.quantity);
    } else {
      // Adjustment direction
      if (movementForm.adjustmentDirection === 'Faltante (-)') {
        finalQty = -Math.abs(movementForm.quantity);
      } else {
        finalQty = Math.abs(movementForm.quantity);
      }
    }

    store.addPortionMovement({
      id: 'pmov-m-' + Math.random().toString(36).substr(2, 9),
      productId: movementForm.productId,
      movementType: movementForm.movementType,
      quantity: finalQty,
      reason: movementForm.reason,
      userId: currentUser.id,
      userName: movementForm.responsibleName,
      comment: movementForm.comment,
      createdAt: new Date().toISOString()
    });

    setShowMovementModal(false);
    handleRefresh();
    alert("¡Movimiento de pieza asentado y auditado con éxito!");
  };

  // Recipe CRUD
  const handleOpenNewRecipe = () => {
    const defaultProd = products[0]?.id || '';
    setRecipeForm({ name: '', price: 350, ingredients: [] });
    setNewIngredient({ productId: defaultProd, quantity: 1, isPortion: true });
    setShowRecipeModal(true);
  };

  const handleAddIngredientRow = () => {
    if (!newIngredient.productId) return;
    const exists = recipeForm.ingredients.some(i => i.productId === newIngredient.productId && i.isPortion === newIngredient.isPortion);
    if (exists) {
      alert("Este ingrediente ya está agregado.");
      return;
    }
    setRecipeForm({
      ...recipeForm,
      ingredients: [...recipeForm.ingredients, { ...newIngredient }]
    });
  };

  const handleRemoveIngredientRow = (idx: number) => {
    setRecipeForm({
      ...recipeForm,
      ingredients: recipeForm.ingredients.filter((_, i) => i !== idx)
    });
  };

  const handleSaveRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeForm.name.trim()) {
      alert("Proporcione un nombre para el plato.");
      return;
    }
    if (recipeForm.ingredients.length === 0) {
      alert("Agregue al menos un ingrediente a la receta.");
      return;
    }

    const created: Recipe = {
      id: 'rec-' + Math.random().toString(36).substr(2, 9),
      ...recipeForm
    };

    store.addRecipe(created);
    setShowRecipeModal(false);
    handleRefresh();
  };

  const handleDeleteRecipe = (id: string) => {
    if (confirm("¿Eliminar esta receta?")) {
      store.deleteRecipe(id);
      handleRefresh();
    }
  };

  // Sales captures
  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();

    if (saleForm.isRecipe) {
      if (!saleForm.recipeId) {
        alert("Seleccione una receta");
        return;
      }
      store.registerRecipeSale(
        saleForm.recipeId,
        saleForm.portionsSold,
        saleForm.channel,
        saleForm.reference || undefined
      );
    } else {
      if (!saleForm.productId) {
        alert("Seleccione un producto");
        return;
      }
      const p = products.find(prod => prod.id === saleForm.productId);
      const available = p?.portionsAvailable || 0;
      if (available < saleForm.portionsSold) {
        if (!confirm(`La cantidad sold (${saleForm.portionsSold}) excede el remanente en cocina (${available}). ¿Forzar venta?`)) {
          return;
        }
      }

      const newSale: PortionSale = {
        id: 'sale-' + Math.random().toString(36).substr(2, 9),
        productId: saleForm.productId,
        saleDate: new Date().toISOString(),
        portionsSold: saleForm.portionsSold,
        channel: saleForm.channel,
        reference: saleForm.reference || undefined,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: new Date().toISOString()
      };
      store.addPortionSale(newSale);
    }

    setShowSaleModal(false);
    handleRefresh();
  };

  // CSV sales processor
  const handleImportCSVInSeconds = () => {
    setCsvError(null);
    setCsvSuccess(null);

    try {
      const lines = csvText.split('\n');
      if (lines.length <= 1) {
        throw new Error("El texto del archivo está vacío.");
      }

      const header = lines[0].toLowerCase().trim().split(',');
      const nameIdx = header.indexOf('nombre_producto');
      const qtyIdx = header.indexOf('cantidad');
      const channelIdx = header.indexOf('canal');
      const refIdx = header.indexOf('referencia');

      if (nameIdx === -1 || qtyIdx === -1) {
        throw new Error("CSV inválido. Columnas requeridas: nombre_producto, cantidad");
      }

      let count = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',');
        const prodName = cols[nameIdx]?.trim();
        const qtyStr = cols[qtyIdx]?.trim();
        if (!prodName || !qtyStr) continue;

        const qtyParsed = parseInt(qtyStr, 10);
        if (isNaN(qtyParsed) || qtyParsed <= 0) continue;

        // Try to match product
        const matchProd = products.find(p => p.name.toLowerCase().includes(prodName.toLowerCase()));
        if (matchProd) {
          const finalChannel = channelIdx !== -1 && cols[channelIdx] ? cols[channelIdx].toUpperCase() as SalesChannel : 'RESTAURANT';
          const pRef = refIdx !== -1 && cols[refIdx] ? cols[refIdx].trim() : 'CSV Import';

          const newSale: PortionSale = {
            id: 'sale-imp-' + Math.random().toString(36).substr(2, 9),
            productId: matchProd.id,
            saleDate: new Date().toISOString(),
            portionsSold: qtyParsed,
            channel: finalChannel,
            reference: pRef,
            userId: currentUser.id,
            userName: currentUser.name,
            createdAt: new Date().toISOString()
          };
          store.addPortionSale(newSale);
          count++;
        }
      }

      if (count > 0) {
        setCsvSuccess(`¡Se procesaron ${count} ventas exitosamente mediante el cruce de kárdex!`);
        setCsvText("nombre_producto,cantidad,canal,referencia\n");
        handleRefresh();
      } else {
        throw new Error("Ningún nombre coincidió con productos con porciones.");
      }
    } catch (err: any) {
      setCsvError(err.message || "Error al procesar archivo.");
    }
  };

  // Daily Closings Handlers
  const handleSaveDailyClose = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there is already a close
    const existing = dailyCloses.find(c => c.date === selectedCloseDate);
    if (existing) {
      alert("Ya se ha registrado y sellado un cierre para este día.");
      return;
    }

    const itemsToClose: KitchenDailyCloseItem[] = [];
    let validationFailed = false;

    portionConfiguredProducts.forEach(p => {
      const fieldData = closeFields[p.id] || { physicalCount: p.portionsAvailable || 0 };
      const expected = calculateExpectedForDate(p.id, selectedCloseDate);
      const physical = fieldData.physicalCount;
      const difference = physical - expected;

      // Get avg portion cost
      const rule = rules.find(r => r.productId === p.id);
      const appBatches = batches.filter(b => b.productId === p.id && b.status === 'APPROVED');
      const costPerPortion = appBatches.length > 0 ? (appBatches.reduce((acc, curr) => acc + curr.totalCost, 0) / appBatches.reduce((acc, curr) => acc + curr.realPortions, 0)) : (p.averageCost / (rule?.conversionFactor || 16)) * (rule?.standardPortionSize || 8);

      if (difference !== 0) {
        if (!fieldData.reason || !fieldData.comment?.trim()) {
          alert(`La diferencia de conteo para ${p.name} requiere obligatoriamente motivo y explicación detallada.`);
          validationFailed = true;
          return;
        }
      }

      itemsToClose.push({
        productId: p.id,
        productName: p.name,
        initialPortions: calculateInitialForDate(p.id, selectedCloseDate),
        producedPortions: calculateProducedForDate(p.id, selectedCloseDate),
        soldPortions: calculateSoldForDate(p.id, selectedCloseDate),
        wastedPortions: calculateWastedForDate(p.id, selectedCloseDate),
        internalConsumptionPortions: calculateInternalForDate(p.id, selectedCloseDate),
        courtesyPortions: calculateCourtesyForDate(p.id, selectedCloseDate),
        adjustedPortions: calculateAdjustmentsForDate(p.id, selectedCloseDate),
        expectedClosingPortions: expected,
        physicalCountingPortions: physical,
        difference,
        differenceValue: Math.round((difference * costPerPortion) * 100) / 100,
        reason: fieldData.reason,
        comment: fieldData.comment
      });
    });

    if (validationFailed) return;

    const newClose: KitchenDailyClose = {
      id: 'close-' + Math.random().toString(36).substr(2, 9),
      date: selectedCloseDate,
      closedAt: new Date().toISOString(),
      closedByUserId: currentUser.id,
      closedByUserName: currentUser.name,
      items: itemsToClose,
      isClosed: true,
      notes: closingNotes
    };

    store.addDailyClose(newClose);
    setClosingNotes('');
    setCloseFields({});
    handleRefresh();
    alert(`Día ${selectedCloseDate} cerrado y sellado con éxito. Se realizaron los ajustes de porciones automáticos.`);
  };

  // Helper closing calculations
  const calculateInitialForDate = (productId: string, dateStr: string): number => {
    // Dynamically roll back standard stock to the beginning of the day (dateStr)
    const expected = calculateExpectedForDate(productId, dateStr);
    const prod = calculateProducedForDate(productId, dateStr);
    const sold = calculateSoldForDate(productId, dateStr);
    const waste = calculateWastedForDate(productId, dateStr);
    const internal = calculateInternalForDate(productId, dateStr);
    const courtesy = calculateCourtesyForDate(productId, dateStr);
    const adj = calculateAdjustmentsForDate(productId, dateStr);

    return Math.max(0, expected - prod + sold + waste + internal + courtesy - adj);
  };

  const calculateProducedForDate = (productId: string, dateStr: string): number => {
    return batches
      .filter(b => b.productId === productId && b.status === 'APPROVED' && b.approvedAt?.startsWith(dateStr))
      .reduce((acc, b) => acc + b.realPortions, 0);
  };

  const calculateSoldForDate = (productId: string, dateStr: string): number => {
    return movements
      .filter(m => m.productId === productId && m.movementType === 'PORTION_SALE' && m.createdAt.startsWith(dateStr))
      .reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  };

  const calculateWastedForDate = (productId: string, dateStr: string): number => {
    return movements
      .filter(m => m.productId === productId && m.movementType === 'PORTION_WASTE' && m.createdAt.startsWith(dateStr))
      .reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  };

  const calculateInternalForDate = (productId: string, dateStr: string): number => {
    return movements
      .filter(m => m.productId === productId && m.movementType === 'PORTION_INTERNAL_CONSUMPTION' && m.createdAt.startsWith(dateStr))
      .reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  };

  const calculateCourtesyForDate = (productId: string, dateStr: string): number => {
    // Handled under other internal channels or returns
    return sales
      .filter(s => s.productId === productId && s.saleDate.startsWith(dateStr) && s.channel === 'COMPLIMENTARY')
      .reduce((acc, s) => acc + s.portionsSold, 0);
  };

  const calculateAdjustmentsForDate = (productId: string, dateStr: string): number => {
    return movements
      .filter(m => m.productId === productId && m.movementType === 'PORTION_ADJUSTMENT' && m.createdAt.startsWith(dateStr))
      .reduce((acc, m) => acc + m.quantity, 0);
  };

  const calculateExpectedForDate = (productId: string, dateStr: string): number => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return 0;
    // Current stock is our dynamic real-time target
    return p.portionsAvailable || 0;
  };

  // General statistics
  const totalPortionsInStock = products.reduce((acc, p) => acc + (p.portionsAvailable || 0), 0);
  const approvedBatchesCount = batches.filter(b => b.status === 'APPROVED').length;
  const totalPortionsProduced = batches.filter(b => b.status === 'APPROVED').reduce((acc, b) => acc + b.realPortions, 0);
  const totalSalesCount = sales.reduce((acc, s) => acc + s.portionsSold, 0);
  const totalWasteCount = movements.filter(m => m.movementType === 'PORTION_WASTE').reduce((acc, m) => acc + Math.abs(m.quantity), 0);

  // Lists filtered for display
  const portionConfiguredProducts = products.filter(p => rules.some(r => r.productId === p.id));
  const lowPortionsCount = portionConfiguredProducts.filter(p => (p.portionsAvailable || 0) < 15);

  const filteredRules = rules.filter(r => {
    const p = products.find(prod => prod.id === r.productId);
    return !searchQuery || p?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredBatches = batches.filter(b => {
    const p = products.find(prod => prod.id === b.productId);
    return !searchQuery || p?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredMovements = movements.filter(m => {
    const p = products.find(prod => prod.id === m.productId);
    return !searchQuery || p?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredRecipes = recipes.filter(r => {
    return !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6" id="portion-operational-viewport">
      {/* Header Context Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="bg-orange-50 text-orange-600 border border-orange-200 py-0.5 px-2.5 rounded-full font-sans text-[10px] uppercase font-extrabold tracking-wider">
            Módulo Operacional y Cuadre de Cocina
          </span>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-slate-800 mt-1">
            Porcionamiento, Rendimiento y Control Contra Ventas
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Gestión fluida desde la recepción de materia prima hasta el cuadre y sellado final con el inventario de porciones.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-center">
          <button
            onClick={handleRefresh}
            className="p-1.5 px-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-xs font-bold font-sans bg-white"
          >
            Sincronizar Datos
          </button>
          
          <button
            onClick={handleOpenNewBatch}
            className="bg-orange-600 text-white p-1.5 px-4 font-bold rounded-xl text-xs hover:bg-orange-700 transition flex items-center gap-1 shadow-sm shadow-orange-600/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Pedido de Porcionas
          </button>
        </div>
      </div>

      {/* METRICS QUICK STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Porciones Disponibles (Cocina)</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-slate-800 font-display">{totalPortionsInStock}</span>
            <span className="text-slate-450 text-xs">pz</span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium">Inventario libre de uso inmediato</span>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lotes Procesados</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-slate-800 font-display">{approvedBatchesCount}</span>
            <span className="text-slate-450 text-xs">lotes</span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium">Equivalente a {totalPortionsProduced} pz</span>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ventas de Clientes</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-blue-700 font-display">{totalSalesCount}</span>
            <span className="text-slate-450 text-xs">pz</span>
          </div>
          <span className="text-[9.5px] text-blue-500 font-medium">Cruzados físicamente vs POS</span>
        </div>

        <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mermas de Almacén</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-red-650 font-display">{totalWasteCount}</span>
            <span className="text-slate-450 text-xs">pz</span>
          </div>
          <span className="text-[9.5px] text-slate-400 font-medium font-mono">Consumo o pérdida no facturada</span>
        </div>
      </div>

      {/* DETAILED CHIEF ALERTS */}
      {lowPortionsCount.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-2.5 text-xs text-amber-805" id="alert-strip">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-900 leading-tight">Alerta de Porción en Cocina por debajo del mínimo:</p>
            <div className="flex flex-wrap gap-x-4 mt-1 font-semibold">
              {lowPortionsCount.map(p => (
                <div key={p.id} className="flex items-center gap-1">
                  <span>{p.name}:</span>
                  <span className="bg-amber-150 py-0.2 px-1.5 rounded text-amber-900 font-extrabold">{p.portionsAvailable || 0} pz</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TABS NAVIGATION BAR */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4 overflow-x-auto select-none" id="subtabs-bar">
          <button
            onClick={() => { setActiveSubTab('dashboard'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'dashboard' ? 'text-orange-600 border-b-2 border-orange-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setActiveSubTab('lotes'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'lotes' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mercancía / Lotes ({batches.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('reglas'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'reglas' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Normas Técnicas ({rules.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('inventario_cocina'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'inventario_cocina' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Inventario Operativo de Cocina
          </button>
          <button
            onClick={() => { setActiveSubTab('recetas'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'recetas' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Recetas y Descuentos ({recipes.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('ventas'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'ventas' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Cruce de Ventas y CSV
          </button>
          <button
            onClick={() => { setActiveSubTab('cierres'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'cierres' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Cierre Diario de Cocina ({dailyCloses.length})
          </button>
          <button
            onClick={() => { setActiveSubTab('historial'); setSearchQuery(''); }}
            className={`pb-2.5 text-xs font-bold transition whitespace-nowrap ${activeSubTab === 'historial' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Kárdex de Movimientos
          </button>
        </div>
      </div>

      {activeSubTab !== 'dashboard' && activeSubTab !== 'cierres' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 pl-9 w-full bg-white border rounded-xl text-xs"
            placeholder="Buscar por producto..."
          />
        </div>
      )}

      {/* SUB-TABS VIEWS RENDERING */}

      {/* TAB 1: DASHBOARD METRICS */}
      {activeSubTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
            <h4 className="font-semibold text-slate-800 text-sm">Rendimientos Reales de Proteínas</h4>
            <div className="h-44 flex items-end justify-between gap-3 pt-4">
              {portionConfiguredProducts.map(p => {
                const rule = rules.find(r => r.productId === p.id);
                const pBatches = batches.filter(b => b.productId === p.id && b.status === 'APPROVED');
                const real = pBatches.length > 0 ? Math.round(pBatches.reduce((acc, cr) => acc + cr.realYieldPercentage, 0) / pBatches.length) : 0;
                const expected = rule ? rule.expectedYieldPercentage : 90;

                return (
                  <div key={p.id} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="flex items-end gap-1 h-28 w-full justify-center">
                      <div className="w-3 bg-slate-205 rounded-t" style={{ height: `${expected}%` }} title={`Esperado: ${expected}%`}></div>
                      <div className={`w-3 rounded-t ${real >= expected ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ height: `${real || 15}%` }} title={`Real: ${real}%`}></div>
                    </div>
                    <span className="text-[9px] text-slate-500 truncate w-full text-center mt-1 font-bold">{p.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-extrabold">{real || 0}%</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-200 block rounded"></span> Esperado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 block rounded"></span> Real Logrado</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
            <h4 className="font-semibold text-slate-800 text-sm">Distribución de Consumo</h4>
            <div className="h-44 flex items-center justify-around">
              <div className="w-20 h-20 rounded-full border-8 border-orange-500 flex items-center justify-center font-bold text-xs">
                {totalSalesCount} pz
              </div>
              <div className="space-y-1.5 text-[10px] text-slate-600 font-semibold">
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 block rounded-full"></span> Restaurante: {sales.filter(s => s.channel === 'RESTAURANT').reduce((acc, s) => acc + s.portionsSold, 0)} pz</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 block rounded-full"></span> Delivery: {sales.filter(s => s.channel === 'DELIVERY').reduce((acc, s) => acc + s.portionsSold, 0)} pz</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 block rounded-full"></span> Cortesía / Otros: {sales.filter(s => ['INTERNAL_CONSUMPTION', 'COMPLIMENTARY'].includes(s.channel)).reduce((acc, s) => acc + s.portionsSold, 0)} pz</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 block rounded-full"></span> Pérdidas / Merma: {totalWasteCount} pz</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl border shadow-sm space-y-3 flex flex-col justify-between">
            <div>
              <h4 className="font-semibold text-orange-400 text-sm font-display">Control Operativo de Cocina</h4>
              <p className="text-[11px] text-slate-350 leading-relaxed mt-2">
                Este módulo le permite mantener un control estricto de los alimentos que se transformen de volumen o peso bruto (lb) a porciones listas (piezas/oz). Toda venta, pérdida u omisión se deduce auditadamente, evitando el desvío silencioso y optimizando los costos de alimentos del restaurante.
              </p>
            </div>
            <div className="p-2 border border-slate-800 bg-slate-950/60 rounded-xl text-[10px] flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <span>Use los botones superiores para registrar porcionamientos manuales.</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PORTION LOTES - MERCANCIA BATCHES */}
      {activeSubTab === 'lotes' && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" id="lotesTableBox">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-semibold text-slate-800 text-xs">Lotes de Porcionamiento Recibidos (Materia Prima)</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Registre cortes reales, desperdicios y mermas bio</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 text-slate-400 font-semibold border-b border-slate-150 uppercase tracking-wider">
                  <th className="p-3">Factura / ID Lote</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-center">Cant Recibida</th>
                  <th className="p-3 text-center">Porción Std</th>
                  <th className="p-3 text-center">Rendimiento Esperado</th>
                  <th className="p-3 text-center">Est. Teórico (Porciones)</th>
                  <th className="p-3 text-center">Real Obtenido</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones de Cocina</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">No hay lotes de porcionamiento registrados.</td>
                  </tr>
                ) : (
                  filteredBatches.map(b => {
                    const p = products.find(prod => prod.id === b.productId);
                    const rule = rules.find(r => r.productId === b.productId);

                    return (
                      <tr key={b.id} className="hover:bg-slate-55/40 text-slate-700">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{b.purchaseId ? `COMPR-${b.purchaseId.split('-')[1] || b.purchaseId}` : 'MANUAL'}</p>
                          <span className="text-[10px] text-slate-400 block font-mono">ID: {b.id}</span>
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{p ? p.name : '—'}</p>
                          <span className="text-[9.5px] text-slate-400">Conversión: {rule?.conversionFactor} {rule ? units.find(u => u.id === rule.baseUnitId)?.code : ''} / {units.find(u => u.id === b.productId)?.code} </span>
                        </td>
                        <td className="p-3 text-center font-bold">{b.quantityPurchased} {b.purchaseUnit}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{b.standardPortionSize} {b.baseUnit}</td>
                        <td className="p-3 text-center font-semibold text-slate-500">{b.expectedYieldPercentage}% ({rule?.expectedWastePercentage || 0}% merma std)</td>
                        <td className="p-3 text-center font-bold bg-slate-50/50 text-slate-800">{b.theoreticalPortions} pz</td>
                        <td className="p-3 text-center font-bold font-mono text-sm">
                          {b.status === 'APPROVED' || b.status === 'PORTIONED' ? (
                            <span className={b.differencePortions < 0 ? 'text-red-600' : 'text-emerald-700'}>{b.realPortions} pz</span>
                          ) : (
                            <span className="text-slate-400 italic">Pendiente</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            b.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800' :
                            b.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            b.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse' :
                            b.status === 'PORTIONED' ? 'bg-indigo-50 text-indigo-800' : 'bg-red-50 text-red-800'
                          }`}>
                            {b.status === 'PENDING' ? 'Pendiente' :
                             b.status === 'IN_PROGRESS' ? 'En Proceso' :
                             b.status === 'PORTIONED' ? 'Porcionado' :
                             b.status === 'REJECTED' ? 'Rechazado' : 'Aprobado'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          {b.status === 'PENDING' && (
                            <button
                              onClick={() => handleStartBatch(b.id)}
                              className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition inline-flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Iniciar
                            </button>
                          )}
                          {b.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleOpenRealCount(b)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition inline-flex items-center gap-1"
                            >
                              Registrar Corte Real
                            </button>
                          )}
                          {b.status === 'PORTIONED' && (
                            <>
                              <button
                                onClick={() => handleApproveBatch(b)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg transition"
                              >
                                Autorizar Ingreso
                              </button>
                              <button
                                onClick={() => handleOpenReject(b)}
                                className="bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 text-[10px] font-bold py-1 px-2.5 rounded-lg transition"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {b.status === 'APPROVED' && (
                            <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 justify-end">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Auditado
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
        </div>
      )}

      {/* TAB 3: PORTION RULES */}
      {activeSubTab === 'reglas' && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" id="rulesTableBox">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h4 className="font-semibold text-slate-800 text-xs">Normas Técnicas y Coeficientes Generales de Alimentos</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5">Establezca mermas tolerables de porcionado para proteínas y vegetales</p>
            </div>
            <button
              onClick={handleOpenNewRule}
              className="bg-orange-605 text-white text-[10.5px] font-bold px-3 py-1 rounded hover:bg-orange-700 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar Norma
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/60 text-slate-400 font-bold uppercase tracking-wider border-b">
                  <th className="p-3">Producto Insumo</th>
                  <th className="p-3">Unidad Compra</th>
                  <th className="p-3">Unidad Base</th>
                  <th className="p-3">Porción Estándar</th>
                  <th className="p-3 text-center">Conversión Estimada</th>
                  <th className="p-3 text-center">Rendimiento (%)</th>
                  <th className="p-3 text-center">Merma Máx Soportada (%)</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">No hay normas configuradas.</td>
                  </tr>
                ) : (
                  filteredRules.map(r => {
                    const p = products.find(prod => prod.id === r.productId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-55/40">
                        <td className="p-3 font-bold text-slate-800">{p ? p.name : '—'}</td>
                        <td className="p-3">{units.find(u => u.id === r.purchaseUnitId)?.name || 'lb'}</td>
                        <td className="p-3">{units.find(u => u.id === r.baseUnitId)?.name || 'oz'}</td>
                        <td className="p-3 font-bold text-orange-600">{r.standardPortionSize} oz</td>
                        <td className="p-3 text-center font-mono">1 {units.find(u => u.id === r.purchaseUnitId)?.code || 'lb'} = {r.conversionFactor} {units.find(u => u.id === r.baseUnitId)?.code || 'oz'}</td>
                        <td className="p-3 text-center text-emerald-700 font-bold">{r.expectedYieldPercentage}%</td>
                        <td className="p-3 text-center text-red-650 font-bold">{r.expectedWastePercentage}%</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${r.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                            {r.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditRule(r)}
                            className="text-indigo-600 hover:text-indigo-900 font-bold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteRule(r.id)}
                            className="text-red-600 hover:text-red-900 font-bold"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL KITCHEN INVENTORY */}
      {activeSubTab === 'inventario_cocina' && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" id="operationalInventoryBox">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h4 className="font-semibold text-slate-800 text-xs">Inventario Operativo de Porciones (Cocina)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Control directo de piezas en ready-to-cook. <strong>Regla Crítica:</strong> Modificaciones prohibidas; registración requerida de pérdidas.</p>
            </div>
            <button
              onClick={() => handleOpenManualMovement(portionConfiguredProducts[0]?.id || '')}
              className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold p-1.5 px-4 rounded-xl shadow transition"
              disabled={portionConfiguredProducts.length === 0}
            >
              Registrar Movimiento manual de Merma/Consumo
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-105/50 border-b text-slate-400 font-bold uppercase tracking-wider text-[9.5px]">
                  <th className="p-3.5">Producto Porcionado</th>
                  <th className="p-3.5">Tamaño de Porción</th>
                  <th className="p-3.5 text-center">Porciones Disponibles</th>
                  <th className="p-3.5 text-center">Costo Unitario / Porción</th>
                  <th className="p-3.5 text-center">Valor Total Cocina</th>
                  <th className="p-3.5">Área de Conservación</th>
                  <th className="p-3.5">Último Movimiento registrado</th>
                  <th className="p-3.5 text-center">Estado Alerta</th>
                  <th className="p-3.5 text-right">Acción Auditada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {portionConfiguredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 italic">No hay productos en porciones de cocina activos.</td>
                  </tr>
                ) : (
                  portionConfiguredProducts.map(p => {
                    const rule = rules.find(r => r.productId === p.id);
                    const count = p.portionsAvailable || 0;

                    // Calculate average portion price based on latest APPROVED batches
                    const pBatches = batches.filter(b => b.productId === p.id && b.status === 'APPROVED');
                    const avgCost = pBatches.length > 0
                      ? (pBatches.reduce((acc, cr) => acc + cr.totalCost, 0) / pBatches.reduce((acc, cr) => acc + cr.realPortions, 0))
                      : (p.averageCost / (rule?.conversionFactor || 16)) * (rule?.standardPortionSize || 8);
                     
                    const totalVal = Math.round((count * avgCost) * 100) / 100;

                    // Latest movement on this product
                    const latestMov = movements.find(m => m.productId === p.id);

                    return (
                      <tr key={p.id} className="hover:bg-slate-55/35">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <span className="text-[9.5px] text-slate-400">Ref: {p.id}</span>
                        </td>
                        <td className="p-3.5 font-bold text-indigo-600">{rule ? rule.standardPortionSize : '8'} oz</td>
                        <td className="p-3.5 text-center block pt-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold leading-none ${count > 15 ? 'bg-emerald-55 text-emerald-800' : 'bg-red-50 text-red-800 border'}`}>
                            {count} pz
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold">RD${Math.round(avgCost * 100) / 100}</td>
                        <td className="p-3.5 text-center font-bold text-slate-800">RD${totalVal.toLocaleString('es-DO')}</td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 border px-2 py-0.5 rounded text-[10px] text-slate-600 font-bold block w-fit">
                            {p.categoryId === 'cat-1' ? 'Congelados - Cong1' : 'Refrigerados - Ref2'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[10.5px]">
                          {latestMov ? (
                            <div>
                              <p className="font-bold text-slate-700">{latestMov.movementType.replace('PORTION_', '')} ({latestMov.quantity > 0 ? '+' : ''}{latestMov.quantity} pz)</p>
                              <span className="text-[9px] text-slate-400 block font-normal">{new Date(latestMov.createdAt).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No hay registros</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          {count < 15 ? (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-extrabold text-[9px] border border-amber-200">
                              STOCK CRÍTICO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold text-[9px]">
                              NORMAL
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenManualMovement(p.id)}
                            className="py-1 px-2.5 bg-slate-50 border hover:bg-slate-150 inline-flex items-center gap-1 text-[10px] rounded-lg transition text-slate-650 font-bold"
                          >
                            Ingresar Ajuste
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RECIPES */}
      {activeSubTab === 'recetas' && (
        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden" id="recipesTableBox">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-800 text-xs">Especificación de Recetario y Fórmulas de Plato</h4>
              <p className="text-[9.5px] text-slate-400 mt-0.5">La venta de estos platos deducirá de forma automatizada las porciones de cocina listas para venta</p>
            </div>
            <button
              onClick={handleOpenNewRecipe}
              className="bg-indigo-600 text-white text-[10.5px] font-bold px-3 py-1 rounded hover:bg-indigo-700 transition"
            >
              Nueva Receta de Plato
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredRecipes.length === 0 ? (
              <p className="p-8 text-center text-slate-400 italic col-span-full">No hay platos configurados en el recetario.</p>
            ) : (
              filteredRecipes.map(r => (
                <div key={r.id} className="border rounded-2xl p-4 bg-slate-50/20 relative space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-slate-900 font-display text-sm leading-tight">{r.name}</h5>
                      <span className="text-[10px] text-indigo-600 font-bold">Precio POS: RD${r.price}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteRecipe(r.id)}
                      className="text-red-400 hover:text-red-650 p-1"
                      title="Eliminar Receta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1 bg-white border p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-450 uppercase block">Ingredientes de Descuento:</p>
                    <ul className="text-[10.5px] space-y-1 font-medium text-slate-700">
                      {r.ingredients.map((ing, i) => {
                        const prod = products.find(p => p.id === ing.productId);
                        return (
                          <li key={i} className="flex justify-between border-b last:border-0 border-slate-100 pb-1 last:pb-0">
                            <span>{prod ? prod.name : '—'}</span>
                            <span className="font-bold text-slate-800">
                              {ing.quantity} {ing.isPortion ? 'porción' : 'unidades'}
                            </span>
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

      {/* TAB 6: SALES CROSS AND CSV */}
      {activeSubTab === 'ventas' && (
        <div className="space-y-6" id="salesCrossoverBox">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-semibold text-slate-800 text-xs">Registrar Venta de Platillo Manual</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed -mt-2">Establezca cargos de mesa, cortesía del personal o despachos directamente desde la barra de cocina.</p>
              
              <form onSubmit={handleSaveSale} className="space-y-3 font-sans text-xs">
                <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSaleForm({ ...saleForm, isRecipe: false })}
                    className={`flex-1 text-center py-1 rounded-lg font-bold text-[10px] transition ${!saleForm.isRecipe ? 'bg-white shadow text-slate-800' : 'text-slate-405'}`}
                  >
                    Porción Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleForm({ ...saleForm, isRecipe: true })}
                    className={`flex-1 text-center py-1 rounded-lg font-bold text-[10px] transition ${saleForm.isRecipe ? 'bg-white shadow text-indigo-700' : 'text-slate-405'}`}
                  >
                    Plato de la Receta
                  </button>
                </div>

                {!saleForm.isRecipe ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Producto de Porciones:</label>
                    <select
                      value={saleForm.productId}
                      onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value })}
                      className="w-full p-2 border rounded-xl font-semibold text-xs"
                      required
                    >
                      <option value="">— Elegir Producto —</option>
                      {portionConfiguredProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.portionsAvailable || 0} pz disp)</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Receta de Plato:</label>
                    <select
                      value={saleForm.recipeId}
                      onChange={(e) => setSaleForm({ ...saleForm, recipeId: e.target.value })}
                      className="w-full p-2 border rounded-xl font-semibold text-xs"
                      required
                    >
                      <option value="">— Elegir Receta —</option>
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>{r.name} (RD${r.price})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Cantidad Vendida:</label>
                    <input
                      type="number"
                      value={saleForm.portionsSold}
                      onChange={(e) => setSaleForm({ ...saleForm, portionsSold: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full p-2 border rounded-xl font-bold font-mono"
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Canal:</label>
                    <select
                      value={saleForm.channel}
                      onChange={(e) => setSaleForm({ ...saleForm, channel: e.target.value as SalesChannel })}
                      className="w-full p-2 border rounded-xl font-bold text-xs"
                    >
                      <option value="RESTAURANT">Restaurante</option>
                      <option value="DELIVERY">Delivery</option>
                      <option value="INTERNAL_CONSUMPTION">Chef/Personal</option>
                      <option value="COMPLIMENTARY">Cortesía</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Referencia / Mesa:</label>
                  <input
                    type="text"
                    value={saleForm.reference}
                    onChange={(e) => setSaleForm({ ...saleForm, reference: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                    placeholder="Mesa 4 / Pedido #324"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl transition mt-2 shadow"
                >
                  Registrar Despacho de Venta
                </button>
              </form>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4 col-span-2">
              <h4 className="font-semibold text-slate-800 text-xs">Importar Cierre de Ventas Diario (CSV / Excel)</h4>
              <p className="text-[10.5px] text-slate-400 leading-relaxed -mt-2">Suba el archivo de ventas diario desde su sistema POS o pegue el texto separado por comas directamente abajo.</p>

              <div className="space-y-3">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-2.5 h-32 bg-slate-50 border font-mono text-[10px] rounded-xl focus:ring-1 focus:ring-orange-600"
                />

                {csvError && <div className="p-2 border border-red-200 bg-red-50 text-red-800 text-[10.5px] font-bold rounded-xl">{csvError}</div>}
                {csvSuccess && <div className="p-2 bg-emerald-50 text-emerald-800 text-[10.5px] border border-emerald-200 font-bold rounded-xl">{csvSuccess}</div>}

                <div className="flex justify-between items-center gap-2">
                  <span className="text-[9.5px] text-slate-400 font-bold font-mono">Formato requerido: fecha, nombre_producto, cantidad, canal, referencia</span>
                  <button
                    onClick={handleImportCSVInSeconds}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white text-[11px] font-bold py-1.5 px-4 rounded-xl shadow-md transition"
                  >
                    Procesar Listado de Ventas
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 7: DAILY CLOSING (CIERRE DIARIO DE COCINA) */}
      {activeSubTab === 'cierres' && (
        <div className="space-y-6" id="dailyClosesView">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-4 col-span-1 h-fit">
              <h4 className="font-bold text-slate-800 text-xs">Selector de Fecha e Historial</h4>
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 text-[10.5px] block">Seleccione fecha del cierre comercial:</label>
                <input
                  type="date"
                  value={selectedCloseDate}
                  onChange={(e) => setSelectedCloseDate(e.target.value)}
                  className="p-2 border rounded-xl w-full font-bold font-mono text-xs cursor-pointer"
                />
              </div>

              {dailyCloses.find(c => c.date === selectedCloseDate) ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-805 text-[10.5px] rounded-xl flex items-start gap-2">
                  <Lock className="w-4 h-4 text-red-605 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-red-900 leading-tight">Estado: SELLADO</p>
                    <p className="text-red-700 mt-1">El día seleccionado ya tiene un cierre de operaciones registrado y inalterable.</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-805 text-[10.5px] rounded-xl flex items-start gap-2">
                  <LockOpen className="w-4 h-4 text-emerald-600 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-extrabold text-emerald-900 leading-tight font-sans">Estado: EN EDICIÓN</p>
                    <p className="text-emerald-700 mt-1 font-medium text-[10px]">Puede ingresar los resultados del conteo físico. Se exigen justificaciones en caso de haber discrepancias.</p>
                  </div>
                </div>
              )}

              {/* Saved closes list */}
              <div className="pt-2 border-t">
                <h5 className="font-bold text-[10px] text-slate-450 uppercase mb-2">Cierres Anteriores Guardados:</h5>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {dailyCloses.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No hay cierres anteriores registrados.</p>
                  ) : (
                    dailyCloses.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCloseDate(c.date)}
                        className={`w-full text-left p-2 rounded-xl text-[11px] font-semibold border flex justify-between items-center transition ${c.date === selectedCloseDate ? 'bg-orange-50 border-orange-200 text-orange-850' : 'bg-slate-50/50 hover:bg-slate-50'}`}
                      >
                        <span className="font-mono">{c.date}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-800 px-1 rounded-md font-bold font-mono">SELLADO</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-2xl p-5 shadow-sm col-span-3 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b">
                <div>
                  <h3 className="font-bold text-slate-800 font-display text-sm">Cierre Diario de Cocina ({selectedCloseDate})</h3>
                  <p className="text-[10px] text-slate-400">Verifique las porciones esperadas contra el conteo físico de control nocturno</p>
                </div>
                <div>
                  {dailyCloses.find(c => c.date === selectedCloseDate) ? (
                    <span className="inline-flex items-center gap-1 bg-red-105 text-red-800 border border-red-200 text-[10px] uppercase font-sans font-extrabold px-3 py-1 rounded-xl">
                      <Lock className="w-3.5 h-3.5" /> SELLADO Y ARCHIVADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] uppercase font-sans font-bold px-3 py-1 rounded-xl border">
                      DRAFT / ACTIVO
                    </span>
                  )}
                </div>
              </div>

              {/* CLOSING TABLE FORM */}
              {dailyCloses.find(c => c.date === selectedCloseDate) ? (
                // READONLY SAVED CLOSE
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse font-sans font-medium">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="p-3">Insumo</th>
                          <th className="p-3 text-center">Iniciales</th>
                          <th className="p-3 text-center">Producido</th>
                          <th className="p-3 text-center">Vendido</th>
                          <th className="p-3 text-center">Merma</th>
                          <th className="p-3 text-center">Consumo Int.</th>
                          <th className="p-3 text-center">Cortesía</th>
                          <th className="p-3 text-center">Ajustes</th>
                          <th className="p-3 text-center">Teórico Final</th>
                          <th className="p-3 text-center bg-indigo-50/50">Conteo Real</th>
                          <th className="p-3 text-center">Dif (Piezas)</th>
                          <th className="p-3 text-right">Impacto Financiero</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-705">
                        {dailyCloses.find(c => c.date === selectedCloseDate)?.items.map(item => (
                          <tr key={item.productId} className="hover:bg-slate-50/40">
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{item.productName}</p>
                              {item.difference !== 0 && (
                                <span className="text-[9.5px] text-red-500 block font-normal leading-relaxed italic select-all">
                                  {item.reason}: "{item.comment}"
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold text-slate-500">{item.initialPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-500">+{item.producedPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-500">-{item.soldPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-500">-{item.wastedPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-500">-{item.internalConsumptionPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-500">-{item.courtesyPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-500">{item.adjustedPortions > 0 ? '+' : ''}{item.adjustedPortions}</td>
                            <td className="p-3 text-center font-bold text-slate-700 bg-slate-50/40">{item.expectedClosingPortions} pz</td>
                            <td className="p-3 text-center font-bold text-indigo-805 bg-indigo-50/30 font-semibold">{item.physicalCountingPortions} pz</td>
                            <td className={`p-3 text-center font-bold font-mono text-sm ${item.difference === 0 ? 'text-slate-400' : item.difference < 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                              {item.difference > 0 ? '+' : ''}{item.difference}
                            </td>
                            <td className={`p-3 text-right font-bold font-mono text-sm ${item.differenceValue === 0 ? 'text-slate-400' : item.differenceValue < 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                              RD${item.differenceValue.toLocaleString('es-DO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-stretch justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-655 block">Notas y Comentarios Generales del Turno:</p>
                      <p className="text-slate-600 mt-1 italic font-medium">"{dailyCloses.find(c => c.date === selectedCloseDate)?.notes || 'Ninguna observación de cierre.'}"</p>
                    </div>
                    <div className="text-right whitespace-nowrap bg-white border p-3 rounded-lg flex flex-col justify-center">
                      <span className="text-[10px] text-slate-400 block font-bold">FECHA DE SELLADO</span>
                      <strong className="text-slate-800 text-sm font-mono block">{new Date(dailyCloses.find(c => c.date === selectedCloseDate)?.closedAt || '').toLocaleString()}</strong>
                      <span className="text-[9px] text-slate-450 block">Por: {dailyCloses.find(c => c.date === selectedCloseDate)?.closedByUserName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                // ACTIVE DRAFT DIRT ENTRY CLOSE
                <form onSubmit={handleSaveDailyClose} className="space-y-6">
                  {portionConfiguredProducts.length === 0 ? (
                    <p className="p-8 text-center text-slate-400 italic">No hay productos en porciones para cerrar.</p>
                  ) : (
                    <div className="space-y-4">
                      {portionConfiguredProducts.map(p => {
                        const expected = calculateExpectedForDate(p.id, selectedCloseDate);
                        const initial = calculateInitialForDate(p.id, selectedCloseDate);
                        const prod = calculateProducedForDate(p.id, selectedCloseDate);
                        const sold = calculateSoldForDate(p.id, selectedCloseDate);
                        const waste = calculateWastedForDate(p.id, selectedCloseDate);
                        const internal = calculateInternalForDate(p.id, selectedCloseDate);
                        const courtesy = calculateCourtesyForDate(p.id, selectedCloseDate);
                        const adj = calculateAdjustmentsForDate(p.id, selectedCloseDate);

                        const currentVal = closeFields[p.id] || { physicalCount: expected };
                        const difference = currentVal.physicalCount - expected;

                        return (
                          <div key={p.id} className="border rounded-2xl p-4 bg-slate-55/30 hover:border-slate-350/50 transition duration-150 space-y-3 font-sans text-xs">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-2">
                              <div>
                                <h5 className="font-bold text-slate-900 font-display text-sm">{p.name}</h5>
                                <p className="text-[9.5px] text-slate-400 font-bold uppercase mt-0.5">Control de Auditoría Diaria</p>
                              </div>
                              <div className="flex text-[10px] flex-wrap gap-2 text-slate-500 bg-white border p-1 px-3 rounded-xl font-medium shadow-2xs">
                                <span>Inicial: <strong>{initial} pz</strong></span>
                                <span className="text-slate-300">|</span>
                                <span className="text-emerald-600">Producido: +{prod} pz</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-blue-600">Vendido: -{sold} pz</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-rose-605">Merma: -{waste} pz</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-violet-605">Consumo: -{internal} pz</span>
                                {adj !== 0 && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <span>Ajustes: {adj > 0 ? '+' : ''}{adj}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              {/* Expected */}
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block">Esperado Teórico Final</span>
                                <strong className="text-slate-800 text-base font-mono block mt-0.5">{expected} porciones</strong>
                              </div>

                              {/* Input physicalCount */}
                              <div className="space-y-1">
                                <label className="font-bold text-indigo-900 block text-[10.5px]">Conteo Físico Real:</label>
                                <input
                                  type="number"
                                  value={currentVal.physicalCount}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    setCloseFields({
                                      ...closeFields,
                                      [p.id]: { ...currentVal, physicalCount: val }
                                    });
                                  }}
                                  className="p-2 border rounded-xl w-full text-indigo-705 font-bold font-mono text-xs bg-indigo-50/20 shadow-xs focus:ring-1 focus:ring-indigo-500"
                                  min={0}
                                  required
                                />
                              </div>

                              {/* Diff amount */}
                              <div className="text-center font-display">
                                <span className="text-[10px] text-slate-400 font-bold block">Diferencia Final</span>
                                <span className={`text-base font-mono font-black block mt-0.5 ${difference === 0 ? 'text-slate-405' : difference < 0 ? 'text-red-650 animate-pulse' : 'text-emerald-700'}`}>
                                  {difference > 0 ? '+' : ''}{difference} porciones
                                </span>
                              </div>

                              {/* Impact cost */}
                              <div className="text-right">
                                <span className="text-[10px] text-slate-405 font-bold block">Impacto de Diferencia</span>
                                <strong className={`text-base font-mono font-extrabold block mt-0.5 ${difference === 0 ? 'text-slate-405' : difference < 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                                  {/* Just estimate based on standard rule conversion cost */}
                                  RD${Math.round((difference * (p.averageCost / 16)) * 100) / 100}
                                </strong>
                              </div>
                            </div>

                            {/* Enforce discrepancy justification */}
                            {difference !== 0 && (
                              <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1 sm:col-span-1">
                                  <label className="font-bold text-red-900 block leading-tight">Causa de Discrepancia:</label>
                                  <select
                                    value={currentVal.reason || ''}
                                    onChange={(e) => setCloseFields({
                                      ...closeFields,
                                      [p.id]: {
                                        ...currentVal,
                                        reason: e.target.value as any
                                      }
                                    })}
                                    className="w-full p-2 bg-white border rounded-xl text-red-900 font-bold text-[11px] focus:ring-1 focus:ring-red-500"
                                    required
                                  >
                                    <option value="">— Seleccione Causa Obligatoria —</option>
                                    <option value="Errores de conteo">Errores de conteo</option>
                                    <option value="Consumo no registrado">Consumo no registrado</option>
                                    <option value="Robo/pérdida">Robo/pérdida</option>
                                    <option value="Daño de producto">Daño de producto</option>
                                    <option value="Otros">Otros</option>
                                  </select>
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                  <label className="font-bold text-red-900 block leading-tight">Explicación o Acción Correctiva:</label>
                                  <input
                                    type="text"
                                    value={currentVal.comment || ''}
                                    onChange={(e) => setCloseFields({
                                      ...closeFields,
                                      [p.id]: {
                                        ...currentVal,
                                        comment: e.target.value
                                      }
                                    })}
                                    placeholder="Explicación detallada del por qué de la merma o diferencias..."
                                    className="w-full p-2 bg-white border rounded-xl text-[11px] focus:ring-1 focus:ring-red-500"
                                    required
                                  />
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}

                      {/* Observations comments */}
                      <div className="space-y-1 bg-slate-50 p-4 rounded-xl border">
                        <label className="font-bold text-slate-700 block">Comentarios Finales de Cierre del Turno (Opcional):</label>
                        <input
                          type="text"
                          value={closingNotes}
                          onChange={(e) => setClosingNotes(e.target.value)}
                          placeholder="Ingrese anotaciones importantes del equipo de cocina, incidencias de luz, daño de refrigerados, etc."
                          className="w-full p-2 border bg-white rounded-xl"
                        />
                      </div>

                      <div className="flex justify-end p-2">
                        <button
                          type="submit"
                          className="bg-red-650 hover:bg-red-700 text-white font-extrabold px-6 py-2 rounded-xl transition shadow flex items-center gap-1.5 leading-none"
                        >
                          <Lock className="w-4 h-4 text-white" /> Sellar / Cerrar Día de Cocina
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 8: AUDIT HISTORIC KARDEX */}
      {activeSubTab === 'historial' && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" id="historyViewBox">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-xs font-semibold">
            <h4 className="text-slate-800">Historial Electrónico Inalterable de Movimientos de Porciones</h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Kárdex de Control</span>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9.5px]">
                  <th className="p-3">Fecha y Hora</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Tipo Movimiento</th>
                  <th className="p-3 text-center">Cantidad</th>
                  <th className="p-3">Usuario Asignado</th>
                  <th className="p-3">Motivo / Explicación</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-705 font-medium font-sans">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">No hay movimientos registrados en el kárdex.</td>
                  </tr>
                ) : (
                  filteredMovements.map(m => {
                    const p = products.find(prod => prod.id === m.productId);
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-[10px] text-slate-400">
                          {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{p ? p.name : '—'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                            m.movementType === 'PORTION_IN' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                            m.movementType === 'PORTION_OUT' || m.movementType === 'PORTION_WASTE' ? 'bg-red-50 text-red-800 border-red-100' :
                            m.movementType === 'PORTION_SALE' ? 'bg-blue-50 text-blue-805 border-blue-105' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {m.movementType.replace('PORTION_', '')}
                          </span>
                        </td>
                        <td className={`p-3 text-center font-bold font-mono text-sm ${m.quantity > 0 ? 'text-emerald-700' : 'text-red-655'}`}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity} pz
                        </td>
                        <td className="p-3 text-slate-500 font-bold">{m.userName || 'Sistema'}</td>
                        <td className="p-3 text-slate-600 font-sans space-y-0.5">
                          <p className="font-semibold text-slate-800">{m.reason}</p>
                          {m.comment && <p className="text-[10px] text-slate-450 italic font-normal">"{m.comment}"</p>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- FORM MODALS --- */}

      {/* 1. RULE CONFIGURATION MODAL */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border w-full max-w-md shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Definir Norma de Porcionamiento</h3>
              <button onClick={() => setShowRuleModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveRule} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Producto Insumo:</label>
                <select
                  value={ruleForm.productId}
                  onChange={(e) => setRuleForm({ ...ruleForm, productId: e.target.value })}
                  disabled={editingRuleId !== null}
                  className="w-full p-2 border rounded-xl"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({units.find(u => u.id === p.unitId)?.code || 'lb'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Unidad de Medida base:</label>
                  <select
                    value={ruleForm.baseUnitId}
                    onChange={(e) => setRuleForm({ ...ruleForm, baseUnitId: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Factor Multiplicador:</label>
                  <input
                    type="number"
                    value={ruleForm.conversionFactor}
                    onChange={(e) => setRuleForm({ ...ruleForm, conversionFactor: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full p-2 border rounded-xl font-bold font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-indigo-905 block">Tamaño Porción (oz/g):</label>
                  <input
                    type="number"
                    value={ruleForm.standardPortionSize}
                    onChange={(e) => setRuleForm({ ...ruleForm, standardPortionSize: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full p-2 border rounded-xl font-bold font-mono text-indigo-700"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Rendimiento Estimado (%):</label>
                  <input
                    type="number"
                    value={ruleForm.expectedYieldPercentage}
                    onChange={(e) => {
                      const yieldVal = Math.min(100, Math.max(1, parseInt(e.target.value) || 1));
                      setRuleForm({ ...ruleForm, expectedYieldPercentage: yieldVal, expectedWastePercentage: 100 - yieldVal });
                    }}
                    className="w-full p-2 border rounded-xl font-bold font-mono"
                    max={100}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowRuleModal(false)} className="p-2 px-4 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="bg-slate-800 text-white font-bold p-2 px-5 rounded-xl">Guardar Criterios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REAL COUNT ACTION MODAL */}
      {showRealCountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border w-full max-w-sm shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b flex justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Registrar Corte Físico Obtenido</h3>
              <button onClick={() => setShowRealCountModal(null)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveRealCount} className="p-5 space-y-4 text-xs">
              <p className="text-slate-550 leading-relaxed">
                Ingrese las porciones exactas que se obtuvieron de las <strong>{showRealCountModal.quantityPurchased} {showRealCountModal.purchaseUnit}</strong> compradas.
              </p>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Estimado Teórico:</span>
                  <strong className="text-slate-800 text-sm block">{showRealCountModal.theoreticalPortions} pz</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Diferencia:</span>
                  <strong className={`text-sm block ${(realPortionsCount - showRealCountModal.theoreticalPortions) < 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                    {realPortionsCount - showRealCountModal.theoreticalPortions} pz
                  </strong>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-indigo-905 block">Porciones Reales Obtenidas:</label>
                <input
                  type="number"
                  value={realPortionsCount}
                  onChange={(e) => setRealPortionsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 bg-indigo-50/20 border-2 border-indigo-200 text-indigo-700 font-extrabold font-mono text-sm rounded-xl focus:ring-1 focus:ring-indigo-650"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-600 block">Justificación / Motivo Merma (Caso diferencias):</label>
                <input
                  type="text"
                  value={realCountComment}
                  onChange={(e) => setRealCountComment(e.target.value)}
                  placeholder="Ej: Desgrase excesivo, merma biológica..."
                  className="w-full p-2 border rounded-xl"
                  required={realPortionsCount - showRealCountModal.theoreticalPortions !== 0}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowRealCountModal(null)} className="p-2 px-4 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="bg-slate-800 text-white font-bold p-2 px-5 rounded-xl">Registrar Corte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border w-full max-w-sm shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800">Rechazar Lote de Porciones</h3>
            </div>
            <form onSubmit={handleSaveReject} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-650 block">Indique la razón para rechazar este lote:</label>
                <textarea
                  value={rejectionComment}
                  onChange={(e) => setRejectionComment(e.target.value)}
                  className="w-full p-2.5 h-20 border rounded-xl text-xs"
                  placeholder="Ej: Temperatura demasiado alta, mal olor en descarga, etc."
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowRejectModal(null)} className="p-2 px-4 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="bg-red-600 text-white font-bold p-2 px-5 rounded-xl">Confirmar Rechazo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CHEF MANUAL MOVEMENT MODAL (REGLA CRÍTICA) */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border w-full max-w-md shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b flex justify-between bg-slate-50 items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Asentar Movimiento Operacional</h3>
                <p className="text-[10px] text-slate-400 font-medium">Kárdex de Porciones de Cocina</p>
              </div>
              <button onClick={() => setShowMovementModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveManualMovement} className="p-5 space-y-4 text-xs">
              <p className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl leading-tight">
                <strong>Regla Crítica del Sistema:</strong> Prohibida la modificación manual directa de porciones. Para declarar pérdidas, asiente una merma, un consumo interno o un ajuste de inventario formal.
              </p>

              <div className="space-y-1 bg-slate-50 p-2.5 border rounded-xl">
                <span className="text-[10.5px] text-slate-400 font-bold block">Insumo Involucrado:</span>
                <strong className="text-slate-850 text-sm block">
                  {products.find(prod => prod.id === movementForm.productId)?.name || 'Insumo'}
                </strong>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Tipo Movimiento:</label>
                  <select
                    value={movementForm.movementType}
                    onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value as any })}
                    className="w-full p-2 border rounded-xl font-bold"
                    required
                  >
                    <option value="PORTION_WASTE">Merma / Pérdida / Basura</option>
                    <option value="PORTION_INTERNAL_CONSUMPTION">Consumo Interno Cocina</option>
                    <option value="PORTION_ADJUSTMENT">Ajuste de Conteo Físico</option>
                  </select>
                </div>

                {movementForm.movementType === 'PORTION_ADJUSTMENT' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block font-sans">Sentido Ajuste:</label>
                    <select
                      value={movementForm.adjustmentDirection}
                      onChange={(e) => setMovementForm({ ...movementForm, adjustmentDirection: e.target.value as any })}
                      className="w-full p-2 border rounded-xl font-bold"
                    >
                      <option value="Sobrante (+)">Sobrante (+)</option>
                      <option value="Faltante (-)">Faltante (-)</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400 block font-sans">Sentido Estimado:</label>
                    <div className="p-2 bg-red-100/50 text-red-800 rounded-xl font-bold text-center">Faltante (-)</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-indigo-905 block">Cantidad de Piezas:</label>
                  <input
                    type="number"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full p-2 border rounded-xl font-bold font-mono"
                    min={1}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">Chef Responsable:</label>
                  <input
                    type="text"
                    value={movementForm.responsibleName}
                    onChange={(e) => setMovementForm({ ...movementForm, responsibleName: e.target.value })}
                    className="w-full p-2 border rounded-xl font-bold text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-red-900 block">Motivo o Justificación oficial:</label>
                <select
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                  className="w-full p-2 border rounded-xl font-bold focus:ring-1 focus:ring-red-500"
                  required
                >
                  <option value="">— Elija Motivo —</option>
                  <option value="Producto Dañado / Descompuesto">Producto Dañado / Descompuesto</option>
                  <option value="Muestra o Degustación del Chef">Muestra o Degustación del Chef</option>
                  <option value="Error de Despacho Comedor">Error de Despacho Comedor</option>
                  <option value="Vencimiento de Estantería">Vencimiento de Estantería</option>
                  <option value="Ajuste por conteo de kárdex">Ajuste por conteo de kárdex</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Comentarios Detallados:</label>
                <textarea
                  value={movementForm.comment}
                  onChange={(e) => setMovementForm({ ...movementForm, comment: e.target.value })}
                  className="w-full p-2.5 h-16 border rounded-xl text-xs"
                  placeholder="Detalles sobre por qué se asienta la pérdida/merma en el kárdex..."
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowMovementModal(false)} className="p-2 px-4 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="bg-red-650 hover:bg-red-700 text-white font-bold p-2 px-5 rounded-xl transition">Asentar Cargo kárdex</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DEFINE RECIPE MODAL */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border w-full max-w-lg shadow-xl overflow-hidden font-sans">
            <div className="p-5 border-b flex justify-between bg-slate-50 items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Especificar Receta de Plato</h3>
                <p className="text-[10px] text-slate-400 font-medium">Asociación de ingredientes para despacho automático POS</p>
              </div>
              <button onClick={() => setShowRecipeModal(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveRecipeSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="font-bold text-slate-600 block">Nombre del plato POS:</label>
                  <input
                    type="text"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="w-full p-2 border rounded-xl font-semibold"
                    placeholder="Ej: Plato De Pechugas Teriyaki"
                    required
                  />
                </div>
                <div className="space-y-1 col-span-1">
                  <label className="font-bold text-slate-650 block">Precio (POS):</label>
                  <input
                    type="number"
                    value={recipeForm.price}
                    onChange={(e) => setRecipeForm({ ...recipeForm, price: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full p-2 border rounded-xl font-bold font-mono"
                    min={0}
                    required
                  />
                </div>
              </div>

              {/* Recipe builder section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border space-y-3">
                <strong className="text-[10px] text-slate-450 uppercase block font-bold leading-none">Constructor de Ingredientes:</strong>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
                  <div className="space-y-1 sm:col-span-1.5 flex flex-col justify-end">
                    <label className="text-[10px] text-slate-600 block font-bold">Seleccionar Insumo:</label>
                    <select
                      value={newIngredient.productId}
                      onChange={(e) => setNewIngredient({ ...newIngredient, productId: e.target.value })}
                      className="w-full p-1.5 border bg-white rounded-xl text-[11px]"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[10px] text-slate-600 block font-bold">Porciones / Qty:</label>
                    <input
                      type="number"
                      step={0.1}
                      value={newIngredient.quantity}
                      onChange={(e) => setNewIngredient({ ...newIngredient, quantity: Math.max(0.1, parseFloat(e.target.value) || 0.1) })}
                      className="w-full p-1.5 border bg-white rounded-xl text-[11px] font-bold font-mono"
                      min={0.1}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-1 border rounded-xl bg-white p-1 select-none flex items-center justify-around">
                    <label className="text-[9.5px] font-bold text-slate-500 cursor-pointer flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={newIngredient.isPortion}
                        onChange={(e) => setNewIngredient({ ...newIngredient, isPortion: e.target.checked })}
                      />
                      Es Porción
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-1.5 rounded-xl text-[10.5px]"
                  >
                    Agregar Insumo
                  </button>
                </div>

                <div className="pt-2 border-t font-sans">
                  <span className="text-[9.5px] text-slate-400 font-bold block mb-2 leading-none">Ingredientes integrados en el Turno:</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {recipeForm.ingredients.length === 0 ? (
                      <p className="text-[9.5px] text-slate-400 italic">No hay ingredientes cargados todavía.</p>
                    ) : (
                      recipeForm.ingredients.map((ing, idx) => {
                        const prod = products.find(p => p.id === ing.productId);
                        return (
                          <div key={idx} className="flex justify-between items-center text-[10.5px] bg-white p-1 px-3 border rounded-lg font-semibold text-slate-700">
                            <span>{prod ? prod.name : '—'} ({ing.isPortion ? 'Porción' : 'Materia Prima'})</span>
                            <div className="flex gap-2 items-center">
                              <span><strong>{ing.quantity}</strong> pz/und</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredientRow(idx)}
                                className="text-red-400 hover:text-red-650"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <button type="button" onClick={() => setShowRecipeModal(false)} className="p-2 px-4 border rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="bg-slate-800 text-white font-bold p-2 px-5 rounded-xl">Crear Receta POS</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
