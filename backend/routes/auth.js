import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../services/supabase.js';
import { authRequired, roleOnly } from '../middleware/auth.js';

const router = Router();
const ROLE_OPTIGUARD = ['pimpinan', 'teknisi'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PENDING_FILE = path.join(__dirname, '../data/pending_registrations.json');

function getPendingList() {
  try {
    if (!fs.existsSync(PENDING_FILE)) {
      fs.writeFileSync(PENDING_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(PENDING_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading pending file:', err);
    return [];
  }
}

function savePendingList(list) {
  try {
    const dir = path.dirname(PENDING_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PENDING_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving pending file:', err);
  }
}

// 1. Registrasi Teknisi Baru (Divalidasi langsung menggunakan Kode Instansi STO-OPTIGUARD)
router.post('/register', async (req, res) => {
  const { nama_lengkap, email, password, kode_validasi } = req.body || {};
  if (!nama_lengkap || !email || !password) {
    return res.status(400).json({ error: 'Nama lengkap, email, dan password wajib diisi' });
  }

  // Validasi Kode Rahasia Pendaftaran Instansi
  const kodeBersih = (kode_validasi || '').trim().toUpperCase();
  if (kodeBersih !== 'STO-OPTIGUARD') {
    return res.status(400).json({
      error: 'Kode validasi pendaftaran instansi salah! Masukkan kode resmi (STO-OPTIGUARD).'
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Cek apakah email sudah ada di tabel users Supabase
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existingUser) {
    return res.status(409).json({ error: 'Email sudah terdaftar dalam sistem.' });
  }

  // Hash password dan daftarkan langsung akun aktif ke tabel users
  const passwordHash = await bcrypt.hash(password.trim(), 10);
  const { data: newUser, error: errInsert } = await supabase
    .from('users')
    .insert({
      nama_lengkap: nama_lengkap.trim(),
      email: cleanEmail,
      password: passwordHash,
      role: 'teknisi',
    })
    .select('id, nama_lengkap, email, role')
    .single();

  if (errInsert) {
    return res.status(500).json({ error: 'Gagal membuat akun pengguna: ' + errInsert.message });
  }

  res.status(201).json({
    ok: true,
    message: 'Akun Teknisi Anda berhasil didaftarkan dan langsung aktif! Silakan masuk dengan email dan kata sandi Anda.',
    user: newUser,
  });
});

// 2. Daftar Pendaftaran Pending (Khusus Pimpinan)
router.get('/pending-users', authRequired, roleOnly('pimpinan'), (_req, res) => {
  const list = getPendingList();
  const pending = list.filter((u) => u.status === 'PENDING');
  res.json(pending);
});

// 3. Setujui Pendaftaran Teknisi (Khusus Pimpinan)
router.post('/approve-user/:id', authRequired, roleOnly('pimpinan'), async (req, res) => {
  const { id } = req.params;
  const list = getPendingList();
  const itemIndex = list.findIndex((u) => u.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Data registrasi tidak ditemukan' });
  }

  const item = list[itemIndex];
  if (item.status !== 'PENDING') {
    return res.status(400).json({ error: `Registrasi ini sudah berstatus ${item.status}` });
  }

  // Masukkan teknisi ke tabel users Supabase
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      nama_lengkap: item.nama_lengkap,
      email: item.email,
      password: item.password,
      role: 'teknisi',
      telegram_chat_id: item.telegram_chat_id ? Number(item.telegram_chat_id) || null : null,
    })
    .select('id, nama_lengkap, email, role')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Gagal memasukkan user ke database: ' + error.message });
  }

  // Update status pending menjadi APPROVED
  list[itemIndex].status = 'APPROVED';
  list[itemIndex].approved_at = new Date().toISOString();
  list[itemIndex].approved_by = req.user.nama;
  list[itemIndex].user_id = newUser.id;
  savePendingList(list);

  res.json({ ok: true, message: `Teknisi ${item.nama_lengkap} berhasil disetujui!`, user: newUser });
});

// 4. Tolak Pendaftaran Teknisi (Khusus Pimpinan)
router.post('/reject-user/:id', authRequired, roleOnly('pimpinan'), (req, res) => {
  const { id } = req.params;
  const list = getPendingList();
  const itemIndex = list.findIndex((u) => u.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Data registrasi tidak ditemukan' });
  }

  list[itemIndex].status = 'REJECTED';
  list[itemIndex].rejected_at = new Date().toISOString();
  list[itemIndex].rejected_by = req.user.nama;
  savePendingList(list);

  res.json({ ok: true, message: `Pendaftaran ${list[itemIndex].nama_lengkap} telah ditolak.` });
});

// 5. Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from('users')
    .select('id, nama_lengkap, role, email, password, telegram_chat_id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  // Jika user belum ada di tabel users, cek apakah ada di antrean pending
  if (!user) {
    const list = getPendingList();
    const pending = list.find((p) => p.email.toLowerCase() === cleanEmail);
    if (pending) {
      if (pending.status === 'PENDING') {
        return res.status(403).json({
          error: 'Akun Anda sedang menunggu persetujuan (verifikasi) dari Pimpinan sebelum dapat digunakan.',
        });
      }
      if (pending.status === 'REJECTED') {
        return res.status(403).json({
          error: 'Pendaftaran akun Anda ditolak oleh Pimpinan.',
        });
      }
    }
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  // Verifikasi Password (cocokkan hash bcrypt atau plaintext)
  const cocok = user && (user.password.startsWith('$2')
    ? await bcrypt.compare(password, user.password)
    : user.password === password);
  if (!cocok) return res.status(401).json({ error: 'Email atau password salah' });

  if (!ROLE_OPTIGUARD.includes(user.role)) {
    return res.status(403).json({ error: 'Role ini tidak memiliki hak akses ke OptiGuard' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, nama: user.nama_lengkap, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      nama: user.nama_lengkap,
      role: user.role,
      email: user.email,
      telegram_chat_id: user.telegram_chat_id,
    },
  });
});

// 6. Profil User Saat Ini
router.get('/me', authRequired, async (req, res) => {
  const { data: user } = await supabase
    .from('users')
    .select('id, nama_lengkap, role, email, telegram_chat_id')
    .eq('id', req.user.id)
    .maybeSingle();

  res.json({ user: user || req.user });
});

// 7. Update Profil User (Nama, Password, Telegram Chat ID)
router.put('/profil', authRequired, async (req, res) => {
  const { nama_lengkap, password, telegram_chat_id } = req.body || {};
  const updates = {};

  if (nama_lengkap && nama_lengkap.trim()) updates.nama_lengkap = nama_lengkap.trim();
  if (password && password.trim()) updates.password = password.trim();
  if (telegram_chat_id !== undefined) {
    updates.telegram_chat_id = telegram_chat_id ? Number(telegram_chat_id) || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada data yang diperbarui' });
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select('id, nama_lengkap, role, email, telegram_chat_id')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    ok: true,
    message: 'Profil berhasil diperbarui',
    user: updated,
  });
});

// 8. Kelola Semua Pengguna (Khusus Pimpinan)
router.get('/users', authRequired, roleOnly('pimpinan'), async (_req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, nama_lengkap, role, email, telegram_chat_id')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(users || []);
});

// 9. Pimpinan Mendaftarkan Akun Pengguna Baru Langsung (Pimpinan atau Teknisi)
router.post('/create-user', authRequired, roleOnly('pimpinan'), async (req, res) => {
  const { nama_lengkap, email, password, role, telegram_chat_id } = req.body || {};
  if (!nama_lengkap || !email || !password || !role) {
    return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi' });
  }

  const roleClean = role.trim().toLowerCase();
  if (!ROLE_OPTIGUARD.includes(roleClean)) {
    return res.status(400).json({ error: 'Role harus "pimpinan" atau "teknisi"' });
  }

  // Cek email ganda
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Email tersebut sudah terdaftar di sistem' });
  }

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      nama_lengkap: nama_lengkap.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      role: roleClean,
      telegram_chat_id: telegram_chat_id ? Number(telegram_chat_id) || null : null,
    })
    .select('id, nama_lengkap, role, email, telegram_chat_id')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    ok: true,
    message: `Akun ${newUser.nama_lengkap} (${newUser.role}) berhasil didaftarkan!`,
    user: newUser,
  });
});

