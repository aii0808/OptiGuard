/**
 * Helper to display human-readable physical inspection status without numeric codes 1, 2, 3
 * Returns: 'Tidak Rusak' (1), 'Rusak Ringan' (2), 'Rusak Berat' (3)
 */
export function formatKondisiTeks(komponen, nilai) {
  const n = Number(nilai);
  if (n === 1) return 'Tidak Rusak';
  if (n === 2) return 'Rusak Ringan';
  if (n === 3) return 'Rusak Berat';
  if (typeof nilai === 'string' && nilai) {
    const s = nilai.toLowerCase();
    if (s.includes('berat') || s.includes('parah') || s.includes('putus') || s.includes('pecah')) return 'Rusak Berat';
    if (s.includes('ringan') || s.includes('kendur') || s.includes('debu') || s.includes('miring') || s.includes('lepas') || s.includes('karat')) return 'Rusak Ringan';
    return 'Tidak Rusak';
  }
  return 'Tidak Rusak';
}
