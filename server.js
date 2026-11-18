/*
  server.js · Conservas Atalayero
  Servidor local para ver la web como en Cloudflare Pages: rutas sin .html, 404.html propio y las
  cabeceras de seguridad leídas de _headers. Solo usa módulos nativos de Node (22 o superior).
  Local server to view the site as on Cloudflare Pages: extensionless routes, custom 404.html and the
  security headers read from _headers. Uses only native Node modules (22 or newer).

  Uso / Usage:  node server.js [puerto/port]   →   http://localhost:8080
*/
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carpeta de la web y puerto / Site folder and port
const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = Number(process.argv[2]) || 8080;

// Tipos de contenido por extensión / Content types by extension
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webm': 'video/webm',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8'
};

// Lee las cabeceras del bloque "/*" de _headers / Reads the headers of the "/*" block in _headers
function leerCabeceras() {
  const cabeceras = {};
  let dentro = false;
  for (const linea of readFileSync(path.join(RAIZ, '_headers'), 'utf8').split(/\r?\n/)) {
    if (linea.startsWith('#') || !linea.trim()) continue;
    if (!linea.startsWith(' ')) { dentro = linea.trim() === '/*'; continue; }
    if (dentro) {
      const i = linea.indexOf(':');
      cabeceras[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
    }
  }
  // En http://localhost no hay HTTPS: se quitan HSTS y upgrade-insecure-requests para no romper la carga.
  // There is no HTTPS on localhost: HSTS and upgrade-insecure-requests are dropped so loading works.
  delete cabeceras['Strict-Transport-Security'];
  if (cabeceras['Content-Security-Policy']) {
    cabeceras['Content-Security-Policy'] = cabeceras['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
  }
  return cabeceras;
}
const CABECERAS = leerCabeceras();

// Busca el fichero de una ruta: /x → x.html, /x/ → x/index.html / Resolves a route to a file
async function resolver(ruta) {
  const limpia = path.normalize(decodeURIComponent(ruta)).replace(/^(\.\.[/\\])+/, '');
  const candidatos = limpia.endsWith('/') || limpia === path.sep
    ? [path.join(limpia, 'index.html')]
    : [limpia, limpia + '.html'];
  for (const c of candidatos) {
    const fichero = path.join(RAIZ, c);
    if (!fichero.startsWith(RAIZ)) return null;
    try { if ((await stat(fichero)).isFile()) return fichero; } catch { /* sigue / continue */ }
  }
  return null;
}

// Servidor / Server
http.createServer(async (pet, res) => {
  const ruta = new URL(pet.url, 'http://localhost').pathname;
  // Igual que Cloudflare Pages: /x.html redirige a /x / Like Cloudflare Pages: /x.html redirects to /x
  if (ruta.endsWith('.html')) {
    const destino = ruta === '/index.html' ? '/' : ruta.slice(0, -5);
    res.writeHead(308, { Location: destino + (pet.url.includes('?') ? pet.url.slice(pet.url.indexOf('?')) : '') });
    return res.end();
  }
  const fichero = await resolver(ruta);
  const estado = fichero ? 200 : 404;
  const final = fichero || path.join(RAIZ, '404.html');
  const cuerpo = await readFile(final);
  res.writeHead(estado, { 'Content-Type': TIPOS[path.extname(final)] || 'application/octet-stream', ...CABECERAS });
  res.end(cuerpo);
}).listen(PUERTO, () => console.log(`Conservas Atalayero en http://localhost:${PUERTO}`));
