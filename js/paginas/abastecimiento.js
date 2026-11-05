/*
 * abastecimiento.js - Módulo M02: pantallas S10/S11 (proveedores), S12/S13 (insumos), S14/S15/S16 (compras y recepciones).
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = { proveedores: iniciarProveedores, insumos: iniciarInsumos, compras: iniciarCompras };
  paginas[document.body.dataset.pagina]();
});

const $ = function (id) { return document.getElementById(id); };

/* ---------- Proveedores ---------- */
function iniciarProveedores() {
  const modal = UI.modal('modal');
  const form = $('form');

  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const fa = $('filtro-activo').value;
    const filas = DB.tabla('proveedores').filter(function (p) {
      const texto = [p.nombre, p.telefono, p.correo, p.direccion].join(' ').toLowerCase();
      return (!q || texto.indexOf(q) !== -1) && (fa === '' || (fa === '1') === p.activo);
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (p) {
      return '<tr><td>' + UI.h(p.nombre) + '</td><td>' + UI.h(p.telefono) + '</td><td>' + UI.h(p.correo) + '</td><td>' + UI.badgeActivo(p.activo) + '</td>' +
        '<td class="text-end text-nowrap"><button class="btn btn-outline-primary btn-sm" data-accion="editar" data-id="' + p.id_proveedor + '">Editar</button> ' +
        '<button class="btn btn-outline-secondary btn-sm" data-accion="toggle" data-id="' + p.id_proveedor + '">' + (p.activo ? 'Desactivar' : 'Activar') + '</button></td></tr>';
    }).join('') : UI.vacio(5);
  }

  function abrir(p) {
    form.reset();
    form.classList.remove('was-validated');
    $('modal-titulo').textContent = p ? 'Editar proveedor' : 'Nuevo proveedor';
    $('f-id').value = p ? p.id_proveedor : '';
    $('f-nombre').value = p ? p.nombre : '';
    $('f-telefono').value = p ? p.telefono : '';
    $('f-correo').value = p ? p.correo : '';
    $('f-direccion').value = p ? p.direccion : '';
    $('f-activo').checked = p ? p.activo : true;
    modal.show();
  }

  UI.delegar($('tbody'), {
    editar: function (id) { abrir(DB.obtener('proveedores', id)); },
    toggle: function (id) {
      UI.intentar(function () {
        DB.transaccion(function () {
          const p = DB.obtener('proveedores', id);
          p.activo = !p.activo;
        });
        render();
      });
    }
  });

  $('btn-nuevo').addEventListener('click', function () { abrir(null); });
  $('buscar').addEventListener('input', render);
  $('filtro-activo').addEventListener('change', render);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const id = $('f-id').value ? Number($('f-id').value) : null;
      const nombre = $('f-nombre').value.trim();
      DB.transaccion(function () {
        if (DB.tabla('proveedores').some(function (p) { return p.id_proveedor !== id && p.nombre.toLowerCase() === nombre.toLowerCase(); })) {
          throw new Error('Ya existe un proveedor con ese nombre.');
        }
        const datos = { nombre: nombre, telefono: $('f-telefono').value.trim(), correo: $('f-correo').value.trim(), direccion: $('f-direccion').value.trim(), activo: $('f-activo').checked };
        if (id) DB.actualizar('proveedores', id, datos); else DB.insertar('proveedores', datos);
      });
      modal.hide();
      UI.toast('Proveedor guardado.');
      render();
    });
  });

  render();
}

