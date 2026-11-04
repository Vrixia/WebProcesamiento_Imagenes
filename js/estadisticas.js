// Anima las gráficas, pone las etiquetas y el botón de la tabla
(function () {
  // Con movimiento reducido las barras salen completas
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

  // Etiqueta de cada barra
  function prepararEtiqueta(grafica) {
    var marcas = grafica.querySelectorAll('.marca');
    if (!marcas.length) return;

    var etiqueta = document.createElement('div');
    etiqueta.className = 'grafica-tip';
    etiqueta.setAttribute('aria-hidden', 'true');
    var numero = document.createElement('b');
    var texto = document.createElement('span');
    etiqueta.appendChild(numero);
    etiqueta.appendChild(texto);
    grafica.appendChild(etiqueta);

    var aviso = document.createElement('span');
    aviso.className = 'solo-lectores';
    aviso.setAttribute('aria-live', 'polite');
    grafica.appendChild(aviso);

    grafica.tabIndex = 0;
    var propia = 0;
    for (var k = 0; k < marcas.length; k++) {
      if (marcas[k].classList.contains('es-equipo')) propia = k;
    }
    var actual = -1;

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

    // Toma la barra más cercana, no hace falta atinarle
    function cercana(x) {
      var mejor = -1, distancia = Infinity;
      for (var i = 0; i < marcas.length; i++) {
        var r = marcas[i].getBoundingClientRect();
        var d = Math.abs(r.left + r.width / 2 - x);
        if (d < distancia) { distancia = d; mejor = i; }
      }
      return mejor;
    }

    grafica.addEventListener('pointermove', function (evento) {
      if (evento.pointerType !== 'touch') mostrar(cercana(evento.clientX));
    });
    grafica.addEventListener('pointerleave', function (evento) {
      if (evento.pointerType !== 'touch') ocultar();
    });
    grafica.addEventListener('click', function (evento) {
      mostrar(cercana(evento.clientX));
    });

    // Teclado: Tab, flechas y Esc
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

  // Botón de la tabla
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
