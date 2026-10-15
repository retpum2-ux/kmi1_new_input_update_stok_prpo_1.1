/**
 * ============================================================================
 * LOKASI FILE CSV: code/daftar-satuan.csv (atau src/code/daftar-satuan.csv)
 * ============================================================================
 * Anda cukup mengedit file "code/daftar-satuan.csv" dengan Notepad, Excel,
 * atau teks editor apa saja.
 * Bisa ditulis 1 satuan per baris (misal: "pcs", "kg", "liter")
 * atau pakai kolom CSV (code,name).
 */

import rawCsv from './daftar-satuan.csv?raw';
import { parseUnitsFromCSV, SatuanUnit } from './csvParser';

export type { SatuanUnit };

export const DAFTAR_SATUAN: SatuanUnit[] = parseUnitsFromCSV(rawCsv);
