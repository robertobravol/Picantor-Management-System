/*
 * pagos.js - Módulo M06: S40 (pago en línea simulado), S50 (confirmación), S41 (pagos del personal),
 * S42 (mis pagos y documentos), S51 (documentos de venta) y S52 (vista de documento).
 * El pago es una SIMULACIÓN: los datos de tarjeta no se guardan ni se envían a ningún sitio.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = {
    pago: iniciarPago, 'confirmacion-pago': iniciarConfirmacion, pagos: iniciarPagos,
    'mis-documentos': iniciarMisDocumentos, documentos: iniciarDocumentos, documento: iniciarDocumento
  };
  paginas[document.body.dataset.pagina]();
});

const $ = function (id) { return document.getElementById(id); };

function etiquetaTipoDocumento(t) {
  return t === 'FACTURA_ELECTRONICA' ? 'Factura electrónica' : 'Comprobante interno';
}

/* ---------- S40 Pago en línea (simulado) ---------- */
function iniciarPago() {
  const s = Auth.sesion();
  const pedido = DB.obtener('pedidos', UI.param('id'));
  if (!pedido || pedido.cliente_id !== s.id_cliente) {
    $('contenido-pago').innerHTML = '<div class="alert alert-warning">Pedido no encontrado. <a href="mis-pedidos.html">Ver mis pedidos</a></div>';
    return;
  }
  if (pedido.estado !== 'PENDIENTE_PAGO') {
    $('contenido-pago').innerHTML = '<div class="alert alert-info">El pedido #' + pedido.id_pedido + ' ya fue pagado. <a href="pedido.html?id=' + pedido.id_pedido + '">Ver detalle</a></div>';
    return;
  }
  $('info-pedido').innerHTML = '<dt class="col-sm-4">Pedido</dt><dd class="col-sm-8">#' + pedido.id_pedido + '</dd><dt class="col-sm-4">Total a pagar</dt><dd class="col-sm-8"><strong>' + UI.moneda(pedido.total) + '</strong></dd>';
  const form = $('form');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const numero = $('t-numero').value.replace(/\s+/g, '');
    $('t-numero').setCustomValidity(/^\d{13,19}$/.test(numero) ? '' : 'Número de tarjeta inválido.');
    $('t-venc').setCustomValidity(/^(0[1-9]|1[0-2])\/\d{2}$/.test($('t-venc').value.trim()) ? '' : 'Usa el formato MM/AA.');
    $('t-cvv').setCustomValidity(/^\d{3,4}$/.test($('t-cvv').value.trim()) ? '' : 'Código inválido.');
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const pago = Logica.pagarPedido(pedido.id_pedido, true);
      form.reset();
      location.href = 'confirmacion-pago.html?id=' + pedido.id_pedido + '&pago=' + pago.id_pago;
    });
  });

  $('btn-fallido').addEventListener('click', function () {
    UI.intentar(function () {
      Logica.pagarPedido(pedido.id_pedido, false);
      form.reset();
      form.classList.remove('was-validated');
      UI.toast('Pago fallido (simulado). Puedes intentarlo de nuevo.', 'danger');
    });
  });
}

/* ---------- S50 Confirmación de pago ---------- */
function iniciarConfirmacion() {
  const s = Auth.sesion();
  const pedido = DB.obtener('pedidos', UI.param('id'));
  const pago = DB.obtener('pagos', UI.param('pago'));
  if (!pedido || pedido.cliente_id !== s.id_cliente || !pago || pago.pedido_id !== pedido.id_pedido) {
    $('resultado').innerHTML = '<div class="alert alert-warning">No se encontró el pago. <a href="inicio-cliente.html">Ir al inicio</a></div>';
    return;
  }
  $('resultado').innerHTML = '<div class="alert alert-success"><strong>Pago exitoso (simulado).</strong> Tu pedido quedó confirmado.</div>' +
    '<dl class="dato-lectura row"><dt class="col-sm-4">Pedido</dt><dd class="col-sm-8">#' + pedido.id_pedido + '</dd>' +
    '<dt class="col-sm-4">Total</dt><dd class="col-sm-8">' + UI.moneda(pago.monto) + '</dd>' +
    '<dt class="col-sm-4">Referencia</dt><dd class="col-sm-8">' + UI.h(pago.referencia_transaccion) + '</dd>' +
    '<dt class="col-sm-4">Fecha</dt><dd class="col-sm-8">' + UI.fecha(pago.fecha_hora) + '</dd></dl>';
  $('btn-ver-pedido').href = 'pedido.html?id=' + pedido.id_pedido;
}

