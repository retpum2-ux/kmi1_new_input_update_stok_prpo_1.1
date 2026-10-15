import React, { useState } from 'react';
import { X, HelpCircle, Cloud, Database, ArrowRight } from 'lucide-react';

interface VercelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMaster: () => void;
  onOpenSettings: () => void;
}

export const VercelGuideModal: React.FC<VercelGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenMaster,
  onOpenSettings,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] flex flex-col border border-stone-800 shadow-2xl overflow-hidden rounded-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Panduan Lengkap: Master Data & Deploy GitHub / Vercel
              </h2>
              <p className="text-xs text-stone-300">
                Cara update nama barang, nama kuantitas, dan penyambungan ke Google Spreadsheet di Vercel
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50 space-y-6 text-xs text-stone-800">
          {/* SECTION 1: CARA UPDATE NAMA BARANG & SATUAN */}
          <div className="bg-white p-5 border border-stone-300 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-stone-900 uppercase">
                  1. Cara Update Nama Barang [ V ] & Nama Kuantitas [ U/M ]
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMaster();
                }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Buka Menu Master Data
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Barang */}
              <div className="bg-stone-50 p-3.5 border border-stone-200 space-y-2">
                <p className="font-bold text-stone-900 flex items-center gap-1.5 text-xs">
                  <span className="font-mono bg-stone-200 px-1 py-0.5">[ V ]</span>
                  Update Daftar Nama Barang
                </p>
                <ol className="list-decimal list-inside space-y-1 text-stone-600 leading-relaxed">
                  <li>
                    <strong>Dari Form:</strong> Saat mengisi form, ketik di kolom <em>Cari / Pilih barang</em> atau klik tombol <strong>[ V ]</strong>.
                  </li>
                  <li>
                    Di bagian bawah dropdown, klik <strong>"Kelola Master Barang"</strong>.
                  </li>
                  <li>
                    Atau klik menu <strong>"Master Data"</strong> di navigasi atas.
                  </li>
                  <li>
                    Isi form: Nama Barang, Kode Barang, Kategori, dan Satuan Default. Klik <strong>"+ Tambahkan ke Master"</strong>.
                  </li>
                  <li>
                    Untuk mengedit atau menghapus barang yang ada, gunakan tombol ikon pensil/tempat sampah pada tabel daftar barang.
                  </li>
                </ol>
              </div>

              {/* Satuan */}
              <div className="bg-stone-50 p-3.5 border border-stone-200 space-y-2">
                <p className="font-bold text-stone-900 flex items-center gap-1.5 text-xs">
                  <span className="font-mono bg-stone-200 px-1 py-0.5">[ U/M ]</span>
                  Update Nama Kuantitas / Satuan
                </p>
                <ol className="list-decimal list-inside space-y-1 text-stone-600 leading-relaxed">
                  <li>
                    <strong>Dari Form:</strong> Klik tombol kotak <strong>[ U/M ]</strong> pada baris barang.
                  </li>
                  <li>
                    Di dalam dropdown, klik tombol <strong>"Kelola Satuan U/M"</strong>.
                  </li>
                  <li>
                    Di modal yang terbuka, pilih tab <strong>"Daftar Satuan Kuantitas [ U/M ]"</strong>.
                  </li>
                  <li>
                    Ketik <em>Kode Satuan</em> (misal: <code>PALLET</code>, <code>PACK</code>, <code>COIL</code>) dan <em>Nama Satuan</em> (misal: <code>Pallet Kayu</code>).
                  </li>
                  <li>
                    Klik <strong>"+ Tambahkan Satuan"</strong>. Satuan baru akan langsung tersedia di seluruh form!
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* SECTION 2: METODE PENYAMBUNGAN SPREADSHEET DI GITHUB & VERCEL */}
          <div className="bg-white p-5 border border-stone-300 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900 uppercase">
                  2. Metode Penyambungan ke Google Spreadsheet di GitHub & Vercel
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Atur Spreadsheet Sekarang
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Ketika Anda mengunggah (push) kode ke <strong>GitHub</strong> dan menghubungkannya ke <strong>Vercel</strong>, aplikasi ini menggunakan arsitektur <em>Vercel Serverless Function Backend</em> (<code className="bg-stone-100 font-mono px-1">/api/submit</code>) yang otomatis meneruskan data form ke <strong>Google Apps Script Web App</strong> di Google Drive Anda.
            </p>

            <div className="space-y-3">
              {/* Langkah 1 */}
              <div className="border border-stone-200 p-3 bg-stone-50">
                <div className="flex items-center gap-2 font-bold text-stone-900 mb-1">
                  <span className="w-4 h-4 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px]">A</span>
                  Siapkan Google Spreadsheet & Dapatkan Webhook URL
                </div>
                <p className="text-stone-600 pl-6 leading-relaxed">
                  Buka Google Spreadsheet di Google Drive &gt; Klik <strong>Ekstensi &gt; Apps Script</strong> &gt; Tempel kode dari menu <em>Pengaturan Spreadsheet &gt; Salin Kode Apps Script</em> &gt; Klik <strong>Deploy &gt; New Deployment &gt; Web App</strong> &gt; Setel <strong>Who has access: Anyone</strong> &gt; Salin URL deployment (berakhiran <code>/exec</code>).
                </p>
              </div>

              {/* Langkah 2 */}
              <div className="border border-stone-200 p-3 bg-stone-50">
                <div className="flex items-center gap-2 font-bold text-stone-900 mb-1">
                  <span className="w-4 h-4 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px]">B</span>
                  Upload Project ke GitHub
                </div>
                <div className="pl-6 space-y-1.5 text-stone-600">
                  <p>Inisialisasi git dan push repository ke akun GitHub Anda:</p>
                  <div className="bg-stone-900 text-stone-100 p-2 font-mono text-[11px] flex items-center justify-between">
                    <code>git add . && git commit -m "KMI Web App" && git push origin main</code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          'git add . && git commit -m "KMI Web App" && git push origin main',
                          'git'
                        )
                      }
                      className="text-stone-400 hover:text-white px-2 cursor-pointer"
                    >
                      {copiedKey === 'git' ? 'Tersalin!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="border border-stone-200 p-3 bg-stone-50">
                <div className="flex items-center gap-2 font-bold text-stone-900 mb-1">
                  <span className="w-4 h-4 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px]">C</span>
                  Import ke Vercel & Atur Environment Variable
                </div>
                <div className="pl-6 space-y-2 text-stone-600">
                  <p>
                    1. Masuk ke <strong>Vercel Dashboard</strong> (<a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">vercel.com</a>) &gt; Klik <strong>"Add New..." &gt; Project</strong> &gt; Pilih repositori GitHub Anda.
                  </p>
                  <p>
                    2. Pada bagian <strong>Environment Variables</strong> di Vercel sebelum klik Deploy:
                  </p>
                  <div className="bg-stone-100 border border-stone-300 p-2 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-stone-900">Key:</strong> <code>GOOGLE_SHEETS_WEBHOOK_URL</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('GOOGLE_SHEETS_WEBHOOK_URL', 'env-key')}
                        className="text-blue-600 hover:text-blue-800 text-[10px] font-bold cursor-pointer"
                      >
                        {copiedKey === 'env-key' ? 'Tersalin!' : 'Salin Key'}
                      </button>
                    </div>
                    <div>
                      <strong className="text-stone-900">Value:</strong> <em>[Pastekan URL Web App Apps Script dari langkah A]</em>
                    </div>
                  </div>
                  <p>
                    3. Klik tombol biru <strong>"Deploy"</strong>. Selesai!
                  </p>
                </div>
              </div>

              {/* Langkah 4 */}
              <div className="border border-stone-200 p-3 bg-stone-50">
                <div className="flex items-center gap-2 font-bold text-stone-900 mb-1">
                  <span className="w-4 h-4 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px]">D</span>
                  Fleksibilitas Tambahan: Ubah URL Langsung dari UI
                </div>
                <p className="text-stone-600 pl-6 leading-relaxed">
                  Bahkan jika Anda tidak menyetel Environment Variable di Vercel, Anda atau staf gudang tetap bisa memasukkan / mengganti URL Webhook secara langsung melalui tombol <strong>"Spreadsheet"</strong> di pojok kanan atas aplikasi. Pengaturan tersebut tersimpan aman di browser dan backend.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-100 border-t border-stone-300 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
