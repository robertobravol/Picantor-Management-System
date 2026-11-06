/*
 * dashboard.js - Dashboard del personal.
 * Definiciones: una "venta cobrada" es un pedido con pago EXITOSO; las ventas por día usan la fecha del pedido.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const $ = function (id) { return document.getElementById(id); };
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const ETIQUETA_ESTADO = {
    PENDIENTE_PAGO: 'Pendiente de pago', PAGADO: 'Pagado', EN_PREPARACION: 'En preparación', DESPACHADO: 'Despachado', ENTREGADO: 'Entregado'
  };
  const ICONO_ALERTA = '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 15 14H1z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v4M8 11.7v.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  /* ---------- Fechas ---------- */
  function sumarDias(iso, n) {
    const d = new Date(iso + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function diasEntre(desde, hasta) {
    return Math.round((Date.parse(hasta + 'T00:00:00Z') - Date.parse(desde + 'T00:00:00Z')) / 86400000);
  }

  function etiquetaDia(iso) {
    return Number(iso.slice(8, 10)) + ' ' + MESES[Number(iso.slice(5, 7)) - 1];
  }

  function etiquetaMes(clave) {
    return MESES[Number(clave.slice(5, 7)) - 1] + ' ' + clave.slice(2, 4);
  }

  function periodo() {
    const tipo = $('p-tipo').value;
    const hoy = UI.hoy();
    if (tipo === 'mes') return { desde: hoy.slice(0, 8) + '01', hasta: hoy, texto: 'Mes actual' };
    if (tipo === '30') return { desde: sumarDias(hoy, -29), hasta: hoy, texto: 'Últimos 30 días' };
    if (tipo === '7') return { desde: sumarDias(hoy, -6), hasta: hoy, texto: 'Últimos 7 días' };
    if (tipo === 'rango') {
      const d = $('p-desde').value;
      const h = $('p-hasta').value;
      return { desde: d || null, hasta: h || null, texto: 'Del ' + (d ? UI.fecha(d) : 'inicio') + ' al ' + (h ? UI.fecha(h) : 'último pedido') };
    }
    return { desde: null, hasta: null, texto: 'Todo el historial' };
  }

  const ESTADOS_PEDIDO = ['PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'];

  /* Estado de pago del pedido: EXITOSO si hay algún pago exitoso; si no, el del último intento; SIN_PAGO si no hay intentos. */
  function estadoPagoDePedido(pagos, pedidoId) {
    const delPedido = pagos.filter(function (x) { return x.pedido_id === pedidoId; });
    if (delPedido.some(function (x) { return x.estado_pago === 'EXITOSO'; })) return 'EXITOSO';
    if (!delPedido.length) return 'SIN_PAGO';
    delPedido.sort(function (a, b) {
      if (a.fecha_hora !== b.fecha_hora) return a.fecha_hora < b.fecha_hora ? 1 : -1;
      return b.id_pago - a.id_pago;
    });
    return delPedido[0].estado_pago;
  }

  /* Una fila por ítem de pedido dentro del período (por la fecha del pedido), con su estado de pago. */
  function consultarVentas(desde, hasta) {
    if (desde && hasta && desde > hasta) throw new Error('La fecha desde no puede ser posterior a la fecha hasta.');
    const datos = DB.cargar();
    const filas = [];
    datos.pedidos.forEach(function (ped) {
      const dia = ped.fecha_pedido.slice(0, 10);
      if ((desde && dia < desde) || (hasta && dia > hasta)) return;
      const estadoPago = estadoPagoDePedido(datos.pagos, ped.id_pedido);
      datos.detalle_pedido.filter(function (d) { return d.pedido_id === ped.id_pedido; }).forEach(function (d) {
        const pre = datos.presentaciones.find(function (x) { return x.id_presentacion === d.presentacion_id; });
        const pro = datos.productos.find(function (x) { return x.id_producto === pre.producto_id; });
        filas.push({
          id_pedido: ped.id_pedido, fecha_pedido: ped.fecha_pedido, estado_pedido: ped.estado, estado_pago: estadoPago,
          producto: pro.nombre, presentacion: pre.nombre, cantidad: d.cantidad,
          subtotal: Math.round(d.cantidad * d.precio_unitario * 100) / 100
        });
      });
    });
    return filas;
  }

  /* ---------- Tooltip único (enhance, no gate: todo valor también está en la tabla) ---------- */
  const tip = document.createElement('div');
  tip.id = 'viz-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  function mostrarTip(el, x, y) {
    tip.replaceChildren();
    const v = document.createElement('strong');
    v.textContent = el.dataset.tipV;
    const l = document.createElement('span');
    l.textContent = el.dataset.tipL;
    tip.append(v, l);
    tip.style.display = 'block';
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(x + 12, window.innerWidth - w - 8)) + 'px';
    tip.style.top = (y - h - 12 < 8 ? y + 16 : y - h - 12) + 'px';
  }

  function ocultarTip() { tip.style.display = 'none'; }

  document.addEventListener('pointermove', function (e) {
    const el = e.target.closest ? e.target.closest('[data-tip-v]') : null;
    if (el) mostrarTip(el, e.clientX, e.clientY); else ocultarTip();
  });
  document.addEventListener('focusin', function (e) {
    const el = e.target.closest ? e.target.closest('[data-tip-v]') : null;
    if (el) {
      const r = el.getBoundingClientRect();
      mostrarTip(el, r.left + r.width / 2, r.top);
    }
  });
  document.addEventListener('focusout', ocultarTip);

  /* ---------- Piezas de interfaz ---------- */
  const vistaTabla = new Set();   // tarjetas que el usuario dejó en "ver tabla"

  function tarjeta(id, titulo, sub, grafico, tabla) {
    const enTabla = vistaTabla.has(id);
    return '<div class="viz-card" id="' + id + '"><div class="viz-titulo-fila"><div><h2>' + UI.h(titulo) + '</h2><p class="viz-sub">' + UI.h(sub) + '</p></div>' +
      '<button type="button" class="btn btn-outline-secondary btn-tabla no-imprimir" data-alterna="' + id + '" aria-pressed="' + enTabla + '">' + (enTabla ? 'Ver gráfico' : 'Ver tabla') + '</button></div>' +
      '<div class="viz-vista-grafico' + (enTabla ? ' d-none' : '') + '">' + grafico + '</div>' +
      '<div class="viz-vista-tabla' + (enTabla ? '' : ' d-none') + '">' + tabla + '</div></div>';
  }

  function tablaSimple(cabeceras, filas) {
    return '<div class="table-responsive"><table class="table table-sm viz-tabla mb-0"><thead><tr>' +
      cabeceras.map(function (c, i) { return '<th' + (i > 0 ? ' class="text-end"' : '') + '>' + UI.h(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (filas.length ? filas.map(function (f) {
        return '<tr>' + f.map(function (c, i) { return '<td' + (i > 0 ? ' class="text-end"' : '') + '>' + UI.h(c) + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + cabeceras.length + '" class="text-center text-muted">Sin datos.</td></tr>') + '</tbody></table></div>';
  }

  function ficha(etiqueta, valor, detalle) {
    const cuerpo = '<div class="viz-card"><div class="ficha-etiqueta">' + UI.h(etiqueta) + '</div><div class="ficha-valor">' + UI.h(valor) + '</div>' +
      (detalle ? '<div class="ficha-detalle">' + UI.h(detalle) + '</div>' : '') + '</div>';
    return '<div class="col-6 col-lg-3">' + cuerpo + '</div>';
  }

  /* Barras horizontales (HTML): etiqueta a la izquierda, valor en la punta de la barra */
  function barrasHorizontales(items, unidad) {
    if (!items.length) return '<div class="viz-vacio">Sin datos en este período.</div>';
    const max = Math.max.apply(null, items.map(function (i) { return i.valor; })) || 1;
    return '<div class="hbar" role="list">' + items.map(function (i) {
      const tipV = i.valor + ' ' + unidad;
      return '<div class="hbar-fila" role="listitem" tabindex="0" data-tip-v="' + UI.h(tipV) + '" data-tip-l="' + UI.h(i.etiqueta) + '" aria-label="' + UI.h(i.etiqueta + ': ' + tipV) + '">' +
        '<div class="hbar-etiqueta">' + UI.h(i.etiqueta) + '</div>' +
        '<div class="hbar-pista" style="--r:' + (i.valor / max) + '"><div class="hbar-relleno"></div><div class="hbar-valor">' + i.valor + '</div></div></div>';
    }).join('') + '</div>';
  }

  /* ---------- Columnas de ventas por día (SVG) ---------- */
  function pasoLindo(max) {
    const crudo = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(crudo)));
    const n = crudo / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }

  function numEje(v) {
    return '$' + (Number.isInteger(v) ? v : v.toFixed(2));
  }

  let serieVentas = [];
  let unidadVentas = 'día';

  function dibujarColumnas() {
    const cont = $('col-ventas');
    if (!cont) return;
    const serie = serieVentas;
    const ancho = Math.max(280, cont.clientWidth || 600);
    const alto = 260, L = 46, R = 8, T = 24, B = 28;
    const plotW = ancho - L - R, plotH = alto - T - B;
    const maxVal = Math.max.apply(null, serie.map(function (s) { return s.valor; }));
    const paso = pasoLindo(maxVal);
    const tope = Math.ceil(maxVal / paso) * paso;
    const sw = plotW / serie.length;
    const bw = Math.max(1, Math.min(24, sw - 2));
    const cadaN = Math.max(1, Math.ceil(serie.length / Math.max(1, Math.floor(plotW / 54))));
    const idxMax = serie.findIndex(function (s) { return s.valor === maxVal; });
    let g = '';
    for (let v = 0; v <= tope + 1e-9; v += paso) {
      const y = T + plotH - (v / tope) * plotH;
      g += (v > 0 ? '<line class="cuadricula" x1="' + L + '" x2="' + (ancho - R) + '" y1="' + y + '" y2="' + y + '"/>' : '') +
        '<text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + numEje(Math.round(v * 100) / 100) + '</text>';
    }
    g = '<g class="eje">' + g + '</g><line class="base" x1="' + L + '" x2="' + (ancho - R) + '" y1="' + (T + plotH) + '" y2="' + (T + plotH) + '"/>';
    serie.forEach(function (s, i) {
      const h = (s.valor / tope) * plotH;
      const x = L + i * sw + (sw - bw) / 2;
      const y = T + plotH - h;
      const r = Math.min(4, h, bw / 2);
      const barra = h > 0
        ? '<path class="barra" d="M' + x + ',' + (y + h) + ' V' + (y + r) + ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y + ' H' + (x + bw - r) + ' Q' + (x + bw) + ',' + y + ' ' + (x + bw) + ',' + (y + r) + ' V' + (y + h) + ' Z"/>'
        : '';
      g += '<g class="col" tabindex="0" data-tip-v="' + UI.h(UI.moneda(s.valor)) + '" data-tip-l="' + UI.h(s.largo) + '" aria-label="' + UI.h(s.largo + ': ' + UI.moneda(s.valor)) + '">' +
        '<rect class="zona" x="' + (L + i * sw) + '" y="' + T + '" width="' + sw + '" height="' + plotH + '"/>' + barra + '</g>';
      if (i % cadaN === 0) {
        g += '<g class="eje"><text x="' + (L + i * sw + sw / 2) + '" y="' + (alto - 8) + '" text-anchor="middle">' + UI.h(s.corto) + '</text></g>';
      }
    });
    if (idxMax >= 0 && maxVal > 0) {
      const cx = Math.max(24, Math.min(ancho - 24, L + idxMax * sw + sw / 2));
      g += '<text class="valor-max" x="' + cx + '" y="' + (T + plotH - (maxVal / tope) * plotH - 6) + '">' + UI.h(UI.moneda(maxVal)) + '</text>';
    }
    const total = serie.reduce(function (a, s) { return a + s.valor; }, 0);
    cont.innerHTML = '<svg class="viz-svg" viewBox="0 0 ' + ancho + ' ' + alto + '" width="' + ancho + '" height="' + alto + '" role="img" aria-label="' +
      UI.h('Ventas cobradas por ' + unidadVentas + ': total ' + UI.moneda(total) + ', máximo ' + UI.moneda(maxVal)) + '">' + g + '</svg>';
  }

  function construirSerieVentas(filas, p) {
    const pagadas = filas.filter(function (f) { return f.estado_pago === 'EXITOSO'; });
    const fechas = filas.map(function (f) { return f.fecha_pedido.slice(0, 10); }).sort();
    const desde = p.desde || fechas[0];
    const hasta = p.hasta || fechas[fechas.length - 1];
    const porClave = {};
    const mensual = diasEntre(desde, hasta) + 1 > 92;
    unidadVentas = mensual ? 'mes' : 'día';
    pagadas.forEach(function (f) {
      const dia = f.fecha_pedido.slice(0, 10);
      const k = mensual ? dia.slice(0, 7) : dia;
      porClave[k] = (porClave[k] || 0) + f.subtotal;
    });
    const serie = [];
    if (mensual) {
      let y = Number(desde.slice(0, 4)), m = Number(desde.slice(5, 7));
      const ym = hasta.slice(0, 7);
      for (;;) {
        const k = y + '-' + String(m).padStart(2, '0');
        serie.push({ clave: k, corto: etiquetaMes(k), largo: 'Mes de ' + etiquetaMes(k), valor: Math.round((porClave[k] || 0) * 100) / 100 });
        if (k >= ym) break;
        m++;
        if (m > 12) { m = 1; y++; }
      }
    } else {
      for (let d = desde; d <= hasta; d = sumarDias(d, 1)) {
        serie.push({ clave: d, corto: etiquetaDia(d), largo: UI.fecha(d), valor: Math.round((porClave[d] || 0) * 100) / 100 });
      }
    }
    return serie;
  }

  /* ---------- Situación actual (no depende del período) ---------- */
  function dibujarSituacionActual() {
    const hoy = UI.hoy();
    const pres = DB.tabla('presentaciones').filter(function (x) { return x.activo; });
    const ins = DB.tabla('insumos').filter(function (x) { return x.activo; });
    const estadoExist = function (n) { return n <= 0 ? '<span class="estado-critico">' + ICONO_ALERTA + 'Sin existencia</span>' : ''; };
    const filaExist = function (nombre, cant, unidad) {
      return '<tr><td>' + UI.h(nombre) + '</td><td class="text-end">' + UI.h(UI.num(cant) + (unidad ? ' ' + unidad : '')) + '</td><td>' + estadoExist(cant) + '</td></tr>';
    };
    $('situacion-existencias').innerHTML =
      '<div class="viz-card"><h2>Existencias</h2><p class="viz-sub">Situación actual, sin filtrar por período.</p>' +
      '<h3 class="h6 mt-2">Producto terminado</h3><div class="table-responsive"><table class="table table-sm viz-tabla mb-3"><thead><tr><th>Presentación</th><th class="text-end">Existencia</th><th>Estado</th></tr></thead><tbody>' +
      (pres.length ? pres.map(function (x) { return filaExist(UI.nombrePresentacion(x.id_presentacion), x.existencia_actual, ''); }).join('') : '<tr><td colspan="3" class="text-muted text-center">Sin presentaciones activas.</td></tr>') + '</tbody></table></div>' +
      '<h3 class="h6">Insumos</h3><div class="table-responsive"><table class="table table-sm viz-tabla mb-0"><thead><tr><th>Insumo</th><th class="text-end">Existencia</th><th>Estado</th></tr></thead><tbody>' +
      (ins.length ? ins.map(function (x) { return filaExist(x.nombre, x.existencia_actual, x.unidad_medida); }).join('') : '<tr><td colspan="3" class="text-muted text-center">Sin insumos activos.</td></tr>') + '</tbody></table></div></div>';

    const lotes = DB.tabla('lotes').slice().sort(function (a, b) { return a.fecha_caducidad < b.fecha_caducidad ? -1 : a.fecha_caducidad > b.fecha_caducidad ? 1 : 0; });
    $('situacion-lotes').innerHTML =
      '<div class="viz-card"><h2>Próximas caducidades</h2><p class="viz-sub">Lotes ordenados por fecha de caducidad. Situación actual, sin filtrar por período.</p>' +
      '<div class="table-responsive"><table class="table table-sm viz-tabla mb-0"><thead><tr><th>Lote</th><th>Caducidad</th><th>Plazo</th><th class="text-end">Producidas</th><th class="text-end">Sin asignar</th></tr></thead><tbody>' +
      (lotes.length ? lotes.map(function (l) {
        const dl = DB.tabla('detalle_lote').filter(function (d) { return d.lote_id === l.id_lote; });
        const producidas = dl.reduce(function (a, d) { return a + d.cantidad_producida; }, 0);
        const libres = dl.reduce(function (a, d) { return a + Logica.disponibleLote(d.id_detalle_lote); }, 0);
        const dias = diasEntre(hoy, l.fecha_caducidad);
        const plazo = dias < 0 ? '<span class="estado-critico">' + ICONO_ALERTA + 'Vencido hace ' + (-dias) + ' día(s)</span>' : dias === 0 ? 'Vence hoy' : 'En ' + dias + ' día(s)';
        return '<tr><td><a href="trazabilidad.html?id=' + l.id_lote + '">' + UI.h(l.codigo_lote) + '</a></td><td>' + UI.fecha(l.fecha_caducidad) + '</td><td>' + plazo + '</td><td class="text-end">' + producidas + '</td><td class="text-end">' + libres + '</td></tr>';
      }).join('') : '<tr><td colspan="5" class="text-center text-muted">Aún no hay lotes.</td></tr>') + '</tbody></table></div></div>';
  }

  /* ---------- Render principal ---------- */
  function render() {
    const p = periodo();
    $('p-rango').classList.toggle('d-none', $('p-tipo').value !== 'rango');
    const alerta = $('alerta');
    alerta.classList.add('d-none');
    let filas;
    try {
      filas = consultarVentas(p.desde, p.hasta);
    } catch (e) {
      alerta.textContent = e.message;
      alerta.classList.remove('d-none');
      return;
    }
    const resumen = { monto_pagado: 0, monto_por_cobrar: 0 };
    filas.forEach(function (f) {
      if (f.estado_pago === 'EXITOSO') resumen.monto_pagado += f.subtotal; else resumen.monto_por_cobrar += f.subtotal;
    });
    resumen.monto_pagado = Math.round(resumen.monto_pagado * 100) / 100;
    resumen.monto_por_cobrar = Math.round(resumen.monto_por_cobrar * 100) / 100;

    const pedidos = {};
    filas.forEach(function (f) { pedidos[f.id_pedido] = f.estado_pedido; });
    const idsPedidos = Object.keys(pedidos);
    const pagadas = filas.filter(function (f) { return f.estado_pago === 'EXITOSO'; });
    const pedidosCobrados = new Set(pagadas.map(function (f) { return f.id_pedido; })).size;
    const unidadesCobradas = pagadas.reduce(function (a, f) { return a + f.cantidad; }, 0);
    const porEstado = {};
    ESTADOS_PEDIDO.forEach(function (e) { porEstado[e] = 0; });
    idsPedidos.forEach(function (id) { porEstado[pedidos[id]]++; });
    const porAtender = porEstado.PAGADO + porEstado.EN_PREPARACION;
    const ticket = pedidosCobrados ? resumen.monto_pagado / pedidosCobrados : 0;

    // Cifra principal + fichas
    $('hero').innerHTML = '<div class="viz-card"><div class="ficha-etiqueta">Ventas cobradas</div><div class="hero-cifra">' + UI.h(UI.moneda(resumen.monto_pagado)) + '</div>' +
      '<div class="ficha-detalle">' + pedidosCobrados + ' pedido(s) con pago exitoso · ' + UI.h(p.texto) + '</div></div>';
    $('fichas').innerHTML =
      ficha('Pedidos del período', String(idsPedidos.length), 'Todos los estados') +
      ficha('Por atender', String(porAtender), porEstado.PAGADO + ' pagado(s) · ' + porEstado.EN_PREPARACION + ' en preparación') +
      ficha('Pendientes de pago', String(porEstado.PENDIENTE_PAGO), UI.moneda(resumen.monto_por_cobrar) + ' por cobrar') +
      ficha('Ticket promedio', UI.moneda(ticket), unidadesCobradas + ' unidad(es) cobradas');

    // Gráfico 1: ventas por día o mes
    serieVentas = construirSerieVentas(filas, p);
    const hayVentas = serieVentas.some(function (s) { return s.valor > 0; });
    const etqUnidad = unidadVentas === 'mes' ? 'mes' : 'día';
    const graficoVentas = hayVentas ? '<div id="col-ventas"></div>' : '<div class="viz-vacio">Sin ventas cobradas en este período.</div>';
    const tablaVentas = tablaSimple([etqUnidad === 'mes' ? 'Mes' : 'Fecha', 'Ventas cobradas'], serieVentas.map(function (s) { return [s.largo, UI.moneda(s.valor)]; }));

    // Gráfico 2: pedidos por estado
    const itemsEstado = ESTADOS_PEDIDO.map(function (e) { return { etiqueta: ETIQUETA_ESTADO[e], valor: porEstado[e] }; });
    const graficoEstado = idsPedidos.length ? barrasHorizontales(itemsEstado, 'pedido(s)') : '<div class="viz-vacio">Sin pedidos en este período.</div>';
    const tablaEstado = tablaSimple(['Estado', 'Pedidos'], itemsEstado.map(function (i) { return [i.etiqueta, String(i.valor)]; }));

    // Gráfico 3: unidades cobradas por presentación
    const porPres = {};
    pagadas.forEach(function (f) {
      const k = f.producto + ' – ' + f.presentacion;
      porPres[k] = (porPres[k] || 0) + f.cantidad;
    });
    const itemsPres = Object.keys(porPres).map(function (k) { return { etiqueta: k, valor: porPres[k] }; }).sort(function (a, b) { return b.valor - a.valor; }).slice(0, 8);
    const graficoPres = barrasHorizontales(itemsPres, 'unidad(es)');
    const tablaPres = tablaSimple(['Presentación', 'Unidades cobradas'], itemsPres.map(function (i) { return [i.etiqueta, String(i.valor)]; }));

    $('graficos').innerHTML =
      '<div class="col-lg-7">' + tarjeta('g-ventas', 'Ventas cobradas por ' + etqUnidad, 'Pedidos con pago exitoso, según la fecha del pedido · ' + p.texto, graficoVentas, tablaVentas) + '</div>' +
      '<div class="col-lg-5">' + tarjeta('g-estado', 'Pedidos por estado', p.texto, graficoEstado, tablaEstado) + '</div>' +
      '<div class="col-12">' + tarjeta('g-pres', 'Unidades cobradas por presentación', 'Ordenadas de mayor a menor · ' + p.texto, graficoPres, tablaPres) + '</div>';
    if (hayVentas) dibujarColumnas();
    dibujarSituacionActual();
  }

  /* ---------- Eventos ---------- */
  $('graficos').addEventListener('click', function (e) {
    const b = e.target.closest('[data-alterna]');
    if (!b) return;
    const id = b.dataset.alterna;
    if (vistaTabla.has(id)) vistaTabla.delete(id); else vistaTabla.add(id);
    const card = $(id);
    const enTabla = vistaTabla.has(id);
    card.querySelector('.viz-vista-grafico').classList.toggle('d-none', enTabla);
    card.querySelector('.viz-vista-tabla').classList.toggle('d-none', !enTabla);
    b.textContent = enTabla ? 'Ver gráfico' : 'Ver tabla';
    b.setAttribute('aria-pressed', String(enTabla));
    if (!enTabla && id === 'g-ventas') dibujarColumnas();
  });
  ['p-tipo', 'p-desde', 'p-hasta'].forEach(function (id) { $(id).addEventListener('change', render); });
  let temporizador = null;
  window.addEventListener('resize', function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { if ($('col-ventas') && !vistaTabla.has('g-ventas')) dibujarColumnas(); }, 150);
  });

  render();
});
