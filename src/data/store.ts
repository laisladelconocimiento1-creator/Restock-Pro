import {
  Category,
  Unit,
  Provider,
  Product,
  KitchenRequest,
  Purchase,
  InventoryMovement,
  AuditLog,
  PhysicalSession,
  RestaurantConfig,
  User,
  Role,
  MovementType,
  InventoryArea,
  PortionRule,
  PortionBatch,
  PortionMovement,
  PortionSale,
  PortionBatchStatus,
  PortionMovementType,
  SalesChannel,
  InventoryImport,
  InventoryImportColumn,
  InventoryImportRow,
  InventoryImportError,
  InventoryImportMapping,
  Recipe,
  RecipeIngredient,
  KitchenDailyClose,
  KitchenDailyCloseItem
} from '../types';
import {
  mockUsers,
  mockCategories,
  mockUnits,
  mockProviders,
  mockProducts,
  mockKitchenRequests,
  mockPurchases,
  mockMovements,
  mockAuditLogs,
  mockPhysicalSessions,
  mockConfig,
  mockPortionRules,
  mockPortionBatches,
  mockPortionMovements,
  mockPortionSales
} from './mockData';

// Local storage keys
const KEYS = {
  CURRENT_USER: 'restock_pro_current_user',
  USERS: 'restock_pro_users',
  CATEGORIES: 'restock_pro_categories',
  UNITS: 'restock_pro_units',
  PROVIDERS: 'restock_pro_providers',
  PRODUCTS: 'restock_pro_products',
  KITCHEN_REQUESTS: 'restock_pro_kitchen_requests',
  PURCHASES: 'restock_pro_purchases',
  MOVEMENTS: 'restock_pro_movements',
  AUDIT_LOGS: 'restock_pro_audit_logs',
  PHYSICAL_SESSIONS: 'restock_pro_physical_sessions',
  CONFIG: 'restock_pro_config',
  PORTION_RULES: 'restock_pro_portion_rules',
  PORTION_BATCHES: 'restock_pro_portion_batches',
  PORTION_MOVEMENTS: 'restock_pro_portion_movements',
  PORTION_SALES: 'restock_pro_portion_sales',
  INVENTORY_IMPORTS: 'restock_pro_inventory_imports',
  INVENTORY_IMPORT_COLUMNS: 'restock_pro_inventory_import_columns',
  INVENTORY_IMPORT_ROWS: 'restock_pro_inventory_import_rows',
  INVENTORY_IMPORT_ERRORS: 'restock_pro_inventory_import_errors',
  INVENTORY_IMPORT_MAPPINGS: 'restock_pro_inventory_import_mappings',
  RECIPES: 'restock_pro__recipes',
  DAILY_CLOSES: 'restock_pro__daily_closes'
};

// Helper to safe-parse JSON
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading localStorage key ' + key, error);
    return defaultValue;
  }
}

function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing localStorage key ' + key, error);
  }
}

// Check if initialized
export function initializeStore(forceReset = false) {
  const versionKey = 'restock_pro_clean_v5_recipes';
  const hasBeenCleaned = localStorage.getItem(versionKey);

  if (forceReset || !hasBeenCleaned) {
    // Clear out our specific keys to reset of old mock data
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.setItem(versionKey, 'true');
    forceReset = true;
  }

  if (forceReset || !localStorage.getItem(KEYS.PRODUCTS)) {
    setLocalStorageItem(KEYS.CURRENT_USER, mockUsers[0]); // default to Carlos Admin
    setLocalStorageItem(KEYS.USERS, mockUsers);
    setLocalStorageItem(KEYS.CATEGORIES, mockCategories);
    setLocalStorageItem(KEYS.UNITS, mockUnits);
    setLocalStorageItem(KEYS.PROVIDERS, mockProviders);
    setLocalStorageItem(KEYS.PRODUCTS, mockProducts);
    setLocalStorageItem(KEYS.KITCHEN_REQUESTS, mockKitchenRequests);
    setLocalStorageItem(KEYS.PURCHASES, mockPurchases);
    setLocalStorageItem(KEYS.MOVEMENTS, mockMovements);
    setLocalStorageItem(KEYS.AUDIT_LOGS, mockAuditLogs);
    setLocalStorageItem(KEYS.PHYSICAL_SESSIONS, mockPhysicalSessions);
    setLocalStorageItem(KEYS.CONFIG, mockConfig);
    setLocalStorageItem(KEYS.PORTION_RULES, mockPortionRules);
    setLocalStorageItem(KEYS.PORTION_BATCHES, mockPortionBatches);
    setLocalStorageItem(KEYS.PORTION_MOVEMENTS, mockPortionMovements);
    setLocalStorageItem(KEYS.PORTION_SALES, mockPortionSales);
    setLocalStorageItem(KEYS.RECIPES, [
      {
        id: 'rec-1',
        name: 'Pechuga de Pollo al Grill',
        ingredients: [
          { productId: 'prod-1', quantity: 1, isPortion: true }
        ],
        price: 350
      },
      {
        id: 'rec-2',
        name: 'Lomo Fino Premium 10oz',
        ingredients: [
          { productId: 'prod-2', quantity: 1, isPortion: true }
        ],
        price: 850
      },
      {
        id: 'rec-3',
        name: 'Filete de Salmón Chileno',
        ingredients: [
          { productId: 'prod-3', quantity: 1, isPortion: true }
        ],
        price: 750
      }
    ]);
    setLocalStorageItem(KEYS.DAILY_CLOSES, []);
  }
}

