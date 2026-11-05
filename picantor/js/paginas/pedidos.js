/*
 * pedidos.js - Módulo M05: S29 (mi perfil), S30 (nuevo pedido), S31 (mis pedidos), S32/S37 (detalle de pedido),
 * S35 (clientes) y S36 (pedidos del personal).
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = {
    perfil: iniciarPerfil, 'nuevo-pedido': iniciarNuevoPedido, 'mis-pedidos': iniciarMisPedidos,
    pedido: iniciarPedido, clientes: iniciarClientes, pedidos: iniciarPedidos
  };
  paginas[document.body.dataset.pagina]();
});

const $ = function (id) { return document.getElementById(id); };

/* ---------- S29 Mi perfil ---------- */
function iniciarPerfil() {
  const s = Auth.sesion();
  const form = $('form');
  const cliente = DB.obtener('clientes', s.id_cliente);
  const usuario = DB.obtener('usuarios', s.usuario_id);
  $('p-tipo').innerHTML = UI.opciones(CATALOGOS.TIPOS_IDENTIFICACION, function (x) { return x; }, function (x) { return x; }, cliente.tipo_identificacion, 'Selecciona…');
  $('p-username').value = usuario.username;
  $('p-nombre').value = cliente.nombre_razon_social;
  $('p-identificacion').value = cliente.identificacion;
  $('p-telefono').value = cliente.telefono;
  $('p-direccion').value = cliente.direccion;
  $('p-email').value = usuario.email;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const identificacion = $('p-identificacion').value.trim();
      DB.transaccion(function () {
        if (DB.tabla('clientes').some(function (c) { return c.id_cliente !== cliente.id_cliente && c.identificacion === identificacion; })) {
          throw new Error('Ya existe otro cliente con esa identificación.');
        }
        DB.actualizar('clientes', cliente.id_cliente, {
          nombre_razon_social: $('p-nombre').value.trim(), tipo_identificacion: $('p-tipo').value, identificacion: identificacion,
          telefono: $('p-telefono').value.trim(), direccion: $('p-direccion').value.trim()
        });
        DB.actualizar('usuarios', usuario.id, { email: $('p-email').value.trim() });
      });
      Auth.establecer(DB.obtener('usuarios', usuario.id));
      UI.flash('Datos actualizados.');
      location.href = 'inicio-cliente.html';
    });
  });
}

/* ---------- S30 Nuevo pedido ---------- */
function iniciarNuevoPedido() {
  const disponibles = DB.tabla('presentaciones').filter(function (p) {
    const prod = DB.obtener('productos', p.producto_id);
    return p.activo && prod && prod.activo;
  });

  function recalcular() {
    let total = 0;
    Array.from($('filas').children).forEach(function (tr) {
      const pr = DB.obtener('presentaciones', tr.querySelector('.sel-pres').value);
      const cant = Number(tr.querySelector('.cantidad').value) || 0;
      const sub = pr ? pr.precio * cant : 0;
      tr.querySelector('.precio').textContent = pr ? UI.moneda(pr.precio) : '—';
      tr.querySelector('.subtotal').textContent = UI.moneda(sub);
      total += sub;
    });
    $('total').textContent = UI.moneda(total);
  }

  function fila(presentacionId) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td><select class="form-select form-select-sm sel-pres" required>' +
      UI.opciones(disponibles, function (p) { return p.id_presentacion; },
        function (p) { return UI.nombrePresentacion(p.id_presentacion) + ' (disponibles: ' + p.existencia_actual + ')'; }, presentacionId || '', 'Selecciona…') + '</select></td>' +
      '<td class="precio">—</td>' +
      '<td><input type="number" class="form-control form-control-sm cantidad" min="1" step="1" value="1" required></td>' +
      '<td class="subtotal">$0.00</td>' +
      '<td><button type="button" class="btn btn-outline-danger btn-sm quitar">Quitar</button></td>';
    $('filas').appendChild(tr);
    recalcular();
  }

  $('btn-add-linea').addEventListener('click', function () { fila(); });
  $('filas').addEventListener('click', function (e) {
    if (!e.target.classList.contains('quitar')) return;
    if ($('filas').children.length > 1) { e.target.closest('tr').remove(); recalcular(); }
    else UI.toast('El pedido necesita al menos una línea.', 'warning');
  });
  $('filas').addEventListener('input', recalcular);
  $('filas').addEventListener('change', recalcular);

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar($('form'))) return;
    UI.intentar(function () {
      const lineas = Array.from($('filas').children).map(function (tr) {
        return { presentacion_id: Number(tr.querySelector('.sel-pres').value), cantidad: Number(tr.querySelector('.cantidad').value) };
      });
      const pedido = Logica.crearPedido({ lineas: lineas });
      UI.flash('Pedido #' + pedido.id_pedido + ' creado. Falta pagarlo para confirmarlo.');
      location.href = 'pago.html?id=' + pedido.id_pedido;
    });
  });

  fila(UI.param('presentacion'));
}

