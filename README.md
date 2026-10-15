# PT KMI Wire and Cable Tbk - Form Kedatangan Barang

Aplikasi web responsif (Komputer desktop, Tablet, dan Smartphone / HP) untuk pencatatan formulir **Kedatangan Barang** dengan sinkronisasi otomatis ke **Google Spreadsheet (Google Drive)** melalui backend.

## Fitur Utama
1. **Halaman Form Kedatangan Barang:**
   - Header resmi *PT KMI Wire and Cable Tbk* (KMI1).
   - Field: *Tanggal*.
   - Dynamic item cards (*Barang 1*, *Barang 2*, dst.):
     - `[ V ]` Cari / Pilih barang (autocomplete pencarian + shortcut tambah master barang).
     - `Qty` + `[ U/M ]` Satuan kuantitas (KG, MTR, PCS, ROLL, dsb.).
     - `Keterangan`.
     - `No P.R.`.
     - `No P.O.`.
   - Tombol **Tambah barang** (menambah blok baris barang kedatangan).
   - Tombol **SIMPAN** (mengirim ke Backend & Google Sheets).
2. **Manajemen Master Data Barang & Satuan [ U/M ]:**
   - Cari & filter barang dan satuan kuantitas secara live.
   - Tambah, edit, dan hapus master barang & satuan.
   - Terhubung dengan live CSV `/api/csv/daftar-barang` dan `/api/csv/daftar-satuan`.
3. **Riwayat Kedatangan Barang & Ekspor:**
   - Riwayat transaksi kedatangan barang tersimpan lokal dan di server.
   - Pencarian cepat berdasarkan nomor PR, nomor PO, nama barang, atau tanggal.
   - Ekspor rekapan langsung ke format **CSV / Excel**.
4. **Integrasi Google Spreadsheet:**
   - Webhook otomatis via Google Apps Script Web App.
   - Pengujian koneksi langsung dari antarmuka aplikasi.

## Cara Update Nama Barang dan Nama Kuantitas (U/M)
### A. Update Nama Barang `[ V ]`:
1. **Langsung dari Form:**
   - Saat berada di form, ketik pada kolom pencarian barang atau klik dropdown `[ V ]`.
   - Di bagian bawah dropdown, klik tautan **"Update Daftar Barang"** atau **"Kelola Master Barang"**.
2. **Atau Melalui Menu Utama:**
   - Klik tombol **"Master Data"** di navigasi atas.
   - Di tab **"Daftar Nama Barang"**, Anda dapat menambah barang baru, mengedit, atau menghapus barang.
   - Perubahan langsung aktif di semua dropdown formulir secara real-time!

### B. Update Nama Kuantitas / Satuan `[ U/M ]`:
1. **Langsung dari Form:**
   - Klik tombol kotak bertuliskan **`[ U/M ]`** pada baris barang.
   - Di bagian bawah dropdown yang muncul, klik **"Update / Tambah Satuan Baru"** atau **"Kelola Satuan"**.
2. **Atau Melalui Menu Utama:**
   - Buka menu **"Master Data"** > Pilih tab **"Daftar Satuan Kuantitas [ U/M ]"**.
   - Masukkan **Kode Satuan** (contoh: `PALLET`, `ROLL`, `KG`, `MTR`, `BOX`) dan **Nama Lengkap Satuan**.
   - Klik **"+ Tambahkan Satuan"**. Satuan baru akan langsung muncul di pilihan `[ U/M ]`.

## Metode Penyambungan ke Google Spreadsheet saat Upload ke GitHub & Vercel
Aplikasi ini dirancang dengan backend endpoint **`POST /api/submit`** (tersedia di Express server `server.ts` dan Vercel Serverless Function `api/submit.ts`).

### Langkah 1: Siapkan Spreadsheet di Google Drive
1. Buka [Google Drive](https://drive.google.com) dan buat **Google Spreadsheet** baru.
2. Di dalam spreadsheet, klik menu **Ekstensi (Extensions)** > **Apps Script**.
3. Hapus kode default di `Code.gs`, lalu tempelkan kode skrip (dapat disalin langsung dari menu **Spreadsheet > Salin Kode Apps Script** di dalam web app ini).
4. Tekan tombol **Simpan** (Ctrl+S).
5. Klik tombol biru **Terapkan (Deploy)** di kanan atas > pilih **Deployment Baru (New Deployment)**.
6. Pilih jenis: **Aplikasi Web (Web App)**:
   - **Deskripsi:** *KMI Kedatangan Webhook*
   - **Jalankan sebagai (Execute as):** *Saya (email Anda)*
   - **Siapa yang memiliki akses (Who has access):** **SIAPA SAJA (Anyone)** *(Wajib dipilih agar webhook dapat menerima data)*.
7. Klik **Terapkan (Deploy)** dan setujui izin akses (*Review permissions*).
8. Salin **URL Aplikasi Web** yang berakhiran `/exec`.

### Langkah 2: Deploy di Vercel & Atur Webhook
- Di Vercel Dashboard, tambahkan environment variable:
  - **Key:** `GOOGLE_SHEETS_WEBHOOK_URL`
  - **Value:** `[URL Web App Apps Script dari Langkah 1]`
- Atau masukkan langsung melalui tombol **"Spreadsheet"** di header navigasi web app.
