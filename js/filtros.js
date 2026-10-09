/* ------------------------------------------------------------------
   filtros.js — filtros para los videos

   Cada filtro tiene dos partes:

   1. COLOR. Una receta de funciones CSS (saturate, contrast, sepia...)
      que se le pone al <video> con style.filter.

   2. EFECTOS. Capas que van ENCIMA del video: luces, viñetas, flashes.
      Este archivo mete un <div class="fx-capa"> dentro de cada recuadro
      y le pone al recuadro una clase según el filtro (fx-deportivo,
      fx-frio, fx-calido...). El CSS decide qué capas se ven con cada una.

   ¿Por qué el color va en el <video> y no en todo el recuadro?
   Porque si fuera en el recuadro también teñiría y desenfocaría las
   capas de efectos: la viñeta azul cambiaría de color y las luces se
   verían borrosas. Así cada parte se controla por separado.

   La capa tiene pointer-events:none: los clics la atraviesan y los
   controles del video (play, pausa, volumen) siguen funcionando.

   La capa se pone JUNTO al video (en su mismo contenedor). reproductor.js
   mete el video en un "lienzo" que es lo que se agranda en pantalla
   completa, así que las capas se agrandan con él. Por eso en el HTML
   reproductor.js va antes que este archivo.

   Cuando el video está en pausa, el filtro deportivo se queda quieto:
   ver sincronizarConVideo() más abajo.

   Picar el mismo botón otra vez quita el filtro.
------------------------------------------------------------------ */
(function () {

  // Parte de COLOR de cada filtro.
  // Ninguna usa hue-rotate: esa función gira TODOS los colores, y con un
  // video real el pasto se volvería morado y el cielo naranja. El azul del
  // frío y el naranja del cálido los pone la capa de tinte (ver el CSS).
  var COLOR = {
    deportivo: 'saturate(1.55) contrast(1.22) brightness(1.05)',
    borroso:   'blur(4px)',
    frio:      'saturate(0.9) contrast(1.08) brightness(1.04)',
    calido:    'sepia(0.2) saturate(1.25) contrast(1.05)'
  };

  // Flashes de cámara del filtro deportivo
  var FLASH_ESPERA_MIN = 160;   // ms mínimos entre un flash y otro
  var FLASH_ESPERA_MAX = 650;   // ms máximos
  var FLASH_MAXIMOS    = 12;    // tope de flashes al mismo tiempo

  var tarjetas = document.querySelectorAll('.video-card');

  for (var i = 0; i < tarjetas.length; i++) {
    prepararTarjeta(tarjetas[i]);
  }

  function prepararTarjeta(tarjeta) {
    var recuadro = tarjeta.querySelector('.video-stage');
    var video    = recuadro ? recuadro.querySelector('video') : null;
    var botones  = tarjeta.querySelectorAll('.video-filters button');

    if (!recuadro || !video) return;

    // La capa va junto al video: dentro del lienzo de reproductor.js, o
    // directo en el recuadro si ese archivo no estuviera.
    var capa = crearCapa(video.parentNode);

    // Todo lo que esta tarjeta necesita recordar
    var estado = {
      recuadro: recuadro,
      video: video,
      flashes: capa.querySelector('.fx-flashes'),
      activo: null,          // nombre del filtro prendido, o null
      temporizador: null     // el setTimeout que lanza los flashes
    };

    for (var j = 0; j < botones.length; j++) {
      // Función aparte para que cada botón recuerde cuál es el suyo
      conectar(botones[j], botones, estado);
    }

    sincronizarConVideo(estado);
  }

  // Arma la capa de efectos. Trae las piezas de todos los filtros;
  // el CSS solo deja ver las del filtro activo.
  function crearCapa(contenedor) {
    var capa = document.createElement('div');
    capa.className = 'fx-capa';
    capa.setAttribute('aria-hidden', 'true');   // es decoración
    capa.innerHTML =
      // frío y cálido
      '<div class="fx-tinte"></div>' +
      '<div class="fx-vineta"></div>' +
      // deportivo
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

      // Solo puede haber un filtro a la vez: primero se apaga todo
      for (var k = 0; k < todosLosBotones.length; k++) {
        todosLosBotones[k].classList.remove('is-active');
      }
      quitarFiltro(estado);

      // Si ya estaba prendido se queda apagado, para comparar con el original
      if (yaEstaba) return;

      boton.classList.add('is-active');
      ponerFiltro(estado, nombre);
    });
  }

  function ponerFiltro(estado, nombre) {
    estado.activo = nombre;
    estado.video.style.filter = COLOR[nombre] || '';
    estado.recuadro.classList.add('fx-' + nombre);   // el CSS prende sus capas

    // Los flashes solo salen si el video está corriendo; si está en pausa
    // el deportivo aparece quieto y arranca cuando se le dé play.
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

  // ---------------------------------------------------------------
  // Pausa: el deportivo se queda quieto mientras el video no avanza
  //
  // Se escuchan los eventos del propio <video>, así funciona igual si la
  // pausa vino del botón, de tocar la imagen o de que el video terminó.
  //   - En pausa: el recuadro recibe la clase fx-pausado, y el CSS congela
  //     las animaciones (animation-play-state: paused). Además dejan de
  //     salir flashes nuevos; los que ya estaban se quedan congelados.
  //   - Al reanudar: se quita la clase y todo sigue desde donde se quedó.
  // ---------------------------------------------------------------
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

    // Al cargar la página el video todavía no arranca: empieza en pausa
    if (estaPausado(estado.video)) {
      estado.recuadro.classList.add('fx-pausado');
    }
  }

  function estaPausado(video) {
    return video.paused || video.ended;
  }

  // ---------------------------------------------------------------
  // Flashes de cámara (solo en el filtro deportivo)
  //
  // Cada flash es un <span> que se crea en un lugar al azar, hace su
  // animación de CSS (aparece, brilla y se desvanece) y se borra solo
  // cuando la animación termina.
  // ---------------------------------------------------------------
  function arrancarFlashes(estado) {
    detenerLanzador(estado);

    function siguiente() {
      lanzarFlash(estado.flashes);
      // La espera también es al azar, para que no se vea mecánico
      var espera = FLASH_ESPERA_MIN + Math.random() * (FLASH_ESPERA_MAX - FLASH_ESPERA_MIN);
      estado.temporizador = setTimeout(siguiente, espera);
    }

    estado.temporizador = setTimeout(siguiente, 350);
  }

  // Deja de lanzar flashes nuevos (los que ya están siguen ahí)
  function detenerLanzador(estado) {
    clearTimeout(estado.temporizador);
    estado.temporizador = null;
  }

  // Borra los flashes que se quedaron a medias
  function borrarFlashes(estado) {
    estado.flashes.innerHTML = '';
  }

  function lanzarFlash(contenedor) {
    // Por si la pestaña estuvo en segundo plano y se juntaron muchos
    if (contenedor.children.length >= FLASH_MAXIMOS) {
      contenedor.removeChild(contenedor.firstChild);
    }

    var flash = document.createElement('span');
    flash.className = 'fx-flash';

    // Tamaño proporcional al ancho del video: en la tarjeta mide de 10 a
    // 28 px, y en pantalla completa crece en la misma proporción.
    var ancho = contenedor.clientWidth || 372;
    var tam = ancho * (0.027 + Math.random() * 0.048);
    flash.style.width  = tam + 'px';
    flash.style.height = tam + 'px';
    flash.style.left = (5 + Math.random() * 90) + '%';
    // Solo en la parte de arriba (las gradas), lejos de los controles del video
    flash.style.top  = (6 + Math.random() * 50) + '%';

    flash.addEventListener('animationend', function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    });

    contenedor.appendChild(flash);
  }

})();
