import React, { useState, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Boxes, 
  Layers, 
  UserCheck, 
  FileSpreadsheet, 
  Check, 
  ArrowRight, 
  AlertTriangle, 
  Upload, 
  Plus, 
  Trash2, 
  Info, 
  Clock, 
  DollarSign, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { store } from '../data/store';
import { RestaurantConfig, Category, Unit, Product, InventoryArea } from '../types';

interface InitialSetupWizardProps {
  onSetupComplete: (finalConfig: RestaurantConfig) => void;
}

type WizardStep = 'IDENTITY' | 'SITES' | 'META' | 'CATEGORIES_UNITS' | 'INVENTORY_IMPORT';

export default function InitialSetupWizard({ onSetupComplete }: InitialSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>('IDENTITY');

  // STEP 1: IDENTITY
  const [companyName, setCompanyName] = useState('Corporación Gastronómica S.A.');
  const [restaurantName, setRestaurantName] = useState('Restaurante El Celler Gourmet');
  const [rfc, setRfc] = useState('ECG0805128D8');
  const [address, setAddress] = useState('Santo Domingo, República Dominicana');
  const [phone, setPhone] = useState('809-123-4567');
  const [email, setEmail] = useState('administracion@elcellergourmet.com');

  // STEP 2: SITES & AREAS
  const [branches, setBranches] = useState<string[]>(['Sede Central']);
  const [newBranch, setNewBranch] = useState('');
  const [areas, setAreas] = useState<string[]>([
    'Almacén seco',
    'Refrigerados',
    'Congelados',
    'Cocina',
    'Producción'
  ]);
  const [newArea, setNewArea] = useState('');

  // STEP 3: METADATA & PARAMS
  const [currencySymbol, setCurrencySymbol] = useState('RD$');
  const [timezone, setTimezone] = useState('America/Santo_Domingo');
  const [taxRate, setTaxRate] = useState(18); // default 18% ITBIS in Dominican Republic
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // STEP 4: CATEGORIAS Y UNIDADES
  const [categories, setCategories] = useState<string[]>([
    'Abarrotes y Secos',
    'Carnes y Proteínas',
    'Lácteos y Quesos',
    'Vegetales y Frutas',
    'Bebidas Corrientes',
    'Desechables',
    'Limpieza y Saneamiento'
  ]);
  const [newCategory, setNewCategory] = useState('');

  const [units, setUnits] = useState<{ code: string; name: string }[]>([
    { code: 'g', name: 'Gramos' },
    { code: 'kg', name: 'Kilogramos' },
    { code: 'oz', name: 'Onzas' },
    { code: 'lb', name: 'Libras' },
    { code: 'ml', name: 'Mililitros' },
    { code: 'l', name: 'Litros' },
    { code: 'galon', name: 'Galón' },
    { code: 'taza', name: 'Tazas' },
    { code: 'unidad', name: 'Unidad' },
    { code: 'paquete', name: 'Paquete' },
    { code: 'caja', name: 'Caja' },
    { code: 'lata', name: 'Lata' },
    { code: 'botella', name: 'Botella' },
    { code: 'funda', name: 'Funda' },
    { code: 'porcion', name: 'Porciones' }
  ]);
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitName, setNewUnitName] = useState('');

  // STEP 5: INITIAL INVENTORY LOADING
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]); // 2D array from sheet
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappingProposed, setMappingProposed] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [importedPreview, setImportedPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested Areas matching types
  const SUGGESTED_AREAS = [
    'Almacén seco',
    'Refrigerados',
    'Congelados',
    'Cocina',
    'Producción',
    'Bar',
    'Limpieza',
    'Desechables',
    'Oficina',
    'Otros'
  ];

  // Manual list adjustments
  const handleAddBranch = () => {
    if (newBranch.trim() && !branches.includes(newBranch.trim())) {
      setBranches([...branches, newBranch.trim()]);
      setNewBranch('');
    }
  };

  const handleRemoveBranch = (name: string) => {
    setBranches(branches.filter(b => b !== name));
  };

  const handleAddArea = (areaName: string) => {
    const val = areaName.trim();
    if (val && !areas.includes(val)) {
      setAreas([...areas, val]);
    }
  };

  const handleRemoveArea = (name: string) => {
    setAreas(areas.filter(a => a !== name));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (name: string) => {
    setCategories(categories.filter(c => c !== name));
  };

  const handleAddUnit = () => {
    if (newUnitCode.trim() && newUnitName.trim() && !units.some(u => u.code === newUnitCode.toLowerCase().trim())) {
      setUnits([...units, { code: newUnitCode.toLowerCase().trim(), name: newUnitName.trim() }]);
      setNewUnitCode('');
      setNewUnitName('');
    }
  };

  const handleRemoveUnit = (code: string) => {
    setUnits(units.filter(u => u.code !== code));
  };

  // FILE IMPORT MANAGEMENT
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension !== 'xlsx' && extension !== 'csv') {
      alert('Formato no soportado. Por favor, sube un archivo Excel (.xlsx) o CSV (.csv).');
      return;
    }

    setFile(selectedFile);
    setIsImportLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Read headers and rows
        const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        if (jsonData.length === 0) {
          alert('El archivo seleccionado aparece vacío.');
          setIsImportLoading(false);
          return;
        }

        const fileHeaders = (jsonData[0] as string[]).map(h => String(h || '').trim());
        setHeaders(fileHeaders);
        setParsedRows(jsonData.slice(1));

        // Propose dynamic column mapping
        const proposedMapping: Record<string, string> = {};
        fileHeaders.forEach(header => {
          const lower = header.toLowerCase();
          if (/producto|articulo|artículo|descripcion|descripción|insumo|nombre/i.test(lower)) {
            proposedMapping[header] = 'name';
          } else if (/cantidad|existencia|stock|disponible|inventario/i.test(lower)) {
            proposedMapping[header] = 'initialStock';
          } else if (/costo|precio|costo unitario|último costo|ultimo costo/i.test(lower)) {
            proposedMapping[header] = 'cost';
          } else if (/unidad|medida|um|u\/m/i.test(lower)) {
            proposedMapping[header] = 'unit';
          } else if (/proveedor|suplidor|vendor/i.test(lower)) {
            proposedMapping[header] = 'provider';
          } else if (/area|área|almacen|almacén|ubicacion|ubicación|departamento/i.test(lower)) {
            proposedMapping[header] = 'area';
          } else if (/minimo|mínimo|min/i.test(lower)) {
            proposedMapping[header] = 'minStock';
          } else if (/maximo|máximo|max/i.test(lower)) {
            proposedMapping[header] = 'maxStock';
          } else if (/codigo|código|code/i.test(lower)) {
            proposedMapping[header] = 'code';
          } else {
            proposedMapping[header] = 'IGNORE';
          }
        });

        setMapping(proposedMapping);
        setMappingProposed(true);
        generatePreview(jsonData.slice(1), fileHeaders, proposedMapping);

      } catch (err) {
        console.error(err);
        alert('Ocurrió un error al procesar las filas del archivo.');
      } finally {
        setIsImportLoading(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleMappingChange = (header: string, field: string) => {
    const updated = { ...mapping, [header]: field };
    setMapping(updated);
    generatePreview(parsedRows, headers, updated);
  };

  const generatePreview = (rowsData: any[], fileHeaders: string[], map: Record<string, string>) => {
    const previewList: any[] = [];
    rowsData.slice(0, 15).forEach((row, rIdx) => {
      const item: Record<string, any> = { id: `row-${rIdx}` };
      fileHeaders.forEach((header, colIdx) => {
        const sysField = map[header];
        if (sysField && sysField !== 'IGNORE') {
          item[sysField] = row[colIdx];
        }
      });
      if (item.name) {
        previewList.push(item);
      }
    });
    setImportedPreview(previewList);
  };

  const handleApplyImport = () => {
    // Collect and construct all configured objects
    const currentProducts = store.getProducts();
    const currentCategories = store.getCategories();
    const currentUnits = store.getUnits();
    const currentProviders = store.getProviders();

    // 1. Ensure Categories exist
    const categoryNameIdMap: Record<string, string> = {};
    categories.forEach((catName, idx) => {
      const found = currentCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (found) {
        categoryNameIdMap[catName.toLowerCase()] = found.id;
      } else {
        const newId = `cat-wizard-${idx}-${Date.now().toString(36)}`;
        store.addCategory({ id: newId, name: catName, description: 'Categoría importada durante el asistente de inicio' });
        categoryNameIdMap[catName.toLowerCase()] = newId;
      }
    });

    // 2. Ensure Units exist
    const unitMap: Record<string, string> = {};
    units.forEach((uObj) => {
      const found = currentUnits.find(u => u.code.toLowerCase() === uObj.code.toLowerCase());
      if (found) {
        unitMap[uObj.code.toLowerCase()] = found.id;
      } else {
        const newId = `uni-wizard-${uObj.code.toLowerCase()}`;
        store.addUnit({ id: newId, code: uObj.code, name: uObj.name });
        unitMap[uObj.code.toLowerCase()] = newId;
      }
    });

    // Default general catalog category & unit as fallback
    const defaultSecosId = currentCategories.find(c => c.name.toLowerCase().includes('sec'))?.id || categories[0] || 'cat-4';
    const defaultUnitId = currentUnits.find(u => u.code === 'unidad' || u.code === 'pz')?.id || 'uni-3';

    // 3. Process products from Excel/CSV
    let countCreated = 0;
    parsedRows.forEach((row, ri) => {
      const rawProductObj: Record<string, any> = {};
      headers.forEach((header, ci) => {
        const sysField = mapping[header];
        if (sysField && sysField !== 'IGNORE') {
          rawProductObj[sysField] = row[ci];
        }
      });

      if (!rawProductObj.name) return;

      const pName = String(rawProductObj.name).trim();
      const pStock = Math.max(0, parseFloat(rawProductObj.initialStock) || 0);
      const pCost = Math.max(0, parseFloat(rawProductObj.cost) || 0);
      const pMin = Math.max(0, parseFloat(rawProductObj.minStock) || 0);
      const pMax = Math.max(0, parseFloat(rawProductObj.maxStock) || 100);
      const pUnit = String(rawProductObj.unit || '').trim().toLowerCase();
      const pCategory = String(rawProductObj.category || '').trim().toLowerCase();
      const pProvider = String(rawProductObj.provider || '').trim();
      const pArea = String(rawProductObj.area || '').trim();

      // Find matching category
      let categoryId = defaultSecosId;
      if (pCategory) {
        const catFound = categories.find(c => c.toLowerCase() === pCategory);
        if (catFound && categoryNameIdMap[catFound.toLowerCase()]) {
          categoryId = categoryNameIdMap[catFound.toLowerCase()];
        }
      }

      // Find unit
      let unitId = defaultUnitId;
      if (pUnit) {
        if (unitMap[pUnit]) {
          unitId = unitMap[pUnit];
        } else {
          // Check standard mappings or auto-add
          const unitObj = units.find(u => u.code === pUnit || u.name.toLowerCase() === pUnit);
          if (unitObj) {
            unitId = unitMap[unitObj.code];
          }
        }
      }

      // Check for providers
      const providerIds: string[] = [];
      if (pProvider) {
        const provFound = currentProviders.find(p => p.name.toLowerCase() === pProvider.toLowerCase() || p.corporateName?.toLowerCase() === pProvider.toLowerCase());
        if (provFound) {
          providerIds.push(provFound.id);
        } else {
          const newProvId = `prov-wizard-${Date.now().toString(36)}-${ri}`;
          store.addProvider({
            id: newProvId,
            name: pProvider,
            corporateName: pProvider,
            rfc: 'RNC-WIZARD',
            phone: 'Sin Teléfono',
            email: 'contacto@proveedor.com',
            isActive: true,
            address: 'Establecido durante importación inicial',
            categories: [],
            rating: 5
          } as any);
          providerIds.push(newProvId);
        }
      }

      // Map area (standard area fallback)
      let matchedArea: InventoryArea = 'Almacén seco';
      if (pArea) {
        const matched = areas.find(a => a.toLowerCase() === pArea.toLowerCase());
        if (matched) matchedArea = matched as InventoryArea;
      }

      // Generate random SKU / ID
      const newProdId = `prod-wizard-${Date.now().toString(36)}-${ri}`;
      const newProduct: Product = {
        id: newProdId,
        name: pName,
        categoryId: categoryId,
        unitId: unitId,
        currentStock: pStock,
        minStock: pMin,
        maxStock: pMax,
        averageCost: pCost,
        lastPrice: pCost,
        description: `Importado en stock inicial.`,
        providerIds: providerIds,
        initialReceptionArea: matchedArea,
        habitualDestinationArea: matchedArea,
        areaStocks: {
          [matchedArea]: pStock
        }
      };

      store.addProduct(newProduct);
      countCreated++;

      // Create Movement: INITIAL_STOCK
      if (pStock > 0) {
        const currentUser = store.getCurrentUser() || { id: 'usr-1', name: 'Diana Alarcón' };
        const unitObj = store.getUnits().find(u => u.id === unitId);
        
        store.addMovement({
          id: `mov-init-${Date.now().toString(36)}-${ri}`,
          productId: newProdId,
          productName: pName,
          qty: pStock,
          unitCode: unitObj ? unitObj.code : 'u',
          type: 'INITIAL_STOCK',
          quantityBefore: 0,
          quantityAfter: pStock,
          area: matchedArea,
          userId: currentUser.id,
          userName: currentUser.name,
          date: new Date().toISOString(),
          reason: 'Carga de Stock Inicial Ilustrado',
          comment: `Importado de archivo inicial ${file ? file.name : 'masivo'}.`
        });
      }
    });

    handleFinalizeSetup(countCreated > 0);
  };

  const handleFinalizeSetup = (hasImportedStock = false) => {
    // Save configuration settings
    const finalConfig: RestaurantConfig = {
      restaurantName,
      companyName,
      rfc,
      address,
      phone,
      email,
      taxRate,
      currencySymbol,
      allowedDomain: 'cellergourmet.com',
      branches,
      areas,
      currency: currencySymbol,
      timezone,
      dateFormat,
      isConfigComplete: true,
      initialInventoryConfirmed: true
    };

    store.updateConfig(finalConfig);

    // Register beautiful setup confirmation Audit Logs
    store.addAuditLog(
      'CONFIGURACION_SISTEMA_COMPLETA',
      'Configuración',
      `Procedimiento de inicialización finalizado para "${restaurantName}" (${companyName}). Sede(s): [${branches.join(', ')}]. Áreas: [${areas.join(', ')}].`,
      'setup-wizard'
    );

    alert(`¡Paso a paso completado con éxito! Se ha consolidado la identidad de ${restaurantName} y configurado el sistema operativo para operación real.`);
    onSetupComplete(finalConfig);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center overflow-y-auto px-4 py-8 font-sans" id="setup-wizard-fullscreen">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* LEFT COLUMN: VISUAL STEPS SUMMARY */}
        <div className="w-full md:w-80 bg-slate-950 p-8 flex flex-col justify-between text-slate-100 border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-orange-500 rounded bg-orange-600 flex items-center justify-center font-extrabold text-sm text-white">
                RP
              </div>
              <div>
                <h3 className="font-display font-extrabold text-white text-sm uppercase tracking-wide">Restock Pro</h3>
                <span className="text-[9px] text-slate-500 font-mono">INSTALLATION INTERSECTION</span>
              </div>
            </div>

            <div className="border-t border-slate-800 my-4" />

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pasos de Configuración</h4>
              
              <div className={`flex items-center gap-3 text-xs ${step === 'IDENTITY' ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 'IDENTITY' ? 'border-orange-500 bg-orange-950/40 text-orange-400' : 'border-slate-800'}`}>1</div>
                <span>Identidad de la Empresa</span>
              </div>

              <div className={`flex items-center gap-3 text-xs ${step === 'SITES' ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 'SITES' ? 'border-orange-500 bg-orange-950/40 text-orange-400 font-bold' : 'border-slate-800'}`}>2</div>
                <span>Sedes y Almacenes</span>
              </div>

              <div className={`flex items-center gap-3 text-xs ${step === 'META' ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 'META' ? 'border-orange-500 bg-orange-950/40 text-orange-400 font-bold' : 'border-slate-800'}`}>3</div>
                <span>Formatos y Moneda</span>
              </div>

              <div className={`flex items-center gap-3 text-xs ${step === 'CATEGORIES_UNITS' ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 'CATEGORIES_UNITS' ? 'border-orange-500 bg-orange-950/40 text-orange-400 font-bold' : 'border-slate-800'}`}>4</div>
                <span>Unidades y Categorías</span>
              </div>

              <div className={`flex items-center gap-3 text-xs ${step === 'INVENTORY_IMPORT' ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 'INVENTORY_IMPORT' ? 'border-orange-500 bg-orange-950/40 text-orange-400 font-bold' : 'border-slate-800'}`}>5</div>
                <span>Inventario Inicial</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-orange-500 shrink-0" />
              <p>
                El Celler Gourmet se encuentra actualmente bloqueado bajo el estado <strong className="text-red-400 font-bold uppercase">CONFIGURACIÓN_INCOMPLETA</strong>. Completa estos 5 pasos para desbloquear el sistema de inmediato.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE STEP PANEL */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          
          <div className="flex-1 p-8 overflow-y-auto max-h-[75vh]">
            {/* STEP 1: IDENTITY */}
            {step === 'IDENTITY' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-850">Identidad del Concesionario / Empresa</h2>
                  <p className="text-slate-500 text-xs mt-1">Registra la razón social de la empresa controladora y el nombre del restaurante.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Nombre Comercial del Restaurante *</label>
                    <input 
                      type="text" 
                      required
                      value={restaurantName} 
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Razón Social Jurídica / Empresa *</label>
                    <input 
                      type="text" 
                      required
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">RNC o Identificación Fiscal (SAT) *</label>
                    <input 
                      type="text" 
                      required
                      value={rfc} 
                      onChange={(e) => setRfc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs font-mono uppercase focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Celular o Teléfono Oficina *</label>
                    <input 
                      type="text" 
                      required
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Correo de Contacto Corporativo *</label>
                    <input 
                      type="email" 
                      required
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">Dirección Oficial del Establecimiento</label>
                    <input 
                      type="text" 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-2">
                  <UserCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-[11px] font-bold text-orange-800">Administrador Inicial</h5>
                    <p className="text-[10px] text-orange-700 mt-0.5">
                      Para garantizar el cumplimiento de seguridad de sucursales, el sistema pre-inicializará la cuenta administrador principal de <strong>Diana Alarcón (diana.alarcon@cellergourmet.com)</strong> como usuario activo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SITES & AREAS */}
            {step === 'SITES' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-850">Sedes y Áreas Internas de Almacén</h2>
                  <p className="text-slate-500 text-xs mt-1">El sistema requiere al menos una sucursal activa y un área de inventario asignada.</p>
                </div>

                {/* SUCURSALES */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-755 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    Sedes o Sucursales Operativas
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Ej. Sede Central, Almacén General, Zona Colonial..."
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddBranch()}
                      className="flex-1 rounded-lg border border-slate-200 p-2.5 text-xs outline-none"
                    />
                    <button 
                      onClick={handleAddBranch}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {branches.map(b => (
                      <span key={b} className="bg-slate-100 border border-slate-200 text-slate-750 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        {b}
                        <button onClick={() => handleRemoveBranch(b)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {branches.length === 0 && (
                      <p className="text-[10px] text-red-500 font-bold">⚠️ Debes registrar al menos una sede.</p>
                    )}
                  </div>
                </div>

                {/* AREAS INTERNAS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-755 uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Áreas de Almacenamiento Internas
                  </h4>
                  <p className="text-[10px] text-slate-400">Sugiere áreas donde se guardará material seco, refrigeración, congelación, cocina, etc.</p>
                  
                  <div className="flex flex-wrap gap-1.5 mb-2 py-2 border-b border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold shrink-0 self-center">Áreas sugeridas:</span>
                    {SUGGESTED_AREAS.filter(sa => !areas.includes(sa)).map(sa => (
                      <button 
                        key={sa} 
                        onClick={() => handleAddArea(sa)}
                        className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 px-2 py-0.5 rounded-md flex items-center gap-1 font-sans"
                      >
                        <Plus className="w-3 h-3 text-slate-400" /> {sa}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Ej. Bodega licores, Almacén secundario, etc..."
                      value={newArea}
                      onChange={(e) => setNewArea(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddArea(newArea);
                          setNewArea('');
                        }
                      }}
                      className="flex-1 rounded-lg border border-slate-200 p-2.5 text-xs outline-none"
                    />
                    <button 
                      onClick={() => {
                        handleAddArea(newArea);
                        setNewArea('');
                      }}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {areas.map(a => (
                      <span key={a} className="bg-orange-50 border border-orange-100 text-orange-800 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between">
                        <span className="truncate">{a}</span>
                        <button onClick={() => handleRemoveArea(a)} className="text-orange-400 hover:text-red-500 shrink-0 ml-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {areas.length === 0 && (
                      <p className="col-span-3 text-[10px] text-red-500 font-bold">⚠️ Se requiere al menos un área de almacén.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: METADATA & PARAMS */}
            {step === 'META' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-850">Formatos, Moneda e Impuestos</h2>
                  <p className="text-slate-500 text-xs mt-1">Configura las propiedades de redondeo monetario, zona horaria y tasas fiscales aplicables al Libro de Compras.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <label className="block text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-orange-500" />
                      Símbolo Moneda Operativa
                    </label>
                    <select 
                      value={currencySymbol} 
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    >
                      <option value="RD$">RD$ (Peso Dominicano)</option>
                      <option value="USD">USD ($ Dólar Americano)</option>
                      <option value="EUR">EUR (€ Euro)</option>
                      <option value="MXN">MXN ($ Peso Mexicano)</option>
                      <option value="CLP">CLP ($ Peso Chileno)</option>
                    </select>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <label className="block text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-orange-500" />
                      Zona Horaria de Seguridad (UTC)
                    </label>
                    <select 
                      value={timezone} 
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    >
                      <option value="America/Santo_Domingo">Dominicana (America/Santo_Domingo - GMT-4)</option>
                      <option value="America/Mexico_City">México (America/Mexico_City)</option>
                      <option value="America/Bogota">Colombia / Perú (America/Bogota)</option>
                      <option value="America/Santiago">Chile (America/Santiago)</option>
                    </select>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <label className="block text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
                      <PercentLabel />
                      Porcentaje de Impuestos Locales *
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        required
                        min="0"
                        max="100"
                        value={taxRate} 
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                      <span className="text-sm font-bold text-slate-500">%</span>
                    </div>
                    <span className="text-[9px] text-slate-400">ITBIS de 18% sugerido de acuerdo a regulaciones SAT o DGII RD.</span>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <label className="block text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      Formato de Fechas
                    </label>
                    <select 
                      value={dateFormat} 
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
                    >
                      <option value="DD/MM/YYYY">Día / Mes / Año (DD/MM/YYYY)</option>
                      <option value="YYYY-MM-DD">Año - Mes - Día (YYYY-MM-DD)</option>
                      <option value="MM/DD/YYYY">Mes / Día / Año (MM/DD/YYYY)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: CATEGORIAS Y UNIDADES */}
            {step === 'CATEGORIES_UNITS' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-850">Normalización de Categorías y Unidades</h2>
                  <p className="text-slate-500 text-xs mt-1">Define las unidades fundamentales y clasificaciones contables para evitar descuadres de inventario.</p>
                </div>

                {/* CATEGORIAS BASICAS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-755 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-orange-500" />
                    Categorías Básicas de Insumos / Artículos
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Ej. Carnes, Abarrotes, Verduras, Desechable..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="flex-1 rounded-lg border border-slate-200 p-2.5 text-xs outline-none"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                    >
                      Añadir
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((c) => (
                      <span key={c} className="bg-slate-100 border border-slate-200 text-slate-750 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                        {c}
                        <button onClick={() => handleRemoveCategory(c)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-[10px] text-red-500 font-bold">⚠️ Debes registrar al menos una categoría de inventario.</p>
                    )}
                  </div>
                </div>

                {/* UNIDADES DE MEDIDA */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-755 uppercase tracking-wide flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-orange-500" />
                    Unidades de Medida en Operaciones
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text"
                      placeholder="Código (Ej. kg, lb, l)"
                      value={newUnitCode}
                      onChange={(e) => setNewUnitCode(e.target.value)}
                      className="rounded-lg border border-slate-200 p-2.5 text-xs outline-none"
                    />
                    <input 
                      type="text"
                      placeholder="Nombre (Ej. Kilogramo, Libra)"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      className="rounded-lg border border-slate-200 p-2.5 text-xs outline-none"
                    />
                    <button 
                      onClick={handleAddUnit}
                      className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold py-2"
                    >
                      Añadir Unidad
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {units.map((u) => (
                      <span key={u.code} className="bg-orange-50 border border-orange-100 text-orange-850 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center justify-between">
                        <span>
                          <strong className="font-mono text-xs">{u.code}</strong> <span className="text-orange-600 text-[10px]">({u.name})</span>
                        </span>
                        <button onClick={() => handleRemoveUnit(u.code)} className="text-orange-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: INITIAL INVENTORY IMPORT */}
            {step === 'INVENTORY_IMPORT' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-display font-extrabold text-slate-850">Importación de Inventario Inicial</h2>
                  <p className="text-slate-500 text-xs mt-1">Carga las existencias actuales de insumos operacionales desde Excel (.xlsx) o CSV. El stock inicial entrará como un movimiento formal con motivo de kárdex.</p>
                </div>

                {/* FILE SELECTION DRAG DROP ZONE */}
                {!mappingProposed ? (
                  <div className="space-y-4">
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-all ${
                        dragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                        <Upload className="w-6 h-6 border-b" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Arrastra tu inventario aquí o</p>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-orange-600 font-bold underline mt-1.5 hover:text-orange-700 block mx-auto"
                        >
                          Selecciona un archivo Excel o CSV
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">Excel (.xlsx) o CSV hasta 10MB. Sin plantillas rígidas, el mapeador resolverá tus columnas de forma autónoma.</p>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileInput} 
                        accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        className="hidden" 
                      />
                    </div>

                    <div className="border-t border-slate-200 pt-6 text-center">
                      <p className="text-xs text-slate-500 mb-3">¿Prefieres iniciar el inventario actual completamente en cero y sin insumos?</p>
                      <button 
                        onClick={() => {
                          const conf = window.confirm('¿Desea omitir la carga inicial de stock? Podrá crear insumos y recibirlos mediante compras o manuales más adelante.');
                          if (conf) {
                            handleFinalizeSetup(false);
                          }
                        }}
                        className="px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Confirmar Inventario Vacío (Por defecto)
                      </button>
                    </div>
                  </div>
                ) : (
                  // COLUMNS MAPPING INTERACTIVE INTERFACE
                  <div className="space-y-6">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="text-[11px] font-bold text-orange-800">Mapeos de Columnas Generados</h5>
                        <p className="text-[10px] text-orange-700 mt-0.5">La app ha analizado los encabezados del archivo. Revisa que correspondan para evitar mermas o costos erróneos.</p>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {headers.map(header => (
                          <div key={header} className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-mono text-xs text-slate-600 truncate max-w-[150px]" title={header}>{header}</span>
                            <span className="text-slate-400 text-xs mr-2">→</span>
                            <select 
                              value={mapping[header] || 'IGNORE'}
                              onChange={(e) => handleMappingChange(header, e.target.value)}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] font-sans focus:bg-white outline-none"
                            >
                              <option value="IGNORE">Ignorar Columna</option>
                              <option value="name">Dato: Nombre del Producto</option>
                              <option value="code">Dato: Código SKU</option>
                              <option value="initialStock">Dato: Existencia / Stock Inicial</option>
                              <option value="cost">Dato: Costo Promedio / Unitario</option>
                              <option value="unit">Dato: Unidad de Medida</option>
                              <option value="category">Dato: Categoría</option>
                              <option value="provider">Dato: Proveedor Principal</option>
                              <option value="area">Dato: Ubicación / Área</option>
                              <option value="minStock">Dato: Stock Mínimo</option>
                              <option value="maxStock">Dato: Stock Máximo</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PREVIEW ITEMS */}
                    {importedPreview.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Muestra de Filas a Importar ({parsedRows.length} fila(s))</h4>
                        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                          <table className="w-full text-[11px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-3 text-slate-500 font-bold uppercase text-[9px]">Producto</th>
                                <th className="p-3 text-slate-500 font-bold uppercase text-[9px]">Stock Inicial</th>
                                <th className="p-3 text-slate-500 font-bold uppercase text-[9px]">Costo</th>
                                <th className="p-3 text-slate-500 font-bold uppercase text-[9px]">Unidad</th>
                                <th className="p-3 text-slate-500 font-bold uppercase text-[9px]">Sede / Área</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importedPreview.map((item) => (
                                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                  <td className="p-3 text-slate-800 font-bold">{item.name || '—'}</td>
                                  <td className="p-3 font-mono text-slate-700 bg-emerald-50/20">{item.initialStock || '0'}</td>
                                  <td className="p-3 font-mono text-slate-700">{currencySymbol} {parseFloat(item.cost || 0).toFixed(2)}</td>
                                  <td className="p-3"><span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[10px]">{item.unit || 'u'}</span></td>
                                  <td className="p-3 text-slate-500">{item.area || 'Almacén seco'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => {
                          setFile(null);
                          setParsedRows([]);
                          setMappingProposed(false);
                        }}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold"
                      >
                        Reiniciar Selección de Archivo
                      </button>
                      <button 
                        onClick={handleApplyImport}
                        className="px-6 py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md"
                      >
                        Concluir e Importar {parsedRows.length} Productos <Check className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN BOTTOM PROGRESS FOOTER / CONTROLS */}
          <div className="p-6 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            {step !== 'IDENTITY' ? (
              <button 
                onClick={() => {
                  if (step === 'SITES') setStep('IDENTITY');
                  if (step === 'META') setStep('SITES');
                  if (step === 'CATEGORIES_UNITS') setStep('META');
                  if (step === 'INVENTORY_IMPORT') setStep('CATEGORIES_UNITS');
                }}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-bold"
              >
                Anterior
              </button>
            ) : <div />}

            {step !== 'INVENTORY_IMPORT' ? (
              <button 
                onClick={() => {
                  if (step === 'IDENTITY') {
                    if (!restaurantName.trim() || !companyName.trim()) {
                      alert('El nombre comercial y la razón social son campos obligatorios.');
                      return;
                    }
                    setStep('SITES');
                  }
                  else if (step === 'SITES') {
                    if (branches.length === 0 || areas.length === 0) {
                      alert('Debes registrar al menos una sede y un área interna.');
                      return;
                    }
                    setStep('META');
                  }
                  else if (step === 'META') {
                    setStep('CATEGORIES_UNITS');
                  }
                  else if (step === 'CATEGORIES_UNITS') {
                    if (categories.length === 0 || units.length === 0) {
                      alert('Se requiere un listado de categorías primarias y unidades.');
                      return;
                    }
                    setStep('INVENTORY_IMPORT');
                  }
                }}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                Guardar y Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// Percent Label SVG
function PercentLabel() {
  return (
    <svg className="w-4 h-4 text-orange-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
