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
  UserStatus,
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
  DAILY_CLOSES: 'restock_pro__daily_closes',
  BASE_PREPARATIONS: 'restock_pro_base_preparations_v1',
  PRODUCTION_RECORDS: 'restock_pro_production_records_v1'
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
  const versionKey = 'restock_pro_clean_v6_basepreps';
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
      },
      {
        id: 'rec-arepa-pollo',
        name: 'Arepa Reina Pepiada (Pollo y Queso)',
        ingredients: [
          { productId: 'prod-base-masa', quantity: 80, isPortion: false }, // usa 80 g de masa lista de arepa
          { productId: 'prod-base-pollo', quantity: 1, isPortion: true }, // usa 1 porción de pollo esmechado (100g)
          { productId: 'prod-sal', quantity: 1, isPortion: false }        // usa 1 g de sal
        ],
        price: 280
      },
      {
        id: 'rec-arepa-sencilla',
        name: 'Arepa Viuda (Solo Masa)',
        ingredients: [
          { productId: 'prod-base-masa', quantity: 80, isPortion: false } // usa 80 g de masa lista de arepa
        ],
        price: 150
      }
    ]);
    setLocalStorageItem(KEYS.DAILY_CLOSES, []);

    // Preparaciones Base Iniciales
    const initialBasePreparations = [
      {
        id: 'base-prep-masa-arepa',
        name: 'Masa lista de arepa',
        code: 'PREP-MASA-AREPA',
        categoryId: 'cat-4', // Almacén y Abarrotes
        transformationType: 'BASE_PREPARATION' as const,
        ingredients: [
          { productId: 'prod-harina', quantity: 1000, unitId: 'uni-7' }, // 1000g Flour
          { productId: 'prod-agua', quantity: 1500, unitId: 'uni-8' },  // 1500ml Water
          { productId: 'prod-sal', quantity: 20, unitId: 'uni-7' },      // 20g Salt
          { productId: 'prod-aceite', quantity: 50, unitId: 'uni-8' }    // 50ml Oil
        ],
        expectedYieldPercentage: 100,
        expectedWastePercentage: 5,
        resultUnitId: 'uni-7', // Gramos
        expectedResultQty: 2400, // 2400 g
        actualResultQty: 2400,
        standardPortionSize: 80, // 80 g portion
        standardPortionUnitId: 'uni-9', // portion
        portionsExpected: 30, // 2400 / 80
        portionsReal: 30,
        totalCost: 138.5,
        costPerResultUnit: 0.0577, // 138.5 / 2400
        costPerPortion: 4.62, // 138.5 / 30
        status: 'Activo' as const,
        createdAt: new Date().toISOString()
      },
      {
        id: 'base-prep-pollo-esmechado',
        name: 'Pollo esmechado',
        code: 'PREP-POLLO-ESMECHADO',
        categoryId: 'cat-1', // Carnes y Aves
        transformationType: 'YIELD_PRODUCTION' as const,
        ingredients: [
          { productId: 'prod-pollo-crudo', quantity: 10000, unitId: 'uni-7' } // 10 kg Chicken Crudo
        ],
        expectedYieldPercentage: 70, // 70% yield
        expectedWastePercentage: 30, // 30% loss
        resultUnitId: 'uni-7', // Gramos
        expectedResultQty: 7000, // 7000 g
        actualResultQty: 7000,
        standardPortionSize: 100, // 100 g portion
        standardPortionUnitId: 'uni-9',
        portionsExpected: 70,
        portionsReal: 70,
        totalCost: 2600.0, // 10000 * 0.26
        costPerResultUnit: 0.3714, // 2600 / 7000
        costPerPortion: 37.14, // 2600 / 70
        status: 'Activo' as const,
        createdAt: new Date().toISOString()
      }
    ];
    setLocalStorageItem(KEYS.BASE_PREPARATIONS, initialBasePreparations);
    setLocalStorageItem(KEYS.PRODUCTION_RECORDS, []);
  }
}

