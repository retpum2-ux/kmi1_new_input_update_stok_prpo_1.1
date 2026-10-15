/**
 * ============================================================================
 * LOKASI FILE CSV: code/daftar-barang.csv (atau src/code/daftar-barang.csv)
 * ============================================================================
 * Anda cukup mengedit file "code/daftar-barang.csv" dengan Notepad, Excel,
 * atau teks editor apa saja.
 * Bisa ditulis 1 barang per baris (misal: "Isolasi bening")
 * atau pakai kolom CSV (name,code,category,defaultUnit).
 */

import rawCsv from './daftar-barang.csv?raw';
import { parseItemsFromCSV, ItemBarang } from './csvParser';

export type { ItemBarang };

export const DAFTAR_BARANG: ItemBarang[] = parseItemsFromCSV(rawCsv);