/* ---------- S41 Pagos (personal) ---------- */
function iniciarPagos() {
  $('f-estado').innerHTML = UI.opciones(['PENDIENTE', 'EXITOSO', 'FALLIDO'], function (x) { return x; }, function (x) { return x; }, '', 'Todos');

  function render() {
    const fe = $('f-estado').value;
    const filas = DB.tabla('pagos').slice().sort(function (a, b) { return b.id_pago - a.id_pago; }).filter(function (p) { return !fe || p.estado_pago === fe; });
    $('tbody').innerHTML = filas.length ? filas.map(function (p) {
      return '<tr><td>#' + p.id_pago + '</td><td>#' + p.pedido_id + '</td><td>' + UI.h(p.metodo_pago) + '</td><td>' + UI.moneda(p.monto) + '</td><td>' + UI.badge(p.estado_pago) + '</td>' +
        '<td>' + UI.h(p.referencia_transaccion || '—') + '</td><td>' + UI.fecha(p.fecha_hora) + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + p.pedido_id + '">Ver pedido</a></td></tr>';
    }).join('') : UI.vacio(8);
  }
  $('f-estado').addEventListener('change', render);
  render();
}

/* ---------- S42 Mis pagos y documentos (cliente) ---------- */
function iniciarMisDocumentos() {
  const s = Auth.sesion();
  const misPedidos = DB.tabla('pedidos').filter(function (p) { return p.cliente_id === s.id_cliente; }).map(function (p) { return p.id_pedido; });
  const pagos = DB.tabla('pagos').filter(function (p) { return misPedidos.indexOf(p.pedido_id) !== -1; }).sort(function (a, b) { return b.id_pago - a.id_pago; });
  const docs = DB.tabla('documentos').filter(function (d) { return misPedidos.indexOf(d.pedido_id) !== -1; }).sort(function (a, b) { return b.id_documento - a.id_documento; });
  $('tbody-pagos').innerHTML = pagos.length ? pagos.map(function (p) {
    return '<tr><td>#' + p.pedido_id + '</td><td>' + UI.moneda(p.monto) + '</td><td>' + UI.badge(p.estado_pago) + '</td><td>' + UI.fecha(p.fecha_hora) + '</td></tr>';
  }).join('') : UI.vacio(4, 'Aún no tienes pagos.');
  $('tbody-docs').innerHTML = docs.length ? docs.map(function (d) {
    return '<tr><td>' + etiquetaTipoDocumento(d.tipo_documento) + '</td><td>' + UI.h(d.numero) + '</td><td>' + UI.fecha(d.fecha_emision) + '</td><td>' + UI.moneda(d.total) + '</td>' +
      '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="documento.html?id=' + d.id_documento + '">Ver documento</a></td></tr>';
  }).join('') : UI.vacio(5, 'Aún no tienes documentos. Se emiten después de confirmar tu pago.');
}

