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
  PortionRule,
  PortionBatch,
  PortionMovement,
  PortionSale
} from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Diana Alarcón',
    email: 'diana.alarcon@cellergourmet.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Administración',
    organizationId: 'Celler Gourmet',
    sub: 'sub_diana001'
  },
  {
    id: 'usr-2',
    name: 'Rodrigo Mendoza',
    email: 'rodrigo.mendoza@cellergourmet.com',
    role: 'GERENTE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Gerencia',
    organizationId: 'Celler Gourmet',
    sub: 'sub_rodrigo002'
  },
  {
    id: 'usr-3',
    name: 'Sandra Ortiz',
    email: 'sandra.ortiz@cellergourmet.com',
    role: 'COMPRAS',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Compras',
    organizationId: 'Celler Gourmet',
    sub: 'sub_sandra003'
  },
  {
    id: 'usr-4',
    name: 'Chef Carlos Ríos',
    email: 'carlos.chef@cellergourmet.com',
    role: 'CHEF',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Cocina Principal',
    organizationId: 'Celler Gourmet',
    sub: 'sub_carlos004'
  },
  {
    id: 'usr-5',
    name: 'Andrés Gil',
    email: 'andres.gil@cellergourmet.com',
    role: 'ALMACEN_RECEPCION',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Almacén de Recepción',
    organizationId: 'Celler Gourmet',
    sub: 'sub_andres005'
  },
  {
    id: 'usr-6',
    name: 'Contadora Patricia',
    email: 'patricia.contad@cellergourmet.com',
    role: 'CONTABILIDAD',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Finanzas',
    organizationId: 'Celler Gourmet',
    sub: 'sub_patricia006'
  },
  {
    id: 'usr-7',
    name: 'Lic. Sergio Flores',
    email: 'sergio.auditor@cellergourmet.com',
    role: 'AUDITOR',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Contraloría',
    organizationId: 'Celler Gourmet',
    sub: 'sub_sergio007'
  },
  {
    id: 'usr-8',
    name: 'Mariana Ríos',
    email: 'mariana.reader@cellergourmet.com',
    role: 'SOLO_LECTURA',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Lectura General',
    organizationId: 'Celler Gourmet',
    sub: 'sub_mariana008'
  },
  {
    id: 'usr-9',
    name: 'Pedro Cocinero',
    email: 'pedro.cocina@cellergourmet.com',
    role: 'COCINERO',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    status: 'ACTIVE',
    hq: 'Sede Central',
    area: 'Cocina Fría',
    organizationId: 'Celler Gourmet',
    sub: 'sub_pedro009'
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Carnes y Aves', description: 'Cortes premium de res, cerdo, pollo e ingredientes carnes.' },
  { id: 'cat-2', name: 'Vegetales y Frutas', description: 'Insumos frescos del mercadillo local, legumbres and frutas.' },
  { id: 'cat-3', name: 'Lácteos y Quesos', description: 'Leche, quesos, cremas, mantequilla y derivados.' },
  { id: 'cat-4', name: 'Almacén y Abarrotes', description: 'Harinas, aceites, especias, salsas y pastas.' },
  { id: 'cat-5', name: 'Bebidas e Alcohol', description: 'Refrescos, aguas minerales, destilados, vinos y cerveza.' },
  { id: 'cat-6', name: 'Desechables', description: 'Empaques de comida transportables, bolsas y utensilios.' },
  { id: 'cat-7', name: 'Productos de Limpieza', description: 'Químicos, jabones, desengrasantes, cloro e higiénicos.' }
];

export const mockUnits: Unit[] = [
  { id: 'uni-1', code: 'lb', name: 'Libras' },
  { id: 'uni-2', code: 'l', name: 'Litros' },
  { id: 'uni-3', code: 'pz', name: 'Piezas' },
  { id: 'uni-4', code: 'lata', name: 'Lata' },
  { id: 'uni-5', code: 'caja', name: 'Caja' },
  { id: 'uni-6', code: 'oz', name: 'Onzas' },
  { id: 'uni-7', code: 'g', name: 'Gramos' },
  { id: 'uni-8', code: 'ml', name: 'Mililitros' },
  { id: 'uni-9', code: 'porc', name: 'Porciones' }
];

