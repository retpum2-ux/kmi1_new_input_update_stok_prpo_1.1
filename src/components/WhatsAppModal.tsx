import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, Phone } from 'lucide-react';
import { ItemEntryKedatangan } from '../types';
import { generateWhatsAppMessage, getWhatsAppShareUrl } from '../utils/whatsapp';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  tanggal: string;
  items: Array<Pick<ItemEntryKedatangan, 'barang' | 'qty' | 'unit' | 'keterangan'>>;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  tanggal,
  items,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    return localStorage.getItem('kmi_wa_target_phone') || '';
  });
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const messageText = generateWhatsAppMessage(tanggal, items);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWA = () => {
    if (phoneNumber.trim()) {
      localStorage.setItem('kmi_wa_target_phone', phoneNumber.trim());
    }
    const url = getWhatsAppShareUrl(messageText, phoneNumber.trim());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-lg flex flex-col border-2 border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with WhatsApp green accent */}
        <div className="px-5 py-3.5 bg-[#128C7E] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#25D366] text-white rounded-lg shadow-2xs">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide">
                Kirim Laporan ke WhatsApp
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Format otomatis laporan kedatangan barang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 bg-stone-50">
          {/* Optional Phone Number */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              Nomor WhatsApp Tujuan (Opsional):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Contoh: 08123456789 atau kosongkan untuk pilih kontak/grup"
                className="w-full pl-9 pr-3 py-2 bg-white border border-stone-400 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-stone-500">
              Jika dikosongkan, Anda dapat memilih kontak atau grup WhatsApp secara langsung saat aplikasi terbuka.
            </p>
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>Preview Pesan:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer text-xs"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-white border border-stone-300 rounded-xl text-xs font-mono text-stone-900 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto shadow-inner select-all">
              {messageText}
            </pre>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3.5 bg-white border-t border-stone-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-stone-400 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-400 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Salin</span>
            </button>
            <button
              type="button"
              onClick={handleSendWA}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] text-white text-xs font-black rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Buka WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
