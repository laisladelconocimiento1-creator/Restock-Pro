import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  ClipboardCheck,
  FileSpreadsheet,
  ChefHat,
  ShoppingBag,
  BookOpen,
  Users,
  Settings,
  Truck,
  History,
  FileBarChart,
  ShieldAlert,
  Scale,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Utensils
} from 'lucide-react';
import { User, Role } from '../types';
import { store } from '../data/store';

interface SidebarProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchUserClick: () => void;
}

export default function Sidebar({
  currentUser,
  onLogout,
  activeTab,
  setActiveTab,
  onSwitchUserClick
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800 border-red-200';
      case 'GERENTE': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'COMPRAS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ALMACEN_RECEPCION':
      case 'RECEPCIÓN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CHEF':
      case 'COCINA': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COCINERO': return 'bg-orange-100 text-orange-850 border-orange-200';
      case 'CONTABILIDAD': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'AUDITOR': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'SOLO_LECTURA':
      case 'LECTURA': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const navItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Inventario', label: 'Inventario', icon: Boxes },
    { id: 'Solicitudes de cocina', label: 'Solicitudes Cocina', icon: ChefHat },
    { id: 'Compras', label: 'Compras', icon: ShoppingBag },
    { id: 'Porcionamiento', label: 'Producción y Porc.', icon: Scale },
    { id: 'Menú y recetas', label: 'Menú y Fichas', icon: Utensils },
    { id: 'Libro de compras', label: 'Libro de Compras', icon: BookOpen },
    { id: 'Proveedores', label: 'Proveedores', icon: Truck },
    { id: 'Movimientos', label: 'Movimientos', icon: History },
    { id: 'Auditoría', label: 'Auditoría', icon: ShieldAlert },
    { id: 'Reportes', label: 'Reportes', icon: FileBarChart },
    { id: 'Usuarios y roles', label: 'Usuarios y Roles', icon: Users },
    { id: 'Configuración', label: 'Configuración', icon: Settings },
  ];

  // Dynamic filter according to system role evaluation!
  const allowedItems = navItems.filter(item => {
    // Admin bypasses checks
    if (currentUser.role === 'ADMIN') return true;

    switch (item.id) {
      case 'Dashboard':
        return store.hasPermission(currentUser, 'reports.view');
      case 'Inventario':
        return store.hasPermission(currentUser, 'inventory.view');
      case 'Solicitudes de cocina':
        return store.hasPermission(currentUser, 'requisition.create') || store.hasPermission(currentUser, 'requisition.approve') || store.hasPermission(currentUser, 'requisition.deliver');
      case 'Compras':
        return store.hasPermission(currentUser, 'purchase.view') || store.hasPermission(currentUser, 'purchase.create') || store.hasPermission(currentUser, 'purchase.update');
      case 'Porcionamiento':
        return store.hasPermission(currentUser, 'portioning.view') || store.hasPermission(currentUser, 'portioning.create');
      case 'Menú y recetas':
        // Both menus are cataloged as recipes / menus views
        return store.hasPermission(currentUser, 'recipe.view') || store.hasPermission(currentUser, 'menu.view');
      case 'Libro de compras':
        return store.hasPermission(currentUser, 'purchase_book.view');
      case 'Proveedores':
        return store.hasPermission(currentUser, 'settings.manage') || store.hasPermission(currentUser, 'purchase.view');
      case 'Movimientos':
        return store.hasPermission(currentUser, 'inventory.view');
      case 'Auditoría':
        return store.hasPermission(currentUser, 'audit.view');
      case 'Reportes':
        return store.hasPermission(currentUser, 'reports.view');
      case 'Usuarios y roles':
        // Everyone should be allowed to switch/view roles matrix in this sandbox deployment
        return true;
      case 'Configuración':
        return store.hasPermission(currentUser, 'settings.manage');
      default:
        return false;
    }
  });

  const handleSelectNav = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white border-r border-slate-800">
      {/* Brand Logo/Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-sm tracking-tight font-display shadow shadow-orange-500/10">
            RP
          </div>
          <div>
            <h1 className="font-display font-bold text-sm leading-tight text-white uppercase tracking-tight">Restock Pro</h1>
            <p className="text-[9px] text-slate-500 font-sans tracking-widest font-bold">BACK-OFFICE SYSTEM</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white p-1"
          id="btn-close-mobile-nav"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Information Profile */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded object-cover ring-2 ring-orange-500/20"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-sans font-semibold text-xs text-slate-200 truncate leading-snug">
              {currentUser.name}
            </h4>
            <p className="text-[10px] text-slate-500 truncate mb-1">
              {currentUser.email}
            </p>
            <div className="flex items-center gap-1">
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider border ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onSwitchUserClick}
            className="flex-1 py-1 px-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 rounded font-bold text-[10px] hover:text-white transition flex items-center justify-center gap-1"
            id="btn-switch-role-sidebar"
          >
            <UserIcon className="w-3 h-3 text-orange-400" />
            Cambiar Rol
          </button>
          <button
            onClick={onLogout}
            className="py-1 px-2 bg-rose-950/60 border border-rose-900 hover:bg-rose-900/60 text-rose-300 rounded text-[10px] font-bold transition"
            title="Cerrar Sesión"
            id="btn-logout-sidebar"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 animate-fade-in" id="nav-sidebar">
        <div className="px-3 mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Módulos de Sistema</div>
        {allowedItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-1.5 rounded text-xs font-sans font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-slate-800 text-orange-400 border-l-4 border-orange-500 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id={`nav-item-${item.id}`}
            >
              <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Professional Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/20 text-center">
        <p className="text-[9px] text-slate-500 font-mono">Celler Gourmet v1.2</p>
        <p className="text-[8px] text-slate-600 font-mono">Alta Densidad & Control Seguro</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40" id="mobile-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold font-display text-lg shadow-sm">
            R
          </div>
          <span className="font-display font-bold text-slate-800 text-base">{activeTab === 'Dashboard' ? 'Restock Pro' : activeTab}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold border ${getRoleBadgeColor(currentUser.role)}`}>
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 md:hidden flex items-center justify-around px-2 py-1 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]" id="mobile-bottom-nav">
        {[
          { id: 'Dashboard', label: 'Inicio', icon: LayoutDashboard },
          { id: 'Inventario', label: 'Inventario', icon: Boxes },
          { id: 'Solicitudes de cocina', label: 'Solicitudes', icon: ChefHat },
          { id: 'Compras', label: 'Compras', icon: ShoppingBag },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
        
        {/* 'Más' button to open full Drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
            mobileOpen ? 'text-orange-600 font-bold' : 'text-slate-400'
          }`}
          id="btn-open-mobile-nav-plus"
        >
          <Menu className="w-5 h-5 mb-0.5 text-slate-400" />
          <span>Más</span>
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden transition-all"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block w-64 h-screen sticky top-0 overflow-hidden flex-shrink-0">
        <SidebarContent />
      </div>
    </>
  );
}
export {};
