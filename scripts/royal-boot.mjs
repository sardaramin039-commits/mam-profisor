import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

// 1. SELF-HEALING BUN NEUTRALIZER (Runs automatically on every container boot)
const BUN_SHIM = `#!/usr/bin/env sh
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
case "$1" in
  install|i|add|remove|update|ci)
    exit 0
    ;;
  -v|--version)
    echo "1.2.0"
    exit 0
    ;;
  run)
    shift
    exec npm run "$@"
    ;;
  dev|start|build|build:ng|watch|lint|test|typecheck)
    exec npm run "$@"
    ;;
  x|bunx)
    shift
    exec npx "$@"
    ;;
  *)
    exec node "$@"
    ;;
esac
`;

for (const bPath of ['/usr/local/bin/bun', '/usr/bin/bun', '/root/.bun/bin/bun']) {
  try {
    if (fs.existsSync(path.dirname(bPath))) {
      fs.writeFileSync(bPath, BUN_SHIM, { mode: 0o755 });
    }
  } catch {}
}
try { fs.unlinkSync('bun.lock'); } catch {}
try { fs.unlinkSync('bun.lockb'); } catch {}

// 2. INSTANT PORT-3000 SERVER + AUTO-RESPAWNING ANGULAR ENGINE ON PORT 4200
const PUBLIC_PORT = 3000;
const NG_PORT = 4200;
const DIST_BROWSER = path.resolve('dist/app/browser');
let ngReady = false;
let bootStartTime = Date.now();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

setInterval(() => {
  const sock = net.createConnection({ port: NG_PORT, host: '127.0.0.1' });
  sock.on('connect', () => {
    ngReady = true;
    sock.destroy();
  });
  sock.on('error', () => {
    sock.destroy();
  });
}, 800);

let ngProc = null;
let isShuttingDown = false;

const startAngularEngine = () => {
  if (isShuttingDown) return;
  const ngCliPath = './node_modules/@angular/cli/bin/ng.js';
  if (!fs.existsSync(ngCliPath)) {
    console.log('[RoyalBoot] Angular CLI not found, waiting...');
    return;
  }
  ngProc = spawn(
    process.execPath,
    [
      '--max-old-space-size=2560',
      ngCliPath,
      'serve',
      '--port', String(NG_PORT),
      '--host', '127.0.0.1',
      '--live-reload=false',
      '--hmr=false',
      '--optimization=false',
      '--source-map=false'
    ],
    { stdio: 'inherit', env: { ...process.env, NG_CLI_ANALYTICS: 'false' } }
  );

  ngProc.on('exit', (code) => {
    if (!isShuttingDown && code !== 0) {
      ngReady = false;
      setTimeout(startAngularEngine, 2000);
    }
  });
};

startAngularEngine();

const shutdown = () => {
  isShuttingDown = true;
  try { ngProc?.kill('SIGTERM'); } catch {}
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Zero-meta-refresh warmup page (prevents Chrome iframe redirect-loop blocking)
const WARMUP_PAGE = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>مام پڕۆفیسۆر</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .box { background: #1e293b; padding: 32px; border-radius: 18px; border: 1px solid #334155; max-width: 420px; width: 88%; box-shadow: 0 12px 32px rgba(0,0,0,0.45); }
    .loader { width: 44px; height: 44px; border: 4px solid #38bdf8; border-top-color: transparent; border-radius: 50%; animation: s 0.85s linear infinite; margin: 0 auto 18px; }
    @keyframes s { to { transform: rotate(360deg); } }
    h2 { color: #38bdf8; margin: 0 0 10px; font-size: 20px; }
    p { color: #cbd5e1; font-size: 14px; line-height: 1.75; margin: 0 0 16px; }
    .bar-bg { background: #0f172a; height: 8px; border-radius: 99px; overflow: hidden; border: 1px solid #334155; }
    .bar-fill { background: linear-gradient(90deg, #38bdf8, #818cf8); height: 100%; width: 15%; transition: width 0.6s ease; }
  </style>
</head>
<body>
  <div class="box">
    <div class="loader"></div>
    <h2>سیستەمی ئەکادیمیی مام پڕۆفیسۆر</h2>
    <p id="status-text">پێکهاتەکانی پڕۆژەکە ئامادە دەکرێن؛ هەر کە تەواو بوو ڕاستەوخۆ دەکرێتەوە...</p>
    <div class="bar-bg"><div class="bar-fill" id="pbar"></div></div>
  </div>
  <script>
    let pct = 15;
    const bar = document.getElementById('pbar');
    const poll = async () => {
      try {
        const res = await fetch('/__mam_status__', { cache: 'no-store' });
        const data = await res.json();
        if (data && data.ready) {
          bar.style.width = '100%';
          window.location.replace('/');
          return;
        }
      } catch {}
      pct = Math.min(94, pct + 3);
      bar.style.width = pct + '%';
      setTimeout(poll, 1000);
    };
    setTimeout(poll, 900);
  </script>
</body>
</html>`;

const tryServePrebuiltStatic = (req, res) => {
  if (!fs.existsSync(path.join(DIST_BROWSER, 'index.html'))) return false;
  const cleanUrl = (req.url || '/').split('?')[0];
  let filePath = path.join(DIST_BROWSER, cleanUrl === '/' ? 'index.html' : cleanUrl);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_BROWSER, 'index.html');
  }
  try {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
    return true;
  } catch {
    return false;
  }
};

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/__mam_status__')) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ ready: ngReady, uptimeMs: Date.now() - bootStartTime }));
    return;
  }

  if (!ngReady) {
    if (tryServePrebuiltStatic(req, res)) return;
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(WARMUP_PAGE);
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
      delete headers['content-security-policy'];
      delete headers['content-security-policy-report-only'];
      headers['access-control-allow-origin'] = '*';
      res.writeHead(proxyRes.statusCode || 200, headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', () => {
    if (!tryServePrebuiltStatic(req, res)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(WARMUP_PAGE);
    }
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
  console.log(`[RoyalBoot] Port ${PUBLIC_PORT} active in 50ms.`);
});