// Main accessors
export const store = {
  // Permissions & RBAC Evaluation
  hasPermission(user: User, permission: string): boolean {
    const role = user.role;
    // Admin has absolute control
    if (role === 'ADMIN') return true;
    
    // Check custom special permissions
    if (user.specialPermissions && user.specialPermissions.includes(permission)) {
      return true;
    }

    switch (role) {
      case 'GERENTE':
        return [
          'inventory.view',
          'purchase.view',
          'purchase_book.view',
          'requisition.approve',
          'inventory.transfer',
          'inventory.adjust',
          'inventory.approve_count',
          'daily_close.view',
          'daily_close.justify',
          'daily_close.approve',
          'reports.view',
          'audit.view',
          'users.view'
        ].includes(permission);

      case 'COMPRAS':
        return [
          'inventory.view',
          'purchase.view',
          'purchase.create',
          'purchase.update',
          'purchase.upload_invoice',
          'purchase.confirm_ocr',
          'purchase_book.view',
          'purchase_book.analytics',
          'settings.manage',
          'menu.view'
        ].includes(permission);

      case 'ALMACEN_RECEPCION':
      case 'RECEPCIÓN':
        return [
          'inventory.view',
          'inventory.transfer',
          'purchase.view',
          'purchase.update',
          'requisition.deliver',
          'portioning.view'
        ].includes(permission);

      case 'CHEF':
      case 'COCINA':
        return [
          'inventory.view',
          'inventory.count',
          'inventory.adjust',
          'requisition.create',
          'requisition.approve',
          'portioning.view',
          'portioning.create',
          'recipe.view',
          'recipe.create',
          'recipe.update',
          'daily_close.view',
          'daily_close.create'
        ].includes(permission);

      case 'COCINERO':
        return [
          'inventory.view',
          'inventory.count',
          'requisition.create',
          'portioning.create',
          'inventory.adjust',
          'recipe.view'
        ].includes(permission);

      case 'CONTABILIDAD':
        return [
          'purchase_book.view',
          'purchase_book.export',
          'purchase.view',
          'audit.view',
          'purchase_book.analytics'
        ].includes(permission);

      case 'AUDITOR':
        return [
          'audit.view',
          'inventory.view',
          'purchase.view',
          'purchase_book.view',
          'requisition.view',
          'portioning.view',
          'daily_close.view',
          'reports.view',
          'reports.export'
        ].includes(permission);

      case 'SOLO_LECTURA':
      case 'LECTURA':
        return [
          'inventory.view',
          'reports.view'
        ].includes(permission);

      default:
        return false;
    }
  },

  // Current user
  getCurrentUser(): User | null {
    const raw = localStorage.getItem(KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw) as User;
      const list = this.getUsers();
      // Keep it completely in sync with users database updates (status/role change)
      const found = list.find(dbu => dbu.id === u.id);
      if (found) {
        // If they are no longer active, sign them out safely
        if (found.status === 'DISABLED' || found.status === 'SUSPENDED' || found.status === 'REJECTED') {
          localStorage.removeItem(KEYS.CURRENT_USER);
          return null;
        }
        return found;
      }
      return u;
    } catch {
      return null;
    }
  },
  setCurrentUser(user: User | null): void {
    if (user === null) {
      const prev = this.getCurrentUser();
      if (prev) {
        this.addAuditLog(
          'CIERRE_SESIÓN',
          'Sesión',
          `Usuario ${prev.name} cerró sesión de forma segura`,
          prev.id
        );
      }
      localStorage.removeItem(KEYS.CURRENT_USER);
    } else {
      setLocalStorageItem(KEYS.CURRENT_USER, user);
      this.addAuditLog(
        'INICIO_SESIÓN',
        'Sesión',
        `Usuario inició sesión mediante Google Sign-In con rol ${user.role} (Sede: ${user.hq || 'N/A'}, Área: ${user.area || 'N/A'})`,
        user.id
      );
    }
  },

  // Users
  getUsers(): User[] {
    const users = getLocalStorageItem<User[]>(KEYS.USERS, mockUsers);
    return users.map(u => ({
      ...u,
      status: u.status || 'ACTIVE',
      organizationId: u.organizationId || 'Celler Gourmet'
    }));
  },
  saveUsers(users: User[]): void {
    setLocalStorageItem(KEYS.USERS, users);
  },

  inviteUser(user: Omit<User, 'id'> & { id?: string }): void {
    const users = this.getUsers();
    const newId = user.id || 'usr-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      ...user,
      id: newId,
      status: 'ACTIVE',
      avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      organizationId: 'Celler Gourmet'
    };
    users.push(newUser);
    this.saveUsers(users);
    this.addAuditLog('CREACIÓN_USUARIO', 'Usuarios', `Usuario invitado por administrador: ${newUser.name} (${newUser.email}, Rol: ${newUser.role}, Sede: ${newUser.hq || 'N/A'}, Área: ${newUser.area || 'N/A'})`, newUser.id);
  },

  requestAccess(name: string, email: string, sub: string, avatarUrl?: string): User {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    if (existing) {
      if (!existing.sub) {
        existing.sub = sub;
        this.saveUsers(users);
      }
      return existing;
    }
    const newId = 'usr-' + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      id: newId,
      name,
      email,
      sub,
      role: 'SOLO_LECTURA',
      avatar: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
      status: 'PENDING_APPROVAL',
      dateOfRequest: new Date().toISOString(),
      organizationId: 'Celler Gourmet',
      hq: 'Pendiente',
      area: 'Pendiente'
    };
    users.push(newUser);
    this.saveUsers(users);
    this.addAuditLog('CREACIÓN_USUARIO', 'Usuarios', `Nueva solicitud de acceso desde Google: ${name} (${email}, Google sub: ${sub})`, newUser.id);
    return newUser;
  },

  approveUserRequest(id: string, role: Role, hq: string, area: string): void {
    const users = this.getUsers();
    const list = users.map(u => {
      if (u.id === id) {
        this.addAuditLog('APROBACIÓN_USUARIO', 'Usuarios', `Aprobada solicitud de acceso para ${u.name} (${u.email}) con rol ${role} en la Sede ${hq} (Área: ${area})`, u.id);
        return {
          ...u,
          status: 'ACTIVE' as UserStatus,
          role,
          hq,
          area
        };
      }
      return u;
    });
    this.saveUsers(list);
  },

  rejectUserRequest(id: string): void {
    const users = this.getUsers();
    const list = users.map(u => {
      if (u.id === id) {
        this.addAuditLog('USUARIO_RECHAZADO', 'Usuarios', `Rechazada solicitud de acceso por administrador para ${u.name} (${u.email})`, u.id);
        return {
          ...u,
          status: 'REJECTED' as UserStatus
        };
      }
      return u;
    });
    this.saveUsers(list);
  },

  disableUser(id: string): void {
    const users = this.getUsers();
    const list = users.map(u => {
      if (u.id === id) {
        this.addAuditLog('USUARIO_DESACTIVADO', 'Usuarios', `Deshabilitado acceso al sistema por administrador para ${u.name} (${u.email})`, u.id);
        return {
          ...u,
          status: 'DISABLED' as UserStatus
        };
      }
      return u;
    });
    this.saveUsers(list);
  },

  updateUserRoleAndPermissions(id: string, role: Role, hq: string, area: string, status: UserStatus, specialPermissions?: string[]): void {
    const users = this.getUsers();
    const list = users.map(u => {
      if (u.id === id) {
        let comment = `Modificados datos de usuario ${u.name}. `;
        if (u.role !== role) comment += `Rol cambiado de ${u.role} a ${role}. `;
        if (u.status !== status) comment += `Estado cambiado de ${u.status} a ${status}. `;
        this.addAuditLog('CAMBIO_ROL_PERMISO', 'Usuarios', comment, u.id);
        return {
          ...u,
          role,
          hq,
          area,
          status,
          specialPermissions
        };
      }
      return u;
    });
    this.saveUsers(list);
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
    const raw = getLocalStorageItem<Product[]>(KEYS.PRODUCTS, mockProducts);
    let changed = false;
    const filled = raw.map(p => {
      let isLocalChanged = false;
      
      if (p.requiresPortioning === undefined) {
        p.requiresPortioning = p.id === 'prod-1' || p.name.toLowerCase().includes('pollo') || p.name.toLowerCase().includes('res') || p.name.toLowerCase().includes('salmón') || p.portionsAvailable !== undefined;
        isLocalChanged = true;
      }
      if (p.requiresProcessing === undefined) {
        p.requiresProcessing = false;
        isLocalChanged = true;
      }
      if (p.isConsumedDirect === undefined) {
        p.isConsumedDirect = !p.requiresPortioning;
        isLocalChanged = true;
      }
      if (p.isUsedInRecipes === undefined) {
        p.isUsedInRecipes = true;
        isLocalChanged = true;
      }
      if (p.purchaseUnitId === undefined) {
        p.purchaseUnitId = p.unitId;
        isLocalChanged = true;
      }
      if (p.baseUnitId === undefined) {
        p.baseUnitId = p.unitId;
        isLocalChanged = true;
      }
      if (p.operationalUnitId === undefined) {
        p.operationalUnitId = p.unitId;
        isLocalChanged = true;
      }
      if (p.portionSize === undefined) {
        p.portionSize = p.id === 'prod-1' ? 8 : 0;
        isLocalChanged = true;
      }
      if (p.expectedYield === undefined) {
        p.expectedYield = 100;
        isLocalChanged = true;
      }
      if (p.expectedWaste === undefined) {
        p.expectedWaste = 0;
        isLocalChanged = true;
      }
      if (p.initialReceptionArea === undefined) {
        if (p.categoryId === 'cat-1' || p.categoryId === 'cat-3' || p.name.toLowerCase().includes('pollo') || p.name.toLowerCase().includes('res') || p.name.toLowerCase().includes('pescado') || p.name.toLowerCase().includes('salmón')) {
          p.initialReceptionArea = 'Refrigerados';
        } else {
          p.initialReceptionArea = 'Almacén seco';
        }
        isLocalChanged = true;
      }
      if (p.habitualDestinationArea === undefined) {
        p.habitualDestinationArea = 'Cocina';
        isLocalChanged = true;
      }
      if (p.minStockWarehouse === undefined) {
        p.minStockWarehouse = p.minStock;
        isLocalChanged = true;
      }
      if (p.minStockKitchen === undefined) {
        p.minStockKitchen = Math.ceil(p.minStock * 0.3);
        isLocalChanged = true;
      }

      if (!p.areaStocks) {
        p.areaStocks = {
          'Almacén seco': 0,
          'Refrigerados': 0,
          'Congelados': 0,
          'Cocina': 0,
          'Área de procesamiento': 0,
          'Bar': 0,
          'Desechables': 0,
          'Limpieza': 0,
          'Otro': 0
        };
        const targetArea = p.initialReceptionArea || 'Almacén seco';
        p.areaStocks[targetArea] = p.currentStock;
        isLocalChanged = true;
      }
      
      if (isLocalChanged) {
        changed = true;
      }
      return p;
    });

    if (changed) {
      setLocalStorageItem(KEYS.PRODUCTS, filled);
    }
    return filled;
  },
  saveProducts(products: Product[]): void {
    setLocalStorageItem(KEYS.PRODUCTS, products);
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
    const original = this.getKitchenRequests().find(r => r.id === updated.id);
    const list = this.getKitchenRequests().map(r => r.id === updated.id ? updated : r);
    setLocalStorageItem(KEYS.KITCHEN_REQUESTS, list);

    this.addAuditLog(
      'CAMBIO_ESTADO_SOLICITUD',
      'Solicitudes',
      `Solicitud ${updated.code} cambió a ${updated.status}${updated.reason ? '. Motivo: ' + updated.reason : ''}`,
      updated.id
    );

    // If transitioned to 'Entregada', process inventory TRANSFER and trigger PortionBatch creation
    if (original && original.status !== 'Entregada' && updated.status === 'Entregada') {
      const products = this.getProducts();

      updated.items.forEach(item => {
        const productIndex = products.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          const product = products[productIndex];
          const prevStock = product.currentStock; // General total stock remains unchanged by a transfer
          
          const sourceArea = product.initialReceptionArea || 'Almacén seco';
          const destinationArea = updated.requestingArea || product.habitualDestinationArea || 'Cocina';
          const qty = item.qty;

          const areaStocks = { ...(product.areaStocks || {}) };
          
          // Transfer quantities
          const prevSourceStock = areaStocks[sourceArea] || 0;
          const prevDestStock = areaStocks[destinationArea] || 0;

          areaStocks[sourceArea] = prevSourceStock - qty;
          areaStocks[destinationArea] = prevDestStock + qty;

          // Re-calculate the sum as currentStock (should stay equal to prevStock unless adjusted, but ensures integrity)
          const newStock = Object.values(areaStocks).reduce((a: number, b: any) => a + b, 0);

          products[productIndex] = {
            ...product,
            currentStock: newStock,
            areaStocks: areaStocks
          };

          // 1. Log Salida/Exit from Almacén Area
          this.addMovement({
            id: 'mov-' + Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            qty: -qty,
            unitCode: this.getUnitCode(product.unitId),
            type: 'Salida',
            quantityBefore: prevStock,
            quantityAfter: Math.max(0, prevStock - qty), // logical view decrement
            area: sourceArea,
            userId: updated.approvedById || 'user-anon',
            userName: updated.approvedByName || 'Administrador',
            date: new Date().toISOString(),
            reason: `Transferencia (Requisición ${updated.code})`,
            comment: `Salida de almacén para surtir cocina. Cantidad: ${qty} ${this.getUnitCode(product.unitId)}`,
            documentRelatedId: updated.id
          });

          // 2. Log Entrada/Entry into Kitchen Area
          this.addMovement({
            id: 'mov-' + Math.random().toString(36).substr(2, 9),
            productId: product.id,
            productName: product.name,
            qty: qty,
            unitCode: this.getUnitCode(product.unitId),
            type: 'Entrada',
            quantityBefore: Math.max(0, prevStock - qty), // logical view after exit
            quantityAfter: prevStock,
            area: destinationArea,
            userId: updated.creatorId,
            userName: updated.creatorName,
            date: new Date().toISOString(),
            reason: `Recepción Suministro (Requisición ${updated.code})`,
            comment: `Ingreso de mercancía al inventario operativo de la cocina.`,
            documentRelatedId: updated.id
          });

          // 3. Auto-spawn PortionBatch kitchen task if product has registered portion rules
          if (product.requiresPortioning) {
            const rules = this.getPortionRules();
            const rule = rules.find(r => r.productId === product.id && r.isActive);
            if (rule) {
              const baseQuantity = qty * rule.conversionFactor;
              const theoreticalPortions = (baseQuantity * (rule.expectedYieldPercentage / 100)) / rule.standardPortionSize;
              const totalCost = qty * product.averageCost;
              const estimatedCostPerPortion = theoreticalPortions > 0 ? totalCost / theoreticalPortions : 0;

              this.addPortionBatch({
                id: 'lote-' + Math.random().toString(36).substr(2, 9),
                productId: product.id,
                quantityPurchased: qty,
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
                responsibleUserId: updated.creatorId,
                createdAt: new Date().toISOString()
              });

              this.addAuditLog(
                'LOTE_PROGRAMADO_KITCHEN',
                'Porcionamiento',
                `Se programó automáticamente lote de porcionamiento por entrega de requisición ${updated.code} para ${product.name}`,
                product.id
              );
            }
          }
        }
      });

      // Save updated products list
      setLocalStorageItem(KEYS.PRODUCTS, products);
    }
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

        const receptionArea = product.initialReceptionArea || 'Almacén seco';
        const areaStocks = { ...(product.areaStocks || {}) };
        const prevAreaStock = areaStocks[receptionArea] || 0;
        areaStocks[receptionArea] = prevAreaStock + addedQty;

        const newStock: number = Object.values(areaStocks).reduce((a: number, b: any) => a + Number(b || 0), 0) as number;

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
          lastPrice: item.unitPrice,
          areaStocks: areaStocks
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
          area: receptionArea,
          userId: currentUser.id,
          userName: currentUser.name,
          date: new Date().toISOString(),
          reason: `Compra RECIBIDA (${purchase.invoiceNumber})`,
          comment: `Código de Orden: ${purchase.code}. Costo unitario: $${item.unitPrice}. Recibida en área: ${receptionArea}`,
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
  saveMovements(movements: InventoryMovement[]): void {
    setLocalStorageItem(KEYS.MOVEMENTS, movements);
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

        // Discount from kitchen or processing area
        const discountArea = (product.habitualDestinationArea || 'Cocina') as InventoryArea;
        const areaStocks = { ...(product.areaStocks || {}) };
        const prevAreaStock = areaStocks[discountArea] || 0;
        areaStocks[discountArea] = Math.max(0, prevAreaStock - batch.quantityPurchased);

        // Calculate general sum currentStock
        const newStock = Object.values(areaStocks).reduce((a: number, b: any) => a + b, 0);

        // Update product stock and portions stock
        const prevPortions = product.portionsAvailable || 0;
        const newPortions = prevPortions + batch.realPortions;

        products[productIndex] = {
          ...product,
          currentStock: newStock,
          portionsAvailable: newPortions,
          areaStocks: areaStocks
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
          area: discountArea,
          userId: approvedByUserId,
          userName: approvedByUserName,
          date: new Date().toISOString(),
          reason: `Descuento de materia prima por porcionado (${batch.id})`,
          comment: `Se procesaron ${batch.quantityPurchased} ${batch.purchaseUnit} desde ${discountArea} para producir ${batch.realPortions} porciones.`,
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
      const newPortions = Math.max(0, prevPortions + diffQty);

      const areaStocks = { ...(p.areaStocks || {}) };
      let newStock = p.currentStock;

      // Determine size of portion to sync physical stock
      let portionSize = p.portionSize || 1;
      if (p.isBasePreparation) {
        portionSize = 100;
        if (p.id === 'prod-base-masa') portionSize = 80;
        if (p.id === 'prod-base-pollo') portionSize = 100;
      }

      if (portionSize > 1) {
        const prevAreaStock = areaStocks['Cocina'] || 0;
        // diffQty is negative for sales/usage, so it correctly decreases stock
        areaStocks['Cocina'] = Math.max(0, prevAreaStock + (diffQty * portionSize));
        newStock = Object.values(areaStocks).reduce((a: number, b: any) => a + b, 0);
      }

      products[index] = {
        ...p,
        portionsAvailable: newPortions,
        currentStock: portionSize > 1 ? newStock : p.currentStock,
        areaStocks: portionSize > 1 ? areaStocks : p.areaStocks
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
    const productsList = this.getProducts();

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
        const index = productsList.findIndex(p => p.id === ing.productId);
        if (index !== -1) {
          const product = productsList[index];
          const prevStock = product.currentStock;

          // Deduct from Cocina area of that product
          const areaStocks = { ...(product.areaStocks || {}) };
          const prevAreaStock = areaStocks['Cocina'] || 0;
          areaStocks['Cocina'] = Math.max(0, prevAreaStock - totalQty);

          const newStock = Object.values(areaStocks).reduce((a: number, b: any) => a + b, 0);

          productsList[index] = {
            ...product,
            currentStock: newStock,
            areaStocks: areaStocks
          };

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

    // Save final list after potential modifications
    setLocalStorageItem(KEYS.PRODUCTS, productsList);

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
  },

  // === BASE PREPARATIONS ACCESSORS ===
  getBasePreparations(): any[] {
    return getLocalStorageItem<any[]>(KEYS.BASE_PREPARATIONS, []);
  },
  saveBasePreparations(preps: any[]): void {
    setLocalStorageItem(KEYS.BASE_PREPARATIONS, preps);
  },
  addBasePreparation(prep: any): void {
    const list = this.getBasePreparations();
    list.push(prep);
    this.saveBasePreparations(list);
    this.addAuditLog('CREACIÓN_PREPARACIÓN_BASE', 'Producción', `Creada la preparación base ${prep.name}`, prep.id);
  },
  updateBasePreparation(prep: any): void {
    const list = this.getBasePreparations().map(p => p.id === prep.id ? prep : p);
    this.saveBasePreparations(list);
    this.addAuditLog('EDICIÓN_PREPARACIÓN_BASE', 'Producción', `Actualizada la preparación base ${prep.name}`, prep.id);
  },
  deleteBasePreparation(id: string): void {
    const list = this.getBasePreparations().filter(p => p.id !== id);
    this.saveBasePreparations(list);
    this.addAuditLog('ELIMINACIÓN_PREPARACIÓN_BASE', 'Producción', `Eliminada preparación base ID ${id}`, id);
  },

  // === PRODUCTION RECORDS ACCESSORS ===
  getProductionRecords(): any[] {
    return getLocalStorageItem<any[]>(KEYS.PRODUCTION_RECORDS, []);
  },
  saveProductionRecords(records: any[]): void {
    setLocalStorageItem(KEYS.PRODUCTION_RECORDS, records);
  },
  addProductionRecord(record: any): void {
    const list = this.getProductionRecords();
    list.unshift(record); // newest first
    this.saveProductionRecords(list);
  },

  // === PROCESS COMPLETE LIVE PRODUCTION ===
  executeProduction(
    prepId: string,
    actualResultQty: number,
    portionsReal: number,
    responsibleUserId: string,
    notes?: string
  ): { success: boolean; error?: string; record?: any } {
    const preps = this.getBasePreparations();
    const prepIndex = preps.findIndex(p => p.id === prepId);
    if (prepIndex === -1) {
      return { success: false, error: 'La preparación base no existe.' };
    }
    const prep = preps[prepIndex];
    const userList = this.getUsers();
    const user = userList.find(u => u.id === responsibleUserId) || this.getCurrentUser();

    const productsList = this.getProducts();

    // 1. Calculate live cost of ingredients based on averageCost from products list
    let generatedTotalCost = 0;
    const ingredientDeductions: { product: Product; qty: number }[] = [];

    for (const ing of prep.ingredients) {
      const prod = productsList.find(p => p.id === ing.productId);
      if (!prod) {
        return { success: false, error: `El ingrediente ${ing.productId} no se encuentra en el catálogo.` };
      }
      generatedTotalCost += ing.quantity * (prod.averageCost || 0);
      ingredientDeductions.push({ product: prod, qty: ing.quantity });
    }

    // 2. Perform safe deductions of ingredients (from 'Cocina' area stocks)
    ingredientDeductions.forEach(({ product, qty }) => {
      const prodIndex = productsList.findIndex(p => p.id === product.id);
      if (prodIndex !== -1) {
        const p = productsList[prodIndex];
        const prevStock = p.currentStock;
        const areaStocks = { ...(p.areaStocks || {}) };
        const prevAreaStock = areaStocks['Cocina'] || 0;

        areaStocks['Cocina'] = Math.max(0, prevAreaStock - qty);
        const newStock = Object.values(areaStocks).reduce((a: number, b: any) => a + b, 0);

        productsList[prodIndex] = {
          ...p,
          currentStock: newStock,
          areaStocks: areaStocks
        };

        // Record Salida movement in Kárdex
        this.addMovement({
          id: 'mov-' + Math.random().toString(36).substr(2, 9),
          productId: p.id,
          productName: p.name,
          qty: -qty,
          unitCode: this.getUnitCode(p.unitId),
          type: 'Salida',
          quantityBefore: prevStock,
          quantityAfter: newStock,
          area: 'Cocina',
          userId: user.id,
          userName: user.name,
          date: new Date().toISOString(),
          reason: `Consumo por Producción: ${prep.name}`,
          comment: `Deducción de insumos automática para lote de producción.`
        });
      }
    });

    // 3. Add resulting yield to operational kitchen stock of the Base Preparation Product
    let baseProdIndex = productsList.findIndex(p => p.basePreparationId === prepId || p.id === 'prod-base-' + prep.code.toLowerCase().replace('prep-', ''));
    if (baseProdIndex === -1) {
      baseProdIndex = productsList.findIndex(p => p.name.toLowerCase().includes(prep.name.toLowerCase()));
    }

    if (baseProdIndex !== -1) {
      const bp = productsList[baseProdIndex];
      const prevStock = bp.currentStock;
      const prevPortions = bp.portionsAvailable || 0;
      const areaStocks = { ...(bp.areaStocks || {}) };
      const prevAreaStock = areaStocks['Cocina'] || 0;

      areaStocks['Cocina'] = prevAreaStock + actualResultQty;
      const newStock = Object.values(areaStocks).reduce((a: number, b: any) => a + b, 0);

      // Recalculate averageCost based on generated ingredient cost
      const bpAverageCost = actualResultQty > 0 ? (generatedTotalCost / actualResultQty) : bp.averageCost;

      productsList[baseProdIndex] = {
        ...bp,
        currentStock: newStock,
        portionsAvailable: prevPortions + portionsReal,
        averageCost: bpAverageCost,
        lastPrice: bpAverageCost,
        areaStocks: areaStocks
      };

      // Record Entrada movement in Kárdex for results
      this.addMovement({
        id: 'mov-' + Math.random().toString(36).substr(2, 9),
        productId: bp.id,
        productName: bp.name,
        qty: actualResultQty,
        unitCode: this.getUnitCode(bp.unitId),
        type: 'Entrada',
        quantityBefore: prevStock,
        quantityAfter: newStock,
        area: 'Cocina',
        userId: user.id,
        userName: user.name,
        date: new Date().toISOString(),
        reason: `Rendimiento de Producción: ${prep.name}`,
        comment: `Entrada por producción real de ${actualResultQty}g / ${portionsReal} porciones creadas.`
      });

      // Record portion movement to keep audit neat
      if (portionsReal > 0) {
        const portionMId = 'pmov-' + Math.random().toString(36).substr(2, 9);
        const list = this.getPortionMovements();
        list.unshift({
          id: portionMId,
          productId: bp.id,
          movementType: 'PORTION_IN',
          quantity: portionsReal,
          reason: `Rendimiento de Producción: ${prep.name}`,
          userId: user.id,
          userName: user.name,
          comment: `Producción de porciones reales resultantes del lote.`,
          createdAt: new Date().toISOString()
        });
        setLocalStorageItem(KEYS.PORTION_MOVEMENTS, list);
      }
    }

    // Save final products list to storage
    setLocalStorageItem(KEYS.PRODUCTS, productsList);

    // 4. Calculate metrics
    const differenceQty = actualResultQty - prep.expectedResultQty;
    const costPerResultUnit = actualResultQty > 0 ? (generatedTotalCost / actualResultQty) : 0;
    const costPerPortion = portionsReal > 0 ? (generatedTotalCost / portionsReal) : 0;

    // 5. Create production record
    const newRecord = {
      id: 'pr-' + Math.random().toString(36).substr(2, 9),
      preparationId: prepId,
      date: new Date().toISOString(),
      expectedResultQty: prep.expectedResultQty,
      actualResultQty,
      portionsExpected: prep.portionsExpected,
      portionsReal,
      differenceQty,
      mermaQty: differenceQty < 0 ? Math.abs(differenceQty) : 0, // loss or waste
      costPerResultUnit,
      costPerPortion,
      responsibleUserId: user.id,
      responsibleUserName: user.name,
      notes,
      status: 'Completado' as const
    };

    this.addProductionRecord(newRecord);

    // Update the base preparation object with historical values
    preps[prepIndex] = {
      ...prep,
      actualResultQty,
      portionsReal,
      totalCost: generatedTotalCost,
      costPerResultUnit,
      costPerPortion
    };
    this.saveBasePreparations(preps);

    // Add Audit logs
    this.addAuditLog(
      'CONSIGNACION_PRODUCCION',
      'Producción',
      `Lote procesado para ${prep.name}. Esperado: ${prep.expectedResultQty} (g/ml), Obtenido: ${actualResultQty} (g/ml). Diferencia: ${differenceQty}. Costo por porción: RD$ ${costPerPortion.toFixed(2)}`,
      newRecord.id
    );

    return { success: true, record: newRecord };
  },

  resetAllToZero(): void {
    // 1. Fetch current products
    const products = this.getProducts();
    // 2. Map all current stocks and prices to 0
    const zeroedProducts = products.map((p) => ({
      ...p,
      currentStock: 0,
      portionsAvailable: 0,
      averageCost: 0,
      lastPrice: 0,
      areaStocks: p.areaStocks ? Object.keys(p.areaStocks).reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {} as Record<string, number>) : { "Cocina": 0 }
    }));
    
    // Save zeroed products back to store
    setLocalStorageItem(KEYS.PRODUCTS, zeroedProducts);

    // 3. Clear all custom transactional records completely to empty
    setLocalStorageItem(KEYS.KITCHEN_REQUESTS, []);
    setLocalStorageItem(KEYS.PURCHASES, []);
    setLocalStorageItem(KEYS.MOVEMENTS, []);
    setLocalStorageItem(KEYS.PHYSICAL_SESSIONS, []);
    setLocalStorageItem(KEYS.PORTION_BATCHES, []);
    setLocalStorageItem(KEYS.PORTION_MOVEMENTS, []);
    setLocalStorageItem(KEYS.PORTION_SALES, []);
    setLocalStorageItem(KEYS.INVENTORY_IMPORTS, []);
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_COLUMNS, []);
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_ROWS, []);
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_ERRORS, []);
    setLocalStorageItem(KEYS.INVENTORY_IMPORT_MAPPINGS, []);
    setLocalStorageItem(KEYS.DAILY_CLOSES, []);
    setLocalStorageItem(KEYS.PRODUCTION_RECORDS, []);
    setLocalStorageItem(KEYS.RECIPES, []);

    // 4. Log the audit trace for this complete reset operation
    this.addAuditLog(
      'PUESTA_A_CERO',
      'Configurativo',
      'Puesta a cero general de todas las existencias, historiales de compras, movimientos de kárdex, mermas de porcionamiento y registro de ventas.',
      'system'
    );
  }
};
