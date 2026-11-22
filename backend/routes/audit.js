import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../services/supabase.js';
import { authRequired, roleOnly } from '../middleware/auth.js';
import { hitungGrade } from '../services/grading.js';
import { parseAreaKlaster } from './tiket.js';
import { kirimTelegram } from '../services/telegram.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

// Kirim audit checklist (Teknisi)
router.post('/', authRequired, roleOnly('teknisi'), upload.single('foto'), async (req, res) => {
  const b = req.body || {};
  const tiket_id = Number(b.tiket_id);
  const odp_id = Number(b.odp_id);

  if (!Number.isInteger(tiket_id) || !Number.isInteger(odp_id))
    return res.status(400).json({ error: 'tiket_id dan odp_id wajib angka valid' });
  if (!req.file)
    return res.status(400).json({ error: 'Foto eviden wajib diunggah' });

  // Validasi nilai kuesioner 1..3
  const poin = [b.tiang, b.boks, b.kabel, b.port].map(Number);
  if (poin.some((p) => !Number.isInteger(p) || p < 1 || p > 3))
    return res.status(400).json({ error: 'Nilai kondisi fisik harus bernilai 1, 2, atau 3' });

  const status = hitungGrade(b);

  const { data: tiket } = await supabase
    .from('tiket_patroli').select('*').eq('id', tiket_id).maybeSingle();
  if (!tiket || tiket.teknisi_id !== req.user.id)
    return res.status(403).json({ error: 'Tiket tidak ditemukan atau bukan milik kamu' });
  if (tiket.status_tiket === 'Selesai')
    return res.status(409).json({ error: 'Tiket ini sudah berstatus Selesai' });

  // Jika status tiket masih Pending, otomatis aktifkan menjadi In Progress saat audit pertama
  if (tiket.status_tiket === 'Pending') {
    await supabase
      .from('tiket_patroli')
      .update({ status_tiket: 'In Progress' })
      .eq('id', tiket_id);
  }

  const meta = parseAreaKlaster(tiket.area_klaster);
  const baseArea = meta.area;
  const targetOdpIds = meta.odp_ids;

  const { data: odp } = await supabase.from('odp').select('id, kode_odp, area').eq('id', odp_id).maybeSingle();
  if (!odp || (odp.area && odp.area !== baseArea))
    return res.status(400).json({ error: 'ODP bukan bagian dari area klaster tiket ini' });

  if (targetOdpIds && targetOdpIds.length > 0 && !targetOdpIds.includes(odp_id)) {
    return res.status(400).json({ error: 'ODP ini tidak termasuk dalam daftar target rute tugas tiket ini' });
  }

  // Upload foto ke Storage
  const ext = req.file.mimetype.split('/')[1] || 'jpg';
  const path = `tiket-${tiket_id}/odp-${odp_id}-${Date.now()}.${ext}`;
  const up = await supabase.storage.from('evidence')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype });
  if (up.error) return res.status(500).json({ error: 'Upload foto gagal: ' + up.error.message });
  const foto_url = supabase.storage.from('evidence').getPublicUrl(path).data.publicUrl;

  // Database check constraint audit_valins: ('Normal', 'Warning', 'Critical')
  const statusAuditValins = status === 'Aman' ? 'Normal' : status;

  // Simpan audit + update odp + update tiket dalam satu transaksi via RPC
  const { error } = await supabase.rpc('submit_audit', {
    p_tiket_id: tiket_id, p_odp_id: odp_id,
    p_tiang: Number(b.tiang), p_boks: Number(b.boks),
    p_kabel: Number(b.kabel), p_port: Number(b.port),
    p_status: statusAuditValins, p_foto: foto_url,
  });
  if (error) {
    await supabase.storage.from('evidence').remove([path]);
    return res.status(400).json({ error: error.message });
  }

  // Cek apakah seluruh ODP dalam tiket ini sudah selesai diaudit
  let qTarget = supabase.from('odp').select('id');
  if (targetOdpIds && targetOdpIds.length > 0) {
    qTarget = qTarget.in('id', targetOdpIds);
  } else {
    qTarget = qTarget.eq('area', baseArea);
  }
  const { data: targetOdps } = await qTarget;
  const totalTarget = targetOdps?.length || 1;

  const { data: auditsDone } = await supabase
    .from('audit_valins')
    .select('odp_id')
    .eq('tiket_id', tiket_id);

  const doneCount = auditsDone?.length || 0;
  const semuaSelesai = totalTarget > 0 && doneCount >= totalTarget;

  if (semuaSelesai) {
    await supabase
      .from('tiket_patroli')
      .update({ status_tiket: 'Selesai' })
      .eq('id', tiket_id);

    // Kirim notifikasi Telegram bahwa seluruh pekerjaan tiket selesai
    const targetGroup = (process.env.TELEGRAM_OPTIGUARD_GROUP_ID || '').trim() || process.env.TELEGRAM_GROUP_ID || '-1003810209824';
    const pesanSelesai = [
      '✅ <b>[OPTIGUARD] Tugas Tiket Patroli Selesai!</b>',
      '',
      `📋 Tiket: <b>#${tiket_id}</b>`,
      `📍 Wilayah Klaster: <b>${baseArea}</b>`,
      `👷 Teknisi Pelaksana: <b>${req.user.nama}</b>`,
      `🎯 Total ODP Selesai Divalidasi: <b>${doneCount} dari ${totalTarget} Titik ODP</b>`,
      '',
      'Seluruh titik ODP telah diaudit fisik dan foto eviden tersimpan aman di sistem OptiGuard.',
      '',
      '🔗 <b>Buka Laporan & Berita Acara:</b>',
      'https://optiguard-ten.vercel.app/login',
    ].join('\n');
    kirimTelegram(targetGroup, pesanSelesai);
  }

  res.json({
    ok: true,
    status_akhir: status,
    foto_url,
    semua_selesai: semuaSelesai,
    total_target: totalTarget,
    audited_count: doneCount,
  });
});

