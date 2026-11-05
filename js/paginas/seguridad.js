/*
 * seguridad.js - Pantalla S05: cuentas del personal y registro de actividad (simulado).
 * La gestión real de usuarios, grupos y permisos se hará después con Django.
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!UI.iniciar()) return;
  const $ = function (id) { return document.getElementById(id); };
  const modal = UI.modal('modal');
  const form = $('form');

  function renderCuentas() {
    const s = Auth.sesion();
    const cuentas = DB.tabla('usuarios').filter(function (u) { return u.rol === 'personal'; });
    $('tbody-cuentas').innerHTML = cuentas.map(function (u) {
      const propia = u.id === s.usuario_id;
      return '<tr><td>' + UI.h(u.username) + (propia ? ' <span class="badge text-bg-light">tú</span>' : '') + '</td><td>' + UI.h(u.email) + '</td><td>' + UI.badgeActivo(u.is_active) + '</td>' +
        '<td class="text-end"><button class="btn btn-outline-secondary btn-sm" data-accion="toggle" data-id="' + u.id + '"' + (propia ? ' disabled' : '') + '>' +
        (u.is_active ? 'Desactivar' : 'Activar') + '</button></td></tr>';
    }).join('');
  }

  function renderActividad() {
    const filas = DB.tabla('actividad').slice().sort(function (a, b) { return b.id_actividad - a.id_actividad; }).slice(0, 50);
    $('tbody-actividad').innerHTML = filas.length ? filas.map(function (a) {
      return '<tr><td>' + UI.fecha(a.fecha_hora) + '</td><td>' + UI.h(UI.nombreUsuario(a.usuario_id)) + '</td><td>' + UI.h(a.accion) + '</td><td>' + UI.h(a.detalle) + '</td></tr>';
    }).join('') : UI.vacio(4);
  }

  UI.delegar($('tbody-cuentas'), {
    toggle: function (id) {
      UI.intentar(function () {
        DB.transaccion(function () {
          const u = DB.obtener('usuarios', id);
          u.is_active = !u.is_active;
          Logica.registrarActividad(u.is_active ? 'ACTIVAR_CUENTA' : 'DESACTIVAR_CUENTA', 'Cuenta ' + u.username);
        });
        renderCuentas();
        renderActividad();
      });
    }
  });

  $('btn-nueva-cuenta').addEventListener('click', function () {
    form.reset();
    form.classList.remove('was-validated');
    $('f-activo').checked = true;
    modal.show();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!UI.validar(form)) return;
    UI.intentar(function () {
      const username = $('f-username').value.trim();
      DB.transaccion(function () {
        if (DB.tabla('usuarios').some(function (u) { return u.username.toLowerCase() === username.toLowerCase(); })) {
          throw new Error('Ese nombre de usuario ya existe.');
        }
        DB.insertar('usuarios', { username: username, password: $('f-password').value, email: $('f-email').value.trim(), is_active: $('f-activo').checked, rol: 'personal' });
        Logica.registrarActividad('CREAR_CUENTA', 'Cuenta de personal ' + username);
      });
      modal.hide();
      UI.toast('Cuenta creada.');
      renderCuentas();
      renderActividad();
    });
  });

  renderCuentas();
  renderActividad();
});
