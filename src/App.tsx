import React, { useState, useEffect } from 'react';
import { initializeStore, store } from './data/store';
import {
  Product,
  Category,
  Unit,
  Provider,
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
} from './types';

// Importing views split modules
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import PhysicalInventoryView from './components/PhysicalInventoryView';
import KitchenRequestsView from './components/KitchenRequestsView';
import PurchasesView from './components/PurchasesView';
import PurchaseBookView from './components/PurchaseBookView';
import ProvidersView from './components/ProvidersView';
import MovementsView from './components/MovementsView';
import AuditView from './components/AuditView';
import ReportsView from './components/ReportsView';
import UsersRolesView from './components/UsersRolesView';
import ConfigurationView from './components/ConfigurationView';
import LoginView from './components/LoginView';
import PortionManagementView from './components/PortionManagementView';
import InventoryImportView from './components/InventoryImportView';
import MenuAndRecipesView from './components/MenuAndRecipesView';

export default function App() {
  // Initialize general LocalStorage structures on construct
  useEffect(() => {
    initializeStore();
    // Fetch initial entities
    setCurrentUser(store.getCurrentUser());
    setProducts(store.getProducts());
    setCategories(store.getCategories());
    setUnits(store.getUnits());
    setProviders(store.getProviders());
    setKitchenRequests(store.getKitchenRequests());
    setPurchases(store.getPurchases());
    setMovements(store.getMovements());
    setAuditLogs(store.getAuditLogs());
    setPhysicalSessions(store.getPhysicalSessions());
    setConfig(store.getConfig());
  }, []);

  // System Core States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [kitchenRequests, setKitchenRequests] = useState<KitchenRequest[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [physicalSessions, setPhysicalSessions] = useState<PhysicalSession[]>([]);
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  // Active module navigation
  const [activeModule, setActiveModule] = useState<string>('Dashboard');

  // Interactive Converting Requests Buffer (Kitchen approved requisition -> Preloaded Purchase order)
  const [convertingRequest, setConvertingRequest] = useState<{ id: string; code: string; items: { productId: string; qty: number }[] } | null>(null);

  // Reload lists helpers
  const reloadAllDataFromStore = () => {
    setProducts(store.getProducts());
    setCategories(store.getCategories());
    setUnits(store.getUnits());
    setProviders(store.getProviders());
    setKitchenRequests(store.getKitchenRequests());
    setPurchases(store.getPurchases());
    setMovements(store.getMovements());
    setAuditLogs(store.getAuditLogs());
    setPhysicalSessions(store.getPhysicalSessions());
    const latestConf = store.getConfig();
    if (latestConf) setConfig(latestConf);
  };

  // Switch authenticated roles on debug switch matrix
  const handleSwitchUser = (userId: string) => {
    const list = store.getUsers();
    const found = list.find(u => u.id === userId);
    if (found) {
      store.setCurrentUser(found);
      setCurrentUser(found);
      reloadAllDataFromStore();
    }
  };

  const handleLogout = () => {
    store.setCurrentUser(null);
    setCurrentUser(null);
  };

  const handleLoginCompleted = (userId: string, isGoogleAccount: boolean) => {
    const list = store.getUsers();
    const found = list.find(u => u.id === userId);
    if (found) {
      store.setCurrentUser(found);
      setCurrentUser(found);
      reloadAllDataFromStore();
    }
  };

  // State handlers to wrap store Operations
  const handleAddCategory = (cat: Category) => {
    store.addCategory(cat);
    reloadAllDataFromStore();
  };

  const handleAddUnit = (u: Unit) => {
    store.addUnit(u);
    reloadAllDataFromStore();
  };

  const handleAddProduct = (prod: Product) => {
    store.addProduct(prod);
    reloadAllDataFromStore();
  };

  const handleUpdateProduct = (prod: Product) => {
    store.updateProduct(prod);
    reloadAllDataFromStore();
  };

  const handleManualAdjustment = (
    productId: string,
    quantity: number,
    type: MovementType,
    area: InventoryArea,
    reason: string,
    comment: string
  ) => {
    store.applyManualAdjustment(productId, quantity, type, area, reason, comment);
    reloadAllDataFromStore();
  };

  const handleAddSession = (ses: PhysicalSession) => {
    store.addPhysicalSession(ses);
    reloadAllDataFromStore();
  };

  const handleUpdateSession = (ses: PhysicalSession) => {
    store.updatePhysicalSession(ses);
    reloadAllDataFromStore();
  };

  const handleAddKitchenRequest = (req: KitchenRequest) => {
    store.addKitchenRequest(req);
    reloadAllDataFromStore();
  };

  const handleUpdateKitchenRequest = (req: KitchenRequest) => {
    store.updateKitchenRequest(req);
    reloadAllDataFromStore();
  };

  const handleConvertKitchenRequestToPurchase = (req: KitchenRequest) => {
    // Stage items and open purchases view
    setConvertingRequest({
      id: req.id,
      code: req.code,
      items: req.items.map(i => ({ productId: i.productId, qty: i.qty }))
    });
    setActiveModule('Compras');
  };

  const handleAddPurchase = (purchase: Purchase) => {
    store.addPurchase(purchase);

    // If purchase was converted from a kitchen request, change request status!
    if (convertingRequest) {
      const parentRequest = kitchenRequests.find(r => r.id === convertingRequest.id);
      if (parentRequest) {
        store.updateKitchenRequest({
          ...parentRequest,
          status: 'Convertida'
        });
      }
      setConvertingRequest(null);
    }

    reloadAllDataFromStore();
  };

  const handleUpdatePurchase = (purchase: Purchase) => {
    store.updatePurchase(purchase);
    reloadAllDataFromStore();
  };

  const handleAddProvider = (p: Provider) => {
    store.addProvider(p);
    reloadAllDataFromStore();
  };

  const handleUpdateProvider = (p: Provider) => {
    store.updateProvider(p);
    reloadAllDataFromStore();
  };

  const handleUpdateConfig = (conf: RestaurantConfig) => {
    store.updateConfig(conf);
    reloadAllDataFromStore();
  };

  // Directly navigate to a specific purchase code from the Purchase Book View
  const handleViewPurchaseInComprasBook = (purchaseId: string) => {
    setActiveModule('Compras');
    // Note: the view should auto-detect and open details since we are changing modules
  };

  // If user is not authenticated yet, render login screen view
  if (!currentUser) {
    return <LoginView onLoginCompleted={handleLoginCompleted} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800" id="main-app-container">
      {/* Sidebar navigation */}
      <Sidebar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeModule}
        setActiveTab={setActiveModule}
        onSwitchUserClick={() => setActiveModule('Usuarios y roles')}
      />

      {/* Primary viewport content frame container */}
      <main className="flex-1 md:pl-64 pb-16 md:pb-0 min-h-screen relative flex flex-col">
        <div className="p-4 md:p-8 flex-1 max-w-7xl mx-auto w-full space-y-6">

          {/* Surtido converting notification bar indicator banner */}
          {convertingRequest && activeModule !== 'Compras' && (
            <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl flex items-center justify-between text-xs font-sans shadow-lg animate-bounce">
              <span>
                👉 Tienes un pedido en curso consolidado desde la requisición interna <strong className="font-bold underline">{convertingRequest.code}</strong>.
              </span>
              <button
                onClick={() => setActiveModule('Compras')}
                className="bg-white text-indigo-700 hover:bg-slate-100 px-3 py-1 rounded-lg font-bold"
              >
                Atender compra
              </button>
            </div>
          )}

          {/* ROUTED SUBVIEWS RENDER ENGINE */}
          {activeModule === 'Dashboard' && (
            <DashboardView
              products={products}
              purchases={purchases}
              requests={kitchenRequests}
              movements={movements}
              physicalSessions={physicalSessions}
              onNavigate={setActiveModule}
              onQuickAction={() => {}}
            />
          )}

          {activeModule === 'Inventario' && (
            <InventoryView
              products={products}
              categories={categories}
              units={units}
              providers={providers}
              currentUser={currentUser}
              physicalSessions={physicalSessions}
              movements={movements}
              onAddCategory={handleAddCategory}
              onAddUnit={handleAddUnit}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onApplyAdjustment={handleManualAdjustment}
              onAddPhysicalSession={handleAddSession}
              onUpdatePhysicalSession={handleUpdateSession}
              onReloadAllData={reloadAllDataFromStore}
            />
          )}

          {activeModule === 'Solicitudes de cocina' && (
            <KitchenRequestsView
              requests={kitchenRequests}
              products={products}
              units={units}
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              onAddRequest={handleAddKitchenRequest}
              onUpdateRequest={handleUpdateKitchenRequest}
              onConvertRequestToPurchase={handleConvertKitchenRequestToPurchase}
            />
          )}

          {activeModule === 'Compras' && (
            <PurchasesView
              purchases={purchases}
              products={products}
              providers={providers}
              units={units}
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              convertingFromRequest={convertingRequest}
              onClearConvertingRequest={() => setConvertingRequest(null)}
              onAddPurchase={handleAddPurchase}
              onUpdatePurchase={handleUpdatePurchase}
            />
          )}

          {activeModule === 'Libro de compras' && (
            <PurchaseBookView
              purchases={purchases}
              providers={providers}
              products={products}
              units={units}
              categories={categories}
              onViewPurchase={handleViewPurchaseInComprasBook}
            />
          )}

          {activeModule === 'Proveedores' && (
            <ProvidersView
              providers={providers}
              categories={categories}
              currentUserRole={currentUser.role}
              onAddProvider={handleAddProvider}
              onUpdateProvider={handleUpdateProvider}
            />
          )}

          {activeModule === 'Movimientos' && (
            <MovementsView movements={movements} />
          )}

          {activeModule === 'Auditoría' && (
            <AuditView logs={auditLogs} />
          )}

          {activeModule === 'Reportes' && (
            <ReportsView
              products={products}
              purchases={purchases}
              requests={kitchenRequests}
              movements={movements}
              physicalSessions={physicalSessions}
              categories={categories}
              units={units}
            />
          )}

          {activeModule === 'Usuarios y roles' && (
            <UsersRolesView
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
              onSwitchUser={handleSwitchUser}
            />
          )}

          {activeModule === 'Configuración' && config && (
            <ConfigurationView
              config={config}
              currentUserRole={currentUser.role}
              onUpdateConfig={handleUpdateConfig}
            />
          )}

          {activeModule === 'Porcionamiento' && (
            <PortionManagementView
              products={products}
              categories={categories}
              units={units}
              currentUser={currentUser}
              onReloadData={reloadAllDataFromStore}
            />
          )}

          {activeModule === 'Menú y recetas' && (
            <MenuAndRecipesView
              products={products}
              units={units}
              currentUserRole={currentUser.role}
              onRefreshInventory={reloadAllDataFromStore}
            />
          )}



        </div>
      </main>
    </div>
  );
}
