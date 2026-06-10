import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, ShieldAlert, ShieldCheck, UserPlus, 
  Trash2, Edit3, X, Check, Save, Play, RefreshCw, Key, 
  MapPin, Briefcase, Mail, Power, AlertTriangle, ToggleLeft, ToggleRight
} from 'lucide-react';
import { store } from '../data/store';
import { User, Role, UserStatus } from '../types';

interface UsersRolesProps {
  currentUserRole: Role;
  currentUserId: string;
  onSwitchUser: (userId: string) => void;
}

export default function UsersRolesView({
  currentUserRole,
  currentUserId,
  onSwitchUser
}: UsersRolesProps) {
  // Load users from our integrated store
  const [users, setUsers] = useState<User[]>([]);
  
  // Tabs: 'simular' | 'usuarios' | 'solicitudes' | 'invitar'
  const [activeSubTab, setActiveSubTab] = useState<'simular' | 'usuarios' | 'solicitudes' | 'invitar'>('usuarios');

  // Edit states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<Role>('SOLO_LECTURA');
  const [editHq, setEditHq] = useState('Sede Central');
  const [editArea, setEditArea] = useState('Administración');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');
  const [editSpecialPerms, setEditSpecialPerms] = useState<string[]>([]);

  // Invite states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('COCINERO');
  const [inviteHq, setInviteHq] = useState('Sede Central');
  const [inviteArea, setInviteArea] = useState('Cocina Principal');
  const [inviteSpecialPerms, setInviteSpecialPerms] = useState<string[]>([]);

  // Approvals states for modal or inline row approval
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [approveRole, setApproveRole] = useState<Role>('COCINERO');
  const [approveHq, setApproveHq] = useState('Sede Central');
  const [approveArea, setApproveArea] = useState('Cocina Principal');

  useEffect(() => {
    setUsers(store.getUsers());
  }, []);

  const refreshList = () => {
    const list = store.getUsers();
    setUsers(list);
  };

  // Sede options
  const hqOptions = ['Sede Central', 'Celler Polanco', 'Celler Condesa', 'Almacén Norte'];
  
  // Area options
  const areaOptions = [
    'Administración', 'Gerencia', 'Compras', 'Almacén de Recepción', 
    'Cocina Principal', 'Cocina Fría', 'Repostería', 'Finanzas', 'Contraloría', 'Lectura General'
  ];

  // Granular permissions catalog
  const permissionCatalog = [
    { key: 'inventory.view', name: 'Ver Inventario', desc: 'Consulta de existencias' },
    { key: 'inventory.adjust', name: 'Ajustar Mermas', desc: 'Registro de mermas directas' },
    { key: 'inventory.transfer', name: 'Transferencias', desc: 'Traspasos Almacén a Cocina' },
    { key: 'inventory.count', name: 'Conteos Físicos', desc: 'Ingreso de existencias auditas' },
    { key: 'inventory.approve_count', name: 'Aprobar Conciliación', desc: 'Cerrar cuadres físicos' },
    { key: 'purchase.create', name: 'Operar Compras', desc: 'Crear compras y carga OCR' },
    { key: 'purchase_book.view', name: 'Libro de Compras', desc: 'Ver reporteo SAT e impuestos' },
    { key: 'purchase_book.export', name: 'Exportar Compras', desc: 'Descargas en Excel/CSV' },
    { key: 'requisition.create', name: 'Crear Requisiciones', desc: 'Pedidos de Cocina a Almacén' },
    { key: 'requisition.approve', name: 'Aprobar Pedidos', desc: 'Autorización de solicitudes' },
    { key: 'portioning.create', name: 'Procesar Porciones', desc: 'Iniciar lotes de porcionado' },
    { key: 'recipe.create', name: 'Fichas Técnicas', desc: 'Diseñar recetas y platos oficiales' },
    { key: 'daily_close.create', name: 'Sellar Jornada', desc: 'Registrar cierre diario cocina' },
    { key: 'audit.view', name: 'Auditoría Digital', desc: 'Descarga de bitácoras inalterables' },
    { key: 'users.view', name: 'Gestionar Usuarios', desc: 'Invitar y aprobar accesos' }
  ];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      alert('Completa los campos requeridos para la invitación.');
      return;
    }
    if (!inviteEmail.includes('@')) {
      alert('Introduce un correo federado de Google válido.');
      return;
    }

    // Call store
    store.inviteUser({
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      hq: inviteHq,
      area: inviteArea,
      avatar: `https://images.unsplash.com/photo-${['1535713875002-d1d0cf377fde', '1494790108377-be9c29b29330', '1570295999919-56ceb5ecca61', '1438761681033-6461ffad8d80'][Math.floor(Math.random() * 4)]}?auto=format&fit=crop&w=150&h=150&q=80`,
      specialPermissions: inviteSpecialPerms
    });

    // Reset
    setInviteName('');
    setInviteEmail('');
    setInviteRole('COCINERO');
    setInviteSpecialPerms([]);
    refreshList();
    setActiveSubTab('usuarios');
    alert('Operación exitosa: Invitación procesada y cuenta de Google pre-autorizada.');
  };

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditRole(user.role);
    setEditHq(user.hq || 'Sede Central');
    setEditArea(user.area || 'Administración');
    setEditStatus(user.status || 'ACTIVE');
    setEditSpecialPerms(user.specialPermissions || []);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    store.updateUserRoleAndPermissions(
      editingUserId!,
      editRole,
      editHq,
      editArea,
      editStatus,
      editSpecialPerms
    );

    setEditingUserId(null);
    refreshList();
    alert('Registro actualizado correctamente.');
  };

  const handleStartApprove = (user: User) => {
    setApprovingUserId(user.id);
    setApproveRole('COCINERO');
    setApproveHq('Sede Central');
    setApproveArea('Cocina Principal');
  };

  const handleConfirmApproval = () => {
    store.approveUserRequest(approvingUserId!, approveRole, approveHq, approveArea);
    setApprovingUserId(null);
    refreshList();
    alert('Registro aprobado con éxito. El usuario tiene acceso inmediato.');
  };

  const handleRejectAccess = (id: string) => {
    if (confirm('¿Estás seguro de rechazar formalmente esta solicitud de Google Sign-In?')) {
      store.rejectUserRequest(id);
      refreshList();
    }
  };

  const handleDisableUserClick = (id: string) => {
    if (confirm('¿Estás seguro de deshabilitar el acceso de este usuario? No podrá iniciar sesión hasta que sea reactivado.')) {
      store.disableUser(id);
      refreshList();
    }
  };

  const toggleSpecialPermission = (key: string, isEdit: boolean) => {
    if (isEdit) {
      setEditSpecialPerms(prev => 
        prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
      );
    } else {
      setInviteSpecialPerms(prev => 
        prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
      );
    }
  };

  // Split list
  const activeMembers = users.filter(u => u.status !== 'PENDING_APPROVAL');
  const pendingRequests = users.filter(u => u.status === 'PENDING_APPROVAL');

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 text-red-700 border-red-200';
      case 'GERENTE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPRAS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CHEF': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ALMACEN_RECEPCION': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CONTABILIDAD': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'AUDITOR': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'SOLO_LECTURA': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-205';
    }
  };

  const getStatusBadgeColor = (status?: UserStatus) => {
    const s = status || 'ACTIVE';
    switch (s) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DISABLED': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REJECTED': return 'bg-zinc-100 text-zinc-500 border-zinc-300';
      case 'PENDING_APPROVAL': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="users-roles-manager-panel">
      
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight leading-none uppercase">
            Identidades, Roles y Permisos Federados
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-sans font-medium">
            Seguridad centralizada basada en roles (RBAC) vinculada a cuentas autorizadas de Google Sign-In.
          </p>
        </div>

        {/* Dynamic tabs navigation */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 font-semibold">
          <button
            onClick={() => setActiveSubTab('usuarios')}
            className={`px-3 py-1.5 rounded-lg transition text-[11px] flex items-center gap-1.5 ${
              activeSubTab === 'usuarios' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Usuarios Activos ({activeMembers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('solicitudes')}
            className={`px-3 py-1.5 rounded-lg transition text-[11px] relative flex items-center gap-1.5 ${
              activeSubTab === 'solicitudes' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Solicitudes Pendientes
            {pendingRequests.length > 0 && (
              <span className="bg-orange-500 text-white rounded-full text-[9px] w-4.5 h-4.5 flex items-center justify-center font-bold font-mono">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('invitar')}
            className={`px-3 py-1.5 rounded-lg transition text-[11px] flex items-center gap-1.5 ${
              activeSubTab === 'invitar' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            Invitar (Flujo 1)
          </button>
          <button
            onClick={() => setActiveSubTab('simular')}
            className={`px-3 py-1.5 rounded-lg transition text-[11px] flex items-center gap-1.5 ${
              activeSubTab === 'simular' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin-slow" />
            Matriz Simuladora
          </button>
        </div>
      </div>

      {/* Alert current user simulation */}
      <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl text-indigo-950 flex gap-3 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span>
            Operando sesión como: <strong className="font-extrabold uppercase bg-white border border-indigo-200 py-0.5 px-2 rounded-lg text-[10px] text-indigo-900">{store.getCurrentUser()?.name} ({currentUserRole})</strong>
          </span>
          <p className="text-slate-500 text-[10.5px] mt-1.5">
            Las vistas del kárdex, costos, solicitudes, Libro de Compras y botones de autorización de todo el sistema se reconfiguran de forma inmediata al cambiar la sesión activa o alterar roles.
          </p>
        </div>
      </div>

      {/* SUB-VIEW 1: Active members list */}
      {activeSubTab === 'usuarios' && (
        <div className="space-y-4 animate-fade-in" id="panel-active-users">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Directorio de Usuarios Federados de Google</span>
              <span className="text-[10px] text-slate-400">Total: {activeMembers.length} cuentas registradas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[9px] uppercase font-bold text-slate-450 tracking-wider">
                    <th className="p-4">Colaborador</th>
                    <th className="p-4">Organización / Sede</th>
                    <th className="p-4">Rol Asignado</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Permisos Especiales</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-xs">
                  {activeMembers.map((u) => {
                    const isSystemEditing = editingUserId === u.id;
                    const isSelf = u.id === currentUserId;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition duration-150">
                        {/* Profile & Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              {isSystemEditing ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs w-48 font-medium bg-white"
                                />
                              ) : (
                                <h4 className="font-bold text-slate-800 flex items-center gap-1">
                                  {u.name} {isSelf && <span className="bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Tú</span>}
                                </h4>
                              )}
                              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-300" />
                                {u.email}
                              </p>
                              <span className="text-[9px] text-slate-400 font-mono select-none block">sub: {u.sub || 'pre-authorized'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Sede & Area */}
                        <td className="p-4">
                          {isSystemEditing ? (
                            <div className="space-y-1.5">
                              <select
                                value={editHq}
                                onChange={(e) => setEditHq(e.target.value)}
                                className="border border-slate-300 bg-white rounded px-1 py-0.5 text-xs w-full"
                              >
                                {hqOptions.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                              <select
                                value={editArea}
                                onChange={(e) => setEditArea(e.target.value)}
                                className="border border-slate-300 bg-white rounded px-1 py-0.5 text-xs w-full"
                              >
                                {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800 block text-[11px] truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {u.hq || 'Sede Central'}
                              </span>
                              <span className="text-slate-450 block truncate text-[10px] flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                {u.area || 'Operaciones'}
                              </span>
                              <span className="text-[9px] font-medium text-slate-400 block italic leading-none">{u.organizationId || 'Celler Gourmet'}</span>
                            </div>
                          )}
                        </td>

                        {/* Role selection */}
                        <td className="p-4">
                          {isSystemEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as Role)}
                              className="border border-slate-300 bg-white rounded px-2 py-1 text-xs font-semibold text-slate-700 w-full"
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="GERENTE">GERENTE</option>
                              <option value="COMPRAS">COMPRAS</option>
                              <option value="ALMACEN_RECEPCION">ALMACÉN RECEPTOR</option>
                              <option value="CHEF">CHEF</option>
                              <option value="COCINERO">COCINERO</option>
                              <option value="CONTABILIDAD">CONTABILIDAD</option>
                              <option value="AUDITOR">AUDITOR</option>
                              <option value="SOLO_LECTURA">SOLO LECTURA</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.8 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(u.role)}`}>
                              {u.role}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {isSystemEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                              className="border border-slate-300 bg-white rounded px-1.5 py-0.5 text-xs w-full"
                            >
                              <option value="ACTIVE">Activo</option>
                              <option value="DISABLED">Desactivado</option>
                              <option value="SUSPENDED">Suspendido</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide ${getStatusBadgeColor(u.status)}`}>
                              {u.status === 'ACTIVE' ? 'Activo' : u.status === 'DISABLED' ? 'Desactivado' : u.status}
                            </span>
                          )}
                        </td>

                        {/* Granular special permissions block checklist representation */}
                        <td className="p-4">
                          {isSystemEditing ? (
                            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 max-h-40 overflow-y-auto space-y-1.5 w-64">
                              <span className="font-bold text-[9px] uppercase text-slate-500 block mb-1">Permisos Especiales (Check):</span>
                              {permissionCatalog.map(p => {
                                const checked = editSpecialPerms.includes(p.key);
                                return (
                                  <label key={p.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-0.5 rounded transition">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleSpecialPermission(p.key, true)}
                                      className="rounded"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-bold text-[10px] block leading-none">{p.name}</span>
                                      <span className="text-[8px] text-slate-450 truncate block mt-0.5">{p.desc}</span>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.specialPermissions && u.specialPermissions.length > 0 ? (
                                u.specialPermissions.map(p => (
                                  <span key={p} className="bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 py-0.2 rounded text-[8px] font-mono leading-none">
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Sin privilegios excepcionales</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Trigger action buttons */}
                        <td className="p-4 text-right">
                          {currentUserRole !== 'ADMIN' ? (
                            <span className="text-[10px] text-slate-400 italic">Sólo lectura</span>
                          ) : (
                            <div className="flex justify-end gap-2.5">
                              {isSystemEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveEdit}
                                    className="p-1.5 bg-emerald-600 hover:bg-emerald-505 text-white rounded-lg font-bold"
                                    title="Guardar Cambios"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold"
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(u)}
                                    className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs"
                                    title="Editar Usuario"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {!isSelf && u.status === 'ACTIVE' && (
                                    <button
                                      onClick={() => handleDisableUserClick(u.id)}
                                      className="p-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
                                      title="Desactivar Acceso"
                                    >
                                      <Power className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Access requests approval workflow queue (Flujo 2) */}
      {activeSubTab === 'solicitudes' && (
        <div className="space-y-4 animate-fade-in" id="panel-access-requests">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-rose-150 bg-rose-50/20 flex justify-between items-center">
              <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                Cola de Registro Pendiente de Aprobación (Google Sign-In)
              </span>
              <span className="bg-amber-100 text-amber-800 text-[10px] py-0.5 px-2 rounded-full font-bold">
                {pendingRequests.length} solicitudes de entrada
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-450 space-y-2">
                <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" strokeWidth={1.5} />
                <h4 className="font-bold text-slate-700 text-sm">No existen solicitudes de acceso pendientes</h4>
                <p className="max-w-md mx-auto text-slate-500 text-[11px] leading-relaxed">
                  Cualquier correo que intente ingresar con Google Sign-In corporativo que no esté previamente registrado quedará registrado aquí.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingRequests.map((req) => {
                  const isProcessApproving = approvingUserId === req.id;

                  return (
                    <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 bg-amber-50/10">
                      
                      {/* Left: Metadata */}
                      <div className="flex gap-4 items-start">
                        <img
                          src={req.avatar}
                          alt={req.name}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-200"
                        />
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-800 text-sm">{req.name}</h4>
                          <span className="text-slate-450 block font-mono text-[10.5px]">Email: {req.email}</span>
                          <span className="text-slate-450 block font-mono text-[10px] text-indigo-500">Google sub: {req.sub}</span>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold uppercase">
                              {req.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Solicitud: {req.dateOfRequest ? new Date(req.dateOfRequest).toLocaleString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Choose parameters if Approving */}
                      {isProcessApproving ? (
                        <div className="bg-slate-50 p-4 border rounded-xl space-y-3 shrink-0 w-80 shadow-inner">
                          <span className="font-extrabold text-[9px] uppercase text-indigo-700 block tracking-wider">CONFIGURAR PARÁMETROS CORPORATIVOS</span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <label className="text-[8px] uppercase font-bold text-slate-500">Asignar Rol</label>
                              <select
                                value={approveRole}
                                onChange={(e) => setApproveRole(e.target.value as Role)}
                                className="w-full bg-white border rounded px-1.5 py-0.5 text-xs font-semibold text-slate-700"
                              >
                                <option value="ADMIN">ADMIN</option>
                                <option value="GERENTE">GERENTE</option>
                                <option value="COMPRAS">COMPRAS</option>
                                <option value="ALMACEN_RECEPCION">ALMACÉN RECEPTOR</option>
                                <option value="CHEF">CHEF</option>
                                <option value="COCINERO">COCINERO</option>
                                <option value="CONTABILIDAD">CONTABILIDAD</option>
                                <option value="AUDITOR">AUDITOR</option>
                                <option value="SOLO_LECTURA">SOLO LECTURA</option>
                              </select>
                            </div>

                            <div className="space-y-0.5">
                              <label className="text-[8px] uppercase font-bold text-slate-500">Asignar Sede</label>
                              <select
                                value={approveHq}
                                onChange={(e) => setApproveHq(e.target.value)}
                                className="w-full bg-white border rounded px-1.5 py-0.5 text-xs"
                              >
                                {hqOptions.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                            </div>

                            <div className="col-span-2 space-y-0.5">
                              <label className="text-[8px] uppercase font-bold text-slate-500">Asignar Área Específica</label>
                              <select
                                value={approveArea}
                                onChange={(e) => setApproveArea(e.target.value)}
                                className="w-full bg-white border rounded px-1.5 py-0.5 text-xs"
                              >
                                {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1.5">
                            <button
                              onClick={() => setApprovingUserId(null)}
                              className="w-1/2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleConfirmApproval}
                              className="w-1/2 py-1 bg-emerald-600 hover:bg-emerald-505 text-white font-bold rounded flex items-center justify-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Confirmar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {currentUserRole !== 'ADMIN' ? (
                            <span className="text-[10px] text-slate-400 italic">Sólo lectura</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartApprove(req)}
                                className="bg-emerald-600 hover:bg-emerald-505 text-white px-3 py-1.8 rounded-lg font-bold transition flex items-center gap-1 text-[11px]"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Aprobar Acceso
                              </button>
                              <button
                                onClick={() => handleRejectAccess(req.id)}
                                className="bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 px-3 py-1.8 rounded-lg font-bold transition flex items-center gap-1 text-[11px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Rechazar
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Invitation flow (Flujo 1) */}
      {activeSubTab === 'invitar' && (
        <div className="space-y-4 animate-fade-in" id="panel-invite-user">
          <div className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-150 pb-3">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-sm block">Invitar y Pre-autorizar Cuentas</span>
              <p className="text-slate-450 text-[11px] mt-1 font-medium">
                Flujo 1: Las direcciones corporativas de Gmail dadas de alta aquí podrán ingresar libremente y heredarán de inmediato el rol, sede y permisos asignados al iniciar sesión con Google.
              </p>
            </div>

            {currentUserRole !== 'ADMIN' ? (
              <div className="p-4 bg-slate-50 border border-slate-250 rounded-lg text-slate-500 italic text-center">
                Solamente el administrador principal tiene permitido emitir invitaciones o autorizar cuentas.
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: David Salazar"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full border border-slate-300 focus:border-orange-500 bg-white rounded px-3 py-2 text-slate-750 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Correo Corporativo de Gmail *</label>
                    <input
                      type="email"
                      required
                      placeholder="david.salazar@cellergourmet.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full border border-slate-300 focus:border-orange-500 bg-white rounded px-3 py-2 text-slate-750 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Rol de Sistema</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as Role)}
                      className="w-full border border-slate-300 bg-white rounded px-3 py-2 text-slate-755 outline-none font-semibold text-slate-700"
                    >
                      <option value="ADMIN">ADMIN (Control Total)</option>
                      <option value="GERENTE">GERENTE</option>
                      <option value="COMPRAS">COMPRAS</option>
                      <option value="ALMACEN_RECEPCION">ALMACÉN RECEPTOR</option>
                      <option value="CHEF">CHEF</option>
                      <option value="COCINERO">COCINERO</option>
                      <option value="CONTABILIDAD">CONTABILIDAD</option>
                      <option value="AUDITOR">AUDITOR (Read Only completo)</option>
                      <option value="SOLO_LECTURA">SOLO LECTURA</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Asignar Sede</label>
                      <select
                        value={inviteHq}
                        onChange={(e) => setInviteHq(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded px-2 py-2 text-slate-750 outline-none"
                      >
                        {hqOptions.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-400 font-bold uppercase text-[8px] tracking-wider">Asignar Área</label>
                      <select
                        value={inviteArea}
                        onChange={(e) => setInviteArea(e.target.value)}
                        className="w-full border border-slate-300 bg-white rounded px-2 py-2 text-slate-750 outline-none"
                      >
                        {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Permissions grid checkbox during invite */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Marcar Privilegios Especiales Adicionales (Opcional)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-55 p-3 rounded-xl border border-slate-200">
                    {permissionCatalog.map(p => {
                      const checked = inviteSpecialPerms.includes(p.key);
                      return (
                        <label key={p.key} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded-lg border border-transparent hover:border-slate-200 transition">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSpecialPermission(p.key, false)}
                            className="rounded text-orange-500 focus:ring-orange-500"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-[10px] block leading-tight text-slate-700">{p.name}</span>
                            <span className="text-[8px] text-slate-450 font-medium truncate block leading-snug">{p.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('usuarios')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-505 text-white font-bold rounded-lg transition shadow shadow-indigo-650/10 flex items-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    Enviar Invitación y Registrar Cuentas
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: Simulator Switching Matrix */}
      {activeSubTab === 'simular' && (
        <div className="space-y-4 animate-fade-in" id="panel-switch-user-matrix">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-sm block">Matriz de Conmutación de Roles (Auditoría Simulada)</span>
              <p className="text-slate-500 text-[11px] mt-1 pr-12 leading-relaxed">
                Debido a que estás en un entorno sandbox interactivo de AI Studio, puedes alternar de inmediato entre las identidades federadas activas abajo para comprobar en tiempo real cómo el back-office del Celler protege los módulos, restringe botones y reporta al auditor.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" id="simulation-switch-grid">
              {users.map((u) => {
                const isActive = u.id === currentUserId;
                const isPending = u.status === 'PENDING_APPROVAL';

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-xl border p-4 flex flex-col justify-between hover:shadow transition gap-3 relative ${
                      isActive ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200'
                    }`}
                  >
                    {isPending && (
                      <span className="absolute -top-2.5 right-3 bg-amber-500 text-white rounded px-2 py-0.2 text-[8px] font-bold uppercase font-sans border border-amber-400">
                        PENDIENTE
                      </span>
                    )}

                    <div className="flex gap-3 items-center">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{u.name}</h4>
                        <span className="text-[10px] text-slate-450 block truncate">{u.email}</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold uppercase mt-1 border ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isPending ? (
                        <div className="text-[10px] text-amber-600 bg-amber-50 py-1.5 rounded text-center font-bold">
                          No simular (No aprobada aún)
                        </div>
                      ) : isActive ? (
                        <div className="w-full py-1.5 bg-indigo-55 text-indigo-700 border border-indigo-200 font-bold rounded text-center text-[10.5px] flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Sesión Activa
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            onSwitchUser(u.id);
                            alert(`Conmutado con éxito. Ahora navegas como ${u.name} (${u.role}).`);
                          }}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-[10.5px] transition flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          Entrar como {u.name.split(' ')[0]}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export {};
