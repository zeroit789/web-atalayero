/*
  server.js · Conservas Atalayero
  Servidor local para ver la web como en Cloudflare Pages: rutas sin .html, 404.html propio y las
  cabeceras de seguridad leídas de _headers. Solo escucha en 127.0.0.1, no sirve ficheros ni carpetas
  ocultas (.git, .local…) y comprueba la ruta real de cada fichero. Solo módulos nativos de Node (22+).
  Local server to view the site as on Cloudflare Pages: extensionless routes, custom 404.html and the
  security headers read from _headers. It only listens on 127.0.0.1, never serves hidden files or
  folders (.git, .local…) and checks each file's real path. Native Node modules only (22+).

  Uso / Usage:  node server.js [puerto/port]   →   http://127.0.0.1:8080
*/
import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carpeta de la web (ruta real) y puerto / Site folder (real path) and port
const RAIZ = realpathSync(path.dirname(fileURLToPath(import.meta.url)));
const PUERTO = Number(process.argv[2]) || 8080;
const HOST = '127.0.0.1';

// Tipos de contenido por extensión / Content types by extension
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webm': 'video/webm',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon'
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
  // En http://127.0.0.1 no hay HTTPS: se quitan HSTS y upgrade-insecure-requests para no romper la carga.
  // There is no HTTPS on 127.0.0.1: HSTS and upgrade-insecure-requests are dropped so loading works.
  delete cabeceras['Strict-Transport-Security'];
  if (cabeceras['Content-Security-Policy']) {
    cabeceras['Content-Security-Policy'] = cabeceras['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
  }
  return cabeceras;
}
const CABECERAS = leerCabeceras();

// ¿Está la ruta real dentro de la raíz y sin partes ocultas? / Is the real path inside the root with no hidden parts?
function rutaPermitida(real) {
  const relativa = path.relative(RAIZ, real);
  if (relativa === '') return true;
  if (relativa.startsWith('..') || path.isAbsolute(relativa)) return false;
  return !relativa.split(path.sep).some((parte) => parte.startsWith('.'));
}

// Busca el fichero de una ruta ya decodificada: /x → x.html, /x/ → x/index.html
// Resolves an already decoded route to a file: /x → x.html, /x/ → x/index.html
async function resolver(ruta) {
  // Ninguna parte de la URL puede empezar por punto / No URL segment may start with a dot
  if (ruta.split('/').some((parte) => parte.startsWith('.'))) return null;
  const candidatos = ruta.endsWith('/') ? [path.join(ruta, 'index.html')] : [ruta, ruta + '.html'];
  for (const c of candidatos) {
    const fichero = path.join(RAIZ, c);
    try {
      const real = await realpath(fichero);
      if (!rutaPermitida(real)) continue;
      if ((await stat(real)).isFile()) return real;
    } catch { /* no existe: siguiente candidato / does not exist: next candidate */ }
  }
  return null;
}

// Respuesta de texto simple / Plain text response
function texto(res, estado, mensaje) {
  res.writeHead(estado, { 'Content-Type': 'text/plain; charset=utf-8', ...CABECERAS });
  res.end(mensaje);
}

// Manejador de cada petición / Request handler
async function atender(pet, res) {
  const url = new URL(pet.url, `http://${HOST}`);
  let ruta;
  // Una URL mal codificada devuelve 400 en vez de tumbar el servidor / A malformed URL returns 400 instead of crashing
  try { ruta = decodeURIComponent(url.pathname); } catch { return texto(res, 400, 'Petición incorrecta'); }
  if (ruta.includes('\0')) return texto(res, 400, 'Petición incorrecta');
  // Igual que Cloudflare Pages: /x.html redirige a /x, solo si la página existe. El destino sale de la
  // ruta decodificada sin la extensión, vuelta a codificar por partes y con una sola barra inicial,
  // así que nunca apunta a otro origen (//otro.sitio o /\otro.sitio).
  // Like Cloudflare Pages: /x.html redirects to /x, only if the page exists. The target comes from the
  // decoded route without the extension, re-encoded segment by segment and with a single leading
  // slash, so it never points to another origin (//other.site or /\other.site).
  if (ruta.endsWith('.html') && await resolver(ruta)) {
    const sinExtension = ruta === '/index.html' ? '/' : ruta.slice(0, -5);
    const destino = '/' + sinExtension.split('/').map(encodeURIComponent).join('/').replace(/^\/+/, '');
    res.writeHead(308, { Location: destino + url.search });
    return res.end();
  }
  // La página 404 pasa por la misma comprobación de ruta real; si falla, 404 de texto
  // The 404 page goes through the same real-path check; if it fails, a plain-text 404
  const fichero = await resolver(ruta);
  const final = fichero || await resolver('/404.html');
  if (!final) return texto(res, 404, 'No encontrado');
  const cuerpo = await readFile(final);
  res.writeHead(fichero ? 200 : 404, { 'Content-Type': TIPOS[path.extname(final)] || 'application/octet-stream', ...CABECERAS });
  res.end(cuerpo);
}

// Servidor: cualquier error del manejador acaba en 500 / Server: any handler error ends in 500
http.createServer((pet, res) => {
  atender(pet, res).catch((error) => {
    console.error('Error al servir', pet.url, error.message);
    if (!res.headersSent) texto(res, 500, 'Error interno');
    else res.end();
  });
}).listen(PUERTO, HOST, () => console.log(`Conservas Atalayero en http://${HOST}:${PUERTO}`));
