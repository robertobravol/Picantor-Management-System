/*
 * storage.js - Capa de datos sobre localStorage.
 * No hay base de datos ni servidor: todo se guarda en el navegador bajo la clave CLAVE.
 */
const DB = (function () {
  const CLAVE = 'picantor_db_v1';
  const CLAVE_SESION = 'picantor_sesion';

  /* Nombre de la clave primaria de cada tabla (según el modelo entidad-relación). */
  const PK = {
    usuarios: 'id',
    clientes: 'id_cliente',
    proveedores: 'id_proveedor',
    insumos: 'id_insumo',
    compras: 'id_compra',
    detalle_compra: 'id_detalle_compra',
    recepciones: 'id_recepcion',
    detalle_recepcion: 'id_detalle_recepcion',
    productos: 'id_producto',
    presentaciones: 'id_presentacion',
    movimientos: 'id_movimiento',
    lotes: 'id_lote',
    detalle_lote: 'id_detalle_lote',
    consumo_insumo_lote: 'id_consumo',
    pedidos: 'id_pedido',
    detalle_pedido: 'id_detalle_pedido',
    asignacion_lote: 'id_asignacion',
    pagos: 'id_pago',
    documentos: 'id_documento',
    despachos: 'id_despacho',
    actividad: 'id_actividad'
  };

  let datos = null;

  function clonar(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function valido(d) {
    return !!d && Object.keys(PK).every(function (t) { return Array.isArray(d[t]); });
  }

  function guardar() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar en localStorage: ' + e.message);
    }
  }

  function cargar() {
    if (datos) return datos;
    try {
      const txt = localStorage.getItem(CLAVE);
      if (txt) datos = JSON.parse(txt);
    } catch (e) {
      datos = null;
    }
    if (!valido(datos)) {
      datos = clonar(DATOS_INICIALES);
      guardar();
    }
    return datos;
  }

  function tabla(nombre) {
    return cargar()[nombre];
  }

  function obtener(nombre, id) {
    const k = PK[nombre];
    const n = Number(id);
    return tabla(nombre).find(function (r) { return r[k] === n; });
  }

  function insertar(nombre, registro) {
    const k = PK[nombre];
    const t = tabla(nombre);
    const id = t.reduce(function (m, r) { return Math.max(m, r[k]); }, 0) + 1;
    const nuevo = Object.assign({}, registro);
    nuevo[k] = id;
    t.push(nuevo);
    return nuevo;
  }

  function actualizar(nombre, id, cambios) {
    const r = obtener(nombre, id);
    if (!r) throw new Error('Registro no encontrado.');
    Object.assign(r, cambios);
    return r;
  }

  /* Ejecuta fn; si lanza un error, deshace todos los cambios hechos en memoria. Si termina bien, guarda. */
  function transaccion(fn) {
    cargar();
    const copia = JSON.stringify(datos);
    try {
      const resultado = fn();
      guardar();
      return resultado;
    } catch (e) {
      datos = JSON.parse(copia);
      throw e;
    }
  }

  /* Borra los cambios y vuelve a los datos de datos.js. También cierra la sesión simulada. */
  function restaurar() {
    localStorage.removeItem(CLAVE);
    try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) { /* sin sesión */ }
    datos = null;
    cargar();
  }

  return {
    PK: PK,
    cargar: cargar,
    guardar: guardar,
    tabla: tabla,
    obtener: obtener,
    insertar: insertar,
    actualizar: actualizar,
    transaccion: transaccion,
    restaurar: restaurar
  };
})();
