import React, { useState, useEffect } from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Download,
  Percent,
  Coins,
  Package,
  FileSpreadsheet,
  BarChart,
  ShoppingBag,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  User,
  Activity,
  Heart,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { Product, Purchase, KitchenRequest, InventoryMovement, PhysicalSession, Category, Unit, KitchenDailyClose, SaleRecord, SalesChannel } from '../types';
import { store } from '../data/store';
import * as XLSX from 'xlsx';

interface ReportsProps {
  products: Product[];
  purchases: Purchase[];
  requests: KitchenRequest[];
  movements: InventoryMovement[];
  physicalSessions: PhysicalSession[];
  categories: Category[];
  units: Unit[];
}

export default function ReportsView({
  products,
  purchases,
  requests,
  movements,
  physicalSessions,
  categories,
  units
}: ReportsProps) {
  // Asynchronous full-stack datasets
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
  const [dailyCloses, setDailyCloses] = useState<KitchenDailyClose[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assistant' | 'reports'>('dashboard');
  const [selectedFamily, setSelectedFamily] = useState<string>('compras');
  const [selectedReportId, setSelectedReportId] = useState<string>('c-periodo');
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterSede, setFilterSede] = useState('all');
  const [filterArea, setFilterArea] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTurno, setFilterTurno] = useState('all');
  const [filterCanal, setFilterCanal] = useState('all');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const r1 = await fetch('/api/v1/sales/records');
        const d1 = await r1.json();
        if (d1.success) setSalesRecords(d1.sales || []);

        const r2 = await fetch('/api/v1/menu/items');
        const d2 = await r2.json();
        if (d2.success) setMenuItems(d2.items || []);

        const r3 = await fetch('/api/v1/menu/combos');
        const d3 = await r3.json();
        if (d3.success) setCombos(d3.combos || []);
      } catch (err) {
        console.error("Error loading async report data:", err);
      }
      setDailyCloses(store.getDailyCloses() || []);
    };
    loadData();
  }, []);

  // Set default filters to current month (June 2026)
  useEffect(() => {
    setFilterStartDate('2026-06-01');
    setFilterEndDate('2026-06-30');
    setFilterMonth('2026-06');
  }, []);

  const resetFilters = () => {
    setFilterStartDate('2026-06-01');
    setFilterEndDate('2026-06-30');
    setFilterMonth('2026-06');
    setFilterSede('all');
    setFilterArea('all');
    setFilterCategory('all');
    setFilterProduct('all');
    setFilterProvider('all');
    setFilterUser('all');
    setFilterStatus('all');
    setFilterTurno('all');
    setFilterCanal('all');
  };

  const getUnitCode = (unitId: string) => units.find(u => u.id === unitId)?.code || 'und';
  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name || 'Otros';

  // --- FILTERING LOGIC ---
  const checkDateRange = (itemDateStr: string) => {
    if (!itemDateStr) return false;
    const date = itemDateStr.substring(0, 10);
    if (filterStartDate && date < filterStartDate) return false;
    if (filterEndDate && date > filterEndDate) return false;
    if (filterMonth !== 'all' && !date.startsWith(filterMonth)) return false;
    return true;
  };

  const checkGeneralFilters = (productId: string, providerId?: string, area?: string, userId?: string, status?: string) => {
    if (filterProduct !== 'all' && productId !== filterProduct) return false;
    if (filterCategory !== 'all') {
      const prod = products.find(p => p.id === productId);
      if (!prod || prod.categoryId !== filterCategory) return false;
    }
    if (filterProvider !== 'all' && providerId && providerId !== filterProvider) return false;
    if (filterArea !== 'all' && area && area.toLowerCase() !== filterArea.toLowerCase()) return false;
    if (filterUser !== 'all' && userId && userId !== filterUser) return false;
    if (filterStatus !== 'all' && status && status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    return true;
  };

  // Filtered lists
  const filteredPurchases = purchases.filter(p => {
    if (!checkDateRange(p.date || p.invoiceDate)) return false;
    if (filterProvider !== 'all' && p.providerName !== filterProvider && p.providerId !== filterProvider) return false;
    if (filterUser !== 'all' && p.creatorId !== filterUser) return false;
    if (filterStatus !== 'all' && p.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    // Check items
    const hasMatchingProduct = p.items.some(item => checkGeneralFilters(item.productId));
    return hasMatchingProduct;
  });

  const filteredMovements = movements.filter(m => {
    if (!checkDateRange(m.date)) return false;
    if (filterArea !== 'all' && m.area.toLowerCase() !== filterArea.toLowerCase()) return false;
    if (filterUser !== 'all' && m.userId !== filterUser) return false;
    if (!checkGeneralFilters(m.productId, undefined, m.area)) return false;
    return true;
  });

  const filteredRequests = requests.filter(r => {
    if (!checkDateRange(r.date)) return false;
    if (filterArea !== 'all' && r.requestingArea && r.requestingArea.toLowerCase() !== filterArea.toLowerCase()) return false;
    if (filterUser !== 'all' && r.creatorId !== filterUser) return false;
    if (filterStatus !== 'all' && r.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    const hasMatchingProduct = r.items.some(item => checkGeneralFilters(item.productId));
    return hasMatchingProduct;
  });

  const filteredCloses = dailyCloses.filter(c => {
    if (!checkDateRange(c.date)) return false;
    if (filterUser !== 'all' && c.closedByUserId !== filterUser) return false;
    return true;
  });

  const filteredPortions = (store.getPortionBatches() || []).filter(b => {
    if (!checkDateRange(b.createdAt)) return false;
    if (filterUser !== 'all' && b.responsibleUserId !== filterUser) return false;
    if (filterStatus !== 'all' && b.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (!checkGeneralFilters(b.productId)) return false;
    return true;
  });

  const filteredSales = salesRecords.filter(s => {
    const sDate = s.date || s.createdAt;
    if (!checkDateRange(sDate)) return false;
    if (filterCanal !== 'all' && s.channel !== filterCanal) return false;
    if (filterStatus !== 'all' && s.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    // Recipe components or menus
    if (s.saleItemType === 'MENU_ITEM' && filterProduct !== 'all') {
      const menu = menuItems.find(m => m.id === s.saleItemId);
      // If we are looking for a specific ingredient inside dishes
      return false; 
    }
    return true;
  });

  const filteredProducts = products.filter(p => {
    if (filterProduct !== 'all' && p.id !== filterProduct) return false;
    if (filterCategory !== 'all' && p.categoryId !== filterCategory) return false;
    if (filterArea !== 'all' && (!p.areaStocks || !(p.areaStocks[filterArea as any] > 0))) return false;
    return true;
  });

  // Dynamic filter lists
  const uniqueProviders = Array.from(new Set(purchases.map(p => p.providerName).filter(Boolean)));
  const uniqueUsers = Array.from(new Set([
    ...purchases.map(p => ({ id: p.creatorId, name: p.creatorName })),
    ...movements.map(m => ({ id: m.userId, name: m.userName })),
    ...requests.map(r => ({ id: r.creatorId, name: r.creatorName }))
  ].reduce((acc, current) => {
    if (!acc.some(x => x.id === current.id)) acc.push(current);
    return acc;
  }, [] as { id: string, name: string }[])));

  // --- REPORT GENERATOR STRUCTURE ---
  const FAMILIES = [
    { id: 'compras', name: '1. Compras y Libro' },
    { id: 'inventario', name: '2. Inventario y Kárdex' },
    { id: 'requisiciones', name: '3. Requisiciones Cocina' },
    { id: 'porcionamiento', name: '4. Porcionamiento y Prod.' },
    { id: 'menu', name: '5. Menú e Ingredientes' },
    { id: 'ventas', name: '6. Ventas y Consumo Teórico' },
    { id: 'cierre', name: '7. Cierre y Conciliación' },
    { id: 'mermas', name: '8. Mermas y Pérdidas' },
    { id: 'auditoria', name: '9. Auditoría de Procesos' }
  ];

  const REPORTS_BY_FAMILY: Record<string, { id: string; name: string; description: string; handler: () => { headers: string[]; rows: any[][]; kpis: { label: string; value: string }[] } }[]> = {
    compras: [
      {
        id: 'c-periodo',
        name: 'Compras por Período / Histórico general',
        description: 'Libro impositivo consolidado de órdenes de compra recibidas o en revisión.',
        handler: () => {
          const rows = filteredPurchases.map(p => [
            p.code, p.invoiceNumber, p.invoiceDate, p.providerName, p.paymentMethod,
            `RD$${p.subtotal.toLocaleString('es-DO')}`, `RD$${p.tax.toLocaleString('es-DO')}`, `RD$${p.total.toLocaleString('es-DO')}`, p.status
          ]);
          const totalPaid = filteredPurchases.reduce((a, b) => a + b.total, 0);
          const pendingPaid = filteredPurchases.filter(p => p.status === 'Pendiente').reduce((a, b) => a + b.total, 0);
          return {
            headers: ['Código', 'Factura N°', 'Fecha Fact.', 'Proveedor', 'Método Pago', 'Subtotal', 'Impuesto', 'Total', 'Estado'],
            rows,
            kpis: [
              { label: 'Gasto Consolidado', value: `RD$${totalPaid.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` },
              { label: 'Facturas Registradas', value: filteredPurchases.length.toString() },
              { label: 'Monto Pendiente', value: `RD$${pendingPaid.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }
            ]
          };
        }
      },
      {
        id: 'c-producto',
        name: 'Compras por Insumo o Insumo Crítico',
        description: 'Análisis detallado de materias primas compradas con volumen acumulado y costo promedio.',
        handler: () => {
          const dict: Record<string, { name: string; qty: number; total: number; count: number; unit: string }> = {};
          filteredPurchases.forEach(p => {
            p.items.forEach(item => {
              const prod = products.find(prod => prod.id === item.productId);
              if (!prod) return;
              if (!dict[item.productId]) {
                dict[item.productId] = { name: prod.name, qty: 0, total: 0, count: 0, unit: getUnitCode(prod.unitId) };
              }
              dict[item.productId].qty += item.qty;
              dict[item.productId].total += item.total || (item.qty * item.unitPrice);
              dict[item.productId].count += 1;
            });
          });
          const rows = Object.entries(dict).map(([pId, v]) => [
            pId, v.name, `${v.qty.toLocaleString('es-DO')} ${v.unit}`, v.count,
            `RD$${(v.total / (v.qty || 1)).toLocaleString('es-DO', { maximumFractionDigits: 2 })}`,
            `RD$${v.total.toLocaleString('es-DO')}`
          ]);
          const highestProduct = Object.values(dict).reduce((max, cur) => cur.total > max.total ? cur : max, { name: 'Ninguno', total: 0 });
          return {
            headers: ['ID Producto', 'Producto', 'Cantidad Comprada', 'Frecuencia', 'Costo Promedio', 'Inversión Total'],
            rows,
            kpis: [
              { label: 'Insumo de Mayor Gasto', value: highestProduct.name },
              { label: 'Mayor Monto Insumo', value: `RD$${highestProduct.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }
            ]
          };
        }
      },
      {
        id: 'c-proveedor',
        name: 'Compras por Proveedor / Gasto Acumulado',
        description: 'Distribución económica de facturación liquidada y deudas acumuladas por proveedor.',
        handler: () => {
          const dict: Record<string, { total: number; count: number; pending: number }> = {};
          filteredPurchases.forEach(p => {
            if (!dict[p.providerName]) dict[p.providerName] = { total: 0, count: 0, pending: 0 };
            dict[p.providerName].total += p.total;
            dict[p.providerName].count += 1;
            if (p.status === 'Pendiente' || p.status === 'Observada') {
              dict[p.providerName].pending += p.total;
            }
          });
          const rows = Object.entries(dict).map(([name, v]) => [
            name, v.count, `RD$${v.pending.toLocaleString('es-DO')}`, `RD$${v.total.toLocaleString('es-DO')}`
          ]);
          const topSupplier = Object.entries(dict).reduce((max, cur) => cur[1].total > max.total ? { name: cur[0], total: cur[1].total } : max, { name: 'Ninguno', total: 0 });
          return {
            headers: ['Proveedor', 'Órdenes', 'Monto Pendiente/Observado', 'Total Comprado'],
            rows,
            kpis: [
              { label: 'Proveedor Favorito', value: topSupplier.name },
              { label: 'Monto Proveedor Top', value: `RD$${topSupplier.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }
            ]
          };
        }
      },
      {
        id: 'c-comparativo',
        name: 'Comparativo de Proveedores por Producto',
        description: 'Historial de precios de compra para detectar cuál proveedor vende más costoso el mismo recurso.',
        handler: () => {
          const rows: any[][] = [];
          const prodDict: Record<string, { prodName: string; purchases: { provider: string; price: number; date: string }[] }> = {};
          
          purchases.forEach(p => {
            p.items.forEach(item => {
              const prod = products.find(pr => pr.id === item.productId);
              if (!prod) return;
              if (!prodDict[item.productId]) prodDict[item.productId] = { prodName: prod.name, purchases: [] };
              prodDict[item.productId].purchases.push({ provider: p.providerName, price: item.unitPrice, date: p.invoiceDate || p.date });
            });
          });

          Object.entries(prodDict).forEach(([pId, data]) => {
            const suppliers = Array.from(new Set(data.purchases.map(x => x.provider)));
            if (suppliers.length > 1) {
              suppliers.forEach(supp => {
                const suppPurchases = data.purchases.filter(x => x.provider === supp);
                const avgPrice = suppPurchases.reduce((a, b) => a + b.price, 0) / suppPurchases.length;
                const minPrice = Math.min(...suppPurchases.map(x => x.price));
                const maxPrice = Math.max(...suppPurchases.map(x => x.price));
                rows.push([pId, data.prodName, supp, `RD$${avgPrice.toFixed(2)}`, `RD$${minPrice.toFixed(2)}`, `RD$${maxPrice.toFixed(2)}`, suppPurchases.length]);
              });
            }
          });

          return {
            headers: ['ID Insumo', 'Producto', 'Proveedor', 'Precio Promedio', 'Precio Mínimo', 'Precio Máximo', 'Muestras Checked'],
            rows: rows.length ? rows : [['—', 'Sin datos comparativos de múltiples proveedores', '—', '—', '—', '—', '—']],
            kpis: [
              { label: 'Insumos Comparados', value: Object.values(prodDict).filter(x => new Set(x.purchases.map(p => p.provider)).size > 1).length.toString() }
            ]
          };
        }
      },
      {
        id: 'c-tendencia',
        name: 'Tendencia de Precios e Inflación de Almacén',
        description: 'Muestra los productos que han sufrido el mayor incremento de precios entre el primer y último registro.',
        handler: () => {
          const rows: any[][] = [];
          filteredProducts.forEach(prod => {
            const itemPurchases = purchases
              .filter(p => p.status === 'Recibida')
              .flatMap(p => p.items.filter(item => item.productId === prod.id).map(item => ({ date: p.date, price: item.unitPrice })))
              .sort((a,b) => a.date.localeCompare(b.date));

            if (itemPurchases.length >= 2) {
              const firstPrice = itemPurchases[0].price;
              const lastPrice = itemPurchases[itemPurchases.length - 1].price;
              const pctDiff = ((lastPrice - firstPrice) / (firstPrice || 1)) * 100;
              rows.push([
                prod.id, prod.name, `RD$${firstPrice.toFixed(2)}`, `RD$${lastPrice.toFixed(2)}`, `${pctDiff.toFixed(1)}%`,
                pctDiff > 0 ? '📈 Aumento' : pctDiff < 0 ? '📉 Descenso' : '🛑 Estable'
              ]);
            }
          });
          return {
            headers: ['ID Insumo', 'Insumo', 'Primer Precio', 'Último Precio', 'Variación %', 'Alerta Inflación'],
            rows: rows.length ? rows : [['—', 'Se requieren al menos 2 facturas por artículo para analizar tendencias', '—', '—', '—', '—']],
            kpis: [
              { label: 'Insumos Monitoreados', value: rows.length.toString() }
            ]
          };
        }
      }
    ],
    inventario: [
      {
        id: 'i-existencias',
        name: 'Existencias actuales y Valoración del Activo',
        description: 'Inventario físico valorado actual. Análisis de costos unitarios y existencias cruzadas.',
        handler: () => {
          const rows = filteredProducts.map(p => {
            const valuation = p.currentStock * p.averageCost;
            return [
              p.id, p.name, getCategoryName(p.categoryId), `${p.currentStock.toLocaleString('es-DO')} ${getUnitCode(p.unitId)}`,
              `RD$${p.averageCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
              `RD$${valuation.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
              p.initialReceptionArea || 'Almacén seco'
            ];
          });
          const totalVal = filteredProducts.reduce((sum, p) => sum + (p.currentStock * p.averageCost), 0);
          const criticalStockCount = filteredProducts.filter(p => p.currentStock < p.minStock).length;
          return {
            headers: ['ID Producto', 'Descripción', 'Categoría', 'Stock Físico', 'Costo Unit. Promedio', 'Valuación Total (DOP)', 'Ubicación Primaria'],
            rows,
            kpis: [
              { label: 'Valor del Activo', value: `RD$${totalVal.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` },
              { label: 'Artículos Listados', value: filteredProducts.length.toString() },
              { label: 'Bajo Stock Mínimo', value: criticalStockCount.toString() }
            ]
          };
        }
      },
      {
        id: 'i-criticos',
        name: 'Productos Bajo Mínimo / Quiebres de Stock',
        description: 'Exclusivo para insumos críticos en peligro de desabasto total.',
        handler: () => {
          const critical = filteredProducts.filter(p => p.currentStock < p.minStock);
          const rows = critical.map(p => [
            p.id, p.name, `${p.currentStock} ${getUnitCode(p.unitId)}`, `${p.minStock} ${getUnitCode(p.unitId)}`,
            `${(p.minStock - p.currentStock).toFixed(1)} ${getUnitCode(p.unitId)}`, p.initialReceptionArea || 'Almacén seco'
          ]);
          return {
            headers: ['ID Insumo', 'Descripción', 'Existencia Actual', 'Mínimo Mandatario', 'Cantidad Faltante', 'Ubicación Primaria'],
            rows: rows.length ? rows : [['—', 'Todos los productos se encuentran sobre el mínimo de abastecimiento', '—', '—', '—', '—']],
            kpis: [
              { label: 'Quiebres Detectados', value: critical.length.toString() },
              { label: 'Faltantes en Cero', value: critical.filter(p => p.currentStock <= 0).length.toString() }
            ]
          };
        }
      },
      {
        id: 'i-movimientos',
        name: 'Kárdex / Historial de Movimientos de Almacén',
        description: 'Auditoría cronológica de ingresos, egresos, transferencias, mermas y ajustes de inventario.',
        handler: () => {
          const sorted = [...filteredMovements].sort((a,b) => b.date.localeCompare(a.date));
          const rows = sorted.map(m => [
            m.date.substring(0, 16).replace('T', ' '), m.productName, m.type,
            `${m.qty > 0 ? '+' : ''}${m.qty} ${m.unitCode}`, `${m.quantityBefore} ➔ ${m.quantityAfter}`,
            m.area, m.userName, m.reason, m.comment || ''
          ]);
          return {
            headers: ['Fecha y Hora', 'Insumo', 'Tipo de Operación', 'Variación', 'Inventario (Antes ➔ Después)', 'Área afectada', 'Operador', 'Justificación', 'Detalle Extra'],
            rows,
            kpis: [
              { label: 'Movimientos Filtrados', value: filteredMovements.length.toString() },
              { label: 'Modificación Neta', value: filteredMovements.reduce((sum, m) => sum + m.qty, 0).toString() }
            ]
          };
        }
      }
    ],
    requisiciones: [
      {
        id: 'r-general',
        name: 'Requisiciones y Consumos de Insumos',
        description: 'Trazabilidad de solicitudes enviadas por cocina para surtir barra o línea de preparación.',
        handler: () => {
          const rows = filteredRequests.map(r => [
            r.code, r.date, r.creatorName, r.items.length, r.requestingArea || 'Cocina', r.status, r.approvedByName || '—'
          ]);
          return {
            headers: ['Requisición Code', 'Fecha de Envío', 'Chef / Solicitante', 'Insumos Variados', 'Área Destinataria', 'Estatus', 'Aprobador Oficial'],
            rows,
            kpis: [
              { label: 'Solicitadas', value: filteredRequests.length.toString() },
              { label: 'Entregadas con Éxito', value: filteredRequests.filter(r => r.status === 'Entregada').length.toString() },
              { label: 'Rechazadas con Motivo', value: filteredRequests.filter(r => r.status === 'Rechazada').length.toString() }
            ]
          };
        }
      }
    ],
    porcionamiento: [
      {
        id: 'p-rendimiento',
        name: 'Porcionamiento, Rendimiento y Mermas de Producción',
        description: 'Comparativa de merma y rendimiento de porcionamientos de carnes, pescados y aves.',
        handler: () => {
          const rows = filteredPortions.map(b => {
            const prod = products.find(p => p.id === b.productId);
            const name = prod ? prod.name : 'Insumo desconocido';
            const portionDiff = b.realPortions - b.theoreticalPortions;
            return [
              b.id, name, `${b.quantityPurchased} ${b.purchaseUnit}`, `${b.baseQuantity.toFixed(1)} ${b.baseUnit}`,
              b.theoreticalPortions, b.realPortions, `${portionDiff > 0 ? '+' : ''}${portionDiff.toFixed(1)}`,
              `${b.expectedYieldPercentage}%`, `${b.realYieldPercentage.toFixed(1)}%`,
              `RD$${b.estimatedCostPerPortion.toFixed(2)}`, `RD$${b.realCostPerPortion.toFixed(2)}`, b.status
            ];
          });
          const avgRealYield = filteredPortions.filter(b => b.realYieldPercentage > 0).reduce((acc, b) => acc + b.realYieldPercentage, 0) / (filteredPortions.filter(b => b.realYieldPercentage > 0).length || 1);
          return {
            headers: ['Código Lote', 'Materia Prima', 'Cant. Compra', 'Cant. Neta', 'Teóricas', 'Reales', 'Diff Porciones', 'Rend. Esperado', 'Rend. Real', 'Costo Teo/Port', 'Costo Real/Port', 'Estatus'],
            rows,
            kpis: [
              { label: 'Rendimiento Promedio', value: `${avgRealYield.toFixed(1)}%` },
              { label: 'Lotes Procesados', value: filteredPortions.length.toString() }
            ]
          };
        }
      }
    ],
    menu: [
      {
        id: 'm-fichas',
        name: 'Fichas Técnicas, Costos Teóricos y Márgenes',
        description: 'Análisis de rentabilidad teórica de la carta del restaurante sobre el costo actual de insumos.',
        handler: () => {
          const rows = menuItems.map(item => {
            const theoreticalCost = item.theoreticalCost || 0;
            const margin = item.salePrice - theoreticalCost;
            const foodCostPercent = item.salePrice > 0 ? (theoreticalCost / item.salePrice) * 100 : 0;
            return [
              item.code, item.name, item.categoryName || 'General',
              `RD$${item.salePrice.toLocaleString('es-DO')}`, `RD$${theoreticalCost.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`,
              `RD$${margin.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, `${foodCostPercent.toFixed(1)}%`,
              item.deductsInventory ? 'Sí' : 'No', item.isActive ? 'Activo' : 'Inactivo'
            ];
          });
          const itemsWithIngredients = menuItems.filter(item => (item.theoreticalCost || 0) > 0);
          const avgFoodCost = itemsWithIngredients.reduce((sum, item) => sum + ((item.theoreticalCost / item.salePrice) * 100), 0) / (itemsWithIngredients.length || 1);
          return {
            headers: ['Código Plato', 'Nombre de la Ficha/Plato', 'Categoría Menú', 'Precio de Venta', 'Costo Teórico', 'Margen Estimado', 'Food Cost %', 'Deducción', 'Estado'],
            rows,
            kpis: [
              { label: 'Food Cost Avg', value: `${avgFoodCost.toFixed(1)}%` },
              { label: 'Platos Activos', value: menuItems.filter(p => p.isActive).length.toString() },
              { label: 'Sin Receta/Costo', value: menuItems.filter(p => !p.theoreticalCost).length.toString() }
            ]
          };
        }
      }
    ],
    ventas: [
      {
        id: 'v-consumo',
        name: 'Ventas y Consumos de Ingredientes Teóricos',
        description: 'Cruce del volumen importado de comandas vendidas contra deducción de inventario en cocina.',
        handler: () => {
          const rows = filteredSales.map(s => [
            s.id, s.date ? s.date.substring(0,10) : '—', s.saleItemName, s.saleItemType, s.qtySold,
            `RD$${s.unitPrice.toLocaleString('es-DO')}`, `RD$${s.totalAmount.toLocaleString('es-DO')}`,
            `RD$${s.theoreticalCost.toLocaleString('es-DO')}`, `${s.channel}`, s.status
          ]);
          const totalSalesVal = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
          const totalCostVal = filteredSales.reduce((sum, s) => sum + s.theoreticalCost, 0);
          return {
            headers: ['ID Registro', 'Fecha', 'Plato/Combo Vendido', 'Tipo Item', 'Unidades', 'Precio Unit.', 'Total Venta', 'Costo Teo.', 'Canal', 'Estatus'],
            rows,
            kpis: [
              { label: 'Recaudación Venta', value: `RD$${totalSalesVal.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` },
              { label: 'Costo Insumo Teórico', value: `RD$${totalCostVal.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` },
              { label: 'Margen Bruto Real', value: `${totalSalesVal > 0 ? ((1 - (totalCostVal / totalSalesVal)) * 100).toFixed(1) : '0'}%` }
            ]
          };
        }
      }
    ],
    cierre: [
      {
        id: 'z-cierres',
        name: 'Cierres de Cocina y Conciliación Física',
        description: 'Trazabilidad de auditoría de arqueo de porciones al concluir el turno operativo.',
        handler: () => {
          const rows: any[][] = [];
          filteredCloses.forEach(c => {
            c.items.forEach(item => {
              const diff = item.physicalCountingPortions - item.expectedClosingPortions;
              rows.push([
                c.date, c.closedByUserName, item.productName, item.initialPortions,
                item.producedPortions, item.soldPortions, item.wastedPortions,
                item.expectedClosingPortions, item.physicalCountingPortions,
                `${diff > 0 ? '+' : ''}${diff}`, `RD$${(item.differenceValue || 0).toLocaleString('es-DO')}`,
                item.reason || 'Sin justificación'
              ]);
            });
          });
          const totalLosses = filteredCloses.reduce((acc, c) => acc + c.items.reduce((sum, i) => sum + (i.differenceValue < 0 ? i.differenceValue : 0), 0), 0);
          const totalSessions = filteredCloses.length;
          return {
            headers: ['Fecha Cierre', 'Operador Responsable', 'Porción Artículo', 'Inicial', 'Producidas', 'Vendidas', 'Mermadas', 'Esperadas', 'Contadas', 'Desvío (U)', 'Diferencia (DOP)', 'Justificación'],
            rows: rows.length ? rows : [['—', 'Sin arqueos o sesiones cerradas en el rango', '—', '—', '—', '—', '—', '—', '—', '—', '—', '—']],
            kpis: [
              { label: 'Volumen Cierres', value: totalSessions.toString() },
              { label: 'Diferencia Monetaria', value: `RD$${totalLosses.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }
            ]
          };
        }
      }
    ],
    mermas: [
      {
        id: 'm-perjudiciales',
        name: 'Análisis de Mermas de Operación y Pérdidas',
        description: 'Detalle valorado de descartes por fecha de caducidad, madurez de verduras o daño físico.',
        handler: () => {
          const mermas = filteredMovements.filter(m => m.type === 'Merma');
          const rows = mermas.map(m => {
            const p = products.find(prod => prod.id === m.productId);
            const cost = p ? p.averageCost : 0;
            const lossVal = Math.abs(m.qty) * cost;
            return [
              m.date.substring(0,10), m.productName, getCategoryName(p?.categoryId || ''),
              `${Math.abs(m.qty)} ${m.unitCode}`, `RD$${cost.toFixed(2)}`, `RD$${lossVal.toLocaleString('es-DO')}`,
              m.area, m.userName, m.reason || 'Sobrante'
            ];
          });
          const totalLoss = mermas.reduce((acc, m) => {
            const p = products.find(prod => prod.id === m.productId);
            return acc + (Math.abs(m.qty) * (p ? p.averageCost : 0));
          }, 0);
          return {
            headers: ['Fecha', 'Descripción Insumo', 'Categoría', 'Cantidad Descartada', 'Costo Unit.', 'Pérdida Financiera', 'Área Descarte', 'Operador que registra', 'Motivo del desecho'],
            rows,
            kpis: [
              { label: 'Merma Absoluta', value: `RD$${totalLoss.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` },
              { label: 'Eventos Registrados', value: mermas.length.toString() }
            ]
          };
        }
      }
    ],
    auditoria: [
      {
        id: 'au-general',
        name: 'Logs de Auditoría y Acciones Sensibles',
        description: 'Trazabilidad absoluta sobre cambios de precios, de recetas o ajustes manuales de stock.',
        handler: () => {
          const logsList = store.getAuditLogs() || [];
          const sorted = [...logsList].sort((a,b) => b.date.localeCompare(a.date));
          const rows = sorted.map(l => [
            l.date.substring(0, 16).replace('T', ' '), l.userName, l.userRole, l.module, l.action, l.previousValue || '—', l.newValue || '—', l.comment || ''
          ]);
          return {
            headers: ['Fecha y Hora', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Antes', 'Después', 'Comentario'],
            rows,
            kpis: [
              { label: 'Logs Registrados', value: logsList.length.toString() },
              { label: 'Acciones Sensibles', value: logsList.filter(l => l.action.includes('RECHAZO') || l.action.includes('AJUSTE') || l.action.includes('MODIFICACIÓN')).length.toString() }
            ]
          };
        }
      }
    ]
  };

  const getActiveReportData = () => {
    const list = REPORTS_BY_FAMILY[selectedFamily] || [];
    const rep = list.find(r => r.id === selectedReportId) || list[0] || REPORTS_BY_FAMILY['compras'][0];
    return rep.handler();
  };

  const activeReport = (REPORTS_BY_FAMILY[selectedFamily] || []).find(r => r.id === selectedReportId) || REPORTS_BY_FAMILY['compras'][0];
  const { headers, rows, kpis } = getActiveReportData();

  // --- EXPORT SYSTEMS ---
  const handleExportCSV = () => {
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(row => row.map(v => {
      const cellStr = String(v ?? '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReportId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `${selectedReportId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>${activeReport.name}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 25px; color: #1e293b; max-width: 1200px; margin: 0 auto; }
            .header-container { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { font-size: 20px; margin: 0; color: #0f172a; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            .kpis-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
            .kpi-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .kpi-val { font-size: 16px; font-weight: bold; margin-top: 4px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
            th { background-color: #f1f5f9; text-align: left; padding: 8px 10px; border-bottom: 1.5px solid #cbd5e1; font-weight: bold; color: #334155; }
            td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #475569; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header-container">
            <div>
              <h1>${activeReport.name}</h1>
              <div class="meta">Generado: ${new Date().toLocaleString('es-DO')} | Sistema Central RestockPro</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              Período: ${filterStartDate || 'Sin límite'} al ${filterEndDate || 'Hoy'}
            </div>
          </div>
          
          <div class="kpis-grid">
            ${kpis.map(k => `
              <div class="kpi-card">
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-val">${k.value}</div>
              </div>
            `).join('')}
          </div>

          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  ${row.map(cell => `<td>${cell === null || cell === undefined ? '—' : cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };


  // --- MANAGER DECISION EXECUTIVE QUESTIONS BOARD (18 CRITERIA TO PASS AUDITS) ---
  const ACCEPTANCE_QUESTIONS = [
    {
      q: '1. ¿Cuánto compré en insumos?',
      badge: 'Compras',
      solve: () => {
        const total = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
        return {
          text: `En el intervalo analizado se registran compras totales por un monto de RD$ ${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.`,
          kpis: [{ l: 'Compras Totales', v: `RD$ ${total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }],
          headers: ['Código', 'Fecha', 'Proveedor', 'Estatus', 'Total'],
          data: filteredPurchases.map(p => [p.code, p.date, p.providerName, p.status, `RD$ ${p.total.toLocaleString('es-DO')}`])
        };
      }
    },
    {
      q: '2. ¿A quién le compré mercadería?',
      badge: 'Proveedores',
      solve: () => {
        const dict: Record<string, { total: number; qty: number }> = {};
        filteredPurchases.forEach(p => {
          if (!dict[p.providerName]) dict[p.providerName] = { total: 0, qty: 0 };
          dict[p.providerName].total += p.total;
          dict[p.providerName].qty += 1;
        });
        const rows = Object.entries(dict).map(([name, v]) => [name, `${v.qty} facturas`, `RD$ ${v.total.toLocaleString('es-DO')}`]);
        return {
          text: `Se compraron insumos a un conjunto de ${Object.keys(dict).length} proveedores registrados.`,
          kpis: [{ l: 'Proveedores Activos', v: Object.keys(dict).length.toString() }],
          headers: ['Proveedor', 'Órdenes Solicitadas', 'Total Facturado'],
          data: rows
        };
      }
    },
    {
      q: '3. ¿Qué producto me costó más dinero?',
      badge: 'Insumos',
      solve: () => {
        const dict: Record<string, { name: string; total: number; unit: string }> = {};
        filteredPurchases.forEach(p => {
          p.items.forEach(it => {
            const prod = products.find(prod => prod.id === it.productId);
            if (!prod) return;
            if (!dict[it.productId]) dict[it.productId] = { name: prod.name, total: 0, unit: getUnitCode(prod.unitId) };
            dict[it.productId].total += it.total || (it.qty * it.unitPrice);
          });
        });
        const sorted = Object.entries(dict).sort((a,b) => b[1].total - a[1].total);
        return {
          text: sorted.length ? `El insumo de mayor impacto financiero es "${sorted[0][1].name}" acumulando RD$ ${sorted[0][1].total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}.` : 'Sin compras registradas.',
          kpis: [{ l: 'Insumo de Mayor Gasto', v: sorted[0]?.[1]?.name || '—' }],
          headers: ['ID Insumo', 'Insumo', 'Monto Invertido'],
          data: sorted.map(([id, d]) => [id, d.name, `RD$ ${d.total.toLocaleString('es-DO')}`])
        };
      }
    },
    {
      q: '4. ¿Qué proveedor me vende más caro?',
      badge: 'Proveedores',
      solve: () => {
        const itemPrices: Record<string, { name: string; items: { provider: string; price: number; code: string }[] }> = {};
        purchases.forEach(p => {
          p.items.forEach(it => {
            const prod = products.find(curr => curr.id === it.productId);
            if (!prod) return;
            if (!itemPrices[it.productId]) itemPrices[it.productId] = { name: prod.name, items: [] };
            itemPrices[it.productId].items.push({ provider: p.providerName, price: it.unitPrice, code: p.code });
          });
        });

        const comparison: any[][] = [];
        Object.entries(itemPrices).forEach(([id, data]) => {
          if (data.items.length > 1) {
            const sortedPrices = [...data.items].sort((a,b) => b.price - a.price);
            const high = sortedPrices[0];
            const low = sortedPrices[sortedPrices.length - 1];
            if (high.price > low.price && high.provider !== low.provider) {
              comparison.push([
                data.name, high.provider, `RD$ ${high.price}`, low.provider, `RD$ ${low.price}`,
                `+${(((high.price - low.price)/low.price)*100).toFixed(1)}%`
              ]);
            }
          }
        });

        return {
          text: `Se analizaron precios de insumos coincidentes. A continuación se detallan las diferencias de precios que representan sobrecostos detectados.`,
          kpis: [{ l: 'Artículos Multi-Provider', v: comparison.length.toString() }],
          headers: ['Insumo Analizado', 'Proveedor Más Caro', 'Costo Alto', 'Proveedor de Alivio', 'Costo Bajo', 'Diferencia (%)'],
          data: comparison.length ? comparison : [['Todos los proveedores venden al mismo precio o no hay muestras concurrentes', '—', '—', '—', '—', '—']]
        };
      }
    },
    {
      q: '5. ¿Qué tengo hoy en inventario?',
      badge: 'Existencias',
      solve: () => {
        const total = filteredProducts.reduce((acc, p) => acc + (p.currentStock * p.averageCost), 0);
        return {
          text: `La valoración agregada en inventarios actuales es de RD$ ${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })} en un catálogo de ${filteredProducts.length} productos.`,
          kpis: [{ l: 'Valor del Activo', v: `RD$ ${total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }],
          headers: ['Descripción', 'Ubicación Primaria', 'Stock', 'Costo Promedio', 'Inversión Valorada'],
          data: filteredProducts.map(p => [p.name, p.initialReceptionArea || 'Almacén seco', `${p.currentStock} ${getUnitCode(p.unitId)}`, `RD$ ${p.averageCost.toFixed(2)}`, `RD$ ${(p.currentStock * p.averageCost).toLocaleString('es-DO')}`])
        };
      }
    },
    {
      q: '6. ¿Qué insumos están bajo mínimo?',
      badge: 'Alertas',
      solve: () => {
        const low = filteredProducts.filter(p => p.currentStock < p.minStock);
        return {
          text: `Actualmente hay ${low.length} productos que se encuentran con stock crítico por debajo del mínimo exigido.`,
          kpis: [{ l: 'Faltas Críticas', v: low.length.toString() }],
          headers: ['Insumo', 'Existencia Actual', 'Mínimo', 'Déficit'],
          data: low.map(p => [p.name, `${p.currentStock} ${getUnitCode(p.unitId)}`, `${p.minStock} ${getUnitCode(p.unitId)}`, `${p.minStock - p.currentStock} ${getUnitCode(p.unitId)}`])
        };
      }
    },
    {
      q: '7. ¿Qué pidió la cocina al almacén?',
      badge: 'Suministros',
      solve: () => {
        const list = filteredRequests;
        return {
          text: `La cocina emitió un total de ${list.length} requisiciones de reabastecimiento en el período actual.`,
          kpis: [
            { l: 'Requisiciones', v: list.length.toString() },
            { l: 'Completadas', v: list.filter(r => r.status === 'Entregada').length.toString() }
          ],
          headers: ['Código', 'Fecha', 'Solicitante', 'Destino', 'Estatus'],
          data: list.map(r => [r.code, r.date, r.creatorName, r.requestingArea || 'Cocina', r.status])
        };
      }
    },
    {
      q: '8. ¿Qué se porcionó en producción?',
      badge: 'Producción',
      solve: () => {
        const approved = filteredPortions.filter(b => b.status === 'APPROVED');
        return {
          text: `Se porcionaron y autorizaron con éxito un total de ${approved.length} lotes de insumos.`,
          kpis: [{ l: 'Lotes Cerrados', v: approved.length.toString() }],
          headers: ['Lote ID', 'Insumo', 'Cantidad Compra', 'Unidad de Compra', 'Costo de Entrada'],
          data: approved.map(b => [b.id, products.find(p => p.id === b.productId)?.name || 'Insumo', b.quantityPurchased, b.purchaseUnit, `RD$ ${b.totalCost.toLocaleString('es-DO')}`])
        };
      }
    },
    {
      q: '9. ¿Cuántas porciones reales salieron?',
      badge: 'Producción',
      solve: () => {
        const approved = filteredPortions.filter(b => b.status === 'APPROVED');
        const sumReal = approved.reduce((acc, b) => acc + b.realPortions, 0);
        const sumTheo = approved.reduce((acc, b) => acc + b.theoreticalPortions, 0);
        return {
          text: `La línea de producción despachó un total neto de ${sumReal} porciones empacadas con un desvío del ${(sumReal / (sumTheo || 1) * 100).toFixed(1)}% comparado con el pronóstico de rendimiento teórico.`,
          kpis: [
            { l: 'Porciones Reales', v: sumReal.toString() },
            { l: 'Porciones Teóricas', v: sumTheo.toString() }
          ],
          headers: ['Lote ID', 'Materia Prima', 'Porciones Teóricas', 'Porciones Reales', 'Variación'],
          data: approved.map(b => [b.id, products.find(p => p.id === b.productId)?.name || 'Insumo', b.theoreticalPortions, b.realPortions, `${b.realPortions - b.theoreticalPortions > 0 ? '+' : ''}${(b.realPortions - b.theoreticalPortions).toFixed(1)}`])
        };
      }
    },
    {
      q: '10. ¿Cuánto cuesta cada porción?',
      badge: 'Costos',
      solve: () => {
        const approved = filteredPortions.filter(b => b.status === 'APPROVED');
        return {
          text: `A continuación se detallan los costos finales e impacto impositivo de producción de cada porción procesada.`,
          kpis: [{ l: 'Lotes Auditados', v: approved.length.toString() }],
          headers: ['Lote ID', 'Materia Prima', 'Costo de Lote', 'Costo Unit. Estimado', 'Costo Unit. Físico Real'],
          data: approved.map(b => [b.id, products.find(p => p.id === b.productId)?.name || 'Insumo', `RD$ ${b.totalCost.toLocaleString('es-DO')}`, `RD$ ${b.estimatedCostPerPortion.toFixed(2)}`, `RD$ ${b.realCostPerPortion.toFixed(2)}`])
        };
      }
    },
    {
      q: '11. ¿Qué platos descuentan mi inventario?',
      badge: 'Fichas',
      solve: () => {
        const activeItem = menuItems.filter(item => item.deductsInventory);
        return {
          text: `Del menú completo, ${activeItem.length} platos/artículos descuentan inventario activamente al registrarse su venta.`,
          kpis: [{ l: 'Platos con Deducción', v: activeItem.length.toString() }],
          headers: ['Código', 'Plato/Articulo', 'Precio Venta', 'Costo de Receta', 'Food Cost %'],
          data: activeItem.map(item => [item.code, item.name, `RD$ ${item.salePrice}`, `RD$ ${item.theoreticalCost.toFixed(2)}`, `${item.foodCostPercentage.toFixed(1)}%`])
        };
      }
    },
    {
      q: '12. ¿Qué ventas reales descontaron ingredientes?',
      badge: 'Ventas',
      solve: () => {
        const processed = filteredSales.filter(s => s.deductionsApplied);
        const sumAmount = processed.reduce((acc, s) => acc + s.totalAmount, 0);
        return {
          text: `Se registraron y descontaron con bases de ficha técnica un total de ${processed.length} transacciones por monto total de RD$ ${sumAmount.toLocaleString('es-DO')}.`,
          kpis: [
            { l: 'Comandas de Cruce', v: processed.length.toString() },
            { l: 'Monto Recau.', v: `RD$ ${sumAmount.toLocaleString('es-DO')}` }
          ],
          headers: ['Fecha', 'Artículo Vendido', 'Cantidad', 'Canal', 'Impacto Costo Insumo'],
          data: processed.map(s => [s.date || s.createdAt.substring(0,10), s.saleItemName, s.qtySold, s.channel, `RD$ ${s.theoreticalCost.toLocaleString('es-DO')}`])
        };
      }
    },
    {
      q: '13. ¿Qué debía quedar de porciones al cierre?',
      badge: 'Cierre',
      solve: () => {
        const closesItems = filteredCloses.flatMap(c => c.items.map(i => ({ date: c.date, name: i.productName, exp: i.expectedClosingPortions })));
        return {
          text: `El sistema comparó los arqueos teóricos indicando lo que debió permanecer al finalizar el turno.`,
          kpis: [{ l: 'Insumos Listados', v: closesItems.length.toString() }],
          headers: ['Fecha Cierre', 'Porción Artículo', 'Existencia Teórica Esperable'],
          data: closesItems.map(i => [i.date, i.name, `${i.exp.toFixed(1)} porciones`])
        };
      }
    },
    {
      q: '14. ¿Qué quedó realmente?',
      badge: 'Cierre',
      solve: () => {
        const closesItems = filteredCloses.flatMap(c => c.items.map(i => ({ date: c.date, name: i.productName, act: i.physicalCountingPortions })));
        return {
          text: `La planilla del personal de cocina auditó y contó de manera física las porciones reales.`,
          kpis: [{ l: 'Conteo Físico Realizable', v: closesItems.reduce((acc, x) => acc + x.act, 0).toString() }],
          headers: ['Fecha Cierre', 'Insumo', 'Físico Real Contado'],
          data: closesItems.map(i => [i.date, i.name, `${i.act.toFixed(1)} porciones`])
        };
      }
    },
    {
      q: '15. ¿En qué porciones hay diferencias?',
      badge: 'Alertas',
      solve: () => {
        const deviationItems: any[][] = [];
        filteredCloses.forEach(c => {
          c.items.forEach(i => {
            const d = i.physicalCountingPortions - i.expectedClosingPortions;
            if (d !== 0) {
              deviationItems.push([
                c.date, i.productName, i.expectedClosingPortions, i.physicalCountingPortions,
                `${d > 0 ? '+' : ''}${d.toFixed(1)}`, `RD$ ${i.differenceValue.toLocaleString('es-DO')}`, i.comment || 'Arqueo de turno'
              ]);
            }
          });
        });
        return {
          text: `Se localizaron ${deviationItems.length} desajustes críticos entre arqueos teóricos y físicos.`,
          kpis: [{ l: 'Discrepancias', v: deviationItems.length.toString() }],
          headers: ['Fecha', 'Porción Insumo', 'Teórico Esperado', 'Real Contado', 'Desvío Unidades', 'Impacto Financiero', 'Justificación'],
          data: deviationItems.length ? deviationItems : [['Sin diferencias reportables', '—', '—', '—', '—', '—', '—']]
        };
      }
    },
    {
      q: '16. ¿Cuánto dinero representan esas diferencias?',
      badge: 'Pérdidas',
      solve: () => {
        let losses = 0;
        let gains = 0;
        filteredCloses.forEach(c => {
          c.items.forEach(i => {
            if (i.differenceValue < 0) losses += i.differenceValue;
            if (i.differenceValue > 0) gains += i.differenceValue;
          });
        });
        return {
          text: `Diferencias monetarias registradas en arqueos: Faltantes / Pérdida: RD$ ${losses.toLocaleString('es-DO')}. Excedentes / Ganancia: RD$ ${gains.toLocaleString('es-DO')}.`,
          kpis: [
            { l: 'Pérdida Neta', v: `RD$ ${losses.toLocaleString('es-DO')}` },
            { l: 'Ganancia Teórica', v: `RD$ ${gains.toLocaleString('es-DO')}` }
          ],
          headers: ['Tipo de Diferencia', 'Valor Neto acumulado'],
          data: [
            ['Excedentes de Cocina (+)', `RD$ ${gains.toLocaleString('es-DO')}`],
            ['Faltantes de Cocina (-)', `RD$ ${losses.toLocaleString('es-DO')}`]
          ]
        };
      }
    },
    {
      q: '17. ¿Qué se perdió por mermas y descartes?',
      badge: 'Pérdidas',
      solve: () => {
        const mermas = filteredMovements.filter(m => m.type === 'Merma');
        const lossVal = mermas.reduce((acc, m) => {
          const p = products.find(prod => prod.id === m.productId);
          return acc + (Math.abs(m.qty) * (p ? p.averageCost : 0));
        }, 0);
        return {
          text: `Las mermas valorables acumuladas ascienden a RD$ ${lossVal.toLocaleString('es-DO', { minimumFractionDigits: 2 })} en un espectro de ${mermas.length} eventos operativos de descartes.`,
          kpis: [{ l: 'Gasto por Descarte', v: `RD$ ${lossVal.toLocaleString('es-DO', { maximumFractionDigits: 0 })}` }],
          headers: ['Fecha', 'Insumo mermado', 'Monto Merma', 'Operador', 'Justificación'],
          data: mermas.map(m => [m.date.substring(0,10), m.productName, `${Math.abs(m.qty)} ${m.unitCode}`, m.userName, m.reason])
        };
      }
    },
    {
      q: '18. ¿Quiénes realizaron cada movimiento?',
      badge: 'Operación',
      solve: () => {
        const rows = filteredMovements.map(m => [
          m.date.substring(0, 16).replace('T', ' '), m.productName, m.type, `${m.qty > 0 ? '+' : ''}${m.qty} ${m.unitCode}`, m.userName, m.reason
        ]);
        return {
          text: `Trazabilidad total sobre todos los eventos asociados al cambio de existencias físicas en el restaurante.`,
          kpis: [{ l: 'Logs de Movimiento', v: filteredMovements.length.toString() }],
          headers: ['Fecha', 'Insumo', 'Tipo', 'Cantidad', 'Operador Responsable', 'Razón / Justificante'],
          data: rows
        };
      }
    }
  ];

  const activeQuestion = ACCEPTANCE_QUESTIONS[selectedQuestionIdx];
  const { text: qText, kpis: qKpis, headers: qHeaders, data: qData } = activeQuestion.solve();

  // --- REPORTES PRIORITARIOS GERENCIALES (KPI CALCULATOR) ---
  const kpiPurchasesMonth = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
  const kpiCriticalStockCount = filteredProducts.filter(p => p.currentStock < p.minStock).length;
  const kpiPendingPortions = (store.getPortionBatches() || []).filter(b => b.status === 'PENDING').length;
  const kpiCriticalPortionsCount = filteredProducts.filter(p => p.requiresPortioning && (p.portionsAvailable || 0) <= 20).length;
  const kpiPendingRequests = filteredRequests.filter(r => r.status === 'Enviada' || r.status === 'Borrador').length;
  const kpiPendingPurchasesCount = filteredPurchases.filter(p => p.status === 'Pendiente').length;
  
  // Highest spent product
  const productExpenseMap: Record<string, { name: string; total: number }> = {};
  filteredPurchases.forEach(p => p.items.forEach(it => {
    const prName = products.find(cur => cur.id === it.productId)?.name || 'Insumo';
    if (!productExpenseMap[it.productId]) productExpenseMap[it.productId] = { name: prName, total: 0 };
    productExpenseMap[it.productId].total += it.total || (it.qty * it.unitPrice);
  }));
  const kpiHighestSpentProduct = Object.values(productExpenseMap).reduce((max, x) => x.total > max.total ? x : max, { name: 'Ninguno', total: 0 });

  // Highest spent supplier
  const providerExpenseMap: Record<string, number> = {};
  filteredPurchases.forEach(p => {
    providerExpenseMap[p.providerName] = (providerExpenseMap[p.providerName] || 0) + p.total;
  });
  const kpiHighestSpentSupplier = Object.entries(providerExpenseMap).reduce((max, x) => x[1] > max.total ? { name: x[0], total: x[1] } : max, { name: 'Ninguno', total: 0 });

  // Mermas amount
  const kpiMermasSum = filteredMovements.filter(m => m.type === 'Merma').reduce((acc, m) => {
    const p = products.find(cur => cur.id === m.productId);
    return acc + (Math.abs(m.qty) * (p ? p.averageCost : 0));
  }, 0);

  // Closing differences cash
  let kpiClosingDiffAmt = 0;
  filteredCloses.forEach(c => c.items.forEach(i => {
    kpiClosingDiffAmt += i.differenceValue;
  }));

  return (
    <div className="space-y-6 animate-fade-in text-xs font-sans" id="reports-view">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Centro Financiero y de Control</span>
          <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight leading-none mt-1">
            Informes, Auditoría y Reportes Oficiales
          </h2>
          <p className="text-slate-500 mt-1.5 font-medium leading-relaxed">
            Consola gerencial de costeos para cuadrar facturas fiscales, control de porcionados, reconciliación de mermas e inventario físico.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Collapsible filters toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border font-bold text-xs transition ${showFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros Avanzados
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={resetFilters}
            title="Restablecer filtros"
            className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* FILTER CONTROL EXPANDABLE GRID */}
      {showFilters && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 shadow-inner transition duration-200">
          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Rango de Fecha</label>
            <div className="flex gap-1">
              <input
                type="date"
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
              />
              <span className="text-slate-400 self-center">al</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Selección Mes Escrito</label>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todos los meses</option>
              <option value="2026-06">Junio 2026 (Actual)</option>
              <option value="2026-05">Mayo 2026</option>
              <option value="2026-04">Abril 2026</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Sede / Sucursal</label>
            <select
              value={filterSede}
              onChange={e => setFilterSede(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todas las Sedes</option>
              <option value="Sede Principal">Sede Principal</option>
              <option value="Sede Norte">Sede Norte</option>
              <option value="Sede Sur">Sede Sur</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Área o Bodega</label>
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todas las áreas</option>
              <option value="Cocina">Cocina</option>
              <option value="Bar">Bar</option>
              <option value="Almacén seco">Almacén seco</option>
              <option value="Refrigerados">Refrigerados</option>
              <option value="Congelados">Congelados</option>
              <option value="Área de procesamiento">Área de procesamiento</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Categoría de Almacén</label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Artículo Específico</label>
            <select
              value={filterProduct}
              onChange={e => setFilterProduct(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todos los insumos</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Proveedor Primario</label>
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todos los proveedores</option>
              {uniqueProviders.map(pName => (
                <option key={pName} value={pName}>{pName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Usuario / Operador</label>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-medium"
            >
              <option value="all">Todos los usuarios</option>
              {uniqueUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* THREE ACTION STAGE TABS SELECTOR */}
      <div className="w-full overflow-x-auto scrollbar-none border-b border-slate-200 bg-white p-1 rounded-xl shadow-sm" id="reports-view-tabs-container">
        <div className="flex min-w-max gap-2" id="reports-view-tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition text-xs ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Sparkles className="w-4 h-4" />
            Dashboard Gerencial
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition text-xs ${activeTab === 'assistant' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <HelpCircle className="w-4 h-4" />
            Asistente de Auditoría (18 Respuestas)
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold transition text-xs ${activeTab === 'reports' ? 'bg-slate-905 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Layers className="w-4 h-4" />
            9 Familias de Reportes
          </button>
        </div>
      </div>

      {/* TAB CONTENTS */}

      {/* TAB A: EXECUTIVE GERENCIAL DASHBOARD STATS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* DYNAMIC BENTO GRID KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Compras del Mes</span>
              <strong className="text-base text-slate-800 font-extrabold mt-1 block">RD$ {kpiPurchasesMonth.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</strong>
              <span className="text-[9px] text-slate-505 block mt-2">Facturado en el tramo</span>
            </div>
            {/* KPI 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Producto Mayor Gasto</span>
              <strong className="text-xs text-slate-800 font-extrabold mt-1 block truncate" title={kpiHighestSpentProduct.name}>{kpiHighestSpentProduct.name}</strong>
              <span className="text-[9px] text-slate-505 mt-2">Gasto: RD$ {kpiHighestSpentProduct.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
            </div>
            {/* KPI 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Proveedor Principal</span>
              <strong className="text-xs text-slate-800 font-extrabold mt-1 block truncate" title={kpiHighestSpentSupplier.name}>{kpiHighestSpentSupplier.name}</strong>
              <span className="text-[9px] text-slate-550 mt-2 font-semibold">RD$ {kpiHighestSpentSupplier.total.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
            </div>
            {/* KPI 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Bajo Stock Mínimo</span>
              <strong className="text-lg text-amber-653 font-extrabold mt-1 block transition">{kpiCriticalStockCount} <span className="text-[10px] text-slate-400 font-medium">artículos</span></strong>
              <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1 py-0.5 rounded self-start mt-2">Riesgo de Quiebre</span>
            </div>
            {/* KPI 5 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Pendiente Porcionar</span>
              <strong className="text-base text-slate-805 font-extrabold mt-1 block">{kpiPendingPortions} lotes</strong>
              <span className="text-[9px] text-slate-404 mt-2">Aguardando en cola</span>
            </div>
            {/* KPI 6 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Porciones Críticas</span>
              <strong className="text-base text-rose-600 font-extrabold mt-1 block">{kpiCriticalPortionsCount} artículos</strong>
              <span className="text-[9px] text-rose-500 bg-rose-50 px-1 py-0.5 rounded self-start font-bold mt-2">¡Rápida Atención!</span>
            </div>
            {/* KPI 7 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Cierres Pendientes</span>
              <strong className="text-base text-slate-805 font-extrabold mt-1 block">{kpiPendingRequests} requisiciones</strong>
              <span className="text-[9px] text-slate-404 mt-2">Esperando despacho</span>
            </div>
            {/* KPI 8 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Diferencias Arqueo</span>
              <strong className={`text-base font-extrabold mt-1 block ${kpiClosingDiffAmt < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                RD$ {Math.abs(kpiClosingDiffAmt).toLocaleString('es-DO', { maximumFractionDigits: 0 })}
              </strong>
              <span className={`text-[9px] block mt-2 font-bold px-1 rounded self-start ${kpiClosingDiffAmt < 0 ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
                {kpiClosingDiffAmt < 0 ? 'Déficit Neto' : 'Balance Ajustado'}
              </span>
            </div>
            {/* KPI 9 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Mermas del Día</span>
              <strong className="text-base text-red-500 font-extrabold mt-1 block">RD$ {kpiMermasSum.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</strong>
              <span className="text-[9px] text-red-600 block bg-rose-50 px-1 rounded font-bold self-start mt-2">Desechos de alimentos</span>
            </div>
            {/* KPI 10 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Dólares vs Diferencias</span>
              <strong className="text-base text-indigo-703 font-extrabold mt-1 block">RD$ {Math.abs(kpiClosingDiffAmt).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</strong>
              <span className="text-[9px] text-slate-405 mt-2">Arqueos de cocina</span>
            </div>
            {/* KPI 11 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Sin Ficha Técnica</span>
              <strong className="text-base text-rose-550 font-extrabold mt-1 block">
                {menuItems.filter(p => p.requiresRecipe && !p.theoreticalCost).length} platos
              </strong>
              <span className="text-[9px] text-[10px] text-rose-500 bg-rose-50 px-1 rounded mt-2 self-start font-bold">Venta no controlada</span>
            </div>
            {/* KPI 12 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Facturas Pendientes</span>
              <strong className="text-lg text-orange-600 font-extrabold mt-1 block">{kpiPendingPurchasesCount} órdenes</strong>
              <span className="text-[9px] text-orange-500 bg-orange-50 px-1 rounded mt-2 self-start font-bold">Por pagar</span>
            </div>
          </div>

          {/* REALITY BUSINESS GRAPHS INSIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph 1: Gasto de compras agrupado por categoría */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="mb-4">
                <h4 className="font-display font-extrabold text-sm text-slate-800">Inversión de Compras por Categoría Insumo</h4>
                <p className="text-slate-400 text-[10.5px]">Acumulado financiero en pesos correspondientes a la fecha.</p>
              </div>
              <div className="space-y-3.5 mt-2">
                {categories.map(cat => {
                  const catPurchTotal = filteredPurchases.reduce((acc, p) => {
                    const matchedItems = p.items.filter(it => {
                      const prod = products.find(prod => prod.id === it.productId);
                      return prod && prod.categoryId === cat.id;
                    });
                    return acc + matchedItems.reduce((s, x) => s + (x.total || (x.qty * x.unitPrice)), 0);
                  }, 0);

                  const maxCatTotal = Math.max(...categories.map(c => filteredPurchases.reduce((acc, p) => {
                    const matchedItems = p.items.filter(it => {
                      const prod = products.find(prod => prod.id === it.productId);
                      return prod && prod.categoryId === c.id;
                    });
                    return acc + matchedItems.reduce((s, x) => s + (x.total || (x.qty * x.unitPrice)), 0);
                  }, 0))) || 1;

                  const percent = (catPurchTotal / maxCatTotal) * 100;

                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-650">
                        <span>{cat.name}</span>
                        <span className="font-mono text-slate-850">RD$ {catPurchTotal.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-slate-800 h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Graph 2: Mermas y pérdidas del almacén por áreas */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="mb-4">
                <h4 className="font-display font-extrabold text-sm text-slate-800">Bitácora Financiera de Mermas registradas por Área</h4>
                <p className="text-slate-400 text-[10.5px]">Pérdidas acumuladas valoradas en costo de insumo promedio.</p>
              </div>
              <div className="space-y-3.5 mt-2">
                {['Cocina', 'Bar', 'Almacén seco', 'Refrigerados', 'Congelados', 'Área de procesamiento'].map(areaName => {
                  const areaMermas = filteredMovements.filter(m => m.type === 'Merma' && m.area === areaName);
                  const areaLoss = areaMermas.reduce((acc, m) => {
                    const p = products.find(prod => prod.id === m.productId);
                    return acc + (Math.abs(m.qty) * (p ? p.averageCost : 0));
                  }, 0);

                  const maxLoss = Math.max(...['Cocina', 'Bar', 'Almacén seco', 'Refrigerados', 'Congelados', 'Área de procesamiento'].map(a => {
                    const mList = filteredMovements.filter(m => m.type === 'Merma' && m.area === a);
                    return mList.reduce((acc, m) => {
                      const p = products.find(prod => prod.id === m.productId);
                      return acc + (Math.abs(m.qty) * (p ? p.averageCost : 0));
                    }, 0);
                  })) || 1;

                  const percent = (areaLoss / maxLoss) * 100;

                  return (
                    <div key={areaName} className="space-y-1">
                      <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-650">
                        <span>{areaName}</span>
                        <span className="font-mono text-red-600">RD$ {areaLoss.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full transition-all animate-pulse" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: AUDITOR INTERACTIVE ASSISTANT (WIDGET TO ANSWER 18 MANDATORY QUESTIONS) */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick sidebar questions list */}
          <div className="md:col-span-1 bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-2 max-h-[80vh] overflow-y-auto">
            <h4 className="font-display font-extrabold text-sm text-slate-800 mb-3 block border-b border-slate-100 pb-2">18 Criterios del Auditor</h4>
            {ACCEPTANCE_QUESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedQuestionIdx(idx)}
                className={`w-full text-left p-2.5 rounded-lg border font-medium text-[11px] transition flex justify-between items-center ${selectedQuestionIdx === idx ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-600'}`}
              >
                <span className="truncate">{item.q}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${selectedQuestionIdx === idx ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                  {item.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Quick solver card answer */}
          <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4.5 h-4.5 text-indigo-500" />
                  {activeQuestion.q}
                </h3>
                <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Mision Audit: {selectedQuestionIdx + 1}/18</span>
              </div>

              {/* Response summary text */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-slate-700 font-sans leading-relaxed text-[11.5px]">
                {qText}
              </div>

              {/* Response dynamic KPIs */}
              <div className="grid grid-cols-2 gap-4">
                {qKpis.map((k, kIdx) => (
                  <div key={kIdx} className="bg-indigo-50/50 border border-indigo-100/55 p-3 rounded-lg">
                    <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider block">{k.l}</span>
                    <strong className="text-base text-slate-800 font-black mt-1 block">{k.v}</strong>
                  </div>
                ))}
              </div>

              {/* Response detail table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Desglose Detallado Auditoría</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[250px] overflow-y-auto">
                  {/* MOBILE VIEW FOR TABLE DETAILS */}
                  <div className="block lg:hidden divide-y divide-slate-150">
                    {qData.map((rowArr, rowIdx) => (
                      <div key={rowIdx} className="p-3 bg-white space-y-1">
                        {rowArr.map((cell, colIdx) => (
                          <div key={colIdx} className="flex justify-between text-[10px]">
                            <span className="text-slate-400 font-medium">{qHeaders[colIdx]}:</span>
                            <span className="text-slate-700 font-bold">{cell === null || cell === undefined ? '—' : cell}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {!qData.length && (
                      <p className="p-4 text-center italic text-slate-400">Ningún dato detectado bajo filtros.</p>
                    )}
                  </div>

                  {/* DESKTOP VIEW FOR TABLE DETAILS */}
                  <table className="w-full border-collapse text-left text-[10px] hidden lg:table">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        {qHeaders.map((h, colI) => (
                          <th key={colI} className="p-2.5 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {qData.map((rowArr, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50/50 transition">
                          {rowArr.map((cell, colIdx) => (
                            <td key={colIdx} className="p-2.5 text-slate-650 font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))}
                      {!qData.length && (
                        <tr>
                          <td colSpan={qHeaders.length} className="p-6 text-center italic text-slate-400">
                            No se detectó información registrada bajo los filtros seleccionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ACTION EXPORTS FOR PORTING QUESTIONS SPLIT */}
            <div className="border-t border-slate-100 pt-4 flex gap-2">
              <button
                onClick={() => {
                  const ws = XLSX.utils.aoa_to_sheet([qHeaders, ...qData]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Audit");
                  XLSX.writeFile(wb, `Audit_Response_Q${selectedQuestionIdx+1}.xlsx`);
                }}
                className="flex-1 py-2 px-3 bg-slate-900 border border-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Excel (XLSX)
              </button>
              <button
                onClick={() => {
                  const csvContent = "\uFEFF" + [qHeaders.join(","), ...qData.map(row => row.join(","))].join("\n");
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Audit_Response_Q${selectedQuestionIdx+1}.csv`);
                  document.title = activeQuestion.q;
                  link.click();
                }}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-bold flex items-center justify-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CSV Plain
              </button>
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (!printWin) return;
                  printWin.document.write(`
                    <html>
                      <body onload="window.print(); window.close();" style="font-family: sans-serif; padding: 20px;">
                        <h1>${activeQuestion.q}</h1>
                        <p>${qText}</p>
                        <table border="1" cellpadding="5" style="border-collapse:collapse; width:100%; font-size:11px;">
                          <thead><tr>${qHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                          <tbody>${qData.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
                        </table>
                      </body>
                    </html>
                  `);
                  printWin.document.close();
                }}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-bold flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: THE 9 COMPREHENSIVE REPORT FAMILIES DATA VIEWER */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Families side list */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1 max-h-[80vh] overflow-y-auto">
            <span className="text-[10px] text-slate-400 font-bold block mb-3 border-b pb-2 uppercase tracking-wider">Familias de Reportes</span>
            {FAMILIES.map(fam => (
              <button
                key={fam.id}
                onClick={() => {
                  setSelectedFamily(fam.id);
                  // Auto-select first report under family
                  const list = REPORTS_BY_FAMILY[fam.id] || [];
                  if (list.length) setSelectedReportId(list[0].id);
                }}
                className={`w-full text-left p-2.5 rounded-lg border font-bold text-[11px] transition block ${selectedFamily === fam.id ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'border-slate-150 hover:bg-slate-50 text-slate-600'}`}
              >
                {fam.name}
              </button>
            ))}
          </div>

          {/* Subreports display and tables */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            {/* Sub-report selector buttons */}
            <div className="space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-3 gap-3">
                <div>
                  <h4 className="font-display font-extrabold text-sm text-slate-800">
                    {REPORTS_BY_FAMILY[selectedFamily]?.[0]?.name ? FAMILIES.find(f => f.id === selectedFamily)?.name : 'Selecciona un Reporte'}
                  </h4>
                  <p className="text-slate-400 text-[10.5px]">Escoge de los informes contables o físicos habilitados para esta familia.</p>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={handleExportExcel}
                    className="py-1.5 px-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-[11px]"
                  >
                    Excel <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition flex items-center gap-1 text-[11px]"
                  >
                    CSV <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="py-1.5 px-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition flex items-center gap-1 text-[11px]"
                  >
                    PDF <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub reports clickable pill items */}
              <div className="flex flex-wrap gap-2">
                {(REPORTS_BY_FAMILY[selectedFamily] || []).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReportId(r.id)}
                    className={`px-3 py-1.5 rounded-full border text-[10.5px] font-bold transition ${selectedReportId === r.id ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-150/50 mt-1 italic">
                {activeReport.description}
              </p>
            </div>

            {/* HIGH-VALUE KPI CHIPS FOR THAT REPORT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {kpis.map((kpi, kIdx) => (
                <div key={kIdx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{kpi.label}</span>
                  <strong className="text-base text-slate-800 block mt-1 font-bold">{kpi.value}</strong>
                </div>
              ))}
            </div>

            {/* RESULTS REPORT DATA DYNAMIC REPRESENTATION */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[450px] overflow-y-auto shadow-inner">
              {/* CELLULAR RESUME CARDS (FOR MOBILE SCREENS) */}
              <div className="block lg:hidden divide-y divide-slate-150 bg-slate-50">
                {rows.map((rowVal, rIdx) => (
                  <div key={rIdx} className="p-3 bg-white space-y-1.5 hover:bg-slate-50 transition">
                    {rowVal.map((cellStr, cIdx) => (
                      <div key={cIdx} className="flex justify-between items-start text-[10.5px]">
                        <span className="text-slate-400 font-medium">{headers[cIdx]}:</span>
                        <span className="text-slate-800 font-bold text-right ml-2 break-all">{cellStr === null || cellStr === undefined ? '—' : cellStr}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {!rows.length && (
                  <p className="p-6 text-center italic text-slate-400">Sin datos bajo filtros.</p>
                )}
              </div>

              {/* DENSE TABLE FORMAT (FOR TABLET/DESKTOP HIGH VALUE) */}
              <table className="w-full border-collapse text-left text-[10px] hidden lg:table">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    {headers.map((h, colI) => (
                      <th key={colI} className="p-3 font-bold tracking-tight">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((rowVal, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/50 transition duration-150">
                      {rowVal.map((cellStr, cIdx) => (
                        <td key={cIdx} className="p-2.5 text-slate-650 font-medium">
                          {cellStr === null || cellStr === undefined ? '—' : cellStr}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={headers.length} className="p-10 text-center italic text-slate-400">
                        No hay registros que coincidan con la combinación de filtros de búsqueda establecida. Indique un rango de fecha más amplio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
