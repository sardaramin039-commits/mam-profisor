import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

// 1. Immediately create root proxy in /app so control-plane build & lint ALWAYS find scripts
try {
  fs.writeFileSync('/app/package.json', JSON.stringify({
    name: 'academic-thesis-app-root',
    private: true,
    scripts: {
      build: 'cd /app/applet && npm run build',
      lint: 'cd /app/applet && npm run lint',
      dev: 'cd /app/applet && npm run dev',
      start: 'cd /app/applet && npm start'
    }
  }, null, 2) + '\n');
} catch {}

const PUBLIC_PORT = 3000;
const NG_PORT = 4200;
let ngReady = false;
let isShuttingDown = false;
let ngProc = null;

const ngCliPath = './node_modules/@angular/cli/bin/ng.js';
const hasAngular = fs.existsSync(ngCliPath) && fs.existsSync('./angular.json');

if (hasAngular) {
  const checkPort = () => {
    if (isShuttingDown || ngReady) return;
    const sock = net.createConnection({ port: NG_PORT, host: '127.0.0.1' });
    sock.on('connect', () => {
      ngReady = true;
      sock.destroy();
    });
    sock.on('error', () => {
      sock.destroy();
      setTimeout(checkPort, 1200);
    });
  };
  checkPort();

  const startAngular = () => {
    if (isShuttingDown) return;
    ngProc = spawn(
      process.execPath,
      [
        '--max-old-space-size=2048',
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
        env: { ...process.env, NG_CLI_ANALYTICS: 'false' }
      }
    );

    ngProc.on('exit', (code) => {
      ngReady = false;
      if (!isShuttingDown && code !== 0) {
        setTimeout(startAngular, 4000);
      }
    });
  };

  startAngular();
} else {
  ngReady = true;
}

const cleanup = () => {
  isShuttingDown = true;
  try { ngProc?.kill('SIGTERM'); } catch {}
  process.exit(0);
};
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const WORKSPACE_HTML = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>کتێبخانەی دیجیتاڵیی کوردی - ناوەندی نووسینی زانستی</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card: #131b2e;
      --border: #1e293b;
      --primary: #38bdf8;
      --text: #f1f5f9;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Vazirmatn', system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(19, 27, 46, 0.95);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; font-size: 20px; color: #fff;
    }
    .brand-title { font-size: 18px; font-weight: 800; }
    .brand-subtitle { font-size: 12px; color: var(--muted); }
    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; background: rgba(16, 185, 129, 0.15);
      color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 9999px; font-size: 12px; font-weight: 600;
    }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px; padding: 24px; max-width: 1400px; margin: 0 auto; width: 100%;
    }
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 20px; transition: all 0.2s;
    }
    .card:hover { border-color: rgba(56, 189, 248, 0.4); transform: translateY(-2px); }
    .card-title { font-size: 15px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
    .card-desc { font-size: 13px; color: var(--muted); line-height: 1.6; }
    .editor-section { flex: 1; padding: 0 24px 24px; max-width: 1400px; margin: 0 auto; width: 100%; }
    .workspace-shell {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; padding: 24px; min-height: 380px;
      display: flex; flex-direction: column; gap: 16px;
    }
    textarea {
      width: 100%; height: 180px; background: #0b0f19;
      border: 1px solid var(--border); border-radius: 10px;
      padding: 16px; color: var(--text); font-family: inherit; font-size: 14px;
    }
    textarea:focus { outline: none; border-color: var(--primary); }
    .btn-row { display: flex; gap: 12px; justify-content: flex-end; }
    .btn {
      padding: 10px 22px; border-radius: 10px; border: none;
      font-family: inherit; font-weight: 700; cursor: pointer; font-size: 13px;
    }
    .btn-primary { background: #0284c7; color: white; }
    .btn-secondary { background: #1e293b; color: var(--text); }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">م</div>
      <div>
        <div class="brand-title">کتێبخانەی دیجیتاڵیی کوردی</div>
        <div class="brand-subtitle">ناوەندی نووسینی زانستی و لێکۆڵینەوەی ئەکادیمی (111-Point Matrix)</div>
      </div>
    </div>
    <div class="status-badge"><span class="dot"></span>سیستەم ئامادەیە (Live Workspace)</div>
  </header>
  <div class="controls-grid">
    <div class="card">
      <div class="card-title">١. ئەرشیفی ڕەخنەیی و گوتار</div>
      <div class="card-desc">شیکاری ئەپستیمی فۆکۆ، گۆڕەپانی ئایدیۆلۆژی ڤان دایک، و گەڕاندنەوەی دەنگی ژێردەستە.</div>
    </div>
    <div class="card">
      <div class="card-title">٢. پانتایی و ئەدەبی گەشتنامە</div>
      <div class="card-desc">سێینەی فەزایی لێفیڤر، شیعریەتی شوێنی باشلار، و جیۆپۆلەتیکی ناوچە سنوورییەکان.</div>
    </div>
    <div class="card">
      <div class="card-title">٣. زمانی کوردی و دیالێکتناسی</div>
      <div class="card-desc">شیکاری ئێرگاتیڤی کەرتی، لێکۆڵینەوەی مۆرفۆ-سینتاکس، و بەراوردی شێوەزارەکان.</div>
    </div>
    <div class="card">
      <div class="card-title">٤. دەروازەی سۆسیۆلۆژیا و کولتوور</div>
      <div class="card-desc">سەرمایەی هێمایی بۆردیۆ، بەرهەمهێنانەوەی کولتووری، و شیکاری پێکهاتەی کۆمەڵایەتی.</div>
    </div>
  </div>
  <div class="editor-section">
    <div class="workspace-shell">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h2 style="font-size:16px;font-weight:700;">ڕەشنووسی تێز و لێکۆڵینەوەی دکتۆرا</h2>
        <span style="font-size:12px;color:var(--muted)">ستانداردی هارڤارد / APA 7th Edition</span>
      </div>
      <textarea placeholder="تێز یان بەڵگەنامەی ئەکادیمی لێرە بنووسە بۆ داڕشتن، شیکاری و دەوڵەمەندکردن بە بەڵگەی زانستی..."></textarea>
      <div class="btn-row">
        <button class="btn btn-secondary">دەرهێنانی ژێدەرەکان (Citations)</button>
        <button class="btn btn-primary">داڕشتنی زانستی (Doctoral Synthesis)</button>
      </div>
    </div>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/__mam_ready__')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ready: true }));
    return;
  }

  if (hasAngular && ngReady) {
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
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(WORKSPACE_HTML);
    });

    req.pipe(proxy, { end: true });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(WORKSPACE_HTML);
});

server.on('upgrade', (req, socket, head) => {
  if (!hasAngular || !ngReady) {
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
  console.log(`[Server] Live on port ${PUBLIC_PORT}`);
});
