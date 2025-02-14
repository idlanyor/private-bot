import { getGroupMetadata } from "../../helper/group.js";

export const handler = '@tag';
export const description = 'Tag semua anggota group';

export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {
    const metadata = await getGroupMetadata({ sock, id });

    // Ambil semua ID anggota grup
    const memberId = metadata.participants.map(v => v.id);

    // Format teks dengan mention semua anggota
    let teks = ``;
    memberId.forEach(user => {
        teks += `@${user.split('@')[0]}\n`;
    });

    // Kirim pesan dengan mentions
    await sock.sendMessage(id, { text: teks, mentions: memberId }, { quoted: m });
};
