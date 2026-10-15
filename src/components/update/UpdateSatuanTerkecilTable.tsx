import React, { useState, useMemo } from 'react';
import {
  Search,
  Save,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react';
import { ItemUnitFormula, MasterItem, MasterUnit } from '../../types';
import { exportToExcelXml, exportToCsv, ExportColumn } from '../../utils/excelExport';
import { ImportModal } from './ImportModal';

interface UpdateSatuanTerkecilTableProps {
  masterItems: MasterItem[];
  masterUnits: MasterUnit[];
  itemFormulas: ItemUnitFormula[];
  onSaveItemFormulas: (formulas: ItemUnitFormula[]) => Promise<void> | void;
}

export const UpdateSatuanTerkecilTable: React.FC<UpdateSatuanTerkecilTableProps> = ({
  masterItems,
  masterUnits,
  itemFormulas,
  onSaveItemFormulas,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSatuanFilter, setSelectedSatuanFilter] = useState('all');

  // Mode: 'rumus' (mengatur faktor konversi per unit) vs 'input' (memasukkan qty input dan menghitung total output/input)
  const [viewMode, setViewMode] = useState<'rumus' | 'input'>('rumus');

  // Dynamic unit columns list - default exactly as in user image: pcs, liter, kg, box, derigen, dst
  const [unitColumns, setUnitColumns] = useState<string[]>([
    'pcs',
    'liter',
    'kg',
    'box',
    'derigen',
    'pack',
    'drum',
  ]);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumnInput, setShowAddColumnInput] = useState(false);

  // Local draft state for formulas
  const [draftData, setDraftData] = useState<Record<string, ItemUnitFormula>>({});
  const [dirtyCodes, setDirtyCodes] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Merge master items with saved itemFormulas
  const mergedItems = useMemo(() => {
    const formulaMap = new Map(itemFormulas.map((f) => [f.code.toLowerCase(), f]));
    const nameMap = new Map(itemFormulas.map((f) => [f.name.toLowerCase(), f]));

    return masterItems.map((m, idx) => {
      const code = m.code || `ITM-${String(idx + 1).padStart(3, '0')}`;
      const existing = formulaMap.get(code.toLowerCase()) || nameMap.get(m.name.toLowerCase());

      const defaultU = (m.defaultUnit || 'pcs').toLowerCase();
      const isLiquid =
        defaultU === 'liter' ||
        m.name.toLowerCase().includes('oli') ||
        m.name.toLowerCase().includes('tiner') ||
        m.name.toLowerCase().includes('bensin');
      const isWeight =
        defaultU === 'kg' ||
        m.name.toLowerCase().includes('rod') ||
        m.name.toLowerCase().includes('compound');
      const fallbackSatuan = isLiquid ? 'liter' : isWeight ? 'kg' : 'pcs';

      const draft = draftData[code];
      const satuanTerkecil = draft?.satuanTerkecil || existing?.satuanTerkecil || fallbackSatuan;

      const unitFactors: Record<string, number> = {
        pcs: satuanTerkecil === 'pcs' ? 1 : 0,
        liter: satuanTerkecil === 'liter' ? 1 : 0,
        kg: satuanTerkecil === 'kg' ? 1 : 0,
        box: satuanTerkecil === 'pcs' ? 50 : 20,
        derigen: satuanTerkecil === 'liter' ? 20 : 0,
        pack: satuanTerkecil === 'pcs' ? 10 : 0,
        drum: satuanTerkecil === 'liter' ? 200 : 0,
        ...(existing?.unitFactors || {}),
        ...(draft?.unitFactors || {}),
      };

      const unitInputs: Record<string, number> = {
        pcs: 0,
        liter: 0,
        kg: 0,
        box: 0,
        derigen: 0,
        pack: 0,
        drum: 0,
        ...(existing?.unitInputs || {}),
        ...(draft?.unitInputs || {}),
      };

      // Calculate Total Output & Total Input
      let totalOutput = 0;
      let totalInput = 0;

      if (viewMode === 'input') {
        unitColumns.forEach((col) => {
          const inVal = Number(unitInputs[col]) || 0;
          const factor = Number(unitFactors[col]) || 0;
          totalInput += inVal;
          totalOutput += inVal * (factor > 0 ? factor : 1);
        });
      } else {
        // Mode Rumus: Total Output adalah akumulasi rumus faktor yang aktif
        let activeFactorCount = 0;
        unitColumns.forEach((col) => {
          const factor = Number(unitFactors[col]) || 0;
          if (factor > 0) {
            totalOutput += factor;
            activeFactorCount++;
          }
        });
        totalInput = activeFactorCount;
      }

      return {
        code,
        name: m.name,
        satuanTerkecil,
        unitFactors,
        unitInputs,
        totalOutput,
        totalInput,
        isDirty: dirtyCodes.has(code),
      };
    });
  }, [masterItems, itemFormulas, draftData, dirtyCodes, viewMode, unitColumns]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return mergedItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (selectedSatuanFilter !== 'all' && item.satuanTerkecil.toLowerCase() !== selectedSatuanFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [mergedItems, searchQuery, selectedSatuanFilter]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Change handlers
  const handleSatuanTerkecilChange = (code: string, newSatuan: string, item: typeof mergedItems[0]) => {
    setDraftData((prev) => {
      const current = prev[code] || { ...item };
      return {
        ...prev,
        [code]: {
          ...current,
          satuanTerkecil: newSatuan.toLowerCase(),
        },
      };
    });
    setDirtyCodes((prev) => new Set(prev).add(code));
  };

  const handleCellFactorChange = (code: string, unitCol: string, val: string, item: typeof mergedItems[0]) => {
    const num = parseFloat(val) || 0;
    setDraftData((prev) => {
      const current = prev[code] || { ...item };
      const nextFactors = { ...current.unitFactors, [unitCol]: num };
      return {
        ...prev,
        [code]: {
          ...current,
          unitFactors: nextFactors,
        },
      };
    });
    setDirtyCodes((prev) => new Set(prev).add(code));
  };

  const handleCellInputChange = (code: string, unitCol: string, val: string, item: typeof mergedItems[0]) => {
    const num = parseFloat(val) || 0;
    setDraftData((prev) => {
      const current = prev[code] || { ...item };
      const nextInputs = { ...current.unitInputs, [unitCol]: num };
      return {
        ...prev,
        [code]: {
          ...current,
          unitInputs: nextInputs,
        },
      };
    });
    setDirtyCodes((prev) => new Set(prev).add(code));
  };

  const handleAddUnitColumn = () => {
    const clean = newColumnName.trim().toLowerCase();
    if (!clean) return;
    if (unitColumns.includes(clean)) {
      showNotification(`Kolom "${clean}" sudah ada di tabel.`, 'info');
      return;
    }
    setUnitColumns((prev) => [...prev, clean]);
    setNewColumnName('');
    setShowAddColumnInput(false);
    showNotification(`Kolom satuan "${clean}" berhasil ditambahkan!`);
  };

  const handleRemoveUnitColumn = (colName: string) => {
    if (unitColumns.length <= 2) return;
    setUnitColumns((prev) => prev.filter((c) => c !== colName));
    showNotification(`Kolom "${colName}" dihapus dari tampilan tabel.`, 'info');
  };

  const handleSaveAll = async () => {
    if (dirtyCodes.size === 0) return;

    const now = new Date().toISOString();
    const updated = mergedItems.map((m) => {
      const draft = draftData[m.code];
      return {
        code: m.code,
        name: m.name,
        satuanTerkecil: draft?.satuanTerkecil || m.satuanTerkecil,
        unitFactors: draft?.unitFactors || m.unitFactors,
        unitInputs: draft?.unitInputs || m.unitInputs,
        totalOutput: m.totalOutput,
        totalInput: m.totalInput,
        lastUpdated: now,
      };
    });

    await onSaveItemFormulas(updated);
    setDraftData({});
    setDirtyCodes(new Set());
    showNotification(`Berhasil menyimpan Update Satuan Terkecil untuk ${dirtyCodes.size} barang!`);
  };

  const handleResetAll = () => {
    setDraftData({});
    setDirtyCodes(new Set());
    showNotification('Semua perubahan yang belum disimpan telah dibatalkan.', 'info');
  };

  // Export handlers matching user table
  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<typeof mergedItems[0]>[] = [
      { header: 'Code Barang', key: 'code' },
      { header: 'Nama Barang', key: 'name' },
      { header: 'Satuan Terkecil', key: 'satuanTerkecil' },
      ...unitColumns.map((u) => ({
        header: u,
        accessor: (r: typeof mergedItems[0]) =>
          viewMode === 'input' ? r.unitInputs[u] || 0 : r.unitFactors[u] || 0,
      })),
      { header: 'Total Output', key: 'totalOutput' },
      { header: 'Total Input', key: 'totalInput' },
    ];

    exportToExcelXml(
      mergedItems,
      cols,
      `Update_Satuan_Terkecil_${dateStr}.xls`,
      'Satuan_Terkecil'
    );
  };

  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cols: ExportColumn<typeof mergedItems[0]>[] = [
      { header: 'Code Barang', key: 'code' },
      { header: 'Nama Barang', key: 'name' },
      { header: 'Satuan Terkecil', key: 'satuanTerkecil' },
      ...unitColumns.map((u) => ({
        header: u,
        accessor: (r: typeof mergedItems[0]) =>
          viewMode === 'input' ? r.unitInputs[u] || 0 : r.unitFactors[u] || 0,
      })),
      { header: 'Total Output', key: 'totalOutput' },
      { header: 'Total Input', key: 'totalInput' },
    ];

    exportToCsv(mergedItems, cols, `Update_Satuan_Terkecil_${dateStr}.csv`);
  };

  const handleApplyImport = (rows: string[][], headers: string[]) => {
    if (rows.length === 0) return { success: false, message: 'File CSV kosong.' };

    const hLower = headers.map((h) => h.toLowerCase().trim());
    let codeIdx = hLower.findIndex((h) => h.includes('code') || h.includes('kode'));
    let nameIdx = hLower.findIndex((h) => h.includes('nama') || h.includes('name') || h.includes('barang'));
    let satIdx = hLower.findIndex((h) => h.includes('terkecil') || h.includes('satuan'));

    if (codeIdx === -1 && nameIdx === -1) {
      codeIdx = 0;
      nameIdx = 1;
    }

    const unitColIndexes: { colName: string; idx: number }[] = [];
    unitColumns.forEach((u) => {
      const fIdx = hLower.findIndex((h) => h === u.toLowerCase());
      if (fIdx >= 0) unitColIndexes.push({ colName: u, idx: fIdx });
    });

    let count = 0;
    const now = new Date().toISOString();
    const updated = [...itemFormulas];

    rows.forEach((row) => {
      const codeVal = codeIdx >= 0 ? row[codeIdx]?.trim() : '';
      const nameVal = nameIdx >= 0 ? row[nameIdx]?.trim() : '';
      const satVal = satIdx >= 0 ? row[satIdx]?.trim().toLowerCase() : '';

      const existIdx = updated.findIndex((f) => {
        if (codeVal && f.code.toLowerCase() === codeVal.toLowerCase()) return true;
        if (nameVal && f.name.toLowerCase() === nameVal.toLowerCase()) return true;
        return false;
      });

      const parsedFactors: Record<string, number> = {};
      unitColIndexes.forEach(({ colName, idx }) => {
        const num = parseFloat(row[idx]?.trim() || '0');
        if (!isNaN(num)) parsedFactors[colName] = num;
      });

      if (existIdx >= 0) {
        count++;
        updated[existIdx] = {
          ...updated[existIdx],
          satuanTerkecil: satVal || updated[existIdx].satuanTerkecil,
          unitFactors: { ...updated[existIdx].unitFactors, ...parsedFactors },
          lastUpdated: now,
        };
      } else if (codeVal || nameVal) {
        count++;
        updated.push({
          code: codeVal || `ITM-${count}`,
          name: nameVal || codeVal,
          satuanTerkecil: satVal || 'pcs',
          unitFactors: parsedFactors,
          lastUpdated: now,
        });
      }
    });

    onSaveItemFormulas(updated);
    setDraftData({});
    setDirtyCodes(new Set());

    return {
      success: true,
      count,
      message: `Berhasil mengimpor dan memperbarui Satuan Terkecil untuk ${count} barang!`,
    };
  };

  return (
    <div className="space-y-4 font-sans text-stone-900 animate-in fade-in">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
              : 'bg-blue-50 border-blue-400 text-blue-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Card Header matching user screenshot */}
      <div className="bg-white p-4 rounded-xl border border-stone-800 shadow-xs space-y-3">
        {/* Title exact as user image: "Update Satuan Terkecil" */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-black tracking-wide">
              Update Satuan Terkecil
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Atur rumus konversi dan kuantitas per satuan ke satuan terkecil per jenis barang.
            </p>
          </div>

          {/* Mode Switch: Mode Rumus vs Mode Input Qty */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-stone-100 border border-stone-300 rounded-lg text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('rumus')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'rumus'
                    ? 'bg-white text-black shadow-2xs border border-stone-300 font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Atur rasio konversi (1 box = berapa pcs, dll)"
              >
                Faktor Rumus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('input')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'input'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Input kuantitas kemasan dan hitung otomatis Total Output & Input"
              >
                Input Qty (Kalkulasi)
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Add Column & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Left: Search & Filter Satuan Terkecil */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Code / Nama Barang..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={selectedSatuanFilter}
              onChange={(e) => setSelectedSatuanFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="all">Semua Satuan Terkecil</option>
              <option value="pcs">Satuan: pcs</option>
              <option value="liter">Satuan: liter</option>
              <option value="kg">Satuan: kg</option>
              <option value="meter">Satuan: meter</option>
            </select>
          </div>

          {/* Right: Actions, Add Column, Import/Export, Save */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Column (dst) button */}
            {showAddColumnInput ? (
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-300">
                <input
                  type="text"
                  placeholder="Nama satuan (misal: sak)..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="px-2 py-1 bg-white border border-stone-300 rounded text-xs w-32 uppercase"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUnitColumn()}
                />
                <button
                  type="button"
                  onClick={handleAddUnitColumn}
                  className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-xs cursor-pointer hover:bg-emerald-700"
                >
                  Tambah
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddColumnInput(false)}
                  className="px-1.5 py-1 text-stone-500 hover:text-stone-800 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddColumnInput(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                title="Tambah kolom satuan baru (dst)"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Kolom Satuan (dst)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            {dirtyCodes.size > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg font-bold text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Batal ({dirtyCodes.size})</span>
              </button>
            )}

            <button
              type="button"
              disabled={dirtyCodes.size === 0}
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-black text-xs cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan ({dirtyCodes.size})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* THE TABLE: EXACT STRUCTURE AS THE USER IMAGE                  */}
      {/* Code Barang | Nama Barang | Satuan Terkecil | Kuantitas [pcs, liter, kg, box, derigen, dst] | Total Output | Total Input */}
      {/* ============================================================== */}
      <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-sm">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Row 1 Header with nested Kuantitas */}
              <tr className="bg-white text-black font-black text-center border-b-2 border-black">
                <th
                  rowSpan={2}
                  className="p-2.5 border-r border-black w-24 bg-stone-50 tracking-wide text-xs"
                >
                  Code Barang
                </th>
                <th
                  rowSpan={2}
                  className="p-2.5 border-r border-black min-w-[200px] bg-stone-50 tracking-wide text-xs text-left"
                >
                  Nama Barang
                </th>
                <th
                  rowSpan={2}
                  className="p-2.5 border-r border-black w-32 bg-stone-50 tracking-wide text-xs"
                >
                  Satuan Terkecil
                </th>
                <th
                  colSpan={unitColumns.length}
                  className="p-2 border-r border-black bg-stone-100 tracking-wider text-xs uppercase"
                >
                  Kuantitas
                </th>
                <th
                  rowSpan={2}
                  className="p-2.5 border-r border-black w-28 bg-[#edf7ee] text-emerald-950 tracking-wide text-xs font-black"
                >
                  Total Output
                </th>
                <th
                  rowSpan={2}
                  className="p-2.5 w-28 bg-[#f5f0fa] text-purple-950 tracking-wide text-xs font-black"
                >
                  Total Input
                </th>
              </tr>

              {/* Row 2 Header: sub-columns under Kuantitas (pcs, liter, kg, box, derigen, dst) */}
              <tr className="bg-stone-50 text-black font-bold text-center border-b-2 border-black">
                {unitColumns.map((colName) => (
                  <th
                    key={colName}
                    className="p-1.5 border-r border-black w-20 lowercase font-mono text-[11px] bg-stone-50 relative group"
                  >
                    <span>{colName}</span>
                    {colName !== 'pcs' && colName !== 'liter' && colName !== 'box' && colName !== 'derigen' && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUnitColumn(colName)}
                        className="hidden group-hover:inline-block ml-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Hapus kolom"
                      >
                        ×
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-black/30">
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={unitColumns.length + 5}
                    className="p-8 text-center text-stone-500 font-medium"
                  >
                    Tidak ada barang yang cocok dengan kata kunci "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isDirty = item.isDirty;

                  return (
                    <tr
                      key={item.code}
                      className={`hover:bg-amber-50/50 transition-colors ${
                        isDirty ? 'bg-amber-50/70 font-semibold' : idx % 2 === 1 ? 'bg-stone-50/40' : 'bg-white'
                      }`}
                    >
                      {/* 1. Code Barang */}
                      <td className="p-2 border-r border-black/40 font-mono font-bold text-stone-800 text-center">
                        {item.code}
                      </td>

                      {/* 2. Nama Barang */}
                      <td className="p-2 border-r border-black/40 font-bold text-stone-900 max-w-[220px]">
                        <div className="truncate" title={item.name}>
                          {item.name}
                        </div>
                      </td>

                      {/* 3. Satuan Terkecil */}
                      <td className="p-1.5 border-r border-black/40 text-center">
                        <select
                          value={item.satuanTerkecil}
                          onChange={(e) => handleSatuanTerkecilChange(item.code, e.target.value, item)}
                          className="w-full px-2 py-1 bg-white border border-stone-300 rounded font-black text-center text-xs uppercase focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="pcs">pcs</option>
                          <option value="liter">liter</option>
                          <option value="kg">kg</option>
                          <option value="meter">meter</option>
                          <option value="roll">roll</option>
                          <option value="unit">unit</option>
                          <option value="pack">pack</option>
                        </select>
                      </td>

                      {/* 4. Kuantitas Columns (pcs, liter, kg, box, derigen, dst) */}
                      {unitColumns.map((colName) => {
                        const cellVal =
                          viewMode === 'input'
                            ? item.unitInputs[colName] !== undefined
                              ? item.unitInputs[colName]
                              : ''
                            : item.unitFactors[colName] !== undefined
                            ? item.unitFactors[colName]
                            : '';

                        return (
                          <td
                            key={colName}
                            className={`p-1 border-r border-black/30 text-center ${
                              colName === item.satuanTerkecil
                                ? 'bg-emerald-50/40 font-bold'
                                : ''
                            }`}
                          >
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={cellVal}
                              onChange={(e) =>
                                viewMode === 'input'
                                  ? handleCellInputChange(item.code, colName, e.target.value, item)
                                  : handleCellFactorChange(item.code, colName, e.target.value, item)
                              }
                              placeholder="0"
                              className="w-full px-1.5 py-1 text-center font-mono text-xs border border-stone-200 hover:border-stone-400 focus:border-emerald-600 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                        );
                      })}

                      {/* 5. Total Output */}
                      <td className="p-2 border-r border-black/40 text-right font-black text-emerald-900 bg-[#edf7ee]">
                        <span>{item.totalOutput.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-700 ml-1 font-semibold">
                          {item.satuanTerkecil}
                        </span>
                      </td>

                      {/* 6. Total Input */}
                      <td className="p-2 text-right font-black text-purple-900 bg-[#f5f0fa]">
                        <span>{item.totalInput.toLocaleString()}</span>
                        <span className="text-[10px] text-purple-700 ml-1 font-semibold">
                          {viewMode === 'input' ? 'unit' : 'faktor'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info banner */}
        <div className="p-2.5 bg-stone-100 border-t border-black flex flex-wrap items-center justify-between text-[11px] text-stone-600">
          <div className="flex items-center gap-3">
            <span>
              Total Baris: <strong className="text-stone-900">{filteredItems.length}</strong> barang
            </span>
            <span>
              Mode Tampilan:{' '}
              <strong className="text-stone-900">
                {viewMode === 'rumus' ? 'Faktor Rumus Konversi' : 'Input Qty Kemasan'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-500">
              Perubahan disimpan ke backend & otomatis menyinkronkan konversi stok.
            </span>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Update Satuan Terkecil (CSV)"
        description="Upload file CSV berisi Code Barang, Nama Barang, Satuan Terkecil, dan faktor kuantitas per satuan (pcs, liter, kg, box, derigen, dst)."
        templateFileName="template_update_satuan_terkecil_kmi.csv"
        templateCsvContent={`Code Barang,Nama Barang,Satuan Terkecil,pcs,liter,kg,box,derigen\nAPD001,Apron clemek BADAN - aluminium,pcs,1,0,0,50,0\nRKE001,Gas LPG,unit,0,0,0,0,0\nRKE004,Brudaw AL-20 (oli drawing al),liter,0,1,0,0,20\n`}
        expectedColumnsDescription="Kolom: Code Barang, Nama Barang, Satuan Terkecil, pcs, liter, kg, box, derigen, dst"
        onApplyImport={handleApplyImport}
      />
    </div>
  );
};
