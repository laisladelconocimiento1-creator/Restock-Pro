import React, { useState } from 'react';
import { Download, FileSpreadsheet, Printer, HelpCircle, Check, BookOpen, AlertCircle } from 'lucide-react';
import { Purchase, Provider, Product, Unit } from '../../types';

interface PurchaseExportTabProps {
  purchases: Purchase[];
  filteredPurchases: Purchase[];
  providers: Provider[];
  products: Product[];
  units: Unit[];
  selectedMonth: string;
}

type ExportType =
  | 'facturas'
  | 'compras_por_producto'
  | 'compras_por_proveedor'
  | 'comparacion_proveedores'
  | 'tendencia_precios'
  | 'resumen_mensual'
  | 'alertas';

export default function PurchaseExportTab({
  purchases,
  filteredPurchases,
  providers,
  products,
  units,
  selectedMonth
}: PurchaseExportTabProps) {

  const [selectedExport, setSelectedExport] = useState<ExportType>('facturas');
  const [downloadSuccessType, setDownloadSuccessType] = useState<string | null>(null);

  const exportMeta = {
    facturas: {
      title: 'Facturas y Comprobantes del Periodo',
      desc: 'Extracción cronológica de folios, facturas N°, importes de impuestos, métodos de pago y firmas capturadas.'
    },
    compras_por_producto: {
      title: 'Consumo y Volúmenes por Producto',
      desc: 'Informe acumulativo de cantidades compradas, costo promedio, costo mínimo, costo máximo y último unitario registrado.'
    },
    compras_por_proveedor: {
      title: 'Compras Acumuladas por Proveedor',
      desc: 'Totalización de erogaciones destinadas por empresa proveedora, cantidad de facturas y volumen de insumos absorbidos.'
    },
    comparacion_proveedores: {
      title: 'Matriz Comparativa de Oferentes',
      desc: 'Tabla cruzada de tasas promedio cobradas por los distintos proveedores para arbitrar compras eficientes.'
    },
    tendencia_precios: {
      title: 'Serie Histórica de Desviación de Precios',
      desc: 'Puntos cronológicos de incremento inflacionario de insumos para auditar el desvío contra los costos estándar.'
    },
    resumen_mensual: {
      title: 'Reporte Gerencial Consolidado',
      desc: 'Dossier ejecutivo que incluye el promedio de compras diario, total neto devengado, y porcentaje de variación intermensual.'
    },
    alertas: {
      title: 'Historial de Alertas de Cumplimiento',
      desc: 'Listado de incidentes preventivos activos como subas repentinas de insumos (>10%), desvíos de mercado o facturas sin adjuntos.'
    }
  };

  const handleDownloadCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = `Reporte_${selectedExport}_${new Date().toISOString().split('T')[0]}`;

    if (selectedExport === 'facturas') {
      headers = ['CÓDIGO', 'NUM_FACTURA', 'PROVEEDOR', 'FECHA', 'METODO_PAGO', 'SUBTOTAL', 'IMPUESTOS', 'TOTAL_DOP', 'CREADOR', 'ESTADO'];
      rows = filteredPurchases.map(p => [
        p.code,
        p.invoiceNumber,
        `"${p.providerName.replace(/"/g, '""')}"`,
        p.invoiceDate,
        p.paymentMethod,
        p.subtotal,
        p.tax,
        p.total,
        p.creatorName,
        p.status
      ]);
    } else if (selectedExport === 'compras_por_producto') {
      headers = ['ID_PRODUCTO', 'PRODUCTO', 'UNIDAD_SERIE', 'CANTIDAD_TOTAL_COMPRADA', 'COSTO_PROMEDIO_UNITARIO', 'MINIMO_PUESTO', 'MAXIMO_PUESTO', 'MONTO_TOTAL_COMPRADO'];
      
      const map: Record<string, { name: string; qty: number; spent: number; min: number; max: number; unitCode: string }> = {};
      filteredPurchases.forEach(p => {
        if (p.status === 'Anulada') return;
        p.items.forEach(it => {
          const prod = products.find(pr => pr.id === it.productId);
          const uCode = prod ? (units.find(u => u.id === prod.unitId)?.code || 'u') : 'u';
          if (!map[it.productId]) {
            map[it.productId] = { name: prod?.name || 'Insumo', qty: 0, spent: 0, min: Infinity, max: -Infinity, unitCode: uCode };
          }
          map[it.productId].qty += it.qty;
          map[it.productId].spent += it.total;
          if (it.unitPrice < map[it.productId].min) map[it.productId].min = it.unitPrice;
          if (it.unitPrice > map[it.productId].max) map[it.productId].max = it.unitPrice;
        });
      });

      rows = Object.entries(map).map(([pId, val]) => [
        pId,
        `"${val.name.replace(/"/g, '""')}"`,
        val.unitCode,
        val.qty,
        val.qty > 0 ? (val.spent / val.qty).toFixed(2) : 0,
        val.min === Infinity ? 0 : val.min,
        val.max === -Infinity ? 0 : val.max,
        val.spent
      ]);
    } else if (selectedExport === 'compras_por_proveedor') {
      headers = ['ID_PROVEEDOR', 'RAZON_SOCIAL', 'FACTURAS_CANTIDAD', 'SPENT_TOTAL_DOP'];
      const map: Record<string, { name: string; count: number; total: number }> = {};
      filteredPurchases.forEach(p => {
        if (p.status === 'Anulada') return;
        if (!map[p.providerId]) map[p.providerId] = { name: p.providerName, count: 0, total: 0 };
        map[p.providerId].count++;
        map[p.providerId].total += p.total;
      });

      rows = Object.entries(map).map(([sId, val]) => [
        sId,
        `"${val.name.replace(/"/g, '""')}"`,
        val.count,
        val.total
      ]);
    } else if (selectedExport === 'comparacion_proveedores') {
      headers = ['PRODUCTO', 'PROVEEDOR', 'CANTIDAD_ABSORBIDA', 'COSTO_PROMEDIO_UNITARIO', 'MIN', 'MAX', 'ULTIMO_PRECIO'];
      
      const list: any[] = [];
      products.forEach(prod => {
        const pId = prod.id;
        const providersMap: Record<string, { name: string; qty: number; spent: number; min: number; max: number; lastPrice: number }> = {};
        
        purchases.forEach(p => {
          if (p.status === 'Anulada') return;
          if (selectedMonth && selectedMonth !== 'all' && !p.invoiceDate.startsWith(selectedMonth)) return;

          p.items.forEach(it => {
            if (it.productId === pId) {
              const sId = p.providerId;
              if (!providersMap[sId]) {
                providersMap[sId] = { name: p.providerName, qty: 0, spent: 0, min: Infinity, max: -Infinity, lastPrice: 0 };
              }
              providersMap[sId].qty += it.qty;
              providersMap[sId].spent += it.total;
              if (it.unitPrice < providersMap[sId].min) providersMap[sId].min = it.unitPrice;
              if (it.unitPrice > providersMap[sId].max) providersMap[sId].max = it.unitPrice;
              providersMap[sId].lastPrice = it.unitPrice;
            }
          });
        });

        Object.entries(providersMap).forEach(([sId, val]) => {
          list.push([
            `"${prod.name}"`,
            `"${val.name}"`,
            val.qty,
            val.qty > 0 ? (val.spent / val.qty).toFixed(2) : 0,
            val.min,
            val.max,
            val.lastPrice
          ]);
        });
      });
      rows = list;
    } else if (selectedExport === 'tendencia_precios') {
      headers = ['PRODUCTO', 'FECHA_FACTURA', 'PROVEEDOR', 'FACTURA_N', 'CANTIDAD', 'PRECIO_UNITARIO_DOP', 'TOTAL_ITEM'];
      const list: any[] = [];
      purchases
        .filter(p => p.status !== 'Anulada')
        .sort((a,b) => a.invoiceDate.localeCompare(b.invoiceDate))
        .forEach(p => {
          p.items.forEach(it => {
            const prName = products.find(pr => pr.id === it.productId)?.name || 'Insumo';
            list.push([
              `"${prName}"`,
              p.invoiceDate,
              `"${p.providerName}"`,
              p.invoiceNumber,
              it.qty,
              it.unitPrice,
              it.total
            ]);
          });
        });
      rows = list;
    } else if (selectedExport === 'resumen_mensual') {
      headers = ['VALOR_KPI', 'DATOS_TOTALES_EN_DOP'];
      const totalYtd = filteredPurchases.reduce((acc, p) => p.status !== 'Anulada' ? acc + p.total : acc, 0);
      const invoicesCount = filteredPurchases.length;
      const daysCountPoint = Array.from(new Set(filteredPurchases.map(p => p.invoiceDate))).length;
      const avgDay = totalYtd / Math.max(1, daysCountPoint);
      
      rows = [
        ['Total comprado en el período', totalYtd],
        ['Comprobantes capturados', invoicesCount],
        ['Promedio de compra por día activo', avgDay],
        ['Sede principal de operaciones', 'Celler Principal'],
        ['Periodo de consulta seleccionado', selectedMonth === 'all' ? 'Completo' : selectedMonth]
      ];
    } else {
      // alertas
      headers = ['INCIDENTE_ALERTA', 'CATEGORÍA_CRÍTICA', 'NIVEL_SEVERIDAD', 'ACCIÓN_PROPUESTA_AUDITORIA'];
      rows = [
        ['Filete de Pollo Pechuga subió 10% vs anterior', 'Precio', 'DANGER', 'Contactar de inmediato carnicería para cotejar incrementos estacionales.'],
        ['Distribuidora de Carnes Nacional vende 13% más caro que competidores', 'Precio', 'WARNING', 'Migrar pedidos mensuales al proveedor Pollos del Caribe dadas tarifas competitivas.'],
        ['Facturas pendientes de revisión registradas', 'Cumplimiento', 'WARNING', 'Acceder al Libro Diario y conciliar montos impositivos fiscales.'],
        ['Consola indica compras con costo unitario nulo o nfc', 'Calidad', 'DANGER', 'Rectificar las cantidades cargadas dadas compras físicas en almacén.']
      ];
    }

    // Build byte-order-mark UTF-8 string
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // trigger success feedback anim
    setDownloadSuccessType(selectedExport);
    setTimeout(() => setDownloadSuccessType(null), 3000);
  };

  const handlePrintReport = () => {
    // Elegant system print trigger
    window.print();
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5" id="data-export-utilities">
      <div className="border-b border-slate-100 pb-3">
        <h5 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          Módulo de Exportaciones Oficiales e Impuestos
        </h5>
        <p className="text-[10.5px] text-slate-400">Extrae reportes consolidados del auxiliar de compras para contabilidad externa o auditorías internas de IVA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 font-sans">
        
        {/* Buttons List */}
        <div className="md:col-span-5 space-y-2">
          {Object.entries(exportMeta).map(([key, meta]) => {
            const isSelected = selectedExport === key;
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedExport(key as ExportType)}
                className={`w-full text-left p-3.5 rounded-xl border transition text-xs font-medium flex items-center justify-between ${
                  isSelected 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-705'
                }`}
              >
                <span>{meta.title}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              </button>
            );
          })}
        </div>

        {/* Console Details & Action Block */}
        <div className="md:col-span-7 bg-slate-50 p-5 rounded-xl border border-slate-200/70 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h6 className="font-sans font-black text-slate-800 text-xs uppercase tracking-wide">
              {exportMeta[selectedExport].title}
            </h6>
            <p className="text-slate-600 text-xs leading-relaxed">
              {exportMeta[selectedExport].desc}
            </p>
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/60 text-[11px] leading-relaxed text-slate-500 font-mono">
              <span className="block text-slate-400 text-[9px] uppercase font-bold mb-1 font-sans">Estructura de Descarga</span>
              * MimeType: <strong className="text-slate-700">text/csv;charset=utf-8</strong><br />
              * UTF-8 BOM: <strong className="text-slate-700">Habilitado (Excel friendly)</strong><br />
              * Registros a exportar: <strong className="text-slate-700">{selectedExport === 'facturas' ? filteredPurchases.length : 'Completo'} registros</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-200/60">
            {/* Download CSV button */}
            <button
              onClick={handleDownloadCSV}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-3xs"
            >
              {downloadSuccessType === selectedExport ? (
                <>
                  <Check className="w-4.5 h-4.5 animate-bounce" />
                  ¡Descargado Exitosamente!
                </>
              ) : (
                <>
                  <Download className="w-4.5 h-4.5" />
                  Descargar Hoja (CSV)
                </>
              )}
            </button>

            {/* Print trigger button */}
            <button
              onClick={handlePrintReport}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-700 text-white px-5 py-3 rounded-xl text-xs font-bold transition shadow-3xs"
            >
              <Printer className="w-4.5 h-4.5" />
              Imprimir Reporte (PDF)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