/* ---------- S51 Documentos de venta (personal) ---------- */
function iniciarDocumentos() {
  $('f-tipo').innerHTML = UI.opciones(['FACTURA_ELECTRONICA', 'COMPROBANTE_INTERNO'], function (x) { return x; }, etiquetaTipoDocumento, '', 'Todos');

  function render() {
    const sin = Logica.pedidosSinDocumentos();
    $('tbody-pendientes').innerHTML = sin.length ? sin.map(function (p) {
      return '<tr><td>#' + p.id_pedido + '</td><td>' + UI.h(UI.nombreCliente(p.cliente_id)) + '</td><td>' + UI.badge(p.estado) + '</td><td>' + UI.moneda(p.total) + '</td>' +
        '<td class="text-end"><button class="btn btn-picantor btn-sm" data-accion="emitir" data-id="' + p.id_pedido + '">Emitir factura electrónica y comprobante interno</button></td></tr>';
    }).join('') : UI.vacio(5, 'No hay pedidos pagados pendientes de documentos.');

    const ft = $('f-tipo').value;
    const q = $('buscar').value.trim().toLowerCase();
    const docs = DB.tabla('documentos').slice().sort(function (a, b) { return b.id_documento - a.id_documento; }).filter(function (d) {
      return (!ft || d.tipo_documento === ft) && (!q || (d.numero + ' #' + d.pedido_id).toLowerCase().indexOf(q) !== -1);
    });
    $('tbody').innerHTML = docs.length ? docs.map(function (d) {
      return '<tr><td>#' + d.id_documento + '</td><td>#' + d.pedido_id + '</td><td>' + etiquetaTipoDocumento(d.tipo_documento) + '</td><td>' + UI.h(d.numero) + '</td><td>' + UI.h(d.estado_autorizacion || '—') + '</td><td>' + UI.fecha(d.fecha_emision) + '</td><td>' + UI.moneda(d.total) + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="documento.html?id=' + d.id_documento + '">Ver documento</a></td></tr>';
    }).join('') : UI.vacio(8);
  }

  UI.delegar($('tbody-pendientes'), {
    emitir: function (id) {
      UI.intentar(function () {
        Logica.emitirDocumentos(id);
        UI.toast('Documentos emitidos (simulados, sin validez legal).');
        render();
      });
    }
  });
  $('f-tipo').addEventListener('change', render);
  $('buscar').addEventListener('input', render);
  render();
}

/* ---------- S52 Vista de documento (solo lectura) ---------- */
function iniciarDocumento() {
  const s = Auth.sesion();
  const d = DB.obtener('documentos', UI.param('id'));
  const pedido = d ? DB.obtener('pedidos', d.pedido_id) : null;
  if (!d || !pedido) {
    $('contenido').innerHTML = '<div class="alert alert-warning">Documento no encontrado.</div>';
    return;
  }
  if (s.rol === 'cliente' && pedido.cliente_id !== s.id_cliente) {
    location.replace('denegado.html');
    return;
  }
  const cliente = DB.obtener('clientes', pedido.cliente_id);
  const esFactura = d.tipo_documento === 'FACTURA_ELECTRONICA';
  const items = Logica.detallesPedido(pedido.id_pedido).map(function (x) {
    return '<tr><td>' + UI.h(UI.nombrePresentacion(x.presentacion_id)) + '</td><td>' + x.cantidad + '</td><td>' + UI.moneda(x.precio_unitario) + '</td><td>' + UI.moneda(x.cantidad * x.precio_unitario) + '</td></tr>';
  }).join('');
  $('contenido').innerHTML = '<div class="documento-venta">' +
    '<div class="alert alert-warning small">Documento <strong>simulado</strong> del prototipo: no tiene validez legal ni tributaria.</div>' +
    '<h1 class="h4">' + etiquetaTipoDocumento(d.tipo_documento) + '</h1>' +
    '<dl class="dato-lectura row"><dt class="col-sm-3">Número</dt><dd class="col-sm-9">' + UI.h(d.numero) + '</dd>' +
    '<dt class="col-sm-3">Fecha de emisión</dt><dd class="col-sm-9">' + UI.fecha(d.fecha_emision) + '</dd>' +
    '<dt class="col-sm-3">Pedido</dt><dd class="col-sm-9">#' + pedido.id_pedido + '</dd>' +
    '<dt class="col-sm-3">Cliente</dt><dd class="col-sm-9">' + UI.h(cliente.nombre_razon_social) + ' (' + UI.h(cliente.tipo_identificacion) + ' ' + UI.h(cliente.identificacion) + ')</dd>' +
    (esFactura ? '<dt class="col-sm-3">Clave de acceso</dt><dd class="col-sm-9 clave-acceso">' + UI.h(d.clave_acceso) + '</dd>' +
      '<dt class="col-sm-3">Estado de autorización</dt><dd class="col-sm-9">' + UI.h(d.estado_autorizacion) + '</dd>' : '') + '</dl>' +
    '<table class="table table-sm"><thead><tr><th>Presentación</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>' + items + '</tbody>' +
    '<tfoot><tr><th colspan="3" class="text-end">Total</th><th>' + UI.moneda(d.total) + '</th></tr></tfoot></table></div>';
}
