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
    { id: 'john lester',       nombre: 'John Lester'       },
    { id: 'justin turner',     nombre: 'Justin Turner'     },
    { id: 'ramiro penia',      nombre: 'Ramiro Peña'       }
  ];

  var CLAVE = 'beisbarCartas';   // donde se guarda el progreso

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

  // TRIVIA: carta al azar. Puede tocar una repetida
  function darAleatoria() {
    var carta = LISTA[Math.floor(Math.random() * LISTA.length)];
    return sumar(carta);
  }

  // MEMORAMA: garantiza que sea una carta nueva
  // Devuelve null solo si ya completó las 12.
  function darNueva() {
    var faltan = lasQueFaltan();
    if (faltan.length === 0) return null;
    var carta = faltan[Math.floor(Math.random() * faltan.length)];
    return sumar(carta);
  }

  // Borra todo el progreso
  function reiniciar() {
    try { localStorage.removeItem(CLAVE); } catch (e) {}
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
    reiniciar: reiniciar
  };

})();
