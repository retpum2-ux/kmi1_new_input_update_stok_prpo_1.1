import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Package,
  Layers,
  FileCheck2,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MasterItem, ItemStock, ItemPrPo, UnitConversionRule, SubmissionRecord } from '../../types';
import { exportToCsv, exportToExcelXml, ExportColumn } from '../../utils/excelExport';
import { calculateSmallestUnit } from '../../data/initialUpdateData';

interface Menu1RingkasanProps {
  masterItems: MasterItem[];
  stocks: ItemStock[];
  prpos: ItemPrPo[];
  conversionRules: UnitConversionRule[];
  records: SubmissionRecord[];
}

export const Menu1Ringkasan: React.FC<Menu1RingkasanProps> = ({
  masterItems,
  stocks,
  prpos,
  conversionRules,
  records,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'has_stock' | 'zero_stock' | 'has_pr' | 'has_po'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Map latest kedatangan info per item
  const latestKedatanganMap = useMemo(() => {
    const map = new Map<string, { lastDate: string; totalQty: number; lastUnit: string }>();
    records.forEach((rec) => {
      rec.items.forEach((it) => {
        const key = it.barang.trim().toLowerCase();
        const existing = map.get(key);
        const qtyNum = Number(it.qty) || 0;
        if (!existing) {
          map.set(key, { lastDate: rec.tanggal, totalQty: qtyNum, lastUnit: it.unit });
        } else {
          existing.totalQty += qtyNum;
          if (new Date(rec.tanggal) > new Date(existing.lastDate)) {
            existing.lastDate = rec.tanggal;
            existing.lastUnit = it.unit;
          }
        }
      });
    });
    return map;
  }, [records]);

  // Combined rows
  const combinedRows = useMemo(() => {
    const stockMap = new Map(stocks.map((s) => [s.itemName.toLowerCase(), s]));
    const prpoMap = new Map(prpos.map((p) => [p.itemName.toLowerCase(), p]));

    return masterItems.map((item, idx) => {
      const stockInfo = stockMap.get(item.name.toLowerCase());
      const prpoInfo = prpoMap.get(item.name.toLowerCase());
      const kedatangan = latestKedatanganMap.get(item.name.toLowerCase());

      const currentStock = stockInfo ? stockInfo.currentStock : 0;
      const unit = stockInfo?.unit || item.defaultUnit || 'PCS';
      const smallest = calculateSmallestUnit(currentStock, unit, item.name, conversionRules);

      const tglPR = prpoInfo?.tglPR || '';
      const noPR = prpoInfo?.noPR || '';
      const noPO = prpoInfo?.noPO || '';

      let statusPRPO = 'Belum PR';
      if (noPR && noPO) {
        statusPRPO = 'Lengkap (PR & PO)';
      } else if (noPR) {
        statusPRPO = 'Menunggu PO';
      }

      return {
        no: idx + 1,
        code: item.code || prpoInfo?.itemCode || stockInfo?.itemCode || `ITM-${idx + 1}`,
        name: item.name,
        category: item.category || 'Umum',
        unit,
        currentStock,
        smallestUnitDisplay: smallest ? `${smallest.convertedQty.toLocaleString()} ${smallest.smallestUnit}` : '-',
        tglPR,
        noPR,
        noPO,
        statusPRPO,
        lastKedatanganDate: kedatangan ? kedatangan.lastDate : '-',
        lastKedatanganQty: kedatangan ? `${kedatangan.totalQty} ${kedatangan.lastUnit}` : '-',
        lastUpdated: stockInfo?.lastUpdated || prpoInfo?.lastUpdated || new Date().toISOString(),
      };
    });
  }, [masterItems, stocks, prpos, conversionRules, latestKedatanganMap]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return combinedRows.filter((row) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.noPR.toLowerCase().includes(q) ||
        row.noPO.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false;

      if (statusFilter === 'has_stock' && row.currentStock <= 0) return false;
      if (statusFilter === 'zero_stock' && row.currentStock > 0) return false;
      if (statusFilter === 'has_pr' && !row.noPR) return false;
      if (statusFilter === 'has_po' && !row.noPO) return false;

      return true;
    });
  }, [combinedRows, searchQuery, statusFilter, categoryFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalItems = combinedRows.length;
    const totalStock = combinedRows.reduce((acc, r) => acc + (r.currentStock || 0), 0);
    const withPr = combinedRows.filter((r) => r.noPR).length;
    const withPo = combinedRows.filter((r) => r.noPO).length;
    const completedPo = combinedRows.filter((r) => r.noPR && r.noPO).length;
    return { totalItems, totalStock, withPr, withPo, completedPo };
  }, [combinedRows]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set(masterItems.map((it) => it.category || 'Umum'));
    return Array.from(set);
  }, [masterItems]);

  // Export handlers
  const exportColumns: ExportColumn<any>[] = [
    { header: 'No', accessor: (_r, idx) => idx + 1 },
    { header: 'Kode Barang', key: 'code' },
    { header: 'Nama Barang', key: 'name' },
    { header: 'Kategori', key: 'category' },
    { header: 'Satuan', key: 'unit' },
    { header: 'Stok Saat Ini', key: 'currentStock' },
    { header: 'Satuan Terkecil', key: 'smallestUnitDisplay' },
    { header: 'Tgl PR', key: 'tglPR' },
    { header: 'No PR', key: 'noPR' },
    { header: 'No PO', key: 'noPO' },
    { header: 'Status PR/PO', key: 'statusPRPO' },
    { header: 'Kedatangan Terakhir (Tgl)', key: 'lastKedatanganDate' },
    { header: 'Total Kedatangan', key: 'lastKedatanganQty' },
    { header: 'Terakhir Update', accessor: (r) => (r.lastUpdated ? r.lastUpdated.slice(0, 10) : '') },
  ];

  const handleExportExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportToExcelXml(
      filteredRows,
      exportColumns,
      `KMI_Ringkasan_Hasil_Update_${dateStr}.xls`,
      'Ringkasan_Update'
    );
    setExportNotice('File Excel (.xls) berhasil diunduh dan siap dibuka di Microsoft Excel!');
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportCsv = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    exportToCsv(filteredRows, exportColumns, `KMI_Ringkasan_Update_${dateStr}.csv`);
    setExportNotice('File CSV (Excel-ready) berhasil diunduh!');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {exportNotice && (
        <div className="p-3 bg-emerald-100 border border-emerald-400 text-emerald-950 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-stone-300 shadow-2xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Total Barang</span>
          </div>
          <div className="text-xl font-black text-stone-900 mt-1">{metrics.totalItems}</div>
          <span className="text-[10px] text-stone-500">Jenis terdaftar</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-300 shadow-2xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Total Stok</span>
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">
            {metrics.totalStock.toLocaleString()}
          </div>
          <span className="text-[10px] text-stone-500">Akumulasi kuantitas</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-300 shadow-2xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
            <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Ada No PR</span>
          </div>
          <div className="text-xl font-black text-amber-800 mt-1">{metrics.withPr}</div>
          <span className="text-[10px] text-stone-500">Barang diproses</span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-stone-300 shadow-2xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            <span>Ada No PO</span>
          </div>
          <div className="text-xl font-black text-purple-800 mt-1">{metrics.withPo}</div>
          <span className="text-[10px] text-stone-500">Order pembelian</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white p-3 rounded-xl border border-stone-300 shadow-2xs">
          <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-rose-600" />
            <span>Transaksi Kedatangan</span>
          </div>
          <div className="text-xl font-black text-rose-800 mt-1">{records.length}</div>
          <span className="text-[10px] text-stone-500">Form tersimpan</span>
        </div>
      </div>

      {/* Action Bar & Search / Filter Controls */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-300 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang, kode, No PR, No PO..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-800 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="has_stock">Ada Stok (&gt; 0)</option>
              <option value="zero_stock">Stok Kosong (= 0)</option>
              <option value="has_pr">Memiliki No PR</option>
              <option value="has_po">Memiliki No PO</option>
            </select>
          </div>

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

          {/* EXPORT TO EXCEL BUTTON */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1d6f42] hover:bg-[#185e37] active:bg-[#12492a] text-white font-black text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Export langsung format Microsoft Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export ke Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg border border-stone-300 shadow-2xs transition-colors cursor-pointer"
              title="Export CSV (BOM UTF-8)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Table */}
      <div className="bg-white border border-stone-300 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-2.5 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 border-b border-stone-300 flex items-center justify-between text-xs">
          <span className="font-extrabold text-stone-800">
            Daftar Ringkasan Hasil Update ({filteredRows.length} dari {combinedRows.length} barang)
          </span>
          <span className="text-stone-500 text-[11px]">Siap diexport kapan saja</span>
        </div>

        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#eef5ef] text-stone-800 font-bold sticky top-0 border-b border-stone-300 shadow-2xs z-10">
              <tr>
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5">Kode</th>
                <th className="p-2.5">Nama Barang</th>
                <th className="p-2.5">Satuan</th>
                <th className="p-2.5 text-right bg-emerald-50">Stok Qty</th>
                <th className="p-2.5 text-right">Satuan Terkecil</th>
                <th className="p-2.5">Tgl PR</th>
                <th className="p-2.5">No PR</th>
                <th className="p-2.5">No PO</th>
                <th className="p-2.5 text-center">Status PR/PO</th>
                <th className="p-2.5">Kedatangan Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-stone-500">
                    Tidak ada barang yang cocok dengan pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={`${row.code}-${idx}`} className="hover:bg-stone-50/80 transition-colors">
                    <td className="p-2.5 text-center text-stone-500 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-stone-700">{row.code}</td>
                    <td className="p-2.5 font-bold text-stone-900 max-w-[200px] truncate" title={row.name}>
                      {row.name}
                    </td>
                    <td className="p-2.5 uppercase font-semibold text-stone-600">{row.unit}</td>
                    <td className="p-2.5 text-right font-black text-emerald-800 bg-emerald-50/40">
                      {row.currentStock.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-medium text-stone-600 font-mono text-[11px]">
                      {row.smallestUnitDisplay}
                    </td>
                    <td className="p-2.5 font-mono text-stone-600">{row.tglPR || '-'}</td>
                    <td className="p-2.5 font-mono font-bold text-amber-900">{row.noPR || '-'}</td>
                    <td className="p-2.5 font-mono font-bold text-purple-900">{row.noPO || '-'}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          row.statusPRPO === 'Lengkap (PR & PO)'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : row.statusPRPO === 'Menunggu PO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {row.statusPRPO}
                      </span>
                    </td>
                    <td className="p-2.5 text-stone-600 text-[11px]">
                      {row.lastKedatanganDate !== '-' ? (
                        <span>
                          <span className="font-semibold">{row.lastKedatanganDate}</span> ({row.lastKedatanganQty})
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
