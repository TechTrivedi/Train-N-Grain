import http from 'http';
import fs from 'fs';
import path from 'path';
import chatHandler from './api/chat.js';
import workoutHandler from './api/workout.js';
import nutritionHandler from './api/nutrition.js';

const PORT = 3000;

http.createServer((req, res) => {
    // Handle the serverless API routes
    if (req.method === 'POST' && (req.url === '/api/chat' || req.url === '/api/workout' || req.url === '/api/nutrition')) {
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
            } else if (req.url === '/api/workout') {
                workoutHandler(req, mockRes);
            } else {
                nutritionHandler(req, mockRes);
            }
        });
    } else {
        // Serve static frontend files (check dist folder first for production build, or fallback to root)
        const requestPath = req.url.split('?')[0];
        let baseDir = fs.existsSync('./dist') ? './dist' : '.';
        let filePath = path.join(baseDir, requestPath === '/' ? 'index.html' : requestPath);

        // SPA Fallback for client routes (/fitness, /nutrition, /profile)
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            filePath = path.join(baseDir, 'index.html');
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
        };

        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${error.code}`);
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
}).listen(PORT, () => {
    console.log(`\n🚀 Local server successfully started at: http://localhost:${PORT}\n`);
});
