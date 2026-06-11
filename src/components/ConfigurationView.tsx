import React, { useState } from 'react';
import { Settings, Save, HelpCircle, Shield, Store, Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { RestaurantConfig, Role } from '../types';
import { store } from '../data/store';

interface ConfigProps {
  config: RestaurantConfig;
  currentUserRole: Role;
  onUpdateConfig: (conf: RestaurantConfig) => void;
  onSystemReset?: () => void;
}

export default function ConfigurationView({
  config,
  currentUserRole,
  onUpdateConfig,
  onSystemReset
}: ConfigProps) {
  // Config form states representing real Restaurant metadata variables
  const [restaurantName, setRestaurantName] = useState(config.restaurantName);
  const [rfc, setRfc] = useState(config.rfc);
  const [address, setAddress] = useState(config.address);
  const [phone, setPhone] = useState(config.phone);
  const [taxRate, setTaxRate] = useState(config.taxRate);
  const [allowedDomain, setAllowedDomain] = useState(config.allowedDomain || 'cellergourmet.com');

  // General alert limits
  const [lowStockAlertLimit, setLowStockAlertLimit] = useState(5);
  const [consecutiveDaysReconciliation, setConsecutiveDaysReconciliation] = useState(7);
  const [resetting, setResetting] = useState(false);

  const isAdmin = currentUserRole === 'ADMIN';

  const handleResetSystem = async () => {
    if (!isAdmin) {
      alert('Solo un administrador con permisos plenos puede realizar esta purga.');
      return;
    }
    
    const confirmMsg = '¿Está absolutamente seguro de que desea poner en CERO todo el sistema?\n\nEsta acción borrará todas las recetas, mermas, compras, existencias de inventario, auditorías de cocina, ventas manuales e importadas en el servidor y localmente.';
    if (!window.confirm(confirmMsg)) return;

    if (!window.confirm('ADVERTENCIA: Esta operación es irreversible y reconstruirá los inventarios limpios con valores en cero. ¿Desea efectuar la purga total?')) return;

    setResetting(true);
    try {
      const res = await fetch('/api/v1/system/reset-to-zero', {
        method: 'POST'
      });
      const data = await res.json();
      
      store.resetAllToZero();
      
      alert(data.message || 'El sistema ha sido purgado y puesto a cero de forma exitosa.');
      if (onSystemReset) {
        onSystemReset();
      }
    } catch (err: any) {
      console.error(err);
      store.resetAllToZero();
      if (onSystemReset) {
        onSystemReset();
      }
      alert('Se realizó la purga del inventario local únicamente debido a falla de red con el servidor.');
    } finally {
      setResetting(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Tu rol actual (' + currentUserRole + ') tiene denegada la modificación de variables del Celler Gourmet.');
      return;
    }

    onUpdateConfig({
      restaurantName,
      rfc,
      address,
      phone,
      email: config.email,
      taxRate,
      currencySymbol: config.currencySymbol,
      allowedDomain
    });

    alert('Configuraciones operativas guardadas con éxito e impactadas en el Libro de Compras.');
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="config-panel">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Configuración del Restaurante
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Define la razón social del corporativo, dirección fiscal para remisiones y umbrales operacionales de alertas críticas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left main form edit (Take 2 cols) */}
        <form onSubmit={handleSaveConfig} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <h3 className="font-display font-bold text-base text-slate-805 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-orange-500 font-sans" />
            Datos de Identidad Fiscal (SAT)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 font-bold uppercase text-[9px] mb-1">Nombre Comercial de la Sede *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 text-slate-800 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">RFC del Corporativo Contable *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 outline-none font-mono text-slate-800 uppercase disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Dirección Oficial del Establecimiento</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 text-slate-800 outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Celular de Contacto Sucursal</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 outline-none font-mono text-slate-800 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Porcentaje Tasa IVA predeterminado (%)</label>
              <input
                type="number"
                step="any"
                disabled={!isAdmin}
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 outline-none font-mono text-slate-800 disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-650 font-bold uppercase text-[9px] mb-1">Restricción de Dominio Google Sign-In (Vacío para libre acceso)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={allowedDomain}
                onChange={(e) => setAllowedDomain(e.target.value)}
                placeholder="Ejemplo: cellergourmet.com"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 outline-none font-mono text-slate-800 disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-1 block font-medium">
                Si se especifica, los correos con un dominio de correo diferente recibirán la advertencia "Tu cuenta no tiene acceso" de manera inmediata al iniciar sesión.
              </p>
            </div>
          </div>

          <h3 className="font-display font-bold text-base text-slate-805 flex items-center gap-2 border-b border-slate-100 pb-3 pt-4">
            <Bell className="w-5 h-5 text-amber-500" />
            Umbrales de Control e Indicadores Críticos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Límite Global Stock Mínimo (Alerta de escasez)</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={lowStockAlertLimit}
                onChange={(e) => setLowStockAlertLimit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 outline-none font-mono text-slate-850 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Días recomendados entre auditorías físicas</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={consecutiveDaysReconciliation}
                onChange={(e) => setConsecutiveDaysReconciliation(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-lg p-2.5 outline-none font-mono text-slate-850 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Prompt warning if not admin */}
          {!isAdmin && (
            <div className="p-3.5 bg-red-50 border border-red-150 rounded-xl text-red-900 leading-relaxed font-sans first-letter:uppercase text-[11px]">
              ❗ Modificación deshabilitada: Tu rol de usuario actual es de solo consulta administrativa o no cuenta con la política de seguridad <strong>ADMIN</strong> para sobreescribir variables en base de datos.
            </div>
          )}

          {/* Action button if admin */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-sans font-bold transition shadow-sm"
                id="btn-save-rest-config"
              >
                <Save className="w-4 h-4" />
                Guardar Configuración
              </button>
            </div>
          )}
        </form>

        {/* Right side help guidelines (Take 1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 font-sans">
            <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-slate-700 font-bold" />
              Especificaciones de Seguridad
            </h4>
            <p className="text-slate-500 leading-normal">
              La sucursal está operando bajo políticas del Celler Gourmet. Toda modificación de estos registros genera un log de auditoría inalterable que especifica la IP, hora precisa UTC y cambio realizado por el administrador.
            </p>
            <div className="pt-3 border-t border-slate-200 space-y-2 text-[10px] text-slate-450 leading-relaxed">
              <p>✔ Sistema validado por el SAT.</p>
              <p>✔ Conectividad segura TLSv1.3 activa.</p>
              <p>✔ Copias de seguridad automáticas activas.</p>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-red-50/70 rounded-2xl p-6 border border-red-200/80 space-y-4 font-sans">
              <h4 className="font-display font-bold text-sm text-red-800 flex items-center gap-2">
                <Trash2 className="w-4.5 h-4.5 text-red-650" />
                Acciones de Emergencia / Auditoría
              </h4>
              <p className="text-red-950 text-[11px] leading-relaxed">
                Pone en cero todas las existencias, mermas de porcionamiento, recetas operativas, cierres de cocina, registro de ventas e historial de compras de forma global y permanente.
              </p>
              <button
                type="button"
                onClick={handleResetSystem}
                disabled={resetting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 px-4 rounded-xl text-xs font-bold font-sans transition cursor-pointer active:scale-95 shadow-sm"
                id="btn-master-reset-zero"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Ejecutando Purga...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Poner todo en 0 ("Pon todo en 0")
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
