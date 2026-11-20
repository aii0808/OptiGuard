import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { authRequired, roleOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data, error } = await supabase.from('odp').select('status_fisik');
  if (error) return res.status(500).json({ error: error.message });
  const rekap = { Aman: 0, Warning: 0, Critical: 0 };
  data.forEach((o) => { rekap[o.status_fisik] = (rekap[o.status_fisik] || 0) + 1; });
  res.json(rekap);
});

router.get('/odp', authRequired, async (_req, res) => {
  const { data: odp, error } = await supabase
    .from('odp')
    .select('id, kode_odp, alamat, area, latitude, longitude, kapasitas_port, port_terpakai, status, status_fisik, diblokir, alasan_blokir')
    .order('id');
  if (error) return res.status(500).json({ error: error.message });

  const { data: audit } = await supabase
    .from('audit_valins')
    .select('odp_id, status_akhir, foto_bukti, waktu_audit, kondisi_tiang, kondisi_boks, kondisi_kabel, kondisi_port')
    .order('waktu_audit', { ascending: false });

  const terakhir = new Map();
  (audit || []).forEach((a) => { if (!terakhir.has(a.odp_id)) terakhir.set(a.odp_id, a); });

  res.json(odp.map((o) => ({ ...o, audit_terakhir: terakhir.get(o.id) || null })));
});

router.post('/odp/:id/blokir', authRequired, roleOnly('pimpinan'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id tidak valid' });
  const alasan = String(req.body?.alasan || '').trim().slice(0, 200) || 'Port penuh/rusak sesuai eviden lapangan';
  const { error } = await supabase.rpc('blokir_odp', { p_id: id, p_alasan: alasan });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

router.post('/odp/:id/buka-blokir', authRequired, roleOnly('pimpinan'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id tidak valid' });
  const { error } = await supabase.rpc('buka_blokir_odp', { p_id: id });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

router.get('/statistik', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data: odp, error } = await supabase.from('odp').select('id, area, status_fisik');
  if (error) return res.status(500).json({ error: error.message });

  const { data: audit } = await supabase
    .from('audit_valins')
    .select('odp_id, kondisi_tiang, kondisi_boks, kondisi_kabel, kondisi_port, waktu_audit')
    .order('waktu_audit', { ascending: false });

  const terakhir = new Map();
  (audit || []).forEach((a) => { if (!terakhir.has(a.odp_id)) terakhir.set(a.odp_id, a); });

  const komponen = {
    tiang: { ringan: 0, berat: 0 },
    boks: { ringan: 0, berat: 0 },
    kabel: { ringan: 0, berat: 0 },
    port: { ringan: 0, berat: 0 },
  };
  terakhir.forEach((a) => {
    const nilai = { tiang: a.kondisi_tiang, boks: a.kondisi_boks, kabel: a.kondisi_kabel, port: a.kondisi_port };
    Object.entries(nilai).forEach(([k, v]) => {
      if (v === 2) komponen[k].ringan += 1;
      if (v === 3) komponen[k].berat += 1;
    });
  });

  const perArea = {};
  odp.forEach((o) => {
    const nama = o.area || 'Tanpa area';
    perArea[nama] = perArea[nama] || { Aman: 0, Warning: 0, Critical: 0, total: 0 };
    perArea[nama][o.status_fisik] = (perArea[nama][o.status_fisik] || 0) + 1;
    perArea[nama].total += 1;
  });

  res.json({
    jumlah_odp_diaudit: terakhir.size,
    komponen,
    area: Object.entries(perArea).map(([nama, v]) => ({ nama, ...v })),
  });
});

export default router;