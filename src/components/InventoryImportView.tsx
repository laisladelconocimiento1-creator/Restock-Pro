import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Info,
  ChevronRight,
  Download,
  Settings as SettingsIcon,
  Search,
  Check,
  AlertTriangle,
  History,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  Trash2,
  FilePlus2,
  Edit2,
  Database
} from "lucide-react";
import * as XLSX from "xlsx";
import { store } from "../data/store";
import {
  Product,
  Category,
  Unit,
  Provider,
  InventoryImport,
  InventoryImportColumn,
  InventoryImportRow,
  InventoryImportError,
  User,
  MovementType,
  InventoryArea
} from "../types";

interface InventoryImportViewProps {
  products: Product[];
  categories: Category[];
  units: Unit[];
  providers: Provider[];
  currentUser: User;
  onReloadAllData: () => void;
}

type Step = "LIST" | "UPLOAD" | "MAPPING" | "PREVIEW" | "OPTIONS" | "SUMMARY";

export default function InventoryImportView({
  products,
  categories,
  units,
  providers,
  currentUser,
  onReloadAllData
}: InventoryImportViewProps) {
  // Navigation & View Flow
  const [currentStep, setCurrentStep] = useState<Step>("LIST");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Import States
  const [importHistory, setImportHistory] = useState<InventoryImport[]>([]);
  const [activeImport, setActiveImport] = useState<InventoryImport | null>(null);
  const [columns, setColumns] = useState<InventoryImportColumn[]>([]);
  const [rows, setRows] = useState<InventoryImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<InventoryImportError[]>([]);
  
  // Search and view filters inside preview
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "VALID" | "WARNING" | "ERROR" | "DUPLICATE">("ALL");
  const [previewSearch, setPreviewSearch] = useState<string>("");

  // Options configuration
  const [importOptions, setImportOptions] = useState({
    importMode: "all" as "catalog_only" | "catalog_stock" | "catalog_costs" | "all",
    createCategories: true,
    createProviders: true,
    createUnits: true,
    updateExistingMode: "name" as "sku" | "name" | "ignore"
  });

  // Inline correction buffer
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, string>>({});

  // File Upload drag target reference states
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Past Import History from Backend on Mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/v1/imports/inventory/history");
      const json = await res.json();
      if (json.success) {
        setImportHistory(json.data);
      }
    } catch (err) {
      console.error("No se pudo conectar a la API de importaciones, usando mock storage.", err);
      // Fallback fallback to local store directly
      setImportHistory(store.getInventoryImports());
    }
  };

  // Helper template downloader calling backend
  const handleDownloadTemplate = () => {
    window.open("/api/v1/imports/inventory/template", "_blank");
  };

  // Drag & drop file actions
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileClick = () => {
    fileInputRef.current?.click();
  };

  // Read file as base64 and call backend upload
  const processFile = async (file: File) => {
    const sizeLimit = 10 * 1024 * 1024; // 10MB Limit
    if (file.size > sizeLimit) {
      setErrorMessage("El archivo excede el tamaño límite permitido de 10 MB.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") {
      setErrorMessage("Formato de archivo no soportado. Debe ser un archivo .csv o Excel .xlsx");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result as string;
        // Call Backend REST API
        const response = await fetch("/api/v1/imports/inventory/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: extension,
            fileContent: fileContent,
            uploaderId: currentUser.id,
            uploaderName: currentUser.name
          })
        });

        const resData = await response.json();
        if (!response.ok || !resData.success) {
          throw new Error(resData.error || "Ocurrió un error al subir el archivo.");
        }

        // Setup states from analyzer
        setActiveImport(resData.data.import);
        setColumns(resData.data.columns);
        // Backend rows are loaded asynchronously
        setRows(resData.data.sampleRows || []);
        
        // Sync local storage mocks to support state persistence
        store.addInventoryImport(resData.data.import);
        store.saveInventoryImportColumns(resData.data.columns);

        // Move to mapping step
        setCurrentStep("MAPPING");
      } catch (err: any) {
        setErrorMessage(err.message || "Fallo crítico al subir y procesar el documento.");
      } finally {
        setLoading(false);
      }
    };

    if (extension === "csv") {
      reader.readAsText(file, "utf-8");
    } else {
      // Excel to base64
      reader.readAsDataURL(file);
    }
  };

  // Select target system field manually
  const handleMapFieldChange = (originalColumnName: string, selectedField: string) => {
    const modified = columns.map(col => {
      if (col.originalColumnName === originalColumnName) {
        return {
          ...col,
          selectedSystemField: selectedField,
          ignored: selectedField === "IGNORE"
        };
      }
      return col;
    });
    setColumns(modified);
  };

  // Submit column mappings
  const handleSubmitMappings = async () => {
    if (!activeImport) return;

    // Check if required field 'nombre_producto' exists
    const hasProductName = columns.some(c => !c.ignored && c.selectedSystemField === "nombre_producto");
    if (!hasProductName) {
      setErrorMessage("Debe relacionar obligatoriamente al menos una columna con el campo 'Nombre del Producto' (nombre_producto).");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Send mapped keys configuration to server
      const mapPayload = columns.map(c => ({
        originalColumnName: c.originalColumnName,
        selectedSystemField: c.ignored ? "" : c.selectedSystemField,
        ignored: c.ignored
      }));

      const mappingResponse = await fetch("/api/v1/imports/inventory/map-columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId: activeImport.id,
          mappings: mapPayload
        })
      });

      const mapData = await mappingResponse.json();
      if (!mappingResponse.ok || !mapData.success) {
        throw new Error(mapData.error || "Error al registrar el mapeo.");
      }

      // Trigger automatic row validations using backend
      const valResponse = await fetch("/api/v1/imports/inventory/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId: activeImport.id,
          existingProducts: products
        })
      });

      const valData = await valResponse.json();
      if (!valResponse.ok || !valData.success) {
        throw new Error(valData.error || "Error al validar la información estructurada.");
      }

      // Update interactive states
      setActiveImport(valData.data.import);
      setRows(valData.data.rows);
      setImportErrors(valData.data.errors);

      // Save locally
      store.saveInventoryImportRows(valData.data.rows);
      store.saveInventoryImportErrors(valData.data.errors);

      // Move to preview step
      setCurrentStep("PREVIEW");
    } catch (err: any) {
      setErrorMessage(err.message || "No se pudo realizar el análisis de relaciones.");
    } finally {
      setLoading(false);
    }
  };

  // Edit raw cells of columns in editing
  const startEditRow = (row: InventoryImportRow) => {
    setEditingRowId(row.id);
    setEditingData(row.rawData);
  };

  const handleEditingCellChange = (columnName: string, text: string) => {
    setEditingData(prev => ({
      ...prev,
      [columnName]: text
    }));
  };

  const saveEditedRow = async (rowId: string) => {
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === rowId) {
          return {
            ...r,
            rawData: editingData
          };
        }
        return r;
      });

      // Submit whole rows back to server for re-validation
      // To simulate, we save to local DB then trigger server validation
      const allRows = store.getInventoryImportRows();
      const filteredOtherRows = allRows.filter(r => r.importId !== activeImport?.id);
      filteredOtherRows.push(...updatedRows);
      store.saveInventoryImportRows(filteredOtherRows);

      const valResponse = await fetch("/api/v1/imports/inventory/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId: activeImport?.id,
          existingProducts: products
        })
      });

      const valData = await valResponse.json();
      if (!valResponse.ok || !valData.success) {
        throw new Error(valData.error || "Error al re-validar el renglón modificado.");
      }

      setActiveImport(valData.data.import);
      setRows(valData.data.rows);
      setImportErrors(valData.data.errors);

      setEditingRowId(null);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper of custom error levels styling
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200";
      case "WARNING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Download error logs via server
  const handleDownloadErrors = () => {
    if (!activeImport) return;
    window.open(`/api/v1/imports/inventory/${activeImport.id}/download-errors`, "_blank");
  };

  // Commit and write entries to primary business catalog
  const handleConfirmAndCommit = async () => {
    if (!activeImport) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Confirm with backend (marks status IMPORTED/PARTIAL and returns results)
      const res = await fetch("/api/v1/imports/inventory/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId: activeImport.id,
          selectedOptions: importOptions
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Ocurrió un error al procesar el volcado.");
      }

      // 2. Perform Real Client-Side synchronization of Catalog
      // Let's iterate through rows and write them dynamically inside our Store!
      const validRowsToCommit = rows.filter(r => r.status !== "ERROR");
      
      let createdCount = 0;
      let updatedCount = 0;

      // Local lookup dictionaries to optimize speed
      const localProducts = [...products];
      const localCats = [...categories];
      const localUnits = [...units];
      const localProviders = [...providers];

      validRowsToCommit.forEach(row => {
        const norm = row.normalizedData;
        if (!norm || !norm.name) return;

        // Clean values normalization
        let catId = "";
        if (norm.category) {
          const matchedCat = localCats.find(c => c.name.toLowerCase().trim() === norm.category.toLowerCase().trim());
          if (matchedCat) {
            catId = matchedCat.id;
          } else if (importOptions.createCategories) {
            // Auto create Category
            const newCat: Category = {
              id: "cat-" + Math.random().toString(36).substr(2, 9),
              name: norm.category,
              description: `Creada automáticamente durante importación de ${activeImport.fileName}`
            };
            store.addCategory(newCat);
            localCats.push(newCat);
            catId = newCat.id;
          }
        }
        if (!catId) catId = localCats[0] ? localCats[0].id : "cat-default";

        let unitId = "";
        if (norm.unit) {
          // Normalize codes: "libra", "libras", "lb" -> "lb", "kilos", "kg" -> "kg", etc.
          let codeValue = norm.unit.toLowerCase().trim();
          if (["libra", "libras", "lb"].includes(codeValue)) codeValue = "lb";
          else if (["kilo", "kilos", "kilogramo", "kg"].includes(codeValue)) codeValue = "kg";
          else if (["gramo", "gramos", "g"].includes(codeValue)) codeValue = "g";
          else if (["litro", "litros", "l"].includes(codeValue)) codeValue = "L";
          else if (["unidad", "unidades", "und", "pza", "pieza", "unds"].includes(codeValue)) codeValue = "und";

          const matchedUnit = localUnits.find(u => u.code.toLowerCase() === codeValue || u.name.toLowerCase() === codeValue);
          if (matchedUnit) {
            unitId = matchedUnit.id;
          } else if (importOptions.createUnits) {
            // Auto create Unit
            const newUnit: Unit = {
              id: "unit-" + Math.random().toString(36).substr(2, 9),
              code: codeValue.substring(0, 5),
              name: norm.unit
            };
            store.addUnit(newUnit);
            localUnits.push(newUnit);
            unitId = newUnit.id;
          }
        }
        if (!unitId) unitId = localUnits[0] ? localUnits[0].id : "unit-default";

        let providerIds: string[] = [];
        if (norm.provider) {
          const matchedProv = localProviders.find(p => p.name.toLowerCase().trim() === norm.provider.toLowerCase().trim());
          if (matchedProv) {
            providerIds.push(matchedProv.id);
          } else if (importOptions.createProviders) {
            const newProv: Provider = {
              id: "prov-" + Math.random().toString(36).substr(2, 9),
              name: norm.provider,
              rfc: "XAXX010101000",
              contactName: "Proveedor Importado",
              phone: "555-000-0000",
              email: "proveedor@importacion.com",
              address: "Dirección de Importación",
              categories: [],
              rating: 5
            };
            store.addProvider(newProv);
            localProviders.push(newProv);
            providerIds.push(newProv.id);
          }
        }

        // Check if product already exists
        let existingProduct: Product | undefined;
        if (importOptions.updateExistingMode === "sku" && norm.sku) {
          existingProduct = localProducts.find(p => (p as any).sku === norm.sku);
        } else if (importOptions.updateExistingMode === "name") {
          existingProduct = localProducts.find(p => p.name.toLowerCase().trim() === norm.name.toLowerCase().trim());
        }

        const costVal = parseFloat(norm.averageCost) || 0;
        const stockVal = parseFloat(norm.currentStock) || 0;

        if (existingProduct) {
          // UPDATE PRODUCT
          const oldStock = existingProduct.currentStock;
          const oldAvgCost = existingProduct.averageCost;

          let finalCost = oldAvgCost;
          if (importOptions.importMode === "catalog_costs" || importOptions.importMode === "all") {
            finalCost = costVal > 0 ? costVal : oldAvgCost;
          }

          let finalStock = oldStock;
          if (importOptions.importMode === "catalog_stock" || importOptions.importMode === "all") {
            finalStock = oldStock + stockVal;
          }

          const updatedProd: Product = {
            ...existingProduct,
            categoryId: catId,
            unitId: unitId,
            averageCost: finalCost,
            lastPrice: costVal > 0 ? costVal : existingProduct.lastPrice,
            currentStock: finalStock,
            providerIds: providerIds.length > 0 ? providerIds : existingProduct.providerIds
          };

          // If portion management is mapped
          if (norm.requiere_porcionamiento) {
            const reqPortion = norm.requiere_porcionamiento.toString().toLowerCase();
            if (["si", "yes", "true", "1", "activo"].includes(reqPortion)) {
              updatedProd.portionsAvailable = updatedProd.portionsAvailable || 0;
            }
          }

          store.updateProduct(updatedProd);
          
          // CRITICAL: Stock Movement registered
          if (stockVal > 0 && (importOptions.importMode === "catalog_stock" || importOptions.importMode === "all")) {
            store.addMovement({
              id: "mov-" + Math.random().toString(36).substr(2, 9),
              productId: existingProduct.id,
              productName: existingProduct.name,
              qty: stockVal,
              unitCode: store.getUnitCode(unitId),
              type: "INITIAL_STOCK",
              quantityBefore: oldStock,
              quantityAfter: finalStock,
              area: (norm.area_almacen || "Almacén General") as InventoryArea,
              userId: currentUser.id,
              userName: currentUser.name,
              date: new Date().toISOString(),
              reason: `Incremento de stock inicial por importación flexible de inventario de archivo "${activeImport.fileName}"`,
              comment: `Referencia importación: ${activeImport.id}, fila: ${row.rowNumber}.`,
              documentRelatedId: activeImport.id
            });
          }

          updatedCount++;
        } else {
          // CREATE NEW PRODUCT
          const newId = "prod-" + Math.random().toString(36).substr(2, 9);
          const newProd: Product = {
            id: newId,
            name: norm.name,
            categoryId: catId,
            unitId: unitId,
            currentStock: (importOptions.importMode === "catalog_stock" || importOptions.importMode === "all") ? stockVal : 0,
            minStock: parseFloat(norm.stock_minimo) || 0,
            maxStock: parseFloat(norm.stock_maximo) || 0,
            averageCost: costVal,
            lastPrice: costVal,
            description: norm.observaciones || `Producto importado de forma flexible desde ${activeImport.fileName}`,
            providerIds: providerIds,
          };

          // Bind custom custom SKU property for inventory
          if (norm.sku) {
            (newProd as any).sku = norm.sku;
          }

          // If portions are mapped
          if (norm.requiere_porcionamiento) {
            const reqPortion = norm.requiere_porcionamiento.toString().toLowerCase();
            if (["si", "yes", "true", "1", "activo"].includes(reqPortion)) {
              newProd.portionsAvailable = 0;
            }
          }

          store.addProduct(newProd);

          // Register Initial Store Inventory Movement
          if (stockVal > 0 && (importOptions.importMode === "catalog_stock" || importOptions.importMode === "all")) {
            store.addMovement({
              id: "mov-" + Math.random().toString(36).substr(2, 9),
              productId: newId,
              productName: norm.name,
              qty: stockVal,
              unitCode: store.getUnitCode(unitId),
              type: "INITIAL_STOCK",
              quantityBefore: 0,
              quantityAfter: stockVal,
              area: (norm.area_almacen || "Almacén General") as InventoryArea,
              userId: currentUser.id,
              userName: currentUser.name,
              date: new Date().toISOString(),
              reason: `Carga de productos nuevos con stock inicial. Referencia: ${activeImport.id}`,
              comment: `Origen fila de importación #${row.rowNumber}.`,
              documentRelatedId: activeImport.id
            });
          }

          createdCount++;
        }
      });

      // Write general audit logs
      store.addAuditLog(
        "CONFIRMACIÓN_IMPORTACIÓN",
        "Inventario",
        `Importación finalizada de archivo "${activeImport.fileName}". Creados: ${createdCount}, Actualizados: ${updatedCount}, Omitidos: ${rows.length - validRowsToCommit.length}`,
        activeImport.id
      );

      // Reload primary lists in visual tables
      onReloadAllData();

      // Set final receipt statistics
      setActiveImport(prev => prev ? {
        ...prev,
        status: "IMPORTED",
        createdProducts: createdCount,
        updatedProducts: updatedCount,
        skippedRows: rows.length - validRowsToCommit.length
      } : null);

      setCurrentStep("SUMMARY");
      fetchHistory();
    } catch (err: any) {
      setErrorMessage(err.message || "Fallo en la sincronización local.");
    } finally {
      setLoading(false);
    }
  };

  // Filter local rows inside preview screen
  const filteredRows = rows.filter(row => {
    // 1. Search text match
    const text = previewSearch.toLowerCase().trim();
    const matchesSearch = text === "" || 
      (row.rawData && Object.values(row.rawData).some(val => String(val || "").toLowerCase().includes(text))) ||
      (row.normalizedData && Object.values(row.normalizedData).some(val => String(val || "").toLowerCase().includes(text)));
    
    // 2. Status match
    if (!matchesSearch) return false;
    if (previewFilter === "ALL") return true;
    
    // Detect duplicate/error
    if (previewFilter === "ERROR") return row.status === "ERROR";
    if (previewFilter === "DUPLICATE") return row.status === "DUPLICATE";
    if (previewFilter === "VALID") return row.status === "VALID";
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="inventory-import-module-container">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-slate-200">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            Importar Lista de Inventario
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Gestione de forma inteligente y flexible la carga de insumos de su restaurante desde hojas Excel o archivos CSV. El sistema sugiere mapeos automáticos y evita la duplicidad.
          </p>
        </div>
        
        {currentStep === "LIST" && (
          <button
            onClick={() => {
              setActiveImport(null);
              setCurrentStep("UPLOAD");
              setErrorMessage(null);
            }}
            className="px-4 py-2 bg-orange-500 text-white font-semibold text-xs uppercase tracking-wider rounded hover:bg-orange-600 transition flex items-center justify-center gap-2"
            id="btn-trigger-new-import"
          >
            <FilePlus2 className="w-4 h-4" />
            Nueva Importación
          </button>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white" id="importing-loading-overlay">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-2" />
          <p className="text-xs font-mono font-medium tracking-wide">PROCESANDO INFORMACIÓN... ESPERE POR FAVOR</p>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded flex items-start gap-3 text-sm" id="import-error-banner">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Atención lógica</h4>
            <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: HISTORY AND ACTIVE LISTS OVERVIEW */}
      {currentStep === "LIST" && (
        <div className="grid grid-cols-1 gap-6" id="view-step-list">
          {/* Main Card with empty state or list */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Historial de Cargas Procesadas
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {importHistory.length} registros totales
              </span>
            </div>

            {importHistory.length === 0 ? (
              <div className="p-12 text-center" id="empty-history-visual">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-slate-700 text-sm">No hay importaciones previas</h4>
                <p className="text-xs text-slate-505 max-w-sm mx-auto mt-1">
                  Usted no ha subido listas de inventarios o sus cargas previas fueron limpiadas. Comience ahora para cargar su catálogo en segundos.
                </p>
                <button
                  onClick={() => setCurrentStep("UPLOAD")}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded transition"
                >
                  Subir primer archivo
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono uppercase tracking-wider">
                      <th className="p-3">ID de Carga</th>
                      <th className="p-3">Nombre del Archivo</th>
                      <th className="p-3">Subido por</th>
                      <th className="p-3 text-center">Renglones</th>
                      <th className="p-3 text-center">Logros</th>
                      <th className="p-3 text-right">Valuación Stock</th>
                      <th className="p-3 text-right">Estado</th>
                      <th className="p-3 text-center">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {importHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono font-bold text-slate-600">{item.id}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{item.fileName}</span>
                            <span className="px-1 py-0.2 bg-slate-200 text-[9px] text-slate-500 rounded font-mono uppercase">{item.fileType}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">{item.uploadedByUserName || "anon"}</td>
                        <td className="p-3 text-center text-slate-700 font-medium">{item.totalRows}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {item.status === "IMPORTED" ? (
                              <>
                                <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.2 border border-green-200 rounded">
                                  <strong>+{item.createdProducts}</strong> Creados
                                </span>
                                <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.2 border border-sky-200 rounded">
                                  <strong>+{item.updatedProducts}</strong> Act
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 font-sans italic text-[11px]">No confirmado</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-800 font-medium">
                          ${item.totalInventoryValue?.toLocaleString()} MXN
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'IMPORTED' ? 'bg-green-105 text-green-800 border border-green-250' : 
                            item.status === 'WITH_ERRORS' ? 'bg-red-105 text-red-850 border border-red-200' :
                            item.status === 'VALIDATED' ? 'bg-blue-105 text-blue-800 border border-blue-200' :
                            'bg-amber-105 text-amber-800 border border-amber-200'
                          }`}>
                            {item.status === "IMPORTED" ? "CONFIRMADO" : item.status === "VALIDATED" ? "VALIDADO" : item.status === "WITH_ERRORS" ? "CON ERRORES" : item.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-550">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: FILE UPLOAD DRAG BOX */}
      {currentStep === "UPLOAD" && (
        <div className="max-w-3xl mx-auto space-y-6" id="view-step-upload">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setCurrentStep("LIST")}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
                id="btn-back-history"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="font-display font-medium text-sm text-slate-800 uppercase tracking-wide">Subir Nueva Planilla</h3>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                dragActive ? "border-orange-500 bg-orange-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100/60"
              }`}
              onClick={triggerFileClick}
              id="drag-and-drop-container"
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileInputChange}
              />
              
              <div className="w-14 h-14 bg-white shadow rounded-full flex items-center justify-center text-orange-500 mb-4 border border-slate-150">
                <Upload className="w-7 h-7" />
              </div>

              <h4 className="font-semibold text-slate-700 text-sm">Arrastre y suelte su archivo aquí</h4>
              <p className="text-xs text-slate-450 mt-1 mb-4">Maneje Excel (.xlsx) o archivos CSV separados por coma.</p>
              
              <button
                type="button"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded transition"
              >
                Buscar Archivo
              </button>
            </div>

            {/* Template Card Downloader */}
            <div className="mt-8 p-4 bg-orange-50/50 rounded-lg border border-orange-100 flex items-start justify-between gap-4">
              <div className="flex gap-2">
                <FileSpreadsheet className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs text-slate-800">¿No tiene una estructura establecida?</h4>
                  <p className="text-xs text-slate-505 max-w-sm mt-1">
                    Descargue nuestra plantilla interna base con todas las columnas nativas del sistema ya organizadas.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="text-orange-600 hover:text-orange-700 font-bold text-[11px] underline flex gap-1 items-center whitespace-nowrap"
                id="btn-download-import-template"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Plantilla (.csv)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: COLUMN MAPPING PANEL */}
      {currentStep === "MAPPING" && activeImport && (
        <div className="space-y-6" id="view-step-mapping">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4 mb-4">
              <div>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">PASO 2 DE 4: RELACIONAR COLUMNAS</span>
                <h3 className="font-display font-medium text-sm text-slate-800 mt-1">REGLACIÓN DE ARCHIVO CLIENTE</h3>
                <p className="text-xs text-slate-505 mt-0.5">
                  Vea cómo se asociaron las columnas de su archivo original "<span className="font-mono font-semibold text-slate-850">{activeImport.fileName}</span>" con los campos requeridos del sistema. Corrija los mapeos según se necesite.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep("UPLOAD")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSubmitMappings}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold transition flex items-center gap-1.5"
                  id="btn-submit-mappings"
                >
                  Analizar y Validar
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Crucial indicator */}
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-150 rounded text-slate-700 flex gap-2 text-xs">
              <Info className="w-4.5 h-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Requisito Lógico:</strong> Para cargar productos, el sistema requiere relacionar de forma mandatoria la columna que contenga el **Nombre del Producto (nombre_producto)**. El resto son opcionales.
              </div>
            </div>

            <div className="overflow-x-auto space-y-4">
              {/* Table Column Mapping Layout */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left font-sans text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-505 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="p-3">Columna de su archivo</th>
                      <th className="p-3">Mapeo Predeterminado</th>
                      <th className="p-3 text-center">Tipo Encontrado</th>
                      <th className="p-3">Confianza</th>
                      <th className="p-3">Muestras del archivo</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {columns.map((col) => {
                      const isRequired = col.suggestedSystemField === "nombre_producto";
                      return (
                        <tr key={col.id} className={`hover:bg-slate-50/50 transition ${col.ignored ? "bg-slate-50/30 opacity-60" : ""}`}>
                          {/* Col original name */}
                          <td className="p-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-1">
                              {col.originalColumnName}
                              {isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
                            </div>
                          </td>
                          
                          {/* System Field Select Selection */}
                          <td className="p-3">
                            <select
                              value={col.ignored ? "IGNORE" : col.selectedSystemField}
                              onChange={(e) => handleMapFieldChange(col.originalColumnName, e.target.value)}
                              className="px-2.5 py-1.5 border border-slate-200 rounded text-xs text-slate-800 max-w-[200px]"
                            >
                              <option value="IGNORE">🚨 Omitir esta columna</option>
                              <optgroup label="Datos Básicos (Catálogo)">
                                <option value="nombre_producto">📦 Nombre de Producto (Requerido)</option>
                                <option value="sku">🔑 SKU o Código</option>
                                <option value="categoria">📁 Categoría</option>
                                <option value="subcategoria">📂 Subcategoría</option>
                                <option value="unidad_compra">📦 Unidad de Compra</option>
                                <option value="unidad_base">⚖️ Unidad de Inventario (Base)</option>
                                <option value="factor_conversion">🔢 Factor de Conversión</option>
                                <option value="proveedor_principal">🚚 Proveedor Principal</option>
                                <option value="observaciones">📝 Observaciones / Notas</option>
                              </optgroup>
                              <optgroup label="Operaciones de Stock y Finanzas">
                                <option value="stock_inicial">🏁 Stock / Cantidad Inicial</option>
                                <option value="costo_unitario">💵 Costo Unitario de Compra</option>
                                <option value="stock_minimo">📉 Stock Mínimo Reorden</option>
                                <option value="stock_maximo">📈 Stock Máximo</option>
                                <option value="punto_reorden">🔄 Reorden Automático</option>
                                <option value="area_almacen">📍 Área Física Almacenamiento</option>
                                <option value="estado">🟢 Estado (Activo/Inactivo)</option>
                              </optgroup>
                              <optgroup label="Porcionamiento">
                                <option value="requiere_porcionamiento">🐔 Requiere Porcionamiento</option>
                                <option value="tamano_porcion">📏 Tamaño de Porción</option>
                                <option value="unidad_porcion">⚖️ Unidad de Porción</option>
                                <option value="rendimiento_esperado">📐 % Rendimiento</option>
                                <option value="merma_esperada">📉 % Merma</option>
                              </optgroup>
                            </select>
                          </td>

                          {/* Detected type */}
                          <td className="p-3 text-center">
                            <span className="px-1.5 py-0.5 bg-slate-105 border border-slate-200 rounded font-mono text-[10px] uppercase text-slate-600">
                              {col.detectedDataType}
                            </span>
                          </td>

                          {/* Confidence */}
                          <td className="p-3">
                            {col.ignored ? (
                              <span className="text-slate-400 text-xs italic">Ignorada</span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${col.confidenceScore >= 90 ? "bg-green-500" : col.confidenceScore >= 60 ? "bg-amber-500" : "bg-red-400"}`}
                                    style={{ width: `${col.confidenceScore}%` }}
                                  />
                                </div>
                                <span className={`font-mono text-[10px] font-bold ${col.confidenceScore >= 90 ? "text-green-600" : col.confidenceScore >= 60 ? "text-amber-600" : "text-rose-500"}`}>
                                  {col.confidenceScore}%
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Sample cells */}
                          <td className="p-3 text-slate-500 max-w-[250px] font-mono text-[10px] truncate">
                            {col.sampleValues.join(", ")}
                          </td>

                          {/* Toggle ignore */}
                          <td className="p-3 text-right">
                            {col.ignored ? (
                              <button
                                onClick={() => handleMapFieldChange(col.originalColumnName, col.suggestedSystemField || "nombre_producto")}
                                className="text-orange-600 font-bold hover:underline"
                              >
                                Activar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMapFieldChange(col.originalColumnName, "IGNORE")}
                                className="text-slate-500 hover:text-red-500 hover:underline"
                              >
                                Ignorar
                              </button>
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
        </div>
      )}

      {/* STEP 4: PREVIEW AND ERROR CORRECTIONS SCREEN */}
      {currentStep === "PREVIEW" && activeImport && (
        <div className="space-y-6" id="view-step-preview">
          {/* TOP SUMMARY STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total de Productos</h4>
                <p className="text-lg font-bold font-mono text-slate-800">{activeImport.totalRows} renglones</p>
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-semibold text-green-700">Productos Válidos</h4>
                <p className="text-lg font-bold font-mono text-green-700">{activeImport.validRows} listos</p>
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center gap-3 font-semibold text-amber-700">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider">Advertencias / Duplicados</h4>
                <p className="text-lg font-bold font-mono">{activeImport.warningRows} incidentes</p>
              </div>
            </div>

            <div className="bg-white p-4 border border-slate-200 rounded-lg flex items-center gap-3 text-red-700">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider">Errores Graves</h4>
                <p className="text-lg font-bold font-mono">{activeImport.errorRows} críticos</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">PASO 3 DE 4: VISTA PREVIA Y VALIDACIÓN</span>
                <h3 className="font-display font-medium text-sm text-slate-800 mt-1">REVISIÓN DE PRODUCTOS A INGRESAR</h3>
                <p className="text-xs text-slate-505 mt-0.5">
                  Revise los productos antes de impactar el inventario activo. El sistema calculó un valor aproximado total de <strong className="font-mono text-indigo-700">${activeImport.totalInventoryValue?.toLocaleString()} MXN</strong> en existencias brutas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep("MAPPING")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition"
                >
                  Modificar Mapeo
                </button>
                {importErrors.length > 0 && (
                  <button
                    onClick={handleDownloadErrors}
                    className="px-3 py-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded text-xs font-bold transition flex items-center gap-1"
                    id="btn-download-errors-csv"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Errores CSV
                  </button>
                )}
                <button
                  onClick={() => setCurrentStep("OPTIONS")}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold transition flex items-center gap-1.5"
                  id="btn-proceed-options"
                >
                  Siguiente paso
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ERROR SUMMARY PANEL */}
            {importErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-500" />
                  <h4 className="font-bold text-xs text-red-800 uppercase tracking-wider font-mono">Errores de Ingesta Detectados ({importErrors.length})</h4>
                </div>
                <div className="max-h-40 overflow-y-auto text-xs space-y-2 pr-2 border-t border-red-150 pt-2">
                  {importErrors.map((err) => (
                    <div key={err.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white border border-red-100 rounded">
                      <div>
                        <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1 rounded mr-2">Fila {err.rowNumber}</span>
                        <span className="font-semibold text-slate-800">Elemento "{err.columnName}": </span>
                        <span className="text-red-700 font-semibold">{err.errorMessage} </span>
                        <span className="text-slate-500 text-[11px] italic">({err.suggestion})</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border font-mono ${getSeverityBadge(err.severity)}`}>
                        {err.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MINI FILTER ROW */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPreviewFilter("ALL")}
                  className={`px-3 py-1 font-bold rounded text-xs transition ${previewFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-200"}`}
                >
                  Todos ({rows.length})
                </button>
                <button
                  onClick={() => setPreviewFilter("VALID")}
                  className={`px-3 py-1 font-bold rounded text-xs transition ${previewFilter === "VALID" ? "bg-green-600 text-white" : "text-slate-600 hover:bg-slate-200"}`}
                >
                  Válidos ({activeImport.validRows})
                </button>
                <button
                  onClick={() => setPreviewFilter("DUPLICATE")}
                  className={`px-3 py-1 font-bold rounded text-xs transition ${previewFilter === "DUPLICATE" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-200"}`}
                >
                  Duplicados/Similares ({activeImport.warningRows})
                </button>
                <button
                  onClick={() => setPreviewFilter("ERROR")}
                  className={`px-3 py-1 font-bold rounded text-xs transition ${previewFilter === "ERROR" ? "bg-red-500 text-white" : "text-slate-600 hover:bg-slate-200"}`}
                >
                  Con Críticos ({activeImport.errorRows})
                </button>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar en el documento..."
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* PREVIEW PRODUCT GRID TABLE */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-505 font-mono uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Fila</th>
                    <th className="p-3">SKU / Código</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Unidad Base</th>
                    <th className="p-3 text-right">Cant. Inicial</th>
                    <th className="p-3 text-right">Costo Unitario</th>
                    <th className="p-3">Área de Destino</th>
                    <th className="p-3 text-right">Estado Fila</th>
                    <th className="p-3 text-center">In-Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredRows.map((row) => {
                    const isEditing = editingRowId === row.id;
                    const norm = row.normalizedData || {};
                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50/50 transition ${
                          row.status === "ERROR" ? "bg-red-50/30" : row.status === "DUPLICATE" ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="p-3 font-mono text-slate-400 font-bold">{row.rowNumber}</td>
                        
                        {/* SKU */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["sku"] || ""}
                              onChange={(e) => handleEditingCellChange("sku", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs w-20"
                            />
                          ) : (
                            <span className="font-mono text-slate-600 font-medium">{norm.sku || "N/A"}</span>
                          )}
                        </td>

                        {/* PRODUCT NAME */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["nombre_producto"] || ""}
                              onChange={(e) => handleEditingCellChange("nombre_producto", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs w-full min-w-[150px]"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{norm.name || "N/A"}</span>
                          )}
                        </td>

                        {/* CATEGORY */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["categoria"] || ""}
                              onChange={(e) => handleEditingCellChange("categoria", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs w-28"
                            />
                          ) : (
                            <span className="text-slate-505">{norm.category || "Sin categoría"}</span>
                          )}
                        </td>

                        {/* BASE UNIT */}
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["unidad_base"] || ""}
                              onChange={(e) => handleEditingCellChange("unidad_base", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs w-16"
                            />
                          ) : (
                            <span className="font-mono text-[10px] text-slate-600">{norm.unit || "und"}</span>
                          )}
                        </td>

                        {/* QUANTITY */}
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["stock_inicial"] || ""}
                              onChange={(e) => handleEditingCellChange("stock_inicial", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs text-right w-16"
                            />
                          ) : (
                            <span className="font-mono font-semibold text-slate-700">{norm.currentStock || "0"}</span>
                          )}
                        </td>

                        {/* COST */}
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["costo_unitario"] || ""}
                              onChange={(e) => handleEditingCellChange("costo_unitario", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs text-right w-16"
                            />
                          ) : (
                            <span className="font-mono text-slate-800">${(norm.averageCost || 0).toLocaleString()}</span>
                          )}
                        </td>

                        {/* AREA */}
                        <td className="p-3 truncate max-w-[120px]">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editingData["area_almacen"] || ""}
                              onChange={(e) => handleEditingCellChange("area_almacen", e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded text-xs w-24"
                            />
                          ) : (
                            <span className="text-slate-500">{norm.area_almacen || "Almacén Gral."}</span>
                          )}
                        </td>

                        {/* STATE FILE STATUS */}
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            row.status === "VALID" ? "bg-green-100 text-green-800" :
                            row.status === "DUPLICATE" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {row.status === "VALID" ? "Correcto" : row.status === "DUPLICATE" ? "Duplicado" : "Error Fila"}
                          </span>
                        </td>

                        {/* ACTIONS INLINE */}
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => saveEditedRow(row.id)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Guardar cambios de celda"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                                title="Cancelar"
                              >
                                <ArrowLeft className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditRow(row)}
                              className="p-1 text-slate-500 hover:text-orange-500 hover:bg-slate-100 rounded inline-block"
                              title="Editar renglón en línea"
                            >
                              <Edit2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                        No se encontraron productos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: FINAL INGEST CONFIGURATIONS AND CRITICAL CHECKS */}
      {currentStep === "OPTIONS" && activeImport && (
        <div className="max-w-3xl mx-auto space-y-6" id="view-step-options">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-150 pb-4">
              <div>
                <span className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">PASO 4 DE 4: CONFIGURACIONES DE INGESTA</span>
                <h3 className="font-display font-medium text-sm text-slate-800 mt-1">VOLCADO Y CONFIGURACIONES OPERATIVAS</h3>
              </div>
              <button
                onClick={() => setCurrentStep("PREVIEW")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition"
              >
                Atrás
              </button>
            </div>

            <div className="space-y-4">
              {/* Option Mode select */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                  Modo de Importación de Datos
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="p-3 border border-slate-200 rounded-lg flex items-start gap-2.5 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importOptions.importMode === "all"}
                      onChange={() => setImportOptions(prev => ({ ...prev, importMode: "all" }))}
                      className="mt-1 text-orange-500"
                    />
                    <div>
                      <h5 className="font-semibold text-xs text-slate-800">Catálogo + Existencias + Costos (Recomendado)</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Carga el producto, asigna costo unitario de compra y genera movimientos de ajuste de stock inicial.
                      </p>
                    </div>
                  </label>

                  <label className="p-3 border border-slate-200 rounded-lg flex items-start gap-2.5 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importOptions.importMode === "catalog_only"}
                      onChange={() => setImportOptions(prev => ({ ...prev, importMode: "catalog_only" }))}
                      className="mt-1 text-orange-500"
                    />
                    <div>
                      <h5 className="font-semibold text-xs text-slate-800">Solo Productos (Ficha Técnica)</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Registra los nombres y descripciones en catálogo con stock en 0 e ignorando valores de costo.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Update strategy */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-slate-600 mb-1.5">
                  Estrategia ante Productos Duplicados Coincidentes
                </label>
                <select
                  value={importOptions.updateExistingMode}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, updateExistingMode: e.target.value as any }))}
                  className="w-full px-2.5 py-2 border border-slate-200 rounded text-xs"
                >
                  <option value="name">🔄 Actualización Inteligente: Cruzar por Nombre similar o exactitud</option>
                  <option value="sku">🔑 Cruzar por coincidencia de SKU / Código identificador único</option>
                  <option value="ignore">❌ Omitir y saltar: No actualizar productos que ya están en catálogo</option>
                </select>
              </div>

              {/* Automatic registrations toggles */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Creación Automática de Entidades Secundarias</h4>
                
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.createCategories}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createCategories: e.target.checked }))}
                      className="text-orange-500 rounded"
                    />
                    <span className="text-slate-800">
                      Crear de forma automática **Categorías** nuevas si se mencionan en las filas del documento.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.createProviders}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createProviders: e.target.checked }))}
                      className="text-orange-500 rounded"
                    />
                    <span className="text-slate-800">
                      Crear de forma automática **Proveedores** nuevos si se definen en el documento.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.createUnits}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createUnits: e.target.checked }))}
                      className="text-orange-500 rounded"
                    />
                    <span className="text-slate-800">
                      Crear de forma automática **Unidades de Medida** no registradas detectadas.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-150 flex justify-end">
              <button
                onClick={handleConfirmAndCommit}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
                id="btn-confirm-import-finalize"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar y Volcar en Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: SPECTACULAR SUMMATION RECEIPT */}
      {currentStep === "SUMMARY" && activeImport && (
        <div className="max-w-2xl mx-auto space-y-6" id="view-step-summary">
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-green-55 rounded-full flex items-center justify-center mx-auto text-green-600 shadow shadow-green-500/10">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 tracking-tight">¡Importación Completada de Forma Exitosa!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Se han volcado los registros del archivo original "<span className="font-mono font-semibold">{activeImport.fileName}</span>" de forma inteligente sobre el catálogo de Restock Pro.
              </p>
            </div>

            {/* Audit Receipt Panel */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-left space-y-3 font-sans text-xs max-w-md mx-auto">
              <h4 className="font-bold text-[10px] text-slate-400 font-mono uppercase tracking-widest text-center border-b border-slate-200 pb-2">Comprobante Ingerido</h4>
              
              <div className="flex justify-between">
                <span className="text-slate-500">Referencia de Importación:</span>
                <span className="font-mono font-semibold text-slate-700">{activeImport.id}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold text-green-700">Productos Nuevos Creados:</span>
                <span className="font-mono font-bold text-green-700">+{activeImport.createdProducts} insumos</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Insumos Existentes Actualizados:</span>
                <span className="font-mono font-bold text-slate-700">+{activeImport.updatedProducts} registros</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Renglones Omitidos/Erróneos:</span>
                <span className="font-mono text-slate-500">{activeImport.skippedRows}</span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                <span className="text-slate-600">Existencias Brutas Ingresadas:</span>
                <span className="font-mono text-indigo-700">${activeImport.totalInventoryValue?.toLocaleString()} MXN</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-150 rounded text-slate-700 text-xs flex gap-2 max-w-md mx-auto text-left">
              <Database className="w-4.5 h-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Auditoría & Trazabilidad:</strong> Se registraron automáticamente movimientos de tipo **INITIAL_STOCK** para cada producto con existencias, y sus bitácoras quedaron inalterablemente firmadas en el módulo de Auditoría del sistema.
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentStep("LIST");
                  setActiveImport(null);
                  fetchHistory();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded transition"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
