import { ItemEntryKedatangan } from '../types';

/**
 * Format tanggal dari 'YYYY-MM-DD' menjadi format bahasa Indonesia
 * Contoh: '2026-10-05' -> '5 Oktober 2026'
 */
export function formatTanggalIndonesia(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];

      const monthName = months[monthIdx] || parts[1];
      return `${day} ${monthName} ${year}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    // fallback to original string
  }
  return dateStr;
}

/**
 * Format laporan WhatsApp sesuai spesifikasi:
 * 
 * DATANG BARANG
 * Tgl: 5 Oktober 2026
 * ---------------------
 * 1. Isolasi Kertas = 20 pcs = Diterima dengann baik
 * 2. Isolasi hijau = 10 pcs = Kurang dari jumlah
 */
export function generateWhatsAppMessage(
  tanggal: string,
  items: Array<Pick<ItemEntryKedatangan, 'barang' | 'qty' | 'unit' | 'keterangan'>>
): string {
  const formattedDate = formatTanggalIndonesia(tanggal);
  const validItems = items.filter((it) => it.barang && it.barang.trim());

  const lines = [
    'DATANG BARANG',
    `Tgl: ${formattedDate}`,
    '---------------------',
  ];

  validItems.forEach((it, idx) => {
    const itemNo = idx + 1;
    const namaBarang = it.barang.trim();
    const qty = it.qty !== undefined && it.qty !== '' ? it.qty : '0';
    const unit = (it.unit || 'pcs').toLowerCase();
    const keterangan = it.keterangan ? it.keterangan.trim() : '-';

    lines.push(`${itemNo}. ${namaBarang} = ${qty} ${unit} = ${keterangan}`);
  });

  return lines.join('\n');
}

/**
 * Buat tautan WhatsApp wa.me untuk membuka langsung chat WhatsApp atau grup
 * Jika phoneNumber kosong, akan membuka picker share WhatsApp
 */
export function getWhatsAppShareUrl(message: string, phoneNumber?: string): string {
  const cleanPhone = (phoneNumber || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}
