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
  { id: 'cat-2', name: 'Vegetales y Frutas', description: 'Insumos frescos del mercadillo local, legumbres y frutas.' },
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
  { id: 'uni-5', code: 'caja', name: 'Caja' }
];

export const mockProviders: Provider[] = [];

export const mockProducts: Product[] = [];

export const mockKitchenRequests: KitchenRequest[] = [];

export const mockPurchases: Purchase[] = [];

export const mockMovements: InventoryMovement[] = [];

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
  currencySymbol: 'RD$'
};