export const mockProviders: Provider[] = [
  {
    id: 'prov-1',
    name: 'Distribuidora de Carnes Nacional',
    rfc: 'DCN091218AA3',
    contactName: 'Ing. Mercedes Valenzuela',
    phone: '809-555-0199',
    email: 'contacto@carnesnacionales.com',
    address: 'Av. Abraham Lincoln, Santo Domingo, RD',
    categories: ['cat-1'],
    rating: 5
  },
  {
    id: 'prov-2',
    name: 'Pollos del Caribe',
    rfc: 'PDC980721BB4',
    contactName: 'Juan Carlos Gómez',
    phone: '809-555-0245',
    email: 'ventas@pollosdelcaribe.com.do',
    address: 'Carr. Mella Km 8.5, Santo Domingo Este, RD',
    categories: ['cat-1'],
    rating: 4
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Filete de Pollo Pechuga',
    categoryId: 'cat-1',
    unitId: 'uni-1',
    currentStock: 20, // 20 libras
    minStock: 10,
    maxStock: 80,
    averageCost: 120, // RD$120 por libra
    lastPrice: 120,
    description: 'Pechuga de pollo fresca lista para porcionar en filetes estándares para plancha.',
    providerIds: ['prov-1', 'prov-2'],
    portionsAvailable: 16, // 38 producidas - 15 vendidas - 2 consumo personal - 5 ventas delivery
    areaStocks: {
      'Almacén seco': 0,
      'Refrigerados': 10,
      'Congelados': 5,
      'Cocina': 5
    }
  },
  {
    id: 'prod-2',
    name: 'Corte de Res Lomo Angus',
    categoryId: 'cat-1',
    unitId: 'uni-1',
    currentStock: 15,
    minStock: 5,
    maxStock: 40,
    averageCost: 450,
    lastPrice: 450,
    description: 'Lomo fino de res Angus importado para cortes de medallón gourmet.',
    providerIds: ['prov-1', 'prov-2'],
    portionsAvailable: 0,
    areaStocks: {
      'Refrigerados': 10,
      'Cocina': 5
    }
  },
  {
    id: 'prod-3',
    name: 'Salmón Atlántico Fresco',
    categoryId: 'cat-1',
    unitId: 'uni-1',
    currentStock: 10,
    minStock: 5,
    maxStock: 30,
    averageCost: 550,
    lastPrice: 550,
    description: 'Filetes de salmón de acuicultura noruega para porcionamiento sashimi o grill.',
    providerIds: ['prov-1', 'prov-2'],
    portionsAvailable: 0,
    areaStocks: {
      'Refrigerados': 6,
      'Cocina': 4
    }
  },
  {
    id: 'prod-harina',
    name: 'Harina de Maíz Precocida',
    categoryId: 'cat-4',
    unitId: 'uni-7', // gramos
    currentStock: 20000, // 20,000 gramos = 20 kg
    minStock: 5000,
    maxStock: 100000,
    averageCost: 0.12, // RD$0.12 por gramo (RD$120/kg)
    lastPrice: 0.12,
    description: 'Harina de maíz refinada precocida ideal para masa de arepas y empanadas.',
    providerIds: ['prov-1'],
    areaStocks: {
      'Almacén seco': 15000,
      'Cocina': 5000
    }
  },
  {
    id: 'prod-agua',
    name: 'Agua Purificada Refinada',
    categoryId: 'cat-4',
    unitId: 'uni-8', // mililitros
    currentStock: 100000, // 100,000 ml = 100 L
    minStock: 10000,
    maxStock: 500000,
    averageCost: 0.005, // RD$0.005 por ml (RD$5/L)
    lastPrice: 0.005,
    description: 'Agua filtrada potable para uso en preparaciones culinarias de base.',
    providerIds: ['prov-1'],
    areaStocks: {
      'Almacén seco': 80000,
      'Cocina': 20000
    }
  },
  {
    id: 'prod-sal',
    name: 'Sal Yodada Molida',
    categoryId: 'cat-4',
    unitId: 'uni-7', // gramos
    currentStock: 8000, // 8,000 gramos
    minStock: 1000,
    maxStock: 20000,
    averageCost: 0.05, // RD$0.05 por gramo (RD$50/kg)
    lastPrice: 0.05,
    description: 'Sal de mesa fina yodada para sazonar producciones y salsas.',
    providerIds: ['prov-1'],
    areaStocks: {
      'Almacén seco': 6000,
      'Cocina': 2000
    }
  },
  {
    id: 'prod-aceite',
    name: 'Aceite de Girasol',
    categoryId: 'cat-4',
    unitId: 'uni-8', // mililitros
    currentStock: 15000, // 15L
    minStock: 2000,
    maxStock: 50000,
    averageCost: 0.2, // RD$0.2 por ml (RD$200/L)
    lastPrice: 0.2,
    description: 'Aceite vegetal refinado para cocción y lubricación de masas.',
    providerIds: ['prov-1'],
    areaStocks: {
      'Almacén seco': 10000,
      'Cocina': 5000
    }
  },
  {
    id: 'prod-pollo-crudo',
    name: 'Pollo Entero Limpio (Crudo)',
    categoryId: 'cat-1',
    unitId: 'uni-7', // gramos
    currentStock: 30000, // 30 kg
    minStock: 10000,
    maxStock: 150000,
    averageCost: 0.26, // RD$0.26 por gramo (RD$260/kg)
    lastPrice: 0.26,
    description: 'Pollo crudo lavado entero, listo para despiece, cocción y deshilachado.',
    providerIds: ['prov-2'],
    areaStocks: {
      'Congelados': 20000,
      'Cocina': 10000
    }
  },
  {
    id: 'prod-base-masa',
    name: 'Masa Lista de Arepa (Base)',
    categoryId: 'cat-4',
    unitId: 'uni-7', // gramos
    currentStock: 2400, // 2.4 kg
    minStock: 1000,
    maxStock: 20000,
    averageCost: 0.0577, // calculado de ingredientes
    lastPrice: 0.0577,
    description: 'Preparación base consistente en masa de harina de maíz y condimentos para arepa.',
    providerIds: [],
    isBasePreparation: true,
    basePreparationId: 'base-prep-masa-arepa',
    portionsAvailable: 30, // 2.4kg / 80g de porción
    areaStocks: {
      'Cocina': 2400
    }
  },
  {
    id: 'prod-base-pollo',
    name: 'Pollo Esmechado de la Casa (Base)',
    categoryId: 'cat-1',
    unitId: 'uni-7', // gramos
    currentStock: 7000, // 7 kg
    minStock: 2000,
    maxStock: 30000,
    averageCost: 0.3714, // calculado de rendimiento y coste de pollo crudo
    lastPrice: 0.3714,
    description: 'Pechuga desmenuzada sazonada con merma operativa, lista para relleno.',
    providerIds: [],
    isBasePreparation: true,
    basePreparationId: 'base-prep-pollo-esmechado',
    portionsAvailable: 70, // 7000g / 100g de porción
    areaStocks: {
      'Cocina': 7000
    }
  }
];

