/*
 * inventario.js - Módulo M03: S20 (catálogo), S21/S22/S23 (productos y presentaciones), S24 (existencias), S25 (movimientos).
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = { catalogo: iniciarCatalogo, productos: iniciarProductos, existencias: iniciarExistencias, movimientos: iniciarMovimientos };
  paginas[document.body.dataset.pagina]();
});

const $ = function (id) { return document.getElementById(id); };

/* ---------- S20 Catálogo (público) ---------- */
function iniciarCatalogo() {
  const s = Auth.sesion();

  function botonPedir(pr) {
    if (!s) return '<a class="btn btn-outline-secondary btn-sm" href="' + Auth.ruta('index.html') + '">Iniciar sesión</a>';
    if (s.rol === 'cliente') return '<a class="btn btn-picantor btn-sm" href="nuevo-pedido.html?presentacion=' + pr.id_presentacion + '">Agregar al pedido</a>';
    return '';
  }

  const items = DB.tabla('productos').filter(function (p) { return p.activo; }).map(function (p) {
    return { p: p, pres: DB.tabla('presentaciones').filter(function (x) { return x.producto_id === p.id_producto && x.activo; }) };
  }).filter(function (x) { return x.pres.length; });

  $('lista').innerHTML = items.length ? items.map(function (x) {
    return '<div class="col-md-6 col-lg-4"><div class="card h-100 shadow-sm"><div class="card-body">' +
      '<h2 class="h5">' + UI.h(x.p.nombre) + '</h2><p class="text-muted small">' + UI.h(x.p.descripcion || '') + '</p>' +
      '<ul class="list-group list-group-flush">' + x.pres.map(function (pr) {
        return '<li class="list-group-item d-flex justify-content-between align-items-center px-0"><span>' + UI.h(pr.nombre) + '<br><strong>' + UI.moneda(pr.precio) + '</strong></span>' + botonPedir(pr) + '</li>';
      }).join('') + '</ul></div></div></div>';
  }).join('') : '<p class="text-muted">No hay productos activos por ahora.</p>';
}

