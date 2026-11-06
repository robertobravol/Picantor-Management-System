/*
 * auth.js - SIMULACIÓN de inicio de sesión y roles.
 * IMPORTANTE: esto NO es seguridad real. Las contraseñas están en texto plano en datos.js,
 * la sesión vive en sessionStorage y cualquier persona puede modificarlas desde el navegador.
 * Sirve solo para demostrar qué opciones ve cada rol. La seguridad real se hará más adelante con Django.
 */
const Auth = (function () {
  const CLAVE = 'picantor_sesion';

  /* index.html está en la raíz del proyecto; todas las demás páginas están en la carpeta pages/. */
  const EN_RAIZ = document.body.dataset.raiz === 'si';

  /* Devuelve la ruta correcta de una página según desde dónde se llame. */
  function ruta(archivo) {
    if (archivo.split('?')[0] === 'index.html') return EN_RAIZ ? archivo : '../' + archivo;
    return EN_RAIZ ? 'pages/' + archivo : archivo;
  }

  const MENUS = {
    publico: [
      { t: 'Catálogo', h: 'catalogo.html' },
      { t: 'Iniciar sesión', h: 'index.html' },
      { t: 'Registrarse', h: 'registro.html' }
    ],
    cliente: [
      { t: 'Inicio', h: 'inicio-cliente.html' },
      { t: 'Catálogo', h: 'catalogo.html' },
      { t: 'Mi perfil', h: 'perfil.html' },
      { t: 'Nuevo pedido', h: 'nuevo-pedido.html' },
      { t: 'Mis pedidos', h: 'mis-pedidos.html' },
      { t: 'Mis pagos y documentos', h: 'mis-documentos.html' }
    ],
    personal: [
      { t: 'Inicio', h: 'inicio-personal.html' },
      { t: 'Dashboard', h: 'dashboard.html' },
      { t: 'Abastecimiento', sub: [
        { t: 'Proveedores', h: 'proveedores.html' },
        { t: 'Insumos', h: 'insumos.html' },
        { t: 'Compras y recepciones', h: 'compras.html' }
      ] },
      { t: 'Productos e Inventario', sub: [
        { t: 'Productos y presentaciones', h: 'productos.html' },
        { t: 'Existencias', h: 'existencias.html' },
        { t: 'Movimientos de inventario', h: 'movimientos.html' },
        { t: 'Catálogo', h: 'catalogo.html' }
      ] },
      { t: 'Producción', sub: [
        { t: 'Lotes y trazabilidad', h: 'lotes.html' }
      ] },
      { t: 'Pedidos y Clientes', sub: [
        { t: 'Pedidos', h: 'pedidos.html' },
        { t: 'Clientes', h: 'clientes.html' }
      ] },
      { t: 'Pagos y Facturación', sub: [
        { t: 'Pagos', h: 'pagos.html' },
        { t: 'Documentos de venta', h: 'documentos.html' }
      ] },
      { t: 'Distribución', sub: [
        { t: 'Despachos y entregas', h: 'despachos.html' }
      ] },
      { t: 'Seguridad', h: 'seguridad.html' }
    ]
  };

  function cerrar() {
    try { sessionStorage.removeItem(CLAVE); } catch (e) { /* sin sesión */ }
  }

  function leer() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE)); } catch (e) { return null; }
  }

  /* Devuelve la sesión vigente o null. Si el usuario ya no existe o está inactivo, la cierra. */
  function sesion() {
    const s = leer();
    if (!s) return null;
    const u = DB.obtener('usuarios', s.usuario_id);
    if (!u || !u.is_active) {
      cerrar();
      return null;
    }
    return s;
  }

  function establecer(u) {
    const c = DB.tabla('clientes').find(function (x) { return x.usuario_id === u.id; });
    sessionStorage.setItem(CLAVE, JSON.stringify({
      usuario_id: u.id,
      username: u.username,
      rol: u.rol,
      id_cliente: c ? c.id_cliente : null,
      nombre: c ? c.nombre_razon_social : u.username
    }));
  }

  function iniciar(username, password, rolElegido) {
    const u = DB.tabla('usuarios').find(function (x) { return x.username === String(username).trim(); });
    if (!u || u.password !== password) {
      return { ok: false, msg: 'Usuario o contraseña incorrectos (datos de demostración).' };
    }
    if (!u.is_active) {
      return { ok: false, msg: 'La cuenta está desactivada.' };
    }
    if (rolElegido && u.rol !== rolElegido) {
      return { ok: false, msg: 'El usuario no pertenece al rol seleccionado.' };
    }
    establecer(u);
    return { ok: true, usuario: u };
  }

  function rolActual() {
    const s = sesion();
    return s ? s.rol : 'publico';
  }

  function inicio(rol) {
    if (rol === 'personal') return ruta('inicio-personal.html');
    if (rol === 'cliente') return ruta('inicio-cliente.html');
    return ruta('index.html');
  }

  function menu(rol) {
    return MENUS[rol] || MENUS.publico;
  }

  /*
   * Control de visibilidad por rol (simulado).
   * rolesPermitidos: 'publico' (cualquiera), 'cliente', 'personal'.
   * Sin sesión -> index.html; con sesión de otro rol -> denegado.html.
   */
  function guardia(rolesPermitidos) {
    if (rolesPermitidos.indexOf('publico') !== -1) return true;
    const s = sesion();
    if (!s) {
      location.replace(ruta('index.html'));
      return false;
    }
    if (rolesPermitidos.indexOf(s.rol) === -1) {
      location.replace(ruta('denegado.html'));
      return false;
    }
    return true;
  }

  return {
    sesion: sesion,
    iniciar: iniciar,
    establecer: establecer,
    cerrar: cerrar,
    rolActual: rolActual,
    inicio: inicio,
    ruta: ruta,
    menu: menu,
    guardia: guardia
  };
})();
