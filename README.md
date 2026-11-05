# Picantor Management System – Prototipo funcional

Prototipo de varias páginas (HTML, CSS, Bootstrap y JavaScript) para el proyecto académico de aplicaciones web y móviles.
No usa Django, SQL, backend remoto ni llamadas a APIs: los datos viven en el navegador (`localStorage`).

> **Aviso:** el inicio de sesión y los roles son una **simulación** para mostrar qué ve cada rol.
> **No son seguridad real**: las contraseñas de ejemplo están en `js/datos.js`, la sesión está en `sessionStorage`
> y cualquiera puede modificarlas desde el navegador. La seguridad real se hará más adelante con Django.
> Los datos, nombres, precios y presentaciones son de ejemplo, no del cliente. Los documentos de venta y los pagos son simulados.

## Estructura de carpetas

`index.html` (el inicio de sesión) está en la raíz; todas las demás páginas están dentro de `pages/`.

```
picantor/
├── index.html                  S01 Inicio de sesión (simulado)
├── pages/
│   ├── registro.html           S02 Registro de cliente
│   ├── denegado.html           S06 Acceso denegado
│   ├── catalogo.html           S20 Catálogo (público)
│   ├── inicio-cliente.html     S03 Inicio del cliente
│   ├── inicio-personal.html    S04 Inicio del personal
│   ├── seguridad.html          S05 Cuentas del personal y actividad
│   ├── proveedores.html        S10/S11
│   ├── insumos.html            S12/S13
│   ├── compras.html            S14/S15/S16 (compras, detalle y recepción)
│   ├── productos.html          S21/S22/S23
│   ├── existencias.html        S24
│   ├── movimientos.html        S25
│   ├── lotes.html              S26/S27
│   ├── trazabilidad.html       S28
│   ├── perfil.html             S29
│   ├── nuevo-pedido.html       S30
│   ├── mis-pedidos.html        S31
│   ├── pedido.html             S32 (cliente) y S37 (personal)
│   ├── clientes.html           S35
│   ├── pedidos.html            S36
│   ├── pago.html               S40 (pago simulado)
│   ├── confirmacion-pago.html  S50
│   ├── pagos.html              S41
│   ├── mis-documentos.html     S42
│   ├── documentos.html         S51
│   ├── documento.html          S52
│   └── despachos.html          S43/S44/S45
├── css/
│   └── estilos.css
└── js/
    ├── datos.js                Datos de ejemplo (y catálogos sugeridos)
    ├── storage.js              Acceso a localStorage, transacciones y restauración
    ├── auth.js                 Sesión y roles SIMULADOS, menú por rol y función ruta()
    ├── ui.js                   Menú, pie, avisos, formatos y utilidades
    ├── logica.js               Reglas de negocio y operaciones
    └── paginas/
        ├── acceso.js           S01, S02, S06
        ├── inicio.js           S03, S04
        ├── seguridad.js        S05
        ├── abastecimiento.js   M02
        ├── inventario.js       M03
        ├── produccion.js       M04
        ├── pedidos.js          M05
        ├── pagos.js            M06
        └── distribucion.js     M07
```

Las rutas entre `index.html` y `pages/` las resuelve la función `Auth.ruta()` en `js/auth.js`; las páginas dentro de `pages/` se enlazan entre sí con rutas relativas simples.

## Cómo ejecutarlo con un servidor local

Abre una terminal en la carpeta `picantor/` y usa **una** de estas opciones:

- Python: `python3 -m http.server 8000` y abre <http://localhost:8000> (carga `index.html`)
- Node.js: `npx http-server -p 8000` y abre <http://localhost:8000>
- Visual Studio Code: instala la extensión «Live Server», clic derecho en `index.html` → «Open with Live Server».

Bootstrap 5.3.3 se carga desde el CDN oficial (jsDelivr), así que la primera vez hace falta internet.
Para usarlo sin internet, descarga `bootstrap.min.css` y `bootstrap.bundle.min.js` de https://getbootstrap.com,
guárdalos en `vendor/bootstrap/` y cambia las dos rutas `https://cdn.jsdelivr.net/...` en `index.html` y en los `.html` de `pages/` (en estos, la ruta local sería `../vendor/bootstrap/...`).

## Usuarios de demostración (contraseña: `demo123`)

| Usuario | Rol |
|---|---|
| `dueno`, `empleado1`, `empleado2` | Personal (mismos permisos) |
| `cliente1`, `cliente2` | Cliente |

## Recorrido sugerido

1. Entra como `cliente1`, abre **Catálogo** → «Agregar al pedido» → **Confirmar y pagar** → paga con cualquier tarjeta de prueba (por ejemplo 4111 1111 1111 1111, vencimiento 12/29, código 123).
2. Cierra sesión y entra como `dueno`.
3. **Pagos y Facturación → Documentos de venta**: emite la factura y el comprobante (simulados).
4. **Pedidos → Ver detalle**: asigna lotes (manual o automática) y marca «En preparación».
5. **Registrar despacho** (propia o transportista externo) y luego **Registrar entrega** en **Distribución**.
6. En **Producción → Lotes → Ver trazabilidad** verás el pedido entregado.

## Cómo restaurar los datos iniciales

- **Desde la página:** pulsa «Restaurar datos iniciales» en el pie de cualquier página y acepta la confirmación. También cierra la sesión.
- **Desde el navegador:** abre las herramientas de desarrollo (F12) → pestaña *Application* (o *Almacenamiento*) → *Local Storage* → borra la clave `picantor_db_v1` y recarga.
- **Desde la consola (F12):** `localStorage.removeItem('picantor_db_v1'); sessionStorage.clear(); location.reload();`
- Si cambias `js/datos.js`, los cambios solo se ven después de restaurar (los datos ya guardados tienen prioridad).

Los datos se guardan por navegador y por dirección (por ejemplo, `localhost:8000` y `localhost:5500` no comparten datos).

## Reglas que aplica el prototipo

- Los pedidos se crean en `PENDIENTE_PAGO` y se confirman (`PAGADO`) con un pago exitoso; solo entonces se descuenta el producto terminado del inventario.
- No se puede pedir más de la existencia disponible.
- Las existencias cambian solo mediante movimientos de inventario (recepciones, lotes, pedidos).
- Una recepción no puede superar lo pendiente de la compra.
- Un lote exige fecha de caducidad posterior a la de elaboración, código único e insumos suficientes.
- Para despachar un pedido, todos sus ítems deben tener lote asignado (trazabilidad).
- Los despachos con transportista externo exigen su nombre; el transportista no usa el sistema.
- Los cambios no se pueden borrar: proveedores, insumos y productos solo se activan o desactivan.
- Un cliente solo ve sus propios pedidos, pagos y documentos.
- Los datos de la tarjeta nunca se guardan.

## Fuera del alcance (según el cliente)

Precios especiales, seguimiento de ubicación de la entrega, funcionamiento sin conexión, reportes e indicadores,
venta por terceros y migración de datos. Los estados del pedido, los tipos de identificación y las unidades de medida
son valores **sugeridos** que el cliente aún debe confirmar.
