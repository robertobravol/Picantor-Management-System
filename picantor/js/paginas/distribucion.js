/*
 * distribucion.js - Módulo M07: S43 (despachos), S44 (registro de despacho) y S45 (registro de entrega).
 * No hay seguimiento de ubicación: el cliente lo excluyó del alcance.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const $ = function (id) { return document.getElementById(id); };
  const modalDespacho = UI.modal('modal-despacho');
  const modalEntrega = UI.modal('modal-entrega');
  const formDespacho = $('form-despacho');
  const formEntrega = $('form-entrega');
  $('d-tipo').innerHTML = UI.opciones(CATALOGOS.TIPOS_ENTREGA, function (x) { return x; }, function (x) { return x === 'PROPIA' ? 'Propia' : 'Transportista externo'; }, 'PROPIA', '');

  function render() {
    const listos = Logica.pedidosListosParaDespacho();
    $('tbody-listos').innerHTML = listos.length ? listos.map(function (p) {
      const completa = Logica.asignacionCompleta(p.id_pedido);
      return '<tr><td>#' + p.id_pedido + '</td><td>' + UI.h(UI.nombreCliente(p.cliente_id)) + '</td><td>' + UI.badge(p.estado) + '</td>' +
        '<td>' + (completa ? '<span class="badge text-bg-success">Lotes asignados</span>' : '<span class="badge text-bg-warning">Faltan lotes</span>') + '</td>' +
        '<td class="text-end text-nowrap"><a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + p.id_pedido + '">Ver pedido</a> ' +
        '<button class="btn btn-picantor btn-sm" data-accion="despachar" data-id="' + p.id_pedido + '">Registrar despacho</button></td></tr>';
    }).join('') : UI.vacio(5, 'No hay pedidos listos para despachar.');

    const despachos = DB.tabla('despachos').slice().sort(function (a, b) { return b.id_despacho - a.id_despacho; });
    $('tbody').innerHTML = despachos.length ? despachos.map(function (d) {
      return '<tr><td>#' + d.pedido_id + '</td><td>' + UI.h(UI.nombreCliente(DB.obtener('pedidos', d.pedido_id).cliente_id)) + '</td><td>' + UI.badge(d.tipo_entrega) + '</td><td>' + UI.h(d.transportista_nombre || '—') + '</td>' +
        '<td>' + UI.fecha(d.fecha_despacho) + '</td><td>' + (d.fecha_entrega ? UI.fecha(d.fecha_entrega) : '<span class="badge text-bg-warning">Pendiente</span>') + '</td><td>' + UI.h(UI.nombreUsuario(d.registrado_por)) + '</td>' +
        '<td class="text-end text-nowrap">' + (d.fecha_entrega ? '' : '<button class="btn btn-picantor btn-sm" data-accion="entregar" data-id="' + d.pedido_id + '">Registrar entrega</button> ') +
        '<a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + d.pedido_id + '">Ver pedido</a></td></tr>';
    }).join('') : UI.vacio(8, 'Aún no hay despachos.');
  }

  function alternarTransportista() {
    const externa = $('d-tipo').value === 'EXTERNA';
    $('grupo-transportista').classList.toggle('d-none', !externa);
    $('d-transportista').required = externa;
    if (!externa) $('d-transportista').value = '';
  }

  function abrirDespacho(pedidoId) {
    const p = DB.obtener('pedidos', pedidoId);
    if (!p) return;
    formDespacho.reset();
    formDespacho.classList.remove('was-validated');
    $('d-pedido-id').value = pedidoId;
    $('d-pedido-texto').textContent = '#' + pedidoId + ' – ' + UI.nombreCliente(p.cliente_id);
    $('d-fecha').value = UI.ahora();
    alternarTransportista();
    modalDespacho.show();
  }

  function abrirEntrega(pedidoId) {
    formEntrega.reset();
    formEntrega.classList.remove('was-validated');
    $('e-pedido-id').value = pedidoId;
    $('e-pedido-texto').textContent = '#' + pedidoId;
    $('e-fecha').value = UI.ahora();
    modalEntrega.show();
  }

  UI.delegar($('tbody-listos'), { despachar: abrirDespacho });
  UI.delegar($('tbody'), { entregar: abrirEntrega });
  $('d-tipo').addEventListener('change', alternarTransportista);

  formDespacho.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(formDespacho)) return;
    UI.intentar(function () {
      Logica.registrarDespacho({
        pedido_id: Number($('d-pedido-id').value), tipo_entrega: $('d-tipo').value,
        transportista_nombre: $('d-transportista').value, fecha_despacho: $('d-fecha').value
      });
      modalDespacho.hide();
      UI.toast('Despacho registrado. El pedido pasó a DESPACHADO.');
      render();
    });
  });

  formEntrega.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(formEntrega)) return;
    UI.intentar(function () {
      Logica.registrarEntrega({ pedido_id: Number($('e-pedido-id').value), fecha_entrega: $('e-fecha').value });
      modalEntrega.hide();
      UI.toast('Entrega registrada. El pedido pasó a ENTREGADO.');
      render();
    });
  });

  render();

  /* Viene desde el detalle del pedido: abre directamente el formulario de despacho. */
  const nuevo = UI.param('nuevo');
  if (nuevo) abrirDespacho(Number(nuevo));
});
