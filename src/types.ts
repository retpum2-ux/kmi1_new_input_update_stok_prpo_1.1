export interface MasterItem {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultUnit: string;
  description?: string;
}

export interface MasterUnit {
  id: string;
  code: string;
  name: string;
  symbol?: string;
}

export interface ItemEntryKedatangan {
  id: string;
  barang: string;
  qty: string | number;
  unit: string;
  keterangan: string;
  noPR: string;
  noPO: string;
  noPE?: string;
}

export interface KedatanganFormData {
  id?: string;
  type: 'kedatangan';
  tanggal: string;
  items: ItemEntryKedatangan[];
  createdAt?: string;
  syncedToSheets?: boolean;
}

export type SubmissionRecord = KedatanganFormData & {
  id: string;
  createdAt: string;
  syncedToSheets: boolean;
  syncError?: string;
};

export interface AppSettings {
  webhookUrl: string;
  sheetNameKedatangan: string;
  sheetNamePengambilan?: string;
  spreadsheetId?: string;
  companyName: string;
}

// ================= UPDATE SYSTEM INTERFACES =================

export interface ItemStock {
  itemId: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unit: string;
  currentStock: number;
  minStock?: number;
  lastUpdated?: string;
  notes?: string;
}

export interface ItemPrPo {
  itemId: string;
  itemCode: string;
  itemName: string;
  category?: string;
  unit: string;
  tglPR?: string;
  noPR?: string;
  noPO?: string;
  notes?: string;
  lastUpdated?: string;
}

export interface UnitConversionRule {
  id: string;
  fromUnit: string;
  toUnit: string;
  multiplier: number;
  appliesToItem?: string; // empty string jika berlaku umum untuk semua barang
  description?: string;
  lastUpdated?: string;
}

export type UpdateMenuTab =
  | 'menu1-ringkasan'
  | 'menu2-stok'
  | 'menu3-prpo'
  | 'menu4-pengaturan';

export type PengaturanSubTab = 'rumus' | 'barang' | 'kuantitas';

// ================= UPDATE SATUAN TERKECIL TABLE =================
// Code Barang | Nama Barang | Satuan Terkecil | Kuantitas [pcs, liter, kg, box, derigen, dst] | Total Output | Total Input
export interface ItemUnitFormula {
  code: string;
  name: string;
  satuanTerkecil: string;
  unitFactors: Record<string, number>;
  unitInputs?: Record<string, number>;
  totalOutput?: number;
  totalInput?: number;
  lastUpdated?: string;
}
