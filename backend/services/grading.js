// 1 = baik, 2 = ringan, 3 = berat.
export function kalkulasiGrading({ tiang, boks, kabel, port } = {}) {
  const nilai = [Number(tiang), Number(boks), Number(kabel), Number(port)];
  if (nilai.some((n) => !Number.isInteger(n) || n < 1 || n > 3))
    throw new Error('Nilai checklist harus bilangan 1 sampai 3');

  const total = nilai.reduce((a, b) => a + b, 0);
  if (nilai.includes(3)) return 'Critical'; // satu parameter rusak berat
  if (total >= 7) return 'Warning';         // tiga parameter atau lebih rusak ringan
  return 'Aman';
}

export const hitungGrade = kalkulasiGrading;
export default kalkulasiGrading;
