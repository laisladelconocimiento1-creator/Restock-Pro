import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  FileText,
  Bookmark,
  Scale,
  MapPin,
  Check,
  X
} from 'lucide-react';
import { Category, Unit, Role } from '../../types';

interface UnidadesCategoriasTabProps {
  categories: Category[];
  units: Unit[];
  currentUserRole: Role;
  onAddCategory: (cat: Category) => void;
  onAddUnit: (unit: Unit) => void;
}

export default function UnidadesCategoriasTab({
  categories,
  units,
  currentUserRole,
  onAddCategory,
  onAddUnit
}: UnidadesCategoriasTabProps) {
  // Category Form
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Unit Form
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitName, setNewUnitName] = useState('');

  const canEdit = ['ADMIN', 'GERENTE'].includes(currentUserRole);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Por favor ingrese un nombre de categoría válido.');
      return;
    }

    const payload: Category = {
      id: "cat-" + Math.random().toString(36).substr(2, 9),
      name: newCatName,
      description: newCatDesc
    };

    onAddCategory(payload);
    setNewCatName('');
    setNewCatDesc('');
    setIsCatFormOpen(false);
    alert('Nueva categoría de insumos guardada.');
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitCode.trim() || !newUnitName.trim()) {
      alert('Ambos campos son requeridos para dar de alta una unidad de inventario.');
      return;
    }

    const payload: Unit = {
      id: "unit-" + Math.random().toString(36).substr(2, 9),
      code: newUnitCode.toLowerCase().trim().substring(0, 5),
      name: newUnitName
    };

    onAddUnit(payload);
    setNewUnitCode('');
    setNewUnitName('');
    setIsUnitFormOpen(false);
    alert('Nueva unidad de medida guardada.');
  };

  return (
    <div className="space-y-6 text-xs font-sans animate-fade-in" id="unidades-categorias-tab-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CATEGORIES COLUMN PANEL */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-sm text-slate-805 flex items-center gap-1.5">
              <Bookmark className="w-4.5 h-4.5 text-orange-500" />
              Categorías de Insumos ({categories.length})
            </h3>
            {canEdit && !isCatFormOpen && (
              <button
                onClick={() => setIsCatFormOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 font-bold hover:text-slate-800 text-[10.5px] px-2.5 py-1.5 rounded-lg text-slate-600 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            )}
          </div>

          {/* New Category Creator Drawer form */}
          {isCatFormOpen && (
            <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-1">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Nueva Categoría</span>
                <button type="button" onClick={() => setIsCatFormOpen(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[8px] mb-0.5">Nombre comercial *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ej. Carnes rojas"
                  className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-md outline-none text-slate-800 focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[8px] mb-0.5">Descripción breve</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Ej. Cortes finos, cerdo, embutidos..."
                  className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-md outline-none text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatFormOpen(false)}
                  className="px-2.5 py-1 border border-slate-200 text-slate-500 rounded font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-orange-600 hover:bg-orange-750 text-white rounded font-bold transition"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          )}

          {/* Category List */}
          <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {categories.map((c) => (
              <div key={c.id} className="p-3 bg-slate-50 hover:bg-slate-100/60 rounded-xl border border-slate-150 transition">
                <div className="flex justify-between items-start">
                  <strong className="text-slate-800 text-xs font-bold font-sans">{c.name}</strong>
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400">{c.id}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{c.description || 'Sin notas descriptivas en esta categoría.'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MEASUREMENT UNITS PANEL */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-3xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-sm text-slate-805 flex items-center gap-1.5">
              <Scale className="w-4.5 h-4.5 text-orange-500" />
              Unidades de Medida ({units.length})
            </h3>
            {canEdit && !isUnitFormOpen && (
              <button
                onClick={() => setIsUnitFormOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 font-bold hover:text-slate-800 text-[10.5px] px-2.5 py-1.5 rounded-lg text-slate-600 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            )}
          </div>

          {/* New Unit Maker drawer form */}
          {isUnitFormOpen && (
            <form onSubmit={handleCreateUnit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center pb-1">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Nueva Unidad</span>
                <button type="button" onClick={() => setIsUnitFormOpen(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[8px] mb-0.5">Símbolo (Código) *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value)}
                    placeholder="Ej. kg, lb, l, und"
                    className="w-full bg-white border border-slate-200 px-2.5 py-1.5 text-slate-800 rounded-md outline-none focus:border-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold uppercase text-[8px] mb-0.5">Nombre Oficial *</label>
                  <input
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder="Ej. Kilos, Libras, Litros"
                    className="w-full bg-white border border-slate-200 px-2.5 py-1.5 text-slate-800 rounded-md outline-none focus:border-orange-500 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnitFormOpen(false)}
                  className="px-2.5 py-1 border border-slate-200 text-slate-500 rounded font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-orange-600 hover:bg-orange-750 text-white rounded font-bold transition"
                >
                  Guardar Unidad
                </button>
              </div>
            </form>
          )}

          {/* Unit List */}
          <div className="grid grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {units.map((u) => (
              <div key={u.id} className="p-3 bg-slate-50 hover:bg-slate-100/60 rounded-xl border border-slate-150 flex items-center justify-between transition">
                <div>
                  <span className="font-mono text-slate-800 text-sm font-bold bg-white border border-slate-200 py-0.5 px-2 rounded mr-2">
                    {u.code}
                  </span>
                  <span className="text-slate-600 font-semibold">{u.name}</span>
                </div>
                <span className="text-[9px] font-mono text-slate-350">{u.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
