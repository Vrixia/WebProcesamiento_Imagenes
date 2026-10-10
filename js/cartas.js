(function () {

  var LISTA = [
    { id: 'adonis medina',     nombre: 'Adonis Medina'     },
    { id: 'adrian horta',      nombre: 'Adrián Horta'      },
    { id: 'aldo montes',       nombre: 'Aldo Montes'       },
    { id: 'alejandro castro',  nombre: 'Alejandro Castro'  },
    { id: 'ali castillo',      nombre: 'Alí Castillo'      },
    { id: 'austin pope',       nombre: 'Austin Pope'       },
    { id: 'cade gota',         nombre: 'Cade Gotta'        },
    { id: 'edward olivares',   nombre: 'Edward Olivares'   },
    { id: 'hernan perez',      nombre: 'Hernán Pérez'      },
    { id: 'john lester',       nombre: 'Josh Lester'       },
    { id: 'justin turner',     nombre: 'Justin Turner'     },
    { id: 'ramiro penia',      nombre: 'Ramiro Peña'       }
  ];

  var CLAVE = 'beisbarCartas';   // donde se guarda la colección

  /* ------------------------------------------------------------------
     CARTAS REPETIDAS (los "comodines")

     Son las fichas con las que se paga la entrada al memorama.
       - Todo usuario nuevo arranca con 5.
       - Entrar al memorama cuesta 2, se gane o se pierda.
       - La única forma de ganar más es en la trivia: si la carta que
         te toca ya la tenías en la colección, se te suma 1.
  ------------------------------------------------------------------ */
  var CLAVE_REPETIDAS  = 'beisbarRepetidas';
  var REPETIDAS_INICIO = 5;   // con cuántas empieza un usuario nuevo
  var COSTO_MEMORAMA   = 2;   // cuántas cuesta una partida de memorama

  function rutaThumb(id, base) {
    return (base || '') + 'imagenes/Coleccion/thumbs/' + encodeURIComponent(id) + '.png';
  }
  function rutaGrande(id, base) {
    return (base || '') + 'imagenes/Coleccion/' + encodeURIComponent(id) + '.png';
  }
  function rutaModelo(id, base) {
    return (base || '') + 'Modelos3D/Cartas3D/' + encodeURIComponent(id) + '.glb';
  }
  function rutaReverso(base) {
    return (base || '') + 'imagenes/Coleccion/thumbs/LogoReversoCartasGrande.png';
  }

  function leer() {
    try {
      var crudo = localStorage.getItem(CLAVE);
      if (!crudo) return {};
      var datos = JSON.parse(crudo);
      return (datos && typeof datos === 'object') ? datos : {};
    } catch (e) {
      // Modo incógnito o almacenamiento bloqueado: se juega sin guardar
      return {};
    }
  }

  function guardar(datos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ----- Cartas repetidas -----

  function leerRepetidas() {
    try {
      var crudo = localStorage.getItem(CLAVE_REPETIDAS);

      // null = nunca se ha guardado nada, o sea que es un usuario nuevo:
      // se le entregan sus 5 de arranque y quedan guardadas.
      if (crudo === null) {
        guardarRepetidas(REPETIDAS_INICIO);
        return REPETIDAS_INICIO;
      }

      var n = parseInt(crudo, 10);
      return (isNaN(n) || n < 0) ? 0 : n;
    } catch (e) {
      // Modo incógnito: no se puede guardar, pero igual deja jugar
      return REPETIDAS_INICIO;
    }
  }

  function guardarRepetidas(n) {
    try {
      localStorage.setItem(CLAVE_REPETIDAS, String(n));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ¿Alcanza para entrar al memorama?
  function puedeJugarMemorama() {
    return leerRepetidas() >= COSTO_MEMORAMA;
  }

  // Cobra la entrada del memorama. Devuelve false si no alcanzaba
  // (en ese caso no descuenta nada).
  function pagarMemorama() {
    var n = leerRepetidas();
    if (n < COSTO_MEMORAMA) return false;
    guardarRepetidas(n - COSTO_MEMORAMA);
    return true;
  }

  // Consultas

  function buscar(id) {
    for (var i = 0; i < LISTA.length; i++) {
      if (LISTA[i].id === id) return LISTA[i];
    }
    return null;
  }

  function tiene(id) {
    var datos = leer();
    return !!datos[id];
  }

  // Cuántas cartas distintas tiene (X / 12)
  function contarDistintas() {
    var datos = leer();
    var n = 0;
    for (var id in datos) {
      if (datos[id] > 0) n++;
    }
    return n;
  }

  // Cuántas cartas tiene en total, contando repetidas
  function contarTotal() {
    var datos = leer();
    var n = 0;
    for (var id in datos) n += datos[id];
    return n;
  }

  function lasQueFaltan() {
    var datos = leer();
    var faltan = [];
    for (var i = 0; i < LISTA.length; i++) {
      if (!datos[LISTA[i].id]) faltan.push(LISTA[i]);
    }
    return faltan;
  }

  function tieneTodas() {
    return lasQueFaltan().length === 0;
  }

  // Entregar cartas
  function sumar(carta) {
    var datos = leer();
    var yaLaTenia = !!datos[carta.id];
    datos[carta.id] = (datos[carta.id] || 0) + 1;
    guardar(datos);
    return { carta: carta, esNueva: !yaLaTenia };
  }

  // TRIVIA: carta al azar. Puede tocar una que el jugador ya tenga.
  // Cuando eso pasa, en vez de una carta nueva se lleva +1 carta repetida.
  function darAleatoria() {
    var carta = LISTA[Math.floor(Math.random() * LISTA.length)];
    var resultado = sumar(carta);

    if (!resultado.esNueva) {
      guardarRepetidas(leerRepetidas() + 1);
    }

    resultado.repetidas = leerRepetidas();   // cuántas lleva ya
    return resultado;
  }

  // MEMORAMA: garantiza que sea una carta nueva
  // Devuelve null solo si ya completó las 12.
  function darNueva() {
    var faltan = lasQueFaltan();
    if (faltan.length === 0) return null;
    var carta = faltan[Math.floor(Math.random() * faltan.length)];
    return sumar(carta);
  }

  // -----------------------------------------------------------------
  // INDICADOR DE CARTAS REPETIDAS
  // Pinta dentro de "elemento" una pastilla con dos reversos de carta
  // encimados y el número de repetidas. Lo usan la colección, la trivia
  // y el memorama, así se ve igual en todos lados.
  //   elemento -> el contenedor (por ejemplo un <div class="repetidas-indicador">)
  //   anterior -> (opcional) cuántas había antes; si ahora hay más, el
  //               indicador da un saltito para que se note que subió.
  // -----------------------------------------------------------------
  function pintarIndicador(elemento, anterior) {
    if (!elemento) return;
    var n = leerRepetidas();
    var reverso = rutaReverso();

    elemento.innerHTML =
      '<span class="repetidas-icono" aria-hidden="true">' +
        '<img src="' + reverso + '" alt=""><img src="' + reverso + '" alt="">' +
      '</span>' +
      '<span class="repetidas-num">' + n + '</span>' +
      '<span class="repetidas-txt">' + (n === 1 ? 'repetida' : 'repetidas') + '</span>';

    elemento.setAttribute('role', 'img');
    elemento.setAttribute('aria-label', 'Cartas repetidas: ' + n);

    if (typeof anterior === 'number' && n > anterior) {
      elemento.classList.remove('sube');
      void elemento.offsetWidth;          // reinicia la animación
      elemento.classList.add('sube');
    }
  }

  // Borra todo el progreso: colección y cartas repetidas.
  // Sirve para probar la página desde cero (Cartas.reiniciar() en la consola).
  function reiniciar() {
    try {
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_REPETIDAS);
    } catch (e) {}
  }

  // -----------------------------------------------------------------
  window.Cartas = {
    LISTA: LISTA,
    rutaThumb: rutaThumb,
    rutaGrande: rutaGrande,
    rutaModelo: rutaModelo,
    rutaReverso: rutaReverso,
    buscar: buscar,
    tiene: tiene,
    contarDistintas: contarDistintas,
    contarTotal: contarTotal,
    lasQueFaltan: lasQueFaltan,
    tieneTodas: tieneTodas,
    darAleatoria: darAleatoria,
    darNueva: darNueva,
    reiniciar: reiniciar,

    // Cartas repetidas (comodines del memorama)
    COSTO_MEMORAMA: COSTO_MEMORAMA,
    repetidas: leerRepetidas,
    puedeJugarMemorama: puedeJugarMemorama,
    pagarMemorama: pagarMemorama,
    pintarIndicador: pintarIndicador
  };

})();
