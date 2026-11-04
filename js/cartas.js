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

  var CLAVE = 'beisbarCartas';

  // Repetidas: se empieza con 5, el memorama cuesta 2 y se ganan en la trivia
  var CLAVE_REPETIDAS  = 'beisbarRepetidas';
  var REPETIDAS_INICIO = 5;
  var COSTO_MEMORAMA   = 2;

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
      // En incógnito se juega sin guardar
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

  function leerRepetidas() {
    try {
      var crudo = localStorage.getItem(CLAVE_REPETIDAS);

      // Usuario nuevo: recibe sus 5 repetidas
      if (crudo === null) {
        guardarRepetidas(REPETIDAS_INICIO);
        return REPETIDAS_INICIO;
      }

      var n = parseInt(crudo, 10);
      return (isNaN(n) || n < 0) ? 0 : n;
    } catch (e) {
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

  function puedeJugarMemorama() {
    return leerRepetidas() >= COSTO_MEMORAMA;
  }

  // No cobra si no alcanza
  function pagarMemorama() {
    var n = leerRepetidas();
    if (n < COSTO_MEMORAMA) return false;
    guardarRepetidas(n - COSTO_MEMORAMA);
    return true;
  }

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

  function contarDistintas() {
    var datos = leer();
    var n = 0;
    for (var id in datos) {
      if (datos[id] > 0) n++;
    }
    return n;
  }

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

  function sumar(carta) {
    var datos = leer();
    var yaLaTenia = !!datos[carta.id];
    datos[carta.id] = (datos[carta.id] || 0) + 1;
    guardar(datos);
    return { carta: carta, esNueva: !yaLaTenia };
  }

  // Trivia: carta al azar; si ya la tenía, +1 repetida
  function darAleatoria() {
    var carta = LISTA[Math.floor(Math.random() * LISTA.length)];
    var resultado = sumar(carta);

    if (!resultado.esNueva) {
      guardarRepetidas(leerRepetidas() + 1);
    }

    resultado.repetidas = leerRepetidas();
    return resultado;
  }

  // Memorama: siempre una carta nueva
  function darNueva() {
    var faltan = lasQueFaltan();
    if (faltan.length === 0) return null;
    var carta = faltan[Math.floor(Math.random() * faltan.length)];
    return sumar(carta);
  }

  // Pinta la pastilla de repetidas; si subió, da un saltito
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
      void elemento.offsetWidth;
      elemento.classList.add('sube');
    }
  }

  // Para probar desde cero: Cartas.reiniciar() en la consola
  function reiniciar() {
    try {
      localStorage.removeItem(CLAVE);
      localStorage.removeItem(CLAVE_REPETIDAS);
    } catch (e) {}
  }

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

    COSTO_MEMORAMA: COSTO_MEMORAMA,
    repetidas: leerRepetidas,
    puedeJugarMemorama: puedeJugarMemorama,
    pagarMemorama: pagarMemorama,
    pintarIndicador: pintarIndicador
  };

})();
