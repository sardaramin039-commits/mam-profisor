import 'dotenv/config';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
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
const API_PORT = 4301;
const STORAGE_ROOT = path.join(process.cwd(), 'local_workspace_data');
const PROJECTS_ROOT = path.join(STORAGE_ROOT, 'projects');
const LIBRARY_ROOT = path.join(STORAGE_ROOT, 'library');
const MAX_LOCAL_STORAGE_BODY_BYTES = 20 * 1024 * 1024;

for (const dir of [STORAGE_ROOT, PROJECTS_ROOT, LIBRARY_ROOT]) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}

let ngReady = false;
let apiReady = false;
let isShuttingDown = false;
let ngProc = null;
let apiProc = null;

const ngCliPath = './node_modules/@angular/cli/bin/ng.js';
const tsxCliPath = './node_modules/tsx/dist/cli.mjs';
const localApiPath = './src/server/local-api.ts';
const hasAngular = fs.existsSync(ngCliPath) && fs.existsSync('./angular.json');
const hasLocalApi = fs.existsSync(tsxCliPath) && fs.existsSync(localApiPath);

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
}

if (hasLocalApi) {
  const checkApiPort = () => {
    if (isShuttingDown || apiReady) return;
    const healthRequest = http.get(`http://127.0.0.1:${API_PORT}/health`, (response) => {
      let payload = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { payload += chunk; });
      response.on('end', () => {
        try {
          const health = JSON.parse(payload);
          apiReady = response.statusCode === 200 && health.service === 'mam-profisor-local-gemini-api' && health.ready === true;
        } catch {
          apiReady = false;
        }
        if (!apiReady && !isShuttingDown) setTimeout(checkApiPort, 500);
      });
    });
    healthRequest.setTimeout(1000, () => {
      healthRequest.destroy();
    });
    healthRequest.on('error', () => {
      apiReady = false;
      if (!isShuttingDown) setTimeout(checkApiPort, 500);
    });
  };
  checkApiPort();

  const startLocalApi = () => {
    if (isShuttingDown) return;
    apiProc = spawn(
      process.execPath,
      [tsxCliPath, localApiPath],
      {
        stdio: 'inherit',
        env: { ...process.env, MAM_API_PORT: String(API_PORT) }
      }
    );
    apiProc.on('error', (error) => {
      apiReady = false;
      console.error('[Local API] Failed to start the Gemini API process:', error.message);
    });
    apiProc.on('exit', (code) => {
      apiReady = false;
      if (!isShuttingDown) {
        console.error(`[Local API] Gemini API process exited (${code ?? 'unknown'}); restarting.`);
        setTimeout(startLocalApi, 1500);
      }
    });
  };

  startLocalApi();
} else {
  console.error('[Local API] TypeScript API runner or src/server/local-api.ts is missing; Gemini writing will return 503.');
}

