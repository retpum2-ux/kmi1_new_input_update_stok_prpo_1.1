import React, { useState, useMemo } from 'react';
import {
  Search,
  Save,
  RotateCcw,
  Check,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { MasterItem, ItemPrPo } from '../../types';
import { exportToExcelXml, exportToCsv, ExportColumn } from '../../utils/excelExport';
import { ImportModal } from './ImportModal';

interface Menu3UpdatePrPoProps {
  masterItems: MasterItem[];
  prpos: ItemPrPo[];
  onSavePrPos: (newPrpos: ItemPrPo[]) => Promise<void> | void;
}

export const Menu3UpdatePrPo: React.FC<Menu3UpdatePrPoProps> = ({
  masterItems,
  prpos,
  onSavePrPos,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'waiting_po' | 'no_pr'>('all');

  // Local draft changes: itemId -> { tglPR, noPR, noPO }
  const [draftPrPos, setDraftPrPos] = useState<
    Record<string, { tglPR: string; noPR: string; noPO: string }>
  >({});
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const prpoMap = useMemo(() => {
    return new Map(prpos.map((p) => [p.itemName.toLowerCase(), p]));
  }, [prpos]);

  // Combined list
  const combinedItems = useMemo(() => {
    return masterItems.map((item, idx) => {
      const existing = prpoMap.get(item.name.toLowerCase());
      const baseTgl = existing?.tglPR || '';
      const basePr = existing?.noPR || '';
      const basePo = existing?.noPO || '';

      const draft = draftPrPos[item.id];
      const tglPR = draft !== undefined ? draft.tglPR : baseTgl;
      const noPR = draft !== undefined ? draft.noPR : basePr;
      const noPO = draft !== undefined ? draft.noPO : basePo;

      const isDirty =
        draft !== undefined &&
        (draft.tglPR !== baseTgl || draft.noPR !== basePr || draft.noPO !== basePo);

      let status = 'Belum PR';
      if (noPR && noPO) {
        status = 'Lengkap (PR & PO)';
      } else if (noPR) {
        status = 'Menunggu PO';
      }

      return {
        id: item.id,
        code: item.code || existing?.itemCode || `ITM-${idx + 1}`,
        name: item.name,
        category: item.category || 'Umum',
        unit: item.defaultUnit || 'PCS',
        tglPR,
        noPR,
        noPO,
        baseTgl,
        basePr,
        basePo,
        status,
        isDirty,
        lastUpdated: existing?.lastUpdated || '',
      };
    });
  }, [masterItems, prpoMap, draftPrPos]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return combinedItems.filter((it) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        it.name.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q) ||
        it.noPR.toLowerCase().includes(q) ||
        it.noPO.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'complete' && it.status !== 'Lengkap (PR & PO)') return false;
      if (statusFilter === 'waiting_po' && it.status !== 'Menunggu PO') return false;
      if (statusFilter === 'no_pr' && it.status !== 'Belum PR') return false;

      return true;
    });
  }, [combinedItems, searchQuery, statusFilter]);

  // Dirty count
  const dirtyCount = useMemo(() => {
    return combinedItems.filter((it) => it.isDirty).length;
  }, [combinedItems]);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Change handler for inline row
  const handleFieldChange = (
    itemId: string,
    field: 'tglPR' | 'noPR' | 'noPO',
    value: string,
    item: typeof combinedItems[0]
  ) => {
    const currentDraft = draftPrPos[itemId] || {
      tglPR: item.tglPR,
      noPR: item.noPR,
      noPO: item.noPO,
    };

    setDraftPrPos((prev) => ({
      ...prev,
      [itemId]: {
        ...currentDraft,
        [field]: field === 'tglPR' ? value : value.trim().toUpperCase(),
      },
    }));
  };

  const handleResetRow = (itemId: string) => {
    setDraftPrPos((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleSaveRow = async (item: typeof combinedItems[0]) => {
    const now = new Date().toISOString();
    const updated = prpos.map((p) =>
      p.itemName.toLowerCase() === item.name.toLowerCase()
        ? {
            ...p,
            tglPR: item.tglPR,
            noPR: item.noPR,
            noPO: item.noPO,
            lastUpdated: now,
          }
        : p
    );

    if (!prpos.some((p) => p.itemName.toLowerCase() === item.name.toLowerCase())) {
      updated.push({
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        category: item.category,
        unit: item.unit,
        tglPR: item.tglPR,
        noPR: item.noPR,
        noPO: item.noPO,
        lastUpdated: now,
      });
    }

    await onSavePrPos(updated);

    setDraftPrPos((prev) => {
      const copy = { ...prev };
      delete copy[item.id];
      return copy;
    });

    setSavedRowId(item.id);
    setTimeout(() => setSavedRowId(null), 1500);
    showNotification(`Data PR & PO untuk "${item.name}" berhasil diperbarui!`);
  };

  const handleSaveAll = async () => {
    if (dirtyCount === 0) return;

    const now = new Date().toISOString();
    const updated = [...prpos];

    combinedItems.forEach((it) => {
      if (it.isDirty) {
        const idx = updated.findIndex((p) => p.itemName.toLowerCase() === it.name.toLowerCase());
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            tglPR: it.tglPR,
            noPR: it.noPR,
            noPO: it.noPO,
            lastUpdated: now,
          };
        } else {
          updated.push({
            itemId: it.id,
            itemCode: it.code,
            itemName: it.name,
            category: it.category,
            unit: it.unit,
            tglPR: it.tglPR,
            noPR: it.noPR,
            noPO: it.noPO,
            lastUpdated: now,
          });
        }
      }
    });

    await onSavePrPos(updated);
    setDraftPrPos({});
    showNotification(`Berhasil menyimpan perubahan PR & PO untuk ${dirtyCount} barang!`);
  };

  const handleResetAll = () => {
    setDraftPrPos({});
    showNotification('Semua perubahan yang belum disimpan telah dibatalkan.', 'info');
  };

  // Export handlers
  const exportCols: ExportColumn<typeof combinedItems[0]>[] = [
    { header: 'No', accessor: (_r, i) => i + 1 },
    { header: 'Kode Barang', key: 'code' },
    { header: 'Nama Barang', key: 'name' },
    { header: 'Kategori', key: 'category' },
    { header: 'Satuan', key: 'unit' },
    { header: 'Tgl PR', key: 'tglPR' },
    { header: 'No PR', key: 'noPR' },
    { header: 'No PO', key: 'noPO' },
    { header: 'Status PR/PO', key: 'status' },
    { header: 'Terakhir Update', accessor: (r) => (r.lastUpdated ? r.lastUpdated.slice(0, 10) : '') },
  ];

  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportToExcelXml(combinedItems, exportCols, `KMI_Update_PR_PO_${dateStr}.xls`, 'PR_PO');
  };

  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportToCsv(combinedItems, exportCols, `KMI_Update_PR_PO_${dateStr}.csv`);
  };

  // Import handler
  const handleApplyImportPrPo = (rows: string[][], headers: string[]) => {
    if (rows.length === 0) return { success: false, message: 'File CSV tidak berisi data.' };

    const hLower = headers.map((h) => h.toLowerCase().trim());
    let codeIdx = hLower.findIndex((h) => h.includes('kode') || h.includes('code'));
    let nameIdx = hLower.findIndex((h) => h.includes('nama') || h.includes('name') || h.includes('barang'));
    let tglIdx = hLower.findIndex((h) => h.includes('tgl') || h.includes('tanggal') || h.includes('date'));
    let prIdx = hLower.findIndex((h) => h.includes('pr') || h.includes('p.r'));
    let poIdx = hLower.findIndex((h) => h.includes('po') || h.includes('p.o'));

    if (codeIdx === -1 && nameIdx === -1) {
      codeIdx = 0;
      nameIdx = 1;
    }

    let updatedCount = 0;
    const now = new Date().toISOString();
    const updated = [...prpos];

    rows.forEach((row) => {
      const codeVal = codeIdx >= 0 ? row[codeIdx]?.trim() : '';
      const nameVal = nameIdx >= 0 ? row[nameIdx]?.trim() : '';
      const tglVal = tglIdx >= 0 ? row[tglIdx]?.trim() : '';
      const prVal = prIdx >= 0 ? row[prIdx]?.trim().toUpperCase() : '';
      const poVal = poIdx >= 0 ? row[poIdx]?.trim().toUpperCase() : '';

      const matchIdx = updated.findIndex((p) => {
        if (codeVal && p.itemCode && p.itemCode.toLowerCase() === codeVal.toLowerCase()) return true;
        if (nameVal && p.itemName.toLowerCase() === nameVal.toLowerCase()) return true;
        return false;
      });

      if (matchIdx >= 0) {
        updatedCount++;
        updated[matchIdx] = {
          ...updated[matchIdx],
          tglPR: tglVal || updated[matchIdx].tglPR,
          noPR: prVal !== undefined ? prVal : updated[matchIdx].noPR,
          noPO: poVal !== undefined ? poVal : updated[matchIdx].noPO,
          lastUpdated: now,
        };
      } else if (nameVal || codeVal) {
        // Find in master items
        const masterMatch = masterItems.find(
          (m) =>
            (codeVal && m.code && m.code.toLowerCase() === codeVal.toLowerCase()) ||
            (nameVal && m.name.toLowerCase() === nameVal.toLowerCase())
        );

        if (masterMatch) {
          updatedCount++;
          updated.push({
            itemId: masterMatch.id,
            itemCode: masterMatch.code,
            itemName: masterMatch.name,
            category: masterMatch.category,
            unit: masterMatch.defaultUnit || 'PCS',
            tglPR: tglVal,
            noPR: prVal,
            noPO: poVal,
            lastUpdated: now,
          });
        }
      }
    });

    onSavePrPos(updated);
    setDraftPrPos({});

    return {
      success: true,
      count: updatedCount,
      message: `Berhasil mengimpor dan memperbarui Tgl PR, No PR, No PO untuk ${updatedCount} barang!`,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama barang, kode, No PR, atau No PO..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 font-medium"
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

          {/* Filter Status */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none"
            >
              <option value="all">Semua Status PR/PO</option>
              <option value="complete">Lengkap (PR & PO)</option>
              <option value="waiting_po">Menunggu PO</option>
              <option value="no_pr">Belum PR</option>
            </select>

            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                title="Import PR & PO dari file CSV"
              >
                <Upload className="w-3.5 h-3.5 text-amber-600" />
                <span>Import CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                title="Export data PR & PO ke Excel"
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-black rounded-lg shadow-xs text-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Semua ({dirtyCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main PR PO Table with Editable Columns */}
      <div className="bg-white border border-stone-300 rounded-xl overflow-hidden shadow-2xs">
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#fef8ee] text-stone-800 font-bold sticky top-0 border-b border-stone-300 shadow-2xs z-10">
              <tr>
                <th className="p-3 w-10 text-center">#</th>
                <th className="p-3 w-28">Kode</th>
                <th className="p-3">Nama Barang</th>
                <th className="p-3 w-20">Satuan</th>
                <th className="p-3 w-36 bg-amber-100/60 text-amber-950">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tgl PR</span>
                  </div>
                </th>
                <th className="p-3 w-36 bg-amber-100/60 text-amber-950">
                  <div className="flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>No PR</span>
                  </div>
                </th>
                <th className="p-3 w-36 bg-purple-100/60 text-purple-950">
                  <div className="flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>No PO</span>
                  </div>
                </th>
                <th className="p-3 w-28 text-center">Status</th>
                <th className="p-3 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-500">
                    Tidak ditemukan data barang yang cocok dengan pencarian / filter.
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
                      <td className="p-3 font-bold text-stone-900 max-w-[200px]">
                        <div className="truncate" title={item.name}>
                          {item.name}
                        </div>
                        <span className="text-[10px] text-stone-400 font-normal">{item.category}</span>
                      </td>
                      <td className="p-3 uppercase font-semibold text-stone-600">{item.unit}</td>

                      {/* EDITABLE TGL PR */}
                      <td className="p-2 bg-amber-50/30">
                        <input
                          type="date"
                          value={item.tglPR}
                          onChange={(e) => handleFieldChange(item.id, 'tglPR', e.target.value, item)}
                          className={`w-full px-2 py-1.5 text-xs rounded border focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium ${
                            item.tglPR !== item.baseTgl
                              ? 'bg-amber-100 border-amber-500 text-amber-950 font-bold'
                              : 'bg-white border-stone-300 text-stone-900'
                          }`}
                        />
                      </td>

                      {/* EDITABLE NO PR */}
                      <td className="p-2 bg-amber-50/30">
                        <input
                          type="text"
                          value={item.noPR}
                          onChange={(e) => handleFieldChange(item.id, 'noPR', e.target.value, item)}
                          placeholder="PR-XXXX"
                          className={`w-full px-2 py-1.5 text-xs font-mono uppercase rounded border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            item.noPR !== item.basePr
                              ? 'bg-amber-100 border-amber-500 text-amber-950 font-bold'
                              : 'bg-white border-stone-300 text-stone-900'
                          }`}
                        />
                      </td>

                      {/* EDITABLE NO PO */}
                      <td className="p-2 bg-purple-50/30">
                        <input
                          type="text"
                          value={item.noPO}
                          onChange={(e) => handleFieldChange(item.id, 'noPO', e.target.value, item)}
                          placeholder="PO-XXXX"
                          className={`w-full px-2 py-1.5 text-xs font-mono uppercase rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            item.noPO !== item.basePo
                              ? 'bg-purple-100 border-purple-500 text-purple-950 font-bold'
                              : 'bg-white border-stone-300 text-stone-900'
                          }`}
                        />
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            item.status === 'Lengkap (PR & PO)'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.status === 'Menunggu PO'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-stone-100 text-stone-600 border border-stone-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isDirty ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSaveRow(item)}
                                className="p-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded shadow-2xs cursor-pointer"
                                title="Simpan baris ini"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResetRow(item.id)}
                                className="p-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded cursor-pointer"
                                title="Batal ubah baris"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : isSaved ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-0.5 text-[10px]">
                              <Check className="w-3.5 h-3.5" /> OK
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

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import Data PR & PO (CSV)"
        description="Upload file CSV berisi daftar tanggal PR, nomor PR, dan nomor PO. Sistem akan mencocokkan berdasarkan kode_barang atau nama_barang."
        templateFileName="template_import_pr_po_kmi.csv"
        templateCsvContent={`kode_barang,nama_barang,tgl_pr,no_pr,no_po\nAPD001,Apron clemek BADAN - aluminium,2026-10-05,PR-2026-001,PO-KMI-2026-015\nAPD007,Ear muff,2026-10-08,PR-2026-002,PO-KMI-2026-016\nRKE001,Gas LPG,2026-10-09,PR-2026-003,\n`}
        expectedColumnsDescription="Kolom: kode_barang, nama_barang, tgl_pr, no_pr, no_po"
        onApplyImport={handleApplyImportPrPo}
      />
    </div>
  );
};
