/*
 * ui.js - Utilidades de interfaz compartidas: menú por rol, pie de página, avisos, formatos y ayudas.
 */
const UI = (function () {
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const CLAVE_FLASH = 'picantor_flash';

  /* Escapa texto antes de insertarlo con innerHTML. */
  function h(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function ahora() {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function hoy() {
    return ahora().slice(0, 10);
  }

  function fecha(s) {
    if (!s) return '—';
    const p = s.slice(0, 10).split('-');
    return p[2] + '/' + p[1] + '/' + p[0] + (s.length > 10 ? ' ' + s.slice(11, 16) : '');
  }

  function moneda(n) {
    return '$' + Number(n || 0).toFixed(2);
  }

  function num(n) {
    return Number(n).toLocaleString('es-EC', { maximumFractionDigits: 3 });
  }

  function param(nombre) {
    return new URLSearchParams(location.search).get(nombre);
  }

  const COLORES = {
    PENDIENTE_PAGO: 'warning', PAGADO: 'info', EN_PREPARACION: 'primary', DESPACHADO: 'secondary', ENTREGADO: 'success',
    EXITOSO: 'success', FALLIDO: 'danger', PENDIENTE: 'warning', PARCIAL: 'info', COMPLETA: 'success',
    PROPIA: 'secondary', EXTERNA: 'dark'
  };

  function badge(texto) {
    return '<span class="badge text-bg-' + (COLORES[texto] || 'light') + '">' + h(String(texto).replace(/_/g, ' ')) + '</span>';
  }

  function badgeActivo(activo) {
    return '<span class="badge text-bg-' + (activo ? 'success' : 'secondary') + '">' + (activo ? 'Sí' : 'No') + '</span>';
  }

  function vacio(columnas, texto) {
    return '<tr><td colspan="' + columnas + '" class="text-center text-muted py-4">' + h(texto || 'No hay registros para mostrar.') + '</td></tr>';
  }

  /* Genera <option> a partir de una lista. */
  function opciones(lista, valor, texto, seleccionado, placeholder) {
    let html = placeholder ? '<option value="">' + h(placeholder) + '</option>' : '';
    lista.forEach(function (x) {
      const v = valor(x);
      html += '<option value="' + h(v) + '"' + (String(v) === String(seleccionado) ? ' selected' : '') + '>' + h(texto(x)) + '</option>';
    });
    return html;
  }

  function toast(mensaje, tipo) {
    tipo = tipo || 'success';
    let c = document.getElementById('toasts');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toasts';
      c.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(c);
    }
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-' + tipo + ' border-0';
    el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + h(mensaje) + '</div>' +
      '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>';
    c.appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 5000 });
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    t.show();
  }

  /* Guarda un aviso para mostrarlo en la página siguiente (después de redirigir). */
  function flash(mensaje, tipo) {
    sessionStorage.setItem(CLAVE_FLASH, JSON.stringify({ m: mensaje, t: tipo || 'success' }));
  }

  function mostrarFlash() {
    const txt = sessionStorage.getItem(CLAVE_FLASH);
    if (!txt) return;
    sessionStorage.removeItem(CLAVE_FLASH);
    try {
      const f = JSON.parse(txt);
      toast(f.m, f.t);
    } catch (e) { /* aviso inválido */ }
  }

  /* Ejecuta una acción y muestra el error como aviso si falla. Devuelve true si salió bien. */
  function intentar(fn) {
    try {
      fn();
      return true;
    } catch (e) {
      console.error(e);
      toast(e.message || String(e), 'danger');
      return false;
    }
  }

  function modal(id) {
    return bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
  }

  function validar(form) {
    form.classList.add('was-validated');
    return form.checkValidity();
  }

  /* Delegación de clics: busca el elemento más cercano con data-accion y llama al manejador. */
  function delegar(contenedor, manejadores) {
    contenedor.addEventListener('click', function (e) {
      const b = e.target.closest('[data-accion]');
      if (!b || !contenedor.contains(b)) return;
      const fn = manejadores[b.dataset.accion];
      if (fn) {
        e.preventDefault();
        fn(Number(b.dataset.id), b);
      }
    });
  }

  function nombreUsuario(id) {
    const u = DB.obtener('usuarios', id);
    return u ? u.username : '—';
  }

  function nombreCliente(id) {
    const c = DB.obtener('clientes', id);
    return c ? c.nombre_razon_social : '—';
  }

  function nombrePresentacion(id) {
    const pr = DB.obtener('presentaciones', id);
    if (!pr) return '—';
    const p = DB.obtener('productos', pr.producto_id);
    return (p ? p.nombre : '') + ' – ' + pr.nombre;
  }

  function nombreInsumo(id) {
    const i = DB.obtener('insumos', id);
    return i ? i.nombre : '—';
  }

  function dibujarNavbar() {
    const cont = document.getElementById('navbar');
    if (!cont) return;
    const s = Auth.sesion();
    const rol = s ? s.rol : 'publico';
    const actual = location.pathname.split('/').pop() || 'index.html';
    const items = Auth.menu(rol).map(function (i) {
      if (i.sub) {
        return '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">' + h(i.t) + '</a><ul class="dropdown-menu">' +
          i.sub.map(function (x) {
            return '<li><a class="dropdown-item' + (x.h === actual ? ' active' : '') + '" href="' + Auth.ruta(x.h) + '">' + h(x.t) + '</a></li>';
          }).join('') + '</ul></li>';
      }
      return '<li class="nav-item"><a class="nav-link' + (i.h === actual ? ' active' : '') + '" href="' + Auth.ruta(i.h) + '">' + h(i.t) + '</a></li>';
    }).join('');
    const usuario = s
      ? '<span class="navbar-text me-3 small">' + h(s.username) + ' <span class="badge text-bg-light">' + (s.rol === 'personal' ? 'Personal' : 'Cliente') + '</span></span>' +
        '<button class="btn btn-outline-light btn-sm" id="btn-salir" type="button">Cerrar sesión</button>'
      : '';
    cont.innerHTML = '<nav class="navbar navbar-expand-xl navbar-dark navbar-picantor"><div class="container">' +
      '<a class="navbar-brand" href="' + Auth.inicio(rol) + '">Picantor <span class="badge badge-demo">DEMO</span></a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu-principal" aria-label="Menú"><span class="navbar-toggler-icon"></span></button>' +
      '<div class="collapse navbar-collapse" id="menu-principal"><ul class="navbar-nav me-auto">' + items + '</ul>' + usuario + '</div></div></nav>';
    const salir = document.getElementById('btn-salir');
    if (salir) {
      salir.addEventListener('click', function () {
        Auth.cerrar();
        location.href = Auth.ruta('index.html');
      });
    }
  }

  function dibujarPie() {
    let pie = document.getElementById('pie');
    if (!pie) {
      pie = document.createElement('footer');
      pie.id = 'pie';
      document.body.appendChild(pie);
    }
    pie.className = 'pie-demo py-3 mt-4';
    pie.innerHTML = '<div class="container"><strong>Prototipo de demostración.</strong> El inicio de sesión y los roles son una simulación en el navegador ' +
      '(localStorage y sessionStorage) y <strong>no constituyen seguridad real</strong>. Los datos son de ejemplo. ' +
      '<a href="#" id="restaurar-datos">Restaurar datos iniciales</a></div>';
    document.getElementById('restaurar-datos').addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('Se borrarán todos los cambios y se restaurarán los datos de ejemplo. También se cerrará la sesión. ¿Continuar?')) {
        DB.restaurar();
        flash('Datos iniciales restaurados.', 'success');
        location.href = Auth.ruta('index.html');
      }
    });
  }

  /* Comprueba el acceso por rol, dibuja menú y pie. Devuelve false si se redirigió. */
  function iniciar() {
    DB.cargar();
    const roles = (document.body.dataset.roles || 'publico').split(',').map(function (r) { return r.trim(); });
    if (!Auth.guardia(roles)) return false;
    dibujarNavbar();
    dibujarPie();
    mostrarFlash();
    return true;
  }

  return {
    h: h, ahora: ahora, hoy: hoy, fecha: fecha, moneda: moneda, num: num, param: param,
    badge: badge, badgeActivo: badgeActivo, vacio: vacio, opciones: opciones,
    toast: toast, flash: flash, intentar: intentar, modal: modal, validar: validar, delegar: delegar,
    nombreUsuario: nombreUsuario, nombreCliente: nombreCliente, nombrePresentacion: nombrePresentacion, nombreInsumo: nombreInsumo,
    iniciar: iniciar
  };
})();