export const mockKitchenRequests: KitchenRequest[] = [];

export const mockPurchases: Purchase[] = [
  {
    id: 'purch-1',
    code: 'OC-20260601',
    date: '2026-06-01T15:30:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora de Carnes Nacional',
    items: [
      { productId: 'prod-1', qty: 20, unitPrice: 120, subtotal: 2400, tax: 432, discount: 0, total: 2832 }
    ],
    subtotal: 2400,
    tax: 432,
    discounts: 0,
    total: 2832,
    invoiceNumber: 'B1500000213',
    invoiceDate: '2026-06-01',
    receivedDate: '2026-06-01T17:00:00Z',
    status: 'Recibida',
    paymentMethod: 'Transferencia',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  },
  {
    id: 'purch-2',
    code: 'OC-20260602',
    date: '2026-06-02T10:00:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora de Carnes Nacional',
    items: [
      { productId: 'prod-1', qty: 80, unitPrice: 115, subtotal: 9200, tax: 1656, discount: 0, total: 10856 }
    ],
    subtotal: 9200,
    tax: 1656,
    discounts: 0,
    total: 10856,
    invoiceNumber: 'B1500000214',
    invoiceDate: '2026-06-02',
    receivedDate: '2026-06-02T11:30:00Z',
    status: 'Recibida',
    paymentMethod: 'Transferencia',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  },
  {
    id: 'purch-3',
    code: 'OC-20260608',
    date: '2026-06-08T11:00:00Z',
    providerId: 'prov-2',
    providerName: 'Pollos del Caribe',
    items: [
      { productId: 'prod-1', qty: 40, unitPrice: 130, subtotal: 5200, tax: 936, discount: 0, total: 6136 }
    ],
    subtotal: 5200,
    tax: 936,
    discounts: 0,
    total: 6136,
    invoiceNumber: 'FC-105524',
    invoiceDate: '2026-06-08',
    receivedDate: '2026-06-08T12:00:00Z',
    status: 'Recibida',
    paymentMethod: 'Transferencia',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  },
  {
    id: 'purch-4',
    code: 'OC-20260615',
    date: '2026-06-15T09:15:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora de Carnes Nacional',
    items: [
      { productId: 'prod-1', qty: 25, unitPrice: 118, subtotal: 2950, tax: 531, discount: 0, total: 3481 }
    ],
    subtotal: 2950,
    tax: 531,
    discounts: 0,
    total: 3481,
    invoiceNumber: 'B1500000218',
    invoiceDate: '2026-06-15',
    receivedDate: '2026-06-15T11:00:00Z',
    status: 'Recibida',
    paymentMethod: 'Efectivo',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  },
  {
    id: 'purch-5',
    code: 'OC-20260622',
    date: '2026-06-22T14:45:00Z',
    providerId: 'prov-2',
    providerName: 'Pollos del Caribe',
    items: [
      { productId: 'prod-1', qty: 35, unitPrice: 132, subtotal: 4620, tax: 831.6, discount: 0, total: 5451.6 }
    ],
    subtotal: 4620,
    tax: 831.6,
    discounts: 0,
    total: 5451.6,
    invoiceNumber: 'FC-105680',
    invoiceDate: '2026-06-22',
    receivedDate: '2026-06-22T16:00:00Z',
    status: 'Recibida',
    paymentMethod: 'Crédito',
    creatorId: 'usr-2',
    creatorName: 'Ana Valeria'
  },
  {
    id: 'purch-6',
    code: 'OC-20260605',
    date: '2026-06-05T08:00:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora de Carnes Nacional',
    items: [
      { productId: 'prod-2', qty: 30, unitPrice: 450, subtotal: 13500, tax: 2430, discount: 0, total: 15930 }
    ],
    subtotal: 13500,
    tax: 2430,
    discounts: 0,
    total: 15930,
    invoiceNumber: 'B1500000215',
    invoiceDate: '2026-06-05',
    receivedDate: '2026-06-05T09:30:00Z',
    status: 'Recibida',
    paymentMethod: 'Transferencia',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  },
  {
    id: 'purch-7',
    code: 'OC-20260612',
    date: '2026-06-12T10:30:00Z',
    providerId: 'prov-2',
    providerName: 'Pollos del Caribe',
    items: [
      { productId: 'prod-2', qty: 15, unitPrice: 480, subtotal: 7200, tax: 1296, discount: 0, total: 8496 }
    ],
    subtotal: 7200,
    tax: 1296,
    discounts: 0,
    total: 8496,
    invoiceNumber: 'FC-105599',
    invoiceDate: '2026-06-12',
    receivedDate: '2026-06-12T11:45:00Z',
    status: 'Recibida',
    paymentMethod: 'Crédito',
    creatorId: 'usr-2',
    creatorName: 'Ana Valeria'
  },
  {
    id: 'purch-8',
    code: 'OC-20260618',
    date: '2026-06-18T11:15:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora de Carnes Nacional',
    items: [
      { productId: 'prod-3', qty: 12, unitPrice: 550, subtotal: 6600, tax: 1188, discount: 0, total: 7788 }
    ],
    subtotal: 6600,
    tax: 1188,
    discounts: 0,
    total: 7788,
    invoiceNumber: 'B1500000222',
    invoiceDate: '2026-06-18',
    receivedDate: '2026-06-18T13:00:00Z',
    status: 'Recibida',
    paymentMethod: 'Efectivo',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  },
  {
    id: 'purch-9',
    code: 'OC-20260625',
    date: '2026-06-25T15:00:00Z',
    providerId: 'prov-2',
    providerName: 'Pollos del Caribe',
    items: [
      { productId: 'prod-3', qty: 10, unitPrice: 590, subtotal: 5900, tax: 1062, discount: 0, total: 6962 }
    ],
    subtotal: 5900,
    tax: 1062,
    discounts: 0,
    total: 6962,
    invoiceNumber: 'FC-105740',
    invoiceDate: '2026-06-25',
    receivedDate: '2026-06-25T16:30:00Z',
    status: 'Recibida',
    paymentMethod: 'Crédito',
    creatorId: 'usr-2',
    creatorName: 'Ana Valeria'
  },
  {
    id: 'purch-10',
    code: 'OC-20260520',
    date: '2026-05-20T10:00:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora de Carnes Nacional',
    items: [
      { productId: 'prod-1', qty: 50, unitPrice: 110, subtotal: 5500, tax: 990, discount: 0, total: 6490 }
    ],
    subtotal: 5500,
    tax: 990,
    discounts: 0,
    total: 6490,
    invoiceNumber: 'B1500000195',
    invoiceDate: '2026-05-20',
    receivedDate: '2026-05-20T11:00:00Z',
    status: 'Recibida',
    paymentMethod: 'Transferencia',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila'
  }
];

