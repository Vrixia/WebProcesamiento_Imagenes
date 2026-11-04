// Hace aparecer los bloques al entrar a la pantalla; va en el <head> para que no parpadee
(function () {
  // Sin animación si se pidió reducir movimiento
  var reducir = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducir || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('animar');

  // En estos, los hijos aparecen uno por uno
  var CONTENEDORES = '.opcionesmenuprincipal, .card-grid, .roster-grupo, ' +
                     '.roster-grid, #preguntas, .memorama-intro, .card-viewer, ' +
                     '.ficha, .figuras, .linea-tiempo, .anios-titulos';

  var RETRASO     = 60;
  var RETRASO_MAX = 420;

  document.addEventListener('DOMContentLoaded', function () {
    var principal = document.querySelector('.app-main');
    if (!principal) return;

    var bloques = [];
    juntar(principal.children, bloques);

    var observador = new IntersectionObserver(alEntrar, { rootMargin: '0px 0px -6% 0px' });

    for (var i = 0; i < bloques.length; i++) {
      bloques[i].classList.add('revelar');
      observador.observe(bloques[i]);
    }

    function alEntrar(entradas) {
      var turno = 0;
      for (var k = 0; k < entradas.length; k++) {
        if (!entradas[k].isIntersecting) continue;
        var bloque = entradas[k].target;
        observador.unobserve(bloque);
        bloque.style.transitionDelay = Math.min(turno * RETRASO, RETRASO_MAX) + 'ms';
        turno++;
        bloque.classList.add('visible');
        limpiarAlTerminar(bloque);
      }
    }
  });

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

  // Al terminar se quitan las clases para no estorbar al hover
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
    setTimeout(limpiar, 1500);   // por si transitionend nunca llega
  }

})();