/* ---------- S31 Mis pedidos ---------- */
function iniciarMisPedidos() {
  const s = Auth.sesion();
  $('filtro-estado').innerHTML = UI.opciones(CATALOGOS.ESTADOS_PEDIDO, function (x) { return x; }, function (x) { return x.replace(/_/g, ' '); }, '', 'Todos los estados');

  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const fe = $('filtro-estado').value;
    const filas = DB.tabla('pedidos').filter(function (p) {
      return p.cliente_id === s.id_cliente && (!fe || p.estado === fe) && (!q || ('#' + p.id_pedido).indexOf(q) !== -1);
    }).sort(function (a, b) { return b.id_pedido - a.id_pedido; });
    $('tbody').innerHTML = filas.length ? filas.map(function (p) {
      return '<tr><td>#' + p.id_pedido + '</td><td>' + UI.fecha(p.fecha_pedido) + '</td><td>' + UI.badge(p.estado) + '</td><td>' + UI.moneda(p.total) + '</td>' +
        '<td class="text-end text-nowrap"><a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + p.id_pedido + '">Ver detalle</a> ' +
        (p.estado === 'PENDIENTE_PAGO' ? '<a class="btn btn-picantor btn-sm" href="pago.html?id=' + p.id_pedido + '">Pagar</a>' : '') + '</td></tr>';
    }).join('') : UI.vacio(5, 'No tienes pedidos con esos criterios.');
  }
  $('buscar').addEventListener('input', render);
  $('filtro-estado').addEventListener('change', render);
  render();
}