export const mockMovements: InventoryMovement[] = [
  {
    id: 'mov-init-chicken',
    productId: 'prod-1',
    productName: 'Filete de Pollo Pechuga',
    qty: 20,
    unitCode: 'lb',
    type: 'Entrada',
    quantityBefore: 0,
    quantityAfter: 20,
    area: 'Almacén seco',
    userId: 'usr-3',
    userName: 'Roberto Dávila',
    date: '2026-06-01T17:00:00Z',
    reason: 'Compra RECIBIDA (B1500000213)',
    comment: 'Lote de pechugas recibido para porcionado inmediato.',
    documentRelatedId: 'purch-1'
  }
];

export const mockPortionRules: PortionRule[] = [
  {
    id: 'rule-1',
    productId: 'prod-1',
    purchaseUnitId: 'uni-1', // lb
    baseUnitId: 'uni-6', // oz
    conversionFactor: 16, // 1 lb = 16 oz
    standardPortionSize: 8, // 8 oz de filete de pollo por porción
    portionUnitId: 'uni-9', // porc
    expectedYieldPercentage: 95,
    expectedWastePercentage: 5,
    requiresPortioning: true,
    sellByPortion: true,
    isActive: true,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'rule-2',
    productId: 'prod-2',
    purchaseUnitId: 'uni-1', // lb
    baseUnitId: 'uni-6', // oz
    conversionFactor: 16,
    standardPortionSize: 10, // 10 oz de lomo fino
    portionUnitId: 'uni-9',
    expectedYieldPercentage: 90,
    expectedWastePercentage: 10,
    requiresPortioning: true,
    sellByPortion: true,
    isActive: true,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z'
  },
  {
    id: 'rule-3',
    productId: 'prod-3',
    purchaseUnitId: 'uni-1',
    baseUnitId: 'uni-6',
    conversionFactor: 16,
    standardPortionSize: 6, // 6 oz de lomo
    portionUnitId: 'uni-9',
    expectedYieldPercentage: 85,
    expectedWastePercentage: 15,
    requiresPortioning: true,
    sellByPortion: true,
    isActive: true,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z'
  }
];

