import { unixToDate } from "../../helper/date.js";

export const handler = 'chs'
export const description = 'Retrieve Information from Channel/Newsletter'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {
    if (!psn) {
        await sock.sendMessage(id, { text: 'Mohon masukkan link channel WhatsApp yang valid!' });
        return;
    }

    if (!psn.includes('whatsapp.com/channel/')) {
        await sock.sendMessage(id, { text: '❌ Link tidak valid! Pastikan menggunakan format https://whatsapp.com/channel/KODE' });
        return;
    }

    try {
        const filterCode = psn.match(/channel\/([A-Za-z0-9]{20,24})/)?.[1]
        if (!filterCode) {
            await sock.sendMessage(id, { text: '❌ Kode channel tidak ditemukan dalam link!' });
            return;
        }
        const metadata = await sock.newsletterMetadata('invite', filterCode)
        let text = '*[ NEWSLETTER INFO ]*\n'
        text += `📰 *ID :* ${metadata.id}\n`
        text += `📰 *Nama :* ${metadata.name}\n`
        text += `📰 *Tanggal Pembuatan :* ${unixToDate(metadata.creation_time)}\n`
        text += `🔗 *Link :* https://whatsapp.com/channel/${metadata.invite}\n`
        text += `👥 *Jumlah Pengikut: * ${metadata.subscribers}\n`
        text += `📝 *Deskripsi:*\n ${metadata.desc || 'Ngga ada deskripsi'}\n`
        await sock.sendMessage(id, { text })
    } catch (e) {
        await sock.sendMessage(id, { text: '❌ Terjadi kesalahan saat mengambil informasi channel: ' + e.message });
    }
};