/* ---------- S21 a S23 Productos y presentaciones ---------- */
function iniciarProductos() {
  const modalProd = UI.modal('modal-producto');
  const modalPres = UI.modal('modal-presentacion');
  const formProd = $('form-producto');
  const formPres = $('form-presentacion');

  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const productos = DB.tabla('productos').filter(function (p) {
      const pres = DB.tabla('presentaciones').filter(function (x) { return x.producto_id === p.id_producto; });
      const texto = (p.nombre + ' ' + pres.map(function (x) { return x.nombre; }).join(' ')).toLowerCase();
      return !q || texto.indexOf(q) !== -1;
    });
    $('contenedor').innerHTML = productos.length ? productos.map(function (p) {
      const pres = DB.tabla('presentaciones').filter(function (x) { return x.producto_id === p.id_producto; });
      return '<div class="tabla-card p-3 mb-3"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">' +
        '<h2 class="h5 mb-0">' + UI.h(p.nombre) + ' ' + UI.badgeActivo(p.activo) + (pres.length ? '' : ' <span class="badge text-bg-warning">Sin presentaciones</span>') + '</h2>' +
        '<div><button class="btn btn-outline-primary btn-sm" data-accion="editar-producto" data-id="' + p.id_producto + '">Editar</button> ' +
        '<button class="btn btn-outline-secondary btn-sm" data-accion="toggle-producto" data-id="' + p.id_producto + '">' + (p.activo ? 'Desactivar' : 'Activar') + '</button> ' +
        '<button class="btn btn-picantor btn-sm" data-accion="nueva-presentacion" data-id="' + p.id_producto + '">Nueva presentación</button></div></div>' +
        '<p class="text-muted small mb-2">' + UI.h(p.descripcion || '') + '</p>' +
        '<div class="table-responsive"><table class="table table-sm align-middle mb-0"><thead><tr><th>Presentación</th><th>Precio</th><th>Existencia</th><th>Activa</th><th class="text-end">Acciones</th></tr></thead><tbody>' +
        (pres.length ? pres.map(function (x) {
          return '<tr><td>' + UI.h(x.nombre) + '</td><td>' + UI.moneda(x.precio) + '</td><td class="' + (x.existencia_actual <= 0 ? 'cero' : '') + '">' + x.existencia_actual + '</td><td>' + UI.badgeActivo(x.activo) + '</td>' +
            '<td class="text-end text-nowrap"><button class="btn btn-outline-primary btn-sm" data-accion="editar-presentacion" data-id="' + x.id_presentacion + '">Editar</button> ' +
            '<button class="btn btn-outline-secondary btn-sm" data-accion="toggle-presentacion" data-id="' + x.id_presentacion + '">' + (x.activo ? 'Desactivar' : 'Activar') + '</button></td></tr>';
        }).join('') : UI.vacio(5, 'Este producto aún no tiene presentaciones.')) + '</tbody></table></div></div>';
    }).join('') : '<p class="text-muted">No hay productos que coincidan.</p>';
  }

  function abrirProducto(p) {
    formProd.reset();
    formProd.classList.remove('was-validated');
    $('modal-producto-titulo').textContent = p ? 'Editar producto' : 'Nuevo producto';
    $('fp-id').value = p ? p.id_producto : '';
    $('fp-nombre').value = p ? p.nombre : '';
    $('fp-descripcion').value = p ? p.descripcion : '';
    $('fp-activo').checked = p ? p.activo : true;
    modalProd.show();
  }

  function abrirPresentacion(pr, productoId) {
    formPres.reset();
    formPres.classList.remove('was-validated');
    $('modal-presentacion-titulo').textContent = pr ? 'Editar presentación' : 'Nueva presentación';
    $('fr-producto').innerHTML = UI.opciones(DB.tabla('productos'), function (p) { return p.id_producto; }, function (p) { return p.nombre; }, pr ? pr.producto_id : productoId, 'Selecciona…');
    $('fr-id').value = pr ? pr.id_presentacion : '';
    $('fr-nombre').value = pr ? pr.nombre : '';
    $('fr-precio').value = pr ? pr.precio : '';
    $('fr-activo').checked = pr ? pr.activo : true;
    modalPres.show();
  }

  UI.delegar($('contenedor'), {
    'editar-producto': function (id) { abrirProducto(DB.obtener('productos', id)); },
    'toggle-producto': function (id) {
      UI.intentar(function () {
        DB.transaccion(function () { const p = DB.obtener('productos', id); p.activo = !p.activo; });
        render();
      });
    },
    'nueva-presentacion': function (id) { abrirPresentacion(null, id); },
    'editar-presentacion': function (id) { abrirPresentacion(DB.obtener('presentaciones', id)); },
    'toggle-presentacion': function (id) {
      UI.intentar(function () {
        DB.transaccion(function () { const x = DB.obtener('presentaciones', id); x.activo = !x.activo; });
        render();
      });
    }
  });

  $('btn-nuevo-producto').addEventListener('click', function () { abrirProducto(null); });
  $('buscar').addEventListener('input', render);

  formProd.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(formProd)) return;
    UI.intentar(function () {
      const id = $('fp-id').value ? Number($('fp-id').value) : null;
      const nombre = $('fp-nombre').value.trim();
      DB.transaccion(function () {
        if (DB.tabla('productos').some(function (p) { return p.id_producto !== id && p.nombre.toLowerCase() === nombre.toLowerCase(); })) {
          throw new Error('Ya existe un producto con ese nombre.');
        }
        const datos = { nombre: nombre, descripcion: $('fp-descripcion').value.trim(), activo: $('fp-activo').checked };
        if (id) DB.actualizar('productos', id, datos); else DB.insertar('productos', datos);
      });
      modalProd.hide();
      UI.toast('Producto guardado.');
      render();
    });
  });

  formPres.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(formPres)) return;
    UI.intentar(function () {
      const id = $('fr-id').value ? Number($('fr-id').value) : null;
      const productoId = Number($('fr-producto').value);
      const nombre = $('fr-nombre').value.trim();
      const precio = Number($('fr-precio').value);
      DB.transaccion(function () {
        if (!(precio > 0)) throw new Error('El precio debe ser mayor que cero.');
        if (DB.tabla('presentaciones').some(function (x) { return x.id_presentacion !== id && x.producto_id === productoId && x.nombre.toLowerCase() === nombre.toLowerCase(); })) {
          throw new Error('Ese producto ya tiene una presentación con ese nombre.');
        }
        if (id) {
          DB.actualizar('presentaciones', id, { producto_id: productoId, nombre: nombre, precio: precio, activo: $('fr-activo').checked });
        } else {
          DB.insertar('presentaciones', { producto_id: productoId, nombre: nombre, precio: precio, existencia_actual: 0, activo: $('fr-activo').checked });
        }
      });
      modalPres.hide();
      UI.toast('Presentación guardada.');
      render();
    });
  });

  render();
}

