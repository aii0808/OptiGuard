const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
      console.error('Telegram gagal:', j.description,
        '| panjang token:', token.length, '| id bot:', token.split(':')[0]);
    }
    return !!j.ok;
  } catch (e) {
    console.error('Telegram error:', e.message);
    return false;
  }
}

export function pesanTiketBaru({ tiket, teknisi, jumlahOdp, pimpinan }) {
  return [
    '🛠 <b>[PATROLI] Tugas Preventive Maintenance</b>',
    '',
    `Area: <b>${esc(tiket.area_klaster)}</b>`,
    `Jumlah ODP: ${jumlahOdp}`,
    `Tanggal: ${esc(tiket.tanggal_tugas)}`,
    `Teknisi: ${esc(teknisi)}`,
    `Dibuat oleh: ${esc(pimpinan)}`,
    '',
    'Buka aplikasi OptiGuard untuk mengisi checklist.',
  ].join('\n');
}