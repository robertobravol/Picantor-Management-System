/*
 * produccion.js - Módulo M04: S26 (lotes), S27 (registro de lote) y S28 (trazabilidad de un lote).
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = { lotes: iniciarLotes, trazabilidad: iniciarTrazabilidad };
  paginas[document.body.dataset.pagina]();
});

const $ = function (id) { return document.getElementById(id); };

function iniciarLotes() {
  const modal = UI.modal('modal');
  const form = $('form');

  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const filas = DB.tabla('lotes').slice().sort(function (a, b) { return b.id_lote - a.id_lote; }).filter(function (l) {
      return !q || l.codigo_lote.toLowerCase().indexOf(q) !== -1;
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (l) {
      return '<tr><td>' + UI.h(l.codigo_lote) + '</td><td>' + UI.fecha(l.fecha_elaboracion) + '</td><td>' + UI.fecha(l.fecha_caducidad) + '</td><td>' + UI.h(UI.nombreUsuario(l.registrado_por)) + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="trazabilidad.html?id=' + l.id_lote + '">Ver trazabilidad</a></td></tr>';
    }).join('') : UI.vacio(5);
  }

  function filaProduccion() {
    const pres = DB.tabla('presentaciones').filter(function (p) { return p.activo; });
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><select class="form-select form-select-sm sel-pres" required>' +
      UI.opciones(pres, function (p) { return p.id_presentacion; }, function (p) { return UI.nombrePresentacion(p.id_presentacion); }, '', 'Selecciona…') + '</select></td>' +
      '<td><input type="number" class="form-control form-control-sm cantidad" min="1" step="1" required></td>' +
      '<td><button type="button" class="btn btn-outline-danger btn-sm quitar">Quitar</button></td>';
    $('filas-prod').appendChild(tr);
  }

  function filaConsumo() {
    const ins = DB.tabla('insumos').filter(function (i) { return i.activo; });
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><select class="form-select form-select-sm sel-insumo" required>' +
      UI.opciones(ins, function (i) { return i.id_insumo; }, function (i) { return i.nombre + ' (existencia: ' + UI.num(i.existencia_actual) + ' ' + i.unidad_medida + ')'; }, '', 'Selecciona…') + '</select></td>' +
      '<td><input type="number" class="form-control form-control-sm cantidad" min="0.001" step="0.001" required></td>' +
      '<td><button type="button" class="btn btn-outline-danger btn-sm quitar">Quitar</button></td>';
    $('filas-cons').appendChild(tr);
  }

  function quitar(e, tbody, mensaje) {
    if (!e.target.classList.contains('quitar')) return;
    if (tbody.children.length > 1) e.target.closest('tr').remove();
    else UI.toast(mensaje, 'warning');
  }

  $('btn-nuevo').addEventListener('click', function () {
    form.reset();
    form.classList.remove('was-validated');
    $('l-codigo').value = Logica.siguienteCodigoLote();
    $('l-elab').value = UI.hoy();
    $('filas-prod').innerHTML = '';
    $('filas-cons').innerHTML = '';
    filaProduccion();
    filaConsumo();
    modal.show();
  });
  $('btn-add-prod').addEventListener('click', filaProduccion);
  $('btn-add-cons').addEventListener('click', filaConsumo);
  $('filas-prod').addEventListener('click', function (e) { quitar(e, $('filas-prod'), 'El lote necesita al menos una presentación.'); });
  $('filas-cons').addEventListener('click', function (e) { quitar(e, $('filas-cons'), 'El lote necesita al menos un insumo.'); });
  $('buscar').addEventListener('input', render);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const producciones = Array.from($('filas-prod').children).map(function (tr) {
        return { presentacion_id: Number(tr.querySelector('.sel-pres').value), cantidad: Number(tr.querySelector('.cantidad').value) };
      });
      const consumos = Array.from($('filas-cons').children).map(function (tr) {
        return { insumo_id: Number(tr.querySelector('.sel-insumo').value), cantidad: Number(tr.querySelector('.cantidad').value) };
      });
      Logica.crearLote({
        codigo_lote: $('l-codigo').value, fecha_elaboracion: $('l-elab').value, fecha_caducidad: $('l-cad').value,
        producciones: producciones, consumos: consumos
      });
      modal.hide();
      UI.toast('Lote registrado. Se descontaron los insumos y se sumó el producto terminado.');
      render();
    });
  });

  render();
}

function iniciarTrazabilidad() {
  const t = Logica.trazabilidad(Number(UI.param('id')));
  if (!t) {
    $('contenido-traza').innerHTML = '<div class="alert alert-warning">Lote no encontrado. <a href="lotes.html">Volver a lotes</a></div>';
    return;
  }
  $('datos-lote').innerHTML =
    '<dt class="col-sm-3">Código del lote</dt><dd class="col-sm-9">' + UI.h(t.lote.codigo_lote) + '</dd>' +
    '<dt class="col-sm-3">Fecha de elaboración</dt><dd class="col-sm-9">' + UI.fecha(t.lote.fecha_elaboracion) + '</dd>' +
    '<dt class="col-sm-3">Fecha de caducidad</dt><dd class="col-sm-9">' + UI.fecha(t.lote.fecha_caducidad) + '</dd>' +
    '<dt class="col-sm-3">Registrado por</dt><dd class="col-sm-9">' + UI.h(UI.nombreUsuario(t.lote.registrado_por)) + '</dd>';

  $('tbody-insumos').innerHTML = t.consumos.map(function (c) {
    const ins = DB.obtener('insumos', c.insumo_id);
    return '<tr><td>' + UI.h(ins.nombre) + '</td><td>' + UI.num(c.cantidad_consumida) + ' ' + UI.h(ins.unidad_medida) + '</td></tr>';
  }).join('') || UI.vacio(2);

  $('tbody-producido').innerHTML = t.producido.map(function (d) {
    const asignado = Logica.asignadoDeDetalleLote(d.id_detalle_lote);
    return '<tr><td>' + UI.h(UI.nombrePresentacion(d.presentacion_id)) + '</td><td>' + d.cantidad_producida + '</td><td>' + asignado + '</td><td>' + (d.cantidad_producida - asignado) + '</td></tr>';
  }).join('') || UI.vacio(4);

  $('tbody-pedidos').innerHTML = t.entregas.map(function (x) {
    return '<tr><td><a href="pedido.html?id=' + x.pedido.id_pedido + '">#' + x.pedido.id_pedido + '</a></td><td>' + UI.h(UI.nombreCliente(x.pedido.cliente_id)) + '</td><td>' + UI.h(UI.nombrePresentacion(x.presentacion_id)) + '</td><td>' + x.cantidad + '</td><td>' + UI.badge(x.pedido.estado) + '</td></tr>';
  }).join('') || UI.vacio(5, 'Este lote aún no está asignado a ningún pedido.');
}
