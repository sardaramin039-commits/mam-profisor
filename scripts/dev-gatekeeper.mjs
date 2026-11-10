import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PUBLIC_PORT = 3000;
const NG_PORT = 4200;
let ngReady = false;

// Check every 1s if internal Angular port 4200 is ready
const checkNgReady = () => {
  const sock = net.createConnection({ port: NG_PORT, host: '127.0.0.1' });
  sock.on('connect', () => {
    ngReady = true;
    sock.destroy();
  });
  sock.on('error', () => {
    sock.destroy();
  });
};
setInterval(checkNgReady, 1000);

// Spawn Angular CLI on internal port 4200 if present
let ngProc = null;
try {
  if (fs.existsSync('./node_modules/@angular/cli/bin/ng.js')) {
    ngProc = spawn(
      process.execPath,
      [
        '--max-old-space-size=2560',
        './node_modules/@angular/cli/bin/ng.js',
        'serve',
        '--port', String(NG_PORT),
        '--host', '127.0.0.1',
        '--live-reload=false',
        '--hmr=false'
      ],
      { stdio: 'inherit', env: { ...process.env, NG_CLI_ANALYTICS: 'false' } }
    );
    ngProc.on('error', (err) => {
      console.log('[Gatekeeper] Angular spawn warning:', err.message);
    });
  }
} catch (e) {
  console.log('[Gatekeeper] Angular spawn error:', e.message);
}

const cleanup = () => {
  try { if (ngProc) ngProc.kill('SIGTERM'); } catch {}
  process.exit(0);
};
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const WARMUP_HTML = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>مام پڕۆفیسۆر - خەریکی ئامادەبوونە</title>
  <meta http-equiv="refresh" content="3">
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: #1e293b; padding: 32px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 460px; border: 1px solid #334155; }
    .spinner { width: 44px; height: 44px; border: 4px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { color: #38bdf8; margin: 0 0 12px; font-size: 20px; }
    p { color: #cbd5e1; font-size: 14px; line-height: 1.7; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>سیستەمی ئەکادیمیی مام پڕۆفیسۆر</h2>
    <p>سێرڤەر چالاکە و خەریکی ئامادەکردنی فایلەکانی پڕۆژەکەیە (نزیکەی ٣٠ چرکە)...<br>ئەم پەڕەیە خۆکارانە دەکرێتەوە.</p>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (!ngReady) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(WARMUP_HTML);
    return;
  }

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: NG_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${NG_PORT}` }
    },
    (proxyRes) => {
      const headers = { ...proxyRes.headers };
      delete headers['x-frame-options'];
      headers['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode || 200, headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', () => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(WARMUP_HTML);
  });

  req.pipe(proxyReq, { end: true });
});

server.on('upgrade', (req, socket, head) => {
  if (!ngReady) {
    socket.destroy();
    return;
  }
  const proxySock = net.connect(NG_PORT, '127.0.0.1', () => {
    proxySock.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
      Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    );
    proxySock.write(head);
    socket.pipe(proxySock).pipe(socket);
  });
  proxySock.on('error', () => socket.destroy());
});

server.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`[Gatekeeper] Instant server listening on http://0.0.0.0:${PUBLIC_PORT} -> proxying to ${NG_PORT}`);
});
