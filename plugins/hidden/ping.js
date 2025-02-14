import pkg from '@seaavey/baileys';
const { proto, generateWAMessageFromContent } = pkg
import moment from 'moment';
import { getBuffer } from '../../helper/mediaMsg.js';
export const description = "Ping Bot";
export const handler = "cekers"
const calculatePing = function (timestamp, now) {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds();
};

export default async ({ sock, m, id, psn, sender, noTel, caption }) => {
    let invite = generateWAMessageFromContent(id, proto.Message.fromObject({
        groupInviteMessage: {
            contextInfo: {
                isForwarded: true,
                forwardingScore: 9999999,
                isForwarded: true,
                externalAdReply: {
                    title: `乂 Kanata 乂`,
                    body: 'Kanata Bot',
                    mediaType: 1,
                    previewType: 0,
                    renderLargerThumbnail: true,
                    thumbnailUrl: await getBuffer('https://telegra.ph/file/8360caca1efd0f697d122.jpg'),
                    sourceUrl: 'https://telegra.ph/file/8360caca1efd0f697d122.jpg',
                }
            },
            groupJpegThumbnailUrl: await getBuffer('https://telegra.ph/file/8360caca1efd0f697d122.jpg'),
            groupJid: "20363176955019646@g.us",
            inviteCode: "JU36ze/gq5VH4UTR",
            inviteExpiration: 12052025,
            groupName: 'KANATA BOT - V2', //input nama group
            jpegThumbnailUrl: await getBuffer('https://telegra.ph/file/8360caca1efd0f697d122.jpg'),
            caption: `_Bot merespon dalam *${calculatePing(m.messageTimestamp, Date.now())} detik*_` //input caption                    
        }
    }), { userJid: id, quoted: m })
    await sock.relayMessage(id, invite.message, { messageId: invite.key.id })
};