// Main accessors
export const store = {
  // Current user
  getCurrentUser(): User {
    return getLocalStorageItem<User>(KEYS.CURRENT_USER, mockUsers[0]);
  },
  setCurrentUser(user: User | null): void {
    if (user === null) {
      localStorage.removeItem(KEYS.CURRENT_USER);
    } else {
      setLocalStorageItem(KEYS.CURRENT_USER, user);
      this.addAuditLog(
        'INICIO_SESIÓN',
        'Sesión',
        `Usuario inició sesión con rol ${user.role}`,
        user.id
      );
    }
  },

  // Users
  getUsers(): User[] {
    return getLocalStorageItem<User[]>(KEYS.USERS, mockUsers);
  },
  saveUsers(users: User[]): void {
    setLocalStorageItem(KEYS.USERS, users);
  },

  // Categories
  getCategories(): Category[] {
    return getLocalStorageItem<Category[]>(KEYS.CATEGORIES, mockCategories);
  },
  addCategory(category: Category): void {
    const categories = this.getCategories();
    categories.push(category);
    setLocalStorageItem(KEYS.CATEGORIES, categories);
    this.addAuditLog('CREACIÓN_CATEGORÍA', 'Configuración', `Creada categoría ${category.name}`, category.id);
  },
  updateCategory(updated: Category): void {
    const list = this.getCategories().map(c => c.id === updated.id ? updated : c);
    setLocalStorageItem(KEYS.CATEGORIES, list);
    this.addAuditLog('EDICIÓN_CATEGORÍA', 'Configuración', `Actualizada categoría ${updated.name}`, updated.id);
  },

  // Units
  getUnits(): Unit[] {
    return getLocalStorageItem<Unit[]>(KEYS.UNITS, mockUnits);
  },
  addUnit(unit: Unit): void {
    const units = this.getUnits();
    units.push(unit);
    setLocalStorageItem(KEYS.UNITS, units);
    this.addAuditLog('CREACIÓN_UNIDAD', 'Configuración', `Creada unidad de medida ${unit.name} (${unit.code})`, unit.id);
  },

  // Providers
  getProviders(): Provider[] {
    return getLocalStorageItem<Provider[]>(KEYS.PROVIDERS, mockProviders);
  },
  addProvider(provider: Provider): void {
    const list = this.getProviders();
    list.push(provider);
    setLocalStorageItem(KEYS.PROVIDERS, list);
    this.addAuditLog('CREACIÓN_PROVEEDOR', 'Proveedores', `Creado proveedor ${provider.name}`, provider.id);
  },
  updateProvider(updated: Provider): void {
    const list = this.getProviders().map(p => p.id === updated.id ? updated : p);
    setLocalStorageItem(KEYS.PROVIDERS, list);
    this.addAuditLog('EDICIÓN_PROVEEDOR', 'Proveedores', `Actualizado proveedor ${updated.name}`, updated.id);
  },

  // Products
  getProducts(): Product[] {
    return getLocalStorageItem<Product[]>(KEYS.PRODUCTS, mockProducts);
  },
  addProduct(product: Product): void {
    const list = this.getProducts();
    list.push(product);
    setLocalStorageItem(KEYS.PRODUCTS, list);
    this.addAuditLog('CREACIÓN_PRODUCTO', 'Productos', `Creado producto ${product.name}`, product.id);
  },
  updateProduct(updated: Product): void {
    const original = this.getProducts().find(p => p.id === updated.id);
    const list = this.getProducts().map(p => p.id === updated.id ? updated : p);
    setLocalStorageItem(KEYS.PRODUCTS, list);

    let priceComment = '';
    if (original && original.lastPrice !== updated.lastPrice) {
      priceComment = ` (Precio cambió de $${original.lastPrice} a $${updated.lastPrice})`;
    }
    this.addAuditLog(
      'EDICIÓN_PRODUCTO',
      'Productos',
      `Actualizado producto ${updated.name}${priceComment}`,
      updated.id,
      original ? JSON.stringify({ cost: original.averageCost, price: original.lastPrice }) : undefined,
      JSON.stringify({ cost: updated.averageCost, price: updated.lastPrice })
    );
  },

  // Kitchen Requests
  getKitchenRequests(): KitchenRequest[] {
    return getLocalStorageItem<KitchenRequest[]>(KEYS.KITCHEN_REQUESTS, mockKitchenRequests);
  },
  addKitchenRequest(req: KitchenRequest): void {
    const list = this.getKitchenRequests();
    list.push(req);
    setLocalStorageItem(KEYS.KITCHEN_REQUESTS, list);
    this.addAuditLog('CREACIÓN_SOLICITUD', 'Solicitudes', `Creada solicitud ${req.code} (${req.status})`, req.id);
  },
  updateKitchenRequest(updated: KitchenRequest): void {
    const list = this.getKitchenRequests().map(r => r.id === updated.id ? updated : r);
    setLocalStorageItem(KEYS.KITCHEN_REQUESTS, list);

    this.addAuditLog(
      'CAMBIO_ESTADO_SOLICITUD',
      'Solicitudes',
      `Solicitud ${updated.code} cambió a ${updated.status}${updated.reason ? '. Motivo: ' + updated.reason : ''}`,
      updated.id
    );
  },

  // Purchases
  getPurchases(): Purchase[] {
    return getLocalStorageItem<Purchase[]>(KEYS.PURCHASES, mockPurchases);
  },
  addPurchase(purchase: Purchase): void {
    const list = this.getPurchases();
    list.push(purchase);
    setLocalStorageItem(KEYS.PURCHASES, list);
    this.addAuditLog('CREACIÓN_COMPRA', 'Compras', `Registrada compra ${purchase.code} por valor de $${purchase.total}`, purchase.id);

    // If purchase is received immediately, we create movements
    if (purchase.status === 'Recibida') {
      this.receivePurchaseItems(purchase);
    }
  },
  updatePurchase(updated: Purchase): void {
    const original = this.getPurchases().find(p => p.id === updated.id);
    const list = this.getPurchases().map(p => p.id === updated.id ? updated : p);
    setLocalStorageItem(KEYS.PURCHASES, list);

    this.addAuditLog(
      'EDICIÓN_COMPRA',
      'Compras',
      `Compra ${updated.code} modificada (Estado original: ${original?.status} -> Nuevo: ${updated.status})`,
      updated.id
    );

    // If it was transition from Pendiente to Recibida, update inventory!
    if (original && original.status !== 'Recibida' && updated.status === 'Recibida') {
      this.receivePurchaseItems(updated);
    }
  },

  // Custom function to handle receipt of products and write movements and update costs
  receivePurchaseItems(purchase: Purchase): void {
    const currentUser = this.getCurrentUser();
    const products = this.getProducts();

    purchase.items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        const product = products[productIndex];
        const prevStock = product.currentStock;
        const addedQty = item.qty;
        const newStock = prevStock + addedQty;

        // Calc new Average Cost: (Old Stock * Old Average Cost + New Qty * New Unit Price) / (Old Stock + New Qty)
        let newAvgCost = product.averageCost;
        if (newStock > 0) {
          const totalOldVal = Math.max(0, prevStock) * product.averageCost;
          const totalNewVal = addedQty * item.unitPrice;
          newAvgCost = Math.round(((totalOldVal + totalNewVal) / newStock) * 100) / 100;
        }

        const updatedProduct: Product = {
          ...product,
          currentStock: newStock,
          averageCost: newAvgCost,
          lastPrice: item.unitPrice
        };

        // Update list
        products[productIndex] = updatedProduct;

        // Log movement
        this.addMovement({
          id: 'mov-' + Math.random().toString(36).substr(2, 9),
          productId: product.id,
          productName: product.name,
          qty: addedQty,
          unitCode: this.getUnitCode(product.unitId),
          type: 'Entrada',
          quantityBefore: prevStock,
          quantityAfter: newStock,
          area: 'Almacén seco', // Default area of reception
          userId: currentUser.id,
          userName: currentUser.name,
          date: new Date().toISOString(),
          reason: `Compra RECIBIDA (${purchase.invoiceNumber})`,
          comment: `Código de Orden: ${purchase.code}. Costo unitario: $${item.unitPrice}`,
          documentRelatedId: purchase.id
        });

        // Auto-spawn PortionBatch kitchen task if product has registered portion rules
        const rules = this.getPortionRules();
        const rule = rules.find(r => r.productId === product.id && r.isActive && r.requiresPortioning);
        if (rule) {
          const baseQuantity = addedQty * rule.conversionFactor;
          const theoreticalPortions = (baseQuantity * (rule.expectedYieldPercentage / 100)) / rule.standardPortionSize;
          const totalCost = addedQty * item.unitPrice;
          const estimatedCostPerPortion = theoreticalPortions > 0 ? totalCost / theoreticalPortions : 0;

          this.addPortionBatch({
            id: 'lote-' + Math.random().toString(36).substr(2, 9),
            purchaseId: purchase.id,
            productId: product.id,
            quantityPurchased: addedQty,
            purchaseUnit: this.getUnitCode(product.unitId),
            baseQuantity,
            baseUnit: this.getUnitCode(rule.baseUnitId),
            standardPortionSize: rule.standardPortionSize,
            theoreticalPortions: Math.round(theoreticalPortions * 10) / 10,
            realPortions: 0,
            differencePortions: 0,
            expectedYieldPercentage: rule.expectedYieldPercentage,
            realYieldPercentage: 0,
            totalCost,
            estimatedCostPerPortion: Math.round(estimatedCostPerPortion * 100) / 100,
            realCostPerPortion: 0,
            status: 'PENDING',
            responsibleUserId: currentUser.id,
            createdAt: new Date().toISOString()
          });
        }
      }
    });

    // Save updated products list
    setLocalStorageItem(KEYS.PRODUCTS, products);

    this.addAuditLog(
      'RECEPCIÓN_MERCANCÍA',
      'Inventario',
      `Se completó la recepción de mercadería de la compra ${purchase.code}`,
      purchase.id
    );
  },

  // Movements
  getMovements(): InventoryMovement[] {
    return getLocalStorageItem<InventoryMovement[]>(KEYS.MOVEMENTS, mockMovements);
  },
  addMovement(movement: InventoryMovement): void {
    const list = this.getMovements();
    list.unshift(movement); // Newest first
    setLocalStorageItem(KEYS.MOVEMENTS, list);
  },

  // Physical Sessions
  getPhysicalSessions(): PhysicalSession[] {
    return getLocalStorageItem<PhysicalSession[]>(KEYS.PHYSICAL_SESSIONS, mockPhysicalSessions);
  },
  addPhysicalSession(session: PhysicalSession): void {
    const list = this.getPhysicalSessions();
    list.push(session);
    setLocalStorageItem(KEYS.PHYSICAL_SESSIONS, list);
    this.addAuditLog('CREACIÓN_CONTEO_FÍSICO', 'Inventario Físico', `Creada una sesión de conteo en área: ${session.area} (${session.code})`, session.id);
  },
  updatePhysicalSession(updated: PhysicalSession): void {
    const original = this.getPhysicalSessions().find(s => s.id === updated.id);
    const list = this.getPhysicalSessions().map(s => s.id === updated.id ? updated : s);
    setLocalStorageItem(KEYS.PHYSICAL_SESSIONS, list);

    this.addAuditLog(
      'CAMBIO_ESTADO_CONTEO',
      'Inventario Físico',
      `Sesión física ${updated.code} cambió de ${original?.status} a ${updated.status}`,
      updated.id
    );

    // If transaction became APPROVED, apply physical stock adjustments!
    if (original && original.status !== 'Aprobado' && updated.status === 'Aprobado') {
      this.applyPhysicalAdjustments(updated);
    }
  },

  // Apply actual inventory modifications from Physical session differences
  applyPhysicalAdjustments(session: PhysicalSession): void {
    const currentUser = this.getCurrentUser();
    const products = this.getProducts();

    session.items.forEach(item => {
      if (item.physicalStock !== null && item.difference !== 0) {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const product = products[productIndex];
          const prevStock = product.currentStock;
          const newStock = item.physicalStock; // Strictly override with reality
          const difference = item.difference; // physicalStock - theoreticalStock

          // Update stock directly (Toda variación de inventario pasa por movimientos de inventario!)
          products[productIndex] = {
            ...product,
            currentStock: newStock
          };

          // Register Movement adjustment!
          this.addMovement({
            id: 'mov-' + Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            qty: difference, // This is positive (surplus) or negative (loss/shrinkage)
            unitCode: this.getUnitCode(product.unitId),
            type: 'Ajuste',
            quantityBefore: prevStock,
            quantityAfter: newStock,
            area: session.area,
            userId: currentUser.id,
            userName: currentUser.name,
            date: new Date().toISOString(),
            reason: `Ajuste por Inventario Físico (${session.code})`,
            comment: `Diferencia de conteo físico aprobada por ${currentUser.name}. Notas: ${session.notes || 'Ninguna'}`,
            documentRelatedId: session.id
          });
        }
      }
    });

    setLocalStorageItem(KEYS.PRODUCTS, products);

    this.addAuditLog(
      'APROBACIÓN_AJUSTE_INVENTARIO',
      'Inventario Físico',
      `Se aplicaron y aprobaron los movimientos de ajuste de la sesión de conteo ${session.code}`,
      session.id
    );
  },

  // Manual Adjustments / Mermas / Pérdidas (Toda variación de inventario debe pasar por movimientos de inventario!)
  applyManualAdjustment(
    productId: string,
    quantity: number,
    type: MovementType,
    area: InventoryArea,
    reason: string,
    comment: string
  ): void {
    const products = this.getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const product = products[productIndex];
    const prevStock = product.currentStock;
    const newStock = prevStock + quantity; // qty can be negative for losses/mermas

    products[productIndex] = {
      ...product,
      currentStock: newStock
    };

    setLocalStorageItem(KEYS.PRODUCTS, products);

    const currentUser = this.getCurrentUser();
    this.addMovement({
      id: 'mov-' + Math.random().toString(36).substr(2, 9),
      productId: product.id,
      productName: product.name,
      qty: quantity,
      unitCode: this.getUnitCode(product.unitId),
      type: type,
      quantityBefore: prevStock,
      quantityAfter: newStock,
      area: area,
      userId: currentUser.id,
      userName: currentUser.name,
      date: new Date().toISOString(),
      reason: reason,
      comment: comment
    });

    this.addAuditLog(
      'MOVIMIENTO_AJUSTE_MANUAL',
      'Inventario',
      `Ajuste manual (${type}) registrado para ${product.name}: ${quantity > 0 ? '+' : ''}${quantity} unidades`,
      product.id
    );
  },

  // Audit Logs (Inalterable)
  getAuditLogs(): AuditLog[] {
    return getLocalStorageItem<AuditLog[]>(KEYS.AUDIT_LOGS, mockAuditLogs);
  },
  addAuditLog(
    action: string,
    module: string,
    comment?: string,
    recordId?: string,
    previousValue?: string,
    newValue?: string
  ): void {
    const logs = this.getAuditLogs();
    const currentUser = this.getCurrentUser() || { id: 'anon', name: 'Anonymous', role: 'LECTURA' };

    const newLog: AuditLog = {
      id: 'aud-' + Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      module,
      recordId,
      previousValue,
      newValue,
      date: new Date().toISOString(),
      comment,
      device: navigator.userAgent.includes('Mobile') ? 'Mobile User Agent' : 'Desktop User Agent'
    };

    logs.unshift(newLog); // Newest first
    setLocalStorageItem(KEYS.AUDIT_LOGS, logs);
  },

  // Config
  getConfig(): RestaurantConfig {
    return getLocalStorageItem<RestaurantConfig>(KEYS.CONFIG, mockConfig);
  },
  updateConfig(config: RestaurantConfig): void {
    setLocalStorageItem(KEYS.CONFIG, config);
    this.addAuditLog('ACTUALIZACIÓN_CONFIGURACIÓN', 'Configuración', `Configuración general modificada`, 'config');
  },

  // === PORTION RULES ACCESSORS ===
  getPortionRules(): PortionRule[] {
    return getLocalStorageItem<PortionRule[]>(KEYS.PORTION_RULES, mockPortionRules);
  },
  savePortionRules(rules: PortionRule[]): void {
    setLocalStorageItem(KEYS.PORTION_RULES, rules);
  },
  addPortionRule(rule: PortionRule): void {
    const list = this.getPortionRules();
    list.push(rule);
    this.savePortionRules(list);
    const prod = this.getProducts().find(p => p.id === rule.productId);
    this.addAuditLog(
      'CREACIÓN_NORMA_PORCIÓN',
      'Porcionamiento',
      `Creada norma de porcionamiento para ${prod ? prod.name : 'Producto ID ' + rule.productId} (Porción: ${rule.standardPortionSize} ${this.getUnitCode(rule.portionUnitId)})`,
      rule.id
    );
  },
  updatePortionRule(updated: PortionRule): void {
    const list = this.getPortionRules().map(r => r.id === updated.id ? updated : r);
    this.savePortionRules(list);
    const prod = this.getProducts().find(p => p.id === updated.productId);
    this.addAuditLog(
      'EDICIÓN_NORMA_PORCIÓN',
      'Porcionamiento',
      `Actualizada norma de porcionamiento para ${prod ? prod.name : 'Producto ID ' + updated.productId}`,
      updated.id
    );
  },
  deletePortionRule(id: string): void {
    const item = this.getPortionRules().find(r => r.id === id);
    const list = this.getPortionRules().filter(r => r.id !== id);
    this.savePortionRules(list);
    if (item) {
      const prod = this.getProducts().find(p => p.id === item.productId);
      this.addAuditLog(
        'ELIMINACIÓN_NORMA_PORCIÓN',
        'Porcionamiento',
        `Eliminada norma de porcionamiento de ${prod ? prod.name : 'Producto ID ' + item.productId}`,
        id
      );
    }
  },

  // === PORTION BATCHES ACCESSORS ===
  getPortionBatches(): PortionBatch[] {
    return getLocalStorageItem<PortionBatch[]>(KEYS.PORTION_BATCHES, mockPortionBatches);
  },
  savePortionBatches(batches: PortionBatch[]): void {
    setLocalStorageItem(KEYS.PORTION_BATCHES, batches);
  },
  addPortionBatch(batch: PortionBatch): void {
    const list = this.getPortionBatches();
    list.unshift(batch); // Newest first
    this.savePortionBatches(list);
    const prod = this.getProducts().find(p => p.id === batch.productId);
    this.addAuditLog(
      'CREACIÓN_LOTE_PORCIONAMIENTO',
      'Porcionamiento',
      `Registrado lote de porcionamiento ${batch.id} para ${prod ? prod.name : 'Producto'} (Materia prima: ${batch.quantityPurchased} ${batch.purchaseUnit})`,
      batch.id
    );
  },
  updatePortionBatch(updated: PortionBatch): void {
    const list = this.getPortionBatches().map(b => b.id === updated.id ? updated : b);
    this.savePortionBatches(list);
  },
  startPortionBatch(id: string): void {
    const list = this.getPortionBatches();
    const batch = list.find(b => b.id === id);
    if (batch) {
      batch.status = 'IN_PROGRESS';
      this.savePortionBatches(list);
      const prod = this.getProducts().find(p => p.id === batch.productId);
      this.addAuditLog(
        'INICIO_PORCIONAMIENTO',
        'Porcionamiento',
        `Iniciado proceso de porcionado físico del lote ${id} para ${prod ? prod.name : 'Producto'}`,
        id
      );
    }
  },
  registerRealPortions(id: string, realPortions: number, comment: string, evidenceUrl?: string): void {
    const list = this.getPortionBatches();
    const batch = list.find(b => b.id === id);
    if (batch) {
      batch.realPortions = realPortions;
      batch.differencePortions = realPortions - batch.theoreticalPortions;
      batch.realYieldPercentage = Math.round(((realPortions * batch.standardPortionSize) / batch.baseQuantity) * 100 * 10) / 10;
      batch.realCostPerPortion = realPortions > 0 ? Math.round((batch.totalCost / realPortions) * 100) / 100 : Math.round((batch.totalCost / batch.theoreticalPortions) * 105) / 100;
      batch.status = 'PORTIONED';
      batch.comment = comment;
      if (evidenceUrl) {
        batch.evidenceUrl = evidenceUrl;
      }
      this.savePortionBatches(list);
      const prod = this.getProducts().find(p => p.id === batch.productId);
      this.addAuditLog(
        'REGISTRO_PORCIONES_REALES',
        'Porcionamiento',
        `Registrado conteo real del lote ${id} (${realPortions} porciones obtenidas de un estimado teórico de ${batch.theoreticalPortions}. Merma/dif: ${batch.differencePortions})`,
        id,
        JSON.stringify({ theoretical: batch.theoreticalPortions }),
        JSON.stringify({ real: realPortions, difference: batch.differencePortions })
      );
    }
  },
  approvePortionBatch(id: string, approvedByUserId: string, approvedByUserName: string): void {
    const list = this.getPortionBatches();
    const batch = list.find(b => b.id === id);
    if (batch) {
      batch.status = 'APPROVED';
      batch.approvedByUserId = approvedByUserId;
      batch.approvedAt = new Date().toISOString();
      this.savePortionBatches(list);

      // Discount raw stock
      const products = this.getProducts();
      const productIndex = products.findIndex(p => p.id === batch.productId);
      if (productIndex !== -1) {
        const product = products[productIndex];
        const prevStock = product.currentStock;
        const newStock = Math.max(0, prevStock - batch.quantityPurchased);

        // Update product stock and portions stock
        const prevPortions = product.portionsAvailable || 0;
        const newPortions = prevPortions + batch.realPortions;

        products[productIndex] = {
          ...product,
          currentStock: newStock,
          portionsAvailable: newPortions
        };
        setLocalStorageItem(KEYS.PRODUCTS, products);

        // Log general inventory raw movement (Salida por conversión)
        this.addMovement({
          id: 'mov-' + Math.random().toString(36).substr(2, 9),
          productId: product.id,
          productName: product.name,
          qty: -batch.quantityPurchased,
          unitCode: this.getUnitCode(product.unitId),
          type: 'Salida',
          quantityBefore: prevStock,
          quantityAfter: newStock,
          area: 'Cocina',
          userId: approvedByUserId,
          userName: approvedByUserName,
          date: new Date().toISOString(),
          reason: `Descuento de materia prima por porcionado (${batch.id})`,
          comment: `Se procesaron ${batch.quantityPurchased} ${batch.purchaseUnit} para producir porciones listas para cocina/venta.`,
          documentRelatedId: batch.id
        });

        // Add Portion movement (Portions added to inventory)
        this.addPortionMovement({
          id: 'pmov-' + Math.random().toString(36).substr(2, 9),
          productId: product.id,
          portionBatchId: batch.id,
          movementType: 'PORTION_IN',
          quantity: batch.realPortions,
          reason: `Aprobación de Lote de Porcionamiento ${batch.id}`,
          relatedEntityType: 'PortionBatch',
          relatedEntityId: batch.id,
          userId: approvedByUserId,
          userName: approvedByUserName,
          comment: `Ingreso de ${batch.realPortions} porciones reales al inventario con costo de RD$${batch.realCostPerPortion} c/u.`,
          createdAt: new Date().toISOString()
        });

        this.addAuditLog(
          'APROBACIÓN_PORCIONAMIENTO',
          'Porcionamiento',
          `Aprobado lote de porcionamiento ${batch.id} por ${approvedByUserName}. Se descontó ${batch.quantityPurchased} ${batch.purchaseUnit} de materia prima e ingresó ${batch.realPortions} porciones al kárdex de porciones.`,
          id
        );
      }
    }
  },
  rejectPortionBatch(id: string, comment: string, chefId: string, chefName: string): void {
    const list = this.getPortionBatches();
    const batch = list.find(b => b.id === id);
    if (batch) {
      batch.status = 'REJECTED';
      batch.comment = comment;
      this.savePortionBatches(list);
      this.addAuditLog(
        'RECHAZO_PORCIONAMIENTO',
        'Porcionamiento',
        `Rechazado lote de porcionamiento ${id} por ${chefName}. Motivo: ${comment}`,
        id
      );
    }
  },

  // === PORTION MOVEMENTS ACCESSORS ===
  getPortionMovements(): PortionMovement[] {
    return getLocalStorageItem<PortionMovement[]>(KEYS.PORTION_MOVEMENTS, mockPortionMovements);
  },
  savePortionMovements(movements: PortionMovement[]): void {
    setLocalStorageItem(KEYS.PORTION_MOVEMENTS, movements);
  },
  addPortionMovement(movement: PortionMovement): void {
    const list = this.getPortionMovements();
    list.unshift(movement); // Newest first
    this.savePortionMovements(list);

    // Apply change to Product portionsAvailable stock
    this.adjustPortionStock(movement.productId, movement.quantity);

    const prod = this.getProducts().find(p => p.id === movement.productId);
    this.addAuditLog(
      'MOVIMIENTO_PORCION',
      'Porcionamiento',
      `Movimiento de porciones (${movement.movementType}) registrado para ${prod ? prod.name : 'Producto'}: ${movement.quantity > 0 ? '+' : ''}${movement.quantity} porciones. Motivo: ${movement.reason}`,
      movement.id
    );
  },

  // Adjust portion stock directly
  adjustPortionStock(productId: string, diffQty: number): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const p = products[index];
      const prevPortions = p.portionsAvailable || 0;
      products[index] = {
        ...p,
        portionsAvailable: Math.max(0, prevPortions + diffQty)
      };
      setLocalStorageItem(KEYS.PRODUCTS, products);
    }
  },

  // === PORTION SALES ACCESSORS ===
  getPortionSales(): PortionSale[] {
    return getLocalStorageItem<PortionSale[]>(KEYS.PORTION_SALES, mockPortionSales);
  },
  savePortionSales(sales: PortionSale[]): void {
    setLocalStorageItem(KEYS.PORTION_SALES, sales);
  },
  addPortionSale(sale: PortionSale): void {
    const list = this.getPortionSales();
    list.unshift(sale); // Newest first
    this.savePortionSales(list);

    // This is a direct sale, so we perform a portion discount movement!
    const product = this.getProducts().find(p => p.id === sale.productId);
    this.addPortionMovement({
      id: 'pmov-' + Math.random().toString(36).substr(2, 9),
      productId: sale.productId,
      portionBatchId: sale.portionBatchId,
      movementType: 'PORTION_SALE',
      quantity: -sale.portionsSold,
      reason: `Venta manual registrada vía canal ${sale.channel} (${sale.reference || 'Sin Ref'})`,
      relatedEntityType: 'PortionSale',
      relatedEntityId: sale.id,
      userId: sale.userId,
      userName: sale.userName,
      comment: `Servicios cobrados. Canal: ${sale.channel}.`,
      createdAt: new Date().toISOString()
    });

    this.addAuditLog(
      'REGISTRO_VENTA_PORCIÓN',
      'Cruce con Ventas',
      `Venta registrada manual para ${product ? product.name : 'Producto ID ' + sale.productId}: -${sale.portionsSold} porciones. Canal: ${sale.channel}`,
      sale.id
    );
  },

  // === NEW: INVENTORY IMPORTS ACCESSORS ===
  getInventoryImports(): InventoryImport[] {
    return getLocalStorageItem<InventoryImport[]>(KEYS.INVENTORY_IMPORTS, []);
  },
  saveInventoryImports(imports: InventoryImport[]): void {
    setLocalStorageItem(KEYS.INVENTORY_IMPORTS, imports);
  },
  addInventoryImport(inventoryImport: InventoryImport): void {
    const list = this.getInventoryImports();
    list.unshift(inventoryImport); // newest first
    this.saveInventoryImports(list);
  },
  getInventoryImportColumns(importId?: string): InventoryImportColumn[] {
    const all = getLocalStorageItem<InventoryImportColumn[]>(KEYS.INVENTORY_IMPORT_COLUMNS, []);
    return importId ? all.filter(c => c.importId === importId) : all;
  },
  saveInventoryImportColumns(columns: InventoryImportColumn[]): void {
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_COLUMNS, columns);
  },
  getInventoryImportRows(importId?: string): InventoryImportRow[] {
    const all = getLocalStorageItem<InventoryImportRow[]>(KEYS.INVENTORY_IMPORT_ROWS, []);
    return importId ? all.filter(r => r.importId === importId) : all;
  },
  saveInventoryImportRows(rows: InventoryImportRow[]): void {
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_ROWS, rows);
  },
  getInventoryImportErrors(importId?: string): InventoryImportError[] {
    const all = getLocalStorageItem<InventoryImportError[]>(KEYS.INVENTORY_IMPORT_ERRORS, []);
    return importId ? all.filter(e => e.importId === importId) : all;
  },
  saveInventoryImportErrors(errors: InventoryImportError[]): void {
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_ERRORS, errors);
  },
  getInventoryImportMappings(importId?: string): InventoryImportMapping[] {
    const all = getLocalStorageItem<InventoryImportMapping[]>(KEYS.INVENTORY_IMPORT_MAPPINGS, []);
    return importId ? all.filter(m => m.importId === importId) : all;
  },
  saveInventoryImportMappings(mappings: InventoryImportMapping[]): void {
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_MAPPINGS, mappings);
  },

  // Helper utils
  getUnitCode(unitId: string): string {
    const unit = this.getUnits().find(u => u.id === unitId);
    return unit ? unit.code : 'und';
  },
  getCategoryName(categoryId: string): string {
    const cat = this.getCategories().find(c => c.id === categoryId);
    return cat ? cat.name : 'Sin categoría';
  },

  // === RECIPES ACCESSORS ===
  getRecipes(): Recipe[] {
    return getLocalStorageItem<Recipe[]>(KEYS.RECIPES, []);
  },
  saveRecipes(recipes: Recipe[]): void {
    setLocalStorageItem(KEYS.RECIPES, recipes);
  },
  addRecipe(recipe: Recipe): void {
    const list = this.getRecipes();
    list.push(recipe);
    this.saveRecipes(list);
    this.addAuditLog('CREACIÓN_RECETA', 'Configuración', `Creada la receta para plato ${recipe.name}`, recipe.id);
  },
  deleteRecipe(id: string): void {
    const list = this.getRecipes().filter(r => r.id !== id);
    this.saveRecipes(list);
    this.addAuditLog('ELIMINACIÓN_RECETA', 'Configuración', `Eliminada receta ID ${id}`, id);
  },

  // Recipe sales deductions
  registerRecipeSale(recipeId: string, quantitySold: number, channel: SalesChannel, reference?: string): void {
    const recipe = this.getRecipes().find(r => r.id === recipeId);
    if (!recipe) return;

    const currentUser = this.getCurrentUser();

    recipe.ingredients.forEach(ing => {
      const totalQty = ing.quantity * quantitySold;
      if (ing.isPortion) {
        // Deduct from portionsAvailable
        this.addPortionMovement({
          id: 'pmov-' + Math.random().toString(36).substr(2, 9),
          productId: ing.productId,
          movementType: 'PORTION_SALE',
          quantity: -totalQty,
          reason: `Venta de Plato: ${recipe.name} q:${quantitySold}`,
          relatedEntityType: 'RecipeSale',
          relatedEntityId: recipeId,
          userId: currentUser.id,
          userName: currentUser.name,
          comment: `Descuento automático de porción por venta en canal ${channel}. Ref: ${reference || 'Sin Ref'}`,
          createdAt: new Date().toISOString()
        });
      } else {
        // Deduct from raw stock currentStock
        const products = this.getProducts();
        const index = products.findIndex(p => p.id === ing.productId);
        if (index !== -1) {
          const product = products[index];
          const prevStock = product.currentStock;
          const newStock = Math.max(0, prevStock - totalQty);

          products[index] = {
            ...product,
            currentStock: newStock
          };
          setLocalStorageItem(KEYS.PRODUCTS, products);

          this.addMovement({
            id: 'mov-' + Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            qty: -totalQty,
            unitCode: this.getUnitCode(product.unitId),
            type: 'Salida',
            quantityBefore: prevStock,
            quantityAfter: newStock,
            area: 'Cocina',
            userId: currentUser.id,
            userName: currentUser.name,
            date: new Date().toISOString(),
            reason: `Venta de Plato: ${recipe.name}`,
            comment: `Deducción de insumos receta q:${quantitySold}. Ref: ${reference || 'Sin Ref'}`
          });
        }
      }
    });

    this.addAuditLog(
      'VENTA_RECETA',
      'Cruce con Ventas',
      `Registrada venta de plato/receta ${recipe.name}: ${quantitySold} unidades. Canal: ${channel}`,
      recipe.id
    );
  },

  // === KITCHEN DAILY CLOSE ACCESSORS ===
  getDailyCloses(): KitchenDailyClose[] {
    return getLocalStorageItem<KitchenDailyClose[]>(KEYS.DAILY_CLOSES, []);
  },
  saveDailyCloses(closes: KitchenDailyClose[]): void {
    setLocalStorageItem(KEYS.DAILY_CLOSES, closes);
  },
  addDailyClose(close: KitchenDailyClose): void {
    const list = this.getDailyCloses();
    list.unshift(close); // Newest closes first
    this.saveDailyCloses(list);

    // After closing, we also create portion adjustments or wastes based on counted vs expected
    close.items.forEach(item => {
      const diff = item.physicalCountingPortions - item.expectedClosingPortions;
      if (diff !== 0) {
        // Register Portion Movement Adjustment!
        this.addPortionMovement({
          id: 'pmov-' + Math.random().toString(36).substr(2, 9),
          productId: item.productId,
          movementType: 'PORTION_ADJUSTMENT',
          quantity: diff, // positive (surplus) or negative (deficit)
          reason: `Ajuste por Cierre Diario de Cocina del día ${close.date}`,
          relatedEntityType: 'KitchenDailyClose',
          relatedEntityId: close.id,
          userId: close.closedByUserId,
          userName: close.closedByUserName,
          comment: `Diferencia detectada en cierre: ${diff} porciones. Motivo: ${item.reason || 'Otros'}. Comentario: ${item.comment || 'Ninguno'}`,
          createdAt: new Date().toISOString()
        });
      }
    });

    this.addAuditLog(
      'CIERRE_DIARIO_COCINA',
      'Cierre',
      `Cierre diario de cocina efectuado para la fecha ${close.date}. Estado: SELLADO. Dif total: ${close.items.reduce((acc, i) => acc + i.difference, 0)} porciones.`,
      close.id
    );
  }
};
