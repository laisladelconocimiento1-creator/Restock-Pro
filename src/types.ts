export type Role =
  | 'ADMIN'
  | 'GERENTE'
  | 'COMPRAS'
  | 'COCINA'
  | 'RECEPCIÓN'
  | 'CONTABILIDAD'
  | 'AUDITOR'
  | 'LECTURA';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  rfc: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  categories: string[]; // Category IDs
  rating: number; // 1-5
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  unitId: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  averageCost: number;
  lastPrice: number;
  description: string;
  providerIds: string[]; // Provider IDs
}

export type KitchenRequestStatus = 'Borrador' | 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Convertida';

export interface KitchenRequestItem {
  productId: string;
  qty: number;
  unitId: string;
}

export interface KitchenRequest {
  id: string;
  code: string;
  date: string;
  items: KitchenRequestItem[];
  status: KitchenRequestStatus;
  reason?: string; // Mandatario si se rechaza
  creatorId: string;
  creatorName: string;
  approvedById?: string;
  approvedByName?: string;
  notes?: string;
}

export type PurchaseStatus = 'Pendiente' | 'Recibida' | 'Anulada' | 'Observada';

export interface PurchaseItem {
  productId: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export interface Purchase {
  id: string;
  code: string;
  date: string;
  providerId: string;
  providerName: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  discounts: number;
  total: number;
  invoiceNumber: string;
  invoiceDate: string;
  receivedDate?: string;
  status: PurchaseStatus;
  invoiceFileUrl?: string; // Simulated file upload / canvas state
  fileName?: string;
  paymentMethod: 'Transferencia' | 'Efectivo' | 'Crédito' | 'Tarjeta';
  creatorId: string;
  creatorName: string;
  notes?: string;
}

export type InventoryArea =
  | 'Cocina'
  | 'Bar'
  | 'Almacén seco'
  | 'Refrigerados'
  | 'Congelados'
  | 'Limpieza'
  | 'Desechables'
  | 'Otro';

export type MovementType = 'Entrada' | 'Salida' | 'Transferencia' | 'Ajuste' | 'Merma' | 'Devolución';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  qty: number; // Positive or negative
  unitCode: string;
  type: MovementType;
  quantityBefore: number;
  quantityAfter: number;
  area: InventoryArea;
  userId: string;
  userName: string;
  date: string;
  reason: string;
  comment?: string;
  documentRelatedId?: string; // PurchaseId or RequestId or AuditId
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  module: string;
  recordId?: string;
  previousValue?: string;
  newValue?: string;
  date: string;
  comment?: string;
  device?: string;
}

export type PhysicalSessionStatus = 'Borrador' | 'En revisión' | 'Aprobado' | 'Rechazado' | 'Cerrado';

export interface PhysicalSessionItem {
  productId: string;
  productName: string;
  theoreticalStock: number;
  physicalStock: number | null; // null if not yet counted
  difference: number | null;
  cost: number;
}

export interface PhysicalSession {
  id: string;
  code: string;
  area: InventoryArea;
  date: string;
  creatorId: string;
  creatorName: string;
  status: PhysicalSessionStatus;
  items: PhysicalSessionItem[];
  approvedById?: string;
  approvedByName?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface RestaurantConfig {
  restaurantName: string;
  rfc: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number; // e.g. 16 for 16% IVA
  currencySymbol: string;
}
