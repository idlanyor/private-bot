export const handler = 'masukin'
export const description = 'Menambahkan anggota ke dalam group'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {

    if (psn === '') {
        await sock.sendMessage(id, { text: '📋 *Gunakan format:* \n\n`masukin <nomor telepon>`\n\nContoh:\n`masukin 62895395590009`' });
        return;
    }

    try {
        let res = await sock.groupParticipantsUpdate(id, [psn.replace('@', '') + '@s.whatsapp.net'], 'add')
        console.log(res)
        await sock.sendMessage(id, { text: `✅ *Berhasil Menambahkan \`\`\`${psn.trim()}\`\`\` ke group*` });
    } catch (error) {
        await sock.sendMessage(id, { text: '❌ *Terjadi kesalahan:* \n' + error.message });
    }
};
