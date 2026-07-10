const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function isSafePath(targetPath) {
  const relative = path.relative(ROOT_DIR, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url || '/';
  const pathname = decodeURIComponent(rawUrl.split('?')[0]);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;

  const filePath = path.resolve(ROOT_DIR, `.${requestedPath}`);
  if (!isSafePath(filePath)) {
    send(res, 403, 'Forbidden');
    return;
  }

  const serveFile = (targetPath) => {
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(targetPath, (readErr, data) => {
      if (readErr) {
        send(res, 500, 'Internal Server Error');
        return;
      }
      send(res, 200, data, contentType);
    });
  };

  fs.stat(filePath, (statErr, stats) => {
    if (!statErr && stats.isFile()) {
      serveFile(filePath);
      return;
    }

    // Clean URLs: /admin -> admin.html, /blog -> blog.html (same as vercel.json)
    const htmlPath = `${filePath}.html`;
    fs.stat(htmlPath, (htmlErr, htmlStats) => {
      if (!htmlErr && htmlStats.isFile()) {
        serveFile(htmlPath);
        return;
      }

      // Pretty article URLs: /blog/<slug> -> clanek.html (same as vercel.json)
      if (/^\/blog\/[^/]+$/.test(pathname)) {
        serveFile(path.join(ROOT_DIR, 'clanek.html'));
        return;
      }

      // SPA-like fallback for unknown routes
      const fallbackPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, data) => {
        if (fallbackErr) {
          send(res, 404, 'Not Found');
          return;
        }
        send(res, 200, data, 'text/html; charset=utf-8');
      });
    });
  });
});

const onListen = () => {
  const hostLabel = HOST || 'localhost';
  // eslint-disable-next-line no-console
  console.log(`Local web running at http://${hostLabel}:${PORT}`);
};

if (HOST) {
  server.listen(PORT, HOST, onListen);
} else {
  server.listen(PORT, onListen);
}
