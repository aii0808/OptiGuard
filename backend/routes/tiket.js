import { Router } from 'express';
import { supabase } from '../services/supabase.js';
import { authRequired, roleOnly } from '../middleware/auth.js';
import { kirimTelegram, pesanTiketBaru } from '../services/telegram.js';

const router = Router();

// Helper to parse stored area_klaster (which may be a string or JSON with specific odp_ids and route)
export function parseAreaKlaster(raw) {
  if (!raw) return { area: '', odp_ids: null, rute: null };
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      return {
        area: parsed.area || '',
        odp_ids: Array.isArray(parsed.odp_ids) ? parsed.odp_ids : null,
        rute: Array.isArray(parsed.rute) ? parsed.rute : null,
      };
    } catch {}
  }
  return { area: raw, odp_ids: null, rute: null };
}

// 1. Daftar area untuk dropdown
router.get('/area', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data, error } = await supabase.from('odp').select('area').not('area', 'is', null);
  if (error) return res.status(500).json({ error: error.message });
  res.json([...new Set(data.map((o) => o.area))].sort());
});

// 2. Daftar teknisi untuk dropdown pimpinan
router.get('/teknisi', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, nama_lengkap, email')
    .eq('role', 'teknisi')
    .order('nama_lengkap');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 3. Buat tiket (Pimpinan) - Mendukung pemilihan ODP spesifik & rute pengerjaan
router.post('/', authRequired, roleOnly('pimpinan'), async (req, res) => {
  let { area_klaster, teknisi_id, tanggal_tugas, odp_ids, rute } = req.body || {};
  if (!area_klaster)
    return res.status(400).json({ error: 'area_klaster wajib diisi' });

  if (!teknisi_id || teknisi_id === 'pool') {
    teknisi_id = 99;
  } else {
    teknisi_id = Number(teknisi_id);
  }

  // Cek jumlah ODP target
  let targetCount = 0;
  if (Array.isArray(odp_ids) && odp_ids.length > 0) {
    const { count } = await supabase
      .from('odp').select('*', { count: 'exact', head: true }).in('id', odp_ids);
    targetCount = count || odp_ids.length;
  } else {
    const { count } = await supabase
      .from('odp').select('*', { count: 'exact', head: true }).eq('area', area_klaster);
    if (!count) return res.status(400).json({ error: 'Tidak ada ODP di area ini' });
    targetCount = count;
  }

  const { data: teknisi } = await supabase
    .from('users')
    .select('id, role, nama_lengkap, telegram_chat_id')
    .eq('id', teknisi_id)
    .maybeSingle();

  const isOpenPool = teknisi_id === 99;
  const namaTeknisi = isOpenPool ? 'OPEN POOL (Siaga Terbuka)' : (teknisi?.nama_lengkap || `Teknisi #${teknisi_id}`);

  // Simpan area_klaster dengan payload JSON jika memilih ODP spesifik & rute
  let areaKlasterValue = area_klaster;
  if (Array.isArray(odp_ids) && odp_ids.length > 0) {
    areaKlasterValue = JSON.stringify({
      area: area_klaster,
      odp_ids,
      rute: Array.isArray(rute) ? rute : [],
    });
  }

  const { data, error } = await supabase
    .from('tiket_patroli')
    .insert({
      pimpinan_id: req.user.id,
      teknisi_id,
      area_klaster: areaKlasterValue,
      ...(tanggal_tugas && { tanggal_tugas }),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Format pesan Telegram dengan rute pengerjaan
  const teks = pesanTiketBaru({
    tiket: data,
    areaName: area_klaster,
    rute: Array.isArray(rute) && rute.length > 0 ? rute : null,
    teknisi: isOpenPool ? '📢 OPEN POOL (Dapat diambil oleh seluruh teknisi patroli)' : namaTeknisi,
    jumlahOdp: targetCount,
    pimpinan: req.user.nama,
  });

  // Kirim ke teknisi langsung jika ada chat_id
  let directTerkirim = false;
  if (!isOpenPool && teknisi?.telegram_chat_id) {
    directTerkirim = await kirimTelegram(teknisi.telegram_chat_id, teks);
  }

  // Kirim ke grup Telegram
  const targetGroup = (process.env.TELEGRAM_OPTIGUARD_GROUP_ID || '').trim() || process.env.TELEGRAM_GROUP_ID;
  let groupTerkirim = false;
  if (targetGroup) {
    groupTerkirim = await kirimTelegram(targetGroup, teks);
  }

  res.status(201).json({
    tiket: data,
    jumlah_odp: targetCount,
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

  const enriched = (data || []).map((t) => {
    const meta = parseAreaKlaster(t.area_klaster);
    return {
      ...t,
      area_name: meta.area,
      rute: meta.rute,
      target_odp_ids: meta.odp_ids,
    };
  });

  res.json(enriched);
});

// 5. Klaim / Ambil Tiket Open Pool oleh Teknisi
router.post('/:id/klaim', authRequired, roleOnly('teknisi'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id tiket tidak valid' });

  const { data: tiket, error: errCek } = await supabase
    .from('tiket_patroli')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (errCek || !tiket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
  if (tiket.teknisi_id !== 99 && tiket.teknisi_id !== req.user.id) {
    return res.status(409).json({ error: 'Tiket ini sudah diambil oleh teknisi lain' });
  }

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

  const meta = parseAreaKlaster(tiket.area_klaster);
  const targetGroup = (process.env.TELEGRAM_OPTIGUARD_GROUP_ID || '').trim() || process.env.TELEGRAM_GROUP_ID;
  if (targetGroup) {
    kirimTelegram(targetGroup, `👷 <b>Tiket #${id} (${meta.area || 'Patroli'})</b> telah diambil/diklaim oleh teknisi: <b>${req.user.nama}</b>.`);
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

  const enriched = (data || []).map((t) => {
    const meta = parseAreaKlaster(t.area_klaster);
    return {
      ...t,
      area_name: meta.area,
      rute: meta.rute,
      target_odp_ids: meta.odp_ids,
    };
  });

  res.json(enriched);
});

// 7. Antrean ODP dalam satu tiket (Mematuhi rute spesifik yang dipilih pimpinan)
router.get('/:id/odp', authRequired, async (req, res) => {
  const { data: tiket } = await supabase
    .from('tiket_patroli').select('*').eq('id', req.params.id).maybeSingle();
  if (!tiket) return res.status(404).json({ error: 'Tiket tidak ditemukan' });
  if (req.user.role === 'teknisi' && tiket.teknisi_id !== req.user.id && tiket.teknisi_id !== 99)
    return res.status(403).json({ error: 'Bukan tiket kamu' });

  const meta = parseAreaKlaster(tiket.area_klaster);
  const baseArea = meta.area;
  const targetOdpIds = meta.odp_ids;

  let q = supabase
    .from('odp')
    .select('id, kode_odp, alamat, latitude, longitude, kapasitas_port, status_fisik, port_terpakai, diblokir');

  if (targetOdpIds && targetOdpIds.length > 0) {
    q = q.in('id', targetOdpIds);
  } else {
    q = q.eq('area', baseArea);
  }

  const { data: odp, error } = await q;
  if (error) return res.status(500).json({ error: error.message });

  // Urutkan ODP sesuai urutan rute yang ditetapkan pimpinan
  let orderedOdp = odp || [];
  if (targetOdpIds && targetOdpIds.length > 0) {
    const orderMap = new Map(targetOdpIds.map((id, index) => [id, index]));
    orderedOdp = [...orderedOdp].sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
  } else {
    orderedOdp = [...orderedOdp].sort((a, b) => a.id - b.id);
  }

  const { data: audit } = await supabase
    .from('audit_valins').select('odp_id, status_akhir, foto_bukti, kondisi_tiang, kondisi_boks, kondisi_kabel, kondisi_port, waktu_audit').eq('tiket_id', tiket.id);
  const byOdp = new Map((audit || []).map((a) => [a.odp_id, a]));

  res.json({
    tiket: {
      ...tiket,
      area_name: baseArea,
      rute: meta.rute,
      target_odp_ids: targetOdpIds,
    },
    area_name: baseArea,
    rute: meta.rute,
    odp: orderedOdp.map((o, idx) => ({
      ...o,
      urutan_rute: idx + 1,
      audit: byOdp.get(o.id) || null,
    })),
  });
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
