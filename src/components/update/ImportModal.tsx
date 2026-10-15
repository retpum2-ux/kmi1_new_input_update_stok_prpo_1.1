import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { parseUploadedCsv, triggerFileDownload } from '../../utils/excelExport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  templateFileName: string;
  templateCsvContent: string;
  expectedColumnsDescription: string;
  onApplyImport: (rows: string[][], headers: string[]) => { success: boolean; message: string; count?: number };
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  templateFileName,
  templateCsvContent,
  expectedColumnsDescription,
  onApplyImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    triggerFileDownload(templateCsvContent, templateFileName, 'text/csv;charset=utf-8;');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      try {
        const parsed = parseUploadedCsv(text);
        if (parsed.rows.length === 0) {
          setImportStatus({
            type: 'error',
            message: 'File CSV kosong atau tidak memiliki baris data.',
          });
          setParsedData(null);
        } else {
          setParsedData(parsed);
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Gagal membaca format CSV: ${err.message}`,
        });
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!parsedData || parsedData.rows.length === 0) {
      setImportStatus({ type: 'error', message: 'Silakan pilih file CSV terlebih dahulu.' });
      return;
    }

    const res = onApplyImport(parsedData.rows, parsedData.headers);
    if (res.success) {
      setImportStatus({ type: 'success', message: res.message });
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1400);
    } else {
      setImportStatus({ type: 'error', message: res.message });
    }
  };

  const handleReset = () => {
    setFileContent('');
    setFileName('');
    setParsedData(null);
    setImportStatus(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-800 text-white border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-300" />
            <h2 className="font-black text-base sm:text-lg tracking-wide">{title}</h2>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <p className="text-stone-600">{description}</p>

          {/* Template info & Download button */}
          <div className="p-3 bg-stone-50 border border-stone-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-stone-800">Format Kolom yang Didukung:</p>
              <p className="text-stone-600 font-mono text-[11px] mt-0.5">{expectedColumnsDescription}</p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-400 font-bold rounded-lg text-xs shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download Template CSV</span>
            </button>
          </div>

          {/* File Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50/60 hover:bg-emerald-50/30 transition-all rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />
            <FileText className="w-9 h-9 text-emerald-600" />
            <div>
              <p className="font-bold text-stone-800 text-sm">
                {fileName ? `File terpilih: ${fileName}` : 'Klik untuk memilih file CSV dari komputer'}
              </p>
              <p className="text-stone-500 text-xs mt-0.5">Format file .csv (UTF-8 didukung)</p>
            </div>
          </div>

          {/* Feedback Status */}
          {importStatus && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                  : 'bg-red-50 border-red-400 text-red-900'
              }`}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Preview of Parsed Data */}
          {parsedData && parsedData.rows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <span>Pratinjau Data ({parsedData.rows.length} baris terdeteksi):</span>
                <span className="text-emerald-700">Siap diimpor</span>
              </div>
              <div className="max-h-48 overflow-auto border border-stone-300 rounded-lg bg-white shadow-inner">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-100 text-stone-700 sticky top-0 border-b border-stone-300">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      {parsedData.headers.map((h, i) => (
                        <th key={i} className="p-2 border-r border-stone-200">
                          {h || `Kolom ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {parsedData.rows.slice(0, 10).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50">
                        <td className="p-2 text-center text-stone-500 font-mono">{rIdx + 1}</td>
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-stone-100 text-stone-800 truncate max-w-[150px]">
                            {val || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.rows.length > 10 && (
                <p className="text-[11px] text-stone-500 text-right">
                  ...menampilkan 10 baris pertama dari total {parsedData.rows.length} baris.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-300 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 bg-white hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!parsedData || parsedData.rows.length === 0}
            onClick={handleExecuteImport}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan Import Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
