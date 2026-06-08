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
  User
} from '../types';

export const mockUsers: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Mendoza',
    email: 'carlos.admin@elceller.com',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-2',
    name: 'Ana María Gómez',
    email: 'ana.gerente@elceller.com',
    role: 'GERENTE',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-3',
    name: 'Roberto Dávila',
    email: 'roberto.compras@elceller.com',
    role: 'COMPRAS',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-4',
    name: 'Chef Fabián Ríos',
    email: 'chef.cocina@elceller.com',
    role: 'COCINA',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=150&h=150&q=80'
  },
  {
    id: 'usr-5',
    name: 'Lucía Ortiz',
    email: 'lucia.recepcion@elceller.com',
    role: 'RECEPCIÓN',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80'
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Carnes y Aves', description: 'Cortes premium de res, cerdo, pollo e ingredientes carnes.' },
  { id: 'cat-2', name: 'Vegetales y Frutas', description: 'Insumos frescos del mercadillo local, legumbres y frutas sacadas del campo.' },
  { id: 'cat-3', name: 'Lácteos y Quesos', description: 'Leche, quesos, cremas, mantequilla y derivados lácteos.' },
  { id: 'cat-4', name: 'Almacén y Abarrotes', description: 'Harinas, aceites, especias, salsas y pastas secas.' },
  { id: 'cat-5', name: 'Bebidas e Alcohol', description: 'Refrescos, aguas minerales, destilados, vinos y cerveza.' },
  { id: 'cat-6', name: 'Desechables', description: 'Empaques de comida transportables, bolsas, popotes y cajillas.' },
  { id: 'cat-7', name: 'Productos de Limpieza', description: 'Químicos, jabones, desengrasantes, cloro e higiénicos.' }
];

export const mockUnits: Unit[] = [
  { id: 'uni-1', code: 'lb', name: 'Libras' },
  { id: 'uni-2', code: 'l', name: 'Litros' },
  { id: 'uni-3', code: 'pz', name: 'Piezas' },
  { id: 'uni-4', code: 'lata', name: 'Lata' },
  { id: 'uni-5', code: 'caja', name: 'Caja' }
];

