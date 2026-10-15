import { UnitConversionRule, ItemStock, ItemPrPo, MasterItem } from '../types';

export const INITIAL_CONVERSION_RULES: UnitConversionRule[] = [
  {
    id: 'conv-1',
    fromUnit: 'DUS',
    toUnit: 'PCS',
    multiplier: 24,
    appliesToItem: '',
    description: '1 Dus = 24 Pcs',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-2',
    fromUnit: 'BOX',
    toUnit: 'PCS',
    multiplier: 50,
    appliesToItem: '',
    description: '1 Box = 50 Pcs',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-3',
    fromUnit: 'PACK',
    toUnit: 'PCS',
    multiplier: 10,
    appliesToItem: '',
    description: '1 Pack = 10 Pcs',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-4',
    fromUnit: 'LUSIN',
    toUnit: 'PCS',
    multiplier: 12,
    appliesToItem: '',
    description: '1 Lusin = 12 Pcs',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-5',
    fromUnit: 'DRUM',
    toUnit: 'LITER',
    multiplier: 200,
    appliesToItem: '',
    description: '1 Drum = 200 Liter',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-6',
    fromUnit: 'JERIGEN',
    toUnit: 'LITER',
    multiplier: 20,
    appliesToItem: '',
    description: '1 Jerigen = 20 Liter',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-7',
    fromUnit: 'ROLL',
    toUnit: 'METER',
    multiplier: 100,
    appliesToItem: '',
    description: '1 Roll = 100 Meter',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-8',
    fromUnit: 'SAK',
    toUnit: 'KG',
    multiplier: 25,
    appliesToItem: '',
    description: '1 Sak = 25 Kg',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'conv-9',
    fromUnit: 'TABUNG',
    toUnit: 'UNIT',
    multiplier: 1,
    appliesToItem: '',
    description: '1 Tabung Gas = 1 Unit',
    lastUpdated: '2026-10-01T08:00:00.000Z',
  },
];

/**
 * Generate initial stock list from master items if none saved yet
 */
export function generateInitialStocks(items: MasterItem[]): ItemStock[] {
  const defaultStocks: Record<string, number> = {
    APD001: 25,
    APD002: 18,
    APD007: 40,
    APD008: 150,
    APD012: 85,
    APD014: 300,
    APD018: 240,
    APD019: 60,
    RKE001: 12,
    RKE002: 8,
    RKE004: 4,
    RKE008: 20,
    RKE014: 65,
    RKE023: 120,
    RKE025: 50,
    RKE028: 100,
  };

  return items.map((it, idx) => {
    const code = it.code || `ITM-${String(idx + 1).padStart(3, '0')}`;
    const initialQty = defaultStocks[code] ?? Math.floor(((idx * 7 + 13) % 45) + 5);
    return {
      itemId: it.id || `stock-${idx + 1}`,
      itemCode: code,
      itemName: it.name,
      category: it.category || 'Umum',
      unit: it.defaultUnit || 'PCS',
      currentStock: initialQty,
      minStock: 10,
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Generate initial PR/PO records for master items
 */
export function generateInitialPrPo(items: MasterItem[]): ItemPrPo[] {
  return items.map((it, idx) => {
    const code = it.code || `ITM-${String(idx + 1).padStart(3, '0')}`;
    const hasPr = idx % 3 === 0 || idx < 10;
    const hasPo = hasPr && idx % 2 === 0;

    const prNumber = hasPr ? `PR-2026-${String(100 + idx).slice(-3)}` : '';
    const poNumber = hasPo ? `PO-KMI-${String(400 + idx).slice(-3)}` : '';
    const prDate = hasPr ? '2026-10-05' : '';

    return {
      itemId: it.id || `prpo-${idx + 1}`,
      itemCode: code,
      itemName: it.name,
      category: it.category || 'Umum',
      unit: it.defaultUnit || 'PCS',
      tglPR: prDate,
      noPR: prNumber,
      noPO: poNumber,
      notes: hasPr ? (hasPo ? 'Sudah PO' : 'Menunggu PO') : 'Belum proses PR',
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Calculate smallest unit conversion if rule or item formula exists
 */
export function calculateSmallestUnit(
  qty: number,
  currentUnit: string,
  itemName: string,
  rules: UnitConversionRule[],
  itemFormulas?: import('../types').ItemUnitFormula[]
): { convertedQty: number; smallestUnit: string; ruleDescription: string } | null {
  if (!currentUnit || isNaN(qty)) return null;

  const normalizedCurrent = currentUnit.trim().toLowerCase();

  // 1. Check item-specific formula from Update Satuan Terkecil matrix first
  if (itemFormulas && itemFormulas.length > 0) {
    const formula = itemFormulas.find(
      (f) => f.name.toLowerCase() === itemName.toLowerCase() || f.code.toLowerCase() === itemName.toLowerCase()
    );
    if (formula) {
      const factor = formula.unitFactors[normalizedCurrent];
      if (factor !== undefined && factor > 0) {
        const convertedQty = qty * factor;
        const targetUnit = formula.satuanTerkecil.toUpperCase();
        return {
          convertedQty,
          smallestUnit: targetUnit,
          ruleDescription: `1 ${currentUnit.toUpperCase()} = ${factor} ${targetUnit}`,
        };
      }
    }
  }

  // 2. Look for specific rule for this item from rules list
  const specificRule = rules.find(
    (r) =>
      r.appliesToItem &&
      r.appliesToItem.toLowerCase() === itemName.toLowerCase() &&
      r.fromUnit.trim().toLowerCase() === normalizedCurrent
  );

  const rule =
    specificRule ||
    rules.find((r) => !r.appliesToItem && r.fromUnit.trim().toLowerCase() === normalizedCurrent);

  if (!rule) return null;

  const convertedQty = qty * rule.multiplier;
  return {
    convertedQty,
    smallestUnit: rule.toUnit.toUpperCase(),
    ruleDescription: rule.description || `1 ${rule.fromUnit} = ${rule.multiplier} ${rule.toUnit}`,
  };
}
