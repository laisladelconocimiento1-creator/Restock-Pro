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
  InventoryArea
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
  mockConfig
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
  CONFIG: 'restock_pro_config'
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
  const versionKey = 'restock_pro_clean_v3-rd';
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

  // Helper utils
  getUnitCode(unitId: string): string {
    const unit = this.getUnits().find(u => u.id === unitId);
    return unit ? unit.code : 'und';
  },
  getCategoryName(categoryId: string): string {
    const cat = this.getCategories().find(c => c.id === categoryId);
    return cat ? cat.name : 'Sin categoría';
  }
};
