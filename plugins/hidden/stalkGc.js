export const handler = 'gcs'
export const description = 'Retrieve GC Information by Invite Link'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {
    if (!psn) {
        await sock.sendMessage(id, { text: 'Mohon masukkan link grup WhatsApp yang valid!' });
        return;
    }

    if (!psn.includes('https://chat.whatsapp.com/')) {
        await sock.sendMessage(id, { text: '❌ Link tidak valid! Pastikan menggunakan format https://chat.whatsapp.com/KODE' });
        return;
    }

    try {
        const filterCode = psn.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{20,24})/)?.[1]
        const result = await sock.groupGetInviteInfo(filterCode)
        let summary = '`[*INFORMASI GRUP*]`'
        summary += `\n*Id Grup* : ${result.id}`
        summary += `\n*Id Komunitas* : ${result.linkedParent || 'Nggak punya komunitas'}`
        summary += `\n*Nama Grup* : ${result.subject || 'Nggak ada namanya'}`
        summary += `\n*Owner Number* : ${result.participants.filter((d) => d.admin === 'superadmin')[0].id.split('@')[0] || 'Nggak ada namanya'}`
        summary += `\n*Deskripsi Grup* : \n${result.desc}`
        await sock.sendMessage(id, { text: summary });
    } catch (error) {
        await sock.sendMessage(id, { text: '❌ Terjadi kesalahan saat mengambil informasi grup: ' + error.message });

    }
};