export const mockProviders: Provider[] = [
  {
    id: 'prov-1',
    name: 'Distribuidora Carnes del Norte S.A.',
    rfc: 'DCN881023BC4',
    contactName: 'Ing. Javier Arredondo',
    phone: '55 4123 9081',
    email: 'contacto@carnesdelnorte.com',
    address: 'Av. Industrial 405, Parque Logístico Apodaca, N.L.',
    categories: ['cat-1'],
    rating: 5
  },
  {
    id: 'prov-2',
    name: 'Frutas y Verduras del Campo',
    rfc: 'FVC9405128D8',
    contactName: 'Doña Martha Solís',
    phone: '55 1251 0928',
    email: 'martha.solis@campoverde.com',
    address: 'Central de Abastos Bodega B-45, Iztapalapa, CDMX',
    categories: ['cat-2'],
    rating: 4
  },
  {
    id: 'prov-3',
    name: 'Lácteos Selectos de Occidente',
    rfc: 'LSO020304AA3',
    contactName: 'Lic. Pedro Macías',
    phone: '33 9128 4712',
    email: 'ventas@lacteosoccidente.mx',
    address: 'Calzada de los Fresnos 120, Zapopan, Jal.',
    categories: ['cat-3'],
    rating: 5
  },
  {
    id: 'prov-4',
    name: 'Abarrotes y Semillas El Trigal',
    rfc: 'AST991201TY4',
    contactName: 'Sandra Martínez',
    phone: '55 9811 2045',
    email: 'pedidos@eltrigalabarrotes.com',
    address: 'Oriente 120 No. 59, Col. Agrícola Oriental, CDMX',
    categories: ['cat-4', 'cat-6'],
    rating: 4
  },
  {
    id: 'prov-5',
    name: 'Bebidas y Vinos Premier',
    rfc: 'BVP1006159I3',
    contactName: 'Gerardo Ortiz',
    phone: '55 3322 1100',
    email: 'g.ortiz@bebidaspremier.com',
    address: 'Paseo de la Reforma 2901, Col. Lomas, CDMX',
    categories: ['cat-5'],
    rating: 5
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Filete de Res Ribeye Premium',
    categoryId: 'cat-1',
    unitId: 'uni-1',
    currentStock: 45.5,
    minStock: 20.0,
    maxStock: 100.0,
    averageCost: 350.0,
    lastPrice: 360.0,
    description: 'Corte deshuesado tipo Ribeye importado, porcionado para servicio de restaurante.',
    providerIds: ['prov-1']
  },
  {
    id: 'prod-2',
    name: 'Costilla de Cerdo BBQ Ahumada',
    categoryId: 'cat-1',
    unitId: 'uni-1',
    currentStock: 12.0,
    minStock: 15.0, // Alerta: Bajo mínimo!
    maxStock: 50.0,
    averageCost: 180.0,
    lastPrice: 185.0,
    description: 'Costillar completo ahumado en frío para asador gastronómico.',
    providerIds: ['prov-1']
  },
  {
    id: 'prod-3',
    name: 'Pechuga de Pollo Fresca',
    categoryId: 'cat-1',
    unitId: 'uni-1',
    currentStock: 30.0,
    minStock: 25.0,
    maxStock: 80.0,
    averageCost: 95.0,
    lastPrice: 95.0,
    description: 'Pechuga deshuesada y limpia sin piel, entrega diaria fresca.',
    providerIds: ['prov-1']
  },
  {
    id: 'prod-4',
    name: 'Tomate Saladet',
    categoryId: 'cat-2',
    unitId: 'uni-1',
    currentStock: 60.0,
    minStock: 30.0,
    maxStock: 150.0,
    averageCost: 28.0,
    lastPrice: 30.0,
    description: 'Tomate de primera selección maduro para salsas e ensaladas.',
    providerIds: ['prov-2']
  },
  {
    id: 'prod-5',
    name: 'Aguacate Hass de Michoacán',
    categoryId: 'cat-2',
    unitId: 'uni-1',
    currentStock: 3.5, // Alerta: Muy bajo mínimo!
    minStock: 15.0,
    maxStock: 60.0,
    averageCost: 75.0,
    lastPrice: 80.0,
    description: 'Aguacate de exportación, excelente maduración pródigo en aceites naturales.',
    providerIds: ['prov-2']
  },
  {
    id: 'prod-6',
    name: 'Queso Mozzarella de Búfala',
    categoryId: 'cat-3',
    unitId: 'uni-1',
    currentStock: 18.0,
    minStock: 10.0,
    maxStock: 40.0,
    averageCost: 250.0,
    lastPrice: 260.0,
    description: 'Queso hilado auténtico en salmuera para pizzas gourmet y ensalada caprese.',
    providerIds: ['prov-3']
  },
  {
    id: 'prod-7',
    name: 'Aceite de Oliva Extra Virgen',
    categoryId: 'cat-4',
    unitId: 'uni-2',
    currentStock: 12.0,
    minStock: 20.0, // Alerta: Bajo mínimo!
    maxStock: 80.0,
    averageCost: 160.0,
    lastPrice: 165.0,
    description: 'Aceite de oliva español de acidez menor a 0.8% para cocina fría y caliente.',
    providerIds: ['prov-4']
  },
  {
    id: 'prod-8',
    name: 'Vino Tinto Rioja Reserva Especial',
    categoryId: 'cat-5',
    unitId: 'uni-3',
    currentStock: 48,
    minStock: 24,
    maxStock: 120,
    averageCost: 450.0,
    lastPrice: 450.0,
    description: 'Botellas de vino tinto Rioja 750ml para cartas de maridaje.',
    providerIds: ['prov-5']
  },
  {
    id: 'prod-9',
    name: 'Cerveza de Barril IPA Porter 20L',
    categoryId: 'cat-5',
    unitId: 'uni-3',
    currentStock: 0, // Alerta: Fuera de stock!
    minStock: 2,
    maxStock: 8,
    averageCost: 1400.0,
    lastPrice: 1450.0,
    description: 'Barril de cerveza artesanal IPA de 20 litros.',
    providerIds: ['prov-5']
  }
];

