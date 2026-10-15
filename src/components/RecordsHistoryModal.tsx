import React, { useState } from 'react';
import { X, Download, Trash2, CheckCircle2, Clock, Search, AlertCircle, PackageCheck, MessageSquare } from 'lucide-react';
import { SubmissionRecord } from '../types';
import { WhatsAppModal } from './WhatsAppModal';

interface RecordsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SubmissionRecord[];
  onClearRecords: () => void;
}

export const RecordsHistoryModal: React.FC<RecordsHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onClearRecords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWARecord, setSelectedWARecord] = useState<SubmissionRecord | null>(null);

  if (!isOpen) return null;

  const filteredRecords = records.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchId = (r.id || '').toLowerCase().includes(term);
    const matchTanggal = (r.tanggal || '').toLowerCase().includes(term);
    const matchItems = r.items.some(
      (it) =>
        it.barang.toLowerCase().includes(term) ||
        (it.noPR && it.noPR.toLowerCase().includes(term)) ||
        (it.noPO && it.noPO.toLowerCase().includes(term)) ||
        (it.keterangan && it.keterangan.toLowerCase().includes(term))
    );
    return matchId || matchTanggal || matchItems;
  });

  const totalItemsCount = records.reduce((acc, r) => acc + (r.items ? r.items.length : 0), 0);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    // Build CSV content
    const headers = [
      'Waktu Simpan',
      'ID Transaksi',
      'Tanggal Kedatangan',
      'No Item',
      'Nama Barang',
      'Kuantitas (Qty)',
      'Satuan (U/M)',
      'Keterangan',
      'No P.R.',
      'No P.O.',
      'Status Sync Sheets',
    ];

    const rows: string[][] = [];

    filteredRecords.forEach((rec) => {
      rec.items.forEach((item: any, idx: number) => {
        rows.push([
          rec.createdAt ? new Date(rec.createdAt).toLocaleString('id-ID') : '',
          rec.id,
          rec.tanggal,
          String(idx + 1),
          item.barang || '',
          String(item.qty || ''),
          item.unit || '',
          item.keterangan || '',
          item.noPR || '-',
          item.noPO || item.noPE || '-',
          rec.syncedToSheets ? 'Tersinkron ke Sheets' : 'Lokal',
        ]);
      });
    });

    const csvContent =
      '\uFEFF' + // UTF-8 BOM so Excel opens Indonesian characters properly
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join(
        '\r\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KMI_Kedatangan_Barang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] flex flex-col border border-stone-800 shadow-2xl overflow-hidden rounded-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Riwayat Formulir Kedatangan Barang
              </h2>
              <p className="text-xs text-stone-300">
                Daftar transaksi kedatangan barang yang tercatat dan tersinkron ke Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-stone-100 border-b border-stone-300 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari barang, No PR, No PO, atau tanggal..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <span className="text-stone-500 font-semibold whitespace-nowrap">
              {filteredRecords.length} formulir ({totalItemsCount} item)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold disabled:opacity-50 transition-colors cursor-pointer"
              title="Download rekapan format CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
            {records.length > 0 && (
              <button
                type="button"
                onClick={onClearRecords}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold transition-colors cursor-pointer"
                title="Hapus riwayat lokal"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus Riwayat</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-stone-50 space-y-4">
          {filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white border border-stone-300 shadow-2xs overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-3 bg-emerald-50/50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wide">
                        Kedatangan
                      </span>
                      <span className="font-mono text-stone-900 font-bold">
                        {rec.id}
                      </span>
                      <span className="text-stone-500">•</span>
                      <span className="text-stone-700 font-semibold">
                        Tgl: {rec.tanggal}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedWARecord(rec)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                        title="Kirim laporan transaksi ini ke WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </button>
                      {rec.syncedToSheets ? (
                        <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tersinkron ke Sheets
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-800 font-medium bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Tersimpan Lokal
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400 font-mono">
                        {rec.createdAt ? new Date(rec.createdAt).toLocaleTimeString('id-ID') : ''}
                      </span>
                    </div>
                  </div>

                  {/* Card Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-stone-200">
                      <thead className="bg-stone-50 text-stone-600 font-semibold">
                        <tr>
                          <th className="px-3 py-1.5 w-10 text-center">#</th>
                          <th className="px-3 py-1.5">Nama Barang</th>
                          <th className="px-3 py-1.5 w-24 text-right">Qty</th>
                          <th className="px-3 py-1.5 w-20 text-center">U/M</th>
                          <th className="px-3 py-1.5">Keterangan</th>
                          <th className="px-3 py-1.5 w-28">No P.R.</th>
                          <th className="px-3 py-1.5 w-28">No P.O.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-800">
                        {rec.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-stone-50/70">
                            <td className="px-3 py-1.5 text-center text-stone-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-1.5 font-medium text-stone-900">
                              {item.barang}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold">
                              {item.qty}
                            </td>
                            <td className="px-3 py-1.5 text-center font-mono text-emerald-700 font-semibold">
                              [ {item.unit} ]
                            </td>
                            <td className="px-3 py-1.5 text-stone-600">
                              {item.keterangan || '-'}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-stone-700">
                              {item.noPR || '-'}
                            </td>
                            <td className="px-3 py-1.5 font-mono text-stone-700">
                              {item.noPO || item.noPE || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-stone-200">
              <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-700">Belum ada riwayat formulir kedatangan</p>
              <p className="text-xs text-stone-500 mt-1">
                Data yang diisi pada formulir Kedatangan Barang akan otomatis tercatat di sini dan tersinkron ke Google Spreadsheet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-100 border-t border-stone-300 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {selectedWARecord && (
        <WhatsAppModal
          isOpen={Boolean(selectedWARecord)}
          onClose={() => setSelectedWARecord(null)}
          tanggal={selectedWARecord.tanggal}
          items={selectedWARecord.items}
        />
      )}
    </div>
  );
};
