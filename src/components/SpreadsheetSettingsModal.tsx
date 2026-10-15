import React, { useState } from 'react';
import { X, Check, Copy, Link2, Sparkles, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { AppSettings } from '../types';
import { GOOGLE_APPS_SCRIPT_CODE } from '../data/googleAppsScriptTemplate';
import { testSheetsConnection } from '../services/api';

interface SpreadsheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SpreadsheetSettingsModal: React.FC<SpreadsheetSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [sheetNameKedatangan, setSheetNameKedatangan] = useState(
    settings.sheetNameKedatangan || 'Kedatangan'
  );
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'guide'>('config');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  React.useEffect(() => {
    setWebhookUrl(settings.webhookUrl || '');
    setSheetNameKedatangan(settings.sheetNameKedatangan || 'Kedatangan');
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      webhookUrl: webhookUrl.trim(),
      sheetNameKedatangan: sheetNameKedatangan.trim() || 'Kedatangan',
    });
    setTestResult({
      success: true,
      message: 'Pengaturan berhasil disimpan!',
    });
  };

  const handleTestConnection = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan URL Webhook Google Apps Script terlebih dahulu!',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    const result = await testSheetsConnection(webhookUrl.trim());
    setIsTesting(false);
    setTestResult(result);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] flex flex-col border border-stone-800 shadow-2xl overflow-hidden rounded-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-700 text-white rounded">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Integrasi Google Drive Spreadsheet
              </h2>
              <p className="text-xs text-stone-300">
                Penyambungan form kedatangan barang otomatis ke Google Sheets via Webhook
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

        {/* Tab navigation */}
        <div className="flex border-b border-stone-300 bg-stone-100 px-5">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Konfigurasi URL Webhook
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'code'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Salin Kode Apps Script
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Petunjuk 4 Langkah
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="bg-white p-4 border border-stone-300 shadow-2xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                    Google Apps Script Web App URL (Webhook) *
                  </label>
                  <p className="text-xs text-stone-500 mb-2">
                    URL deployment Apps Script dari spreadsheet Google Drive Anda (berakhiran <code className="bg-stone-100 px-1 font-mono">/exec</code>).
                  </p>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-2 border border-r-0 border-stone-400 bg-stone-100 text-stone-500">
                      <Link2 className="w-4 h-4" />
                    </span>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-3 py-2 text-sm border border-stone-400 focus:outline-none focus:border-emerald-600 bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Tab Sheet di Spreadsheet
                  </label>
                  <input
                    type="text"
                    value={sheetNameKedatangan}
                    onChange={(e) => setSheetNameKedatangan(e.target.value)}
                    placeholder="Kedatangan"
                    className="w-full sm:w-64 px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Default tab: <strong>Kedatangan</strong>. Sheet akan otomatis dibuat jika belum ada.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-400 hover:bg-stone-100 text-stone-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji koneksi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Uji Koneksi Webhook</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Pengaturan</span>
                </button>
              </div>

              {/* Test Connection Output */}
              {testResult && (
                <div
                  className={`p-3.5 border text-xs leading-relaxed ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-red-50 border-red-400 text-red-900'
                  }`}
                >
                  <p className="font-bold mb-1">
                    {testResult.success ? 'Berhasil Terhubung!' : 'Gagal Menghubungi Webhook:'}
                  </p>
                  <p>{testResult.message}</p>
                </div>
              )}
            </form>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    Kode Google Apps Script (Code.gs)
                  </h3>
                  <p className="text-xs text-stone-500">
                    Salin seluruh skrip di bawah ini ke menu Apps Script Google Spreadsheet Anda
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Semua Kode'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-900 text-stone-100 rounded-none text-[11px] font-mono overflow-x-auto max-h-[380px] leading-relaxed border border-stone-800">
                <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-stone-700">
              <div className="bg-white p-4 border border-stone-300 shadow-2xs space-y-3">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  Buat File Google Spreadsheet di Google Drive
                </h4>
                <p className="pl-7 text-stone-600">
                  Buka Google Drive (<a href="https://drive.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">drive.google.com</a>), buat file Spreadsheet baru dengan nama misalnya <strong>"KMI Wire & Cable - Data Kedatangan Barang"</strong>.
                </p>
              </div>

              <div className="bg-white p-4 border border-stone-300 shadow-2xs space-y-3">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  Buka Apps Script & Tempel Kode
                </h4>
                <p className="pl-7 text-stone-600">
                  Di Google Sheets, klik menu bar atas: <strong>Ekstensi (Extensions) &gt; Apps Script</strong>. Hapus isi file <code className="bg-stone-100 px-1 font-mono">Code.gs</code>, lalu salin dan tempel kode dari tab <em>"Salin Kode Apps Script"</em> di atas. Tekan <strong>Ctrl+S</strong> untuk menyimpan.
                </p>
              </div>

              <div className="bg-white p-4 border border-stone-300 shadow-2xs space-y-3">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  Deploy Sebagai Aplikasi Web (PENTING!)
                </h4>
                <div className="pl-7 space-y-1 text-stone-600">
                  <p>Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &gt; pilih <strong>Deployment Baru</strong>.</p>
                  <p>Pilih tipe <strong>Aplikasi Web (Web App)</strong>.</p>
                  <p>• Deskripsi: <em>KMI Kedatangan Webhook</em></p>
                  <p>• Jalankan sebagai (Execute as): <em>Saya (Email Anda)</em></p>
                  <p className="font-bold text-stone-900">• Siapa yang memiliki akses (Who has access): <span className="text-emerald-700 underline font-bold">SIAPA SAJA (Anyone)</span></p>
                  <p className="text-stone-500 italic">Pilihan "Anyone" wajib dipilih agar data pengiriman formulir dapat masuk langsung.</p>
                </div>
              </div>

              <div className="bg-white p-4 border border-stone-300 shadow-2xs space-y-3">
                <h4 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  Salin URL dan Tempel ke Aplikasi
                </h4>
                <p className="pl-7 text-stone-600">
                  Setelah klik Deploy dan memberikan izin Google, salin URL Aplikasi Web yang muncul (berakhiran <code className="bg-stone-100 px-1 font-mono">/exec</code>), lalu tempel ke tab <em>"Konfigurasi URL Webhook"</em> di menu ini! Klik "Uji Koneksi Webhook" untuk memastikan.
                </p>
              </div>
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
    </div>
  );
};