/* ---------- S24 Existencias ---------- */
function iniciarExistencias() {
  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const insumos = DB.tabla('insumos').filter(function (i) { return !q || i.nombre.toLowerCase().indexOf(q) !== -1; });
    const pres = DB.tabla('presentaciones').filter(function (p) { return !q || UI.nombrePresentacion(p.id_presentacion).toLowerCase().indexOf(q) !== -1; });
    $('tbody-insumos').innerHTML = insumos.length ? insumos.map(function (i) {
      return '<tr><td>' + UI.h(i.nombre) + '</td><td>' + UI.h(i.unidad_medida) + '</td><td class="' + (i.existencia_actual <= 0 ? 'cero' : '') + '">' + UI.num(i.existencia_actual) + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="movimientos.html?insumo=' + i.id_insumo + '">Ver movimientos</a></td></tr>';
    }).join('') : UI.vacio(4);
    $('tbody-presentaciones').innerHTML = pres.length ? pres.map(function (p) {
      return '<tr><td>' + UI.h(UI.nombrePresentacion(p.id_presentacion)) + '</td><td class="' + (p.existencia_actual <= 0 ? 'cero' : '') + '">' + p.existencia_actual + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="movimientos.html?presentacion=' + p.id_presentacion + '">Ver movimientos</a></td></tr>';
    }).join('') : UI.vacio(3);
  }
  $('buscar').addEventListener('input', render);
  render();
}

/* ---------- S25 Movimientos de inventario (solo consulta) ---------- */
function iniciarMovimientos() {
  const items = []
    .concat(DB.tabla('insumos').map(function (i) { return { v: 'i:' + i.id_insumo, t: 'Insumo: ' + i.nombre }; }))
    .concat(DB.tabla('presentaciones').map(function (p) { return { v: 'p:' + p.id_presentacion, t: 'Presentación: ' + UI.nombrePresentacion(p.id_presentacion) }; }));
  $('m-item').innerHTML = UI.opciones(items, function (x) { return x.v; }, function (x) { return x.t; }, '', 'Todos');
  if (UI.param('insumo')) $('m-item').value = 'i:' + UI.param('insumo');
  if (UI.param('presentacion')) $('m-item').value = 'p:' + UI.param('presentacion');

  function render() {
    const tipo = $('m-tipo').value;
    const origen = $('m-origen').value;
    const item = $('m-item').value;
    const desde = $('m-desde').value;
    const hasta = $('m-hasta').value;
    const filas = DB.tabla('movimientos').slice().sort(function (a, b) { return b.id_movimiento - a.id_movimiento; }).filter(function (m) {
      const clave = m.insumo_id != null ? 'i:' + m.insumo_id : 'p:' + m.presentacion_id;
      const dia = m.fecha_hora.slice(0, 10);
      return (!tipo || m.tipo_movimiento === tipo) && (!origen || m.tipo_origen === origen) && (!item || clave === item) &&
        (!desde || dia >= desde) && (!hasta || dia <= hasta);
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (m) {
      const nombre = m.insumo_id != null ? 'Insumo: ' + UI.nombreInsumo(m.insumo_id) : 'Presentación: ' + UI.nombrePresentacion(m.presentacion_id);
      return '<tr><td>' + UI.fecha(m.fecha_hora) + '</td><td>' + (m.tipo_movimiento === 'ENTRADA' ? '<span class="badge text-bg-success">ENTRADA</span>' : '<span class="badge text-bg-danger">SALIDA</span>') + '</td>' +
        '<td>' + UI.h(nombre) + '</td><td>' + UI.num(m.cantidad) + '</td><td>' + UI.h(m.tipo_origen) + '</td><td>' + m.id_origen + '</td><td>' + UI.h(UI.nombreUsuario(m.registrado_por)) + '</td></tr>';
    }).join('') : UI.vacio(7);
    $('contador').textContent = filas.length + ' movimiento(s)';
  }

  $('filtros').addEventListener('submit', function (e) { e.preventDefault(); render(); });
  $('btn-limpiar').addEventListener('click', function () {
    $('filtros').reset();
    render();
  });
  render();
}