// Rekap seluruh laporan kerja lapangan (Pimpinan melihat semua, teknisi melihat tugasnya)
router.get('/laporan', authRequired, async (req, res) => {
  try {
    const [auditRes, tiketRes, odpRes, usersRes] = await Promise.all([
      supabase.from('audit_valins').select('*').order('waktu_audit', { ascending: false }),
      supabase.from('tiket_patroli').select('*'),
      supabase.from('odp').select('*'),
      supabase.from('users').select('id, nama_lengkap'),
    ]);

    if (auditRes.error) return res.status(500).json({ error: auditRes.error.message });

    const tiketMap = new Map((tiketRes.data || []).map((t) => [t.id, t]));
    const odpMap = new Map((odpRes.data || []).map((o) => [o.id, o]));
    const userMap = new Map((usersRes.data || []).map((u) => [u.id, u.nama_lengkap]));

    let reports = (auditRes.data || []).map((a) => {
      const tiket = tiketMap.get(a.tiket_id) || {};
      const odp = odpMap.get(a.odp_id) || {};
      const meta = parseAreaKlaster(tiket.area_klaster);
      return {
        id: a.id,
        waktu_audit: a.waktu_audit,
        tiket_id: a.tiket_id,
        area_klaster: meta.area || odp.area || '-',
        rute: meta.rute || null,
        tanggal_tugas: tiket.tanggal_tugas || null,
        status_tiket: tiket.status_tiket || 'Selesai',
        teknisi_id: tiket.teknisi_id,
        teknisi_nama: userMap.get(tiket.teknisi_id) || (tiket.teknisi_id === 99 ? 'Open Pool' : `#${tiket.teknisi_id}`),
        pimpinan_nama: userMap.get(tiket.pimpinan_id) || `#${tiket.pimpinan_id}`,
        odp: {
          id: odp.id,
          kode_odp: odp.kode_odp || '-',
          alamat: odp.alamat || '-',
          area: odp.area || '-',
          kapasitas_port: odp.kapasitas_port,
          port_terpakai: odp.port_terpakai,
          status_fisik: odp.status_fisik,
        },
        kondisi: {
          tiang: a.kondisi_tiang,
          boks: a.kondisi_boks,
          kabel: a.kondisi_kabel,
          port: a.kondisi_port,
        },
        status_akhir: a.status_akhir,
        foto_bukti: a.foto_bukti,
      };
    });

    if (req.user.role === 'teknisi') {
      reports = reports.filter((r) => r.teknisi_id === req.user.id);
    }

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
