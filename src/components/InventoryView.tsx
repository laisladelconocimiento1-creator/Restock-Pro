import React, { useState } from 'react';
import {
  Boxes,
  Package,
  FileSpreadsheet,
  ClipboardCheck,
  Sliders,
  History,
  AlertCircle,
  Tags,
  Info
} from 'lucide-react';
import {
  Product,
  Category,
  Unit,
  Provider,
  User,
  PhysicalSession,
  InventoryMovement,
  MovementType,
  InventoryArea
} from '../types';

// Tab subcomponents
import ExistenciasTab from './inventory/ExistenciasTab';
import ProductosTab from './inventory/ProductosTab';
import InventoryImportView from './InventoryImportView';
import PhysicalInventoryView from './PhysicalInventoryView';
import AjustesTab from './inventory/AjustesTab';
import KardexTab from './inventory/KardexTab';
import AlertasTab from './inventory/AlertasTab';
import UnidadesCategoriasTab from './inventory/UnidadesCategoriasTab';

interface InventoryProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  providers: Provider[];
  currentUser: User;
  physicalSessions: PhysicalSession[];
  movements: InventoryMovement[];
  onAddCategory: (cat: Category) => void;
  onAddUnit: (unit: Unit) => void;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onApplyAdjustment: (
    productId: string,
    quantity: number,
    type: MovementType,
    area: InventoryArea,
    reason: string,
    comment: string
  ) => void;
  onAddPhysicalSession: (ses: PhysicalSession) => void;
  onUpdatePhysicalSession: (ses: PhysicalSession) => void;
  onReloadAllData: () => void;
}

type TabType =
  | 'existencias'
  | 'productos'
  | 'importar'
  | 'conteo'
  | 'ajustes'
  | 'kardex'
  | 'alertas'
  | 'unidades';

export default function InventoryView({
  products,
  categories,
  units,
  providers,
  currentUser,
  physicalSessions,
  movements,
  onAddCategory,
  onAddUnit,
  onAddProduct,
  onUpdateProduct,
  onApplyAdjustment,
  onAddPhysicalSession,
  onUpdatePhysicalSession,
  onReloadAllData
}: InventoryProps) {
  // Main state defining the active Tab
  const [activeTab, setActiveTab] = useState<TabType>('existencias');

  // Pre-selected product ID for jumping from Existencias directly to Kardex filter
  const [kardexProductId, setKardexProductId] = useState<string | null>(null);

  const handleSwitchTabWithFilter = (targetTab: string, productId?: string) => {
    if (targetTab === 'movimientos') {
      if (productId) {
        setKardexProductId(productId);
      }
      setActiveTab('kardex');
    } else if (targetTab === 'conteo') {
      setActiveTab('conteo');
    } else if (targetTab === 'existencias') {
      setActiveTab('existencias');
    } else if (targetTab === 'productos') {
      setActiveTab('productos');
    }
  };

  const tabsInfo = [
    { id: 'existencias', label: 'Existencias', icon: Boxes },
    { id: 'productos', label: 'Productos', icon: Package },
    { id: 'importar', label: 'Importar Lista', icon: FileSpreadsheet },
    { id: 'conteo', label: 'Conteo Físico', icon: ClipboardCheck },
    { id: 'ajustes', label: 'Ajustes', icon: Sliders },
    { id: 'kardex', label: 'Movimientos / Kárdex', icon: History },
    { id: 'alertas', label: 'Alertas', icon: AlertCircle },
    { id: 'unidades', label: 'Unidades y Categorías', icon: Tags }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" id="unified-inventory-view">
      {/* MODULE HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3 bg-white p-6 rounded-2xl shadow-3xs">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight leading-none flex items-center gap-2">
            <Boxes className="w-8 h-8 text-orange-500" />
            Control de Inventarios
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-sans font-semibold">
            Central de existencias, catálogos, auditoría de almacenes físicos, importación inteligente y kárdex operacional.
          </p>
        </div>
      </div>

      {/* HORIZONTAL SCROLLING TABS NAVIGATION HEADER */}
      <div className="border-b border-slate-200 bg-white p-1 rounded-xl shadow-3xs overflow-x-auto scrollbar-thin">
        <nav className="flex space-x-1 whitespace-nowrap min-w-max" aria-label="Tabs de Inventario">
          {tabsInfo.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-sans uppercase tracking-wider rounded-lg transition duration-150 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
                id={`tab-nav-${tab.id}`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ACTIVE TAB RENDER SHEET */}
      <div className="animate-fade-in" id="unified-tab-view-content">
        {activeTab === 'existencias' && (
          <ExistenciasTab
            products={products}
            categories={categories}
            units={units}
            providers={providers}
            currentUserRole={currentUser.role}
            onApplyAdjustment={onApplyAdjustment}
            onSwitchTab={handleSwitchTabWithFilter}
          />
        )}

        {activeTab === 'productos' && (
          <ProductosTab
            products={products}
            categories={categories}
            units={units}
            providers={providers}
            currentUserRole={currentUser.role}
            onAddProduct={onAddProduct}
            onUpdateProduct={onUpdateProduct}
          />
        )}

        {activeTab === 'importar' && (
          <InventoryImportView
            products={products}
            categories={categories}
            units={units}
            providers={providers}
            currentUser={currentUser}
            onReloadAllData={onReloadAllData}
          />
        )}

        {activeTab === 'conteo' && (
          <PhysicalInventoryView
            sessions={physicalSessions}
            products={products}
            units={units}
            currentUserRole={currentUser.role}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            onAddSession={onAddPhysicalSession}
            onUpdateSession={onUpdatePhysicalSession}
          />
        )}

        {activeTab === 'ajustes' && (
          <AjustesTab
            products={products}
            units={units}
            currentUserRole={currentUser.role}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            onApplyAdjustment={onApplyAdjustment}
            onSwitchTab={(tabId) => setActiveTab(tabId as TabType)}
          />
        )}

        {activeTab === 'kardex' && (
          <KardexTab
            movements={movements}
            products={products}
            units={units}
            preSelectedProductId={kardexProductId}
            onClearPreselection={() => setKardexProductId(null)}
          />
        )}

        {activeTab === 'alertas' && (
          <AlertasTab
            products={products}
            categories={categories}
            units={units}
            providers={providers}
            onSwitchTab={handleSwitchTabWithFilter}
          />
        )}

        {activeTab === 'unidades' && (
          <UnidadesCategoriasTab
            categories={categories}
            units={units}
            currentUserRole={currentUser.role}
            onAddCategory={onAddCategory}
            onAddUnit={onAddUnit}
          />
        )}
      </div>
    </div>
  );
}
