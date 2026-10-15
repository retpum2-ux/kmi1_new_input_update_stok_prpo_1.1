import React from 'react';
import {
  X,
  FileSpreadsheet,
  PackageCheck,
  FileClock,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  MasterItem,
  MasterUnit,
  ItemStock,
  ItemPrPo,
  UnitConversionRule,
  ItemUnitFormula,
  SubmissionRecord,
  UpdateMenuTab,
  PengaturanSubTab,
} from '../types';
import { Menu1Ringkasan } from './update/Menu1Ringkasan';
import { Menu2StokBarang } from './update/Menu2StokBarang';
import { Menu3UpdatePrPo } from './update/Menu3UpdatePrPo';
import { Menu4Pengaturan } from './update/Menu4Pengaturan';

interface UpdateCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: UpdateMenuTab;
  onTabChange: (tab: UpdateMenuTab) => void;
  initialPengaturanSubTab?: PengaturanSubTab;
  masterItems: MasterItem[];
  masterUnits: MasterUnit[];
  stocks: ItemStock[];
  prpos: ItemPrPo[];
  conversionRules: UnitConversionRule[];
  itemFormulas: ItemUnitFormula[];
  records: SubmissionRecord[];
  onSaveStocks: (stocks: ItemStock[]) => Promise<void> | void;
  onSavePrPos: (prpos: ItemPrPo[]) => Promise<void> | void;
  onSaveItems: (items: MasterItem[]) => Promise<void> | void;
  onSaveUnits: (units: MasterUnit[]) => Promise<void> | void;
  onSaveConversionRules: (rules: UnitConversionRule[]) => Promise<void> | void;
  onSaveItemFormulas: (formulas: ItemUnitFormula[]) => Promise<void> | void;
}

export const UpdateCenterModal: React.FC<UpdateCenterModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  initialPengaturanSubTab = 'rumus',
  masterItems,
  masterUnits,
  stocks,
  prpos,
  conversionRules,
  itemFormulas,
  records,
  onSaveStocks,
  onSavePrPos,
  onSaveItems,
  onSaveUnits,
  onSaveConversionRules,
  onSaveItemFormulas,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-5xl bg-[#f8faf9] border border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-white font-black text-sm shadow-xs">
              U
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-sm sm:text-base tracking-wide uppercase">
                  Menu Update & Master Data
                </h2>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 bg-emerald-700/80 text-emerald-200 border border-emerald-500/40 rounded font-bold">
                  PT KMI Wire and Cable Tbk
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Pembaruan Stok Qty, PR PO, Rumus Kuantitas & Master Barang
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/60 transition-colors cursor-pointer"
            title="Tutup Menu Update"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Main Tabs Bar */}
        <div className="bg-stone-200/80 px-2 sm:px-4 pt-1.5 border-b border-stone-300 flex overflow-x-auto gap-1">
          {/* Tab 1: Ringkasan */}
          <button
            type="button"
            onClick={() => onTabChange('menu1-ringkasan')}
            className={`py-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'menu1-ringkasan'
                ? 'bg-[#f8faf9] text-emerald-950 border-t-2 border-x border-emerald-700 border-b-transparent shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Menu 1 : Ringkasan Hasil</span>
          </button>

          {/* Tab 2: Stok Qty Barang */}
          <button
            type="button"
            onClick={() => onTabChange('menu2-stok')}
            className={`py-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'menu2-stok'
                ? 'bg-[#f8faf9] text-blue-950 border-t-2 border-x border-blue-600 border-b-transparent shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Menu 2 : Stok Qty Barang</span>
          </button>

          {/* Tab 3: Update PR PO */}
          <button
            type="button"
            onClick={() => onTabChange('menu3-prpo')}
            className={`py-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'menu3-prpo'
                ? 'bg-[#f8faf9] text-amber-950 border-t-2 border-x border-amber-600 border-b-transparent shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <FileClock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menu 3 : Update PR PO</span>
          </button>

          {/* Tab 4: Pengaturan */}
          <button
            type="button"
            onClick={() => onTabChange('menu4-pengaturan')}
            className={`py-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'menu4-pengaturan'
                ? 'bg-[#f8faf9] text-purple-950 border-t-2 border-x border-purple-600 border-b-transparent shadow-xs'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-purple-600" />
            <span>Menu 4 : Pengaturan</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'menu1-ringkasan' && (
            <Menu1Ringkasan
              masterItems={masterItems}
              stocks={stocks}
              prpos={prpos}
              conversionRules={conversionRules}
              records={records}
            />
          )}

          {activeTab === 'menu2-stok' && (
            <Menu2StokBarang
              masterItems={masterItems}
              stocks={stocks}
              conversionRules={conversionRules}
              onSaveStocks={onSaveStocks}
            />
          )}

          {activeTab === 'menu3-prpo' && (
            <Menu3UpdatePrPo
              masterItems={masterItems}
              prpos={prpos}
              onSavePrPos={onSavePrPos}
            />
          )}

          {activeTab === 'menu4-pengaturan' && (
            <Menu4Pengaturan
              initialSubTab={initialPengaturanSubTab}
              masterItems={masterItems}
              masterUnits={masterUnits}
              conversionRules={conversionRules}
              itemFormulas={itemFormulas}
              onSaveItems={onSaveItems}
              onSaveUnits={onSaveUnits}
              onSaveConversionRules={onSaveConversionRules}
              onSaveItemFormulas={onSaveItemFormulas}
            />
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 py-3 bg-stone-100 border-t border-stone-300 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800">Status Data:</span>
            <span>Tersinkronisasi lokal & server</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
