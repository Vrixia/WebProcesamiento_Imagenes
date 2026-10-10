/* ------------------------------------------------------------------
   estadisticas.js — le da vida a las gráficas de la página Equipo

   Las gráficas ya vienen hechas en el HTML: cada barra es un <span>
   y su tamaño está en la variable --v. Este archivo solo agrega:

   1. Las barras crecen cuando su tarjeta entra a la pantalla.
   2. En las gráficas de toda la liga, al pasar el mouse, tocar una
      barra o moverse con las flechas del teclado, aparece una etiqueta
      con el número y el equipo de esa barra.
   3. Un botón para mostrar u ocultar la tabla con todos los datos.

   Va en el <head>, igual que animaciones.js, para marcar el <html>
   antes de que se dibuje la página. Así las barras no se ven llenas
   un instante antes de empezar a crecer.
------------------------------------------------------------------ */
(function () {

  // Si el usuario pidió "reducir movimiento", las barras salen ya completas
  var reducir = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animar = !reducir && 'IntersectionObserver' in window;
  if (animar) document.documentElement.classList.add('graficas-animadas');

  document.addEventListener('DOMContentLoaded', function () {
    var i;

    if (animar) {
      var tarjetas = document.querySelectorAll('.grafica-tarjeta');
      var observador = new IntersectionObserver(function (entradas) {
        for (var k = 0; k < entradas.length; k++) {
          if (!entradas[k].isIntersecting) continue;
          entradas[k].target.classList.add('crecer');
          observador.unobserve(entradas[k].target);
        }
      }, { rootMargin: '0px 0px -8% 0px' });
      for (i = 0; i < tarjetas.length; i++) observador.observe(tarjetas[i]);
    }

    var graficas = document.querySelectorAll('.tira-barras');
    for (i = 0; i < graficas.length; i++) prepararEtiqueta(graficas[i]);

    var tablas = document.querySelectorAll('[data-plegable]');
    for (i = 0; i < tablas.length; i++) prepararTabla(tablas[i]);
  });


  /* ---------- 2. Etiqueta de cada barra ---------- */
  function prepararEtiqueta(grafica) {
    var marcas = grafica.querySelectorAll('.marca');
    if (!marcas.length) return;

    // La etiqueta: el número arriba y, abajo, el equipo con su lugar.
    // Se llena con textContent (nunca con innerHTML).
    var etiqueta = document.createElement('div');
    etiqueta.className = 'grafica-tip';
    etiqueta.setAttribute('aria-hidden', 'true');
    var numero = document.createElement('b');
    var texto = document.createElement('span');
    etiqueta.appendChild(numero);
    etiqueta.appendChild(texto);
    grafica.appendChild(etiqueta);

    // Para lectores de pantalla: lee la barra al moverse con el teclado
    var aviso = document.createElement('span');
    aviso.className = 'solo-lectores';
    aviso.setAttribute('aria-live', 'polite');
    grafica.appendChild(aviso);

    grafica.tabIndex = 0;          // se puede llegar con la tecla Tab
    var propia = 0;                // la barra del equipo de esta página
    for (var k = 0; k < marcas.length; k++) {
      if (marcas[k].classList.contains('es-equipo')) propia = k;
    }
    var actual = -1;               // la barra que tiene la etiqueta ahora

    function mostrar(i, anunciar) {
      if (i < 0) return;
      if (actual >= 0) marcas[actual].classList.remove('activa');
      actual = i;
      var marca = marcas[i];
      var barra = marca.querySelector('.barra');
      marca.classList.add('activa');

      numero.textContent = marca.getAttribute('data-valor');
      texto.textContent = marca.getAttribute('data-nombre') + ' · ' +
                          marca.getAttribute('data-extra');
      etiqueta.style.setProperty('--clave', getComputedStyle(barra).backgroundColor);
      etiqueta.classList.add('mostrar');

      // Centrada arriba de la barra, sin salirse por los lados de la gráfica
      var caja = grafica.getBoundingClientRect();
      var cajaBarra = barra.getBoundingClientRect();
      var ancho = etiqueta.offsetWidth;
      var x = cajaBarra.left + cajaBarra.width / 2 - caja.left - ancho / 2;
      x = Math.max(0, Math.min(x, caja.width - ancho));
      var y = cajaBarra.top - caja.top - etiqueta.offsetHeight - 8;
      etiqueta.style.left = x + 'px';
      etiqueta.style.top = y + 'px';

      if (anunciar) aviso.textContent = numero.textContent + ', ' + texto.textContent;
    }

    function ocultar() {
      if (actual >= 0) marcas[actual].classList.remove('activa');
      actual = -1;
      etiqueta.classList.remove('mostrar');
    }

    // La barra más cercana al mouse o al dedo: no hace falta atinarle exacto
    function cercana(x) {
      var mejor = -1, distancia = Infinity;
      for (var i = 0; i < marcas.length; i++) {
        var r = marcas[i].getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - x);
        if (d < distancia) { distancia = d; mejor = i; }
      }
      return mejor;
    }

    // Mouse: la etiqueta sigue al puntero. Dedo: se muestra al tocar.
    grafica.addEventListener('pointermove', function (evento) {
      if (evento.pointerType !== 'touch') mostrar(cercana(evento.clientX));
    });
    grafica.addEventListener('pointerleave', function (evento) {
      if (evento.pointerType !== 'touch') ocultar();
    });
    grafica.addEventListener('click', function (evento) {
      mostrar(cercana(evento.clientX));
    });

    // Teclado: al llegar con Tab se muestra la barra del equipo,
    // las flechas izquierda y derecha recorren las demás y Esc la cierra
    grafica.addEventListener('focus', function () {
      if (actual < 0) mostrar(propia, true);
    });
    grafica.addEventListener('blur', ocultar);
    grafica.addEventListener('keydown', function (evento) {
      var i = actual < 0 ? propia : actual;
      if (evento.key === 'ArrowRight') i = Math.min(marcas.length - 1, i + 1);
      else if (evento.key === 'ArrowLeft') i = Math.max(0, i - 1);
      else if (evento.key === 'Home') i = 0;
      else if (evento.key === 'End') i = marcas.length - 1;
      else if (evento.key === 'Escape') { ocultar(); return; }
      else return;
      evento.preventDefault();
      mostrar(i, true);
    });
  }


  /* ---------- 3. Botón para ver la tabla ---------- */
  function prepararTabla(envoltura) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'ver-tabla';
    boton.setAttribute('aria-controls', envoltura.id);
    envoltura.parentNode.insertBefore(boton, envoltura);

    function poner(abierta) {
      envoltura.hidden = !abierta;
      boton.setAttribute('aria-expanded', abierta ? 'true' : 'false');
      boton.textContent = abierta ? 'Ocultar tabla' : 'Ver tabla';
    }
    poner(false);                  // sin JavaScript, la tabla se queda visible
    boton.addEventListener('click', function () { poner(envoltura.hidden); });
  }

})();
