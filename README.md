# Picantor Management System

Prototipo funcional del sistema de **gestión de producción y comercialización** de una pequeña empresa que elabora y distribuye salsas y ajíes artesanales. Cubre el ciclo completo: abastecimiento de insumos, producción por lotes, inventario, pedidos con pago en línea, facturación, despacho, entrega y trazabilidad.

Proyecto académico de la materia **Desarrollo de Aplicaciones Web y Móviles (DAWM)** – ESPOL.
Autor: Roberto Bravo · Paralelo 1

> **Importante: esto es un prototipo.** El inicio de sesión y los roles son una **simulación** para mostrar qué ve cada tipo de usuario; **no son seguridad real**. Las contraseñas de ejemplo están en `js/datos.js` y la sesión vive en `sessionStorage`, así que cualquiera puede modificarlas desde el navegador. Los pagos con tarjeta y los documentos de venta (factura y comprobante) también son simulados. Los nombres, precios y presentaciones son datos de ejemplo, no del cliente.

---

## Tabla de contenido

1. [Tecnologías](#tecnologías)
2. [Requisitos](#requisitos)
3. [Cómo ejecutarlo](#cómo-ejecutarlo)
4. [Usuarios de demostración](#usuarios-de-demostración)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Arquitectura del código](#arquitectura-del-código)
7. [Módulos y pantallas](#módulos-y-pantallas)
8. [Modelo de datos](#modelo-de-datos)
9. [Reglas de negocio implementadas](#reglas-de-negocio-implementadas)
10. [Dashboard](#dashboard)
11. [Recorrido de prueba](#recorrido-de-prueba)
12. [Restaurar los datos iniciales](#restaurar-los-datos-iniciales)
13. [Limitaciones y fuera de alcance](#limitaciones-y-fuera-de-alcance)
14. [Trabajo pendiente](#trabajo-pendiente)

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 | 29 páginas separadas (no es una aplicación de una sola página) |
| CSS3 (`css/estilos.css`) | Estilos propios sobre Bootstrap |
| Bootstrap 5.3.3 (CDN jsDelivr) | Maquetación responsiva, formularios, tablas, modales |
| JavaScript (ES6, sin frameworks) | Lógica de negocio, navegación, validaciones y gráficos del dashboard |
| `localStorage` | Persistencia de los datos en el navegador (clave `picantor_db_v1`) |
| `sessionStorage` | Sesión simulada del usuario |

No usa Django, SQL, backend remoto ni llamadas a APIs.

## Requisitos

- Un navegador moderno (Chrome, Edge, Firefox o Safari).
- Un servidor web local (Python, Node.js o la extensión Live Server de VS Code).
- Conexión a internet la primera vez, para descargar Bootstrap desde el CDN.

## Cómo ejecutarlo

Abre una terminal en la carpeta raíz del proyecto (`Picantor-Management-System/`) y usa **una** de estas opciones:

```bash
# Opción 1: Python
python3 -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000
```

Luego abre <http://localhost:8000> en el navegador (carga `index.html`, la pantalla de inicio de sesión).

**Opción 3: Visual Studio Code.** Instala la extensión «Live Server», haz clic derecho en `index.html` y elige «Open with Live Server».

### Usarlo sin internet

1. Descarga `bootstrap.min.css` y `bootstrap.bundle.min.js` (versión 5.3.3) desde <https://getbootstrap.com>.
2. Guárdalos en `vendor/bootstrap/`.
3. Reemplaza las rutas `https://cdn.jsdelivr.net/...` por `vendor/bootstrap/...` en `index.html` y por `../vendor/bootstrap/...` en los archivos de `pages/`.

## Usuarios de demostración

Contraseña de todos: **`demo123`**

| Usuario | Rol | Qué puede hacer |
|---|---|---|
| `dueno` | Personal | Todo el sistema |
| `empleado1`, `empleado2` | Personal | Lo mismo que el dueño (el cliente pidió permisos iguales) |
| `cliente1`, `cliente2` | Cliente | Catálogo, pedidos propios, pagos y documentos propios |

También se puede crear un cliente nuevo desde **Registrarme**.

Tarjeta de prueba para el pago simulado: `4111 1111 1111 1111`, vencimiento `12/29`, código `123`.

## Estructura del proyecto

```
Picantor-Management-System/
├── index.html                  S01 Inicio de sesión (simulado)
├── README.md
├── css/
│   └── estilos.css
├── img/
│   └── restaurant.png
├── js/
│   ├── datos.js                Datos de ejemplo y catálogos sugeridos
│   ├── storage.js              Acceso a localStorage, transacciones y restauración
│   ├── auth.js                 Sesión y roles SIMULADOS, menú por rol, guardia de acceso, Auth.ruta()
│   ├── ui.js                   Barra de navegación, pie, avisos, formatos y utilidades
│   ├── logica.js               Reglas de negocio y operaciones
│   └── paginas/                Un script por módulo
│       ├── acceso.js           S01, S02, S06
│       ├── inicio.js           S03, S04
│       ├── seguridad.js        S05
│       ├── abastecimiento.js   M02
│       ├── inventario.js       M03
│       ├── produccion.js       M04
│       ├── pedidos.js          M05
│       ├── pagos.js            M06
│       ├── distribucion.js     M07
│       └── dashboard.js        Dashboard
└── pages/
    ├── registro.html           S02 Registro de cliente
    ├── denegado.html           S06 Acceso denegado
    ├── catalogo.html           S20 Catálogo (público)
    ├── inicio-cliente.html     S03 Inicio del cliente
    ├── inicio-personal.html    S04 Inicio del personal
    ├── seguridad.html          S05 Cuentas del personal y actividad
    ├── dashboard.html          Dashboard (solo personal)
    ├── proveedores.html        S10/S11
    ├── insumos.html            S12/S13
    ├── compras.html            S14/S15/S16 Compras, detalle y recepción
    ├── productos.html          S21/S22/S23
    ├── existencias.html        S24
    ├── movimientos.html        S25
    ├── lotes.html              S26/S27
    ├── trazabilidad.html       S28
    ├── perfil.html             S29
    ├── nuevo-pedido.html       S30
    ├── mis-pedidos.html        S31
    ├── pedido.html             S32 (cliente) y S37 (personal)
    ├── clientes.html           S35
    ├── pedidos.html            S36
    ├── pago.html               S40 Pago simulado
    ├── pagos.html              S41
    ├── mis-documentos.html     S42
    ├── despachos.html          S43/S44/S45
    ├── confirmacion-pago.html  S50
    ├── documentos.html         S51
    └── documento.html          S52
```

## Arquitectura del código

Cada página HTML carga los scripts en este orden:

```
bootstrap.bundle.min.js → datos.js → storage.js → auth.js → ui.js → logica.js → paginas/<modulo>.js
```

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Datos | `datos.js` | `DATOS_INICIALES` (tablas de ejemplo) y `CATALOGOS` (estados, tipos de identificación, unidades y tipos de entrega sugeridos) |
| Persistencia | `storage.js` (objeto `DB`) | `cargar`, `guardar`, `tabla`, `obtener`, `insertar`, `actualizar`, `transaccion`, `restaurar` |
| Sesión | `auth.js` (objeto `Auth`) | `iniciar`, `cerrar`, `sesion`, `rolActual`, `menu(rol)`, `guardia(roles)`, `ruta(archivo)` |
| Interfaz | `ui.js` (objeto `UI`) | Menú según rol, pie de página, alertas, formato de fechas y moneda |
| Negocio | `logica.js` | Compras y recepciones, lotes, pedidos, asignación de lotes, pagos, documentos, despachos, entregas y trazabilidad |
| Páginas | `paginas/*.js` | Eventos, formularios y tablas de cada pantalla |

**Transacciones.** Todas las operaciones de `logica.js` validan primero y luego se ejecutan dentro de `DB.transaccion(...)`. Si algo falla a mitad de camino, los datos vuelven al estado anterior y no queda nada a medias.

**Control de acceso simulado.** Cada página declara en `<body data-roles="...">` qué roles pueden verla. `Auth.guardia()` redirige a `denegado.html` si el rol no coincide, y al inicio de sesión si no hay sesión.

**Rutas.** `index.html` está en la raíz y el resto de las páginas en `pages/`. `Auth.ruta()` resuelve los enlaces entre ambos niveles.

**Registro de actividad.** Las operaciones sensibles (compras, lotes, pagos, documentos, despachos) quedan registradas en la tabla `actividad` con fecha, usuario y detalle. El personal las consulta en **Seguridad**.

## Módulos y pantallas

| Módulo | Pantallas | Rol |
|---|---|---|
| M01 Seguridad | Inicio de sesión, registro, acceso denegado, cuentas del personal y actividad | Todos / Personal |
| M02 Abastecimiento | Proveedores, insumos, compras y recepción de insumos | Personal |
| M03 Productos e Inventario | Productos y presentaciones, existencias, movimientos, catálogo | Personal (catálogo: público) |
| M04 Producción y Trazabilidad | Lotes (con insumos consumidos y unidades por presentación), trazabilidad | Personal |
| M05 Clientes y Pedidos | Perfil, nuevo pedido, mis pedidos, detalle del pedido, clientes, pedidos | Cliente (lo propio) / Personal (todo) |
| M06 Pagos y Facturación | Pago simulado, confirmación, pagos, documentos de venta | Cliente (lo propio) / Personal (todo) |
| M07 Distribución y Entrega | Despachos y registro de entrega | Personal |
| Dashboard | Indicadores y gráficos con filtro de período | Personal |

### Menú por rol

| Rol | Opciones |
|---|---|
| Sin sesión | Catálogo, Iniciar sesión, Registrarse |
| Cliente | Inicio, Catálogo, Mi perfil, Nuevo pedido, Mis pedidos, Mis pagos y documentos, Cerrar sesión |
| Personal | Inicio, Dashboard, Abastecimiento, Productos e Inventario, Producción, Pedidos y Clientes, Pagos y Facturación, Distribución, Seguridad, Cerrar sesión |

## Modelo de datos

Las tablas de `localStorage` siguen los nombres del modelo entidad-relación del proyecto:

| Tabla | Descripción |
|---|---|
| `usuarios` | Simula el usuario de Django (username, email, rol) |
| `clientes` | Perfil del cliente vinculado a su usuario |
| `proveedores`, `insumos` | Abastecimiento |
| `compras`, `detalle_compra` | Órdenes de compra y sus ítems |
| `recepciones`, `detalle_recepcion` | Recepciones parciales o totales de una compra |
| `productos`, `presentaciones` | Catálogo (3 presentaciones con precio único) |
| `movimientos` | Entradas y salidas de insumos y producto terminado |
| `lotes`, `detalle_lote`, `consumo_insumo_lote` | Producción por lotes, unidades producidas e insumos consumidos |
| `pedidos`, `detalle_pedido` | Pedidos del cliente |
| `asignacion_lote` | Qué lote surtió cada ítem del pedido (trazabilidad) |
| `pagos` | Intentos de pago con su estado (`EXITOSO` / `FALLIDO`) |
| `documentos` | Factura electrónica y comprobante interno (simulados) |
| `despachos` | Despacho y entrega (propia o con transportista externo) |
| `actividad` | Registro de operaciones sensibles |

**Estados del pedido (sugeridos):** `PENDIENTE_PAGO` → `PAGADO` → `EN_PREPARACION` → `DESPACHADO` → `ENTREGADO`

## Reglas de negocio implementadas

- Los pedidos se crean en `PENDIENTE_PAGO` y pasan a `PAGADO` solo con un pago exitoso. Recién entonces se descuenta el producto terminado del inventario.
- No se puede pedir más de la existencia disponible.
- Las existencias cambian únicamente mediante movimientos de inventario (recepciones, lotes y pedidos).
- Una recepción no puede superar la cantidad pendiente de la compra.
- Un lote exige código único, fecha de caducidad posterior a la de elaboración e insumos suficientes.
- Para despachar un pedido, todos sus ítems deben tener lote asignado (manual o automáticamente).
- Un despacho con transportista externo exige el nombre del transportista. El transportista no usa el sistema.
- Nada se elimina: proveedores, insumos y productos solo se activan o desactivan.
- Un cliente solo ve sus propios pedidos, pagos y documentos.
- Los datos de la tarjeta nunca se guardan.
- Todos los clientes pagan el mismo precio (sin precios especiales).

## Dashboard

Menú **Dashboard**, solo para el personal (`pages/dashboard.html` + `js/paginas/dashboard.js`).

- **Filtro de período:** todo el historial, mes actual, últimos 30 días, últimos 7 días o rango personalizado.
- **Indicadores:** ventas cobradas, pedidos del período, pedidos por atender, pendientes de pago y ticket promedio.
- **Gráficos:** ventas por día (por mes si el rango supera 92 días), pedidos por estado y unidades cobradas por presentación. Cada gráfico tiene la opción «Ver tabla».
- **Situación actual:** existencias y lotes próximos a caducar.

Definiciones: una *venta cobrada* es un pedido con al menos un pago `EXITOSO`. Las ventas por día usan la fecha del pedido.

## Recorrido de prueba

1. Entra como `cliente1`. Abre **Catálogo**, agrega productos al pedido, pulsa **Confirmar y pagar** y paga con la tarjeta de prueba.
2. Cierra sesión y entra como `dueno`.
3. **Pagos y Facturación → Documentos de venta:** emite la factura y el comprobante.
4. **Pedidos → Ver detalle:** asigna lotes (manual o automática) y marca «En preparación».
5. **Distribución:** registra el despacho (propio o con transportista externo) y luego la entrega.
6. **Producción → Lotes → Ver trazabilidad:** comprueba que el pedido aparece como entregado.
7. **Dashboard:** revisa que la venta se refleje en los indicadores.

## Restaurar los datos iniciales

- **Desde la página:** pulsa «Restaurar datos iniciales» en el pie de cualquier página y confirma. También cierra la sesión.
- **Desde el navegador:** F12 → pestaña *Application* (o *Almacenamiento*) → *Local Storage* → borra la clave `picantor_db_v1` y recarga.
- **Desde la consola (F12):**
  ```js
  localStorage.removeItem('picantor_db_v1'); sessionStorage.clear(); location.reload();
  ```

Notas:
- Si modificas `js/datos.js`, los cambios solo se ven después de restaurar (los datos guardados tienen prioridad).
- Los datos se guardan por navegador y por dirección: `localhost:8000` y `localhost:5500` no comparten datos.

## Limitaciones y fuera de alcance

**Limitaciones del prototipo**
- Seguridad simulada (sin cifrado ni validación en servidor).
- Pagos y facturación electrónica simulados (sin pasarela de pago ni conexión con el SRI).
- Los datos viven solo en el navegador de cada usuario.
- Bootstrap se carga desde CDN.
- Probado en navegadores de escritorio. Faltan pruebas en Safari y en teléfonos reales.

**Fuera del alcance (decisión del cliente)**
Precios especiales, seguimiento de ubicación de la entrega, funcionamiento sin conexión, venta por terceros, migración de datos, normativa de alimentos y uso del sistema por parte de transportistas.

**Por confirmar con el cliente**
Estados del pedido, tipos de identificación, unidades de medida, reglas de anulación de registros, otros métodos de pago y reportes adicionales.

## Trabajo pendiente

- **Informe principal con procedimiento almacenado:** aún no está incluido en este repositorio. Se implementará con la base de datos real, junto con sus filtros en la interfaz.
- Migración a **Django** con base de datos relacional, autenticación real con usuarios, grupos y permisos de Django.
- Integración con una pasarela de pago y con la facturación electrónica del SRI.
- Aplicación móvil para iOS y Android.
- Exposición de APIs para la información pública (catálogo) y las operaciones privadas.
