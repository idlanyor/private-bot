import './global.js'
import { Kanata, clearMessages } from './helper/bot.js';
import { getMedia } from './helper/mediaMsg.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { call } from './lib/call.js';
import { logger } from './helper/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



function findJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Jika itu folder, lakukan rekursi
        if (stat && stat.isDirectory()) {
            results = results.concat(findJsFiles(filePath));
        }
        // Jika itu file .js, tambahkan ke results
        else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}


async function getPhoneNumber() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const namaSesiPath = path.join(__dirname, globalThis.sessionName);

    try {
        await fs.promises.access(namaSesiPath);
        rl.close();
    } catch {
        return new Promise(resolve => {
            const validatePhoneNumber = (input) => {
                const phoneRegex = /^62\d{9,15}$/;
                return phoneRegex.test(input);
            };
            const askForPhoneNumber = () => {
                logger.showBanner();
                rl.question(chalk.yellowBright("Enter phone number (with country code, e.g., 628xxxxx): "), input => {
                    if (validatePhoneNumber(input)) {
                        logger.success("Valid phone number entered!");
                        rl.close();
                        resolve(input);
                    } else {
                        logger.error("Invalid phone number! Must start with '62' and contain only numbers (minimum 10 digits).");
                        askForPhoneNumber();
                    }
                });
            };
            askForPhoneNumber();
        });
    }
}

async function prosesPerintah({ command, sock, m, id, sender, noTel, attf }) {
    if (!command) return;
    let [cmd, ...args] = "";
    [cmd, ...args] = command.split(' ');
    cmd = cmd.toLowerCase();
    if (command.startsWith('!')) {
        cmd = command.toLowerCase().substring(1).split(' ')[0];
        args = command.split(' ').slice(1)
    }
    logger.info(`Pesan baru diterima dari ${m.pushName || m.participant?.pushName}`);
    logger.message.in(command);

    try {

        const pluginsDir = path.join(__dirname, 'plugins');
        const plugins = Object.fromEntries(
            await Promise.all(findJsFiles(pluginsDir).map(async file => {
                const { default: plugin, handler } = await import(pathToFileURL(file).href);
                if (Array.isArray(handler) && handler.includes(cmd)) {
                    return [cmd, plugin];
                }
                return [handler, plugin];
            }))
        );

        if (plugins[cmd]) {
            logger.info(`Executing command: ${cmd}`);
            await plugins[cmd]({ sock, m, id, psn: args.join(' '), sender, noTel, attf, cmd });
            logger.success(`Command ${cmd} executed successfully`);
        }

    } catch (error) {
        logger.error(`Error processing message`, error);
    }
}
export async function startBot() {
    const phoneNumber = await getPhoneNumber();
    const bot = new Kanata({
        phoneNumber,
        sessionId: globalThis.sessionName,
    });

    bot.start().then(sock => {
        logger.success('Bot started successfully!');
        logger.divider();
        sock.ev.on('messages.upsert', async chatUpdate => {
            try {
                const m = chatUpdate.messages[0];

                const { remoteJid } = m.key;
                const sender = m.pushName || remoteJid;
                const id = remoteJid;
                const noTel = (id.endsWith('@g.us')) ? m.key.participant.split('@')[0].replace(/[^0-9]/g, '') : remoteJid.split('@')[0].replace(/[^0-9]/g, '');
                if (m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                    const imageMessage = m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
                    const imageBuffer = await getMedia({ message: { imageMessage } });
                    const commandImage = m.message?.imageMessage?.caption || m.message.extendedTextMessage?.text;
                    await prosesPerintah({ command: commandImage, sock, m, id, sender, noTel, attf: imageBuffer });
                }
                if (m.message?.videoMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
                    const videoMessage = m.message?.videoMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
                    const videoBuffer = await getMedia({ message: { videoMessage } });
                    const commandVideo = m.message?.videoMessage?.caption || m.message.extendedTextMessage?.text;
                    await prosesPerintah({ command: commandVideo, sock, m, id, sender, noTel, attf: videoBuffer });
                }
                if (m.message?.audioMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) {
                    const audioMessage = m.message?.audioMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
                    const audioBuffer = await getMedia({ message: { audioMessage } });
                    const commandAudio = m.message?.audioMessage?.caption || m.message.extendedTextMessage?.text;
                    await prosesPerintah({ command: commandAudio, sock, m, id, sender, noTel, attf: audioBuffer });
                }
                const chat = await clearMessages(m);
                if (chat) {
                    const parsedMsg = chat.chatsFrom === "private" ? chat.message : chat.participant?.message;
                    await prosesPerintah({ command: parsedMsg, sock, m, id, sender, noTel });
                }

            } catch (error) {
                logger.error('Error handling message:', error);
            }
        });


        sock.ev.on('call', (callEv) => {
            call(callEv, sock)
        })
    }).catch(error => {
        logger.error('Fatal error starting bot:', error)
        
    });

}


startBot()
