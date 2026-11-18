# -*- coding: utf-8 -*-
"""
generar.py · Conservas Atalayero
Genera las páginas HTML estáticas de la web a partir de los fragmentos de ./paginas, con la misma
cabecera <head>, barra de navegación, pie y cupón en todas. También escribe assets/js/datos.js
(precios en un solo sitio), las imágenes Open Graph, robots.txt, sitemap.xml, site.webmanifest y _headers.
Builds the static HTML pages from the fragments in ./paginas, with the same <head>, navigation bar,
footer and coupon on every page. It also writes assets/js/datos.js (prices in one place), the Open
Graph images, robots.txt, sitemap.xml, site.webmanifest and _headers.

Uso / Usage:  python generar.py   (desde cualquier carpeta / from any folder)
Necesita / Needs: Python 3.10+ y Pillow (solo para las imágenes OG / only for the OG images).
"""
import html
import json
from pathlib import Path

# ===== Rutas y constantes / Paths and constants =====
AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent                     # la carpeta publicable / the publishable folder
BASE = "https://atalayero.danimefle.com"       # URL base: solo en etiquetas, nunca en enlaces internos
DOMINIO_PLAUSIBLE = "atalayero.danimefle.com"
CORREO_PEDIDOS = "pedidos@atalayero.example"
CORREO_HOLA = "hola@atalayero.example"

# ===== Catálogo: única fuente de precios / Catalogue: the single source of prices =====
# Cada producto: id, letra de la tapa, nombre, peso, precio (euros) y descripción.
# Each product: id, lid letter, name, weight, price (euros) and description.
CATALOGO = {
    "latas": [
        ("ventresca", "V", "Ventresca en aceite de oliva", "120 g", 14.90, "La barriga del atún, la parte más grasa. Se abre en láminas que se deshacen."),
        ("tarantelo", "T", "Tarantelo en aceite de oliva", "120 g", 11.50, "La pieza en triángulo entre la ventresca y la cola. Grasa media y fibra fina."),
        ("morrillo", "M", "Morrillo en aceite de oliva", "120 g", 9.80, "La carne que cubre la nuca. Jugosa, oscura y con mucho sabor a mar."),
        ("lomo-blanco", "B", "Lomo blanco en aceite de oliva", "120 g", 9.20, "El lomo bajo, sobre la barriga. Tierno y con algo de grasa."),
        ("lomo-alto", "A", "Lomo alto en aceite de oliva", "120 g", 8.60, "El lomo negro de la espalda. Magro y firme, para ensalada."),
    ],
    "cajas": [
        ("caja-casa", "6", "Caja de la casa", "6 latas de 120 g", 62.00, "Dos de ventresca, dos de tarantelo y dos de morrillo."),
        ("caja-lomos", "6", "Caja de lomos", "6 latas de 120 g", 49.00, "Tres de lomo alto y tres de lomo blanco."),
        ("caja-ventresca", "6", "Caja de ventresca", "6 latas de 120 g", 84.00, "Seis latas de ventresca, para quien ya sabe lo que quiere."),
    ],
    "grandes": [
        ("grande-lomo", "A", "Lomo alto, lata grande", "900 g", 52.00, "Para casas con mucha gente o para cocinar con él."),
        ("grande-ventresca", "V", "Ventresca, lata grande", "500 g", 58.00, "La misma ventresca en lata de medio kilo."),
        ("grande-migas", "L", "Migas de lomo para ensalada", "900 g", 34.00, "Los trozos que quedan al cortar los lomos, en aceite."),
    ],
    "salazones": [
        ("mojama", "J", "Mojama de lomo", "100 g", 12.40, "Lomo curado con sal y secado al aire de levante. En lonchas finas."),
        ("huevas", "H", "Huevas de atún curadas", "100 g", 10.90, "Huevas prensadas y curadas en sal. Se cortan muy finas."),
        ("manteca", "C", "Lomo en manteca colorada", "180 g", 11.20, "Lomo cocido en manteca con pimentón, a la manera antigua."),
    ],
    "untables": [
        ("pate-lomo", "P", "Paté de lomo con aceite", "100 g", 4.90, "Lomo machacado con su aceite. Para pan tostado."),
        ("crema-morrillo", "P", "Crema de morrillo con pimentón", "100 g", 5.60, "Morrillo con pimentón de la Vera, suave."),
    ],
}
# Textos largos de las piezas para la cosa viva / Long texts for the live thing
TEXTOS_PIEZA = {
    "ventresca": "La barriga del atún, la parte más grasa. Se abre en láminas que se deshacen; pan, tomate y nada más.",
    "tarantelo": "La pieza en triángulo entre la ventresca y la cola. Grasa media y fibra fina: la que guardamos para nuestra mesa.",
    "morrillo": "La carne que cubre la nuca, por encima de la cabeza. Jugosa, oscura y con más sabor a mar que ninguna.",
    "lomo-alto": "El lomo negro de la espalda. Magro y firme; para ensalada o para comerlo de pie con la lata abierta.",
    "lomo-blanco": "El lomo bajo, encima de la barriga. Más tierno que el alto y con algo de grasa de la ventresca vecina.",
}
NOMBRE_CORTO = {"ventresca": "Ventresca", "tarantelo": "Tarantelo", "morrillo": "Morrillo", "lomo-alto": "Lomo alto", "lomo-blanco": "Lomo blanco"}

