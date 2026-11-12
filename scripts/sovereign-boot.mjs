import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

try {
  fs.rmSync('.angular', { recursive: true, force: true });
  fs.rmSync('.vite', { recursive: true, force: true });
} catch {}

const PUBLIC_PORT = 3000;
const NG_PORT = 4200;
let ngReady = false;
let isShuttingDown = false;
let ngProc = null;

setInterval(() => {
  const sock = net.createConnection({ port: NG_PORT, host: '127.0.0.1' });
  sock.on('connect', () => {
    ngReady = true;
    sock.destroy();
  });
  sock.on('error', () => {
    sock.destroy();
  });
}, 400);

const ngCliPath = './node_modules/@angular/cli/bin/ng.js';

const startAngular = () => {
  if (isShuttingDown) return;
  if (!fs.existsSync(ngCliPath)) {
    console.warn(`[SovereignBoot] Angular CLI (${ngCliPath}) not found yet. Serving workspace shell.`);
    setTimeout(startAngular, 3000);
    return;
  }
  ngProc = spawn(
    process.execPath,
    [
      '--max-old-space-size=2560',
      ngCliPath,
      'serve',
      '--configuration', 'development',
      '--port', String(NG_PORT),
      '--host', '127.0.0.1',
      '--live-reload=false',
      '--hmr=false'
    ],
    {
      stdio: 'inherit',
      env: { ...process.env, NG_CLI_ANALYTICS: 'false', NODE_NO_WARNINGS: '1' }
    }
  );

  ngProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      ngReady = false;
      setTimeout(startAngular, 1500);
    }
  });
};

startAngular();

const cleanup = () => {
  isShuttingDown = true;
  try { ngProc?.kill('SIGTERM'); } catch {}
  process.exit(0);
};
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/__mam_ready__')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ready: ngReady }));
    return;
  }

  if (!ngReady) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(`<!DOCTYPE html><html lang="ku" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#0f172a;color:#f8fafc;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style></head><body><p>کردنەوەی ناوەندی نووسینی زانستی...</p><script>setInterval(async()=>{try{const r=await fetch('/__mam_ready__?t='+Date.now());const j=await r.json();if(j.ready)location.replace('/?v='+Date.now())}catch{}},700)</script></body></html>`);
    return;
  }

  const proxy = http.request(
    {
      hostname: '127.0.0.1',
      port: NG_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${NG_PORT}` }
    },
    (pRes) => {
      const h = { ...pRes.headers };
      delete h['x-frame-options'];
      delete h['content-security-policy'];
      h['access-control-allow-origin'] = '*';
      res.writeHead(pRes.statusCode || 200, h);
      pRes.pipe(res, { end: true });
    }
  );

  proxy.on('error', () => {
    ngReady = false;
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Reconnecting...');
  });

  req.pipe(proxy, { end: true });
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
  console.log(`[SovereignBoot] Active on port ${PUBLIC_PORT}`);
});
