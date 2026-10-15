import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Search, RotateCcw, Check, Sparkles } from 'lucide-react';
import { MasterItem, MasterUnit } from '../types';
import { INITIAL_MASTER_ITEMS, INITIAL_MASTER_UNITS } from '../data/initialMasterData';

interface MasterDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MasterItem[];
  units: MasterUnit[];
  onSaveItems: (items: MasterItem[]) => void;
  onSaveUnits: (units: MasterUnit[]) => void;
  initialTab?: 'barang' | 'satuan';
}

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  isOpen,
  onClose,
  items,
  units,
  onSaveItems,
  onSaveUnits,
  initialTab = 'barang',
}) => {
  const [activeTab, setActiveTab] = useState<'barang' | 'satuan'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Item form state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemCategory, setItemCategory] = useState('Bahan Baku');
  const [itemUnit, setItemUnit] = useState('KG');
  const [itemDesc, setItemDesc] = useState('');

  // Unit form state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // ================= ITEM ACTIONS =================
  const handleStartEditItem = (item: MasterItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemCode(item.code);
    setItemCategory(item.category || 'Bahan Baku');
    setItemUnit(item.defaultUnit || 'KG');
    setItemDesc(item.description || '');
  };

  const handleCancelItemEdit = () => {
    setEditingItemId(null);
    setItemName('');
    setItemCode('');
    setItemCategory('Bahan Baku');
    setItemUnit('KG');
    setItemDesc('');
  };

  const handleSaveItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    if (editingItemId) {
      // Update existing
      const updated = items.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              name: itemName.trim(),
              code: itemCode.trim() || `ITM-${Date.now().toString().slice(-4)}`,
              category: itemCategory.trim(),
              defaultUnit: itemUnit.trim(),
              description: itemDesc.trim(),
            }
          : it
      );
      onSaveItems(updated);
      showNotification(`Barang "${itemName}" berhasil diperbarui!`);
    } else {
      // Add new
      const newItem: MasterItem = {
        id: `item-${Date.now()}`,
        name: itemName.trim(),
        code: itemCode.trim() || `ITM-${(items.length + 1).toString().padStart(3, '0')}`,
        category: itemCategory.trim() || 'Umum',
        defaultUnit: itemUnit.trim() || 'PCS',
        description: itemDesc.trim(),
      };
      onSaveItems([newItem, ...items]);
      showNotification(`Barang baru "${itemName}" berhasil ditambahkan!`);
    }

    handleCancelItemEdit();
  };

  const handleDeleteItem = (id: string, name: string) => {
    const updated = items.filter((it) => it.id !== id);
    onSaveItems(updated);
    showNotification(`Barang "${name}" dihapus.`);
  };

  const handleResetItems = () => {
    onSaveItems(INITIAL_MASTER_ITEMS);
    showNotification('Daftar barang dikembalikan ke default.');
  };

  // ================= UNIT ACTIONS =================
  const handleStartEditUnit = (unit: MasterUnit) => {
    setEditingUnitId(unit.id);
    setUnitCode(unit.code);
    setUnitName(unit.name);
  };

  const handleCancelUnitEdit = () => {
    setEditingUnitId(null);
    setUnitCode('');
    setUnitName('');
  };

  const handleSaveUnitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitCode.trim() || !unitName.trim()) return;

    const formattedCode = unitCode.trim().toUpperCase();

    if (editingUnitId) {
      const updated = units.map((u) =>
        u.id === editingUnitId
          ? { ...u, code: formattedCode, name: unitName.trim() }
          : u
      );
      onSaveUnits(updated);
      showNotification(`Satuan "${formattedCode}" berhasil diperbarui!`);
    } else {
      const newUnit: MasterUnit = {
        id: `unit-${Date.now()}`,
        code: formattedCode,
        name: unitName.trim(),
      };
      onSaveUnits([...units, newUnit]);
      showNotification(`Satuan baru "${formattedCode}" berhasil ditambahkan!`);
    }

    handleCancelUnitEdit();
  };

  const handleDeleteUnit = (id: string, code: string) => {
    const updated = units.filter((u) => u.id !== id);
    onSaveUnits(updated);
    showNotification(`Satuan "${code}" dihapus.`);
  };

  const handleResetUnits = () => {
    onSaveUnits(INITIAL_MASTER_UNITS);
    showNotification('Daftar satuan dikembalikan ke default.');
  };

  // Filtered lists
  const filteredItems = items.filter((it) => {
    const q = searchQuery.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      (it.code && it.code.toLowerCase().includes(q)) ||
      (it.category && it.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] flex flex-col border border-stone-800 shadow-2xl overflow-hidden rounded-none">
        {/* Header */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Kelola Master Data (Barang & Satuan U/M)
            </h2>
            <p className="text-xs text-stone-300">
              Lokasi pembaruan daftar nama barang [ V ] dan nama label kuantitas [ U/M ]
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification pill */}
        {notification && (
          <div className="bg-emerald-600 text-white text-xs py-1.5 px-4 flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-stone-300 bg-stone-100 px-5">
          <button
            type="button"
            onClick={() => setActiveTab('barang')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'barang'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Daftar Nama Barang ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('satuan')}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'satuan'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Daftar Satuan Kuantitas [ U/M ] ({units.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
          {activeTab === 'barang' ? (
            <div className="space-y-6">
              {/* Form Input / Edit Item */}
              <div className="bg-white p-4 border border-stone-300 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                    {editingItemId ? (
                      <>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                        Edit Barang: {itemName}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-emerald-600" />
                        Tambah Barang Baru ke Daftar [ V ]
                      </>
                    )}
                  </h3>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={handleCancelItemEdit}
                      className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveItemForm} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nama Barang *
                      </label>
                      <input
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Contoh: Copper Wire Rod Cu 8.00 mm"
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Kode Barang
                      </label>
                      <input
                        type="text"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        placeholder="Contoh: CU-ROD-08"
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white uppercase font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Kategori
                      </label>
                      <input
                        type="text"
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        placeholder="Bahan Baku / Isolasi / dll"
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Satuan Default (U/M)
                      </label>
                      <select
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white"
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.code}>
                            {u.code} - {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Keterangan / Spesifikasi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={itemDesc}
                        onChange={(e) => setItemDesc(e.target.value)}
                        placeholder="Catatan tambahan spesifikasi material..."
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {editingItemId && (
                      <button
                        type="button"
                        onClick={handleCancelItemEdit}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                    >
                      {editingItemId ? 'Simpan Perubahan' : '+ Tambahkan ke Master'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Items List Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama barang, kode, atau kategori..."
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-stone-400 bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleResetItems}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 transition-colors cursor-pointer"
                  title="Kembalikan barang bawaan pabrik KMI"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset ke Bawaan Pabrik
                </button>
              </div>

              {/* Items Table */}
              <div className="bg-white border border-stone-300 overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-stone-200">
                  <thead className="bg-stone-100 text-stone-700 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2.5 w-12 text-center">No</th>
                      <th className="px-3 py-2.5 w-28">Kode</th>
                      <th className="px-3 py-2.5">Nama Barang</th>
                      <th className="px-3 py-2.5 w-28">Kategori</th>
                      <th className="px-3 py-2.5 w-20 text-center">U/M</th>
                      <th className="px-3 py-2.5 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-3 py-2 text-center text-stone-500 font-mono">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 font-mono font-medium text-stone-600">
                            {item.code}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            <p className="text-stone-900">{item.name}</p>
                            {item.description && (
                              <p className="text-[11px] text-stone-500">{item.description}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-stone-600">
                            <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                              {item.category || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-blue-700">
                            {item.defaultUnit || 'PCS'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditItem(item)}
                                className="p-1 text-stone-600 hover:text-blue-600 hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Edit barang"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1 text-stone-600 hover:text-red-600 hover:bg-stone-100 transition-colors cursor-pointer"
                                title="Hapus barang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-stone-500">
                          Tidak ada barang yang cocok dengan pencarian "{searchQuery}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ================= SATUAN TAB ================= */
            <div className="space-y-6">
              {/* Form Input / Edit Unit */}
              <div className="bg-white p-4 border border-stone-300 shadow-2xs">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <h3 className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                    {editingUnitId ? (
                      <>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                        Edit Satuan: {unitCode}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-emerald-600" />
                        Tambah Label Satuan Kuantitas Baru [ U/M ]
                      </>
                    )}
                  </h3>
                  {editingUnitId && (
                    <button
                      type="button"
                      onClick={handleCancelUnitEdit}
                      className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveUnitForm} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Kode Singkatan Satuan (U/M) *
                      </label>
                      <input
                        type="text"
                        required
                        value={unitCode}
                        onChange={(e) => setUnitCode(e.target.value)}
                        placeholder="Contoh: PALLET, MTR, KG"
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white uppercase font-mono font-bold"
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nama / Penjelasan Satuan *
                      </label>
                      <input
                        type="text"
                        required
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        placeholder="Contoh: Pallet Kayu / Alas Kemasan"
                        className="w-full px-3 py-1.5 text-sm border border-stone-400 focus:outline-none focus:border-blue-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {editingUnitId && (
                      <button
                        type="button"
                        onClick={handleCancelUnitEdit}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                    >
                      {editingUnitId ? 'Simpan Satuan' : '+ Tambahkan Satuan'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Units Table */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-600 font-medium">
                  Total {units.length} satuan kuantitas terdaftar
                </p>
                <button
                  type="button"
                  onClick={handleResetUnits}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Satuan ke Bawaan
                </button>
              </div>

              <div className="bg-white border border-stone-300 overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-stone-200">
                  <thead className="bg-stone-100 text-stone-700 font-semibold uppercase">
                    <tr>
                      <th className="px-3 py-2.5 w-12 text-center">No</th>
                      <th className="px-3 py-2.5 w-32">Label U/M</th>
                      <th className="px-3 py-2.5">Keterangan / Nama Satuan</th>
                      <th className="px-3 py-2.5 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {units.map((unit, idx) => (
                      <tr key={unit.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-3 py-2 text-center text-stone-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-mono font-bold text-xs bg-stone-100 border border-stone-300 px-2 py-0.5 text-stone-900">
                            [ {unit.code} ]
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-stone-800">
                          {unit.name}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEditUnit(unit)}
                              className="p-1 text-stone-600 hover:text-blue-600 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Edit satuan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit.id, unit.code)}
                              className="p-1 text-stone-600 hover:text-red-600 hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Hapus satuan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-stone-100 border-t border-stone-300 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Perubahan disimpan otomatis ke sistem & langsung muncul di dropdown formulir.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
