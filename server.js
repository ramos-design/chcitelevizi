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

// Lokální tajné klíče (RESEND_API_KEY…); na Vercelu jsou v Environment Variables
try {
  process.loadEnvFile(path.join(ROOT_DIR, '.env'));
} catch {
  // .env není povinný
}

// /api/<name> -> api/<name>.js (stejné chování jako Vercel Functions)
function handleApi(req, res, pathname) {
  const name = pathname.slice('/api/'.length);
  if (!/^[a-z0-9-]+$/i.test(name)) {
    send(res, 404, 'Not Found');
    return;
  }
  const modulePath = path.join(ROOT_DIR, 'api', `${name}.js`);
  if (!fs.existsSync(modulePath)) {
    send(res, 404, 'Not Found');
    return;
  }

  const chunks = [];
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > 100 * 1024) req.destroy();
    else chunks.push(chunk);
  });
  req.on('end', async () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      req.body = raw && (req.headers['content-type'] || '').includes('application/json') ? JSON.parse(raw) : raw;
    } catch {
      req.body = raw;
    }
    try {
      await require(modulePath)(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) send(res, 500, 'Internal Server Error');
    }
  });
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url || '/';
  const pathname = decodeURIComponent(rawUrl.split('?')[0]);

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname);
    return;
  }
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