/* ---------- Insumos ---------- */
function iniciarInsumos() {
  const modal = UI.modal('modal');
  const form = $('form');
  $('f-unidad').innerHTML = UI.opciones(CATALOGOS.UNIDADES, function (x) { return x; }, function (x) { return x; }, '', 'Selecciona…');

  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const fa = $('filtro-activo').value;
    const filas = DB.tabla('insumos').filter(function (i) {
      return (!q || i.nombre.toLowerCase().indexOf(q) !== -1) && (fa === '' || (fa === '1') === i.activo);
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (i) {
      return '<tr><td>' + UI.h(i.nombre) + '</td><td>' + UI.h(i.unidad_medida) + '</td><td class="' + (i.existencia_actual <= 0 ? 'cero' : '') + '">' + UI.num(i.existencia_actual) + '</td><td>' + UI.badgeActivo(i.activo) + '</td>' +
        '<td class="text-end text-nowrap"><button class="btn btn-outline-primary btn-sm" data-accion="editar" data-id="' + i.id_insumo + '">Editar</button> ' +
        '<button class="btn btn-outline-secondary btn-sm" data-accion="toggle" data-id="' + i.id_insumo + '">' + (i.activo ? 'Desactivar' : 'Activar') + '</button></td></tr>';
    }).join('') : UI.vacio(5);
  }

  function abrir(i) {
    form.reset();
    form.classList.remove('was-validated');
    $('modal-titulo').textContent = i ? 'Editar insumo' : 'Nuevo insumo';
    $('f-id').value = i ? i.id_insumo : '';
    $('f-nombre').value = i ? i.nombre : '';
    $('f-unidad').value = i ? i.unidad_medida : '';
    $('f-activo').checked = i ? i.activo : true;
    modal.show();
  }

  UI.delegar($('tbody'), {
    editar: function (id) { abrir(DB.obtener('insumos', id)); },
    toggle: function (id) {
      UI.intentar(function () {
        DB.transaccion(function () {
          const i = DB.obtener('insumos', id);
          i.activo = !i.activo;
        });
        render();
      });
    }
  });

  $('btn-nuevo').addEventListener('click', function () { abrir(null); });
  $('buscar').addEventListener('input', render);
  $('filtro-activo').addEventListener('change', render);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const id = $('f-id').value ? Number($('f-id').value) : null;
      const nombre = $('f-nombre').value.trim();
      DB.transaccion(function () {
        if (DB.tabla('insumos').some(function (i) { return i.id_insumo !== id && i.nombre.toLowerCase() === nombre.toLowerCase(); })) {
          throw new Error('Ya existe un insumo con ese nombre.');
        }
        if (id) {
          DB.actualizar('insumos', id, { nombre: nombre, unidad_medida: $('f-unidad').value, activo: $('f-activo').checked });
        } else {
          DB.insertar('insumos', { nombre: nombre, unidad_medida: $('f-unidad').value, existencia_actual: 0, activo: $('f-activo').checked });
        }
      });
      modal.hide();
      UI.toast('Insumo guardado.');
      render();
    });
  });

  render();
}

