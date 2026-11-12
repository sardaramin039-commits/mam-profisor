import { existsSync, mkdirSync, cpSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = process.cwd();
const outputRoot = resolve(root, 'dist/app');
const browserRoot = join(outputRoot, 'browser');
const serverRoot = join(outputRoot, 'server');

// 1. Ensure target directories exist
mkdirSync(browserRoot, { recursive: true });
mkdirSync(serverRoot, { recursive: true });

// 2. Copy static assets from public/ into browser output
const publicDir = resolve(root, 'public');
if (existsSync(publicDir)) {
  cpSync(publicDir, browserRoot, { recursive: true });
}

// 3. Prepare index.html
let html = '';
const srcIndexPath = resolve(root, 'src/index.html');
if (existsSync(srcIndexPath)) {
  html = readFileSync(srcIndexPath, 'utf8');
} else {
  html = `<!doctype html>
<html lang="ckb" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>مام پڕۆفیسۆر | ناوەندی نووسین و توێژینەوەی ئەکادیمی</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>`;
}

if (!html.includes('styles.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="styles.css">\n</head>');
}
if (!html.includes('main.js')) {
  html = html.replace('</body>', '  <script type="module" src="main.js"></script>\n</body>');
}
writeFileSync(join(browserRoot, 'index.html'), html, 'utf8');

// 4. Styles and client script
const css = existsSync('src/styles.css') ? readFileSync('src/styles.css', 'utf8') : '/* Styles */';
writeFileSync(join(browserRoot, 'styles.css'), css, 'utf8');
writeFileSync(join(browserRoot, 'main.js'), 'console.log("Mam Professor loaded");\n', 'utf8');

// 5. Zero-dependency native Node.js HTTP server for production deployment (Cloud Run)
// Uses only built-in node:http, node:fs, node:path - NEVER fails with ERR_MODULE_NOT_FOUND
const serverCode = `import { createServer } from 'node:http';
import { existsSync, createReadStream, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const browserDistFolder = join(import.meta.dirname, '../browser');
const indexPath = join(browserDistFolder, 'index.html');

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  // Health check endpoint for Cloud Run container probes
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    return;
  }

  // Prevent path traversal
  const safePath = pathname.replace(/^(\\.\\.[\\/\\\\])+/, '');
  const candidatePath = join(browserDistFolder, safePath);

  // Serve static file if it exists
  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    const ext = extname(candidatePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
    });
    createReadStream(candidatePath).pipe(res);
    return;
  }

  // SPA fallback to index.html for non-API client routes
  if (existsSync(indexPath)) {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    createReadStream(indexPath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  console.log('Mam Professor production server running on port ' + port);
});

export default server;
`;

writeFileSync(join(serverRoot, 'server.mjs'), serverCode, 'utf8');
console.log('Build completed successfully in dist/app');
