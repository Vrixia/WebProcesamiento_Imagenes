/* ------------------------------------------------------------------
   reproductor.js — controles propios para los videos

   ¿Por qué no se usan los controles que trae el navegador?
   Porque su botón de pantalla completa agranda SOLO el <video>. Las
   luces, el tinte y la viñeta de los filtros son capas que van encima
   del video (las crea filtros.js), así que en pantalla completa se
   quedaban afuera. Ese botón no se puede cambiar, y en Safari y Firefox
   ni siquiera se puede esconder.

   Con controles propios, la pantalla completa se le pide al recuadro
   entero (.video-stage), que lleva adentro el video Y sus capas.

   Lo que arma este archivo dentro de cada .video-stage:

     .video-stage          ← esto es lo que se pone en pantalla completa
       .rep-lienzo         ← mide exactamente lo mismo que la imagen
         <video>
         .fx-capa          ← (la agrega filtros.js, junto al video)
       .rep-centro         ← botón grande de play
       .rep-controles      ← barra: play, avance, tiempo, sonido y pantalla

   IMPORTANTE: en el HTML este archivo va ANTES que filtros.js, para que
   filtros.js encuentre el lienzo y ponga sus capas junto al video.

   Si este archivo no cargara, el <video> conserva sus controles normales
   (el atributo controls sigue en el HTML), así que nunca se queda sin poder
   reproducirse.
------------------------------------------------------------------ */
(function () {

  var OCULTAR_DESPUES = 2500;   // ms sin moverse para esconder la barra

  // Íconos de Material Design, dibujados con SVG
  var ICONOS = {
    play:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pausa:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    sonido:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    silencio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    ampliar:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    reducir:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>'
  };

  var recuadros = document.querySelectorAll('.video-stage');

  for (var i = 0; i < recuadros.length; i++) {
    var video = recuadros[i].querySelector('video');
    if (video) prepararReproductor(recuadros[i], video);
  }

  // ===============================================================
  // Un reproductor por cada recuadro
  // ===============================================================
  function prepararReproductor(recuadro, video) {

    // 1. Apagar los controles del navegador (y sus botones de pantalla
    //    completa, picture-in-picture y transmitir, que dejarían fuera las capas)
    video.controls = false;
    video.removeAttribute('controls');
    video.setAttribute('controlslist', 'nofullscreen nodownload noremoteplayback');
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('playsinline', '');   // en iPhone, que no se abra solo

    // 2. Envolver el video en el lienzo
    var lienzo = document.createElement('div');
    lienzo.className = 'rep-lienzo';
    recuadro.insertBefore(lienzo, video);
    lienzo.appendChild(video);

    // 3. Botón grande del centro y barra de controles
    var centro = crearBoton('rep-centro', 'Reproducir', ICONOS.play);

    var barra = document.createElement('div');
    barra.className = 'rep-controles';

    var btnPlay     = crearBoton('rep-btn', 'Reproducir', ICONOS.play);
    var avance      = document.createElement('input');
    var tiempo      = document.createElement('span');
    var btnSonido   = crearBoton('rep-btn', 'Silenciar', ICONOS.sonido);
    var btnPantalla = crearBoton('rep-btn rep-btn-pantalla', 'Pantalla completa', ICONOS.ampliar);

    avance.type = 'range';
    avance.className = 'rep-avance';
    avance.min = 0;
    avance.max = 1000;     // de 0 a 1000 para que se mueva fino
    avance.step = 1;
    avance.value = 0;
    avance.setAttribute('aria-label', 'Avance del video');

    tiempo.className = 'rep-tiempo';
    tiempo.textContent = '0:00 / 0:00';

    barra.appendChild(btnPlay);
    barra.appendChild(avance);
    barra.appendChild(tiempo);
    barra.appendChild(btnSonido);
    barra.appendChild(btnPantalla);

    recuadro.appendChild(centro);
    recuadro.appendChild(barra);

    // ---------------- Play y pausa ----------------
    function alternarPlay() {
      if (video.paused || video.ended) {
        var promesa = video.play();
        if (promesa && promesa.catch) promesa.catch(function () {});
      } else {
        video.pause();
      }
    }

    centro.addEventListener('click', alternarPlay);
    btnPlay.addEventListener('click', alternarPlay);

    // Tocar la imagen también pausa o reproduce. Pero si la barra está
    // escondida, el primer toque solo la vuelve a mostrar (como en YouTube).
    lienzo.addEventListener('click', function () {
      if (recuadro.classList.contains('rep-oculto')) {
        mostrarControles();
        return;
      }
      alternarPlay();
    });

    // El estado se pinta con los eventos del propio video, así queda
    // bien sin importar qué lo haya pausado (el botón, el final, etc.)
    function pintarEstado() {
      var pausado = video.paused || video.ended;
      recuadro.classList.toggle('rep-pausado', pausado);
      btnPlay.innerHTML = pausado ? ICONOS.play : ICONOS.pausa;
      btnPlay.setAttribute('aria-label', pausado ? 'Reproducir' : 'Pausar');
      mostrarControles();
    }
    video.addEventListener('play', pintarEstado);
    video.addEventListener('pause', pintarEstado);
    video.addEventListener('ended', pintarEstado);

    // ---------------- Barra de avance y tiempo ----------------
    var arrastrando = false;   // mientras el dedo mueve la barra, no se la pelea el video

    function pintarTiempo() {
      var duracion = video.duration || 0;
      if (!arrastrando && duracion) {
        avance.value = Math.round(video.currentTime / duracion * 1000);
      }
      tiempo.textContent = formato(video.currentTime) + ' / ' + formato(duracion);
    }
    video.addEventListener('loadedmetadata', pintarTiempo);
    video.addEventListener('timeupdate', pintarTiempo);

    avance.addEventListener('input', function () {
      arrastrando = true;
      if (video.duration) {
        video.currentTime = avance.value / 1000 * video.duration;
      }
      mostrarControles();
    });
    avance.addEventListener('change', function () {
      arrastrando = false;   // 'change' llega cuando se suelta la barra
    });

    // ---------------- Sonido ----------------
    btnSonido.addEventListener('click', function () {
      video.muted = !video.muted;
    });
    video.addEventListener('volumechange', function () {
      btnSonido.innerHTML = video.muted ? ICONOS.silencio : ICONOS.sonido;
      btnSonido.setAttribute('aria-label', video.muted ? 'Activar sonido' : 'Silenciar');
    });

    // ---------------- Pantalla completa ----------------
    btnPantalla.addEventListener('click', function () {
      if (recuadro.classList.contains('rep-pantalla')) {
        salirPantalla(recuadro);
      } else {
        entrarPantalla(recuadro, video);
      }
    });

    // En pantalla completa la forma de la pantalla casi nunca es igual a la
    // del video. El lienzo se ajusta al tamaño más grande que cabe sin
    // deformar la imagen, y así las capas de efectos quedan justo encima
    // del video y no sobre las franjas negras.
    function ajustarLienzo() {
      if (!recuadro.classList.contains('rep-pantalla')) {
        lienzo.style.width = '';
        lienzo.style.height = '';
        return;
      }
      var proporcion = (video.videoWidth && video.videoHeight)
        ? video.videoWidth / video.videoHeight
        : 16 / 9;
      var ancho = Math.min(recuadro.clientWidth, recuadro.clientHeight * proporcion);
      lienzo.style.width  = ancho + 'px';
      lienzo.style.height = (ancho / proporcion) + 'px';
    }
    video.addEventListener('loadedmetadata', ajustarLienzo);
    recuadro.ajustarLienzo = ajustarLienzo;   // para llamarlo al entrar y salir

    // ResizeObserver avisa cada vez que el recuadro cambia de tamaño:
    // al entrar o salir de pantalla completa y al girar el celular.
    if (window.ResizeObserver) {
      new ResizeObserver(ajustarLienzo).observe(recuadro);
    } else {
      window.addEventListener('resize', ajustarLienzo);
    }

    // ---------------- Esconder la barra mientras se reproduce ----------------
    var temporizador = null;

    function mostrarControles() {
      recuadro.classList.remove('rep-oculto');
      clearTimeout(temporizador);
      if (!video.paused && !video.ended) {
        temporizador = setTimeout(function () {
          recuadro.classList.add('rep-oculto');
        }, OCULTAR_DESPUES);
      }
    }

    // Con mouse, moverlo encima del video muestra la barra
    recuadro.addEventListener('pointermove', function (evento) {
      if (evento.pointerType === 'mouse') mostrarControles();
    });
    // Usar cualquier control la mantiene visible
    barra.addEventListener('pointerdown', mostrarControles);

    pintarEstado();
    pintarTiempo();
  }

  // ===============================================================
  // Pantalla completa (compartida por todos los recuadros)
  // ===============================================================

  // El elemento que está en pantalla completa ahora mismo, o null.
  // webkit... es el nombre viejo que todavía usa Safari en algunas versiones.
  function pantallaActual() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function entrarPantalla(recuadro, video) {
    var pedir = recuadro.requestFullscreen || recuadro.webkitRequestFullscreen;

    // iPhone no deja poner en pantalla completa nada que no sea el <video>
    // solo. Ahí se simula: el recuadro se estira para cubrir toda la ventana.
    if (!pedir) {
      pantallaSimulada(recuadro, true);
      return;
    }

    var resultado;
    try {
      resultado = pedir.call(recuadro);
    } catch (e) {
      pantallaSimulada(recuadro, true);
      return;
    }

    if (resultado && typeof resultado.then === 'function') {
      resultado
        .then(function () { girarHorizontal(video); })
        .catch(function () { pantallaSimulada(recuadro, true); });
    }
  }

  function salirPantalla(recuadro) {
    if (recuadro.classList.contains('rep-pantalla-simulada')) {
      pantallaSimulada(recuadro, false);
      return;
    }
    var salir = document.exitFullscreen || document.webkitExitFullscreen;
    if (salir && pantallaActual()) {
      var resultado = salir.call(document);
      if (resultado && resultado.catch) resultado.catch(function () {});
    }
  }

  function pantallaSimulada(recuadro, prender) {
    recuadro.classList.toggle('rep-pantalla-simulada', prender);
    // Mientras dure, la página de atrás no hace scroll
    document.documentElement.classList.toggle('rep-sin-scroll', prender);
    marcarPantalla(recuadro, prender);
  }

  // Pone o quita la clase rep-pantalla y cambia el ícono del botón
  function marcarPantalla(recuadro, prender) {
    recuadro.classList.toggle('rep-pantalla', prender);
    var boton = recuadro.querySelector('.rep-btn-pantalla');
    if (boton) {
      boton.innerHTML = prender ? ICONOS.reducir : ICONOS.ampliar;
      boton.setAttribute('aria-label', prender ? 'Salir de pantalla completa' : 'Pantalla completa');
    }
    if (recuadro.ajustarLienzo) recuadro.ajustarLienzo();
  }

  // El navegador avisa cuando se entra o se sale de pantalla completa
  // (también si se sale con la tecla Esc o con el gesto de "atrás")
  function alCambiarPantalla() {
    var actual = pantallaActual();
    for (var i = 0; i < recuadros.length; i++) {
      if (recuadros[i].classList.contains('rep-pantalla-simulada')) continue;
      marcarPantalla(recuadros[i], actual === recuadros[i]);
    }
    if (!actual) soltarGiro();
  }
  document.addEventListener('fullscreenchange', alCambiarPantalla);
  document.addEventListener('webkitfullscreenchange', alCambiarPantalla);

  // Esc también cierra la pantalla completa simulada
  document.addEventListener('keydown', function (evento) {
    if (evento.key !== 'Escape') return;
    var simulada = document.querySelector('.rep-pantalla-simulada');
    if (simulada) pantallaSimulada(simulada, false);
  });

  // En Android, al entrar a pantalla completa se gira a lo ancho si el video
  // es horizontal, como hace YouTube. En computadora y iPhone esto no existe:
  // la promesa falla y simplemente no pasa nada.
  function girarHorizontal(video) {
    try {
      if (screen.orientation && screen.orientation.lock && video.videoWidth >= video.videoHeight) {
        screen.orientation.lock('landscape').catch(function () {});
      }
    } catch (e) {}
  }

  function soltarGiro() {
    try {
      if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
    } catch (e) {}
  }

  // ===============================================================
  // Utilidades
  // ===============================================================
  function crearBoton(clases, etiqueta, icono) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = clases;
    boton.setAttribute('aria-label', etiqueta);
    boton.innerHTML = icono;
    return boton;
  }

  // 75.3 segundos -> "1:15"
  function formato(segundos) {
    if (!isFinite(segundos)) segundos = 0;
    var m = Math.floor(segundos / 60);
    var s = Math.floor(segundos % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

})();
