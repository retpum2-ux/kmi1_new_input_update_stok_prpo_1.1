import React, { useState, useMemo } from 'react';
import {
  Search,
  Save,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';
import { MasterItem, ItemStock, UnitConversionRule } from '../../types';
import { calculateSmallestUnit } from '../../data/initialUpdateData';
import { exportToExcelXml, exportToCsv, ExportColumn } from '../../utils/excelExport';
import { ImportModal } from './ImportModal';

interface Menu2StokBarangProps {
  masterItems: MasterItem[];
  stocks: ItemStock[];
  conversionRules: UnitConversionRule[];
  onSaveStocks: (newStocks: ItemStock[]) => Promise<void> | void;
}

export const Menu2StokBarang: React.FC<Menu2StokBarangProps> = ({
  masterItems,
  stocks,
  conversionRules,
  onSaveStocks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'safe' | 'low' | 'empty'>('all');

  // Track editable stock changes in a local map: itemId -> edited quantity number
  const [draftStocks, setDraftStocks] = useState<Record<string, number>>({});
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Build full stock list merged with masterItems
  const stockMap = useMemo(() => {
    return new Map(stocks.map((s) => [s.itemName.toLowerCase(), s]));
  }, [stocks]);

  const itemsWithStock = useMemo(() => {
    return masterItems.map((item, idx) => {
      const existing = stockMap.get(item.name.toLowerCase());
      const baseStock = existing ? existing.currentStock : 0;
      const currentStock = draftStocks[item.id] !== undefined ? draftStocks[item.id] : baseStock;
      const isDirty = draftStocks[item.id] !== undefined && draftStocks[item.id] !== baseStock;

      const unit = existing?.unit || item.defaultUnit || 'PCS';
      const smallest = calculateSmallestUnit(currentStock, unit, item.name, conversionRules);

      return {
        id: item.id,
        code: item.code || existing?.itemCode || `ITM-${idx + 1}`,
        name: item.name,
        category: item.category || 'Umum',
        unit,
        baseStock,
        currentStock,
        isDirty,
        smallestUnitDisplay: smallest
          ? `${smallest.convertedQty.toLocaleString()} ${smallest.smallestUnit}`
          : '-',
        lastUpdated: existing?.lastUpdated || '',
      };
    });
  }, [masterItems, stockMap, draftStocks, conversionRules]);

  // Categories
  const categories = useMemo(() => {
    return Array.from(new Set(masterItems.map((it) => it.category || 'Umum')));
  }, [masterItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return itemsWithStock.filter((it) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;

      if (stockStatusFilter === 'empty' && it.currentStock !== 0) return false;
      if (stockStatusFilter === 'low' && (it.currentStock <= 0 || it.currentStock > 10)) return false;
      if (stockStatusFilter === 'safe' && it.currentStock <= 10) return false;

      return true;
    });
  }, [itemsWithStock, searchQuery, categoryFilter, stockStatusFilter]);

  // Dirty count
  const dirtyCount = useMemo(() => {
    return itemsWithStock.filter((it) => it.isDirty).length;
  }, [itemsWithStock]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Stock edit handlers
  const handleStockChange = (itemId: string, val: string | number) => {
    const num = Math.max(0, parseInt(String(val), 10) || 0);
    setDraftStocks((prev) => ({ ...prev, [itemId]: num }));
  };

  const handleStockStep = (itemId: string, currentVal: number, step: number) => {
    const nextVal = Math.max(0, currentVal + step);
    setDraftStocks((prev) => ({ ...prev, [itemId]: nextVal }));
  };

  const handleResetRow = (itemId: string) => {
    setDraftStocks((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleSaveRow = async (item: typeof itemsWithStock[0]) => {
    const newQty = item.currentStock;
    const now = new Date().toISOString();

    const updated = stocks.map((s) =>
      s.itemName.toLowerCase() === item.name.toLowerCase()
        ? { ...s, currentStock: newQty, lastUpdated: now }
        : s
    );

    // If item not yet in stocks array, add it
    if (!stocks.some((s) => s.itemName.toLowerCase() === item.name.toLowerCase())) {
      updated.push({
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: newQty,
        lastUpdated: now,
      });
    }

    await onSaveStocks(updated);

    // Remove from draft
    setDraftStocks((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });

    setSavedRowId(item.id);
    setTimeout(() => setSavedRowId(null), 1500);
    showNotification(`Stok untuk "${item.name}" berhasil disimpan menjadi ${newQty} ${item.unit}.`);
  };

  const handleSaveAll = async () => {
    if (dirtyCount === 0) return;

    const now = new Date().toISOString();
    const updated = [...stocks];

    itemsWithStock.forEach((it) => {
      if (it.isDirty) {
        const idx = updated.findIndex((s) => s.itemName.toLowerCase() === it.name.toLowerCase());
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], currentStock: it.currentStock, lastUpdated: now };
        } else {
          updated.push({
            itemId: it.id,
            itemCode: it.code,
            itemName: it.name,
            category: it.category,
            unit: it.unit,
            currentStock: it.currentStock,
            lastUpdated: now,
          });
        }
      }
    });

    await onSaveStocks(updated);
    setDraftStocks({});
    showNotification(`Berhasil menyimpan perubahan stok untuk ${dirtyCount} barang!`);
  };

  const handleResetAll = () => {
    setDraftStocks({});
    showNotification('Semua perubahan stok yang belum disimpan telah dibatalkan.', 'info');
  };

  // Export handlers
  const exportCols: ExportColumn<typeof itemsWithStock[0]>[] = [
    { header: 'No', accessor: (_r, i) => i + 1 },
    { header: 'Kode Barang', key: 'code' },
    { header: 'Nama Barang', key: 'name' },
    { header: 'Kategori', key: 'category' },
    { header: 'Satuan', key: 'unit' },
    { header: 'Stok Qty', key: 'currentStock' },
    { header: 'Satuan Terkecil', key: 'smallestUnitDisplay' },
    { header: 'Terakhir Diupdate', accessor: (r) => (r.lastUpdated ? r.lastUpdated.slice(0, 10) : '') },
  ];

  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportToExcelXml(itemsWithStock, exportCols, `KMI_Stok_Barang_${dateStr}.xls`, 'Stok_Barang');
  };

  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportToCsv(itemsWithStock, exportCols, `KMI_Stok_Barang_${dateStr}.csv`);
  };

  // Import handler
  const handleApplyImportStock = (rows: string[][], headers: string[]) => {
    if (rows.length === 0) return { success: false, message: 'Tidak ada data dalam file CSV.' };

    // Find column indexes
    const hLower = headers.map((h) => h.toLowerCase().trim());
    let codeIdx = hLower.findIndex((h) => h.includes('kode') || h.includes('code'));
    let nameIdx = hLower.findIndex((h) => h.includes('nama') || h.includes('name') || h.includes('barang'));
    let stockIdx = hLower.findIndex((h) => h.includes('stok') || h.includes('qty') || h.includes('jumlah') || h.includes('stock'));

    if (nameIdx === -1 && codeIdx === -1) {
      nameIdx = 0;
      stockIdx = 1;
    }
    if (stockIdx === -1) stockIdx = rows[0]?.length > 1 ? 1 : 0;

    let updatedCount = 0;
    const now = new Date().toISOString();
    const newStockMap = new Map<string, number>();

    rows.forEach((row) => {
      const codeVal = codeIdx >= 0 ? row[codeIdx]?.trim() : '';
      const nameVal = nameIdx >= 0 ? row[nameIdx]?.trim() : '';
      const stockVal = stockIdx >= 0 ? parseInt(row[stockIdx]?.trim(), 10) : NaN;

      if (!isNaN(stockVal)) {
        if (codeVal) newStockMap.set(codeVal.toLowerCase(), stockVal);
        if (nameVal) newStockMap.set(nameVal.toLowerCase(), stockVal);
      }
    });

    const updated = stocks.map((s) => {
      const fromName = newStockMap.get(s.itemName.toLowerCase());
      const fromCode = s.itemCode ? newStockMap.get(s.itemCode.toLowerCase()) : undefined;
      const targetVal = fromCode !== undefined ? fromCode : fromName;

      if (targetVal !== undefined) {
        updatedCount++;
        return { ...s, currentStock: targetVal, lastUpdated: now };
      }
      return s;
    });

    // Also check master items not in stocks yet
    masterItems.forEach((m) => {
      if (!updated.some((u) => u.itemName.toLowerCase() === m.name.toLowerCase())) {
        const fromName = newStockMap.get(m.name.toLowerCase());
        const fromCode = m.code ? newStockMap.get(m.code.toLowerCase()) : undefined;
        const targetVal = fromCode !== undefined ? fromCode : fromName;
        if (targetVal !== undefined) {
          updatedCount++;
          updated.push({
            itemId: m.id,
            itemCode: m.code,
            itemName: m.name,
            category: m.category,
            unit: m.defaultUnit || 'PCS',
            currentStock: targetVal,
            lastUpdated: now,
          });
        }
      }
    });

    onSaveStocks(updated);
    setDraftStocks({});

    return {
      success: true,
      count: updatedCount,
      message: `Berhasil mengimpor dan memperbarui stok untuk ${updatedCount} barang!`,
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

      {/* Top Search & Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-300 shadow-2xs space-y-3">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang untuk edit stok (ketik nama atau kode barang)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-900 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={stockStatusFilter}
              onChange={(e: any) => setStockStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none"
            >
              <option value="all">Semua Stok</option>
              <option value="safe">Stok Aman (&gt; 10)</option>
              <option value="low">Stok Menipis (1-10)</option>
              <option value="empty">Stok Habis (0)</option>
            </select>

            {categories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                title="Import Stok dari file CSV"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                title="Export Stok ke Excel"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Header: Dirty rows badge & Save All button */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-semibold">
              Menampilkan <span className="font-bold text-stone-900">{filteredItems.length}</span> barang
            </span>
            {dirtyCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 rounded-full font-bold text-[11px] animate-pulse">
                {dirtyCount} baris diedit (belum disimpan)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {dirtyCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg border border-stone-300 text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Batal ({dirtyCount})</span>
              </button>
            )}

            <button
              type="button"
              disabled={dirtyCount === 0}
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-lg shadow-xs text-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Semua ({dirtyCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Table with In-row Editable Stock */}
      <div className="bg-white border border-stone-300 rounded-xl overflow-hidden shadow-2xs">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#e8f1f5] text-stone-800 font-bold sticky top-0 border-b border-stone-300 shadow-2xs z-10">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">Kode</th>
                <th className="p-3">Nama Barang</th>
                <th className="p-3 w-20">Satuan</th>
                <th className="p-3 w-44 bg-blue-50/80 text-blue-950">
                  <div className="flex items-center gap-1">
                    <span>Stok Qty (Edit)</span>
                  </div>
                </th>
                <th className="p-3 w-36">Satuan Terkecil</th>
                <th className="p-3 w-24 text-center">Status</th>
                <th className="p-3 w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-500">
                    Tidak ditemukan barang dengan kata kunci "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const isSaved = savedRowId === item.id;
                  const isDirty = item.isDirty;

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDirty
                          ? 'bg-amber-50/70 hover:bg-amber-50'
                          : isSaved
                          ? 'bg-emerald-50/70'
                          : 'hover:bg-stone-50'
                      }`}
                    >
                      <td className="p-3 text-center text-stone-500 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-stone-700">{item.code}</td>
                      <td className="p-3 font-bold text-stone-900 max-w-[220px]">
                        <div className="truncate" title={item.name}>
                          {item.name}
                        </div>
                        <span className="text-[10px] text-stone-400 font-normal">{item.category}</span>
                      </td>
                      <td className="p-3 uppercase font-bold text-stone-700">{item.unit}</td>

                      {/* IN-ROW EDITABLE STOK INPUT */}
                      <td className="p-2.5 bg-blue-50/30">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStockStep(item.id, item.currentStock, -1)}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 border border-stone-300 rounded shadow-2xs cursor-pointer font-bold shrink-0"
                            title="Kurang 1"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.currentStock}
                            onChange={(e) => handleStockChange(item.id, e.target.value)}
                            className={`w-20 px-2 py-1.5 text-center font-black text-sm rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              isDirty
                                ? 'bg-amber-100 border-amber-500 text-amber-950 font-bold'
                                : 'bg-white border-stone-400 text-stone-900'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleStockStep(item.id, item.currentStock, 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 border border-stone-300 rounded shadow-2xs cursor-pointer font-bold shrink-0"
                            title="Tambah 1"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Satuan Terkecil */}
                      <td className="p-3 font-mono font-semibold text-stone-700 text-[11px]">
                        {item.smallestUnitDisplay}
                      </td>

                      {/* Status badge */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            item.currentStock > 10
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.currentStock > 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {item.currentStock > 10 ? 'Aman' : item.currentStock > 0 ? 'Menipis' : 'Habis'}
                        </span>
                      </td>

                      {/* Row Action: Save or Reset */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isDirty ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveRow(item)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-2xs cursor-pointer"
                                title="Simpan baris ini"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetRow(item.id)}
                                className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded cursor-pointer"
                                title="Kembalikan stok semula"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : isSaved ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-0.5 text-[10px]">
                              <Check className="w-3.5 h-3.5" /> Tersimpan
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[11px]">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import CSV Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Stok Qty Barang (CSV)"
        description="Upload file CSV berisi daftar stok barang. Anda dapat mengupdate stok berdasarkan Kode Barang atau Nama Barang."
        templateFileName="template_import_stok_kmi.csv"
        templateCsvContent={`kode_barang,nama_barang,stok_qty\nAPD001,Apron clemek BADAN - aluminium,50\nAPD007,Ear muff,100\nAPD014,Masker 3 ply,500\n`}
        expectedColumnsDescription="Kolom: kode_barang / nama_barang, stok_qty"
        onApplyImport={handleApplyImportStock}
      />
    </div>
  );
};
