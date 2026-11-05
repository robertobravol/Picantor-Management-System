/*
 * datos.js - Datos de ejemplo de Picantor Management System.
 * SOLO PARA DEMOSTRACIÓN: ni los nombres, ni los precios, ni las presentaciones son datos reales del cliente.
 * Los nombres de tablas y atributos siguen el modelo entidad-relación de la actividad 3.
 * Estos datos se copian a localStorage la primera vez que se abre el prototipo.
 */

/* Valores sugeridos (por confirmar con el cliente). No se guardan en localStorage. */
const CATALOGOS = {
  ESTADOS_PEDIDO: ['PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO'],
  TIPOS_IDENTIFICACION: ['CEDULA', 'RUC', 'PASAPORTE'],
  UNIDADES: ['kg', 'litro', 'unidad'],
  TIPOS_ENTREGA: ['PROPIA', 'EXTERNA']
};

const DATOS_INICIALES = {
  /* Simulación de USUARIO de Django (externa). La contraseña en texto plano es SOLO para la demostración. */
  usuarios: [
    { id: 1, username: 'dueno', password: 'demo123', email: 'dueno@ejemplo.test', is_active: true, rol: 'personal' },
    { id: 2, username: 'empleado1', password: 'demo123', email: 'empleado1@ejemplo.test', is_active: true, rol: 'personal' },
    { id: 3, username: 'empleado2', password: 'demo123', email: 'empleado2@ejemplo.test', is_active: true, rol: 'personal' },
    { id: 4, username: 'cliente1', password: 'demo123', email: 'cliente1@ejemplo.test', is_active: true, rol: 'cliente' },
    { id: 5, username: 'cliente2', password: 'demo123', email: 'cliente2@ejemplo.test', is_active: true, rol: 'cliente' }
  ],

  clientes: [
    { id_cliente: 1, usuario_id: 4, nombre_razon_social: 'Restaurante Ejemplo S.A.', tipo_identificacion: 'RUC', identificacion: '0999999999001', telefono: '0990000001', direccion: 'Av. Demo 123' },
    { id_cliente: 2, usuario_id: 5, nombre_razon_social: 'María Ejemplo', tipo_identificacion: 'CEDULA', identificacion: '0900000002', telefono: '0990000002', direccion: 'Calle Prueba 45' }
  ],

  proveedores: [
    { id_proveedor: 1, nombre: 'Agroproductos del Valle (demo)', telefono: '0981111111', correo: 'ventas@valle.test', direccion: 'Sector Rural 1', activo: true },
    { id_proveedor: 2, nombre: 'Envases y Etiquetas Demo', telefono: '0982222222', correo: 'info@envases.test', direccion: 'Parque Industrial 2', activo: true },
    { id_proveedor: 3, nombre: 'Proveedor Inactivo (demo)', telefono: '0983333333', correo: '', direccion: '', activo: false }
  ],

  insumos: [
    { id_insumo: 1, nombre: 'Ají fresco', unidad_medida: 'kg', existencia_actual: 0, activo: true },
    { id_insumo: 2, nombre: 'Vinagre', unidad_medida: 'litro', existencia_actual: 0, activo: true },
    { id_insumo: 3, nombre: 'Sal', unidad_medida: 'kg', existencia_actual: 0, activo: true },
    { id_insumo: 4, nombre: 'Frascos de vidrio', unidad_medida: 'unidad', existencia_actual: 0, activo: true },
    { id_insumo: 5, nombre: 'Etiquetas', unidad_medida: 'unidad', existencia_actual: 0, activo: true }
  ],

  compras: [
    { id_compra: 1, proveedor_id: 1, fecha_compra: '2026-10-05', registrado_por: 1 },
    { id_compra: 2, proveedor_id: 2, fecha_compra: '2026-10-05', registrado_por: 1 },
    { id_compra: 3, proveedor_id: 1, fecha_compra: '2026-10-24', registrado_por: 2 }
  ],

  detalle_compra: [
    { id_detalle_compra: 1, compra_id: 1, insumo_id: 1, cantidad_comprada: 50 },
    { id_detalle_compra: 2, compra_id: 1, insumo_id: 3, cantidad_comprada: 10 },
    { id_detalle_compra: 3, compra_id: 1, insumo_id: 2, cantidad_comprada: 20 },
    { id_detalle_compra: 4, compra_id: 2, insumo_id: 4, cantidad_comprada: 200 },
    { id_detalle_compra: 5, compra_id: 2, insumo_id: 5, cantidad_comprada: 200 },
    { id_detalle_compra: 6, compra_id: 3, insumo_id: 1, cantidad_comprada: 30 }
  ],

  recepciones: [
    { id_recepcion: 1, compra_id: 1, fecha_recepcion: '2026-10-07', registrado_por: 1 },
    { id_recepcion: 2, compra_id: 2, fecha_recepcion: '2026-10-07', registrado_por: 1 }
  ],

  detalle_recepcion: [
    { id_detalle_recepcion: 1, recepcion_id: 1, detalle_compra_id: 1, cantidad_recibida: 50 },
    { id_detalle_recepcion: 2, recepcion_id: 1, detalle_compra_id: 2, cantidad_recibida: 10 },
    { id_detalle_recepcion: 3, recepcion_id: 1, detalle_compra_id: 3, cantidad_recibida: 20 },
    { id_detalle_recepcion: 4, recepcion_id: 2, detalle_compra_id: 4, cantidad_recibida: 200 },
    { id_detalle_recepcion: 5, recepcion_id: 2, detalle_compra_id: 5, cantidad_recibida: 200 }
  ],

  productos: [
    { id_producto: 1, nombre: 'Salsa de ají artesanal', descripcion: 'Salsa picante de ají (producto de ejemplo).', activo: true },
    { id_producto: 2, nombre: 'Ají encurtido', descripcion: 'Ají en vinagre (producto de ejemplo).', activo: true }
  ],

  /* Tres presentaciones de ejemplo; los tamaños y precios reales los define el cliente. */
  presentaciones: [
    { id_presentacion: 1, producto_id: 1, nombre: 'Frasco pequeño', precio: 3.5, existencia_actual: 0, activo: true },
    { id_presentacion: 2, producto_id: 1, nombre: 'Frasco mediano', precio: 5.5, existencia_actual: 0, activo: true },
    { id_presentacion: 3, producto_id: 2, nombre: 'Frasco grande', precio: 4, existencia_actual: 0, activo: true }
  ],

  /* Las existencias de insumos y presentaciones se recalculan al final de este archivo a partir de estos movimientos. */
  movimientos: [
    { id_movimiento: 1, fecha_hora: '2026-10-07T09:00', tipo_movimiento: 'ENTRADA', insumo_id: 1, presentacion_id: null, cantidad: 50, tipo_origen: 'RECEPCION', id_origen: 1, registrado_por: 1 },
    { id_movimiento: 2, fecha_hora: '2026-10-07T09:00', tipo_movimiento: 'ENTRADA', insumo_id: 3, presentacion_id: null, cantidad: 10, tipo_origen: 'RECEPCION', id_origen: 1, registrado_por: 1 },
    { id_movimiento: 3, fecha_hora: '2026-10-07T09:00', tipo_movimiento: 'ENTRADA', insumo_id: 2, presentacion_id: null, cantidad: 20, tipo_origen: 'RECEPCION', id_origen: 1, registrado_por: 1 },
    { id_movimiento: 4, fecha_hora: '2026-10-07T10:30', tipo_movimiento: 'ENTRADA', insumo_id: 4, presentacion_id: null, cantidad: 200, tipo_origen: 'RECEPCION', id_origen: 2, registrado_por: 1 },
    { id_movimiento: 5, fecha_hora: '2026-10-07T10:30', tipo_movimiento: 'ENTRADA', insumo_id: 5, presentacion_id: null, cantidad: 200, tipo_origen: 'RECEPCION', id_origen: 2, registrado_por: 1 },
    { id_movimiento: 6, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'SALIDA', insumo_id: 1, presentacion_id: null, cantidad: 25, tipo_origen: 'CONSUMO_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 7, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'SALIDA', insumo_id: 2, presentacion_id: null, cantidad: 8, tipo_origen: 'CONSUMO_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 8, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'SALIDA', insumo_id: 3, presentacion_id: null, cantidad: 3, tipo_origen: 'CONSUMO_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 9, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'SALIDA', insumo_id: 4, presentacion_id: null, cantidad: 100, tipo_origen: 'CONSUMO_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 10, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'SALIDA', insumo_id: 5, presentacion_id: null, cantidad: 100, tipo_origen: 'CONSUMO_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 11, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'ENTRADA', insumo_id: null, presentacion_id: 1, cantidad: 60, tipo_origen: 'PRODUCCION_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 12, fecha_hora: '2026-10-10T08:00', tipo_movimiento: 'ENTRADA', insumo_id: null, presentacion_id: 2, cantidad: 40, tipo_origen: 'PRODUCCION_LOTE', id_origen: 1, registrado_por: 2 },
    { id_movimiento: 13, fecha_hora: '2026-10-15T08:00', tipo_movimiento: 'SALIDA', insumo_id: 1, presentacion_id: null, cantidad: 12, tipo_origen: 'CONSUMO_LOTE', id_origen: 2, registrado_por: 3 },
    { id_movimiento: 14, fecha_hora: '2026-10-15T08:00', tipo_movimiento: 'SALIDA', insumo_id: 2, presentacion_id: null, cantidad: 10, tipo_origen: 'CONSUMO_LOTE', id_origen: 2, registrado_por: 3 },
    { id_movimiento: 15, fecha_hora: '2026-10-15T08:00', tipo_movimiento: 'SALIDA', insumo_id: 3, presentacion_id: null, cantidad: 2, tipo_origen: 'CONSUMO_LOTE', id_origen: 2, registrado_por: 3 },
    { id_movimiento: 16, fecha_hora: '2026-10-15T08:00', tipo_movimiento: 'SALIDA', insumo_id: 4, presentacion_id: null, cantidad: 50, tipo_origen: 'CONSUMO_LOTE', id_origen: 2, registrado_por: 3 },
    { id_movimiento: 17, fecha_hora: '2026-10-15T08:00', tipo_movimiento: 'SALIDA', insumo_id: 5, presentacion_id: null, cantidad: 50, tipo_origen: 'CONSUMO_LOTE', id_origen: 2, registrado_por: 3 },
    { id_movimiento: 18, fecha_hora: '2026-10-15T08:00', tipo_movimiento: 'ENTRADA', insumo_id: null, presentacion_id: 3, cantidad: 50, tipo_origen: 'PRODUCCION_LOTE', id_origen: 2, registrado_por: 3 },
    { id_movimiento: 19, fecha_hora: '2026-10-18T10:35', tipo_movimiento: 'SALIDA', insumo_id: null, presentacion_id: 1, cantidad: 10, tipo_origen: 'PEDIDO', id_origen: 1, registrado_por: 4 },
    { id_movimiento: 20, fecha_hora: '2026-10-20T11:50', tipo_movimiento: 'SALIDA', insumo_id: null, presentacion_id: 2, cantidad: 8, tipo_origen: 'PEDIDO', id_origen: 4, registrado_por: 5 },
    { id_movimiento: 21, fecha_hora: '2026-10-25T15:15', tipo_movimiento: 'SALIDA', insumo_id: null, presentacion_id: 1, cantidad: 5, tipo_origen: 'PEDIDO', id_origen: 2, registrado_por: 5 },
    { id_movimiento: 22, fecha_hora: '2026-10-25T15:15', tipo_movimiento: 'SALIDA', insumo_id: null, presentacion_id: 3, cantidad: 4, tipo_origen: 'PEDIDO', id_origen: 2, registrado_por: 5 }
  ],

  lotes: [
    { id_lote: 1, codigo_lote: 'LOTE-2026-001', fecha_elaboracion: '2026-10-10', fecha_caducidad: '2027-04-10', registrado_por: 2 },
    { id_lote: 2, codigo_lote: 'LOTE-2026-002', fecha_elaboracion: '2026-10-15', fecha_caducidad: '2027-01-15', registrado_por: 3 }
  ],

  detalle_lote: [
    { id_detalle_lote: 1, lote_id: 1, presentacion_id: 1, cantidad_producida: 60 },
    { id_detalle_lote: 2, lote_id: 1, presentacion_id: 2, cantidad_producida: 40 },
    { id_detalle_lote: 3, lote_id: 2, presentacion_id: 3, cantidad_producida: 50 }
  ],

  consumo_insumo_lote: [
    { id_consumo: 1, lote_id: 1, insumo_id: 1, cantidad_consumida: 25 },
    { id_consumo: 2, lote_id: 1, insumo_id: 2, cantidad_consumida: 8 },
    { id_consumo: 3, lote_id: 1, insumo_id: 3, cantidad_consumida: 3 },
    { id_consumo: 4, lote_id: 1, insumo_id: 4, cantidad_consumida: 100 },
    { id_consumo: 5, lote_id: 1, insumo_id: 5, cantidad_consumida: 100 },
    { id_consumo: 6, lote_id: 2, insumo_id: 1, cantidad_consumida: 12 },
    { id_consumo: 7, lote_id: 2, insumo_id: 2, cantidad_consumida: 10 },
    { id_consumo: 8, lote_id: 2, insumo_id: 3, cantidad_consumida: 2 },
    { id_consumo: 9, lote_id: 2, insumo_id: 4, cantidad_consumida: 50 },
    { id_consumo: 10, lote_id: 2, insumo_id: 5, cantidad_consumida: 50 }
  ],

  pedidos: [
    { id_pedido: 1, cliente_id: 1, fecha_pedido: '2026-10-18T10:30', estado: 'ENTREGADO', total: 35 },
    { id_pedido: 2, cliente_id: 2, fecha_pedido: '2026-10-25T15:10', estado: 'PAGADO', total: 33.5 },
    { id_pedido: 3, cliente_id: 1, fecha_pedido: '2026-10-26T09:00', estado: 'PENDIENTE_PAGO', total: 33 },
    { id_pedido: 4, cliente_id: 2, fecha_pedido: '2026-10-20T11:45', estado: 'DESPACHADO', total: 44 }
  ],

  detalle_pedido: [
    { id_detalle_pedido: 1, pedido_id: 1, presentacion_id: 1, cantidad: 10, precio_unitario: 3.5 },
    { id_detalle_pedido: 2, pedido_id: 2, presentacion_id: 1, cantidad: 5, precio_unitario: 3.5 },
    { id_detalle_pedido: 3, pedido_id: 2, presentacion_id: 3, cantidad: 4, precio_unitario: 4 },
    { id_detalle_pedido: 4, pedido_id: 3, presentacion_id: 2, cantidad: 6, precio_unitario: 5.5 },
    { id_detalle_pedido: 5, pedido_id: 4, presentacion_id: 2, cantidad: 8, precio_unitario: 5.5 }
  ],

  asignacion_lote: [
    { id_asignacion: 1, detalle_pedido_id: 1, detalle_lote_id: 1, cantidad: 10 },
    { id_asignacion: 2, detalle_pedido_id: 5, detalle_lote_id: 2, cantidad: 8 }
  ],

  pagos: [
    { id_pago: 1, pedido_id: 1, metodo_pago: 'TARJETA', monto: 35, estado_pago: 'EXITOSO', referencia_transaccion: 'SIM-100001', fecha_hora: '2026-10-18T10:35' },
    { id_pago: 2, pedido_id: 4, metodo_pago: 'TARJETA', monto: 44, estado_pago: 'EXITOSO', referencia_transaccion: 'SIM-100002', fecha_hora: '2026-10-20T11:50' },
    { id_pago: 3, pedido_id: 2, metodo_pago: 'TARJETA', monto: 33.5, estado_pago: 'EXITOSO', referencia_transaccion: 'SIM-100003', fecha_hora: '2026-10-25T15:15' },
    { id_pago: 4, pedido_id: 3, metodo_pago: 'TARJETA', monto: 33, estado_pago: 'FALLIDO', referencia_transaccion: null, fecha_hora: '2026-10-26T09:05' }
  ],

  /* Documentos simulados: la clave de acceso y la autorización NO tienen validez legal. */
  documentos: [
    { id_documento: 1, pedido_id: 1, tipo_documento: 'FACTURA_ELECTRONICA', numero: '001-001-000000001', clave_acceso: '1810202601' + '0999999999001' + '1' + '001001' + '000000001' + '12345678' + '1' + '3', estado_autorizacion: 'AUTORIZADO (simulado)', fecha_emision: '2026-10-18T11:00', total: 35 },
    { id_documento: 2, pedido_id: 1, tipo_documento: 'COMPROBANTE_INTERNO', numero: 'CI-0001', clave_acceso: null, estado_autorizacion: null, fecha_emision: '2026-10-18T11:00', total: 35 },
    { id_documento: 3, pedido_id: 4, tipo_documento: 'FACTURA_ELECTRONICA', numero: '001-001-000000002', clave_acceso: '2010202601' + '0999999999001' + '1' + '001001' + '000000002' + '12345678' + '1' + '7', estado_autorizacion: 'AUTORIZADO (simulado)', fecha_emision: '2026-10-20T12:10', total: 44 },
    { id_documento: 4, pedido_id: 4, tipo_documento: 'COMPROBANTE_INTERNO', numero: 'CI-0002', clave_acceso: null, estado_autorizacion: null, fecha_emision: '2026-10-20T12:10', total: 44 }
  ],

  despachos: [
    { id_despacho: 1, pedido_id: 1, tipo_entrega: 'PROPIA', transportista_nombre: null, fecha_despacho: '2026-10-19T09:00', fecha_entrega: '2026-10-19T14:00', registrado_por: 2 },
    { id_despacho: 2, pedido_id: 4, tipo_entrega: 'EXTERNA', transportista_nombre: 'Transportes Ejemplo S.A.', fecha_despacho: '2026-10-21T08:30', fecha_entrega: null, registrado_por: 2 }
  ],

  /* Constancia de operaciones sensibles (RNF-03). */
  actividad: [
    { id_actividad: 1, fecha_hora: '2026-10-07T09:05', usuario_id: 1, accion: 'REGISTRO_RECEPCION', detalle: 'Recepción #1 de la compra #1' },
    { id_actividad: 2, fecha_hora: '2026-10-10T08:10', usuario_id: 2, accion: 'REGISTRO_LOTE', detalle: 'Lote LOTE-2026-001' },
    { id_actividad: 3, fecha_hora: '2026-10-15T08:10', usuario_id: 3, accion: 'REGISTRO_LOTE', detalle: 'Lote LOTE-2026-002' },
    { id_actividad: 4, fecha_hora: '2026-10-18T10:35', usuario_id: 4, accion: 'PAGO_EXITOSO', detalle: 'Pedido #1 pagado con tarjeta (simulado)' },
    { id_actividad: 5, fecha_hora: '2026-10-19T14:00', usuario_id: 2, accion: 'REGISTRO_ENTREGA', detalle: 'Entrega del pedido #1' },
    { id_actividad: 6, fecha_hora: '2026-10-21T08:30', usuario_id: 2, accion: 'REGISTRO_DESPACHO', detalle: 'Despacho externo del pedido #4' }
  ]
};

/* Recalcula existencia_actual a partir de los movimientos, para que los datos de ejemplo sean coherentes. */
(function recalcularExistenciasIniciales() {
  DATOS_INICIALES.insumos.forEach(function (i) { i.existencia_actual = 0; });
  DATOS_INICIALES.presentaciones.forEach(function (p) { p.existencia_actual = 0; });
  DATOS_INICIALES.movimientos.forEach(function (m) {
    var delta = m.tipo_movimiento === 'ENTRADA' ? m.cantidad : -m.cantidad;
    var lista = m.insumo_id != null ? DATOS_INICIALES.insumos : DATOS_INICIALES.presentaciones;
    var clave = m.insumo_id != null ? 'id_insumo' : 'id_presentacion';
    var id = m.insumo_id != null ? m.insumo_id : m.presentacion_id;
    var item = lista.find(function (x) { return x[clave] === id; });
    item.existencia_actual = Math.round((item.existencia_actual + delta) * 1000) / 1000;
  });
})();
