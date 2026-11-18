# Conservas Atalayero

**ES** · [EN](#english)

Web de demostración de una conservera **ficticia** de atún rojo de almadraba en Zahara de los Atunes (Cádiz).
La página es la etiqueta litografiada de la lata: papel arena, una sola tinta cobalto, la franja a rayas y la torre
del atalayero, el vigía que avisaba de la entrada del atún. Forma parte del portfolio de [danimefle.com](https://danimefle.com).

> Marca ficticia. No hay fábrica, tienda ni latas reales. Precios, horarios, dirección y correos son de ejemplo;
> los correos usan el dominio reservado `.example`.

## Páginas

| Fichero | Contenido |
| --- | --- |
| `index.html` | Portada: héroe con la etiqueta, la temporada, el despiece con la caja de seis latas (la parte interactiva), el proceso «del copo a la lata», la tarifa y el cupón de pedido. |
| `tienda.html` | Catálogo completo: latas de 120 g, cajas de seis, latas grandes, salazones, untables, envíos y pago. |
| `almadraba.html` | La temporada (calendario), cómo se pesca (esquema dibujado), el ronqueo (despiece) y las cuatro almadrabas de Cádiz. |
| `sobre-nosotros.html` | Historia en cinco fechas, los oficios de la nave, lo que no cambia y el lugar. |
| `contacto.html` | Dirección, horario, plano dibujado y el cupón. |
| `aviso-legal.html`, `privacidad.html`, `cookies.html` | Textos legales de una web de demostración. |
| `creditos.html` | Autor y licencia de cada imagen, el vídeo y la tipografía. |
| `404.html` | Página de error con el estilo de la web. |

## Tecnología

- HTML, CSS y JavaScript sin dependencias ni paso de compilación. Sin librerías de terceros.
- Tipografía Hanken Grotesk (SIL Open Font License 1.1, versión 12, variable) servida desde `assets/fonts/`, con su `OFL.txt`.
- Analítica: Plausible desde `analytics.danimefle.com`, sin cookies.
- Accesible por teclado, con enlace «Saltar al contenido», menú móvil con foco atrapado y Escape, botón
  «Pausar movimiento» y respeto a `prefers-reduced-motion`.
- Comprobado con Node.js 24.22.2 y Python 3.12.10 con Pillow 12.3.0 (solo para regenerar).

## Verla en local

```bash
node server.js          # http://127.0.0.1:8080
node server.js 3000     # otro puerto
```

`server.js` usa solo módulos nativos de Node (versión 22 o superior) y solo escucha en `127.0.0.1`. No sirve ficheros
ni carpetas ocultas (`.git`…) y comprueba la ruta real de cada fichero. Sirve las rutas sin `.html` como Cloudflare
Pages, usa `404.html` y aplica las cabeceras de `_headers`. En local quita HSTS y `upgrade-insecure-requests`, porque
no hay HTTPS. También se puede abrir `index.html` directamente en el navegador.

## Desplegar en Cloudflare Pages

1. Crea un proyecto de Pages conectado al repositorio, sin comando de compilación y con la raíz como carpeta de salida.
2. `_headers` aplica la CSP, HSTS, `nosniff`, `Referrer-Policy` y `Permissions-Policy`.
3. Pages redirige `/pagina.html` a `/pagina`: las URL canónicas y el `sitemap.xml` ya van sin extensión.
4. Si el dominio no es `atalayero.danimefle.com`, cámbialo en todos los ficheros:
   `grep -rl "atalayero.danimefle.com" . | xargs sed -i "s/atalayero.danimefle.com/tu-dominio/g"`.

## Adaptarla

- **Textos y páginas:** las páginas se generan con `python herramientas/generador/generar.py`. Edita el fragmento de
  `herramientas/generador/paginas/` y vuelve a generar. Cabecera, barra, pie, cupón, catálogo y créditos están en
  `generar.py` (Python 3.11 o superior; Pillow solo para rehacer las imágenes Open Graph).
- **Precios:** solo en `CATALOGO` de `generar.py`. De ahí salen la tienda, la tarifa de la portada y `assets/js/datos.js`.
- **Colores y tipografía:** tokens en `:root` de `assets/css/estilos.css` (`--bg`, `--surface`, `--ink`, `--muted`,
  `--fuente`).
- **Imágenes:** en `assets/img/`, en WebP. Si cambias una, actualiza `CREDITOS` en `generar.py` y `CREDITOS.md`.
- **Para un negocio real:** quita `<meta name="robots" content="noindex, follow">` de la cabecera en `generar.py`,
  cambia los correos `.example`, conecta el cupón a un servicio de formularios y añade
  su dominio a `form-action` y `connect-src` en `_headers`.

## Créditos y licencias

- Código: licencia MIT (ver `LICENSE`). Los avisos sobre lo que no cubre (imágenes, tipografía y marca) están en [`NOTICE.md`](NOTICE.md).
- Fotografías, carta náutica y vídeo: Wikimedia Commons, con licencias CC BY-SA 4.0, CC0, CC BY 2.5 y dominio público.
  Detalle en `CREDITOS.md` y en `creditos.html`.
- Tipografía: Hanken Grotesk, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`). No está cubierta por la licencia MIT.

---

<a id="english"></a>

# Conservas Atalayero

[ES](#conservas-atalayero) · **EN**

Demo website for a **fictional** canning company that tins bluefin tuna caught by almadraba in Zahara de los Atunes
(Cádiz, Spain). The page is the tin's lithographed label: sand paper, a single cobalt ink, the striped band and the
watchtower. It is part of the [danimefle.com](https://danimefle.com) portfolio.

> Fictional brand. There is no factory, shop or real tins. Prices, opening hours, address and emails are samples;
> the emails use the reserved `.example` domain.

## Pages

| File | Content |
| --- | --- |
| `index.html` | Home: hero label, the season, the cuts with the six-tin box (the interactive part), the "from net to tin" process, the price list and the order coupon. |
| `tienda.html` | Full catalogue: 120 g tins, boxes of six, large tins, cured fish, spreads, shipping and payment. |
| `almadraba.html` | The season (calendar), how it is fished (drawn layout), the ronqueo (cutting) and the four almadrabas of Cádiz. |
| `sobre-nosotros.html` | History in five dates, the trades in the plant, what does not change and the place. |
| `contacto.html` | Address, opening hours, drawn map and the coupon. |
| `aviso-legal.html`, `privacidad.html`, `cookies.html` | Legal notices for a demo website. |
| `creditos.html` | Author and licence for every image, the video and the typeface. |
| `404.html` | Error page in the site's style. |

## Technology

- HTML, CSS and JavaScript with no dependencies and no build step. No third-party libraries.
- Hanken Grotesk typeface (SIL Open Font License 1.1, version 12, variable) served from `assets/fonts/`, with its `OFL.txt`.
- Analytics: Plausible from `analytics.danimefle.com`, cookieless.
- Keyboard accessible, with a "skip to content" link, a mobile menu that traps focus and closes with Escape, a
  "pause motion" button and `prefers-reduced-motion` support.
- Tested with Node.js 24.22.2 and Python 3.12.10 with Pillow 12.3.0 (only needed to rebuild).

## Run it locally

```bash
node server.js          # http://127.0.0.1:8080
node server.js 3000     # another port
```

`server.js` uses only native Node modules (version 22 or newer) and only listens on `127.0.0.1`. It never serves
hidden files or folders (`.git`…) and checks each file's real path. It serves extensionless routes like Cloudflare Pages,
uses `404.html` and applies the headers from `_headers`. Locally it drops HSTS and `upgrade-insecure-requests`, as
there is no HTTPS. You can also open `index.html` directly in the browser.

## Deploy to Cloudflare Pages

1. Create a Pages project connected to the repository, with no build command and the root as the output folder.
2. `_headers` applies the CSP, HSTS, `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
3. Pages redirects `/page.html` to `/page`: canonical URLs and `sitemap.xml` are already extensionless.
4. If the domain is not `atalayero.danimefle.com`, replace it in every file:
   `grep -rl "atalayero.danimefle.com" . | xargs sed -i "s/atalayero.danimefle.com/your-domain/g"`.

## Adapt it

- **Copy and pages:** pages are built with `python herramientas/generador/generar.py`. Edit the fragment in
  `herramientas/generador/paginas/` and build again. The head, bar, footer, coupon, catalogue and credits live in
  `generar.py` (Python 3.11 or later; Pillow only to rebuild the Open Graph images).
- **Prices:** only in `CATALOGO` in `generar.py`. The shop, the home price list and `assets/js/datos.js` come from it.
- **Colours and type:** tokens in `:root` of `assets/css/estilos.css` (`--bg`, `--surface`, `--ink`, `--muted`,
  `--fuente`).
- **Images:** in `assets/img/`, as WebP. If you change one, update `CREDITOS` in `generar.py` and `CREDITOS.md`.
- **For a real business:** remove `<meta name="robots" content="noindex, follow">` from the head in `generar.py`,
  replace the `.example` emails, connect the coupon to a form service and add its domain to `form-action` and
  `connect-src` in `_headers`.

## Credits and licences

- Code: MIT licence (see `LICENSE`). Notices on what it does not cover (images, typeface and brand) are in [`NOTICE.md`](NOTICE.md).
- Photographs, nautical chart and video: Wikimedia Commons, under CC BY-SA 4.0, CC0, CC BY 2.5 and public domain.
  Details in `CREDITOS.md` and `creditos.html`.
- Typeface: Hanken Grotesk, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`). Not covered by the MIT licence.
