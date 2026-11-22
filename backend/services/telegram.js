const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function kirimTelegram(chatId, teks) {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  if (!chatId) { console.error('Telegram dilewati: chat id kosong'); return false; }
  if (!token) { console.error('Telegram dilewati: TELEGRAM_BOT_TOKEN kosong'); return false; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: teks, parse_mode: 'HTML' }),
    });
    const j = await r.json();
    if (!j.ok) {
      console.error(`Telegram gagal kirim ke ${chatId}:`, j.description);
      // Fallback: Jika bot belum di-invite ke grup baru (chat not found),
      // otomatis teruskan pesan ke grup cadangan terverifikasi (-1003981401195) agar pesan tugas tidak hilang
      if (j.description?.includes('chat not found') && String(chatId) !== '-1003981401195') {
        console.warn(`Mengalihkan pesan Telegram ke grup cadangan aktif (-1003981401195)...`);
        const fallbackRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: '-1003981401195', text: teks, parse_mode: 'HTML' }),
        });
        const fbJson = await fallbackRes.json();
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
    'Buka aplikasi OptiGuard untuk petunjuk navigasi rute dan pengisian checklist audit.'
  );

  return baris.join('\n');
}
