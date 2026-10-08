# Plan de Sincronización en Tiempo Real con Firebase Firestore

He analizado tu elección para solucionar el problema de conexión entre la página local, tu panel de administración y la web pública `gregoryizquierdo.xyz`. Firebase Firestore es la herramienta ideal, ya que es una base de datos en la nube autogestionada, en tiempo real, gratuita para el volumen de tu proyecto, y que no requiere complejas configuraciones de tablas SQL como Supabase.

A continuación, te presento el plan detallado para implementar esta integración definitiva:

---

### 1. Inicialización y Conexión de Firestore
*   **Servicio central de Firebase**: Crearemos un archivo de configuración e inicialización de Firestore (`src/services/firebaseDb.ts`) utilizando la configuración ya existente en `/firebase-applet-config.json`.
*   **Prueba de Conectividad**: Añadiremos un validador de arranque para comprobar que la conexión con los servidores de Google Firebase es estable y segura desde cualquier dispositivo.

### 2. Sincronización Bidireccional de Colecciones
Mapearemos todos los estados del sistema a colecciones de Firestore. Esto se aplicará a:
*   `products` (Catálogo y disponibilidad de perfiles/cuentas)
*   `orders` (Pedidos del cliente, incluyendo los nuevos registros de teléfono y nombre)
*   `customers` (Perfiles de clientes y saldos de billetera)
*   `paymentMethods` (Métodos de pago como tu Pago Móvil BNC)
*   `walletTopups` (Abonos reportados de saldo Zeny)
*   `incidents` (Reportes de fallas y soporte)
*   `faqItems` (Preguntas frecuentes)
*   `branding` (Diseño, banners, pie de página y colores de la tienda)
*   `bcvRate` (Tasa oficial de cambio de bolívares en tiempo real)

#### Flujo del Cliente (Lectura y Escritura):
*   Cuando un cliente entra a `gregoryizquierdo.xyz`, su dispositivo se suscribe en tiempo real a las colecciones de Firestore (`products`, `paymentMethods`, `branding`).
*   Al realizar un pedido o reportar un pago (ejemplo: Pablo, 04129130080), el navegador del cliente escribe directamente un nuevo documento en la colección `orders` / `customers` de Firestore.

#### Flujo del Administrador (Control Total):
*   Tu Panel de Administración local recibirá una notificación instantánea (en menos de 1 segundo) en su pantalla con la información completa de la compra de Pablo.
*   Cuando edites un producto, lo marques como "Agotado", o agregues un nuevo servicio, el cambio se guardará en Firestore e impactará la interfaz de todos los clientes activos sin necesidad de que recarguen la página.

### 3. Seguridad de Datos (`firestore.rules`)
*   Escribiremos y desplegaremos reglas de seguridad para Firestore (`firestore.rules`) diseñadas con arquitectura de privilegio mínimo.
*   Esto garantiza que los clientes solo puedan leer el catálogo público y crear sus propios pedidos, pero que solo tú (el administrador autenticado) tengas permisos de lectura y escritura globales sobre las finanzas, saldos de billeteras y cuentas madre.

---

### 4. Resiliencia de Operaciones (Offline-First)
*   Mantendremos un sistema de respaldo automático en `localStorage`. Si el cliente o el administrador pierden la conexión a internet de forma temporal, la interfaz seguirá funcionando perfectamente, cargando el catálogo local y reintentando la sincronización en cuanto vuelva la red.

¿Estás de acuerdo con este plan para proceder a implementar la sincronización global en tiempo real hoy mismo?