export const mockPortionBatches: PortionBatch[] = [
  {
    id: 'batch-1',
    purchaseId: 'purch-1',
    productId: 'prod-1',
    quantityPurchased: 20,
    purchaseUnit: 'lb',
    baseQuantity: 320,
    baseUnit: 'oz',
    standardPortionSize: 8,
    theoreticalPortions: 40,
    realPortions: 38,
    differencePortions: -2,
    expectedYieldPercentage: 95,
    realYieldPercentage: 95,
    totalCost: 2400,
    estimatedCostPerPortion: 60,
    realCostPerPortion: 63.16,
    status: 'APPROVED',
    responsibleUserId: 'usr-4',
    approvedByUserId: 'usr-1',
    createdAt: '2026-06-01T18:00:00Z',
    approvedAt: '2026-06-01T18:30:00Z',
    comment: 'Pérdida por recorte de tendones grasosos. Autorizado por Chef.',
    evidenceUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'batch-2',
    productId: 'prod-2',
    quantityPurchased: 10,
    purchaseUnit: 'lb',
    baseQuantity: 160,
    baseUnit: 'oz',
    standardPortionSize: 10,
    theoreticalPortions: 16,
    realPortions: 0,
    differencePortions: 0,
    expectedYieldPercentage: 90,
    realYieldPercentage: 0,
    totalCost: 4500,
    estimatedCostPerPortion: 281.25,
    realCostPerPortion: 281.25,
    status: 'PENDING',
    responsibleUserId: 'usr-4',
    createdAt: '2026-06-08T10:00:00Z'
  }
];

