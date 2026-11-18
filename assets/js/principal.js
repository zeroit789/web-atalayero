/*
  principal.js · Conservas Atalayero
  Comportamiento de toda la web: menú móvil accesible, botón de pausa del movimiento, fundido
  lento de las fotos del héroe, entradas escalonadas, el despiece del atún con la caja de seis
  latas y el cupón (valida, avisa de errores y abre el correo con el pedido escrito).
  Behaviour of the whole site: accessible mobile menu, motion pause button, slow crossfade of
  the hero photos, staggered entrances, the tuna cuts with the six-tin box, and the coupon
  (validates, reports errors and opens the email app with the order written out).
  Los datos de las latas vienen de datos.js / Tin data comes from datos.js.
*/
(function () {
  'use strict';

  // Preferencia de movimiento reducido del visitante
  // The visitor's reduced-motion preference
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Estado de pausa manual (botón «Pausar movimiento»)
  // Manual pause state (the "Pause motion" button)
  var pausado = false;
  var DATOS = window.ALMENARA || { piezas: {}, correo: 'pedidos@atalayero.example' };

  /* ===== 1. Menú móvil: foco dentro, Escape cierra, foco de vuelta =====
     ===== 1. Mobile menu: focus inside, Escape closes, focus returns ===== */
  function iniciarMenu() {
    var barra = document.querySelector('.barra');
    var boton = document.querySelector('[data-menu]');
    var panel = document.getElementById('menu-principal');
    if (!barra || !boton || !panel) return;
    // Elementos que pueden recibir foco dentro del panel / Focusable elements inside the panel
    function enfocables() { return [boton].concat([].slice.call(panel.querySelectorAll('a, button'))); }
    function abrir() {
      barra.classList.add('abierta'); boton.setAttribute('aria-expanded', 'true');
      boton.textContent = 'Cerrar';
      var primero = panel.querySelector('a, button'); if (primero) primero.focus();
    }
    function cerrar(devolverFoco) {
      barra.classList.remove('abierta'); boton.setAttribute('aria-expanded', 'false');
      boton.textContent = 'Menú';
      if (devolverFoco) boton.focus();
    }
    boton.addEventListener('click', function () {
      if (barra.classList.contains('abierta')) cerrar(true); else abrir();
    });
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
    // Al pulsar un enlace del menú se cierra / Choosing a link closes the menu
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) cerrar(false); });
    // Si la ventana crece por encima del corte, el menú vuelve a su estado normal
    // If the window grows past the breakpoint, the menu returns to normal
    window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) { if (m.matches) cerrar(false); });
  }

  /* ===== 2. Pausa de todo lo que se mueve solo (WCAG 2.2.2) =====
     ===== 2. Pause everything that moves by itself (WCAG 2.2.2) ===== */
  function iniciarPausa() {
    var botones = document.querySelectorAll('[data-pausa]');
    function aplicar() {
      document.documentElement.classList.toggle('pausado', pausado);
      botones.forEach(function (b) {
        b.setAttribute('aria-pressed', pausado ? 'true' : 'false');
        b.textContent = pausado ? 'Reanudar movimiento' : 'Pausar movimiento';
      });
      document.querySelectorAll('[data-video]').forEach(function (v) {
        if (pausado || reducir) v.pause(); else { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      });
    }
    botones.forEach(function (b) { b.addEventListener('click', function () { pausado = !pausado; aplicar(); }); });
    if (reducir) { pausado = true; }
    aplicar();
  }

  /* ===== 3. Fundido lento del héroe (movimiento de firma) =====
     ===== 3. Slow hero crossfade (signature move) ===== */
  // Cambia la foto cada 7 s; se para con la pestaña oculta, con la pausa y con movimiento reducido.
  // Switches the photo every 7 s; stops with a hidden tab, with the pause and with reduced motion.
  function iniciarFundido() {
    var marco = document.querySelector('[data-crossfade]');
    if (!marco || reducir) return;
    var capas = marco.querySelectorAll('.foto-capa');
    if (capas.length < 2) return;
    var actual = 0;
    window.setInterval(function () {
      if (pausado || document.hidden) return;
      capas[actual].classList.remove('activa');
      actual = (actual + 1) % capas.length;
      capas[actual].classList.add('activa');
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
    piezas.forEach(function (p) { vigia.observe(p); });
  }

  /* ===== 5. El despiece y la caja de seis latas (la cosa viva) =====
     ===== 5. The cuts and the six-tin box (the live thing) ===== */
  var PIEZAS = DATOS.piezas;
  var CAPACIDAD = 6;
  var elegida = 'ventresca';
  var caja = [];

  // Formato de euros en español / Euro format in Spanish
  function euros(n) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  // Pinta la pieza elegida en pestañas, dibujo y ficha / Paints the chosen cut on tabs, drawing and card
  function pintarPieza(clave, animar) {
    var p = PIEZAS[clave]; if (!p) return;
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

  // Pone un texto de pedido en el cupón de la página / Puts an order text into the page's coupon
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
  function iniciarPedidoDeTienda() {
    var campo = document.querySelector('[data-cupon-campo]');
    if (!campo || document.querySelector('.despiece')) return;
    var pedido = new URLSearchParams(window.location.search).get('pedido');
    var producto = pedido && DATOS.productos ? DATOS.productos[pedido] : null;
    if (producto) ponerEnCupon(producto + '.');
  }

  /* ===== 7. El cupón: valida, avisa y abre el correo =====
     ===== 7. The coupon: validates, reports and opens the email app ===== */
  // No hay pasarela de pago ni servidor: el pedido se escribe en un correo que envía el visitante.
  // No payment gateway or server: the order is written into an email the visitor sends.
  var MENSAJES = {
    nombre: 'Escribe tu nombre.',
    correo: 'Escribe un correo válido, por ejemplo nombre@dominio.es.',
    codigo_postal: 'Escribe un código postal de cinco cifras.'
  };
  function iniciarCupon() {
    var form = document.querySelector('[data-cupon]');
    if (!form) return;
    var estado = form.querySelector('[data-cupon-estado]');
    // Comprueba un campo y muestra u oculta su error / Checks a field and shows or hides its error
    function revisar(input) {
      var ok = input.checkValidity();
      if (input.name === 'codigo_postal' && input.value) ok = /^\d{5}$/.test(input.value.trim());
      var error = document.getElementById('e-' + input.id);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (error) { error.hidden = ok; error.textContent = ok ? '' : (MENSAJES[input.name] || 'Revisa este campo.'); }
      return ok;
    }
    form.querySelectorAll('input[required], input[name="codigo_postal"]').forEach(function (i) {
      i.addEventListener('blur', function () { if (i.value) revisar(i); });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var malos = [].slice.call(form.querySelectorAll('input[required], input[name="codigo_postal"]')).filter(function (i) { return !revisar(i); });
      if (malos.length) {
        if (estado) estado.textContent = 'Hay ' + malos.length + (malos.length === 1 ? ' campo' : ' campos') + ' por revisar.';
        malos[0].focus();
        return;
      }
      var d = new FormData(form);
      var cuerpo = [
        'Hola, quiero hacer este pedido:', String(d.get('caja') || ''), '',
        'Nombre: ' + (d.get('nombre') || ''), 'Correo: ' + (d.get('correo') || ''),
        'Código postal: ' + (d.get('codigo_postal') || ''), 'Comentario: ' + (d.get('comentario') || '')
      ].join('\n');
      if (estado) estado.textContent = 'Se abre tu programa de correo con el pedido escrito. Esta web es una demostración: nadie lo recibirá.';
      window.location.href = 'mailto:' + DATOS.correo + '?subject=' + encodeURIComponent('Pedido · Conservas Atalayero') + '&body=' + encodeURIComponent(cuerpo);
    });
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
