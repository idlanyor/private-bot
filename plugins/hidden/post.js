import axios from 'axios';
import { checkOwner } from '../../helper/permission.js';

export default async ({ sock, m, id, noTel, psn }) => {
    if (!await checkOwner(sock, id, noTel)) return;

    if (!psn) {
        await sock.sendMessage(id, { 
            text: '❌ Format: !post url\nheader1: value1\nheader2: value2\n\n{"key": "value"}' 
        });
        return;
    }

    try {
        // Parse input
        const parts = psn.split('\n\n');
        if (parts.length < 2) {
            await sock.sendMessage(id, { text: '❌ Body data tidak ditemukan!' });
            return;
        }

        // Parse URL dan headers
        const [url, ...headerStrings] = parts[0].split('\n');
        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Parse additional headers
        if (headerStrings.length > 0) {
            headerStrings.forEach(header => {
                const [key, value] = header.split(':').map(s => s.trim());
                if (key && value) headers[key] = value;
            });
        }

        // Parse body
        let body;
        try {
            body = JSON.parse(parts[1]);
        } catch (e) {
            body = parts[1]; // Use raw string if not valid JSON
        }

        // Kirim loading message
        await sock.sendMessage(id, { text: '⏳ Sending request...' });

        // Lakukan request
        const response = await axios.post(url, body, { headers });
        
        // Format response
        let result = `🌐 *POST ${url}*\n\n`;
        result += `📊 Status: ${response.status}\n`;
        result += `⏱️ Time: ${response.headers['x-response-time'] || 'N/A'}\n\n`;
        
        // Format request
        result += `📤 Request:\n${JSON.stringify(body, null, 2)}\n\n`;
        
        // Format response
        if (typeof response.data === 'object') {
            result += `📥 Response:\n${JSON.stringify(response.data, null, 2)}`;
        } else {
            result += `📥 Response:\n${response.data}`;
        }

        // Split response jika terlalu panjang
        if (result.length > 4096) {
            const chunks = result.match(/.{1,4096}/g);
            for (const chunk of chunks) {
                await sock.sendMessage(id, { text: chunk });
            }
        } else {
            await sock.sendMessage(id, { text: result });
        }
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

export const handler = 'po';
export const description = 'Melakukan HTTP POST request'; 