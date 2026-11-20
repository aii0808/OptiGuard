import 'dotenv/config';

async function checkGroups() {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN tidak ditemukan di file .env');
    process.exit(1);
  }

  console.log('Mengecek bot info & update Telegram...');
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      console.error('Error Telegram getMe:', meData.description);
      return;
    }
    console.log(`Bot terhubung: @${meData.result.username} (${meData.result.first_name})`);

    const updateRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const updateData = await updateRes.json();
    if (!updateData.ok) {
      console.error('Error Telegram getUpdates:', updateData.description);
      return;
    }

    const groups = new Map();
    (updateData.result || []).forEach((u) => {
      const msg = u.message || u.channel_post || u.my_chat_member;
      const chat = msg?.chat;
      if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
        groups.set(chat.id, {
          id: chat.id,
          title: chat.title || '(Tanpa Judul)',
          type: chat.type,
        });
      }
    });

    console.log('\n--- DAFTAR GRUP TELEGRAM YANG TERDETEKSI ---');
    if (groups.size === 0) {
      console.log('Belum ada grup baru yang terdeteksi.');
      console.log('Petunjuk untuk memisahkan grup OptiGuard:');
      console.log('1. Buat grup Telegram baru (misal: "Patroli ODP OptiGuard").');
      console.log(`2. Masukkan bot @${meData.result.username} ke dalam grup baru tersebut.`);
      console.log('3. Kirim pesan apa saja di grup (misal: /start atau "halo").');
      console.log('4. Jalankan script ini lagi: npm run check-groups');
      console.log('5. Salin Chat ID yang muncul ke TELEGRAM_OPTIGUARD_GROUP_ID di backend/.env\n');
    } else {
      groups.forEach((g) => {
        console.log(`- Nama Grup : "${g.title}"`);
        console.log(`  Tipe      : ${g.type}`);
        console.log(`  Chat ID   : ${g.id}`);
        console.log('  --------------------------------------------');
      });
      console.log('Salin Chat ID grup yang diinginkan ke file backend/.env pada:');
      console.log('TELEGRAM_OPTIGUARD_GROUP_ID=<ID_GRUP_DI_ATAS>\n');
    }
  } catch (err) {
    console.error('Terjadi kesalahan:', err.message);
  }
}

checkGroups();
