import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PUBLIC_PORT = 3000;
const NG_PORT = 4200;
let ngReady = false;
let ngProc = null;
let restartTimer = null;

// Function to start the Angular CLI compilation process
function startNg() {
  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  const ngCliPath = './node_modules/@angular/cli/bin/ng.js';
  if (!fs.existsSync(ngCliPath)) {
    console.log('[Apex-Engine] Angular CLI not found, gatekeeper running in standalone mode.');
    return;
  }

  console.log('[Apex-Engine] Spawning Angular CLI compiler on internal port', NG_PORT);
  ngProc = spawn(
    process.execPath,
    [
      '--max-old-space-size=2560',
      ngCliPath,
      'serve',
      '--port', String(NG_PORT),
      '--host', '127.0.0.1',
      '--live-reload=false',
      '--hmr=false'
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        NG_CLI_ANALYTICS: 'false',
        FORCE_COLOR: '1'
      }
    }
  );

  ngProc.on('error', (err) => {
    console.log('[Apex-Engine] Angular process error:', err.message);
  });

  ngProc.on('exit', (code) => {
    ngReady = false;
    console.log(`[Apex-Engine] Angular process exited (code: ${code}). Auto-healing in 2s...`);
    restartTimer = setTimeout(startNg, 2000);
  });
}

// Check every 1s if Angular bundle has completed and is serving HTTP 200
const checkBundleReady = () => {
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: NG_PORT,
      path: '/',
      method: 'GET',
      timeout: 800
    },
    (res) => {
      if (res.statusCode >= 200 && res.statusCode < 500) {
        if (!ngReady) {
          console.log('[Apex-Engine] Angular bundle completed successfully! Traffic switched to live app.');
        }
        ngReady = true;
      }
      res.resume();
    }
  );
  req.on('error', () => {
    ngReady = false;
  });
  req.on('timeout', () => {
    req.destroy();
  });
  req.end();
};
setInterval(checkBundleReady, 1000);

// Start Angular compiler
startNg();

// Graceful cleanup
const cleanup = () => {
  if (restartTimer) clearTimeout(restartTimer);
  try { if (ngProc) ngProc.kill('SIGTERM'); } catch {}
  process.exit(0);
};
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const WARMUP_HTML = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>سیستەمی ئەکادیمیی مام پڕۆفیسۆر</title>
  <meta http-equiv="refresh" content="2">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: radial-gradient(circle at 50% 20%, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(12px);
      padding: 40px 32px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
      max-width: 480px;
      width: 100%;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
    .spinner-box {
      position: relative;
      width: 60px;
      height: 60px;
      margin: 0 auto 24px;
    }
    .spinner {
      width: 100%;
      height: 100%;
      border: 4px solid rgba(56, 189, 248, 0.15);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 0.9s cubic-bezier(0.55, 0.15, 0.45, 0.85) infinite;
    }
    .badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 14px;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    h2 {
      color: #f8fafc;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -0.01em;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .progress-bar {
      width: 100%;
      height: 6px;
      background: #334155;
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
    }
    .progress-bar::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      border-radius: 9999px;
      animation: pulse 1.6s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { left: -40%; } 100% { left: 100%; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner-box">
      <div class="spinner"></div>
    </div>
    <span class="badge">APEX INSTANT-BOOT ENGINE</span>
    <h2>سیستەمی ئەکادیمیی مام پڕۆفیسۆر</h2>
    <p>ڕاژەکار چالاکە و خەریکی کۆکردنەوە و ئامادەکردنی پەڕگەکانی ئەپڵیکەیشنەکەیە...<br>بە تەواوبوونی پڕۆسەکە، پەڕەکە خۆکارانە دەکرێتەوە.</p>
    <div class="progress-bar"></div>
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
  console.log(`[Apex-Engine] Instant server online at http://0.0.0.0:${PUBLIC_PORT} -> proxying to ${NG_PORT}`);
});
