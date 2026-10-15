/**
 * =========================================================================
 * GOOGLE APPS SCRIPT UNTUK GOOGLE SPREADSHEET (PT KMI Wire and Cable Tbk)
 * Form Kedatangan Barang & Integrasi Otomatis Google Spreadsheet
 * =========================================================================
 * 
 * Kolom yang dikirim & dicatat di Spreadsheet:
 * 1. Tanggal
 * 2. Nama Barang
 * 3. Kuantitas (Qty)
 * 4. Satuan (U/M)
 * 5. Keterangan
 * 6. No P.R.
 * 7. No P.O.
 * 
 * PANDUAN PENGGUNAAN:
 * 1. Buka Google Spreadsheet di Google Drive Anda.
 * 2. Klik menu: Ekstensi > Apps Script.
 * 3. Hapus semua kode bawaan di Code.gs, lalu Salin & Tempel seluruh kode ini.
 * 4. Klik ikon Simpan (Ctrl+S).
 * 5. (Opsional) Pilih fungsi "testKoneksi" pada dropdown fungsi di atas, lalu klik "Jalankan" (Run).
 * 6. Klik tombol "Terapkan" (Deploy) > "Deployment Baru" (New deployment).
 * 7. Pilih jenis: "Aplikasi Web" (Web app).
 * 8. Jalankan sebagai: "Saya" (email Anda).
 * 9. Siapa yang memiliki akses: "SIAPA SAJA" (Anyone)  <-- WAJIB
 * 10. Berikan izin otorisasi Google (klik Advanced > Go to ... unsafe).
 * 11. Salin URL Web App (/exec) untuk backend environment (GOOGLE_SHEETS_WEBHOOK_URL).
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - PT KMI WIRE AND CABLE TBK
 * Form Kedatangan Barang & Integrasi Database Google Spreadsheet
 * =========================================================================
 * Kolom: Tanggal | Nama Barang | Qty | U/M | Keterangan | No P.R. | No P.O.
 */

// Opsional: Jika Anda membuat Apps Script dari script.google.com (mandiri/standalone),
// masukkan ID Spreadsheet Anda di antara tanda kutip di bawah ini.
// (Jika script dibuka langsung dari menu "Ekstensi > Apps Script" di spreadsheet Anda,
// biarkan kosong '' karena script otomatis mendeteksinya).
var SPREADSHEET_ID = '';

// Header Kolom Tabel Kedatangan Barang (Hanya 7 Kolom)
var HEADER_COLUMNS = [
  'Tanggal',
  'Nama Barang',
  'Kuantitas (Qty)',
  'Satuan (U/M)',
  'Keterangan',
  'No P.R.',
  'No P.O.'
];

/**
 * Helper untuk mendapatkan Spreadsheet secara aman & tahan error
 */
function getSpreadsheet(optionalId) {
  var ss = null;

  // 1. Coba dari parameter ID jika ada
  var idToTry = optionalId || SPREADSHEET_ID;
  if (idToTry && typeof idToTry === 'string' && idToTry.trim() !== '') {
    try {
      ss = SpreadsheetApp.openById(idToTry.trim());
      if (ss) return ss;
    } catch (e) {
      Logger.log('Gagal buka dengan ID: ' + e.message);
    }
  }

  // 2. Coba getActiveSpreadsheet() bawaan Google Sheets
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  // 3. Coba getActive()
  try {
    ss = SpreadsheetApp.getActive();
    if (ss) return ss;
  } catch (e) {}

  return null;
}

/**
 * Inisialisasi sheet dan header jika sheet belum ada atau masih kosong.
 */
function setupSheet(ss, sheetName) {
  if (typeof ss === 'string') {
    sheetName = ss;
    ss = null;
  }

  if (!ss) {
    ss = getSpreadsheet();
  }

  if (!ss) {
    throw new Error(
      'Spreadsheet aktif tidak ditemukan!\\n' +
      'Pastikan Apps Script dibuka langsung dari Google Spreadsheet Anda (menu Ekstensi > Apps Script).\\n' +
      'Jika menggunakan standalone script, isi variabel SPREADSHEET_ID di baris atas kode.'
    );
  }

  var targetName = sheetName || 'Kedatangan';
  var sheet = ss.getSheetByName(targetName);

  if (!sheet) {
    sheet = ss.insertSheet(targetName);
  }

  // Jika sheet kosong, buat header 7 kolom berformat rapi
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_COLUMNS);
    var headerRange = sheet.getRange(1, 1, 1, HEADER_COLUMNS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1b5e20'); // Hijau Resmi KMI
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);

    // Auto-fit lebar kolom
    for (var col = 1; col <= HEADER_COLUMNS.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }

  return sheet;
}

/**
 * FUNGSI UJI / TEST LANGSUNG DARI EDITOR APPS SCRIPT
 */