/* ---------- Compras y recepciones ---------- */
function iniciarCompras() {
  const modalCompra = UI.modal('modal-compra');
  const modalDetalle = UI.modal('modal-detalle');
  const modalRecepcion = UI.modal('modal-recepcion');
  const formCompra = $('form-compra');
  const formRecepcion = $('form-recepcion');

  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const fe = $('filtro-estado').value;
    const filas = DB.tabla('compras').slice().sort(function (a, b) { return b.id_compra - a.id_compra; }).filter(function (c) {
      const prov = DB.obtener('proveedores', c.proveedor_id);
      const texto = ('#' + c.id_compra + ' ' + (prov ? prov.nombre : '')).toLowerCase();
      return (!q || texto.indexOf(q) !== -1) && (!fe || Logica.estadoRecepcion(c.id_compra) === fe);
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (c) {
      const prov = DB.obtener('proveedores', c.proveedor_id);
      const estado = Logica.estadoRecepcion(c.id_compra);
      return '<tr><td>#' + c.id_compra + '</td><td>' + UI.h(prov ? prov.nombre : '—') + '</td><td>' + UI.fecha(c.fecha_compra) + '</td><td>' + UI.h(UI.nombreUsuario(c.registrado_por)) + '</td><td>' + UI.badge(estado) + '</td>' +
        '<td class="text-end text-nowrap"><button class="btn btn-outline-secondary btn-sm" data-accion="detalle" data-id="' + c.id_compra + '">Ver detalle</button> ' +
        '<button class="btn btn-outline-primary btn-sm" data-accion="recibir" data-id="' + c.id_compra + '"' + (estado === 'COMPLETA' ? ' disabled' : '') + '>Registrar recepción</button></td></tr>';
    }).join('') : UI.vacio(6);
  }

  /* Detalle de una compra (S14, solo lectura). */
  function verDetalle(id) {
    const c = DB.obtener('compras', id);
    const prov = DB.obtener('proveedores', c.proveedor_id);
    const filas = Logica.detallesCompra(id).map(function (d) {
      const ins = DB.obtener('insumos', d.insumo_id);
      return '<tr><td>' + UI.h(ins.nombre) + '</td><td>' + UI.num(d.cantidad_comprada) + ' ' + UI.h(ins.unidad_medida) + '</td><td>' + UI.num(Logica.recibido(d.id_detalle_compra)) + '</td><td>' + UI.num(Logica.pendiente(d)) + '</td></tr>';
    }).join('');
    const recepciones = DB.tabla('recepciones').filter(function (r) { return r.compra_id === id; }).map(function (r) {
      return '<li>Recepción #' + r.id_recepcion + ' – ' + UI.fecha(r.fecha_recepcion) + ' – registrada por ' + UI.h(UI.nombreUsuario(r.registrado_por)) + '</li>';
    }).join('');
    $('detalle-contenido').innerHTML =
      '<dl class="dato-lectura row"><dt class="col-sm-4">Compra</dt><dd class="col-sm-8">#' + c.id_compra + '</dd>' +
      '<dt class="col-sm-4">Proveedor</dt><dd class="col-sm-8">' + UI.h(prov ? prov.nombre : '—') + '</dd>' +
      '<dt class="col-sm-4">Fecha de compra</dt><dd class="col-sm-8">' + UI.fecha(c.fecha_compra) + '</dd>' +
      '<dt class="col-sm-4">Registrada por</dt><dd class="col-sm-8">' + UI.h(UI.nombreUsuario(c.registrado_por)) + '</dd></dl>' +
      '<table class="table table-sm"><thead><tr><th>Insumo</th><th>Comprado</th><th>Recibido</th><th>Pendiente</th></tr></thead><tbody>' + filas + '</tbody></table>' +
      '<h3 class="h6">Recepciones</h3>' + (recepciones ? '<ul>' + recepciones + '</ul>' : '<p class="text-muted">Aún no hay recepciones.</p>');
    modalDetalle.show();
  }

  /* ----- Nueva compra (S15) ----- */
  function filaCompra() {
    const insumos = DB.tabla('insumos').filter(function (i) { return i.activo; });
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><select class="form-select form-select-sm sel-insumo" required>' +
      UI.opciones(insumos, function (i) { return i.id_insumo; }, function (i) { return i.nombre + ' (' + i.unidad_medida + ')'; }, '', 'Selecciona…') + '</select></td>' +
      '<td><input type="number" class="form-control form-control-sm cantidad" min="0.001" step="0.001" required></td>' +
      '<td><button type="button" class="btn btn-outline-danger btn-sm quitar">Quitar</button></td>';
    $('filas-compra').appendChild(tr);
  }

  $('btn-nuevo').addEventListener('click', function () {
    formCompra.reset();
    formCompra.classList.remove('was-validated');
    $('c-proveedor').innerHTML = UI.opciones(DB.tabla('proveedores').filter(function (p) { return p.activo; }),
      function (p) { return p.id_proveedor; }, function (p) { return p.nombre; }, '', 'Selecciona…');
    $('c-fecha').value = UI.hoy();
    $('filas-compra').innerHTML = '';
    filaCompra();
    modalCompra.show();
  });
  $('btn-add-linea').addEventListener('click', filaCompra);
  $('filas-compra').addEventListener('click', function (e) {
    if (e.target.classList.contains('quitar')) {
      if ($('filas-compra').children.length > 1) e.target.closest('tr').remove();
      else UI.toast('La compra necesita al menos un insumo.', 'warning');
    }
  });

  formCompra.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(formCompra)) return;
    UI.intentar(function () {
      const lineas = Array.from($('filas-compra').children).map(function (tr) {
        return { insumo_id: Number(tr.querySelector('.sel-insumo').value), cantidad: Number(tr.querySelector('.cantidad').value) };
      });
      Logica.crearCompra({ proveedor_id: Number($('c-proveedor').value), fecha_compra: $('c-fecha').value, lineas: lineas });
      modalCompra.hide();
      UI.toast('Compra registrada.');
      render();
    });
  });

  /* ----- Recepción (S16) ----- */
  function abrirRecepcion(id) {
    formRecepcion.reset();
    formRecepcion.classList.remove('was-validated');
    $('rc-compra-id').value = id;
    $('rc-compra-texto').textContent = '#' + id;
    $('rc-fecha').value = UI.hoy();
    $('filas-recepcion').innerHTML = Logica.detallesCompra(id).map(function (d) {
      const ins = DB.obtener('insumos', d.insumo_id);
      const pend = Logica.pendiente(d);
      return '<tr data-detalle="' + d.id_detalle_compra + '"><td>' + UI.h(ins.nombre) + ' (' + UI.h(ins.unidad_medida) + ')</td><td>' + UI.num(d.cantidad_comprada) + '</td><td>' + UI.num(Logica.recibido(d.id_detalle_compra)) + '</td><td>' + UI.num(pend) + '</td>' +
        '<td><input type="number" class="form-control form-control-sm cantidad" min="0" max="' + pend + '" step="0.001" value="' + pend + '"' + (pend <= 0 ? ' disabled' : '') + '></td></tr>';
    }).join('');
    modalRecepcion.show();
  }

  formRecepcion.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(formRecepcion)) return;
    UI.intentar(function () {
      const lineas = Array.from($('filas-recepcion').children).map(function (tr) {
        return { detalle_compra_id: Number(tr.dataset.detalle), cantidad: Number(tr.querySelector('.cantidad').value) || 0 };
      });
      Logica.registrarRecepcion({ compra_id: Number($('rc-compra-id').value), fecha_recepcion: $('rc-fecha').value, lineas: lineas });
      modalRecepcion.hide();
      UI.toast('Recepción registrada. Las existencias de insumos se actualizaron.');
      render();
    });
  });

  UI.delegar($('tbody'), {
    detalle: verDetalle,
    recibir: abrirRecepcion
  });
  $('buscar').addEventListener('input', render);
  $('filtro-estado').addEventListener('change', render);

  render();
}
