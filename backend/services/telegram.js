const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Supergroup resmi STO OptiGuard (hasil migrasi otomatis dari grup baru -5361280995)
const DEFAULT_GROUP_ID = '-1003810209824';
const APP_URL = 'https://optiguard-ten.vercel.app/login';

export async function kirimTelegram(chatId, teks) {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  if (!token) {
    console.error('Telegram dilewati: TELEGRAM_BOT_TOKEN kosong');
    return false;
  }

  // Normalisasi target chat ID:
  // Jika diarahkan ke group lama (-1003981401195) atau ID sebelum supergroup (-5361280995 / -1005361280995),
  // otomatis dialihkan ke supergroup resmi sto-optiguard (-1003810209824)
  let targetId = String(chatId || '').trim();
  if (
    !targetId ||
    targetId === 'undefined' ||
    targetId === 'null' ||
    targetId === '-5361280995' ||
    targetId === '-1005361280995' ||
    targetId === '-1003981401195'
  ) {
    targetId = DEFAULT_GROUP_ID;
  }

  const payload = {
    chat_id: targetId,
    text: teks,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: false },
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🚀 Buka Web / PWA OptiGuard',
            url: APP_URL,
          },
        ],
      ],
    },
  };

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!j.ok) {
      console.error(`Telegram gagal kirim ke ${targetId}:`, j.description);
      // Jika masih gagal (misal jika kirim direct ke user gagal), fallback ke grup sto-optiguard
      if (targetId !== DEFAULT_GROUP_ID) {
        payload.chat_id = DEFAULT_GROUP_ID;
        const fbRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const fbJson = await fbRes.json();
        return !!fbJson.ok;
      }
      return false;
    }
    return !!j.ok;
  } catch (e) {
    console.error('Telegram error:', e.message);
    return false;
  }
}

export function pesanTiketBaru({ tiket, teknisi, jumlahOdp, pimpinan, areaName, rute }) {
  const namaArea = areaName || tiket.area_klaster;
  const baris = [
    '🛠 <b>[OPTIGUARD] Tugas Patroli & Validasi ODP</b>',
    '',
    `📍 Wilayah Klaster: <b>${esc(namaArea)}</b>`,
    `🎯 Jumlah Target ODP: <b>${jumlahOdp} Titik</b>`,
  ];

  if (Array.isArray(rute) && rute.length > 0) {
    baris.push(`🗺️ <b>Rute Pengerjaan:</b>\n   ${esc(rute.join(' ➔ '))}`);
  }

  baris.push(
    `📅 Jadwal: ${esc(tiket.tanggal_tugas || '-')}`,
    `👷 Teknisi: ${esc(teknisi)}`,
    `👤 Dibuat oleh: ${esc(pimpinan)}`,
    '',
    '🔗 <b>Akses Aplikasi (Web/PWA):</b>',
    'https://optiguard-ten.vercel.app/login'
  );

  return baris.join('\n');
}
