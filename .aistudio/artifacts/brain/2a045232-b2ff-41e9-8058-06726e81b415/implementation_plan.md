# Arquitectura y Separación: Tienda Pública (`/`) y Panel de Administración (`/admin`)

Arquitectura de enrutamiento y autenticación para separar la experiencia del cliente final en `www.gregoryizquierdo.xyz` y confinar el acceso administrativo a la ruta protegida `www.gregoryizquierdo.xyz/admin` con credenciales maestras y verificación de respaldo con Google.

## Decisiones Críticas Confirmadas

- **Estructura de Despliegue**: Misma aplicación SPA en Vercel con enrutamiento de ruta `/admin` protegida mediante reescrituras automáticas en `vercel.json`, evitando costos y complejidad de un segundo repositorio o registros DNS adicionales.
- **Autenticación en `/admin`**: Pantalla de login dedicada con usuario y contraseña maestra configurable (por defecto `admin` / `maxter` con credencial personalizable) + botón de verificación de respaldo con Google OAuth (`emprendimientogregoryizquierdo@gmail.com`).
- **Ocultamiento de Accesos en Tienda**: Se eliminan de la tienda pública todos los botones o enlaces al panel de administración (en Navbar y Footer). El acceso a la administración será 100% exclusivo para quien conozca y navegue directamente a `www.gregoryizquierdo.xyz/admin`.

---

## 1. Visión General del Sistema

```
                 USUARIO CLIENTE                                PROPIETARIO / ADMIN
                        │                                                │
                        ▼                                                ▼
              www.gregoryizquierdo.xyz                        www.gregoryizquierdo.xyz/admin
                        │                                                │
       ┌────────────────┴────────────────┐              ┌────────────────┴────────────────┐
       │         TIENDA PÚBLICA          │              │        PORTAL ADMIN /ADMIN      │
       │                                 │              │                                 │
       │  • Catálogo streaming y combos  │              │  • Pantalla Login Dedicada      │
       │  • Carrito y Checkout WhatsApp  │              │    - Usuario + Contraseña       │
       │  • Seguimiento de Pedidos       │              │    - Respaldo Google OAuth      │
       │  • Portal de Clientes           │              │  • Panel Integral de Gestión:   │
       │  • Sin botones admin visibles   │              │    Órdenes, Finanzas, Gastos,   │
       │                                 │              │    Conciliación, Sheets, Users  │
       └─────────────────────────────────┘              └─────────────────────────────────┘
```

- **Público Objetivo**: 
  - **Clientes**: Acceden a `www.gregoryizquierdo.xyz` con una experiencia limpia, rápida y comercial, sin elementos corporativos ni pantallas de inicio de sesión de operadores.
  - **Administrador**: Ingresa a `www.gregoryizquierdo.xyz/admin` para gestionar pedidos, conciliar pagos, sincronizar Google Sheets y controlar finanzas.

---

## 2. Experiencia de Usuario y Flujos

### Flujo 1: Navegación de Clientes (`/`)
1. El cliente entra a `www.gregoryizquierdo.xyz`.
2. Visualiza el catálogo, añade membresías al carrito, realiza pedidos y consulta el estado de sus pedidos.
3. El navbar y footer solo muestran: Búsqueda, Moneda, Rastreo de pedido, Portal de cliente y WhatsApp. **Cero botones administrativos**.

### Flujo 2: Acceso Administrativo (`/admin`)
1. El administrador ingresa en la barra del navegador a `www.gregoryizquierdo.xyz/admin`.
2. Si no ha iniciado sesión, se despliega una pantalla de acceso con diseño profesional de consola de operaciones.
3. Permite ingresar con:
   - **Usuario y contraseña maestra** (con opción de recordar sesión cifrada en storage seguro).
   - **O verificación directa con cuenta Google autorizada** (`emprendimientogregoryizquierdo@gmail.com`).
4. Al autenticarse, accede al panel de administración completo a pantalla completa con pestañas de gestión, reportes y métricas.
5. Incluye botón de **"Ver Tienda"** para previsualizar la tienda y botón de **"Cerrar Sesión"**.

---

## 3. Decisiones Arquitectónicas y Técnicas

- **Enrutador Ligero y Compatible con Vercel**:
  - Implementación con detección reactiva de `window.location.pathname` (soporta `/admin` directo y navegación reactiva suave con `history.pushState`).
  - `vercel.json` ya cuenta con `rewrites: [{"source": "/(.*)", "destination": "/"}]`, garantizando que refrescar o entrar directamente a `/admin` funcione de inmediato sin errores 404 ni necesidad de recargar servidores.
- **Gestor de Sesión de Administrador**:
  - Persistencia segura de sesión en `sessionStorage`/`localStorage` para mantener al administrador autenticado durante su jornada sin pedir la clave en cada recarga.
  - Cierre de sesión inmediato al hacer clic en "Salir", redireccionando a la pantalla de login o a la tienda.
- **Credenciales Maestras Configurables**:
  - Módulo de configuración de credenciales de operador (`ADMIN_CREDENTIALS`) con valores por defecto seguros y posibilidad de cambiar la contraseña directamente desde el panel de administración.

---

## 4. Diagrama de Estados y Componentes

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   App.tsx                                       │
│                                                                                 │
│   Ruta actual: window.location.pathname                                        │
│   ├─ Es '/admin' o '/admin/*' ?                                                 │
│   │    ├─ ¿Sesión Admin Activa?                                                 │
│   │    │     ├─ SÍ ───► <AdminDashboardView /> (Panel completo de gestión)      │
│   │    │     └─ NO ───► <AdminLoginView /> (Login Usuario/Clave + Google)       │
│   │                                                                             │
│   └─ Es '/' (Tienda Pública)                                                    │
│        └──────────────► <PublicStoreView />                                     │
│                         (Navbar limpio + Catálogo + Modales cliente)            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Plan de Ejecución Paso a Paso

1. **Gestión de Enrutamiento y Rutas Limpias**:
   - Crear hook o controlador de ruta (`useRoutePath` / listener de navegación) que detecte si la URL actual es `/admin` o `/`.
   - Soporte para navegación interna suave (`navigateTo('/admin')` y `navigateTo('/')`).
2. **Crear Vista de Portal de Administración (`AdminPortalPage.tsx`)**:
   - Si no está autenticado: renderizar la pantalla de login de administrador con campos de usuario y contraseña + botón de Google OAuth.
   - Si está autenticado: renderizar el panel de administración integrado con barra superior de navegación (volver a tienda, estado de conexión y cerrar sesión).
3. **Limpieza de la Tienda Pública (`App.tsx`)**:
   - Retirar los botones de administración del Navbar principal y del Footer de la tienda pública.
4. **Verificación en Vercel y Guía de Despliegue**:
   - Documentar los pasos exactos para que el cambio quede reflejado en Vercel y tu dominio `www.gregoryizquierdo.xyz` al hacer push.
