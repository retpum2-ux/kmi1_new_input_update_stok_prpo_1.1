import {
  MasterItem,
  MasterUnit,
  AppSettings,
  SubmissionRecord,
  KedatanganFormData,
  ItemStock,
  ItemPrPo,
  UnitConversionRule,
  ItemUnitFormula,
} from '../types';
import { INITIAL_MASTER_ITEMS, INITIAL_MASTER_UNITS, DEFAULT_SETTINGS } from '../data/initialMasterData';
import {
  INITIAL_CONVERSION_RULES,
  generateInitialStocks,
  generateInitialPrPo,
} from '../data/initialUpdateData';

const STORAGE_KEYS = {
  ITEMS: 'kmi_master_items',
  UNITS: 'kmi_master_units',
  SETTINGS: 'kmi_app_settings',
  RECORDS: 'kmi_submission_records',
  STOCKS: 'kmi_item_stocks',
  PRPOS: 'kmi_item_prpos',
  CONVERSIONS: 'kmi_conversion_rules',
  FORMULAS: 'kmi_item_unit_formulas',
};

// ================= MASTER ITEMS =================
export async function getMasterItems(): Promise<MasterItem[]> {
  try {
    const res = await fetch('/api/master/items');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map((it: any, idx: number) => ({
          id: it.id || `item-${idx + 1}`,
          code: it.code || `ITM-${String(idx + 1).padStart(3, '0')}`,
          name: it.name || '',
          category: it.category || 'Umum',
          defaultUnit: it.defaultUnit || 'PCS',
          description: it.description || '',
        }));
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(normalized));
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Backend unavailable, using localStorage for items:', err);
  }

  const stored = localStorage.getItem(STORAGE_KEYS.ITEMS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // Save initial master items to storage
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_MASTER_ITEMS));
  // Send to backend in background
  fetch('/api/master/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INITIAL_MASTER_ITEMS),
  }).catch(() => {});

  return INITIAL_MASTER_ITEMS;
}

export async function saveMasterItems(items: MasterItem[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  try {
    const res = await fetch('/api/master/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    return res.ok;
  } catch {
    return true; // Still saved in localStorage
  }
}

// ================= MASTER UNITS =================
export async function getMasterUnits(): Promise<MasterUnit[]> {
  try {
    const res = await fetch('/api/master/units');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const normalized = data.map((u: any, idx: number) => ({
          id: u.id || `unit-${idx + 1}`,
          code: (u.code || '').toUpperCase(),
          name: u.name || u.code || '',
          symbol: u.symbol,
        }));
        localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(normalized));
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Backend unavailable, using localStorage for units:', err);
  }

  const stored = localStorage.getItem(STORAGE_KEYS.UNITS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_MASTER_UNITS));
  fetch('/api/master/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INITIAL_MASTER_UNITS),
  }).catch(() => {});

  return INITIAL_MASTER_UNITS;
}

export async function saveMasterUnits(units: MasterUnit[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
  try {
    const res = await fetch('/api/master/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(units),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// ================= SETTINGS =================
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data));
      return data;
    }
  } catch {
    // fallback
  }

  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
  }

  return DEFAULT_SETTINGS;
}

export async function saveAppSettings(settings: AppSettings): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// ================= TEST CONNECTION =================
export async function testSheetsConnection(webhookUrl: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const res = await fetch('/api/test-sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl }),
    });
    return await res.json();
  } catch (err: any) {
    // Attempt direct ping if backend is not responding
    try {
      const direct = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping', type: 'test' }),
      });
      const text = await direct.text();
      return {
        success: direct.ok,
        message: direct.ok
          ? 'Koneksi langsung ke Google Apps Script berhasil!'
          : `Gagal dengan status ${direct.status}`,
        details: text,
      };
    } catch (directErr: any) {
      return {
        success: false,
        message: `Koneksi gagal: ${err.message || directErr.message || 'CORS / URL tidak valid'}`,
      };
    }
  }
}

// ================= SUBMIT FORM =================
export async function submitFormData(
  formData: KedatanganFormData
): Promise<{
  success: boolean;
  synced: boolean;
  message: string;
  record?: SubmissionRecord;
}> {
  const localSettings = await getAppSettings();

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        webhookUrl: localSettings.webhookUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      saveRecordLocally(
        data.record || {
          ...formData,
          id: data.transactionId || `TRX-${Date.now()}`,
          createdAt: new Date().toISOString(),
          syncedToSheets: data.synced,
        }
      );
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/submit failed, trying direct or local save:', err);
  }

  // Fallback: If backend is unreachable, try direct fetch if webhookUrl is present
  const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  let synced = false;
  let syncMsg = 'Data tersimpan di perangkat lokal.';

  if (localSettings.webhookUrl) {
    try {
      const payload = {
        action: 'submit',
        tanggal: formData.tanggal,
        items: formData.items,
        sheetName: localSettings.sheetNameKedatangan || 'Kedatangan',
      };
      await fetch(localSettings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors', // standard workaround for direct browser to Google Apps Script
      });
      synced = true;
      syncMsg = 'Data berhasil dikirim ke Google Spreadsheet!';
    } catch (e: any) {
      syncMsg = `Data tersimpan lokal, pengiriman spreadsheet gagal: ${e.message}`;
    }
  }

  const fallbackRecord: SubmissionRecord = {
    ...formData,
    id: transactionId,
    createdAt: now,
    syncedToSheets: synced,
    syncError: synced ? undefined : 'Tersimpan offline',
  };

  saveRecordLocally(fallbackRecord);

  return {
    success: true,
    synced,
    message: syncMsg,
    record: fallbackRecord,
  };
}

