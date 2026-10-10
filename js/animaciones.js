/* ------------------------------------------------------------------
   animaciones.js — hace aparecer el contenido de cada página

   Cada bloque del contenido arranca transparente y un poco abajo, y sube
   a su lugar cuando entra a la pantalla: al cargar la página y también
   al hacer scroll. Los que entran juntos aparecen uno tras otro.

   Para saber cuándo un bloque entra a la pantalla se usa
   IntersectionObserver: el navegador avisa solo, sin que haya que
   revisar la posición en cada movimiento del scroll.

   Este archivo va en el <head>, ANTES del contenido, para marcar el
   <html> con la clase "animar" antes de que se dibuje la página. Así el
   CSS esconde los bloques desde el inicio y no se ve un parpadeo.
------------------------------------------------------------------ */
(function () {

  // Si el usuario pidió "reducir movimiento" en su sistema, o el navegador
  // no tiene IntersectionObserver, no se anima nada: todo se ve normal.
  var reducir = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducir || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('animar');

  // Contenedores cuyos HIJOS aparecen uno por uno, en vez del bloque entero
  var CONTENEDORES = '.opcionesmenuprincipal, .card-grid, .roster-grupo, ' +
                     '.roster-grid, #preguntas, .memorama-intro, .card-viewer, ' +
                     '.ficha, .figuras, .linea-tiempo, .anios-titulos';

  var RETRASO     = 60;    // ms entre un bloque y el siguiente
  var RETRASO_MAX = 420;   // tope, para que nada tarde demasiado en salir

  document.addEventListener('DOMContentLoaded', function () {
    var principal = document.querySelector('.app-main');
    if (!principal) return;

    var bloques = [];
    juntar(principal.children, bloques);

    // rootMargin negativo abajo: el bloque aparece ya un poco dentro de la pantalla
    var observador = new IntersectionObserver(alEntrar, { rootMargin: '0px 0px -6% 0px' });

    for (var i = 0; i < bloques.length; i++) {
      bloques[i].classList.add('revelar');
      observador.observe(bloques[i]);
    }

    // El navegador llama a esta función con los bloques que cambiaron
    function alEntrar(entradas) {
      var turno = 0;
      for (var k = 0; k < entradas.length; k++) {
        if (!entradas[k].isIntersecting) continue;
        var bloque = entradas[k].target;
        observador.unobserve(bloque);           // ya no hace falta vigilarlo
        bloque.style.transitionDelay = Math.min(turno * RETRASO, RETRASO_MAX) + 'ms';
        turno++;
        bloque.classList.add('visible');
        limpiarAlTerminar(bloque);
      }
    }
  });

  // Recorre los hijos; si un hijo es contenedor, se toman SUS hijos
  function juntar(lista, destino) {
    for (var i = 0; i < lista.length; i++) {
      var el = lista[i];
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
      if (el.matches(CONTENEDORES)) {
        juntar(el.children, destino);
      } else {
        destino.push(el);
      }
    }
  }

  // Al terminar de aparecer se le quitan las clases y el retraso, para que
  // el bloque vuelva a su estilo normal y sus efectos de hover vayan a su ritmo
  function limpiarAlTerminar(bloque) {
    var listo = false;
    function limpiar() {
      if (listo) return;
      listo = true;
      bloque.classList.remove('revelar', 'visible');
      bloque.style.transitionDelay = '';
    }
    bloque.addEventListener('transitionend', function (evento) {
      if (evento.target === bloque && evento.propertyName === 'transform') limpiar();
    });
    setTimeout(limpiar, 1500);   // por si 'transitionend' nunca llega
  }

})();
