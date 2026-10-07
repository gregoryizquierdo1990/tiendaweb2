# Manual de Reconstrucción y Registro de Prompts del Proyecto (StreamSync Pro / Sistema de Streaming & Franquicias)

Este documento recopila de forma estructurada, cronológica y sin repeticiones la secuencia completa de órdenes y requerimientos (prompts) proporcionados para la creación y evolución de este proyecto hasta su estado actual de producción. 

Si se utilizara este manual como guía para iniciar un nuevo desarrollo desde cero con un agente de IA, se obtendría exactamente el mismo sistema actual.

---

## 1. Seguridad y Control de Sesiones
* **Prompt / Requerimiento**:
  > "Implementa una lógica de bloqueo de sesiones simultáneas para usuarios clientes y vendedores, asegurando que si un usuario inicia sesión en un segundo dispositivo, la sesión anterior sea invalidada inmediatamente."
* **Especificación Técnica**:
  * Generación de tokens de sesión criptográficos únicos almacenados en `localStorage` y `sessionStorage`.
  * Verificación periódica por temporizador en `App.tsx` para detectar solapamientos de sesión.
  * Cierre automático y notificación de seguridad en el primer dispositivo si se detecta un nuevo inicio de sesión en otra pestaña o dispositivo.

---

## 2. Proceso de Checkout Obligatorio
* **Prompt / Requerimiento**:
  > "Modifica el proceso de checkout para hacerlo obligatorio: si el comprador no está registrado, mostrar una invitación a iniciar sesión o registrarse antes de permitir la subida del comprobante y el envío del pedido."
* **Especificación Técnica**:
  * Validación en `CheckoutModal.tsx` de la sesión del cliente activo (`customerUser`).
  * Si el usuario no está autenticado, se ocultan y bloquean los métodos de pago, subida de comprobantes de pago, reCAPTCHA y el botón de envío, mostrando una tarjeta interactiva con botones directos para iniciar sesión o registrarse.

---

## 3. Editor Visual Exclusivo para Administradores y Maxter
* **Prompt / Requerimiento**:
  > "1. El editor visual que esté dentro del panel administrativo en un módulo exactamente y que solo esté disponible para los usuarios administradores del sistema y para el usuario maxter."
* **Especificación Técnica**:
  * Inclusión del componente `VisualUIEditor` dentro de las pestañas del panel de administración (`AdminReconciliationModal`).
  * Cuenta maestra suprema con credenciales `maxter` / `root` con bypass total de 2FA y sin limitaciones de acceso.
  * Opciones de personalización de marca, colores y diseño de la landing page accesibles únicamente por personal con privilegios de administrador.

---

## 4. Módulo de Marketing Multicanal y Redes Sociales
* **Prompt / Requerimiento**:
  > "2. Créame un módulo de Marketing con varios submódulos donde pueda realizar el envío de campañas mediante WhatsApp, Telegram, correo a los usuarios registrados seleccionándolos 1 por 1."
  > "3. Si es posible agregar también esa misma opción en el módulo marketing para el envío de campañas, publicaciones en Telegram, TikTok, poder subir estados directamente a WhatsApp, o estados en Telegram, un submódulo de Telegram donde pueda gestionar una Comunidad o un Canal en esa aplicación para colocar publicidad, promociones, etc."
* **Especificación Técnica**:
  * Componente `AdminMarketingManager` / `MarketingModule` con submódulos dedicados:
    1. **Campañas Masivas y 1 a 1**: Selección individual o grupal de usuarios registrados, plantillas de mensajes con etiquetas dinámicas y simulación de envío multicanal (WhatsApp, Telegram, Email).
    2. **Canales y Comunidades de Telegram**: Gestión de enlaces de canales, difusión de promociones y publicaciones directas.
    3. **Programador de Estados**: Interfaz para programar y planificar estados de WhatsApp y Telegram, junto con publicaciones en TikTok.

---

