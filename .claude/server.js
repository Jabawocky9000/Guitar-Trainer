const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let file = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('');
    console.log('  Port 8000 is already in use.');
    console.log('  The server may already be running — try http://localhost:8000');
    console.log('');
  } else {
    console.error(err);
  }
  process.exit(1);
}).listen(8000, () => {
  console.log('');
  console.log('  Guitar Theory Trainer is running!');
  console.log('  Open in your browser: http://localhost:8000');
  console.log('');
  console.log('  Press Ctrl+C to stop the server.');
  console.log('');
});
