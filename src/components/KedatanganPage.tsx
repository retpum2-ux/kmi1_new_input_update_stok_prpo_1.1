import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Send, MessageSquare } from 'lucide-react';
import { ItemEntryKedatangan, KedatanganFormData, UpdateMenuTab, PengaturanSubTab } from '../types';
import { ItemSearchDropdown } from './ItemSearchDropdown';
import { UnitSelectDropdown } from './UnitSelectDropdown';
import { WhatsAppModal } from './WhatsAppModal';
import { UpdateMenuDropdown } from './UpdateMenuDropdown';
import { DAFTAR_BARANG, ItemBarang } from '../code/daftar-barang';
import { DAFTAR_SATUAN, SatuanUnit } from '../code/daftar-satuan';

interface KedatanganPageProps {
  onBack?: () => void;
  onSubmit: (formData: KedatanganFormData) => Promise<{ success: boolean; synced: boolean; message: string }>;
  onOpenMaster?: () => void;
  onOpenUpdateMenu?: (tab: UpdateMenuTab, subTab?: PengaturanSubTab) => void;
}

export const KedatanganPage: React.FC<KedatanganPageProps> = ({
  onBack,
  onSubmit,
  onOpenMaster,
  onOpenUpdateMenu,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [tanggal, setTanggal] = useState<string>(todayStr);
  const [itemsList, setItemsList] = useState<ItemBarang[]>(DAFTAR_BARANG);
  const [unitsList, setUnitsList] = useState<SatuanUnit[]>(DAFTAR_SATUAN);

  React.useEffect(() => {
    fetch('/api/csv/daftar-barang')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setItemsList(data);
      })
      .catch(() => {});

    fetch('/api/csv/daftar-satuan')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setUnitsList(data);
      })
      .catch(() => {});
  }, []);

  const [itemList, setItemList] = useState<ItemEntryKedatangan[]>([
    {
      id: `item-kedatangan-1`,
      barang: '',
      qty: '',
      unit: DAFTAR_SATUAN[0]?.code || 'PCS',
      keterangan: '',
      noPR: '',
      noPO: '',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    success: boolean;
    synced: boolean;
    message: string;
  } | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppData, setWhatsAppData] = useState<{
    tanggal: string;
    items: ItemEntryKedatangan[];
  } | null>(null);

  const handleAddItem = () => {
    setItemList((prev) => [
      ...prev,
      {
        id: `item-kedatangan-${Date.now()}`,
        barang: '',
        qty: '',
        unit: unitsList[0]?.code || 'PCS',
        keterangan: '',
        noPR: '',
        noPO: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (itemList.length <= 1) return;
    setItemList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof ItemEntryKedatangan,
    val: string | number,
    itemObj?: ItemBarang
  ) => {
    setItemList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      if (field === 'barang' && itemObj?.defaultUnit) {
        copy[index].unit = itemObj.defaultUnit;
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal || !tanggal.trim()) {
      setSubmitFeedback({
        success: false,
        synced: false,
        message: 'Silakan pilih atau isi Tanggal.',
      });
      return;
    }
    if (itemList.length === 0) {
      setSubmitFeedback({
        success: false,
        synced: false,
        message: 'Silakan isi setidaknya 1 baris barang.',
      });
      return;
    }
    for (let i = 0; i < itemList.length; i++) {
      const it = itemList[i];
      if (!it.barang || !it.barang.trim()) {
        setSubmitFeedback({
          success: false,
          synced: false,
          message: `Kolom Cari / Pilih barang pada Barang ${i + 1} wajib diisi.`,
        });
        return;
      }
      if (!it.qty || String(it.qty).trim() === '' || Number(it.qty) <= 0) {
        setSubmitFeedback({
          success: false,
          synced: false,
          message: `Kolom Qty pada Barang ${i + 1} wajib diisi angka lebih dari 0.`,
        });
        return;
      }
      if (!it.unit || !it.unit.trim()) {
        setSubmitFeedback({
          success: false,
          synced: false,
          message: `Kolom Satuan [ U/M ] pada Barang ${i + 1} wajib dipilih.`,
        });
        return;
      }
      if (!it.keterangan || !it.keterangan.trim()) {
        setSubmitFeedback({
          success: false,
          synced: false,
          message: `Kolom Keterangan pada Barang ${i + 1} wajib diisi.`,
        });
        return;
      }
      if (!it.noPR || !it.noPR.trim()) {
        setSubmitFeedback({
          success: false,
          synced: false,
          message: `Kolom No P.R. pada Barang ${i + 1} wajib diisi.`,
        });
        return;
      }
      if (!it.noPO || !it.noPO.trim()) {
        setSubmitFeedback({
          success: false,
          synced: false,
          message: `Kolom No P.O. pada Barang ${i + 1} wajib diisi.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    const formData: KedatanganFormData = {
      type: 'kedatangan',
      tanggal,
      items: itemList,
    };

    try {
      const res = await onSubmit(formData);
      setSubmitFeedback(res);
      if (res.success) {
        setWhatsAppData({
          tanggal,
          items: [...itemList],
        });
        setItemList([
          {
            id: `item-kedatangan-${Date.now()}`,
            barang: '',
            qty: '',
            unit: unitsList[0]?.code || 'PCS',
            keterangan: '',
            noPR: '',
            noPO: '',
          },
        ]);
      }
    } catch (err: any) {
      setSubmitFeedback({
        success: false,
        synced: false,
        message: `Gagal menyimpan: ${err.message || 'Error tidak diketahui'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Centered layout for mobile and desktop
    <div className="w-full flex flex-col items-center justify-start p-3 sm:p-6 animate-in fade-in">
      {/* Top Quick Navigation Bar above Form (hanya jika ada tombol kembali) */}
      {onBack && (
        <div className="w-full max-w-2xl mb-2 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 px-2.5 py-1 font-bold text-stone-700 bg-white border border-stone-800 rounded-md hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer text-[11px]"
              title="Kembali"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Kembali</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Form Frame with rounded-2xl & Warna Background Lebih Cerah */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-[#f5fbf6] border border-stone-800 rounded-2xl shadow-md p-4 sm:p-8 pt-3 sm:pt-4 relative space-y-5"
      >
        {/* ================= 1. BAGIAN JUDUL & HEADER (DI LUAR KOTAK) ================= */}
        {/* Top row: Company label (Left) & SINGLE UPDATE Button + KMI1 label (Right Corner) */}
        <div className="flex items-center justify-between text-xs sm:text-sm font-semibold tracking-wide">
          <span className="text-stone-700 font-bold whitespace-nowrap">PT KMI Wire and Cable Tbk</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenUpdateMenu && (
              <UpdateMenuDropdown
                onSelectMenu={onOpenUpdateMenu}
              />
            )}
            <span className="text-stone-800 font-extrabold px-1.5 py-0.5 bg-[#e2f0e3] border border-stone-800 rounded text-[10px] tracking-wider">
              KMI1
            </span>
          </div>
        </div>

        {/* Centered Main Header dengan garis dan warna gradasi hijau lembut */}
        <div className="text-center my-2.5 sm:my-3.5 py-2 px-3 bg-gradient-to-r from-[#f5fbf6] via-[#e2f3e4] to-[#f5fbf6] border-y-2 border-stone-800 rounded-lg shadow-2xs space-y-0.5">
          <h2 className="text-sm sm:text-base font-black text-stone-900 tracking-wider uppercase font-sans">
            FORM
          </h2>
          <h1 className="text-xs sm:text-sm md:text-base font-black text-stone-900 tracking-wide uppercase font-sans px-2 leading-tight">
            KEDATANGAN BARANG
          </h1>
        </div>

        {/* Feedback Alert with rounded-xl */}
        {submitFeedback && (
          <div
            className={`p-2.5 border text-[11px] sm:text-xs flex flex-col gap-2 rounded-xl shadow-2xs ${
              submitFeedback.success
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                : 'bg-red-50 border-red-400 text-red-900'
            }`}
          >
            <div className="flex items-start gap-2">
              {submitFeedback.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-bold">{submitFeedback.message}</p>
              </div>
            </div>
            {submitFeedback.success && whatsAppData && (
              <div className="pt-1 flex items-center justify-start border-t border-emerald-200">
                <button
                  type="button"
                  onClick={() => setIsWhatsAppOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] text-white font-bold text-[11px] rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Kirim Laporan ke WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tanggal Input (Di luar kotak, langsung di form) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-stone-900 mb-1">
            Tanggal :
          </label>
          <input
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-stone-800 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ================= 2. BAGIAN KOTAK BARANG (WARNA PUTIH KONTRAS BERSIH) ================= */}
        <div className="space-y-3 pt-0.5">
          {itemList.map((item, index) => (
            <div key={item.id} className="space-y-1">
              {/* Block Label Badge */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#d8ecd9] border border-stone-700/60 rounded-md text-xs sm:text-sm font-bold text-stone-900 shadow-2xs">
                  Barang {index + 1}
                </span>
                {itemList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:text-red-900 font-semibold px-2 py-0.5 rounded-md hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                    title="Hapus baris barang ini"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              {/* Item Card Box with clean white background for contrast */}
              <div className="bg-white border-2 border-stone-800 rounded-xl p-3 space-y-2.5 shadow-xs">
                {/* Row 1: Cari / Pilih barang [ V ] */}
                <div>
                  <ItemSearchDropdown
                    value={item.barang}
                    onChange={(val, itemObj) => handleUpdateItem(index, 'barang', val, itemObj)}
                    items={itemsList}
                    placeholder="Cari / Pilih barang"
                    required={true}
                    onOpenMaster={onOpenMaster}
                  />
                </div>

                {/* Row 2: Qty and [ U/M ] */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      required
                      value={item.qty}
                      onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-800 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-stone-400 font-mono"
                    />
                  </div>
                  <div>
                    <UnitSelectDropdown
                      value={item.unit}
                      onChange={(unitCode) => handleUpdateItem(index, 'unit', unitCode)}
                      units={unitsList}
                      onOpenMasterUnits={onOpenMaster}
                    />
                  </div>
                </div>

                {/* Row 3: Keterangan */}
                <div>
                  <input
                    type="text"
                    required
                    value={item.keterangan}
                    onChange={(e) => handleUpdateItem(index, 'keterangan', e.target.value)}
                    placeholder="Keterangan"
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-800 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-stone-400"
                  />
                </div>

                {/* Row 4: No P.R. */}
                <div>
                  <input
                    type="text"
                    required
                    value={item.noPR}
                    onChange={(e) => handleUpdateItem(index, 'noPR', e.target.value)}
                    placeholder="No P.R."
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-800 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-stone-400 font-mono uppercase"
                  />
                </div>

                {/* Row 5: No P.O. */}
                <div>
                  <input
                    type="text"
                    required
                    value={item.noPO || item.noPE || ''}
                    onChange={(e) => handleUpdateItem(index, 'noPO', e.target.value)}
                    placeholder="No P.O."
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-800 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-stone-400 font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= 3. BAGIAN SIMPAN & AKSI (WARNA PANEL AKSI KHUSUS) ================= */}
        <div className="bg-[#d4ead5] border border-stone-800/60 rounded-xl p-2.5 sm:p-3.5 shadow-2xs space-y-2.5">
          {/* Button: Tambah barang */}
          <div>
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full sm:w-56 py-2 px-3.5 bg-[#a5d6a7] hover:bg-[#92cb94] active:bg-[#7cb97f] text-stone-900 font-bold text-xs sm:text-sm border border-stone-900 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah barang</span>
            </button>
          </div>

          {/* Button: SIMPAN */}
          <div className="pt-0.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3 px-4 bg-[#90caf9] hover:bg-[#80bdff] active:bg-[#68abfc] disabled:opacity-60 text-stone-900 font-extrabold text-sm sm:text-base tracking-wider uppercase border border-stone-900 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>MENYIMPAN...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>SIMPAN</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* WhatsApp Modal */}
      {whatsAppData && (
        <WhatsAppModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          tanggal={whatsAppData.tanggal}
          items={whatsAppData.items}
        />
      )}
    </div>
  );
};