/* ---------- S32 / S37 Detalle de pedido (cliente y personal) ---------- */
function iniciarPedido() {
  const s = Auth.sesion();
  const id = Number(UI.param('id'));
  const cont = $('contenido');
  const personal = s.rol === 'personal';

  function render() {
    const p = DB.obtener('pedidos', id);
    if (!p) {
      cont.innerHTML = '<div class="alert alert-warning">Pedido no encontrado.</div>';
      return;
    }
    if (!personal && p.cliente_id !== s.id_cliente) {
      location.replace('denegado.html');
      return;
    }
    const detalles = Logica.detallesPedido(p.id_pedido);
    const pagos = DB.tabla('pagos').filter(function (x) { return x.pedido_id === p.id_pedido; });
    const docs = Logica.documentosDePedido(p.id_pedido);
    const desp = Logica.despachoDePedido(p.id_pedido);
    const asignable = personal && ['PAGADO', 'EN_PREPARACION'].indexOf(p.estado) !== -1;
    const volver = personal ? 'pedidos.html' : 'mis-pedidos.html';

    let html = '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h1 class="h3 mb-0">Pedido #' + p.id_pedido + ' ' + UI.badge(p.estado) + '</h1>' +
      '<div class="text-nowrap">';
    if (!personal && p.estado === 'PENDIENTE_PAGO') html += '<a class="btn btn-picantor" href="pago.html?id=' + p.id_pedido + '">Pagar</a> ';
    if (asignable) {
      html += '<button class="btn btn-outline-primary" data-accion="auto">Asignar lotes automáticamente</button> ';
      if (p.estado === 'PAGADO') html += '<button class="btn btn-outline-primary" data-accion="preparar">Marcar EN PREPARACIÓN</button> ';
      if (!desp) html += '<a class="btn btn-picantor" href="despachos.html?nuevo=' + p.id_pedido + '">Registrar despacho</a> ';
    }
    html += '<a class="btn btn-outline-secondary" href="' + volver + '">Volver</a></div></div>';

    html += '<div class="tabla-card p-3 mb-3"><dl class="dato-lectura row mb-0">' +
      '<dt class="col-sm-3">Fecha del pedido</dt><dd class="col-sm-9">' + UI.fecha(p.fecha_pedido) + '</dd>' +
      (personal ? '<dt class="col-sm-3">Cliente</dt><dd class="col-sm-9">' + UI.h(UI.nombreCliente(p.cliente_id)) + '</dd>' : '') +
      '<dt class="col-sm-3">Total</dt><dd class="col-sm-9">' + UI.moneda(p.total) + '</dd></dl></div>';

    html += '<h2 class="h5">Ítems</h2><div class="table-responsive tabla-card mb-3"><table class="table table-sm align-middle mb-0"><thead><tr><th>Presentación</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th>' +
      (personal ? '<th>Asignado a lotes</th><th>Falta asignar</th>' : '') + '</tr></thead><tbody>' +
      detalles.map(function (d) {
        const asig = Logica.asignadoDeDetallePedido(d.id_detalle_pedido);
        return '<tr><td>' + UI.h(UI.nombrePresentacion(d.presentacion_id)) + '</td><td>' + d.cantidad + '</td><td>' + UI.moneda(d.precio_unitario) + '</td><td>' + UI.moneda(d.cantidad * d.precio_unitario) + '</td>' +
          (personal ? '<td>' + asig + '</td><td>' + Math.max(0, d.cantidad - asig) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';

    if (personal) {
      const asigs = DB.tabla('asignacion_lote').filter(function (a) {
        return detalles.some(function (d) { return d.id_detalle_pedido === a.detalle_pedido_id; });
      });
      html += '<h2 class="h5">Lotes asignados (trazabilidad)</h2><div class="table-responsive tabla-card mb-3"><table class="table table-sm mb-0"><thead><tr><th>Presentación</th><th>Lote</th><th>Caducidad</th><th>Cantidad</th></tr></thead><tbody>' +
        (asigs.length ? asigs.map(function (a) {
          const dp = DB.obtener('detalle_pedido', a.detalle_pedido_id);
          const dl = DB.obtener('detalle_lote', a.detalle_lote_id);
          const l = DB.obtener('lotes', dl.lote_id);
          return '<tr><td>' + UI.h(UI.nombrePresentacion(dp.presentacion_id)) + '</td><td><a href="trazabilidad.html?id=' + l.id_lote + '">' + UI.h(l.codigo_lote) + '</a></td><td>' + UI.fecha(l.fecha_caducidad) + '</td><td>' + a.cantidad + '</td></tr>';
        }).join('') : UI.vacio(4, 'Aún no se asignaron lotes.')) + '</tbody></table></div>';

      if (asignable) {
        const pendientes = detalles.filter(function (d) { return Logica.asignadoDeDetallePedido(d.id_detalle_pedido) < d.cantidad; });
        html += '<h2 class="h5">Asignar lote manualmente</h2>';
        if (pendientes.length) {
          html += '<form id="form-asignar" class="tabla-card p-3 mb-3 row g-2 align-items-end" novalidate>' +
            '<div class="col-md-4"><label class="form-label" for="as-detalle">Ítem del pedido</label><select class="form-select" id="as-detalle" required>' +
            UI.opciones(pendientes, function (d) { return d.id_detalle_pedido; }, function (d) {
              return UI.nombrePresentacion(d.presentacion_id) + ' (faltan ' + (d.cantidad - Logica.asignadoDeDetallePedido(d.id_detalle_pedido)) + ')';
            }, '', 'Selecciona…') + '</select></div>' +
            '<div class="col-md-4"><label class="form-label" for="as-lote">Lote</label><select class="form-select" id="as-lote" required><option value="">Selecciona un ítem primero</option></select></div>' +
            '<div class="col-md-2"><label class="form-label" for="as-cantidad">Cantidad</label><input type="number" class="form-control" id="as-cantidad" min="1" step="1" required></div>' +
            '<div class="col-md-2"><button class="btn btn-picantor w-100" type="submit">Asignar lote</button></div></form>';
        } else {
          html += '<p class="text-muted">Todos los ítems ya tienen lotes asignados.</p>';
        }
      }
    }

    html += '<h2 class="h5">Pagos</h2><div class="table-responsive tabla-card mb-3"><table class="table table-sm mb-0"><thead><tr><th>Pago</th><th>Método</th><th>Monto</th><th>Estado</th><th>Referencia</th><th>Fecha</th></tr></thead><tbody>' +
      (pagos.length ? pagos.map(function (x) {
        return '<tr><td>#' + x.id_pago + '</td><td>' + UI.h(x.metodo_pago) + '</td><td>' + UI.moneda(x.monto) + '</td><td>' + UI.badge(x.estado_pago) + '</td><td>' + UI.h(x.referencia_transaccion || '—') + '</td><td>' + UI.fecha(x.fecha_hora) + '</td></tr>';
      }).join('') : UI.vacio(6, 'Aún no hay pagos.')) + '</tbody></table></div>';

    html += '<h2 class="h5">Documentos</h2><div class="table-responsive tabla-card mb-3"><table class="table table-sm mb-0"><thead><tr><th>Tipo</th><th>Número</th><th>Fecha de emisión</th><th>Total</th><th></th></tr></thead><tbody>' +
      (docs.length ? docs.map(function (d) {
        return '<tr><td>' + UI.h(d.tipo_documento.replace(/_/g, ' ')) + '</td><td>' + UI.h(d.numero) + '</td><td>' + UI.fecha(d.fecha_emision) + '</td><td>' + UI.moneda(d.total) + '</td>' +
          '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="documento.html?id=' + d.id_documento + '">Ver documento</a></td></tr>';
      }).join('') : UI.vacio(5, 'Aún no se emitieron documentos.')) + '</tbody></table></div>';

    html += '<h2 class="h5">Entrega</h2><div class="tabla-card p-3 mb-3">' + (desp
      ? '<dl class="dato-lectura row mb-0"><dt class="col-sm-3">Tipo de entrega</dt><dd class="col-sm-9">' + UI.badge(desp.tipo_entrega) + (desp.transportista_nombre ? ' ' + UI.h(desp.transportista_nombre) : '') + '</dd>' +
        '<dt class="col-sm-3">Fecha de despacho</dt><dd class="col-sm-9">' + UI.fecha(desp.fecha_despacho) + '</dd>' +
        '<dt class="col-sm-3">Fecha de entrega</dt><dd class="col-sm-9">' + (desp.fecha_entrega ? UI.fecha(desp.fecha_entrega) : 'Pendiente') + '</dd></dl>'
      : '<span class="text-muted">El pedido aún no se despacha.</span>') + '</div>';

    cont.innerHTML = html;
    llenarLotes();
  }

  /* Llena la lista de lotes según el ítem elegido en el formulario de asignación. */
  function llenarLotes() {
    const sel = $('as-detalle');
    if (!sel) return;
    const dp = DB.obtener('detalle_pedido', sel.value);
    const lotes = dp ? Logica.lotesDisponibles(dp.presentacion_id) : [];
    $('as-lote').innerHTML = dp
      ? (lotes.length
        ? UI.opciones(lotes, function (dl) { return dl.id_detalle_lote; }, function (dl) {
          const l = DB.obtener('lotes', dl.lote_id);
          return l.codigo_lote + ' (caduca ' + UI.fecha(l.fecha_caducidad) + ', sin asignar: ' + Logica.disponibleLote(dl.id_detalle_lote) + ')';
        }, '', 'Selecciona…')
        : '<option value="">No hay lotes con unidades sin asignar</option>')
      : '<option value="">Selecciona un ítem primero</option>';
  }

  cont.addEventListener('change', function (e) {
    if (e.target.id === 'as-detalle') llenarLotes();
  });

  cont.addEventListener('submit', function (e) {
    if (e.target.id !== 'form-asignar') return;
    e.preventDefault();
    if (!UI.validar(e.target)) return;
    UI.intentar(function () {
      Logica.asignarLote(Number($('as-detalle').value), Number($('as-lote').value), Number($('as-cantidad').value));
      UI.toast('Lote asignado.');
      render();
    });
  });

  UI.delegar(cont, {
    auto: function () {
      UI.intentar(function () {
        Logica.asignarAutomatico(id);
        UI.toast('Lotes asignados (primero los que caducan antes).');
        render();
      });
    },
    preparar: function () {
      UI.intentar(function () {
        Logica.marcarEnPreparacion(id);
        UI.toast('Pedido en preparación.');
        render();
      });
    }
  });

  render();
}

/* ---------- S35 Clientes ---------- */
function iniciarClientes() {
  function render() {
    const q = $('buscar').value.trim().toLowerCase();
    const filas = DB.tabla('clientes').filter(function (c) {
      const u = DB.obtener('usuarios', c.usuario_id);
      return !q || [c.nombre_razon_social, c.identificacion, c.telefono, c.direccion, u ? u.email : ''].join(' ').toLowerCase().indexOf(q) !== -1;
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (c) {
      const u = DB.obtener('usuarios', c.usuario_id);
      return '<tr><td>' + UI.h(c.nombre_razon_social) + '</td><td>' + UI.h(c.tipo_identificacion) + '</td><td>' + UI.h(c.identificacion) + '</td><td>' + UI.h(c.telefono) + '</td><td>' + UI.h(c.direccion) + '</td><td>' + UI.h(u ? u.email : '') + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="pedidos.html?cliente=' + c.id_cliente + '">Ver pedidos</a></td></tr>';
    }).join('') : UI.vacio(7);
  }
  $('buscar').addEventListener('input', render);
  render();
}

/* ---------- S36 Pedidos (personal) ---------- */
function iniciarPedidos() {
  $('f-estado').innerHTML = UI.opciones(CATALOGOS.ESTADOS_PEDIDO, function (x) { return x; }, function (x) { return x.replace(/_/g, ' '); }, '', 'Todos');
  $('f-cliente').innerHTML = UI.opciones(DB.tabla('clientes'), function (c) { return c.id_cliente; }, function (c) { return c.nombre_razon_social; }, UI.param('cliente') || '', 'Todos');

  function render() {
    const estado = $('f-estado').value;
    const cliente = $('f-cliente').value;
    const desde = $('f-desde').value;
    const hasta = $('f-hasta').value;
    const filas = DB.tabla('pedidos').slice().sort(function (a, b) { return b.id_pedido - a.id_pedido; }).filter(function (p) {
      const dia = p.fecha_pedido.slice(0, 10);
      return (!estado || p.estado === estado) && (!cliente || String(p.cliente_id) === cliente) && (!desde || dia >= desde) && (!hasta || dia <= hasta);
    });
    $('tbody').innerHTML = filas.length ? filas.map(function (p) {
      return '<tr><td>#' + p.id_pedido + '</td><td>' + UI.h(UI.nombreCliente(p.cliente_id)) + '</td><td>' + UI.fecha(p.fecha_pedido) + '</td><td>' + UI.badge(p.estado) + '</td><td>' + UI.moneda(p.total) + '</td>' +
        '<td class="text-end"><a class="btn btn-outline-secondary btn-sm" href="pedido.html?id=' + p.id_pedido + '">Ver detalle</a></td></tr>';
    }).join('') : UI.vacio(6);
    $('contador').textContent = filas.length + ' pedido(s)';
  }

  $('filtros').addEventListener('submit', function (e) { e.preventDefault(); render(); });
  $('btn-limpiar').addEventListener('click', function () {
    $('filtros').reset();
    $('f-cliente').value = '';
    render();
  });
  render();
}
