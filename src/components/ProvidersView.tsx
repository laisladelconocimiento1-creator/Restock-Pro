import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Star,
  Search,
  X,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Provider, Category, Role } from '../types';

interface ProvidersProps {
  providers: Provider[];
  categories: Category[];
  currentUserRole: Role;
  onAddProvider: (p: Provider) => void;
  onUpdateProvider: (p: Provider) => void;
}

export default function ProvidersView({
  providers,
  categories,
  currentUserRole,
  onAddProvider,
  onUpdateProvider
}: ProvidersProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Editing structures
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [rfc, setRfc] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const isComprasOrHigher = ['ADMIN', 'COMPRAS', 'GERENTE'].includes(currentUserRole);

  const filteredProviders = providers.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.rfc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.contactName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (prov: Provider | null = null) => {
    if (!isComprasOrHigher) {
      alert('Tu rol actual (' + currentUserRole + ') no posee privilegios para editar proveedores.');
      return;
    }

    if (prov) {
      setEditingProvider(prov);
      setName(prov.name);
      setRfc(prov.rfc);
      setContactName(prov.contactName);
      setPhone(prov.phone);
      setEmail(prov.email);
      setAddress(prov.address);
      setRating(prov.rating);
      setSelectedCategories(prov.categories);
    } else {
      setEditingProvider(null);
      setName('');
      setRfc('');
      setContactName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setRating(5);
      setSelectedCategories([]);
    }
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rfc.trim()) {
      alert('Razón social y RFC son complementos obligatorios.');
      return;
    }

    if (editingProvider) {
      onUpdateProvider({
        ...editingProvider,
        name,
        rfc,
        contactName,
        phone,
        email,
        address,
        rating,
        categories: selectedCategories
      });
      alert('Información del proveedor actualizada.');
    } else {
      onAddProvider({
        id: 'prov-' + Math.random().toString(36).substr(2, 9),
        name,
        rfc,
        contactName,
        phone,
        email,
        address,
        rating,
        categories: selectedCategories
      });
      alert('Se registró el nuevo proveedor con éxito.');
    }
    setIsModalOpen(false);
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  return (
    <div className="space-y-6" id="providers-view">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <h2 className="text-3xl font-display font-extrabold text-slate-800 tracking-tight leading-none">
            Proveedores Autorizados
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-sans font-medium">
            Directorio oficial de proveedores, condiciones logísticas registradas, RFC e indicadores de confiabilidad.
          </p>
        </div>

        {isComprasOrHigher && (
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-sans font-bold transition shadow-md shadow-emerald-50"
            id="btn-register-provider"
          >
            <Plus className="w-4.5 h-4.5" />
            Registrar Proveedor
          </button>
        )}
      </div>

      {/* Quick Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Buscar proveedor por razón social, contacto en planta o RFC comercial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:bg-white focus:border-emerald-600 transition"
            id="input-providers-search"
          />
        </div>
      </div>

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="providers-cards-list">
        {filteredProviders.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-450 font-semibold font-sans">
            No se encontraron proveedores activos con esta búsqueda.
          </div>
        ) : (
          filteredProviders.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/85 hover:border-emerald-500/25 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition gap-5">
              {/* Top info and rating */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 bg-emerald-50 text-emerald-700/90 rounded-xl flex items-center justify-center font-bold text-lg border border-emerald-100">
                    <Truck className="w-5 h-5" />
                  </div>

                  {/* Stars visual render */}
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`w-3.5 h-3.5 ${index < p.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-800 line-clamp-1 leading-snug">{p.name}</h3>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 py-0.5 px-2 rounded-full mt-1.5 inline-block">
                    RFC: {p.rfc}
                  </span>
                </div>
              </div>

              {/* Direct Contacts visual list */}
              <div className="space-y-2 text-xs font-sans text-slate-600 border-t border-b border-slate-100 py-3.5">
                <p className="font-bold text-slate-700">Contacto: <span className="font-semibold text-slate-500">{p.contactName}</span></p>

                <div className="flex items-center gap-2 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-semibold font-mono">{p.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-semibold text-slate-650">{p.email}</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-500 leading-normal">{p.address}</span>
                </div>
              </div>

              {/* Bottom tag items */}
              <div className="flex items-center justify-between">
                {/* Associated categories badges */}
                <div className="flex flex-wrap gap-1 leading-none">
                  {p.categories.map(catId => {
                    const matchedCat = categories.find(c => c.id === catId);
                    return (
                      <span key={catId} className="px-2 py-1 border border-slate-200 rounded text-[9px] uppercase font-bold text-slate-500 bg-slate-50">
                        {matchedCat ? matchedCat.name.split(' ')[0] : 'Suministros'}
                      </span>
                    );
                  })}
                </div>

                {/* Edit Button */}
                {isComprasOrHigher && (
                  <button
                    onClick={() => handleOpenModal(p)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-150 border border-slate-200 text-slate-500 rounded-lg hover:text-slate-800 transition"
                    title="Editar Proveedor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DIALOG/MODAL: CREATE / EDIT PROVIDER */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-provider-editor">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="font-display font-bold text-lg text-slate-800">
                {editingProvider ? 'Modificar ficha de Proveedor' : 'Registrar Nuevo Proveedor Autorizado'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Provider Name */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Razón Social / Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Distribuidora Cárnicas SA de CV, Agrícola del Valle..."
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>

                {/* RFC */}
                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Cédula Fiscal RFC *</label>
                  <input
                    type="text"
                    required
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value)}
                    placeholder="RFC de 12 o 13 caracteres"
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono text-slate-800 uppercase"
                  />
                </div>

                {/* Rating select */}
                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Nivel de Desempeño / Calificación</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 outline-none"
                  >
                    <option value={5}>Excelencia ★★★★★ (Surtido completo e impecable)</option>
                    <option value={4}>Confiable ★★★★☆ (Cumple en tiempo)</option>
                    <option value={3}>Aceptable ★★★☆☆ (Demoras leves o mermas normales)</option>
                    <option value={2}>Bajo control ★★☆☆☆ (Requiere supervisión constante)</option>
                    <option value={1}>Crítico ★☆☆☆☆ (Incumple o eleva mermas de recibo)</option>
                  </select>
                </div>

                {/* Contact Name */}
                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Nombre Representante de Cuenta</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej. Ing. Pedro Robles"
                    className="w-full bg-slate-100/60 border border-slate-205 rounded-lg px-3 py-2 text-slate-800 outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-605 font-bold uppercase text-[9px] mb-1">Teléfono Directo de Pedidos</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Con lada a 10 dígitos"
                    className="w-full bg-slate-100/60 border border-slate-205 rounded-lg px-3 py-2 outline-none font-mono text-slate-800"
                  />
                </div>

                {/* Email address */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-650 font-bold uppercase text-[9px] mb-1 font-sans">Correo Electrónico de Facturación y Cotizaciones</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pedidos@nombreempresa.com"
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 outline-none"
                  />
                </div>

                {/* Fiscal Address */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-650 font-bold uppercase text-[9px] mb-1">Dirección Física o Bodega de Despacho</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Número, Col., Delegación, Estado y CP fiscal"
                    className="w-full bg-slate-100/60 border border-slate-200 rounded-lg p-2.5 text-slate-850 outline-none"
                  />
                </div>

                {/* Associated categories selection */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-650 font-bold uppercase text-[9px] mb-1.5">Especialidad de Categorías de Surtido</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    {categories.map(cat => {
                      const isSelected = selectedCategories.includes(cat.id);
                      return (
                        <div
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition select-none ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow shadow-emerald-50'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cat.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-600 hover:bg-slate-50 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