# ===== Páginas: nombre, ruta limpia, título, descripción, imagen OG =====
# ===== Pages: name, clean path, title, description, OG image =====
PAGINAS = [
    ("index", "/", "Conservas Atalayero · Atún rojo de almadraba en lata, Zahara de los Atunes",
     "Conservera familiar de atún rojo de almadraba en Zahara de los Atunes. Ventresca, tarantelo, morrillo y lomos en aceite de oliva, de una sola temporada. Monta tu caja de seis latas.", "heroe-barcos-barbate"),
    ("tienda", "/tienda", "La tienda · Conservas Atalayero",
     "Latas de ventresca, tarantelo, morrillo y lomos de atún rojo de almadraba, cajas de seis, latas grandes, mojama y untables, con su peso y su precio.", "azulejo-almadraba"),
    ("almadraba", "/almadraba", "La almadraba · Conservas Atalayero",
     "Cómo se pesca el atún rojo con la almadraba en la costa de Cádiz: la temporada de mayo y junio, la levantá en el copo y el ronqueo, el despiece pieza a pieza.", "heroe-anclas-almadraba"),
    ("sobre-nosotros", "/sobre-nosotros", "Sobre nosotros · Conservas Atalayero",
     "La historia de una conservera familiar de Zahara de los Atunes desde 1934: de la torre de vigía a la lata, quién hace cada lata y lo que no cambiamos.", "heroe-castillo-zahara"),
    ("contacto", "/contacto", "Contacto · Conservas Atalayero",
     "Dirección, horario de la tienda de la fábrica en Zahara de los Atunes y el cupón para pedir tu caja de latas de atún de almadraba.", "carta-estrecho-1938"),
    ("aviso-legal", "/aviso-legal", "Aviso legal · Conservas Atalayero",
     "Aviso legal de la web de demostración de Conservas Atalayero, una marca ficticia publicada por Daniel Castaños Mefle.", "heroe-tejados-zahara"),
    ("privacidad", "/privacidad", "Privacidad · Conservas Atalayero",
     "Qué pasa con tus datos en esta web de demostración: el cupón solo abre tu correo y la analítica, Plausible, no usa cookies ni guarda tu IP.", "heroe-tejados-zahara"),
    ("cookies", "/cookies", "Cookies · Conservas Atalayero",
     "Esta web no usa cookies ni almacenamiento local. La analítica, Plausible, funciona sin cookies.", "heroe-tejados-zahara"),
    ("creditos", "/creditos", "Créditos · Conservas Atalayero",
     "Autores y licencias de las fotografías, la carta náutica, el vídeo y la tipografía de la web de Conservas Atalayero.", "mercado-atun-1909"),
    ("404", None, "Página no encontrada · Conservas Atalayero",
     "Esta página no existe. Vuelve a la portada o a la tienda de Conservas Atalayero.", "heroe-tejados-zahara"),
]
# Enlaces de la barra / Bar links
NAV = [("tienda", "Tienda"), ("almadraba", "La almadraba"), ("sobre-nosotros", "Sobre nosotros"), ("contacto", "Contacto")]