export const mockKitchenRequests: KitchenRequest[] = [
  {
    id: 'req-1',
    code: 'SOL-2026-001',
    date: '2026-06-05T10:30:00Z',
    items: [
      { productId: 'prod-4', qty: 20, unitId: 'uni-1' }, // Tomate Saladet
      { productId: 'prod-5', qty: 15, unitId: 'uni-1' }  // Aguacate Hass
    ],
    status: 'Pendiente',
    creatorId: 'usr-4',
    creatorName: 'Chef Fabián Ríos',
    notes: 'Insumos urgentes para el servicio del fin de semana. No tenemos aguacate.'
  },
  {
    id: 'req-2',
    code: 'SOL-2026-002',
    date: '2026-06-03T09:12:00Z',
    items: [
      { productId: 'prod-1', qty: 10, unitId: 'uni-1' }, // Filete Ribeye
      { productId: 'prod-6', qty: 5, unitId: 'uni-1' }   // Mozzarella
    ],
    status: 'Aprobada',
    creatorId: 'usr-4',
    creatorName: 'Chef Fabián Ríos',
    approvedById: 'usr-2',
    approvedByName: 'Ana María Gómez',
    notes: 'Preparación para el evento de banquetes del viernes.'
  },
  {
    id: 'req-3',
    code: 'SOL-2026-003',
    date: '2026-06-01T15:40:00Z',
    items: [
      { productId: 'prod-8', qty: 24, unitId: 'uni-3' } // Rioja
    ],
    status: 'Convertida',
    creatorId: 'usr-4',
    creatorName: 'Chef Fabián Ríos',
    approvedById: 'usr-2',
    approvedByName: 'Ana María Gómez',
    notes: 'Re abastecimiento bar.'
  },
  {
    id: 'req-4',
    code: 'SOL-2026-004',
    date: '2026-06-02T11:00:00Z',
    items: [
      { productId: 'prod-9', qty: 4, unitId: 'uni-3' } // Barril IPA
    ],
    status: 'Rechazada',
    creatorId: 'usr-4',
    creatorName: 'Chef Fabián Ríos',
    approvedById: 'usr-2',
    approvedByName: 'Ana María Gómez',
    reason: 'Falta de presupuesto para cerveza artesanal esta semana. Utilizar reservas lager.',
    notes: 'Reposición bar.'
  }
];

export const mockPurchases: Purchase[] = [
  {
    id: 'pur-1',
    code: 'COMP-2026-001',
    date: '2026-06-01T12:00:00Z',
    providerId: 'prov-5',
    providerName: 'Bebidas y Vinos Premier',
    items: [
      {
        productId: 'prod-8',
        qty: 24,
        unitPrice: 450,
        subtotal: 10800,
        tax: 1728,
        discount: 0,
        total: 12528
      }
    ],
    subtotal: 10800,
    tax: 1728,
    discounts: 0,
    total: 12528,
    invoiceNumber: 'FAC-PV-9921',
    invoiceDate: '2026-06-01',
    receivedDate: '2026-06-01T14:30:00Z',
    status: 'Recibida',
    paymentMethod: 'Transferencia',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila',
    invoiceFileUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&h=800&q=80',
    fileName: 'factura_vinos_reserve.jpg',
    notes: 'Entrega en tiempo, botellas en perfecto estado.'
  },
  {
    id: 'pur-2',
    code: 'COMP-2026-002',
    date: '2026-06-04T10:00:00Z',
    providerId: 'prov-1',
    providerName: 'Distribuidora Carnes del Norte S.A.',
    items: [
      {
        productId: 'prod-1',
        qty: 15,
        unitPrice: 360,
        subtotal: 5400,
        tax: 0, // Productos frescos tasa 0% en alimentos
        discount: 0,
        total: 5400
      }
    ],
    subtotal: 5400,
    tax: 0,
    discounts: 0,
    total: 5400,
    invoiceNumber: 'FAC-CN-5512',
    invoiceDate: '2026-06-03',
    status: 'Pendiente',
    paymentMethod: 'Crédito',
    creatorId: 'usr-3',
    creatorName: 'Roberto Dávila',
    invoiceFileUrl: 'https://images.unsplash.com/photo-1586075010923-2dd45e9b2d4f?auto=format&fit=crop&w=600&h=800&q=80',
    fileName: 'factura_carnes_04.jpg',
    notes: 'Por recibir mañana temprano. Pendiente de subir prueba o firmar por Lucía.'
  }
];