// 10. Pimpinan Memperbarui Data Akun Pengguna Lain
router.put('/users/:id', authRequired, roleOnly('pimpinan'), async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) return res.status(400).json({ error: 'ID tidak valid' });

  const { nama_lengkap, password, role, telegram_chat_id } = req.body || {};
  const updates = {};

  if (nama_lengkap && nama_lengkap.trim()) updates.nama_lengkap = nama_lengkap.trim();
  if (password && password.trim()) updates.password = password.trim();
  if (role && ROLE_OPTIGUARD.includes(role.trim().toLowerCase())) updates.role = role.trim().toLowerCase();
  if (telegram_chat_id !== undefined) {
    updates.telegram_chat_id = telegram_chat_id ? Number(telegram_chat_id) || null : null;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Tidak ada perubahan yang dikirim' });
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', targetId)
    .select('id, nama_lengkap, role, email, telegram_chat_id')
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    ok: true,
    message: `Akun #${targetId} berhasil diperbarui`,
    user: updated,
  });
});

// 11. Pimpinan Menghapus Akun Pengguna
router.delete('/users/:id', authRequired, roleOnly('pimpinan'), async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId)) return res.status(400).json({ error: 'ID tidak valid' });

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' });
  }

  const { error } = await supabase.from('users').delete().eq('id', targetId);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ ok: true, message: `Akun #${targetId} telah dihapus dari sistem` });
});

export default router;
