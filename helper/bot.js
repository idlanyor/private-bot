import {
    makeWASocket,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    makeInMemoryStore,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers
} from '@seaavey/baileys';
import pino from "pino";
import NodeCache from "node-cache";
import fs from 'fs-extra';
import { startBot } from "../app.js";
import { logger } from './logger.js';

class Kanata {
    constructor(data) {
        this.phoneNumber = data.phoneNumber;
        this.sessionId = data.sessionId;
        this.useStore = data.useStore;
    }

    async start() {
        logger.showBanner();
        const loadingProgress = logger.progress.start('Initializing Kanata Bot...');

        try {
            const msgRetryCounterCache = new NodeCache();
            const useStore = this.useStore;

            // Configure loggers
            const MAIN_LOGGER = pino({
                timestamp: () => `,"time":"${new Date().toJSON()}"`,
            });
            const pLogger = MAIN_LOGGER.child({});
            pLogger.level = "silent";

            // Initialize store
            const store = useStore ? makeInMemoryStore({ logger: pLogger }) : undefined;
            if (store) {
                store.readFromFile(`store-${this.sessionId}.json`);
                setInterval(() => {
                    store.writeToFile(`store-${this.sessionId}.json`);
                }, 10000 * 6);
            }

            // Initialize authentication
            const P = pino({ level: "silent" });
            let { state, saveCreds } = await useMultiFileAuthState(this.sessionId);
            let { version, isLatest } = await fetchLatestBaileysVersion();

            logger.progress.stop(loadingProgress);
            logger.info(`Using Baileys version: ${version} (Latest: ${isLatest})`);

            // Create socket connection
            const sock = makeWASocket({
                version,
                logger: P,
                printQRInTerminal: false,
                browser: Browsers.macOS("Safari"),
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P),
                },
                msgRetryCounterCache,
                connectOptions: {
                    maxRetries: 5,
                    keepAlive: true,
                },
            });

            // Bind store and credentials
            store?.bind(sock.ev);
            sock.ev.on("creds.update", saveCreds);

            // Handle pairing code
            if (!sock.authState.creds.registered) {
                logger.connection.connecting("Waiting for pairing code...");

                const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
                let retryCount = 0;
                const maxRetries = 2;

                while (retryCount < maxRetries) {
                    try {
                        await delay(6000);
                        const code = await sock.requestPairingCode(this.phoneNumber);
                        logger.connection.pairing(code);
                        break;
                    } catch (err) {
                        retryCount++;
                        if (retryCount >= maxRetries) {
                            logger.error("Failed to get pairing code, removing session and restarting...");
                            await fs.remove(`./${this.sessionId}`);
                            await startBot();
                        }
                    }
                }
            }

            // Handle connection updates
            sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;

                switch (connection) {
                    case "connecting":
                        logger.connection.connecting("Connecting to WhatsApp...");
                        break;

                    case "open":
                        logger.connection.connected("Socket Connected!");
                        break;

                    case "close":
                        logger.connection.disconnected("Connection lost, attempting to reconnect...");

                        const reason = lastDisconnect?.error?.output?.statusCode;
                        if (reason === DisconnectReason.loggedOut) {
                            logger.error("Invalid session, removing session and restarting...");
                            await fs.remove(`./${this.sessionId}`);
                            logger.info(`Session ${this.sessionId} removed!`);
                            await startBot();
                        } else {
                            logger.system("Restarting connection...");
                            await startBot();
                        }
                        break;
                }
            });

            return sock;
        } catch (error) {
            logger.progress.stop(loadingProgress);
            logger.error("Failed to start Kanata Bot", error);
            throw error;
        }
    }
}

async function clearMessages(m) {
    try {
        if (!m) return;
        let data;
        const text = m.message?.conversation?.trim() || m.message?.extendedTextMessage?.text?.trim();
        if (!text) return m;

        if (m.key.remoteJid.endsWith("g.us")) {
            data = {
                chatsFrom: "group",
                remoteJid: m.key.remoteJid,
                participant: {
                    fromMe: m.key.fromMe,
                    number: m.key.participant,
                    pushName: m.pushName,
                    message: text,
                },
            };
        } else {
            data = {
                chatsFrom: "private",
                remoteJid: m.key.remoteJid,
                fromMe: m.key.fromMe,
                pushName: m.pushName,
                message: text,
            };
        }
        return data;
    } catch (err) {
        logger.error("Error clearing messages:", err);
        return m;
    }
}

const sanitizeBotId = botId => botId.split(":")[0] + "@s.whatsapp.net";

export { Kanata, clearMessages, sanitizeBotId };