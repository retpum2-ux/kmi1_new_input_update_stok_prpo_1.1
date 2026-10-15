import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  FileSpreadsheet,
  PackageCheck,
  FileClock,
  Settings,
  Calculator,
  Package,
  Scale,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { UpdateMenuTab, PengaturanSubTab } from '../types';

interface UpdateMenuDropdownProps {
  onSelectMenu: (tab: UpdateMenuTab, subTab?: PengaturanSubTab) => void;
  onOpenSettings?: () => void;
  className?: string;
}

export const UpdateMenuDropdown: React.FC<UpdateMenuDropdownProps> = ({
  onSelectMenu,
  onOpenSettings,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChoose = (tab: UpdateMenuTab, subTab?: PengaturanSubTab) => {
    setIsOpen(false);
    onSelectMenu(tab, subTab);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Sleek, compact Button "UPDATE" with smaller font */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1 font-bold uppercase tracking-wide rounded-md border transition-all cursor-pointer shadow-2xs px-2 py-1 text-[11px] sm:text-xs ${
          isOpen
            ? 'bg-emerald-800 text-white border-emerald-950 ring-2 ring-emerald-500/30'
            : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-900 active:bg-emerald-900'
        }`}
        title="Buka Menu Update"
      >
        <RefreshCw className={`w-3 h-3 stroke-[2] ${isOpen ? 'animate-spin' : ''}`} />
        <span>UPDATE</span>
        <ChevronDown
          className={`w-3 h-3 stroke-[2] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Panel with compact typography */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-white border border-stone-800 shadow-xl z-50 overflow-hidden divide-y divide-stone-200 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-3 py-2 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between text-[11px]">
            <span className="font-bold tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              Menu Update & Pengaturan
            </span>
            <span className="text-[9px] bg-emerald-800 text-emerald-200 px-1.5 py-0.2 rounded font-mono font-bold">
              KMI1
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {/* Menu 1 */}
            <button
              type="button"
              onClick={() => handleChoose('menu1-ringkasan')}
              className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-start gap-2.5 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-stone-900 group-hover:text-emerald-950">
                    Menu 1 : Ringkasan Hasil
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                    Excel
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                  Ringkasan hasil update & mutasi barang, export ke Excel (.xls / .csv).
                </p>
              </div>
            </button>

            {/* Menu 2 */}
            <button
              type="button"
              onClick={() => handleChoose('menu2-stok')}
              className="w-full text-left p-2 rounded-lg hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-start gap-2.5 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                <PackageCheck className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-stone-900 group-hover:text-blue-950">
                    Menu 2 : Stok Qty Barang
                  </span>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                    Tabel Edit
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                  Tabel stok barang dengan search & edit stok langsung di baris barang.
                </p>
              </div>
            </button>

            {/* Menu 3 */}
            <button
              type="button"
              onClick={() => handleChoose('menu3-prpo')}
              className="w-full text-left p-2 rounded-lg hover:bg-amber-50 active:bg-amber-100 transition-colors flex items-start gap-2.5 cursor-pointer group"
            >
              <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <FileClock className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] text-stone-900 group-hover:text-amber-950">
                    Menu 3 : Update PR PO
                  </span>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                    Import/Export
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                  Update Tgl PR, No PR, No PO pada setiap barang dengan Import & Export.
                </p>
              </div>
            </button>

            {/* Menu 4 */}
            <div className="pt-0.5 border-t border-stone-200">
              <button
                type="button"
                onClick={() => handleChoose('menu4-pengaturan', 'rumus')}
                className="w-full text-left p-1.5 rounded-md hover:bg-purple-50 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-purple-100 text-purple-800 flex items-center justify-center">
                    <Settings className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-[11px] text-stone-900 group-hover:text-purple-950">
                    Menu 4 : Pengaturan
                  </span>
                </div>
                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1 py-0.2 rounded">
                  3 Sub-Menu
                </span>
              </button>

              {/* Sub-menu items of Menu 4 */}
              <div className="pl-6 pr-1 py-0.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleChoose('menu4-pengaturan', 'rumus')}
                  className="w-full text-left px-1.5 py-1 rounded hover:bg-purple-50 text-[10px] font-medium text-stone-700 hover:text-purple-900 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Calculator className="w-2.5 h-2.5 text-purple-600" />
                    <span>1. Update Satuan Terkecil</span>
                  </span>
                  <span className="text-[8px] text-stone-400 font-mono">Tabel & Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChoose('menu4-pengaturan', 'barang')}
                  className="w-full text-left px-1.5 py-1 rounded hover:bg-purple-50 text-[10px] font-medium text-stone-700 hover:text-purple-900 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Package className="w-2.5 h-2.5 text-emerald-600" />
                    <span>2. Update Daftar Nama Barang</span>
                  </span>
                  <span className="text-[8px] text-stone-400 font-mono">Import/Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleChoose('menu4-pengaturan', 'kuantitas')}
                  className="w-full text-left px-1.5 py-1 rounded hover:bg-purple-50 text-[10px] font-medium text-stone-700 hover:text-purple-900 flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1">
                    <Scale className="w-2.5 h-2.5 text-purple-600" />
                    <span>3. Update Daftar Kuantitas (U/M)</span>
                  </span>
                  <span className="text-[8px] text-stone-400 font-mono">Import/Export</span>
                </button>
              </div>
            </div>

            {/* Integrasi Google Spreadsheet (Script & Webhook) */}
            {onOpenSettings && (
              <div className="pt-1 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left p-1.5 rounded-md hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <FileSpreadsheet className="w-3 h-3" />
                    </div>
                    <span className="font-bold text-[11px] text-stone-900 group-hover:text-emerald-950">
                      Integrasi Google Spreadsheet
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                    Script / Webhook
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
