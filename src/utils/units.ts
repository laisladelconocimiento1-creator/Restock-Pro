// Standard conversions and custom equivalence managers for ECG Restaurant System

export interface ConversionRule {
  fromUnit: string;
  toUnit: string;
  factor: number;
}

// Convert weight standard references to grams (g)
const WEIGHT_CONVERSIONS: Record<string, number> = {
  g: 1,
  gr: 1,
  gramos: 1,
  kg: 1000,
  kilo: 1000,
  kilogramo: 1000,
  kilogramos: 1000,
  lb: 453.59237,
  lbs: 453.59237,
  libras: 453.59237,
  oz: 28.349523,
  onzas: 28.349523
};

// Convert volume standard references to milliliters (ml)
const VOLUME_CONVERSIONS: Record<string, number> = {
  ml: 1,
  mililitros: 1,
  l: 1000,
  litro: 1000,
  litros: 1000,
  "galón": 3785.41178,
  "galon": 3785.41178,
  "taza": 240,
  "tazas": 240
};

// Standard unit mappings for matching synonyms
const UNIT_SYNONYMS: Record<string, string> = {
  g: "g", gr: "g", gramos: "g",
  kg: "kg", kilo: "kg", kilogramo: "kg", kilogramos: "kg",
  lb: "lb", lbs: "lb", libras: "lb",
  oz: "oz", onzas: "oz",
  ml: "ml", mililitros: "ml",
  l: "l", litros: "l",
  "galón": "galon", "galon": "galon",
  "taza": "taza", "tazas": "taza",
  "u": "unidad", unidad: "unidad", unidades: "unidad", pz: "unidad", pieza: "unidad", piezas: "unidad",
  paquete: "paquete", paquetes: "paquete",
  caja: "caja", cajas: "caja",
  lata: "lata", latas: "lata",
  botella: "botella", botellas: "botella",
  funda: "funda", fundas: "funda",
  "porción": "porcion", "porcion": "porcion", porciones: "porcion"
};

/**
 * Normalizes unit code string for matching
 */
export function normalizeUnit(unitStr: string): string {
  if (!unitStr) return "unidad";
  const clean = unitStr.toLowerCase().trim().replace(/[\.]/g, "");
  return UNIT_SYNONYMS[clean] || clean;
}

/**
 * Checks if two units are compatible for direct conversion
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const normA = normalizeUnit(unitA);
  const normB = normalizeUnit(unitB);

  if (normA === normB) return true;

  // Weight compatibility
  const isWeightA = normA in WEIGHT_CONVERSIONS;
  const isWeightB = normB in WEIGHT_CONVERSIONS;
  if (isWeightA && isWeightB) return true;

  // Volume compatibility
  const isVolumeA = normA in VOLUME_CONVERSIONS;
  const isVolumeB = normB in VOLUME_CONVERSIONS;
  if (isVolumeA && isVolumeB) return true;

  return false;
}

/**
 * Converts a quantity from one unit to another
 * Supports standard weight, volume, or custom product conversions.
 * Returns null if not compatible.
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  customEquivalences?: { fromUnit: string; toUnit: string; factor: number }[]
): { value: number; compatible: boolean; warning?: string } {
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (normFrom === normTo) {
    return { value: quantity, compatible: true };
  }

  // Check custom equivalences first
  if (customEquivalences) {
    for (const rule of customEquivalences) {
      const ruleFrom = normalizeUnit(rule.fromUnit);
      const ruleTo = normalizeUnit(rule.toUnit);

      if (ruleFrom === normFrom && ruleTo === normTo) {
        return { value: quantity * rule.factor, compatible: true };
      }
      if (ruleFrom === normTo && ruleTo === normFrom) {
        return { value: quantity / rule.factor, compatible: true };
      }
    }
  }

  // Weight conversion
  if (normFrom in WEIGHT_CONVERSIONS && normTo in WEIGHT_CONVERSIONS) {
    const factorFrom = WEIGHT_CONVERSIONS[normFrom];
    const factorTo = WEIGHT_CONVERSIONS[normTo];
    const grams = quantity * factorFrom;
    return { value: grams / factorTo, compatible: true };
  }

  // Volume conversion
  if (normFrom in VOLUME_CONVERSIONS && normTo in VOLUME_CONVERSIONS) {
    const factorFrom = VOLUME_CONVERSIONS[normFrom];
    const factorTo = VOLUME_CONVERSIONS[normTo];
    const milliliters = quantity * factorFrom;
    return { value: milliliters / factorTo, compatible: true };
  }

  // Built-in defaults or common custom values requested in prompt
  // 1 caja de pan = 24 unidades
  if (normFrom === "caja" && normTo === "unidad") return { value: quantity * 24, compatible: true };
  if (normFrom === "unidad" && normTo === "caja") return { value: quantity / 24, compatible: true };

  // 1 paquete de queso = 2.5 kg
  if (normFrom === "paquete" && (normTo === "kg" || normTo === "kilo")) return { value: quantity * 2.5, compatible: true };
  if ((normFrom === "kg" || normFrom === "kilo") && normTo === "paquete") return { value: quantity / 2.5, compatible: true };

  // 1 funda de harina = 50 lb
  if (normFrom === "funda" && normTo === "lb") return { value: quantity * 50, compatible: true };
  if (normFrom === "lb" && normTo === "funda") return { value: quantity / 50, compatible: true };

  // 1 galón de salsa = 3.785 l
  if (normFrom === "galon" && normTo === "l") return { value: quantity * 3.78541178, compatible: true };
  if (normFrom === "l" && normTo === "galon") return { value: quantity / 3.78541178, compatible: true };

  return { 
    value: quantity, 
    compatible: false, 
    warning: `La conversión entre ${fromUnit} y ${toUnit} no está definida. Se aplicó equivalencia 1:1 de seguridad.` 
  };
}
