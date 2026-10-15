/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KedatanganPage } from './components/KedatanganPage';
import { MasterDataManager } from './components/MasterDataManager';
import { SpreadsheetSettingsModal } from './components/SpreadsheetSettingsModal';
import { RecordsHistoryModal } from './components/RecordsHistoryModal';
import { VercelGuideModal } from './components/VercelGuideModal';
import {
  KedatanganFormData,
  AppSettings,
  MasterItem,
  MasterUnit,
  SubmissionRecord,
  ItemStock,
  ItemPrPo,
  UnitConversionRule,
  ItemUnitFormula,
  UpdateMenuTab,
  PengaturanSubTab,
} from './types';
import {
  submitFormData,
  getAppSettings,
  saveAppSettings,
  getMasterItems,
  saveMasterItems,
  getMasterUnits,
  saveMasterUnits,
  getLocalRecords,
  clearLocalRecords,
  getItemStocks,
  saveItemStocks,
  getItemPrPos,
  saveItemPrPos,
  getConversionRules,
  saveConversionRules,
  getItemFormulas,
  saveItemFormulas,
} from './services/api';
import { DEFAULT_SETTINGS } from './data/initialMasterData';
import { UpdateCenterModal } from './components/UpdateCenterModal';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [masterUnits, setMasterUnits] = useState<MasterUnit[]>([]);
  const [records, setRecords] = useState<SubmissionRecord[]>([]);

  // Update System States
  const [stocks, setStocks] = useState<ItemStock[]>([]);
  const [prpos, setPrpos] = useState<ItemPrPo[]>([]);
  const [conversionRules, setConversionRules] = useState<UnitConversionRule[]>([]);
  const [itemFormulas, setItemFormulas] = useState<ItemUnitFormula[]>([]);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeUpdateTab, setActiveUpdateTab] = useState<UpdateMenuTab>('menu1-ringkasan');
  const [activePengaturanSubTab, setActivePengaturanSubTab] = useState<PengaturanSubTab>('rumus');

  // Modals state
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // Load settings, items, units, and local records
    getAppSettings().then(setSettings);
    getMasterItems().then((items) => {
      setMasterItems(items);
      getItemStocks(items).then(setStocks);
      getItemPrPos(items).then(setPrpos);
      getItemFormulas(items).then(setItemFormulas);
    });
    getMasterUnits().then(setMasterUnits);
    getConversionRules().then(setConversionRules);
    setRecords(getLocalRecords());
  }, []);

  const handleOpenUpdateMenu = (tab: UpdateMenuTab, subTab?: PengaturanSubTab) => {
    setActiveUpdateTab(tab);
    if (subTab) setActivePengaturanSubTab(subTab);
    setIsUpdateModalOpen(true);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveAppSettings(newSettings);
  };

  const handleSaveItems = async (items: MasterItem[]) => {
    setMasterItems(items);
    await saveMasterItems(items);
  };

  const handleSaveUnits = async (units: MasterUnit[]) => {
    setMasterUnits(units);
    await saveMasterUnits(units);
  };

  const handleSaveStocks = async (newStocks: ItemStock[]) => {
    setStocks(newStocks);
    await saveItemStocks(newStocks);
  };

  const handleSavePrPos = async (newPrpos: ItemPrPo[]) => {
    setPrpos(newPrpos);
    await saveItemPrPos(newPrpos);
  };

  const handleSaveConversionRules = async (rules: UnitConversionRule[]) => {
    setConversionRules(rules);
    await saveConversionRules(rules);
  };

  const handleSaveItemFormulas = async (formulas: ItemUnitFormula[]) => {
    setItemFormulas(formulas);
    await saveItemFormulas(formulas);
  };

  const handleClearRecords = () => {
    clearLocalRecords();
    setRecords([]);
  };

  const handleSubmitForm = async (
    formData: KedatanganFormData
  ): Promise<{ success: boolean; synced: boolean; message: string }> => {
    const result = await submitFormData(formData);
    setRecords(getLocalRecords());

    // Otomatis update stok saat barang kedatangan berhasil disimpan
    if (result.success && formData.items.length > 0) {
      setStocks((prevStocks) => {
        const copy = [...prevStocks];
        formData.items.forEach((it) => {
          const qty = Number(it.qty) || 0;
          const matchIdx = copy.findIndex(
            (s) => s.itemName.toLowerCase() === it.barang.toLowerCase()
          );
          if (matchIdx >= 0) {
            copy[matchIdx] = {
              ...copy[matchIdx],
              currentStock: copy[matchIdx].currentStock + qty,
              lastUpdated: new Date().toISOString(),
            };
          }
        });
        saveItemStocks(copy);
        return copy;
      });
    }

    return result;
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 antialiased selection:bg-emerald-600 selection:text-white">
      {/* Main View Area: Form Kedatangan Barang */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-6">
        <KedatanganPage
          onSubmit={handleSubmitForm}
          onOpenMaster={() => handleOpenUpdateMenu('menu4-pengaturan', 'barang')}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenUpdateMenu={handleOpenUpdateMenu}
          recordsCount={records.length}
          sheetsConnected={Boolean(settings.webhookUrl)}
        />
      </main>

      {/* UPDATE CENTER MODAL (Menu 1, Menu 2, Menu 3, Menu 4) */}
      <UpdateCenterModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        activeTab={activeUpdateTab}
        onTabChange={setActiveUpdateTab}
        initialPengaturanSubTab={activePengaturanSubTab}
        masterItems={masterItems}
        masterUnits={masterUnits}
        stocks={stocks}
        prpos={prpos}
        conversionRules={conversionRules}
        itemFormulas={itemFormulas}
        records={records}
        onSaveStocks={handleSaveStocks}
        onSavePrPos={handleSavePrPos}
        onSaveItems={handleSaveItems}
        onSaveUnits={handleSaveUnits}
        onSaveConversionRules={handleSaveConversionRules}
        onSaveItemFormulas={handleSaveItemFormulas}
      />

      {/* Other Modals */}
      <MasterDataManager
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
        items={masterItems}
        units={masterUnits}
        onSaveItems={handleSaveItems}
        onSaveUnits={handleSaveUnits}
      />

      <SpreadsheetSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <RecordsHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={records}
        onClearRecords={handleClearRecords}
      />

      <VercelGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenMaster={() => handleOpenUpdateMenu('menu4-pengaturan', 'barang')}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