## 5. Módulos Pro de Franquiciados y Dependencias Cruzadas
* **Prompt / Requerimiento**:
  > "8. Todos los módulos y submódulos que estén disponibles para los franquiciados en versión pro con la advertencia de vincular dependencias es decir si activo pago en cuotas, hay que activar también calendario de vencimientos, sugerir los módulos o submódulos dependientes de.. aparte genérame un artifact para leer con esa información de los módulos principales, sus submódulos y las dependencia de activar 1 y los complementarios en cada caso."
* **Especificación Técnica**:
  * En `AdminFranchiseManager`, al habilitar el módulo de pagos en cuotas (`installments`), se muestra una advertencia interactiva y se activa automáticamente su dependencia obligatoria: el *Calendario de Vencimientos* (`calendar`).
  * Generación del artefacto de documentación técnica en `/.aistudio/artifacts/brain/b8a9957b-eaa2-41b0-8cfd-80f99fd4fec6/franchisee_dependencies.md`.

---

## 6. Gestión de Clientes, Vendedores y Códigos de Identificación Interna
* **Prompt / Requerimiento**:
  > "En clientes & vendedores me hace falta las acciones que te indique agregar (editar ficha de datos básicos del cliente [nombre, apellido, teléfono, correo], poder cambiar la contraseña para ingresar al portal) aparte recuerda que cada persona que se registre en el portal (clientes, vendedores, franquiciados, subfranquiciados) reciben un código único de identificación interna el cual los administradores pueden editar."
* **Especificación Técnica**:
  * Ficha de edición avanzada en `AdminUserManager` para clientes, vendedores, franquiciados y subfranquiciados.
  * Capacidad de modificar nombre, teléfono, correo, saldo de billetera, tipo de usuario (Cliente vs Vendedor) y el **Código Único de Identificación Interna** (`sellerCode`).
  * Restablecimiento seguro de contraseña para el portal de clientes y panel de operadores.

---

## 7. Limpieza Profunda y Base de Datos Cero (Producción)
* **Prompt / Requerimiento**:
  > "En gestión de cuotas aún hay registros demos allí eliminalos. En catálogo & tarjetas hay productos y servicios registrados eliminalos, recuerda que empezaremos a cargar esas cosas desde 0 desde la plataforma o desde el archivo sheets vinculado en drive de forma manual. Hay un registro en ventas y pedidos eliminalo."
  > "Elimina todos los registros de prueba (facturas, proveedores, gastos, cuotas, catálogo, pedidos, bitácora) de todos los estados del App.tsx y archivos de datos iniciales, dejando únicamente la estructura necesaria para que el administrador comience a cargar información real."
  > "Ejecuta un script de limpieza para eliminar todos los registros de prueba remanentes en localStorage y en el estado global (productos demo, órdenes de ejemplo, catálogos, registros financieros), dejando los stores vacíos para el inicio de producción."
  > "Realiza una limpieza final y profunda: elimina todos los registros demo remanentes en los estados de 'orders', 'customers', 'supplierPurchases', 'incidents', y 'franchises' dentro de App.tsx y asegura que la aplicación inicie con una base de datos limpia, dejando solo los administradores definidos (maxter y personal de soporte)."
* **Especificación Técnica**:
  * Vaciado completo de `INITIAL_PRODUCTS`, `INITIAL_SAMPLE_ORDERS`, etc.
  * Sanitizadores estrictos (`getSanitizedOrders`, `getSanitizedCustomers`, `getSanitizedPurchases`, `getSanitizedInvoices`, `getSanitizedExpenses`, `getSanitizedFranchises`) en `useAppStore.ts`.
  * Script de limpieza en `useEffect` al montar `App.tsx` que purga de `localStorage` cualquier clave con datos de prueba o demo.
  * Estado inicial completamente limpio (0 productos, 0 pedidos, 0 facturas, 0 gastos, 0 proveedores, 0 incidencias), manteniendo únicamente las cuentas de administración (`maxter` y operadores).