export const mockMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    productId: 'prod-8',
    productName: 'Vino Tinto Rioja Reserva Especial',
    qty: 24,
    unitCode: 'pz',
    type: 'Entrada',
    quantityBefore: 24,
    quantityAfter: 48,
    area: 'Bar',
    userId: 'usr-3',
    userName: 'Roberto Dávila',
    date: '2026-06-01T14:30:00Z',
    reason: 'Compra RECIBIDA (Factura FAC-PV-9921)',
    comment: 'Carga inicial por re-abastecimiento aprobado.',
    documentRelatedId: 'pur-1'
  },
  {
    id: 'mov-2',
    productId: 'prod-5',
    productName: 'Aguacate Hass de Michoacán',
    qty: -5,
    unitCode: 'lb',
    type: 'Salida',
    quantityBefore: 8.5,
    quantityAfter: 3.5,
    area: 'Cocina',
    userId: 'usr-4',
    userName: 'Chef Fabián Ríos',
    date: '2026-06-04T22:30:00Z',
    reason: 'Consumo diario de cocina',
    comment: 'Servicio de aguachiles y guacamole para cena.',
    documentRelatedId: 'req-3'
  },
  {
    id: 'mov-3',
    productId: 'prod-4',
    productName: 'Tomate Saladet',
    qty: -2.5,
    unitCode: 'lb',
    type: 'Merma',
    quantityBefore: 62.5,
    quantityAfter: 60.0,
    area: 'Almacén seco',
    userId: 'usr-4',
    userName: 'Chef Fabián Ríos',
    date: '2026-06-05T08:15:00Z',
    reason: 'Merma por madurez o daño físico',
    comment: 'Tomates aplastados en la base de la caja del proveedor.',
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-1',
    userName: 'Carlos Mendoza',
    userRole: 'ADMIN',
    action: 'INICIO_SESIÓN',
    module: 'Sesión',
    date: '2026-06-08T08:00:00Z',
    comment: 'Acceso desde portátil Google Chrome Mac OS X',
    device: 'Desktop Chrome / MacOS'
  },
  {
    id: 'aud-2',
    userId: 'usr-4',
    userName: 'Chef Fabián Ríos',
    userRole: 'COCINA',
    action: 'CREACIÓN_SOLICITUD',
    module: 'Solicitudes',
    recordId: 'req-1',
    newValue: 'Borrador SOL-2026-001',
    date: '2026-06-05T10:30:00Z',
    comment: 'Chef solicita vegetales de urgencia.',
    device: 'Mobile Safari / iOS'
  },
  {
    id: 'aud-3',
    userId: 'usr-2',
    userName: 'Ana María Gómez',
    userRole: 'GERENTE',
    action: 'APROBACIÓN_SOLICITUD',
    module: 'Solicitudes',
    recordId: 'req-2',
    newValue: 'Aprobada SOL-2026-002',
    date: '2026-06-03T18:00:00Z',
    comment: 'Gerente aprueba suministros de res y queso.',
    device: 'Desktop Chrome / Windows'
  },
  {
    id: 'aud-4',
    userId: 'usr-3',
    userName: 'Roberto Dávila',
    userRole: 'COMPRAS',
    action: 'CREACIÓN_COMPRA',
    module: 'Compras',
    recordId: 'pur-1',
    newValue: 'COMP-2026-001',
    date: '2026-06-01T12:00:00Z',
    comment: 'Registro e ingreso de botellas de rioja e impuestos correspondientes.',
    device: 'Desktop Edge / Windows'
  }
];

export const mockPhysicalSessions: PhysicalSession[] = [
  {
    id: 'phys-1',
    code: 'FIS-2026-001',
    area: 'Almacén seco',
    date: '2026-06-06T17:00:00Z',
    creatorId: 'usr-4',
    creatorName: 'Chef Fabián Ríos',
    status: 'Borrador',
    notes: 'Conteo mensual general de ingredientes secos y abarrotes.',
    items: [
      {
        productId: 'prod-4',
        productName: 'Tomate Saladet',
        theoreticalStock: 60.0,
        physicalStock: 58.5,
        difference: -1.5,
        cost: 28.0
      },
      {
        productId: 'prod-7',
        productName: 'Aceite de Oliva Extra Virgen',
        theoreticalStock: 12.0,
        physicalStock: 12.0,
        difference: 0,
        cost: 160.0
      }
    ]
  },
  {
    id: 'phys-2',
    code: 'FIS-2026-002',
    area: 'Bar',
    date: '2026-06-05T23:30:00Z',
    creatorId: 'usr-2',
    creatorName: 'Ana María Gómez',
    status: 'Aprobado',
    notes: 'Cierre de inventario del fin de semana para licores de alta rotación.',
    approvedById: 'usr-2',
    approvedByName: 'Ana María Gómez',
    items: [
      {
        productId: 'prod-8',
        productName: 'Vino Tinto Rioja Reserva Especial',
        theoreticalStock: 50,
        physicalStock: 48,
        difference: -2,
        cost: 450.0
      }
    ]
  }
];

export const mockConfig: RestaurantConfig = {
  restaurantName: 'Restaurante El Celler Gourmet',
  rfc: 'ECG0805128D8',
  address: 'Avenida Álvaro Obregón 154, Roma Norte, Ciudad de México',
  phone: '55 1234 5678',
  email: 'administracion@elcellergourmet.com',
  taxRate: 16,
  currencySymbol: 'RD$'
};
