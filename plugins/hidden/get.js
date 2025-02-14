import axios from 'axios';
import { checkOwner } from '../../helper/permission.js';

export default async ({ sock, m, id, noTel, psn }) => {
    if (!await checkOwner(sock, id, noTel)) return;

    if (!psn) {
        await sock.sendMessage(id, { text: '❌ Masukkan URL yang akan di-GET!' });
        return;
    }

    try {
        // Parse URL dan headers (jika ada)
        let [url, ...headerStrings] = psn.split('\n');
        let headers = {};

        // Parse headers jika ada
        if (headerStrings.length > 0) {
            headerStrings.forEach(header => {
                const [key, value] = header.split(':').map(s => s.trim());
                if (key && value) headers[key] = value;
            });
        }

        // Kirim loading message
        await sock.sendMessage(id, { text: '⏳ Fetching data...' });

        // Lakukan request
        const response = await axios.get(url, { headers });

        // Format response
        let result = `🌐 *GET ${url}*\n\n`;
        result += `📊 Status: ${response.status}\n`;
        result += `⏱️ Time: ${response.headers['x-response-time'] || 'N/A'}\n\n`;

        // Format response data
        if (typeof response.data === 'object') {
            result += `📥 Response:\n${JSON.stringify(response.data, null, 2)}`;
        } else {
            result += `📥 Response:\n${response.data}`;
        }

        // Split response jika terlalu panjang
        // if (result.length > 4096) {
        //     const chunks = result.match(/.{1,4096}/g);
        //     for (const chunk of chunks) {
        //         await sock.sendMessage(id, { text: chunk });
        //     }
        // } else {
        await sock.sendMessage(id, { text: result });
        // }
    } catch (error) {
        let errorMessage = `❌ *ERROR*\n\n`;
        if (error.response) {
            errorMessage += `Status: ${error.response.status}\n`;
            errorMessage += `Data: ${JSON.stringify(error.response.data, null, 2)}`;
        } else {
            errorMessage += error.message;
        }
        await sock.sendMessage(id, { text: errorMessage });
    }
};

export const handler = 'ge';
export const tags = ['owner'];
export const command = ['get'];
export const help = 'Melakukan HTTP GET request'; 