import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { authRequired, roleOnly } from '../middleware/auth.js';
import { kirimTelegram, pesanTiketBaru } from '../services/telegram.js';

const router = Router();

// 1. Daftar area untuk dropdown
router.get('/area', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data, error } = await supabase.from('odp').select('area').not('area', 'is', null);
  if (error) return res.status(500).json({ error: error.message });
  res.json([...new Set(data.map((o) => o.area))].sort());
});

// 2. Daftar teknisi untuk dropdown pimpinan (Sertakan opsi Siaga Open Pool id 99)
router.get('/teknisi', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama_lengkap, email')
    .eq('role', 'teknisi')
    .order('nama_lengkap');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 3. Buat tiket (Pimpinan) - Mendukung Open Pool (id: 99) maupun penugasan teknisi spesifik
router.post('/', authRequired, roleOnly('pimpinan'), async (req, res) => {
  let { area_klaster, teknisi_id, tanggal_tugas } = req.body || {};
  if (!area_klaster)
    return res.status(400).json({ error: 'area_klaster wajib diisi' });

  // Jika teknisi_id tidak diisi atau memilih 'pool', arahkan ke id 99 (Siaga Pool Terbuka)
  if (!teknisi_id || teknisi_id === 'pool') {
    teknisi_id = 99;
  } else {
    teknisi_id = Number(teknisi_id);
  }

  const { count } = await supabase
    .from('odp').select('*', { count: 'exact', head: true }).eq('area', area_klaster);
  if (!count) return res.status(400).json({ error: 'Tidak ada ODP di area ini' });

  const { data: teknisi } = await supabase
    .from('users')
    .select('id, role, nama_lengkap, telegram_chat_id')
    .eq('id', teknisi_id)
    .maybeSingle();

  const isOpenPool = teknisi_id === 99;
  const namaTeknisi = isOpenPool ? 'OPEN POOL (Siaga Terbuka)' : (teknisi?.nama_lengkap || `Teknisi #${teknisi_id}`);

  const { data, error } = await supabase
    .from('tiket_patroli')
    .insert({
      pimpinan_id: req.user.id,
      teknisi_id,
      area_klaster,
      ...(tanggal_tugas && { tanggal_tugas }),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Format pesan Telegram
  const teks = pesanTiketBaru({
    tiket: data,
    teknisi: isOpenPool ? '📢 OPEN POOL (Dapat diambil oleh seluruh teknisi patroli)' : namaTeknisi,
    jumlahOdp: count,
    pimpinan: req.user.nama,
  });

  // Kirim ke teknisi langsung jika spesifik & ada chat_id
  let directTerkirim = false;
  if (!isOpenPool && teknisi?.telegram_chat_id) {
    directTerkirim = await kirimTelegram(teknisi.telegram_chat_id, teks);
  }

  // Kirim ke grup Telegram
  // Memprioritaskan grup khusus OptiGuard jika ada
  const targetGroup = (process.env.TELEGRAM_OPTIGUARD_GROUP_ID || '').trim() || process.env.TELEGRAM_GROUP_ID;
  let groupTerkirim = false;
  if (targetGroup) {
    groupTerkirim = await kirimTelegram(targetGroup, teks);
  }

  res.status(201).json({
    tiket: data,
    jumlah_odp: count,
    is_open_pool: isOpenPool,
    telegram_terkirim: directTerkirim || groupTerkirim,
    target_group: targetGroup,
  });
});

// 4. Daftar tiket Open Pool (Tersedia untuk semua teknisi)
router.get('/open-pool', authRequired, async (_req, res) => {
  const { data, error } = await supabase
    .from('tiket_patroli')
    .select('*')
    .eq('teknisi_id', 99)
    .neq('status_tiket', 'Selesai')
    .order('id', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 5. Klaim / Ambil Tiket Open Pool oleh Teknisi
router.post('/:id/klaim', authRequired, roleOnly('teknisi'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id tiket tidak valid' });

  // Cek apakah tiket saat ini ada di open pool (teknisi_id 99)
  const { data: tiket, error: errCek } = await supabase
    .from('tiket_patroli')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (errCek || !tiket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
  if (tiket.teknisi_id !== 99 && tiket.teknisi_id !== req.user.id) {
    return res.status(409).json({ error: 'Tiket ini sudah diambil oleh teknisi lain' });
  }

  // Klaim tiket: update teknisi_id ke req.user.id dan status jadi 'In Progress'
  const { data: updated, error } = await supabase
    .from('tiket_patroli')
    .update({
      teknisi_id: req.user.id,
      status_tiket: 'In Progress',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notifikasi Telegram bahwa tiket telah diklaim
  const targetGroup = (process.env.TELEGRAM_OPTIGUARD_GROUP_ID || '').trim() || process.env.TELEGRAM_GROUP_ID;
  if (targetGroup) {
    kirimTelegram(targetGroup, `👷 <b>Tiket #${id} (${tiket.area_klaster})</b> telah diambil/diklaim oleh teknisi: <b>${req.user.nama}</b>.`);
  }

  res.json({
    ok: true,
    message: `Tiket #${id} berhasil Anda ambil!`,
    tiket: updated,
  });
});

// 6. Daftar tiket (pimpinan: semua, teknisi: milik sendiri)
router.get('/', authRequired, async (req, res) => {
  let q = supabase.from('tiket_patroli').select('*').order('id', { ascending: false });
  if (req.user.role === 'teknisi') {
    q = q.eq('teknisi_id', req.user.id);
  }
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 7. Antrean ODP dalam satu tiket
router.get('/:id/odp', authRequired, async (req, res) => {
  const { data: tiket } = await supabase
    .from('tiket_patroli').select('*').eq('id', req.params.id).maybeSingle();
  if (!tiket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
  if (req.user.role === 'teknisi' && tiket.teknisi_id !== req.user.id && tiket.teknisi_id !== 99)
    return res.status(403).json({ error: 'Bukan tiket kamu' });

  const { data: odp, error } = await supabase
    .from('odp')
    .select('id, kode_odp, alamat, latitude, longitude, kapasitas_port, status_fisik, port_terpakai, diblokir')
    .eq('area', tiket.area_klaster)
    .order('id');
  if (error) return res.status(500).json({ error: error.message });

  const { data: audit } = await supabase
    .from('audit_valins').select('odp_id, status_akhir, foto_bukti, kondisi_tiang, kondisi_boks, kondisi_kabel, kondisi_port, waktu_audit').eq('tiket_id', tiket.id);
  const byOdp = new Map((audit || []).map((a) => [a.odp_id, a]));

  res.json({ tiket, odp: odp.map((o) => ({ ...o, audit: byOdp.get(o.id) || null })) });
});

// 8. Teknisi mulai mengerjakan tiket (Pending -> In Progress)
router.post('/:id/mulai', authRequired, roleOnly('teknisi'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id tidak valid' });

  const { data: tiket } = await supabase
    .from('tiket_patroli').select('*').eq('id', id).maybeSingle();
  if (!tiket || tiket.teknisi_id !== req.user.id)
    return res.status(403).json({ error: 'Tiket tidak ditemukan atau bukan milik kamu' });
  if (tiket.status_tiket !== 'Pending')
    return res.status(409).json({ error: `Tiket sudah berstatus ${tiket.status_tiket}` });

  const { data, error } = await supabase
    .from('tiket_patroli')
    .update({ status_tiket: 'In Progress' })
    .eq('id', id)
    .eq('status_tiket', 'Pending')
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tiket: data });
});

export default router;