export const mockPortionMovements: PortionMovement[] = [
  {
    id: 'pmov-1',
    productId: 'prod-1',
    portionBatchId: 'batch-1',
    movementType: 'PORTION_IN',
    quantity: 38,
    reason: 'Aprobación de Lote de Porcionamiento batch-1',
    relatedEntityType: 'PortionBatch',
    relatedEntityId: 'batch-1',
    userId: 'usr-1',
    userName: 'Carlos Mendoza',
    comment: '38 porciones ingresadas con costo RD$63.16 por porción.',
    createdAt: '2026-06-01T18:30:00Z'
  },
  {
    id: 'pmov-2',
    productId: 'prod-1',
    portionBatchId: 'batch-1',
    movementType: 'PORTION_SALE',
    quantity: -15,
    reason: 'Venta manual de 15 porciones',
    relatedEntityType: 'PortionSale',
    relatedEntityId: 'psale-1',
    userId: 'usr-2',
    userName: 'Ana María Gómez',
    comment: 'Descuento por servicios en salón.',
    createdAt: '2026-06-02T14:30:00Z'
  },
  {
    id: 'pmov-3',
    productId: 'prod-1',
    portionBatchId: 'batch-1',
    movementType: 'PORTION_INTERNAL_CONSUMPTION',
    quantity: -2,
    reason: 'Consumo interno (Cena de personal)',
    relatedEntityType: 'PortionMovement',
    relatedEntityId: 'pmov-3',
    userId: 'usr-4',
    userName: 'Chef Fabián Ríos',
    comment: 'Autorizado por cocina.',
    createdAt: '2026-06-03T21:00:00Z'
  },
  {
    id: 'pmov-4',
    productId: 'prod-1',
    portionBatchId: 'batch-1',
    movementType: 'PORTION_SALE',
    quantity: -5,
    reason: 'Venta manual de 5 porciones',
    relatedEntityType: 'PortionSale',
    relatedEntityId: 'psale-2',
    userId: 'usr-2',
    userName: 'Ana María Gómez',
    comment: 'Servido via Delivery.',
    createdAt: '2026-06-05T20:00:00Z'
  }
];

export const mockPortionSales: PortionSale[] = [
  {
    id: 'psale-1',
    productId: 'prod-1',
    portionBatchId: 'batch-1',
    saleDate: '2026-06-02T14:30:00Z',
    portionsSold: 15,
    channel: 'RESTAURANT',
    reference: 'Ticket #1024',
    userId: 'usr-2',
    userName: 'Ana María Gómez',
    createdAt: '2026-06-02T14:30:00Z'
  },
  {
    id: 'psale-2',
    productId: 'prod-1',
    portionBatchId: 'batch-1',
    saleDate: '2026-06-05T20:00:00Z',
    portionsSold: 5,
    channel: 'DELIVERY',
    reference: 'PedidosYa #8843',
    userId: 'usr-2',
    userName: 'Ana María Gómez',
    createdAt: '2026-06-05T20:00:00Z'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-init',
    userId: 'usr-1',
    userName: 'Carlos Mendoza',
    userRole: 'ADMIN',
    action: 'INICIALIZACIÓN',
    module: 'Sesión',
    date: new Date().toISOString(),
    comment: 'Instalación limpia cargada correctamente. Sistema listo para pruebas.',
    device: 'System Initialization'
  }
];

export const mockPhysicalSessions: PhysicalSession[] = [];

export const mockConfig: RestaurantConfig = {
  restaurantName: 'Restaurante El Celler Gourmet',
  rfc: 'ECG0805128D8',
  address: 'Santo Domingo, República Dominicana',
  phone: '809 123 4567',
  email: 'administracion@elcellergourmet.com',
  taxRate: 18, // ITBIS estándar en RD
  currencySymbol: 'RD$',
  allowedDomain: 'cellergourmet.com'
};

