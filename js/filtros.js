/* ------------------------------------------------------------------
   filtros.js — filtros de color para los videos

   Cada tarjeta de video (.video-card) tiene sus propios botones.
   Al picar un boton se le aplica un filtro CSS al recuadro del video
   (.video-stage); como el filtro va en el contenedor, afecta a todo
   lo que esté adentro, ya sea el <video> real o el dibujo temporal.

   Picar el mismo boton otra vez quita el filtro, para poder
   comparar con el video original.
------------------------------------------------------------------ */
(function () {

  // Cada filtro es una receta de funciones CSS.
  // sepia() tiñe la imagen de un café parejo, saturate() sube la
  // intensidad de ese tinte y hue-rotate() lo mueve al color que
  // queremos: hacia el azul para el frío, hacia el naranja para el cálido.
  var FILTROS = {
    deportivo: 'saturate(1.8) contrast(1.3)',
    borroso:   'blur(4px)',
    frio:      'sepia(0.35) saturate(1.8) hue-rotate(165deg)',
    calido:    'sepia(0.4) saturate(1.9) hue-rotate(-15deg)'
  };

  var tarjetas = document.querySelectorAll('.video-card');

  for (var i = 0; i < tarjetas.length; i++) {
    prepararTarjeta(tarjetas[i]);
  }

  function prepararTarjeta(tarjeta) {
    var recuadro = tarjeta.querySelector('.video-stage');
    var botones  = tarjeta.querySelectorAll('.video-filters button');

    if (!recuadro) return;

    for (var j = 0; j < botones.length; j++) {
      // Se usa una función aparte para que cada botón recuerde cuál es el suyo
      conectar(botones[j], botones, recuadro);
    }
  }

  function conectar(boton, todosLosBotones, recuadro) {
    boton.addEventListener('click', function () {

      var nombre = boton.dataset.filtro;
      var yaEstaba = boton.classList.contains('is-active');

      // Primero se apagan todos los botones de esta tarjeta,
      // porque solo puede haber un filtro a la vez
      for (var k = 0; k < todosLosBotones.length; k++) {
        todosLosBotones[k].classList.remove('is-active');
      }

      if (yaEstaba) {
        // Estaba prendido: se apaga y el video queda sin filtro
        recuadro.style.filter = '';
        return;
      }

      boton.classList.add('is-active');
      recuadro.style.filter = FILTROS[nombre] || '';
    });
  }

})();
