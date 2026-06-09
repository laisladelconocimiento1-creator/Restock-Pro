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
  portionsAvailable?: number; // Portions stock tracker
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
  requiresPortioning?: boolean;
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

export type MovementType = 'Entrada' | 'Salida' | 'Transferencia' | 'Ajuste' | 'Merma' | 'Devolución' | 'INITIAL_STOCK';

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

// === PORCIONAMIENTO, RENDIMIENTO Y CONTROL CONTRA VENTAS ==

export interface PortionRule {
  id: string;
  productId: string;
  purchaseUnitId: string;
  baseUnitId: string;
  conversionFactor: number;
  standardPortionSize: number;
  portionUnitId: string;
  expectedYieldPercentage: number;
  expectedWastePercentage: number;
  requiresPortioning: boolean;
  sellByPortion: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PortionBatchStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'PORTIONED'
  | 'OBSERVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED';

export interface PortionBatch {
  id: string;
  purchaseId?: string;
  productId: string;
  locationId?: string;
  quantityPurchased: number;
  purchaseUnit: string;
  baseQuantity: number;
  baseUnit: string;
  standardPortionSize: number;
  theoreticalPortions: number;
  realPortions: number;
  differencePortions: number;
  expectedYieldPercentage: number;
  realYieldPercentage: number;
  totalCost: number;
  estimatedCostPerPortion: number;
  realCostPerPortion: number;
  status: PortionBatchStatus;
  responsibleUserId: string;
  approvedByUserId?: string;
  createdAt: string;
  approvedAt?: string;
  comment?: string;
  evidenceUrl?: string;
}

export type PortionMovementType =
  | 'PORTION_IN'
  | 'PORTION_OUT'
  | 'PORTION_ADJUSTMENT'
  | 'PORTION_WASTE'
  | 'PORTION_SALE'
  | 'PORTION_INTERNAL_CONSUMPTION'
  | 'PORTION_RETURN';

export interface PortionMovement {
  id: string;
  productId: string;
  portionBatchId?: string;
  movementType: PortionMovementType;
  quantity: number;
  reason: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  userId: string;
  userName?: string;
  comment?: string;
  createdAt: string;
}

export type SalesChannel =
  | 'RESTAURANT'
  | 'DELIVERY'
  | 'EVENT'
  | 'INTERNAL_CONSUMPTION'
  | 'COMPLIMENTARY'
  | 'LOSS'
  | 'OTHER';

export interface PortionSale {
  id: string;
  productId: string;
  portionBatchId?: string;
  saleDate: string;
  portionsSold: number;
  channel: SalesChannel;
  reference?: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

export interface PortionWaste {
  id: string;
  productId: string;
  portionBatchId?: string;
  quantity: number;
  reason: string;
  userId: string;
  createdAt: string;
}

export interface ProductYield {
  id: string;
  productId: string;
  batchId: string;
  expectedPortions: number;
  actualPortions: number;
  yieldPercentage: number;
  wastePercentage: number;
  recordedAt: string;
}

export interface SalesImport {
  id: string;
  importedAt: string;
  fileName: string;
  totalRecords: number;
  importedByUserId: string;
}

export interface SalesImportLine {
  id: string;
  importId: string;
  productId: string;
  date: string;
  quantity: number;
  channel: SalesChannel;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  error?: string;
}

// === NUEVO: MÓDULO IMPORTACIÓN FLEXIBLE DE INVENTARIO DEL CLIENTE ===

export type InventoryImportStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'ANALYZED'
  | 'MAPPING_REQUIRED'
  | 'MAPPED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'WITH_ERRORS'
  | 'READY_TO_IMPORT'
  | 'IMPORTED'
  | 'PARTIALLY_IMPORTED'
  | 'CANCELLED'
  | 'FAILED';

export type InventoryImportRowStatus =
  | 'VALID'
  | 'WARNING'
  | 'ERROR'
  | 'DUPLICATE'
  | 'IMPORTED'
  | 'SKIPPED';

export type InventoryImportErrorSeverity =
  | 'INFO'
  | 'WARNING'
  | 'ERROR'
  | 'CRITICAL';

export interface InventoryImport {
  id: string;
  organizationId?: string;
  locationId?: string;
  fileName: string;
  fileType: string;
  fileUrl?: string;
  uploadedByUserId: string;
  uploadedByUserName?: string;
  status: InventoryImportStatus;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  createdProducts: number;
  updatedProducts: number;
  skippedRows: number;
  totalInventoryValue: number;
  selectedOptions: {
    importMode: 'catalog_only' | 'catalog_stock' | 'catalog_costs' | 'all';
    createCategories: boolean;
    createProviders: boolean;
    createUnits: boolean;
    updateExistingMode: 'sku' | 'name' | 'ignore';
  };
  createdAt: string;
  confirmedAt?: string;
}

export interface InventoryImportColumn {
  id: string;
  importId: string;
  originalColumnName: string;
  detectedDataType: 'string' | 'number' | 'boolean' | 'unknown';
  sampleValues: string[];
  suggestedSystemField: string; // Internal Field key
  selectedSystemField: string;  // Matches Internal Field key or empty/ignored
  confidenceScore: number;      // 0 to 100
  ignored: boolean;
  createdAt: string;
}

export interface InventoryImportMapping {
  id: string;
  importId: string;
  originalColumnName: string;
  systemField: string;
  confidenceScore: number;
  manuallyConfirmed: boolean;
  createdAt: string;
}

export interface InventoryImportRow {
  id: string;
  importId: string;
  rowNumber: number;
  rawData: Record<string, string>;
  normalizedData: Record<string, any>;
  status: InventoryImportRowStatus;
  productId?: string;
  createdAt: string;
}

export interface InventoryImportError {
  id: string;
  importId: string;
  rowId?: string;
  rowNumber: number;
  columnName: string;
  receivedValue: string;
  errorMessage: string;
  suggestion: string;
  severity: InventoryImportErrorSeverity;
  createdAt: string;
}

// === NUEVO: RECETAS, COCIERRE Y FLUJO OPERATIVO DIARIO ===

export interface RecipeIngredient {
  productId: string; // Product id
  quantity: number; // e.g. 1 portion or 0.5 units
  isPortion: boolean; // True if it discounts portionsAvailable, false if it discounts standard currentStock
}

export interface Recipe {
  id: string;
  name: string; // e.g. "Fajita de Pollo", "Filete Mignon"
  ingredients: RecipeIngredient[];
  price: number;
}

export interface KitchenDailyCloseItem {
  productId: string;
  productName: string;
  initialPortions: number;
  producedPortions: number;
  soldPortions: number;
  wastedPortions: number;
  internalConsumptionPortions: number;
  courtesyPortions: number;
  adjustedPortions: number;
  expectedClosingPortions: number;
  physicalCountingPortions: number;
  difference: number;
  differenceValue: number;
  reason?: 'Errores de conteo' | 'Consumo no registrado' | 'Robo/pérdida' | 'Daño de producto' | 'Otros';
  comment?: string;
}

export interface KitchenDailyClose {
  id: string;
  date: string; // YYYY-MM-DD
  closedAt: string;
  closedByUserId: string;
  closedByUserName: string;
  items: KitchenDailyCloseItem[];
  isClosed: boolean;
  notes?: string;
}

// === ENUMS/TYPES NUEVOS PARA OCR DE FACTURAS ===
export type InvoiceOcrStatus =
  | 'INVOICE_UPLOADED'
  | 'ANALYZING'
  | 'ANALYZED'
  | 'REQUIRES_REVIEW'
  | 'REVIEWED'
  | 'CONFIRMED'
  | 'ERROR'
  | 'CANCELLED';

export type InvoiceLineStatus =
  | 'MATCHED'
  | 'NEEDS_REVIEW'
  | 'NEW_PRODUCT'
  | 'IGNORED'
  | 'NON_INVENTORY_EXPENSE';

// === ENTIDADES NUEVAS PARA OCR DE FACTURAS ===
export interface InvoiceOcrJob {
  id: string;
  purchaseId?: string | null;
  fileId: string;
  status: InvoiceOcrStatus;
  startedAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  confidenceScore?: number | null;
  createdByUserId: string;
}

export interface InvoiceOcrResult {
  id: string;
  ocrJobId: string;
  supplierName?: string | null;
  supplierTaxId?: string | null;
  invoiceNumber?: string | null;
  ncf?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  subtotal?: number | null;
  discountTotal?: number | null;
  taxTotal?: number | null;
  total?: number | null;
  currency?: string | null;
  paymentTerms?: string | null;
  rawText?: string | null;
  confidenceScore?: number | null;
  createdAt: string;
}

export interface InvoiceOcrLine {
  id: string;
  ocrResultId: string;
  rawDescription: string;
  detectedProductCode?: string | null;
  detectedQuantity: number;
  detectedUnit?: string | null;
  detectedUnitPrice: number;
  detectedDiscount?: number | null;
  detectedTax?: number | null;
  detectedSubtotal: number;
  detectedTotal: number;
  matchedProductId?: string | null;
  matchConfidence?: number | null; // e.g. 0 to 100 percentage
  lineStatus: InvoiceLineStatus;
  createdAt: string;
}

export interface SupplierProductAlias {
  id: string;
  supplierId: string;
  rawSupplierDescription: string;
  productId: string;
  unitId?: string | null;
  confidenceScore: number;
  timesConfirmed: number;
  lastConfirmedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceReviewCorrection {
  id: string;
  ocrJobId: string;
  fieldName: string;
  originalValue: string;
  correctedValue: string;
  correctedByUserId: string;
  createdAt: string;
}



