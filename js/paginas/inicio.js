/*
 * inicio.js - Pantallas S03 (inicio del cliente) y S04 (inicio del personal).
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = { 'inicio-cliente': iniciarInicioCliente, 'inicio-personal': iniciarInicioPersonal };
  paginas[document.body.dataset.pagina]();
});

function iniciarInicioCliente() {
  const s = Auth.sesion();
  const cliente = DB.obtener('clientes', s.id_cliente);
  document.getElementById('saludo').textContent = 'Hola, ' + (cliente ? cliente.nombre_razon_social : s.username);
  const pedidos = DB.tabla('pedidos')
    .filter(function (p) { return p.cliente_id === s.id_cliente; })
    .sort(function (a, b) { return b.id_pedido - a.id_pedido; })
    .slice(0, 5);
  document.getElementById('tbody').innerHTML = pedidos.length ? pedidos.map(function (p) {
    return '<tr><td>#' + p.id_pedido + '</td><td>' + UI.fecha(p.fecha_pedido) + '</td><td>' + UI.badge(p.estado) + '</td><td>' + UI.moneda(p.total) + '</td>' +
      '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + p.id_pedido + '">Ver</a></td></tr>';
  }).join('') : UI.vacio(5, 'Aún no tienes pedidos.');
}

function iniciarInicioPersonal() {
  const porAtender = DB.tabla('pedidos').filter(function (p) { return p.estado === 'PAGADO' || p.estado === 'EN_PREPARACION'; });
  document.getElementById('tbody-pedidos').innerHTML = porAtender.length ? porAtender.map(function (p) {
    return '<tr><td>#' + p.id_pedido + '</td><td>' + UI.h(UI.nombreCliente(p.cliente_id)) + '</td><td>' + UI.badge(p.estado) + '</td>' +
      '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + p.id_pedido + '">Atender</a></td></tr>';
  }).join('') : UI.vacio(4, 'No hay pedidos por atender.');

  const sinExistencia = []
    .concat(DB.tabla('insumos').filter(function (i) { return i.activo && i.existencia_actual <= 0; }).map(function (i) { return { tipo: 'Insumo', nombre: i.nombre }; }))
    .concat(DB.tabla('presentaciones').filter(function (p) { return p.activo && p.existencia_actual <= 0; }).map(function (p) { return { tipo: 'Presentación', nombre: UI.nombrePresentacion(p.id_presentacion) }; }));
  document.getElementById('tbody-existencias').innerHTML = sinExistencia.length ? sinExistencia.map(function (x) {
    return '<tr><td>' + x.tipo + '</td><td>' + UI.h(x.nombre) + '</td><td class="cero">0</td></tr>';
  }).join('') : UI.vacio(3, 'Todo tiene existencia.');
}
