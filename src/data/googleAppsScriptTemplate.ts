export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT UNTUK GOOGLE SPREADSHEET (PT KMI Wire and Cable Tbk)
 * Form Kedatangan Barang
 * =========================================================================
 * Panduan Pemasangan:
 * 1. Buka Google Spreadsheet Anda di Google Drive.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode yang ada di Code.gs, lalu Salin & Tempel seluruh kode ini.
 * 4. Klik ikon "Simpan" (Ctrl+S / Cmd+S).
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > "Deployment Baru" (New Deployment).
 * 6. Pada ikon gerigi "Pilih jenis", pilih "Aplikasi Web" (Web app).
 * 7. Isi:
 *    - Deskripsi: KMI Form Kedatangan Webhook
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Siapa yang memiliki akses (Who has access): SIAPA SAJA (Anyone)  <-- PENTING!
 * 8. Klik "Terapkan" (Deploy) & Berikan izin (Review Permissions).
 * 9. Salin URL Aplikasi Web yang diberikan (berakhiran /exec).
 * 10. Masukkan URL tersebut ke Pengaturan Spreadsheet di aplikasi web ini!
 */

function setupSheetsIfMissing(ss) {
  // Sheet Kedatangan
  var sheetKedatangan = ss.getSheetByName('Kedatangan');
  if (!sheetKedatangan) {
    sheetKedatangan = ss.insertSheet('Kedatangan');
    sheetKedatangan.appendRow([
      'Tanggal',
      'Nama Barang',
      'Kuantitas (Qty)',
      'Satuan (U/M)',
      'Keterangan',
      'No P.R.',
      'No P.O.'
    ]);
    sheetKedatangan.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e6f4ea');
    sheetKedatangan.setFrozenRows(1);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    setupSheetsIfMissing(ss);

    // Ping / Test connection
    if (data.action === 'ping' || data.type === 'test') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Google Apps Script berhasil terhubung ke spreadsheet!',
        spreadsheetName: ss.getName(),
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var targetSheetName = data.sheetName || 'Kedatangan';
    var sheetK = ss.getSheetByName(targetSheetName);

    if (!sheetK) {
      sheetK = ss.insertSheet(targetSheetName);
      sheetK.appendRow([
        'Tanggal',
        'Nama Barang',
        'Kuantitas (Qty)',
        'Satuan (U/M)',
        'Keterangan',
        'No P.R.',
        'No P.O.'
      ]);
      sheetK.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e6f4ea');
      sheetK.setFrozenRows(1);
    }

    var itemsK = data.items || [];
    for (var j = 0; j < itemsK.length; j++) {
      var it = itemsK[j];
      sheetK.appendRow([
        data.tanggal || '',
        it.barang || '',
        it.qty || '',
        it.unit || '',
        it.keterangan || '',
        it.noPR || '',
        it.noPO || it.noPE || ''
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      type: 'kedatangan',
      transactionId: transactionId,
      rowCount: itemsK.length,
      message: 'Data kedatangan barang berhasil ditambahkan ke sheet ' + sheetK.getName()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Webhook Google Apps Script untuk Form Kedatangan Barang PT KMI Wire and Cable Tbk aktif.'
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