# ===== Créditos: cada imagen con su autor y licencia / Credits: each picture with author and licence =====
CREDITOS = [
    ("heroe-barcos-barbate.webp", "Barbate, barcos de almadraba de atún", "PEPE GADEIRAS", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.es", "https://commons.wikimedia.org/wiki/File:Barbate,_barcos_de_almadraba_de_at%C3%BAn.jpg", "Recorte vertical y reducción"),
    ("heroe-anclas-almadraba.webp", "Anclas de la Almadraba de atunes", "PEPE GADEIRAS", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.es", "https://commons.wikimedia.org/wiki/File:Anclas_de_la_Almadraba_de_atunes.jpg", "Recorte y reducción"),
    ("heroe-castillo-zahara.webp", "Castillo de las Almadrabas, in Zahara de los Atunes - P1140225", "El Pantera", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.es", "https://commons.wikimedia.org/wiki/File:Castillo_de_las_Almadrabas,_in_Zahara_de_los_Atunes_-_P1140225.jpg", "Recorte y reducción"),
    ("heroe-tejados-zahara.webp", "Tejados del Castillo de Zahara de los Atunes, Cádiz", "Lucía", "CC0", "https://creativecommons.org/publicdomain/zero/1.0/deed.es", "https://commons.wikimedia.org/wiki/File:Tejados_del_Castillo_de_Zahara_de_los_Atunes,_C%C3%A1diz.jpg", "Recorte cuadrado y reducción"),
    ("azulejo-almadraba.webp", "Almadraba en azulejo", "Luistxo", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.es", "https://commons.wikimedia.org/wiki/File:Almadraba_en_azulejo.jpg", "Recorte al panel de azulejos"),
    ("puerto-barbate.webp", "Puerto Barbate-P1610311", "El Pantera", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/deed.es", "https://commons.wikimedia.org/wiki/File:Puerto_Barbate-P1610311.jpg", "Reducción"),
    ("mercado-atun-1909.webp", "The Fish Market - Cutting up Tunny (Madeira: Old and New, 1909)", "W. H. Koebel", "Dominio público", "", "https://commons.wikimedia.org/wiki/File:The_Fish_Market_-_Cutting_up_Tunny,_MON_1909.jpg", "Duotono cobalto y arena"),
    ("atunes-1949.webp", "Tuna fish SLNSW FL9312762 (1949, State Library of New South Wales)", "R. Home", "Dominio público", "", "https://commons.wikimedia.org/wiki/File:Tuna_fish_SLNSW_FL9312762.jpg", "Duotono cobalto y arena"),
    ("carta-estrecho-1938.webp", "Admiralty Chart No 142 Strait of Gibraltar, Published 1938", "United Kingdom Hydrographic Office", "Dominio público", "", "https://commons.wikimedia.org/wiki/File:Admiralty_Chart_No_142_Strait_of_Gibraltar,_Published_1938.jpg", "Duotono cobalto y arena"),
    ("atun-dibujo-1914.webp", "Thunnus thynnus drawing (1914)", "Autor desconocido", "Dominio público", "", "https://commons.wikimedia.org/wiki/File:Thunnus_thynnus_drawing.jpg", "Duotono cobalto y arena"),
    ("atunes-red.webm", "Spawning Behaviour and Post-Spawning Migration Patterns of Atlantic Bluefin Tuna (vídeo, PLOS ONE 2013)", "Aranda G., Abascal F., Varela J. y Medina A.", "CC BY 2.5", "https://creativecommons.org/licenses/by/2.5/deed.es", "https://commons.wikimedia.org/wiki/File:Spawning-Behaviour-and-Post-Spawning-Migration-Patterns-of-Atlantic-Bluefin-Tuna-(Thunnus-thynnus)-pone.0076445.s001.ogv", "Versión WebM de 480p y póster del segundo 8"),
]

# ===== Piezas de marcado compartidas / Shared markup pieces =====
TORRE_SVG = ('<svg viewBox="0 0 40 64" aria-hidden="true" focusable="false"><rect x="12" y="0" width="16" height="8"/>'
             '<rect x="4" y="12" width="32" height="10"/><rect x="8" y="26" width="24" height="38"/>'
             '<rect x="16" y="40" width="8" height="12" class="hueco"/></svg>')
# 100 barras: llega al borde incluso a 2560 px (el sobrante se recorta) / 100 bars: reaches the edge even at 2560px (the rest is clipped)
FRANJA = "".join(f'<i style="--n:{min(k, 43)}"></i>' for k in range(100))


def euros(n: float) -> str:
    """Formato español de euros / Spanish euro format."""
    return f"{n:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def enlace(p: str, raiz: str) -> str:
    """Enlace interno relativo (o absoluto desde la raíz en la 404) / Internal link (root-absolute on the 404)."""
    if raiz:
        return "/" if p == "index" else f"/{p}"
    return "index.html" if p == "index" else f"{p}.html"


def cabeza(nombre, ruta, titulo, descripcion, og, raiz):
    """<head> completo de una página / Full <head> of a page."""
    r = raiz
    canon = f'\n  <link rel="canonical" href="{BASE}{ruta}">' if ruta else ""
    url_og = f'\n  <meta property="og:url" content="{BASE}{ruta}">' if ruta else ""
    jsonld = json.dumps({"@context": "https://schema.org", "@type": "WebSite", "name": "Conservas Atalayero",
                         "url": f"{BASE}/", "inLanguage": "es",
                         "description": "Web de demostración de una conservera ficticia de atún de almadraba."}, ensure_ascii=False)
    return f"""<!doctype html>
<!--
  Conservas Atalayero · {html.escape(titulo.split(' · ')[0])}
  Página generada con herramientas/generador/generar.py: edita el fragmento y vuelve a generar.
  Page built by herramientas/generador/generar.py: edit the fragment and build again.
  Marca ficticia. Web de demostración de danimefle.com. / Fictional brand. Demo site by danimefle.com.
-->
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(titulo)}</title>
  <meta name="description" content="{html.escape(descripcion)}">
  <!-- Negocio ficticio: que no salga en buscadores / Fictional business: keep it out of search engines -->
  <meta name="robots" content="noindex, follow">{canon}
  <meta name="theme-color" content="#062b8a">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Conservas Atalayero">
  <meta property="og:title" content="{html.escape(titulo)}">
  <meta property="og:description" content="{html.escape(descripcion)}">{url_og}
  <meta property="og:image" content="{BASE}/assets/og/{nombre}.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(titulo)}">
  <meta name="twitter:description" content="{html.escape(descripcion)}">
  <meta name="twitter:image" content="{BASE}/assets/og/{nombre}.jpg">
  <!-- Favicon y manifiesto / Favicon and manifest -->
  <link rel="icon" href="{r}assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="{r}assets/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="{r}assets/apple-touch-icon.png">
  <link rel="manifest" href="{r}site.webmanifest">
  <link rel="preload" href="{r}assets/fonts/HankenGrotesk-v12-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{r}assets/css/estilos.css">
  <link rel="stylesheet" href="{r}assets/css/paginas.css">
  <!-- Scripts propios en ficheros (la CSP no permite código en línea) / Own scripts in files (the CSP blocks inline code) -->
  <script src="{r}assets/js/arranque.js"></script>
  <script src="{r}assets/js/datos.js" defer></script>
  <script src="{r}assets/js/principal.js" defer></script>
  <!-- Analítica sin cookies / Cookieless analytics -->
  <script defer data-domain="{DOMINIO_PLAUSIBLE}" src="https://analytics.danimefle.com/js/script.js"></script>
  <!-- Datos estructurados: solo WebSite / Structured data: WebSite only -->
  <script type="application/ld+json">{jsonld}</script>
</head>"""


def barra(nombre, raiz):
    """Barra de navegación con menú móvil y botón de pausa / Navigation bar with mobile menu and pause button."""
    items = []
    for p, texto in NAV:
        actual = ' aria-current="page"' if p == nombre else ""
        items.append(f'        <a href="{enlace(p, raiz)}"{actual}>{texto}</a>')
    caja = enlace("index", raiz) + ("#despiece" if not raiz else "#despiece")
    return f"""  <!-- ============ BARRA DE NAVEGACIÓN ============ -->
  <!-- ============ NAVIGATION BAR ============ -->
  <header class="barra sobre-tinta" id="arriba">
    <a class="barra-marca" href="{enlace('index', raiz)}" aria-label="Conservas Atalayero, portada">{TORRE_SVG}<span>Atalayero</span></a>
    <!-- El botón solo aparece cuando el script pliega el menú; sin JS los enlaces se ven siempre -->
    <!-- The button only shows once the script folds the menu; without JS the links are always visible -->
    <button type="button" class="menu-boton" data-menu aria-expanded="false" aria-controls="menu-principal" hidden>Menú</button>
    <nav class="barra-enlaces" id="menu-principal" aria-label="Principal">
{chr(10).join(items)}
        <button type="button" class="pausa" data-pausa aria-pressed="false" hidden>Pausar movimiento</button>
        <a class="barra-accion" href="{caja}">Montar mi caja</a>
    </nav>
  </header>"""


def pie(raiz):
    """Pie común: marca en bloques, enlaces, legales y aviso de demo / Shared footer: block mark, links, legal and demo notice."""
    e = lambda p: enlace(p, raiz)
    letras = [("A", "1"), ("t", ".78"), ("a", ".64"), ("l", ".92"), ("a", ".7"), ("y", ".86"), ("e", ".66"), ("r", ".8"), ("o", ".62")]
    bloques = "".join(f'<span style="--h:{h}"><b>{l}</b></span>' for l, h in letras)
    return f"""  <!-- ============ PIE: la marca construida en bloques ============ -->
  <!-- ============ FOOTER: the mark built from blocks ============ -->
  <footer class="pie">
    <div class="franja franja-fina" aria-hidden="true"></div>
    <h2 class="oculto">Conservas Atalayero</h2>
    <div class="bloques" role="img" aria-label="Atalayero" data-reveal>{bloques}</div>
    <div class="pie-columnas">
      <nav aria-label="Latas"><h3>Latas</h3><a href="{e('tienda')}">Ventresca</a><a href="{e('tienda')}">Tarantelo</a><a href="{e('tienda')}">Morrillo</a><a href="{e('tienda')}">Lomos</a></nav>
      <nav aria-label="Cajas"><h3>Cajas</h3><a href="{e('tienda')}#t-cajas">De la casa</a><a href="{e('tienda')}#t-cajas">De lomos</a><a href="{e('tienda')}#t-cajas">De ventresca</a><a href="{e('index')}#despiece">La tuya</a></nav>
      <nav aria-label="La casa"><h3>La casa</h3><a href="{e('almadraba')}">La almadraba</a><a href="{e('sobre-nosotros')}">Sobre nosotros</a><a href="{e('almadraba')}#t-temporada">La temporada</a></nav>
      <nav aria-label="Pedidos"><h3>Pedidos</h3><a href="{e('contacto')}#cupon">El cupón</a><a href="{e('contacto')}">Contacto</a><a href="{e('tienda')}#t-envios">Envíos</a></nav>
      <address class="pie-direccion">
        <p>Fábrica y tienda<br>Calle de los Corcheros, 5<br>11393 Zahara de los Atunes (Barbate), Cádiz</p>
        <p>Tienda abierta de abril a octubre, de 10 a 14 h<br><a href="mailto:{CORREO_HOLA}">{CORREO_HOLA}</a></p>
      </address>
    </div>
    <nav class="pie-legal" aria-label="Legal">
      <a href="{e('aviso-legal')}">Aviso legal</a><a href="{e('privacidad')}">Privacidad</a><a href="{e('cookies')}">Cookies</a><a href="{e('creditos')}">Créditos de imágenes</a>
    </nav>
    <p class="pie-demo">Marca ficticia. Web de demostración de <a href="https://danimefle.com">danimefle.com</a>.</p>
    <div class="pie-final">
      <p>© 2026 Conservas Atalayero</p>
      <a class="boton-mini" href="#arriba">Volver arriba</a>
    </div>
    <p class="creditos">Fotografías, carta náutica y vídeo de PEPE GADEIRAS, El Pantera, Lucía y Luistxo (Wikimedia Commons, CC BY-SA 4.0 y CC0), W. H. Koebel, R. Home y el Almirantazgo británico (dominio público) y Aranda, Abascal, Varela y Medina (CC BY 2.5). Detalle en <a href="{e('creditos')}">créditos</a>.</p>
  </footer>"""


def cupon():
    """Sección del cupón con etiquetas visibles y errores asociados / Coupon section with visible labels and linked errors."""
    return f"""    <!-- ============ CUPÓN: el formulario para recortar ============ -->
    <!-- ============ COUPON: the cut-out order form ============ -->
    <section class="cupon-seccion" id="cupon" aria-labelledby="t-cupon">
      <img class="carta" src="assets/img/carta-estrecho-1938.webp" width="1920" height="1319" alt="Carta náutica del Estrecho de Gibraltar de 1938, con la costa de Cádiz y la de Marruecos" loading="lazy" decoding="async">
      <form class="cupon sobre-tinta" novalidate data-cupon data-reveal>
        <div class="cupon-izq">
          <h2 id="t-cupon">Recorta y pide <span class="nl">tu caja</span></h2>
          <p class="cupon-caja" data-cupon-caja>Caja de la casa: 2 ventresca, 2 tarantelo y 2 morrillo.</p>
          <p class="cupon-frase">En una tienda real, el pedido se cerraría por correo: total, fecha de envío y pago por transferencia o al recibir la caja.</p>
          <p class="cupon-correo">También puedes escribir a <a href="mailto:{CORREO_PEDIDOS}">{CORREO_PEDIDOS}</a>.</p>
          <input type="hidden" value="Caja de la casa" data-cupon-campo>
        </div>
        <div class="cupon-der">
          <label for="c-nombre">Nombre</label>
          <input id="c-nombre" type="text" autocomplete="name" required aria-describedby="e-c-nombre">
          <p class="campo-error" id="e-c-nombre" hidden></p>
          <label for="c-correo">Correo</label>
          <input id="c-correo" type="email" autocomplete="email" required aria-describedby="e-c-correo">
          <p class="campo-error" id="e-c-correo" hidden></p>
          <label for="c-cp">Código postal</label>
          <input id="c-cp" data-campo="codigo_postal" type="text" inputmode="numeric" autocomplete="postal-code" required aria-describedby="e-c-cp">
          <p class="campo-error" id="e-c-cp" hidden></p>
          <label for="c-comentario">Comentario (opcional)</label>
          <input id="c-comentario" type="text">
          <!-- Desactivado hasta que el script instala su manejador: sin JS no se envía nada -->
          <!-- Disabled until the script installs its handler: without JS nothing is sent -->
          <button type="submit" class="cupon-enviar" disabled data-cupon-enviar>Enviar el cupón</button>
          <noscript><p class="cupon-noscript">El cupón necesita JavaScript para abrir tu correo. Sin él, escribe a <a href="mailto:{CORREO_PEDIDOS}">{CORREO_PEDIDOS}</a>.</p></noscript>
          <p class="cupon-estado" role="status" aria-live="polite" data-cupon-estado></p>
        </div>
      </form>
    </section>"""


def productos(grupo):
    """Filas de producto de un estante / Product rows of a shelf."""
    filas = []
    for pid, letra, nombre, peso, precio, texto in CATALOGO[grupo]:
        filas.append(f"""          <article class="producto" data-reveal>
            <span class="producto-tapa" aria-hidden="true">{letra}</span>
            <div><h3>{nombre}</h3><p>{texto}</p></div>
            <div class="producto-lado">
              <span class="producto-peso">{peso}</span>
              <span class="producto-precio">{euros(precio)}</span>
              <a class="producto-pedir" href="contacto.html?pedido={pid}#cupon" aria-label="Pedir {nombre.lower()} con el cupón">Pedir</a>
            </div>
          </article>""")
    return "\n".join(filas)


def tarifa():
    """Barras desplegables de la tarifa de la portada / Folding bars of the home price list."""
    grupos = [("Latas sueltas de 120 g", "latas"), ("Cajas de seis latas", "cajas"), ("Latas grandes para cocina", "grandes"),
              ("Mojama y salazones", "salazones"), ("Untables", "untables")]
    trozos = []
    for i, (titulo, g) in enumerate(grupos):
        filas = "\n".join(f'              <li><span>{n}{", " + p if g in ("grandes", "salazones", "untables") else ""}</span><b>{euros(pr)}</b></li>'
                          for _, _, n, p, pr, _ in CATALOGO[g])
        abierto = " open" if i == 0 else ""
        trozos.append(f"""          <details{abierto} data-reveal style="--i:{i}">
            <summary>{titulo}</summary>
            <ul class="precios">
{filas}
            </ul>
          </details>""")
    trozos.append("""          <details data-reveal style="--i:5">
            <summary>Envíos</summary>
            <ul class="precios">
              <li><span>Península, a partir de una caja</span><b>gratis</b></li>
              <li><span>Península, latas sueltas</span><b>5,90 €</b></li>
              <li><span>Baleares</span><b>8,50 €</b></li>
              <li><span>Plazo de entrega</span><b>48 a 72 h</b></li>
            </ul>
          </details>
          <details data-reveal style="--i:6">
            <summary>Temporada en venta</summary>
            <ul class="precios">
              <li><span>Latas de la levantá de mayo de 2025</span><b>a la venta</b></li>
              <li><span>Latas de la levantá de mayo de 2026</span><b>abril de 2027</b></li>
              <li><span>Tienda de la fábrica</span><b>abril a octubre</b></li>
            </ul>
          </details>""")
    return "\n".join(trozos)


def pez_grande():
    """Atún grande con las piezas rotuladas (página de la almadraba) / Large tuna with labelled cuts (almadraba page)."""
    return """          <svg viewBox="0 0 900 400" role="img" aria-labelledby="pez-t pez-d">
            <title id="pez-t">Despiece del atún rojo</title>
            <desc id="pez-d">Atún de perfil con la cabeza a la izquierda. El morrillo está sobre la nuca, el lomo alto recorre la espalda, el lomo blanco va por encima de la barriga, la ventresca es la barriga delantera y el tarantelo la parte de la barriga cercana a la cola.</desc>
            <defs><clipPath id="pez-clip"><path d="M28 125 C70 78 150 56 240 54 C330 52 410 74 470 108 L516 116 L516 132 L470 138 C410 176 320 196 240 194 C150 192 70 170 28 125 Z"/></clipPath></defs>
            <g transform="translate(90 70) scale(1.2)">
              <path fill="#062b8a" d="M200 58 L232 20 L268 56 Z M332 62 L352 30 L368 66 Z M336 186 L354 214 L368 180 Z M512 116 L584 40 L556 124 L584 208 L512 132 Z"/>
              <g clip-path="url(#pez-clip)" stroke="#e6dbc7" stroke-width="5">
                <path fill="#062b8a" d="M0 0 H124 Q100 125 124 250 H0 Z"/>
                <path fill="#062b8a" d="M455 0 H600 V250 H455 Z"/>
                <path fill="#3a5aa8" d="M124 0 H222 V106 H110 Q104 50 124 0 Z"/>
                <path fill="#062b8a" d="M222 0 H455 V118 H222 Z"/>
                <path fill="#3a5aa8" d="M110 106 H222 V118 H455 V136 L300 152 H112 Q108 128 110 106 Z"/>
                <path fill="#062b8a" d="M112 152 H300 V250 H124 Q106 200 112 152 Z"/>
                <path fill="#3a5aa8" d="M300 152 L455 136 V250 H300 Z"/>
              </g>
              <circle cx="68" cy="112" r="9" fill="#e6dbc7"/><circle cx="70" cy="112" r="4" fill="#062b8a"/>
            </g>
            <text x="222" y="40">Morrillo</text>
            <text x="440" y="40">Lomo alto</text>
            <text x="380" y="232" style="fill:#e6dbc7">Lomo blanco</text>
            <text x="230" y="380">Ventresca</text>
            <text x="520" y="380">Tarantelo</text>
            <text x="20" y="250">Cabeza</text>
            <text x="800" y="250">Cola</text>
          </svg>"""


def creditos_tabla():
    """Tabla de créditos de imágenes / Picture credits table."""
    filas = []
    for fich, obra, autor, lic, lic_url, fuente, cambios in CREDITOS:
        lic_html = f'<a href="{lic_url}">{lic}</a>' if lic_url else lic
        filas.append(f'            <tr><td><a href="{fuente}">{html.escape(obra)}</a></td><td>{html.escape(autor)}</td><td>{lic_html}</td><td>{cambios}</td></tr>')
    return "\n".join(filas)


def pagina_creditos():
    """Fragmento de la página de créditos / Credits page fragment."""
    return f"""    <!-- ============ CABECERA CRÉDITOS ============ -->
    <!-- ============ CREDITS HEADER ============ -->
    <section class="cabecera cabecera-sola sobre-tinta" aria-labelledby="t-pagina">
      <div class="cabecera-etiqueta">
        <div class="franja" aria-hidden="true">{FRANJA}</div>
        <div class="cabecera-texto">
          <h1 id="t-pagina">Créditos</h1>
          <p class="cabecera-entrada">Las fotografías muestran el mundo de la almadraba, no productos de la marca, que es ficticia. Estos son sus autores.</p>
        </div>
      </div>
    </section>

    <!-- ============ LISTA DE CRÉDITOS ============ -->
    <!-- ============ CREDITS LIST ============ -->
    <div class="hoja">
      <nav class="hoja-indice" aria-labelledby="t-indice">
        <h2 id="t-indice">En esta página</h2>
        <a href="#imagenes">Fotografías, carta y vídeo</a>
        <a href="#dibujos">Dibujos</a>
        <a href="#tipografia">Tipografía</a>
        <a href="#codigo">Código</a>
      </nav>
      <div class="hoja-texto">
        <h2 id="imagenes">Fotografías, carta y vídeo</h2>
        <p>Todo procede de Wikimedia Commons. Las obras con licencia CC BY-SA que se han recortado se comparten con la misma licencia.</p>
        <table class="tabla-creditos">
          <thead><tr><th scope="col">Obra</th><th scope="col">Autor</th><th scope="col">Licencia</th><th scope="col">Cambios</th></tr></thead>
          <tbody>
{creditos_tabla()}
          </tbody>
        </table>

        <h2 id="dibujos">Dibujos</h2>
        <p>La tapa de la lata con el atún por piezas, el esquema de la almadraba, el plano de la costa, la torre de la marca y las etiquetas a rayas están dibujados para esta web. El reparto de las piezas del atún es aproximado.</p>

        <h2 id="tipografia">Tipografía</h2>
        <p>Hanken Grotesk, de Alfredo Marco Pradil y Hanken Design Co., con la <a href="https://openfontlicense.org">SIL Open Font License 1.1</a>. La licencia completa va junto a la fuente, en <code>assets/fonts/OFL.txt</code>.</p>

        <h2 id="codigo">Código</h2>
        <p>El código de la web se publica con licencia MIT. La marca, los textos y los nombres son ficticios.</p>
      </div>
    </div>"""


def datos_js():
    """Escribe assets/js/datos.js con las piezas y los productos / Writes assets/js/datos.js with cuts and products."""
    piezas = {pid: {"nombre": NOMBRE_CORTO[pid], "letra": l, "precio": pr, "texto": TEXTOS_PIEZA[pid]}
              for pid, l, _, _, pr, _ in CATALOGO["latas"]}
    productos_txt = {pid: f"{n}, {p}, {euros(pr)}" for g in CATALOGO.values() for pid, _, n, p, pr, _ in g}
    datos = {"correo": CORREO_PEDIDOS, "piezas": piezas, "productos": productos_txt}
    (RAIZ / "assets/js/datos.js").write_text(
        "/*\n  datos.js · Conservas Atalayero\n  Datos de las latas y precios (generado por herramientas/generador/generar.py; no editar a mano).\n"
        "  Tin data and prices (generated by herramientas/generador/generar.py; do not edit by hand).\n*/\n"
        "window.ATALAYERO = " + json.dumps(datos, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")


def imagenes_og():
    """Imágenes Open Graph 1200×630: foto recortada con la franja y la torre / OG images: cropped photo with the stripe and tower."""
    from PIL import Image, ImageDraw
    destino = RAIZ / "assets/og"; destino.mkdir(exist_ok=True)
    tinta, papel = (6, 43, 138), (230, 219, 199)
    for nombre, _, _, _, img in PAGINAS:
        origen = RAIZ / "assets/img" / f"{img}.webp"
        im = Image.open(origen).convert("RGB")
        escala = max(1200 / im.width, 630 / im.height)
        im = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
        x, y = (im.width - 1200) // 2, (im.height - 630) // 2
        im = im.crop((x, y, x + 1200, y + 630))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 1199, 47], fill=papel)
        for k in range(0, 1200, 48):
            d.rectangle([k, 0, k + 23, 47], fill=tinta)
        d.rectangle([40, 470, 200, 630], fill=papel)
        s = 2
        for rx, ry, rw, rh in [(12, 0, 16, 8), (4, 12, 32, 10), (8, 26, 24, 38)]:
            d.rectangle([80 + rx * s, 488 + ry * s, 80 + (rx + rw) * s, 488 + (ry + rh) * s], fill=tinta)
        d.rectangle([80 + 16 * s, 488 + 40 * s, 80 + 24 * s, 488 + 52 * s], fill=papel)
        im.save(destino / f"{nombre}.jpg", "JPEG", quality=80, optimize=True)


def ficheros_tecnicos():
    """robots.txt, sitemap.xml, site.webmanifest y _headers / Technical files."""
    (RAIZ / "robots.txt").write_text(
        "# Web de demostración de una marca ficticia / Demo site of a fictional brand\n"
        "User-agent: *\nAllow: /\n\nSitemap: " + BASE + "/sitemap.xml\n", encoding="utf-8")
    urls = "\n".join(f"  <url><loc>{BASE}{ruta}</loc><lastmod>2026-11-18</lastmod></url>"
                     for _, ruta, _, _, _ in PAGINAS if ruta)
    (RAIZ / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Mapa del sitio / Sitemap -->\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n", encoding="utf-8")
    (RAIZ / "site.webmanifest").write_text(json.dumps({
        "name": "Conservas Atalayero", "short_name": "Atalayero", "lang": "es", "start_url": "/",
        "display": "browser", "background_color": "#e6dbc7", "theme_color": "#062b8a",
        "icons": [{"src": "/assets/favicon.svg", "type": "image/svg+xml", "sizes": "any"},
                  {"src": "/assets/apple-touch-icon.png", "type": "image/png", "sizes": "180x180"},
                  {"src": "/assets/favicon-32.png", "type": "image/png", "sizes": "32x32"}]},
        ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (RAIZ / "_headers").write_text(
        "# Cabeceras de Cloudflare Pages / Cloudflare Pages headers\n"
        "/*\n"
        "  Content-Security-Policy: default-src 'self'; script-src 'self' https://analytics.danimefle.com; "
        "style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; media-src 'self'; "
        "connect-src 'self' https://analytics.danimefle.com; frame-ancestors 'self' https://danimefle.com; "
        "base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests\n"
        "  Strict-Transport-Security: max-age=31536000; includeSubDomains\n"
        "  X-Content-Type-Options: nosniff\n"
        "  Referrer-Policy: strict-origin-when-cross-origin\n"
        "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()\n"
        "\n# Caché larga para fuentes e imágenes / Long cache for fonts and images\n"
        "/assets/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n"
        "/assets/img/*\n  Cache-Control: public, max-age=2592000\n", encoding="utf-8")


def construir():
    """Escribe todas las páginas / Writes every page."""
    datos_js()
    for nombre, ruta, titulo, descripcion, og in PAGINAS:
        raiz = "/" if nombre == "404" else ""
        if nombre == "creditos":
            cuerpo = pagina_creditos()
        else:
            cuerpo = (AQUI / "paginas" / f"{nombre}.html").read_text(encoding="utf-8")
        cuerpo = (cuerpo.replace("{{FRANJA}}", FRANJA).replace("{{CUPON}}", cupon())
                  .replace("{{TARIFA}}", tarifa()).replace("{{PEZ_GRANDE}}", pez_grande()))
        for g in CATALOGO:
            cuerpo = cuerpo.replace("{{PRODUCTOS:" + g + "}}", productos(g))
        if raiz:
            cuerpo = cuerpo.replace('src="assets/', 'src="/assets/')
        doc = (cabeza(nombre, ruta, titulo, descripcion, nombre, raiz) + "\n<body>\n"
               '  <a class="saltar" href="#contenido">Saltar al contenido</a>\n'
               + barra(nombre, raiz) + '\n\n  <main id="contenido">\n' + cuerpo.rstrip() + "\n  </main>\n\n"
               + pie(raiz) + "\n</body>\n</html>\n")
        (RAIZ / f"{nombre}.html").write_text(doc, encoding="utf-8")
    imagenes_og()
    ficheros_tecnicos()
    print("Generadas", len(PAGINAS), "páginas en", RAIZ)


if __name__ == "__main__":
    construir()