// ================= LOCAL STORAGE RECORDS =================
export function getLocalRecords(): SubmissionRecord[] {
  const stored = localStorage.getItem(STORAGE_KEYS.RECORDS);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveRecordLocally(record: SubmissionRecord) {
  const current = getLocalRecords();
  const updated = [record, ...current.filter((r) => r.id !== record.id)].slice(0, 500);
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
}

export function clearLocalRecords() {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  fetch('/api/records', { method: 'DELETE' }).catch(() => {});
}

// ================= ITEM STOCKS =================
export async function getItemStocks(currentMasterItems?: MasterItem[]): Promise<ItemStock[]> {
  try {
    const res = await fetch('/api/stock');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/stock unavailable, fallback to storage:', err);
  }

  const stored = localStorage.getItem(STORAGE_KEYS.STOCKS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // Generate initial stocks from items
  const items = currentMasterItems && currentMasterItems.length > 0 ? currentMasterItems : await getMasterItems();
  const initial = generateInitialStocks(items);
  localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(initial));
  fetch('/api/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initial),
  }).catch(() => {});

  return initial;
}

export async function saveItemStocks(stocks: ItemStock[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(stocks));
  try {
    const res = await fetch('/api/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stocks),
    });
    return res.ok;
  } catch {
    return true; // saved in localStorage
  }
}

// ================= ITEM PR PO =================
export async function getItemPrPos(currentMasterItems?: MasterItem[]): Promise<ItemPrPo[]> {
  try {
    const res = await fetch('/api/prpo');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.PRPOS, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/prpo unavailable, fallback to storage:', err);
  }

  const stored = localStorage.getItem(STORAGE_KEYS.PRPOS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const items = currentMasterItems && currentMasterItems.length > 0 ? currentMasterItems : await getMasterItems();
  const initial = generateInitialPrPo(items);
  localStorage.setItem(STORAGE_KEYS.PRPOS, JSON.stringify(initial));
  fetch('/api/prpo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initial),
  }).catch(() => {});

  return initial;
}

export async function saveItemPrPos(prpos: ItemPrPo[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.PRPOS, JSON.stringify(prpos));
  try {
    const res = await fetch('/api/prpo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prpos),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// ================= CONVERSION RULES =================
export async function getConversionRules(): Promise<UnitConversionRule[]> {
  try {
    const res = await fetch('/api/conversions');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CONVERSIONS, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/conversions unavailable, fallback to storage:', err);
  }

  const stored = localStorage.getItem(STORAGE_KEYS.CONVERSIONS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  localStorage.setItem(STORAGE_KEYS.CONVERSIONS, JSON.stringify(INITIAL_CONVERSION_RULES));
  fetch('/api/conversions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(INITIAL_CONVERSION_RULES),
  }).catch(() => {});

  return INITIAL_CONVERSION_RULES;
}

export async function saveConversionRules(rules: UnitConversionRule[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.CONVERSIONS, JSON.stringify(rules));
  try {
    const res = await fetch('/api/conversions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules),
    });
    return res.ok;
  } catch {
    return true;
  }
}

// ================= ITEM UNIT FORMULAS (UPDATE SATUAN TERKECIL) =================
export function generateInitialItemFormulas(items: MasterItem[]): ItemUnitFormula[] {
  return items.map((it, idx) => {
    const code = it.code || `ITM-${String(idx + 1).padStart(3, '0')}`;
    const defaultU = (it.defaultUnit || 'pcs').toLowerCase();
    const isLiquid = defaultU === 'liter' || it.name.toLowerCase().includes('oli') || it.name.toLowerCase().includes('tiner') || it.name.toLowerCase().includes('bensin');
    const isWeight = defaultU === 'kg' || it.name.toLowerCase().includes('rod') || it.name.toLowerCase().includes('compound');
    const satuanTerkecil = isLiquid ? 'liter' : isWeight ? 'kg' : 'pcs';

    return {
      code,
      name: it.name,
      satuanTerkecil,
      unitFactors: {
        pcs: satuanTerkecil === 'pcs' ? 1 : 0,
        liter: satuanTerkecil === 'liter' ? 1 : 0,
        kg: satuanTerkecil === 'kg' ? 1 : 0,
        box: satuanTerkecil === 'pcs' ? 50 : 20,
        derigen: satuanTerkecil === 'liter' ? 20 : 0,
        drum: satuanTerkecil === 'liter' ? 200 : 0,
        pack: satuanTerkecil === 'pcs' ? 10 : 0,
        lusin: satuanTerkecil === 'pcs' ? 12 : 0,
        roll: 100,
      },
      unitInputs: {
        pcs: 0,
        liter: 0,
        kg: 0,
        box: 0,
        derigen: 0,
      },
      totalOutput: 0,
      totalInput: 0,
      lastUpdated: new Date().toISOString(),
    };
  });
}

export async function getItemFormulas(currentMasterItems?: MasterItem[]): Promise<ItemUnitFormula[]> {
  try {
    const res = await fetch('/api/item-formulas');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.FORMULAS, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend /api/item-formulas unavailable, using storage:', err);
  }

  const stored = localStorage.getItem(STORAGE_KEYS.FORMULAS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const items = currentMasterItems && currentMasterItems.length > 0 ? currentMasterItems : await getMasterItems();
  const initial = generateInitialItemFormulas(items);
  localStorage.setItem(STORAGE_KEYS.FORMULAS, JSON.stringify(initial));
  fetch('/api/item-formulas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initial),
  }).catch(() => {});

  return initial;
}

export async function saveItemFormulas(formulas: ItemUnitFormula[]): Promise<boolean> {
  localStorage.setItem(STORAGE_KEYS.FORMULAS, JSON.stringify(formulas));
  try {
    const res = await fetch('/api/item-formulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formulas),
    });
    return res.ok;
  } catch {
    return true;
  }
}


