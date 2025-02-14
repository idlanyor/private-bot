
export const handler = 'bukaa'
export const description = 'Read View Once'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {
    try {
        const isViewOnceVid = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage?.viewOnce
        const isViewOnceImg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.viewOnce

        if (!isViewOnceImg && !isViewOnceVid) return

        if (/image/.test(m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.mimetype)) {
            return await sock.sendMessage(id, { image: attf }, { quoted: m })
        } else if (/video/.test(m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage?.mimetype)) {
            return await sock.sendMessage(id, { video: attf }, { quoted: m })
        }
    } catch (error) {
        console.error('Error in rvo:', error)
        await sock.sendMessage(id, { text: 'Terjadi kesalahan saat memproses media view once' })
    }
};
