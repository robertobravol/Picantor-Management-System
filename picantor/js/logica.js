/*
 * logica.js - Reglas de negocio y operaciones sobre los datos del prototipo.
 * Cada operación valida primero y se ejecuta dentro de DB.transaccion, de modo que si algo falla no queda nada a medias.
 * Las existencias solo cambian mediante movimientos de inventario (restricción 14 del modelo).
 */
const Logica = (function () {
  const T = function (n) { return DB.tabla(n); };
  const red = function (n) { return Math.round(n * 1000) / 1000; };

  function uid() {
    const s = Auth.sesion();
    return s ? s.usuario_id : null;
  }

  /* Simulación de permisos por rol: cada operación indica qué rol puede ejecutarla. */
  function exigirRol(rol) {
    const s = Auth.sesion();
    if (!s || s.rol !== rol) throw new Error('Operación no permitida para tu rol (simulación de roles).');
    return s;
  }

  function registrarActividad(accion, detalle) {
    DB.insertar('actividad', { fecha_hora: UI.ahora(), usuario_id: uid(), accion: accion, detalle: detalle });
  }

  function hayFecha(s) {
    return /^\d{4}-\d{2}-\d{2}/.test(s || '');
  }

  /* ---------- Inventario ---------- */

  /* Registra un movimiento y actualiza la existencia. Lanza error si la existencia quedaría negativa. */
  function mover(m) {
    const esInsumo = m.insumo_id != null;
    const item = esInsumo ? DB.obtener('insumos', m.insumo_id) : DB.obtener('presentaciones', m.presentacion_id);
    if (!item) throw new Error('El ítem del movimiento no existe.');
    const delta = m.tipo_movimiento === 'ENTRADA' ? m.cantidad : -m.cantidad;
    const nueva = red(item.existencia_actual + delta);
    if (nueva < 0) throw new Error('Existencia insuficiente de "' + item.nombre + '" (disponible: ' + item.existencia_actual + ').');
    item.existencia_actual = nueva;
    DB.insertar('movimientos', {
      fecha_hora: UI.ahora(),
      tipo_movimiento: m.tipo_movimiento,
      insumo_id: esInsumo ? Number(m.insumo_id) : null,
      presentacion_id: esInsumo ? null : Number(m.presentacion_id),
      cantidad: red(m.cantidad),
      tipo_origen: m.tipo_origen,
      id_origen: m.id_origen,
      registrado_por: uid()
    });
  }

  /* ---------- Abastecimiento (M02) ---------- */

  function detallesCompra(compraId) {
    return T('detalle_compra').filter(function (d) { return d.compra_id === compraId; });
  }

  function recibido(detalleCompraId) {
    return red(T('detalle_recepcion')
      .filter(function (r) { return r.detalle_compra_id === detalleCompraId; })
      .reduce(function (a, r) { return a + r.cantidad_recibida; }, 0));
  }

  function pendiente(det) {
    return red(det.cantidad_comprada - recibido(det.id_detalle_compra));
  }

  function estadoRecepcion(compraId) {
    const dets = detallesCompra(compraId);
    const rec = dets.reduce(function (a, d) { return a + recibido(d.id_detalle_compra); }, 0);
    if (rec === 0) return 'PENDIENTE';
    return dets.every(function (d) { return pendiente(d) <= 0; }) ? 'COMPLETA' : 'PARCIAL';
  }

  function crearCompra(datos) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const prov = DB.obtener('proveedores', datos.proveedor_id);
      if (!prov || !prov.activo) throw new Error('Selecciona un proveedor activo.');
      if (!hayFecha(datos.fecha_compra)) throw new Error('Indica la fecha de la compra.');
      if (!datos.lineas.length) throw new Error('Agrega al menos un insumo.');
      const vistos = new Set();
      datos.lineas.forEach(function (l) {
        const ins = DB.obtener('insumos', l.insumo_id);
        if (!ins || !ins.activo) throw new Error('Selecciona insumos activos en todas las filas.');
        if (vistos.has(ins.id_insumo)) throw new Error('El insumo "' + ins.nombre + '" está repetido.');
        vistos.add(ins.id_insumo);
        if (!(l.cantidad > 0)) throw new Error('Las cantidades deben ser mayores que cero.');
      });
      const c = DB.insertar('compras', { proveedor_id: prov.id_proveedor, fecha_compra: datos.fecha_compra, registrado_por: uid() });
      datos.lineas.forEach(function (l) {
        DB.insertar('detalle_compra', { compra_id: c.id_compra, insumo_id: Number(l.insumo_id), cantidad_comprada: red(l.cantidad) });
      });
      registrarActividad('REGISTRO_COMPRA', 'Compra #' + c.id_compra + ' a ' + prov.nombre);
      return c;
    });
  }

  function registrarRecepcion(datos) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const compra = DB.obtener('compras', datos.compra_id);
      if (!compra) throw new Error('La compra no existe.');
      if (!hayFecha(datos.fecha_recepcion)) throw new Error('Indica la fecha de recepción.');
      const lineas = datos.lineas.filter(function (l) { return l.cantidad > 0; });
      if (!lineas.length) throw new Error('Indica al menos una cantidad recibida mayor que cero.');
      lineas.forEach(function (l) {
        const det = DB.obtener('detalle_compra', l.detalle_compra_id);
        if (!det || det.compra_id !== compra.id_compra) throw new Error('Línea de compra inválida.');
        if (l.cantidad > pendiente(det) + 1e-9) {
          throw new Error('La cantidad recibida de "' + UI.nombreInsumo(det.insumo_id) + '" supera la pendiente de la compra.');
        }
      });
      const r = DB.insertar('recepciones', { compra_id: compra.id_compra, fecha_recepcion: datos.fecha_recepcion, registrado_por: uid() });
      lineas.forEach(function (l) {
        const det = DB.obtener('detalle_compra', l.detalle_compra_id);
        DB.insertar('detalle_recepcion', { recepcion_id: r.id_recepcion, detalle_compra_id: det.id_detalle_compra, cantidad_recibida: red(l.cantidad) });
        mover({ tipo_movimiento: 'ENTRADA', insumo_id: det.insumo_id, cantidad: l.cantidad, tipo_origen: 'RECEPCION', id_origen: r.id_recepcion });
      });
      registrarActividad('REGISTRO_RECEPCION', 'Recepción #' + r.id_recepcion + ' de la compra #' + compra.id_compra);
      return r;
    });
  }

  /* ---------- Producción y trazabilidad (M04) ---------- */

  function siguienteCodigoLote() {
    const n = T('lotes').length + 1;
    return 'LOTE-' + new Date().getFullYear() + '-' + String(n).padStart(3, '0');
  }

  function crearLote(datos) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const codigo = String(datos.codigo_lote || '').trim();
      if (!codigo) throw new Error('Indica el código del lote.');
      if (T('lotes').some(function (l) { return l.codigo_lote.toLowerCase() === codigo.toLowerCase(); })) {
        throw new Error('Ya existe un lote con el código "' + codigo + '".');
      }
      if (!hayFecha(datos.fecha_elaboracion) || !hayFecha(datos.fecha_caducidad)) throw new Error('Indica las fechas de elaboración y caducidad.');
      if (datos.fecha_caducidad <= datos.fecha_elaboracion) throw new Error('La fecha de caducidad debe ser posterior a la de elaboración.');
      if (!datos.producciones.length) throw new Error('Agrega al menos una presentación producida.');
      if (!datos.consumos.length) throw new Error('Agrega al menos un insumo consumido.');
      const pv = new Set();
      datos.producciones.forEach(function (p) {
        const pr = DB.obtener('presentaciones', p.presentacion_id);
        if (!pr || !pr.activo) throw new Error('Selecciona presentaciones activas.');
        if (pv.has(pr.id_presentacion)) throw new Error('La presentación "' + UI.nombrePresentacion(pr.id_presentacion) + '" está repetida.');
        pv.add(pr.id_presentacion);
        if (!Number.isInteger(p.cantidad) || p.cantidad < 1) throw new Error('Las unidades producidas deben ser un entero mayor que cero.');
      });
      const iv = new Set();
      datos.consumos.forEach(function (c) {
        const ins = DB.obtener('insumos', c.insumo_id);
        if (!ins || !ins.activo) throw new Error('Selecciona insumos activos.');
        if (iv.has(ins.id_insumo)) throw new Error('El insumo "' + ins.nombre + '" está repetido.');
        iv.add(ins.id_insumo);
        if (!(c.cantidad > 0)) throw new Error('Las cantidades consumidas deben ser mayores que cero.');
      });
      const lote = DB.insertar('lotes', { codigo_lote: codigo, fecha_elaboracion: datos.fecha_elaboracion, fecha_caducidad: datos.fecha_caducidad, registrado_por: uid() });
      datos.consumos.forEach(function (c) {
        DB.insertar('consumo_insumo_lote', { lote_id: lote.id_lote, insumo_id: Number(c.insumo_id), cantidad_consumida: red(c.cantidad) });
        mover({ tipo_movimiento: 'SALIDA', insumo_id: c.insumo_id, cantidad: c.cantidad, tipo_origen: 'CONSUMO_LOTE', id_origen: lote.id_lote });
      });
      datos.producciones.forEach(function (p) {
        DB.insertar('detalle_lote', { lote_id: lote.id_lote, presentacion_id: Number(p.presentacion_id), cantidad_producida: p.cantidad });
        mover({ tipo_movimiento: 'ENTRADA', presentacion_id: p.presentacion_id, cantidad: p.cantidad, tipo_origen: 'PRODUCCION_LOTE', id_origen: lote.id_lote });
      });
      registrarActividad('REGISTRO_LOTE', 'Lote ' + lote.codigo_lote);
      return lote;
    });
  }

  function asignadoDeDetalleLote(detalleLoteId) {
    return T('asignacion_lote')
      .filter(function (a) { return a.detalle_lote_id === detalleLoteId; })
      .reduce(function (s, a) { return s + a.cantidad; }, 0);
  }

  function asignadoDeDetallePedido(detallePedidoId) {
    return T('asignacion_lote')
      .filter(function (a) { return a.detalle_pedido_id === detallePedidoId; })
      .reduce(function (s, a) { return s + a.cantidad; }, 0);
  }

  function disponibleLote(detalleLoteId) {
    const dl = DB.obtener('detalle_lote', detalleLoteId);
    return dl.cantidad_producida - asignadoDeDetalleLote(detalleLoteId);
  }

  /* Detalles de lote de una presentación con unidades aún sin asignar, el que caduca antes primero. */
  function lotesDisponibles(presentacionId) {
    return T('detalle_lote')
      .filter(function (dl) { return dl.presentacion_id === Number(presentacionId) && disponibleLote(dl.id_detalle_lote) > 0; })
      .sort(function (a, b) {
        const la = DB.obtener('lotes', a.lote_id);
        const lb = DB.obtener('lotes', b.lote_id);
        return la.fecha_caducidad < lb.fecha_caducidad ? -1 : la.fecha_caducidad > lb.fecha_caducidad ? 1 : 0;
      });
  }

  function trazabilidad(loteId) {
    const lote = DB.obtener('lotes', loteId);
    if (!lote) return null;
    const producido = T('detalle_lote').filter(function (d) { return d.lote_id === lote.id_lote; });
    const consumos = T('consumo_insumo_lote').filter(function (c) { return c.lote_id === lote.id_lote; });
    const idsDetalleLote = producido.map(function (d) { return d.id_detalle_lote; });
    const entregas = T('asignacion_lote')
      .filter(function (a) { return idsDetalleLote.indexOf(a.detalle_lote_id) !== -1; })
      .map(function (a) {
        const dp = DB.obtener('detalle_pedido', a.detalle_pedido_id);
        return { pedido: DB.obtener('pedidos', dp.pedido_id), presentacion_id: dp.presentacion_id, cantidad: a.cantidad };
      });
    return { lote: lote, producido: producido, consumos: consumos, entregas: entregas };
  }

  /* ---------- Pedidos (M05) ---------- */

  function detallesPedido(pedidoId) {
    return T('detalle_pedido').filter(function (d) { return d.pedido_id === pedidoId; });
  }

  function validarLineasPedido(lineas) {
    if (!lineas.length) throw new Error('Agrega al menos un producto al pedido.');
    const vistos = new Set();
    lineas.forEach(function (l) {
      const pr = DB.obtener('presentaciones', l.presentacion_id);
      if (!pr || !pr.activo) throw new Error('Selecciona presentaciones disponibles en todas las líneas.');
      const prod = DB.obtener('productos', pr.producto_id);
      if (!prod || !prod.activo) throw new Error('Uno de los productos ya no está activo.');
      const nombre = prod.nombre + ' – ' + pr.nombre;
      if (vistos.has(pr.id_presentacion)) throw new Error('"' + nombre + '" está repetido en el pedido.');
      vistos.add(pr.id_presentacion);
      if (!Number.isInteger(l.cantidad) || l.cantidad < 1) throw new Error('La cantidad debe ser un número entero mayor que cero.');
      if (l.cantidad > pr.existencia_actual) {
        throw new Error('Sin disponibilidad suficiente de ' + nombre + ' (disponibles: ' + pr.existencia_actual + ').');
      }
    });
  }

  function crearPedido(datos) {
    const s = exigirRol('cliente');
    return DB.transaccion(function () {
      if (!s.id_cliente) throw new Error('Tu cuenta no tiene un perfil de cliente.');
      validarLineasPedido(datos.lineas);
      let total = 0;
      datos.lineas.forEach(function (l) { total += DB.obtener('presentaciones', l.presentacion_id).precio * l.cantidad; });
      const p = DB.insertar('pedidos', { cliente_id: s.id_cliente, fecha_pedido: UI.ahora(), estado: 'PENDIENTE_PAGO', total: red(total) });
      datos.lineas.forEach(function (l) {
        const pr = DB.obtener('presentaciones', l.presentacion_id);
        DB.insertar('detalle_pedido', { pedido_id: p.id_pedido, presentacion_id: pr.id_presentacion, cantidad: l.cantidad, precio_unitario: pr.precio });
      });
      registrarActividad('REGISTRO_PEDIDO', 'Pedido #' + p.id_pedido);
      return p;
    });
  }

  function asignacionCompleta(pedidoId) {
    return detallesPedido(pedidoId).every(function (d) { return asignadoDeDetallePedido(d.id_detalle_pedido) >= d.cantidad; });
  }

  function asignarLote(detallePedidoId, detalleLoteId, cantidad) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const dp = DB.obtener('detalle_pedido', detallePedidoId);
      const dl = DB.obtener('detalle_lote', detalleLoteId);
      if (!dp || !dl) throw new Error('Selecciona el ítem y el lote.');
      const ped = DB.obtener('pedidos', dp.pedido_id);
      if (['PAGADO', 'EN_PREPARACION'].indexOf(ped.estado) === -1) throw new Error('Solo se asignan lotes a pedidos pagados que aún no se despachan.');
      if (dl.presentacion_id !== dp.presentacion_id) throw new Error('El lote no produjo la presentación pedida.');
      if (!Number.isInteger(cantidad) || cantidad < 1) throw new Error('La cantidad debe ser un entero mayor que cero.');
      const faltante = dp.cantidad - asignadoDeDetallePedido(dp.id_detalle_pedido);
      if (cantidad > faltante) throw new Error('Solo faltan ' + faltante + ' unidades por asignar en este ítem.');
      const libre = disponibleLote(dl.id_detalle_lote);
      if (cantidad > libre) throw new Error('El lote solo tiene ' + libre + ' unidades sin asignar.');
      DB.insertar('asignacion_lote', { detalle_pedido_id: dp.id_detalle_pedido, detalle_lote_id: dl.id_detalle_lote, cantidad: cantidad });
      registrarActividad('ASIGNACION_LOTE', 'Pedido #' + ped.id_pedido + ': ' + cantidad + ' u. del lote ' + DB.obtener('lotes', dl.lote_id).codigo_lote);
    });
  }

  /* Asigna lotes al pedido empezando por el que caduca primero. */
  function asignarAutomatico(pedidoId) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const ped = DB.obtener('pedidos', pedidoId);
      if (!ped || ['PAGADO', 'EN_PREPARACION'].indexOf(ped.estado) === -1) throw new Error('Solo se asignan lotes a pedidos pagados que aún no se despachan.');
      detallesPedido(ped.id_pedido).forEach(function (dp) {
        let falta = dp.cantidad - asignadoDeDetallePedido(dp.id_detalle_pedido);
        lotesDisponibles(dp.presentacion_id).forEach(function (dl) {
          if (falta <= 0) return;
          const tomar = Math.min(falta, disponibleLote(dl.id_detalle_lote));
          if (tomar > 0) {
            DB.insertar('asignacion_lote', { detalle_pedido_id: dp.id_detalle_pedido, detalle_lote_id: dl.id_detalle_lote, cantidad: tomar });
            falta -= tomar;
          }
        });
        if (falta > 0) throw new Error('No hay lotes con unidades suficientes de ' + UI.nombrePresentacion(dp.presentacion_id) + ' (faltan ' + falta + ').');
      });
      registrarActividad('ASIGNACION_LOTE', 'Asignación automática de lotes al pedido #' + ped.id_pedido);
    });
  }

  function marcarEnPreparacion(pedidoId) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const ped = DB.obtener('pedidos', pedidoId);
      if (!ped || ped.estado !== 'PAGADO') throw new Error('Solo un pedido pagado puede pasar a preparación.');
      ped.estado = 'EN_PREPARACION';
      registrarActividad('CAMBIO_ESTADO_PEDIDO', 'Pedido #' + ped.id_pedido + ' en preparación');
    });
  }

  /* ---------- Pagos y facturación (M06) ---------- */

  /*
   * Simula el pago con tarjeta. Los datos de la tarjeta nunca llegan aquí ni se guardan.
   * Si es exitoso: pedido PAGADO y salida de producto terminado del inventario.
   */
  function pagarPedido(pedidoId, exitoso) {
    const s = exigirRol('cliente');
    return DB.transaccion(function () {
      const ped = DB.obtener('pedidos', pedidoId);
      if (!ped || ped.cliente_id !== s.id_cliente) throw new Error('Pedido no encontrado.');
      if (ped.estado !== 'PENDIENTE_PAGO') throw new Error('Este pedido ya fue pagado.');
      if (!exitoso) {
        const f = DB.insertar('pagos', { pedido_id: ped.id_pedido, metodo_pago: 'TARJETA', monto: ped.total, estado_pago: 'FALLIDO', referencia_transaccion: null, fecha_hora: UI.ahora() });
        registrarActividad('PAGO_FALLIDO', 'Pedido #' + ped.id_pedido + ' (simulado)');
        return f;
      }
      detallesPedido(ped.id_pedido).forEach(function (d) {
        const pr = DB.obtener('presentaciones', d.presentacion_id);
        if (d.cantidad > pr.existencia_actual) {
          throw new Error('Sin disponibilidad suficiente de ' + UI.nombrePresentacion(pr.id_presentacion) + ' (disponibles: ' + pr.existencia_actual + '). No se registró el pago.');
        }
      });
      const referencia = 'SIM-' + (100000 + T('pagos').length + 1);
      const pago = DB.insertar('pagos', { pedido_id: ped.id_pedido, metodo_pago: 'TARJETA', monto: ped.total, estado_pago: 'EXITOSO', referencia_transaccion: referencia, fecha_hora: UI.ahora() });
      ped.estado = 'PAGADO';
      detallesPedido(ped.id_pedido).forEach(function (d) {
        mover({ tipo_movimiento: 'SALIDA', presentacion_id: d.presentacion_id, cantidad: d.cantidad, tipo_origen: 'PEDIDO', id_origen: ped.id_pedido });
      });
      registrarActividad('PAGO_EXITOSO', 'Pedido #' + ped.id_pedido + ' pagado con tarjeta (simulado)');
      return pago;
    });
  }

  function documentosDePedido(pedidoId) {
    return T('documentos').filter(function (d) { return d.pedido_id === pedidoId; });
  }

  function pagoExitoso(pedidoId) {
    return T('pagos').find(function (p) { return p.pedido_id === pedidoId && p.estado_pago === 'EXITOSO'; });
  }

  /* Pedidos con pago exitoso que todavía no tienen documentos de venta. */
  function pedidosSinDocumentos() {
    return T('pedidos').filter(function (p) { return pagoExitoso(p.id_pedido) && documentosDePedido(p.id_pedido).length === 0; });
  }

  function digitosAleatorios(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
  }

  /* Emite la factura electrónica y el comprobante interno (SIMULADOS, sin validez legal). */
  function emitirDocumentos(pedidoId) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const ped = DB.obtener('pedidos', pedidoId);
      if (!ped) throw new Error('Pedido no encontrado.');
      if (!pagoExitoso(ped.id_pedido)) throw new Error('Solo se emiten documentos de pedidos con pago exitoso.');
      if (documentosDePedido(ped.id_pedido).length) throw new Error('El pedido ya tiene documentos emitidos.');
      const nFact = T('documentos').filter(function (d) { return d.tipo_documento === 'FACTURA_ELECTRONICA'; }).length + 1;
      const nCi = T('documentos').filter(function (d) { return d.tipo_documento === 'COMPROBANTE_INTERNO'; }).length + 1;
      const ahora = UI.ahora();
      DB.insertar('documentos', {
        pedido_id: ped.id_pedido, tipo_documento: 'FACTURA_ELECTRONICA', numero: '001-001-' + String(nFact).padStart(9, '0'),
        clave_acceso: digitosAleatorios(49), estado_autorizacion: 'AUTORIZADO (simulado)', fecha_emision: ahora, total: ped.total
      });
      DB.insertar('documentos', {
        pedido_id: ped.id_pedido, tipo_documento: 'COMPROBANTE_INTERNO', numero: 'CI-' + String(nCi).padStart(4, '0'),
        clave_acceso: null, estado_autorizacion: null, fecha_emision: ahora, total: ped.total
      });
      registrarActividad('EMISION_DOCUMENTOS', 'Documentos simulados del pedido #' + ped.id_pedido);
    });
  }

  /* ---------- Distribución y entrega (M07) ---------- */

  function despachoDePedido(pedidoId) {
    return T('despachos').find(function (d) { return d.pedido_id === pedidoId; });
  }

  function pedidosListosParaDespacho() {
    return T('pedidos').filter(function (p) {
      return ['PAGADO', 'EN_PREPARACION'].indexOf(p.estado) !== -1 && !despachoDePedido(p.id_pedido);
    });
  }

  function registrarDespacho(datos) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const ped = DB.obtener('pedidos', datos.pedido_id);
      if (!ped || ['PAGADO', 'EN_PREPARACION'].indexOf(ped.estado) === -1) throw new Error('Solo se despachan pedidos pagados que aún no salieron.');
      if (despachoDePedido(ped.id_pedido)) throw new Error('El pedido ya tiene un despacho.');
      if (CATALOGOS.TIPOS_ENTREGA.indexOf(datos.tipo_entrega) === -1) throw new Error('Selecciona el tipo de entrega.');
      const transportista = String(datos.transportista_nombre || '').trim();
      if (datos.tipo_entrega === 'EXTERNA' && !transportista) throw new Error('Indica el nombre del transportista externo.');
      if (!datos.fecha_despacho) throw new Error('Indica la fecha de despacho.');
      if (!asignacionCompleta(ped.id_pedido)) {
        throw new Error('Asigna los lotes de todos los ítems antes de despachar (trazabilidad). Hazlo en el detalle del pedido.');
      }
      const d = DB.insertar('despachos', {
        pedido_id: ped.id_pedido, tipo_entrega: datos.tipo_entrega,
        transportista_nombre: datos.tipo_entrega === 'EXTERNA' ? transportista : null,
        fecha_despacho: datos.fecha_despacho, fecha_entrega: null, registrado_por: uid()
      });
      ped.estado = 'DESPACHADO';
      registrarActividad('REGISTRO_DESPACHO', 'Despacho ' + datos.tipo_entrega.toLowerCase() + ' del pedido #' + ped.id_pedido);
      return d;
    });
  }

  function registrarEntrega(datos) {
    exigirRol('personal');
    return DB.transaccion(function () {
      const ped = DB.obtener('pedidos', datos.pedido_id);
      const d = ped ? despachoDePedido(ped.id_pedido) : null;
      if (!ped || !d) throw new Error('El pedido no tiene despacho registrado.');
      if (d.fecha_entrega) throw new Error('La entrega ya fue registrada.');
      if (!datos.fecha_entrega) throw new Error('Indica la fecha de entrega.');
      if (datos.fecha_entrega < d.fecha_despacho) throw new Error('La entrega no puede ser anterior al despacho.');
      d.fecha_entrega = datos.fecha_entrega;
      ped.estado = 'ENTREGADO';
      registrarActividad('REGISTRO_ENTREGA', 'Entrega del pedido #' + ped.id_pedido);
    });
  }

  return {
    registrarActividad: registrarActividad,
    detallesCompra: detallesCompra, recibido: recibido, pendiente: pendiente, estadoRecepcion: estadoRecepcion,
    crearCompra: crearCompra, registrarRecepcion: registrarRecepcion,
    siguienteCodigoLote: siguienteCodigoLote, crearLote: crearLote, trazabilidad: trazabilidad,
    asignadoDeDetallePedido: asignadoDeDetallePedido, asignadoDeDetalleLote: asignadoDeDetalleLote,
    disponibleLote: disponibleLote, lotesDisponibles: lotesDisponibles,
    detallesPedido: detallesPedido, crearPedido: crearPedido, asignacionCompleta: asignacionCompleta,
    asignarLote: asignarLote, asignarAutomatico: asignarAutomatico, marcarEnPreparacion: marcarEnPreparacion,
    pagarPedido: pagarPedido, documentosDePedido: documentosDePedido, pagoExitoso: pagoExitoso,
    pedidosSinDocumentos: pedidosSinDocumentos, emitirDocumentos: emitirDocumentos,
    despachoDePedido: despachoDePedido, pedidosListosParaDespacho: pedidosListosParaDespacho,
    registrarDespacho: registrarDespacho, registrarEntrega: registrarEntrega
  };
})();