const cleanup = () => {
  isShuttingDown = true;
  try { ngProc?.kill('SIGTERM'); } catch {}
  try { apiProc?.kill('SIGTERM'); } catch {}
  process.exit(0);
};
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith('/__mam_ready__')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ready: true }));
    return;
  }

  if (req.url && req.url.startsWith('/api/local-storage/')) {
    handleLocalStorageRequest(req, res);
    return;
  }

  if (req.url && req.url.startsWith('/api/gemini/')) {
    if (!hasLocalApi || !apiReady) {
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({
        success: false,
        code: 'GEMINI_API_UNAVAILABLE',
        error: 'سێرڤەری نووسینی Gemini ئامادە نییە. سێرڤەری ناوخۆیی نوێ بکەرەوە و دووبارە هەوڵ بدەرەوە.'
      }));
      return;
    }

    const apiProxy = http.request(
      {
        hostname: '127.0.0.1',
        port: API_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${API_PORT}` }
      },
      (apiRes) => {
        res.writeHead(apiRes.statusCode || 502, {
          ...apiRes.headers,
          'Cache-Control': 'no-store'
        });
        apiRes.pipe(res, { end: true });
      }
    );
    apiProxy.on('error', () => {
      if (res.headersSent) {
        res.end();
        return;
      }
      res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({
        success: false,
        code: 'GEMINI_API_UNAVAILABLE',
        error: 'پەیوەندی بە سێرڤەری نووسینی Gemini پچڕا. دووبارە هەوڵ بدەرەوە.'
      }));
    });
    req.pipe(apiProxy, { end: true });
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
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('Angular workspace is starting. Retry shortly.');
    });

    req.pipe(proxy, { end: true });
    return;
  }

  res.writeHead(503, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end('Angular workspace is unavailable. Check the local dev server.');
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

const handleLocalStorageRequest = (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const action = url.pathname.replace(/^\/api\/local-storage\//, '').split('/')[0];

  const respond = (payload, statusCode = 200) => {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(payload));
  };

  const readBody = () => new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > MAX_LOCAL_STORAGE_BODY_BYTES) {
        rejected = true;
        reject(Object.assign(new Error('Request body too large'), { code: 'PAYLOAD_TOO_LARGE' }));
        return;
      }
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (rejected) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });

  const projectFilePath = (projectId) => {
    const id = projectId === undefined || projectId === null || projectId === ''
      ? 'project'
      : projectId;
    if (
      typeof id !== 'string' ||
      id.length > 100 ||
      !/^[\p{L}\p{N}._-]+$/u.test(id) ||
      id === '.' ||
      id === '..'
    ) {
      return null;
    }
    return path.join(PROJECTS_ROOT, `${id}.json`);
  };

  const safeFilePath = (candidate) => {
    if (typeof candidate !== 'string' || !candidate) return null;
    if (path.isAbsolute(candidate) || candidate.includes('\0')) return null;
    const targetPath = path.resolve(STORAGE_ROOT, candidate);
    const relativePath = path.relative(STORAGE_ROOT, targetPath);
    if (!relativePath || relativePath.startsWith(`..${path.sep}`) || relativePath === '..' || path.isAbsolute(relativePath)) return null;
    const rootName = relativePath.split(path.sep)[0];
    return ['projects', 'library', 'backups'].includes(rootName) ? targetPath : null;
  };

  const listSnapshotFiles = (targetDir) => {
    try {
      return fs.readdirSync(targetDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  };

  void (async () => {
    switch (action) {
      case 'save': {
        const payload = await readBody();
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          respond({ ok: false, error: 'Request body must be a JSON object' }, 400);
          return;
        }
        const targetPath = payload.path
          ? safeFilePath(payload.path)
          : projectFilePath(payload.projectId);
        if (!targetPath) {
          respond({ ok: false, error: 'Invalid or missing target path' }, 400);
          return;
        }
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, JSON.stringify(payload.data ?? payload, null, 2));
        respond({ ok: true, path: path.relative(process.cwd(), targetPath) });
        return;
      }
      case 'load': {
        const projectId = url.searchParams.get('projectId') || url.searchParams.get('name');
        const requestPath = url.searchParams.get('path');
        const targetPath = requestPath ? safeFilePath(requestPath) : projectFilePath(projectId);
        if (!targetPath) {
          respond({ ok: false, error: 'Invalid target path' }, 400);
          return;
        }
        if (!fs.existsSync(targetPath)) {
          respond({ ok: false, data: null, exists: false });
          return;
        }
        const raw = fs.readFileSync(targetPath, 'utf8');
        try {
          respond({ ok: true, data: JSON.parse(raw), exists: true, path: path.relative(process.cwd(), targetPath) });
        } catch {
          respond({ ok: true, data: raw, exists: true, path: path.relative(process.cwd(), targetPath) });
        }
        return;
      }
      case 'backup': {
        const backupDir = path.join(STORAGE_ROOT, 'backups');
        fs.mkdirSync(backupDir, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const snapshot = {
          generatedAt: new Date().toISOString(),
          projects: listSnapshotFiles(PROJECTS_ROOT),
          library: listSnapshotFiles(LIBRARY_ROOT),
          root: STORAGE_ROOT
        };
        const filePath = path.join(backupDir, `snapshot-${stamp}.json`);
        fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
        respond({ ok: true, path: path.relative(process.cwd(), filePath), backup: snapshot });
        return;
      }
      default:
        respond({ ok: false, error: 'Unknown local-storage action' }, 404);
    }
  })().catch((error) => {
    console.error('[LocalStorage] Request failed:', error);
    const invalidJson = error instanceof SyntaxError;
    const tooLarge = error?.code === 'PAYLOAD_TOO_LARGE';
    respond(
      {
        ok: false,
        error: invalidJson
          ? 'Invalid JSON request body'
          : tooLarge
            ? 'Request body exceeds the 20 MiB limit'
            : 'Local storage request failed'
      },
      invalidJson ? 400 : tooLarge ? 413 : 500
    );
  });
};

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    http.get('http://127.0.0.1:3000/__mam_ready__', { timeout: 2000 }, (res) => {
      if (res.statusCode === 200) {
        console.log('[Server] Port 3000 already in use by a live Mam Professor instance; skipping duplicate startup.');
        process.exit(0);
      }
      console.error('[Server] Port 3000 is occupied by another process.');
      process.exit(1);
    }).on('error', () => {
      console.error('[Server] Port 3000 is occupied by another process.');
      process.exit(1);
    });
    return;
  }
  throw error;
});

server.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`[Server] Live on port ${PUBLIC_PORT}`);
});
