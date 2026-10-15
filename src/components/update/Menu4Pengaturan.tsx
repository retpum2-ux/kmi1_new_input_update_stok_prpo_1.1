import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Package,
  Scale,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  MasterItem,
  MasterUnit,
  UnitConversionRule,
  ItemUnitFormula,
  PengaturanSubTab,
} from '../../types';
import { exportToExcelXml, exportToCsv, ExportColumn } from '../../utils/excelExport';
import { ImportModal } from './ImportModal';
import { UpdateSatuanTerkecilTable } from './UpdateSatuanTerkecilTable';

interface Menu4PengaturanProps {
  initialSubTab?: PengaturanSubTab;
  masterItems: MasterItem[];
  masterUnits: MasterUnit[];
  conversionRules: UnitConversionRule[];
  itemFormulas: ItemUnitFormula[];
  onSaveItems: (items: MasterItem[]) => Promise<void> | void;
  onSaveUnits: (units: MasterUnit[]) => Promise<void> | void;
  onSaveConversionRules: (rules: UnitConversionRule[]) => Promise<void> | void;
  onSaveItemFormulas: (formulas: ItemUnitFormula[]) => Promise<void> | void;
}

export const Menu4Pengaturan: React.FC<Menu4PengaturanProps> = ({
  initialSubTab = 'rumus',
  masterItems,
  masterUnits,
  conversionRules,
  itemFormulas,
  onSaveItems,
  onSaveUnits,
  onSaveConversionRules,
  onSaveItemFormulas,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<PengaturanSubTab>(initialSubTab);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // ================= 1. SUB-TAB: RUMUS QUANTITY =================
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFromUnit, setRuleFromUnit] = useState('BOX');
  const [ruleToUnit, setRuleToUnit] = useState('PCS');
  const [ruleMultiplier, setRuleMultiplier] = useState<string | number>(50);
  const [ruleItemTarget, setRuleItemTarget] = useState('');
  const [ruleDescription, setRuleDescription] = useState('1 Box = 50 Pcs');
  const [isImportRumusOpen, setIsImportRumusOpen] = useState(false);

  // Quick Test Calculator state
  const [testQty, setTestQty] = useState<number>(5);
  const [testUnit, setTestUnit] = useState<string>('DUS');

  const testCalcResult = useMemo(() => {
    const rule = conversionRules.find(
      (r) => r.fromUnit.trim().toUpperCase() === testUnit.trim().toUpperCase()
    );
    if (!rule) return null;
    return {
      total: testQty * rule.multiplier,
      toUnit: rule.toUnit,
      ruleText: rule.description || `1 ${rule.fromUnit} = ${rule.multiplier} ${rule.toUnit}`,
    };
  }, [testQty, testUnit, conversionRules]);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const multNum = Number(ruleMultiplier);
    if (!ruleFromUnit.trim() || !ruleToUnit.trim() || isNaN(multNum) || multNum <= 0) {
      showNotification('Mohon lengkapi Satuan Asal, Satuan Terkecil, dan Angka Pengali (> 0).', 'error');
      return;
    }

    const now = new Date().toISOString();
    const cleanFrom = ruleFromUnit.trim().toUpperCase();
    const cleanTo = ruleToUnit.trim().toUpperCase();
    const cleanDesc =
      ruleDescription.trim() || `1 ${cleanFrom} = ${multNum} ${cleanTo}`;

    let updated: UnitConversionRule[];
    if (editingRuleId) {
      updated = conversionRules.map((r) =>
        r.id === editingRuleId
          ? {
              ...r,
              fromUnit: cleanFrom,
              toUnit: cleanTo,
              multiplier: multNum,
              appliesToItem: ruleItemTarget.trim(),
              description: cleanDesc,
              lastUpdated: now,
            }
          : r
      );
      showNotification(`Rumus konversi "${cleanFrom} ke ${cleanTo}" berhasil diperbarui!`);
    } else {
      const newRule: UnitConversionRule = {
        id: `conv-${Date.now()}`,
        fromUnit: cleanFrom,
        toUnit: cleanTo,
        multiplier: multNum,
        appliesToItem: ruleItemTarget.trim(),
        description: cleanDesc,
        lastUpdated: now,
      };
      updated = [newRule, ...conversionRules];
      showNotification(`Rumus konversi baru "${cleanDesc}" berhasil ditambahkan!`);
    }

    await onSaveConversionRules(updated);
    handleResetRuleForm();
  };

  const handleResetRuleForm = () => {
    setEditingRuleId(null);
    setRuleFromUnit('BOX');
    setRuleToUnit('PCS');
    setRuleMultiplier(50);
    setRuleItemTarget('');
    setRuleDescription('');
  };

  const handleStartEditRule = (r: UnitConversionRule) => {
    setEditingRuleId(r.id);
    setRuleFromUnit(r.fromUnit);
    setRuleToUnit(r.toUnit);
    setRuleMultiplier(r.multiplier);
    setRuleItemTarget(r.appliesToItem || '');
    setRuleDescription(r.description || '');
  };

  const handleDeleteRule = async (id: string) => {
    const updated = conversionRules.filter((r) => r.id !== id);
    await onSaveConversionRules(updated);
    showNotification('Rumus konversi berhasil dihapus.');
  };

  const handleExportRumusExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<UnitConversionRule>[] = [
      { header: 'No', accessor: (_r, i) => i + 1 },
      { header: 'Satuan Asal', key: 'fromUnit' },
      { header: 'Satuan Terkecil', key: 'toUnit' },
      { header: 'Rasio Pengali', key: 'multiplier' },
      { header: 'Cakupan Barang', accessor: (r) => r.appliesToItem || 'Semua Barang' },
      { header: 'Deskripsi Rumus', key: 'description' },
    ];
    exportToExcelXml(conversionRules, cols, `KMI_Rumus_Konversi_${dateStr}.xls`, 'Rumus_Konversi');
  };

  const handleExportRumusCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<UnitConversionRule>[] = [
      { header: 'satuan_asal', key: 'fromUnit' },
      { header: 'satuan_terkecil', key: 'toUnit' },
      { header: 'pengali', key: 'multiplier' },
      { header: 'cakupan_barang', accessor: (r) => r.appliesToItem || '' },
      { header: 'deskripsi', key: 'description' },
    ];
    exportToCsv(conversionRules, cols, `KMI_Rumus_Konversi_${dateStr}.csv`);
  };

  const handleApplyImportRumus = (rows: string[][], headers: string[]) => {
    if (rows.length === 0) return { success: false, message: 'File CSV kosong.' };

    const hLower = headers.map((h) => h.toLowerCase());
    let fromIdx = hLower.findIndex((h) => h.includes('asal') || h.includes('from'));
    let toIdx = hLower.findIndex((h) => h.includes('terkecil') || h.includes('to') || h.includes('target'));
    let multIdx = hLower.findIndex((h) => h.includes('pengali') || h.includes('multiplier') || h.includes('rasio'));
    let descIdx = hLower.findIndex((h) => h.includes('deskripsi') || h.includes('desc') || h.includes('keterangan'));

    if (fromIdx === -1) fromIdx = 0;
    if (toIdx === -1) toIdx = 1;
    if (multIdx === -1) multIdx = 2;

    const now = new Date().toISOString();
    let imported = 0;
    const newRules: UnitConversionRule[] = [...conversionRules];

    rows.forEach((row, idx) => {
      const fromU = row[fromIdx]?.trim().toUpperCase();
      const toU = row[toIdx]?.trim().toUpperCase();
      const multVal = parseFloat(row[multIdx]?.trim() || '0');
      const descVal = descIdx >= 0 ? row[descIdx]?.trim() : '';

      if (fromU && toU && !isNaN(multVal) && multVal > 0) {
        const existingIdx = newRules.findIndex((r) => r.fromUnit === fromU && r.toUnit === toU);
        if (existingIdx >= 0) {
          newRules[existingIdx] = {
            ...newRules[existingIdx],
            multiplier: multVal,
            description: descVal || `1 ${fromU} = ${multVal} ${toU}`,
            lastUpdated: now,
          };
        } else {
          newRules.push({
            id: `conv-imp-${Date.now()}-${idx}`,
            fromUnit: fromU,
            toUnit: toU,
            multiplier: multVal,
            description: descVal || `1 ${fromU} = ${multVal} ${toU}`,
            lastUpdated: now,
          });
        }
        imported++;
      }
    });

    onSaveConversionRules(newRules);
    return {
      success: true,
      count: imported,
      message: `Berhasil mengimpor ${imported} rumus konversi kuantitas!`,
    };
  };

  // ================= 2. SUB-TAB: DAFTAR NAMA BARANG =================
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemCategory, setItemCategory] = useState('APD');
  const [itemUnit, setItemUnit] = useState('PCS');
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [isImportBarangOpen, setIsImportBarangOpen] = useState(false);

  const filteredMasterItems = useMemo(() => {
    return masterItems.filter((it) => {
      const q = searchItemQuery.toLowerCase();
      return it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q);
    });
  }, [masterItems, searchItemQuery]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      showNotification('Nama barang wajib diisi.', 'error');
      return;
    }

    let updated: MasterItem[];
    if (editingItemId) {
      updated = masterItems.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              name: itemName.trim(),
              code: itemCode.trim() || `ITM-${Date.now().toString().slice(-4)}`,
              category: itemCategory.trim(),
              defaultUnit: itemUnit.trim().toUpperCase(),
            }
          : it
      );
      showNotification(`Barang "${itemName}" berhasil diperbarui!`);
    } else {
      const newItem: MasterItem = {
        id: `item-${Date.now()}`,
        name: itemName.trim(),
        code: itemCode.trim() || `ITM-${(masterItems.length + 1).toString().padStart(3, '0')}`,
        category: itemCategory.trim() || 'Umum',
        defaultUnit: itemUnit.trim().toUpperCase() || 'PCS',
      };
      updated = [newItem, ...masterItems];
      showNotification(`Barang baru "${itemName}" berhasil ditambahkan!`);
    }

    await onSaveItems(updated);
    handleResetItemForm();
  };

  const handleResetItemForm = () => {
    setEditingItemId(null);
    setItemName('');
    setItemCode('');
    setItemCategory('APD');
    setItemUnit('PCS');
  };

  const handleStartEditItem = (item: MasterItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemCode(item.code);
    setItemCategory(item.category || 'APD');
    setItemUnit(item.defaultUnit || 'PCS');
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Hapus barang "${name}" dari master data?`)) return;
    const updated = masterItems.filter((it) => it.id !== id);
    await onSaveItems(updated);
    showNotification(`Barang "${name}" berhasil dihapus.`);
  };

  const handleExportBarangExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<MasterItem>[] = [
      { header: 'No', accessor: (_r, i) => i + 1 },
      { header: 'Kode Barang', key: 'code' },
      { header: 'Nama Barang', key: 'name' },
      { header: 'Kategori', key: 'category' },
      { header: 'Satuan Default', key: 'defaultUnit' },
    ];
    exportToExcelXml(masterItems, cols, `KMI_Daftar_Barang_${dateStr}.xls`, 'Daftar_Barang');
  };

  const handleExportBarangCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<MasterItem>[] = [
      { header: 'name', key: 'name' },
      { header: 'code', key: 'code' },
      { header: 'category', key: 'category' },
      { header: 'defaultUnit', key: 'defaultUnit' },
    ];
    exportToCsv(masterItems, cols, `daftar-barang-${dateStr}.csv`);
  };

  const handleApplyImportBarang = (rows: string[][], headers: string[]) => {
    if (rows.length === 0) return { success: false, message: 'File CSV kosong.' };

    const hLower = headers.map((h) => h.toLowerCase());
    let nameIdx = hLower.findIndex((h) => h.includes('name') || h.includes('nama') || h.includes('barang'));
    let codeIdx = hLower.findIndex((h) => h.includes('code') || h.includes('kode'));
    let catIdx = hLower.findIndex((h) => h.includes('category') || h.includes('kategori'));
    let unitIdx = hLower.findIndex((h) => h.includes('unit') || h.includes('satuan'));

    if (nameIdx === -1 && codeIdx === -1) {
      nameIdx = 0;
      codeIdx = 1;
    } else if (nameIdx === -1) {
      nameIdx = 0;
    }

    const newItems: MasterItem[] = [...masterItems];
    let imported = 0;

    rows.forEach((row, idx) => {
      const nameVal = row[nameIdx]?.trim();
      const codeVal = codeIdx >= 0 ? row[codeIdx]?.trim() : '';
      const catVal = catIdx >= 0 ? row[catIdx]?.trim() : 'Umum';
      const unitVal = unitIdx >= 0 ? row[unitIdx]?.trim().toUpperCase() : 'PCS';

      if (nameVal && nameVal.length > 0) {
        const existIdx = newItems.findIndex(
          (it) =>
            (codeVal && it.code.toLowerCase() === codeVal.toLowerCase()) ||
            it.name.toLowerCase() === nameVal.toLowerCase()
        );

        if (existIdx >= 0) {
          newItems[existIdx] = {
            ...newItems[existIdx],
            name: nameVal,
            code: codeVal || newItems[existIdx].code,
            category: catVal || newItems[existIdx].category,
            defaultUnit: unitVal || newItems[existIdx].defaultUnit,
          };
        } else {
          newItems.push({
            id: `item-imp-${Date.now()}-${idx}`,
            name: nameVal,
            code: codeVal || `ITM-${String(newItems.length + 1).padStart(3, '0')}`,
            category: catVal || 'Umum',
            defaultUnit: unitVal || 'PCS',
          });
        }
        imported++;
      }
    });

    onSaveItems(newItems);
    return {
      success: true,
      count: imported,
      message: `Berhasil mengimpor dan memperbarui ${imported} master barang!`,
    };
  };

  // ================= 3. SUB-TAB: DAFTAR KUANTITAS (SATUAN) =================
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [searchUnitQuery, setSearchUnitQuery] = useState('');
  const [isImportSatuanOpen, setIsImportSatuanOpen] = useState(false);

  const filteredMasterUnits = useMemo(() => {
    return masterUnits.filter((u) => {
      const q = searchUnitQuery.toLowerCase();
      return u.code.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
    });
  }, [masterUnits, searchUnitQuery]);

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = unitCode.trim().toUpperCase();
    if (!cleanCode) {
      showNotification('Kode satuan kuantitas wajib diisi.', 'error');
      return;
    }

    let updated: MasterUnit[];
    if (editingUnitId) {
      updated = masterUnits.map((u) =>
        u.id === editingUnitId
          ? { ...u, code: cleanCode, name: unitName.trim() || cleanCode }
          : u
      );
      showNotification(`Satuan "${cleanCode}" berhasil diperbarui!`);
    } else {
      const newUnit: MasterUnit = {
        id: `unit-${Date.now()}`,
        code: cleanCode,
        name: unitName.trim() || cleanCode,
      };
      updated = [...masterUnits, newUnit];
      showNotification(`Satuan kuantitas baru "${cleanCode}" berhasil ditambahkan!`);
    }

    await onSaveUnits(updated);
    handleResetUnitForm();
  };

  const handleResetUnitForm = () => {
    setEditingUnitId(null);
    setUnitCode('');
    setUnitName('');
  };

  const handleStartEditUnit = (u: MasterUnit) => {
    setEditingUnitId(u.id);
    setUnitCode(u.code);
    setUnitName(u.name);
  };

  const handleDeleteUnit = async (id: string, code: string) => {
    if (masterUnits.length <= 1) {
      showNotification('Minimal harus menyisakan 1 satuan kuantitas.', 'error');
      return;
    }
    const updated = masterUnits.filter((u) => u.id !== id);
    await onSaveUnits(updated);
    showNotification(`Satuan "${code}" berhasil dihapus.`);
  };

  const handleExportSatuanExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<MasterUnit>[] = [
      { header: 'No', accessor: (_r, i) => i + 1 },
      { header: 'Kode Satuan (U/M)', key: 'code' },
      { header: 'Nama Satuan Lengkap', key: 'name' },
    ];
    exportToExcelXml(masterUnits, cols, `KMI_Daftar_Satuan_${dateStr}.xls`, 'Daftar_Satuan');
  };

  const handleExportSatuanCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<MasterUnit>[] = [
      { header: 'code', key: 'code' },
      { header: 'name', key: 'name' },
    ];
    exportToCsv(masterUnits, cols, `daftar-satuan-${dateStr}.csv`);
  };

  const handleApplyImportSatuan = (rows: string[][], headers: string[]) => {
    if (rows.length === 0) return { success: false, message: 'File CSV kosong.' };

    const hLower = headers.map((h) => h.toLowerCase());
    let codeIdx = hLower.findIndex((h) => h.includes('code') || h.includes('kode') || h.includes('satuan'));
    let nameIdx = hLower.findIndex((h) => h.includes('name') || h.includes('nama'));

    if (codeIdx === -1) codeIdx = 0;
    if (nameIdx === -1) nameIdx = 1;

    const newUnits: MasterUnit[] = [...masterUnits];
    let imported = 0;

    rows.forEach((row, idx) => {
      const codeVal = row[codeIdx]?.trim().toUpperCase();
      const nameVal = nameIdx >= 0 ? row[nameIdx]?.trim() : codeVal;

      if (codeVal && codeVal.length > 0) {
        const existIdx = newUnits.findIndex((u) => u.code === codeVal);
        if (existIdx >= 0) {
          newUnits[existIdx] = {
            ...newUnits[existIdx],
            name: nameVal || codeVal,
          };
        } else {
          newUnits.push({
            id: `unit-imp-${Date.now()}-${idx}`,
            code: codeVal,
            name: nameVal || codeVal,
          });
        }
        imported++;
      }
    });

    onSaveUnits(newUnits);
    return {
      success: true,
      count: imported,
      message: `Berhasil mengimpor dan memperbarui ${imported} satuan kuantitas!`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
              : 'bg-red-50 border-red-400 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sub-Tabs Nav: 1. Rumus, 2. Daftar Nama Barang, 3. Daftar Kuantitas */}
      <div className="flex border-b border-stone-300 bg-stone-100 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveSubTab('rumus')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'rumus'
              ? 'bg-white text-stone-900 shadow-2xs border border-stone-300'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-blue-600" />
          <span>1. Update Satuan Terkecil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('barang')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'barang'
              ? 'bg-white text-stone-900 shadow-2xs border border-stone-300'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          <span>2. Daftar Nama Barang</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('kuantitas')}
          className={`flex-1 py-2 px-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'kuantitas'
              ? 'bg-white text-stone-900 shadow-2xs border border-stone-300'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-purple-600" />
          <span>3. Daftar Kuantitas (U/M)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. SUB-TAB: RUMUS QUANTITY KE SATUAN TERKECIL                  */}
      {/* ============================================================== */}
      {activeSubTab === 'rumus' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Exact table structure matching user screenshot: Update Satuan Terkecil */}
          <UpdateSatuanTerkecilTable
            masterItems={masterItems}
            masterUnits={masterUnits}
            itemFormulas={itemFormulas}
            onSaveItemFormulas={onSaveItemFormulas}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. SUB-TAB: UPDATE DAFTAR NAMA BARANG                           */}
      {/* ============================================================== */}
      {activeSubTab === 'barang' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Form Tambah/Edit Master Barang */}
          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs">
            <h3 className="font-extrabold text-stone-900 text-sm mb-3 flex items-center justify-between">
              <span>{editingItemId ? 'Edit Master Barang' : 'Tambah Master Nama Barang Baru'}</span>
              {editingItemId && (
                <button
                  type="button"
                  onClick={handleResetItemForm}
                  className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </h3>

            <form onSubmit={handleSaveItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-700 mb-1">Nama Barang :</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Isolasi Kertas 2 inch"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Kode Barang :</label>
                <input
                  type="text"
                  placeholder="Contoh: APD025 / RKE050"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Satuan Default (U/M) :</label>
                <select
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-bold uppercase focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {masterUnits.map((u) => (
                    <option key={u.id} value={u.code}>
                      {u.code} - {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 flex items-center justify-end gap-2 pt-1 border-t border-stone-200">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingItemId ? 'Simpan Perubahan Barang' : 'Simpan Barang Baru'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Action Header for Barang Table */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
              <input
                type="text"
                value={searchItemQuery}
                onChange={(e) => setSearchItemQuery(e.target.value)}
                placeholder="Cari master barang..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportBarangOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Import Barang (CSV)</span>
              </button>
              <button
                type="button"
                onClick={handleExportBarangExcel}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Barang (Excel)</span>
              </button>
            </div>
          </div>

          {/* Table Master Barang */}
          <div className="bg-white border border-stone-300 rounded-xl overflow-hidden shadow-2xs max-h-96 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#eef5ef] text-stone-800 font-bold sticky top-0 border-b border-stone-300">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-28">Kode</th>
                  <th className="p-2.5">Nama Barang</th>
                  <th className="p-2.5 w-24">Satuan</th>
                  <th className="p-2.5 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredMasterItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="p-2.5 text-center text-stone-500 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-stone-700">{item.code}</td>
                    <td className="p-2.5 font-bold text-stone-900">{item.name}</td>
                    <td className="p-2.5 uppercase font-semibold text-stone-600">{item.defaultUnit}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditItem(item)}
                          className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ImportModal
            isOpen={isImportBarangOpen}
            onClose={() => setIsImportBarangOpen(false)}
            title="Import Daftar Nama Barang (CSV)"
            description="Upload file CSV master barang untuk memperbarui atau menambahkan daftar nama barang."
            templateFileName="template_daftar_barang_kmi.csv"
            templateCsvContent={`name,code,category,defaultUnit\nIsolasi bening 2 inch,APD050,APD,PCS\nOli Mesin Hidrolik 68,RKE080,Raw Material,LITER\n`}
            expectedColumnsDescription="Kolom: name, code, category, defaultUnit"
            onApplyImport={handleApplyImportBarang}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SUB-TAB: UPDATE DAFTAR KUANTITAS (SATUAN)                    */}
      {/* ============================================================== */}
      {activeSubTab === 'kuantitas' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Form Tambah/Edit Master Satuan */}
          <div className="bg-white p-4 rounded-xl border border-stone-300 shadow-2xs">
            <h3 className="font-extrabold text-stone-900 text-sm mb-3 flex items-center justify-between">
              <span>{editingUnitId ? 'Edit Satuan Kuantitas' : 'Tambah Satuan Kuantitas Baru (U/M)'}</span>
              {editingUnitId && (
                <button
                  type="button"
                  onClick={handleResetUnitForm}
                  className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </h3>

            <form onSubmit={handleSaveUnit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Kode Satuan (Singkatan) :</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PCS / LITER / ROLL"
                  value={unitCode}
                  onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg font-bold uppercase focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Satuan Lengkap :</label>
                <input
                  type="text"
                  placeholder="Contoh: Pieces / Liter / Meter"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingUnitId ? 'Simpan Satuan' : 'Tambah Satuan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Action Header for Satuan Table */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
              <input
                type="text"
                value={searchUnitQuery}
                onChange={(e) => setSearchUnitQuery(e.target.value)}
                placeholder="Cari satuan..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportSatuanOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                <span>Import Satuan (CSV)</span>
              </button>
              <button
                type="button"
                onClick={handleExportSatuanExcel}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Satuan (Excel)</span>
              </button>
            </div>
          </div>

          {/* Table Satuan */}
          <div className="bg-white border border-stone-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f5eef9] text-stone-800 font-bold border-b border-stone-300">
                <tr>
                  <th className="p-2.5 w-10 text-center">#</th>
                  <th className="p-2.5 w-32">Kode Satuan</th>
                  <th className="p-2.5">Nama Satuan Lengkap</th>
                  <th className="p-2.5 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredMasterUnits.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="p-2.5 text-center text-stone-500 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-black uppercase text-purple-900">{u.code}</td>
                    <td className="p-2.5 text-stone-800 font-medium">{u.name}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditUnit(u)}
                          className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(u.id, u.code)}
                          className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ImportModal
            isOpen={isImportSatuanOpen}
            onClose={() => setIsImportSatuanOpen(false)}
            title="Import Daftar Kuantitas Satuan (CSV)"
            description="Upload file CSV berisi daftar satuan kuantitas (U/M)."
            templateFileName="template_daftar_satuan_kmi.csv"
            templateCsvContent={`code,name\nPCS,Pieces\nLITER,Liter\nBOX,Kotak\n`}
            expectedColumnsDescription="Kolom: code, name (atau 1 satuan per baris)"
            onApplyImport={handleApplyImportSatuan}
          />
        </div>
      )}
    </div>
  );
};
