/*
 * acceso.js - Pantallas S01 (inicio de sesión simulado), S02 (registro de cliente) y S06 (acceso denegado).
 * Recuerda: la sesión y los roles son una simulación, no seguridad real.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const paginas = { login: iniciarLogin, registro: iniciarRegistro, denegado: iniciarDenegado };
  paginas[document.body.dataset.pagina]();
});

function iniciarLogin() {
  const s = Auth.sesion();
  if (s) {
    location.replace(Auth.inicio(s.rol));
    return;
  }
  const $ = function (id) { return document.getElementById(id); };
  const form = $('form-login');
  const alerta = $('alerta-login');

  /* Solo se listan los usuarios de ejemplo originales, no los registrados después. */
  $('demo-usuarios').innerHTML = DATOS_INICIALES.usuarios.map(function (u) {
    return '<tr><td>' + UI.h(u.username) + '</td><td>' + UI.h(u.password) + '</td><td>' + (u.rol === 'personal' ? 'Personal' : 'Cliente') + '</td>' +
      '<td class="text-end"><button type="button" class="btn btn-outline-secondary btn-sm" data-usuario="' + UI.h(u.username) + '" data-rol="' + u.rol + '">Usar</button></td></tr>';
  }).join('');

  $('demo-usuarios').addEventListener('click', function (e) {
    const b = e.target.closest('[data-usuario]');
    if (!b) return;
    $('l-rol').value = b.dataset.rol;
    $('l-username').value = b.dataset.usuario;
    $('l-password').value = 'demo123';
  });

  $('l-rol').addEventListener('change', function () {
    $('l-username').value = this.value === 'personal' ? 'dueno' : 'cliente1';
    $('l-password').value = 'demo123';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    alerta.classList.add('d-none');
    if (!UI.validar(form)) return;
    const r = Auth.iniciar($('l-username').value, $('l-password').value, $('l-rol').value);
    if (!r.ok) {
      alerta.textContent = r.msg;
      alerta.classList.remove('d-none');
      return;
    }
    location.href = Auth.inicio(r.usuario.rol);
  });
}

function iniciarRegistro() {
  const s = Auth.sesion();
  if (s) {
    location.replace(Auth.inicio(s.rol));
    return;
  }
  const $ = function (id) { return document.getElementById(id); };
  const form = $('form-registro');
  $('r-tipo').innerHTML = UI.opciones(CATALOGOS.TIPOS_IDENTIFICACION, function (x) { return x; }, function (x) { return x; }, '', 'Selecciona…');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const username = $('r-username').value.trim();
      const identificacion = $('r-identificacion').value.trim();
      let usuario;
      DB.transaccion(function () {
        if (DB.tabla('usuarios').some(function (u) { return u.username.toLowerCase() === username.toLowerCase(); })) {
          throw new Error('Ese nombre de usuario ya existe.');
        }
        if (DB.tabla('clientes').some(function (c) { return c.identificacion === identificacion; })) {
          throw new Error('Ya existe un cliente con esa identificación.');
        }
        usuario = DB.insertar('usuarios', { username: username, password: $('r-password').value, email: $('r-email').value.trim(), is_active: true, rol: 'cliente' });
        DB.insertar('clientes', {
          usuario_id: usuario.id,
          nombre_razon_social: $('r-nombre').value.trim(),
          tipo_identificacion: $('r-tipo').value,
          identificacion: identificacion,
          telefono: $('r-telefono').value.trim(),
          direccion: $('r-direccion').value.trim()
        });
      });
      Auth.establecer(usuario);
      UI.flash('Cuenta creada. ¡Bienvenido!');
      location.href = 'inicio-cliente.html';
    });
  });
}

function iniciarDenegado() {
  const s = Auth.sesion();
  const inicio = document.getElementById('btn-inicio');
  inicio.href = Auth.inicio(s ? s.rol : 'publico');
  document.getElementById('btn-cerrar').addEventListener('click', function () {
    Auth.cerrar();
    location.href = Auth.ruta('index.html');
  });
}
