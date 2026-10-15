/**
 * =========================================================================
 * GOOGLE APPS SCRIPT UNTUK GOOGLE SPREADSHEET (PT KMI Wire and Cable Tbk)
 * Form Kedatangan Barang & Integrasi Otomatis Google Spreadsheet
 * =========================================================================
 * 
 * PANDUAN LENGKAP PEMASANGAN DI GOOGLE DRIVE:
 * 1. Buka Google Spreadsheet baru atau yang sudah ada di Google Drive Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > pilih "Apps Script".
 * 3. Hapus seluruh baris kode yang ada di editor bawaan (Code.gs).
 * 4. Salin (Copy) dan Tempel (Paste) SELURUH KODE di bawah ini.
 * 5. Klik ikon "Simpan" (Ctrl+S / Cmd+S).
 * 6. Klik tombol biru "Terapkan" (Deploy) di pojok kanan atas > pilih "Deployment Baru" (New deployment).
 * 7. Klik ikon gerigi (Select type) di sebelah kiri > pilih "Aplikasi Web" (Web app).
 * 8. Isi konfigurasi:
 *    - Deskripsi          : KMI Webhook Form Kedatangan Barang
 *    - Jalankan sebagai   : Saya (Execute as me - email Anda)
 *    - Siapa yang memiliki akses : SIAPA SAJA (Anyone)  <--- WAJIB DIPILIH!
 * 9. Klik tombol "Terapkan" (Deploy) lalu klik "Berikan Izin" (Authorize access / Review permissions).
 *    (Jika muncul pesan "Google hasn't verified this app", klik link "Advanced" > lalu "Go to ... (unsafe)").
 * 10. Salin "URL Aplikasi Web" (Web App URL yang berakhiran "/exec").
 * 11. Tempel URL tersebut ke menu Pengaturan Spreadsheet di aplikasi web KMI!
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - PT KMI WIRE AND CABLE TBK
 * Form Kedatangan Barang & Integrasi Database Google Spreadsheet
 * =========================================================================
 * 
 * PANDUAN PEMASANGAN:
 * 1. Buka Google Spreadsheet di Google Drive.
 * 2. Buka menu Ekstensi > Apps Script.
 * 3. Hapus semua kode bawaan di Code.gs, lalu Salin & Tempel seluruh kode ini.
 * 4. Klik Simpan (Ctrl+S).
 * 5. Klik Terapkan (Deploy) > Deployment Baru (New deployment) > Jenis: Aplikasi Web (Web app).
 * 6. Jalankan sebagai: Saya (email Anda)
 * 7. Akses: Siapa Saja (Anyone)  <-- WAJIB
 * 8. Berikan izin otorisasi Google.
 * 9. Salin URL Web App (/exec) dan tempel di pengaturan aplikasi web KMI.
 */

// Konfigurasi Header Kolom Tabel Kedatangan
var HEADER_COLUMNS = [
  'Tanggal',
  'Nama Barang',
  'Kuantitas (Qty)',
  'Satuan (U/M)',
  'Keterangan',
  'No P.R.',
  'No P.O.',
  'Waktu Input',
  'ID Transaksi'
];

/**
 * Inisialisasi sheet dan header jika sheet belum ada atau masih kosong
 */
function setupSheet(ss, sheetName) {
  var targetName = sheetName || 'Kedatangan';
  var sheet = ss.getSheetByName(targetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(targetName);
  }
  
  // Jika sheet kosong (tidak ada baris atau cell A1 kosong), buat header otomatis
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_COLUMNS);
    var headerRange = sheet.getRange(1, 1, 1, HEADER_COLUMNS.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1b5e20'); // Hijau KMI
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    sheet.setRowHeight(1, 32);
    sheet.setFrozenRows(1);
    
    // Auto resize lebar kolom
    for (var col = 1; col <= HEADER_COLUMNS.length; col++) {
      sheet.autoResizeColumn(col);
    }
  }
  
  return sheet;
}

/**
 * Handle HTTP POST Request (Pengiriman data Form & Test Connection)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = lock.tryLock(30000); // Kunci 30 detik agar aman dari race condition
  
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
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
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
    
    // 2. SIMPAN DATA KEDATANGAN BARANG
    var sheetName = data.sheetName || 'Kedatangan';
    var sheet = setupSheet(ss, sheetName);
    
    var items = data.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return createJsonResponse({
        status: 'error',
        message: 'Daftar barang (items) kosong atau tidak valid.'
      }, 400);
    }
    
    var transactionId = data.transactionId || ('TRX-' + new Date().getTime());
    var tanggal = data.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    var waktuInput = data.timestamp || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
    
    // Siapkan data baris untuk batch insert (jauh lebih cepat dan hemat quota)
    var rowsToInsert = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var qtyVal = Number(item.qty);
      var safeQty = isNaN(qtyVal) ? (item.qty || '') : qtyVal;
      var cleanPR = item.noPR ? ("'" + item.noPR) : ''; // Tanda kutip tunggal agar leading zero tetap utuh
      var cleanPO = (item.noPO || item.noPE) ? ("'" + (item.noPO || item.noPE)) : '';
      
      rowsToInsert.push([
        tanggal,
        item.barang || '',
        safeQty,
        item.unit || '',
        item.keterangan || '',
        cleanPR,
        cleanPO,
        waktuInput,
        transactionId
      ]);
    }
    
    if (rowsToInsert.length > 0) {
      var startRow = sheet.getLastRow() + 1;
      var numRows = rowsToInsert.length;
      var numCols = rowsToInsert[0].length;
      
      var dataRange = sheet.getRange(startRow, 1, numRows, numCols);
      dataRange.setValues(rowsToInsert);
      
      // Styling garis border rapi
      dataRange.setBorder(true, true, true, true, true, true, '#dcdcdc', SpreadsheetApp.BorderStyle.SOLID);
    }
    
    return createJsonResponse({
      status: 'success',
      type: 'kedatangan',
      transactionId: transactionId,
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
 * Handle HTTP GET Request (Pengecekan Status dari Web Browser)
 */
function doGet(e) {
  var ssName = 'Google Spreadsheet';
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
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

/**
 * Helper pembuat response output JSON standar Apps Script
 */
function createJsonResponse(obj, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