function testKoneksi() {
  Logger.log('--- MEMULAI UJI KONEKSI ---');
  try {
    var ss = getSpreadsheet();
    if (!ss) {
      Logger.log('❌ GAGAL: Spreadsheet tidak terdeteksi.');
      Logger.log('👉 Solusi: Buka Google Spreadsheet Anda > klik menu Ekstensi > Apps Script.');
      Logger.log('Atau isi SPREADSHEET_ID di baris atas.');
      return;
    }

    var sheet = setupSheet(ss, 'Kedatangan');
    Logger.log('✅ SUKSES TERHUBUNG!');
    Logger.log('Nama Spreadsheet : ' + ss.getName());
    Logger.log('Nama Sheet       : ' + sheet.getName());
    Logger.log('URL Spreadsheet  : ' + ss.getUrl());
    Logger.log('Jumlah Kolom     : ' + HEADER_COLUMNS.length + ' kolom');
    Logger.log('--- UJI KONEKSI SELESAI DENGAN BAIK ---');
  } catch (err) {
    Logger.log('❌ Error: ' + err.message);
  }
}

/**
 * Handle HTTP POST Request (Pengiriman Form Kedatangan dari Backend)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: 'error',
        message: 'Tidak ada data POST yang diterima (e.postData kosong).'
      }, 400);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      if (e.parameter) {
        data = e.parameter;
      } else {
        return createJsonResponse({
          status: 'error',
          message: 'Format data bukan JSON yang valid: ' + parseErr.message
        }, 400);
      }
    }

    var ss = getSpreadsheet(data.spreadsheetId || data.spreadsheet_id);
    if (!ss) {
      return createJsonResponse({
        status: 'error',
        message: 'Spreadsheet tidak ditemukan. Pastikan Apps Script dibuat dari menu Ekstensi > Apps Script di Spreadsheet Anda, atau isi SPREADSHEET_ID.'
      }, 500);
    }

    // 1. PING / TEST KONEKSI
    if (data.action === 'ping' || data.type === 'test') {
      setupSheet(ss, data.sheetName || 'Kedatangan');
      return createJsonResponse({
        status: 'success',
        message: 'Koneksi ke Google Apps Script & Spreadsheet berhasil!',
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        spreadsheetUrl: ss.getUrl(),
        timestamp: new Date().toISOString()
      });
    }

    // 2. SIMPAN DATA KEDATANGAN BARANG (HANYA 7 KOLOM)
    var sheetName = data.sheetName || 'Kedatangan';
    var sheet = setupSheet(ss, sheetName);

    var items = data.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return createJsonResponse({
        status: 'error',
        message: 'Daftar barang (items) kosong atau tidak valid.'
      }, 400);
    }

    var tanggal = data.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    // Batch insert hanya 7 kolom: Tanggal, Barang, Qty, Unit, Keterangan, No PR, No PO
    var rowsToInsert = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var qtyVal = Number(item.qty);
      var safeQty = isNaN(qtyVal) ? (item.qty || '') : qtyVal;
      var cleanPR = item.noPR ? ("'" + item.noPR) : '';
      var cleanPO = (item.noPO || item.noPE) ? ("'" + (item.noPO || item.noPE)) : '';

      rowsToInsert.push([
        tanggal,
        item.barang || '',
        safeQty,
        item.unit || '',
        item.keterangan || '',
        cleanPR,
        cleanPO
      ]);
    }

    if (rowsToInsert.length > 0) {
      var startRow = sheet.getLastRow() + 1;
      var numRows = rowsToInsert.length;
      var numCols = rowsToInsert[0].length;

      var dataRange = sheet.getRange(startRow, 1, numRows, numCols);
      dataRange.setValues(rowsToInsert);
      dataRange.setBorder(true, true, true, true, true, true, '#dcdcdc', SpreadsheetApp.BorderStyle.SOLID);
    }

    return createJsonResponse({
      status: 'success',
      type: 'kedatangan',
      rowCount: items.length,
      sheetName: sheet.getName(),
      spreadsheetName: ss.getName(),
      message: 'Berhasil menyimpan ' + items.length + ' baris kedatangan ke sheet "' + sheet.getName() + '"'
    });

  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: 'Terjadi kesalahan pada Google Apps Script: ' + (err.stack || err.message || err.toString())
    }, 500);
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

/**
 * Handle HTTP GET Request
 */
function doGet(e) {
  var ssName = 'Google Spreadsheet';
  try {
    var ss = getSpreadsheet();
    if (ss) ssName = ss.getName();
  } catch (err) {}

  return createJsonResponse({
    status: 'online',
    appName: 'PT KMI Wire and Cable Tbk - Webhook Kedatangan Barang',
    spreadsheetName: ssName,
    message: 'Layanan Google Apps Script aktif dan siap menerima data POST dari form web kedatangan barang.',
    timestamp: new Date().toISOString()
  });
}

function createJsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
