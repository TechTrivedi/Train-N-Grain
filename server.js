import http from 'http';
import fs from 'fs';
import path from 'path';
import chatHandler from './api/chat.js';
import workoutHandler from './api/workout.js';

const PORT = 3000;

http.createServer((req, res) => {
    // Handle the serverless API routes
    if (req.method === 'POST' && (req.url === '/api/chat' || req.url === '/api/workout')) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body);
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON body' }));
                return;
            }

            // Mock the response object to match Vercel's req/res API
            const mockRes = {
                status(code) {
                    res.statusCode = code;
                    return this;
                },
                json(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                },
                setHeader(name, val) {
                    res.setHeader(name, val);
                }
            };

            if (req.url === '/api/chat') {
                chatHandler(req, mockRes);
            } else {
                workoutHandler(req, mockRes);
            }
        });
    } else {
        // Serve static frontend files
        let filePath = '.' + req.url.split('?')[0];
        if (filePath === './') {
            filePath = './index.html';
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end(`Server Error: ${error.code}`);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
}).listen(PORT, () => {
    console.log(`\n🚀 Local server successfully started at: http://localhost:${PORT}\n`);
});
