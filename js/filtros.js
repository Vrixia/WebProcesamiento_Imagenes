// Filtros de video: el color va en el <video> y los efectos en una capa encima
(function () {
  // Sin hue-rotate: cambiaría el color del pasto y del cielo
  var COLOR = {
    deportivo: 'saturate(1.55) contrast(1.22) brightness(1.05)',
    borroso:   'blur(4px)',
    frio:      'saturate(0.9) contrast(1.08) brightness(1.04)',
    calido:    'sepia(0.2) saturate(1.25) contrast(1.05)'
  };

  // Flashes del deportivo
  var FLASH_ESPERA_MIN = 160;
  var FLASH_ESPERA_MAX = 650;
  var FLASH_MAXIMOS    = 12;

  var tarjetas = document.querySelectorAll('.video-card');

  for (var i = 0; i < tarjetas.length; i++) {
    prepararTarjeta(tarjetas[i]);
  }

  function prepararTarjeta(tarjeta) {
    var recuadro = tarjeta.querySelector('.video-stage');
    var video    = recuadro ? recuadro.querySelector('video') : null;
    var botones  = tarjeta.querySelectorAll('.video-filters button');

    if (!recuadro || !video) return;

    var capa = crearCapa(video.parentNode);

    var estado = {
      recuadro: recuadro,
      video: video,
      flashes: capa.querySelector('.fx-flashes'),
      activo: null,
      temporizador: null
    };

    for (var j = 0; j < botones.length; j++) {
      conectar(botones[j], botones, estado);
    }

    sincronizarConVideo(estado);
  }

  // Trae las piezas de todos los filtros; el CSS muestra solo las del activo
  function crearCapa(contenedor) {
    var capa = document.createElement('div');
    capa.className = 'fx-capa';
    capa.setAttribute('aria-hidden', 'true');
    capa.innerHTML =
      '<div class="fx-tinte"></div>' +
      '<div class="fx-vineta"></div>' +
      '<div class="fx-reflector fx-reflector--izq"></div>' +
      '<div class="fx-reflector fx-reflector--der"></div>' +
      '<div class="fx-destello"></div>' +
      '<div class="fx-flashes"></div>' +
      '<div class="fx-envivo"><i></i>EN VIVO</div>';
    contenedor.appendChild(capa);
    return capa;
  }

  function conectar(boton, todosLosBotones, estado) {
    boton.addEventListener('click', function () {
      var nombre   = boton.dataset.filtro;
      var yaEstaba = boton.classList.contains('is-active');

      // Solo un filtro a la vez
      for (var k = 0; k < todosLosBotones.length; k++) {
        todosLosBotones[k].classList.remove('is-active');
      }
      quitarFiltro(estado);

      // Picar el mismo filtro lo quita
      if (yaEstaba) return;

      boton.classList.add('is-active');
      ponerFiltro(estado, nombre);
    });
  }

  function ponerFiltro(estado, nombre) {
    estado.activo = nombre;
    estado.video.style.filter = COLOR[nombre] || '';
    estado.recuadro.classList.add('fx-' + nombre);

    // Los flashes solo salen con el video corriendo
    if (nombre === 'deportivo' && !estaPausado(estado.video)) {
      arrancarFlashes(estado);
    }
  }

  function quitarFiltro(estado) {
    if (estado.activo) {
      estado.recuadro.classList.remove('fx-' + estado.activo);
    }
    estado.activo = null;
    estado.video.style.filter = '';
    detenerLanzador(estado);
    borrarFlashes(estado);
  }

  // En pausa el deportivo se congela
  function sincronizarConVideo(estado) {
    function alPausar() {
      estado.recuadro.classList.add('fx-pausado');
      detenerLanzador(estado);
    }

    function alReproducir() {
      estado.recuadro.classList.remove('fx-pausado');
      if (estado.activo === 'deportivo') {
        arrancarFlashes(estado);
      }
    }

    estado.video.addEventListener('pause', alPausar);
    estado.video.addEventListener('ended', alPausar);
    estado.video.addEventListener('play',  alReproducir);

    if (estaPausado(estado.video)) {
      estado.recuadro.classList.add('fx-pausado');
    }
  }

  function estaPausado(video) {
    return video.paused || video.ended;
  }

  // Cada flash es un span que se borra al terminar su animación
  function arrancarFlashes(estado) {
    detenerLanzador(estado);

    function siguiente() {
      lanzarFlash(estado.flashes);
      var espera = FLASH_ESPERA_MIN + Math.random() * (FLASH_ESPERA_MAX - FLASH_ESPERA_MIN);
      estado.temporizador = setTimeout(siguiente, espera);
    }

    estado.temporizador = setTimeout(siguiente, 350);
  }

  function detenerLanzador(estado) {
    clearTimeout(estado.temporizador);
    estado.temporizador = null;
  }

  function borrarFlashes(estado) {
    estado.flashes.innerHTML = '';
  }

  function lanzarFlash(contenedor) {
    if (contenedor.children.length >= FLASH_MAXIMOS) {
      contenedor.removeChild(contenedor.firstChild);
    }

    var flash = document.createElement('span');
    flash.className = 'fx-flash';

    var ancho = contenedor.clientWidth || 372;
    var tam = ancho * (0.027 + Math.random() * 0.048);
    flash.style.width  = tam + 'px';
    flash.style.height = tam + 'px';
    flash.style.left = (5 + Math.random() * 90) + '%';
    // Solo arriba, lejos de los controles
    flash.style.top  = (6 + Math.random() * 50) + '%';

    flash.addEventListener('animationend', function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    });

    contenedor.appendChild(flash);
  }

})();
