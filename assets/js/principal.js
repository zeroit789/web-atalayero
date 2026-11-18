/*
  principal.js · Conservas Atalayero
  Comportamiento de toda la web: menú móvil accesible, botón de pausa del movimiento, fundido
  lento de las fotos del héroe, vídeos en bucle, entradas escalonadas, el despiece del atún con la
  caja de seis latas y el cupón (valida, avisa de errores y abre el correo con el pedido escrito).
  Behaviour of the whole site: accessible mobile menu, motion pause button, slow crossfade of the
  hero photos, looping videos, staggered entrances, the tuna cuts with the six-tin box, and the
  coupon (validates, reports errors and opens the email app with the order written out).
  Los datos de las latas vienen de datos.js / Tin data comes from datos.js.
*/
(function () {
  'use strict';

  // Preferencia de movimiento reducido del visitante
  // The visitor's reduced-motion preference
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Con movimiento reducido todo empieza parado; el botón «Reanudar» lo pone en marcha de verdad.
  // With reduced motion everything starts paused; the "Resume" button really starts it.
  var pausado = reducir;
  var DATOS = window.ATALAYERO || { piezas: {}, productos: {}, correo: 'pedidos@atalayero.example' };
  var tieneProp = function (obj, clave) { return !!obj && Object.prototype.hasOwnProperty.call(obj, clave); };

  /* ===== 1. Menú móvil: plegado solo con JS, resto de la página inerte, Escape y foco de vuelta =====
     ===== 1. Mobile menu: folded only with JS, rest of the page inert, Escape and focus return ===== */
  function iniciarMenu() {
    var barra = document.querySelector('.barra');
    var boton = document.querySelector('[data-menu]');
    var panel = document.getElementById('menu-principal');
    if (!barra || !boton || !panel) return;
    var movil = window.matchMedia('(max-width: 960px)');
    // Lo que queda fuera de la barra se vuelve inerte con el menú abierto
    // Everything outside the bar becomes inert while the menu is open
    var fuera = [].slice.call(document.body.children).filter(function (el) { return el !== barra && el.tagName !== 'SCRIPT'; });
    function inerte(si) { fuera.forEach(function (el) { if (si) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
    function enfocables() { return [boton].concat([].slice.call(panel.querySelectorAll('a, button:not([hidden])'))); }
    function abrir() {
      barra.classList.add('abierta'); boton.setAttribute('aria-expanded', 'true'); boton.textContent = 'Cerrar';
      inerte(true);
      var primero = panel.querySelector('a, button:not([hidden])'); if (primero) primero.focus();
    }
    function cerrar(devolverFoco) {
      barra.classList.remove('abierta'); boton.setAttribute('aria-expanded', 'false'); boton.textContent = 'Menú';
      inerte(false);
      if (devolverFoco) boton.focus();
    }
    // A partir de aquí el menú se pliega en móvil / From here on the menu folds on mobile
    barra.classList.add('con-menu');
    boton.hidden = false;
    boton.addEventListener('click', function () { if (barra.classList.contains('abierta')) cerrar(true); else abrir(); });
    document.addEventListener('keydown', function (e) {
      if (!barra.classList.contains('abierta')) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrar(true); return; }
      // Ciclo del tabulador dentro del menú abierto / Tab cycle inside the open menu
      if (e.key === 'Tab') {
        var lista = enfocables(); var i = lista.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); lista[lista.length - 1].focus(); }
        else if (!e.shiftKey && i === lista.length - 1) { e.preventDefault(); lista[0].focus(); }
      }
    });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) cerrar(false); });
    // Al cruzar el punto de corte (la misma media query que el CSS), el menú abierto se cierra y el
    // foco nunca se queda en algo que deja de verse: en escritorio el botón se oculta y el foco pasa al
    // primer enlace; en móvil los enlaces se pliegan y el foco pasa al botón.
    // When crossing the breakpoint (the same media query as the CSS), an open menu closes and focus
    // never stays on something that disappears: on desktop the button hides and focus moves to the
    // first link; on mobile the links fold and focus moves to the button.
    // El navegador puede quitar el foco de lo que se oculta antes de avisar del cambio (queda en body):
    // se recuerda el último elemento enfocado; un clic con el puntero lo olvida
    // The browser may drop focus from what hides before reporting the change (it lands on body): the
    // last focused element is remembered; a pointer click forgets it
    var ultimoFoco = null;
    document.addEventListener('focusin', function (e) { ultimoFoco = e.target; });
    document.addEventListener('pointerdown', function () { ultimoFoco = null; });
    movil.addEventListener('change', function (m) {
      var activo = document.activeElement;
      if (!activo || activo === document.body) activo = ultimoFoco;
      if (!activo) return;
      var enMenu = activo === boton || panel.contains(activo);
      if (barra.classList.contains('abierta')) cerrar(false);
      if (!enMenu || activo.getClientRects().length) return;
      if (m.matches) boton.focus();
      else { var primero = panel.querySelector('a'); if (primero) primero.focus(); }
    });
  }

  /* ===== 2. Movimiento continuo y su pausa (WCAG 2.2.2) =====
     ===== 2. Continuous motion and its pause (WCAG 2.2.2) ===== */
  var botonesPausa = [];
  function aplicarMovimiento() {
    var raiz = document.documentElement;
    raiz.classList.toggle('pausado', pausado);
    // Las animaciones continuas existen desde que hay movimiento por primera vez
    // Continuous animations exist from the first time motion is on
    if (!pausado) raiz.classList.add('con-movimiento');
    botonesPausa.forEach(function (b) {
      b.setAttribute('aria-pressed', pausado ? 'true' : 'false');
      b.textContent = pausado ? 'Reanudar movimiento' : 'Pausar movimiento';
    });
    document.querySelectorAll('[data-video]').forEach(function (v) {
      if (pausado) v.pause();
      else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
  }
  function iniciarPausa() {
    // El botón solo aparece si la página tiene algo que se mueva solo
    // The button only shows if the page has something that moves by itself
    var hayMovimiento = document.querySelector('[data-crossfade], [data-video], .aro-giro');
    botonesPausa = [].slice.call(document.querySelectorAll('[data-pausa]'));
    if (!hayMovimiento) return;
    botonesPausa.forEach(function (b) {
      b.hidden = false;
      b.addEventListener('click', function () { pausado = !pausado; aplicarMovimiento(); });
    });
    aplicarMovimiento();
  }

  /* ===== 3. Fundido lento del héroe (movimiento de firma) =====
     ===== 3. Slow hero crossfade (signature move) ===== */
  // Cambia la foto cada 7 s mientras no haya pausa ni pestaña oculta; la capa visible es la única
  // que leen los lectores de pantalla. / Switches the photo every 7 s unless paused or hidden; the
  // visible layer is the only one screen readers read.
  function iniciarFundido() {
    var marco = document.querySelector('[data-crossfade]');
    if (!marco) return;
    var capas = marco.querySelectorAll('.foto-capa');
    if (capas.length < 2) return;
    var actual = 0;
    window.setInterval(function () {
      if (pausado || document.hidden) return;
      capas[actual].classList.remove('activa'); capas[actual].setAttribute('aria-hidden', 'true');
      actual = (actual + 1) % capas.length;
      capas[actual].classList.add('activa'); capas[actual].removeAttribute('aria-hidden');
    }, 7000);
  }

  /* ===== 4. Entradas escalonadas al entrar en pantalla =====
     ===== 4. Staggered entrances when entering the viewport ===== */
  function iniciarEntradas() {
    var piezas = document.querySelectorAll('[data-reveal]');
    document.querySelectorAll('.bloques span').forEach(function (b, i) { b.style.setProperty('--i', i); });
    if (!('IntersectionObserver' in window) || reducir) {
      piezas.forEach(function (p) { p.classList.add('is-in'); });
      return;
    }
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); vigia.unobserve(e.target); }
      });
    }, { rootMargin: '0px', threshold: 0.01 });
    // Si la página ya se pintó con contenido (el script llegó tarde), lo que está en pantalla se queda
    // visible y no se vigila, para que no parpadee; si aún no se pintó, todo entra animado como siempre
    // If the page already painted content (the script arrived late), what is on screen stays visible
    // and is not watched, so it does not flicker; if nothing was painted yet, everything animates in as usual
    var pintada = !performance.getEntriesByName || performance.getEntriesByName('first-contentful-paint').length > 0;
    piezas.forEach(function (p) {
      var caja = p.getBoundingClientRect();
      if (pintada && caja.top < window.innerHeight && caja.bottom > 0) p.classList.add('is-in');
      else vigia.observe(p);
    });
    // Solo ahora, con el vigía puesto, el CSS puede ocultar lo que aún no ha entrado
    // Only now, with the watcher in place, may the CSS hide what has not entered yet
    document.documentElement.classList.add('con-entradas');
  }

  /* ===== 5. El despiece y la caja de seis latas (la cosa viva) =====
     ===== 5. The cuts and the six-tin box (the live thing) ===== */
  var PIEZAS = DATOS.piezas || {};
  var CAPACIDAD = 6;
  var elegida = 'ventresca';
  var caja = [];

  // Formato de euros en español / Euro format in Spanish
  function euros(n) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  // Pinta la pieza elegida en pestañas, dibujo y ficha / Paints the chosen cut on tabs, drawing and card
  function pintarPieza(clave, animar) {
    if (!tieneProp(PIEZAS, clave)) return;
    var p = PIEZAS[clave];
    elegida = clave;
    document.querySelectorAll('.pestana').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.pieza === clave ? 'true' : 'false');
    });
    document.querySelectorAll('.tapa .pieza').forEach(function (z) { z.classList.toggle('activa', z.dataset.pieza === clave); });
    var nombre = document.querySelector('[data-pieza-nombre]'); if (nombre) nombre.textContent = p.nombre;
    var precio = document.querySelector('[data-ficha-precio]');
    var texto = document.querySelector('[data-ficha-texto]');
    if (precio) precio.textContent = p.nombre + ' · lata de 120 g · ' + euros(p.precio);
    if (texto) texto.textContent = p.texto;
    var ficha = document.querySelector('.ficha');
    if (ficha && animar && !reducir) { ficha.classList.remove('cambia'); void ficha.offsetWidth; ficha.classList.add('cambia'); }
  }

  // Describe la caja en palabras / Describes the box in words
  function describirCaja() {
    var cuenta = {};
    caja.forEach(function (c) { cuenta[c] = (cuenta[c] || 0) + 1; });
    var partes = Object.keys(cuenta).map(function (c) { return cuenta[c] + ' ' + PIEZAS[c].nombre.toLowerCase(); });
    if (partes.length < 2) return partes.join('');
    return partes.slice(0, -1).join(', ') + ' y ' + partes[partes.length - 1];
  }

  // Pone un texto de pedido en el cupón de la página (siempre como texto, nunca HTML)
  // Puts an order text into the page's coupon (always as text, never HTML)
  function ponerEnCupon(linea, visible) {
    var textoCupon = document.querySelector('[data-cupon-caja]');
    var campo = document.querySelector('[data-cupon-campo]');
    if (textoCupon) textoCupon.textContent = visible || linea;
    if (campo) campo.value = linea;
  }

  // Pinta huecos, resumen, botones y cupón / Paints slots, summary, buttons and coupon
  function pintarCaja() {
    document.querySelectorAll('[data-caja-huecos] li').forEach(function (h, i) {
      var c = caja[i];
      if (c) {
        if (h.dataset.l !== PIEZAS[c].letra || !h.classList.contains('llena')) {
          h.classList.remove('llena'); void h.offsetWidth; h.dataset.l = PIEZAS[c].letra; h.classList.add('llena');
        }
      } else { h.classList.remove('llena'); delete h.dataset.l; }
    });
    var total = caja.reduce(function (s, c) { return s + PIEZAS[c].precio; }, 0);
    var resumen = document.querySelector('[data-caja-resumen]');
    if (resumen) resumen.textContent = caja.length ? 'Tu caja: ' + caja.length + ' de ' + CAPACIDAD + ' latas · ' + euros(total) : 'Tu caja: 0 de 6 latas';
    var anadir = document.querySelector('[data-caja-anadir]');
    var quitar = document.querySelector('[data-caja-quitar]');
    if (anadir) { anadir.disabled = caja.length >= CAPACIDAD; anadir.textContent = caja.length >= CAPACIDAD ? 'Caja llena' : 'Añadir a la caja'; }
    if (quitar) quitar.disabled = caja.length === 0;
    if (caja.length) ponerEnCupon('Tu caja: ' + describirCaja() + '. ' + caja.length + ' de 6 latas, ' + euros(total) + '.');
    else ponerEnCupon('Caja de la casa', 'Caja de la casa: 2 ventresca, 2 tarantelo y 2 morrillo.');
  }

  // Conecta pestañas, piezas del dibujo y botones de la caja / Wires tabs, drawing cuts and box buttons
  function iniciarDespiece() {
    if (!document.querySelector('.despiece')) return;
    document.querySelectorAll('.pestana').forEach(function (b) {
      b.addEventListener('click', function () { pintarPieza(b.dataset.pieza, true); });
    });
    document.querySelectorAll('.tapa .pieza').forEach(function (z) {
      z.addEventListener('click', function () { pintarPieza(z.dataset.pieza, true); });
    });
    var anadir = document.querySelector('[data-caja-anadir]');
    var quitar = document.querySelector('[data-caja-quitar]');
    if (anadir) anadir.addEventListener('click', function () { if (caja.length < CAPACIDAD) { caja.push(elegida); pintarCaja(); } });
    if (quitar) quitar.addEventListener('click', function () { caja.pop(); pintarCaja(); });
    pintarPieza('ventresca', false);
    pintarCaja();
  }

  /* ===== 6. Pedido que llega desde la tienda (contacto.html?pedido=…) =====
     ===== 6. Order coming from the shop (contacto.html?pedido=…) ===== */
  // Solo se aceptan identificadores propios del catálogo, y el texto se pone con textContent.
  // Only the catalogue's own ids are accepted, and the text is set with textContent.
  function iniciarPedidoDeTienda() {
    if (!document.querySelector('[data-cupon-campo]') || document.querySelector('.despiece')) return;
    var pedido = null;
    try { pedido = new URLSearchParams(window.location.search).get('pedido'); } catch (e) { pedido = null; }
    if (pedido && tieneProp(DATOS.productos, pedido)) ponerEnCupon(String(DATOS.productos[pedido]) + '.');
  }

  /* ===== 7. El cupón: valida, avisa y abre el correo =====
     ===== 7. The coupon: validates, reports and opens the email app ===== */
  // No hay servidor: el pedido se escribe en un correo que envía el visitante. El botón de enviar
  // llega desactivado en el HTML y se activa aquí, ya con el manejador puesto.
  // No server: the order is written into an email the visitor sends. The submit button arrives
  // disabled in the HTML and is enabled here, with the handler already in place.
  var MENSAJES = {
    'c-nombre': 'Escribe tu nombre.',
    'c-correo': 'Escribe un correo válido, por ejemplo nombre@dominio.es.',
    'c-cp': 'Escribe un código postal de cinco cifras.'
  };
  function iniciarCupon() {
    var form = document.querySelector('[data-cupon]');
    if (!form) return;
    var estado = form.querySelector('[data-cupon-estado]');
    var enviar = form.querySelector('[data-cupon-enviar]');
    var valor = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    // Comprueba un campo y muestra u oculta su error / Checks a field and shows or hides its error
    function revisar(input) {
      var ok = input.checkValidity();
      // Un campo obligatorio con solo espacios cuenta como vacío / A required field with only spaces counts as empty
      if (input.required && !input.value.trim()) ok = false;
      if (input.id === 'c-cp' && input.value) ok = /^\d{5}$/.test(input.value.trim());
      var error = document.getElementById('e-' + input.id);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (error) { error.hidden = ok; error.textContent = ok ? '' : (MENSAJES[input.id] || 'Revisa este campo.'); }
      return ok;
    }
    var revisables = [].slice.call(form.querySelectorAll('input[required]'));
    revisables.forEach(function (i) { i.addEventListener('blur', function () { if (i.value) revisar(i); }); });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var malos = revisables.filter(function (i) { return !revisar(i); });
      if (malos.length) {
        if (estado) estado.textContent = 'Hay ' + malos.length + (malos.length === 1 ? ' campo' : ' campos') + ' por revisar.';
        malos[0].focus();
        return;
      }
      var campoCaja = form.querySelector('[data-cupon-campo]');
      var cuerpo = [
        'Hola, quiero hacer este pedido:', campoCaja ? campoCaja.value : '', '',
        'Nombre: ' + valor('c-nombre'), 'Correo: ' + valor('c-correo'),
        'Código postal: ' + valor('c-cp'), 'Comentario: ' + valor('c-comentario')
      ].join('\n');
      if (estado) estado.textContent = 'Se abre tu programa de correo con el pedido escrito. Esta web es una demostración: nadie lo recibirá.';
      window.location.href = 'mailto:' + DATOS.correo + '?subject=' + encodeURIComponent('Pedido · Conservas Atalayero') + '&body=' + encodeURIComponent(cuerpo);
    });
    // Manejador puesto: ya se puede enviar y sobra el aviso de «sin JavaScript»
    // Handler in place: sending is now possible and the "no JavaScript" note is no longer needed
    if (enviar) enviar.disabled = false;
    var aviso = form.querySelector('[data-cupon-aviso]');
    if (aviso) aviso.hidden = true;
  }

  // Arranque / Start
  function iniciar() {
    iniciarMenu();
    iniciarPausa();
    iniciarFundido();
    iniciarEntradas();
    iniciarDespiece();
    iniciarPedidoDeTienda();
    iniciarCupon();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
