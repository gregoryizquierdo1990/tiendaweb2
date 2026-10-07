# Guía de Módulos, Submódulos y Dependencias de Franquiciados (Versión Pro)

Este documento detalla la estructura completa de módulos principales y submódulos disponibles para los franquiciados en la versión Pro, indicando las **dependencias obligatorias** de activación cruzada y los complementos recomendados.

---

## 1. Módulo: Gestión de Cuotas (Financiamiento)
* **Identificador técnico**: `installments`
* **Submódulos**:
  * Control y Cobro de Cuotas (Inicial + Cuotas sucesivas).
  * Recordatorios Automáticos de Vencimiento.
  * Reporte de Abonos Parciales y Liquidación de Deuda.
* **Dependencia Obligatoria**:
  * ⚠️ **Calendario de Vencimientos (`calendar`)**: Al activar *Gestión de Cuotas*, el sistema exige y vincula automáticamente la activación del *Calendario de Vencimientos* para proyectar las fechas de cobro en el panel del franquiciado y del cliente.
* **Módulos Complementarios Sugeridos**:
  * Módulo de Contabilidad y Gastos.
  * Pasarelas de Pago Múltiples (Zelle, Pago Móvil, Binance).

---

## 2. Módulo: Calendario de Vencimientos y Operaciones
* **Identificador técnico**: `calendar`
* **Submódulos**:
  * Vista de Vencimientos Diarios / Mensuales.
  * Filtro por Membresías y Cuotas de Crédito.
  * Notificaciones de Expiración Próxima.
* **Dependencia Obligatoria**:
  * Ninguna estricta de entrada, pero es **indispensable** cuando se operan *Gestión de Cuotas* o *Suscripciones Recurrentes*.

---

## 3. Módulo: Marketing y Difusión Multicanal
* **Identificador técnico**: `marketing`
* **Submódulos**:
  * Campañas por Correo Electrónico (Email).
  * Envíos Masivos y 1 a 1 por WhatsApp.
  * Publicaciones y Campañas en Telegram (Canales y Comunidades).
  * Programación de Estados para WhatsApp y Telegram.
  * Publicación promocional en TikTok.
* **Dependencia Obligatoria**:
  * Ninguna técnica estricta, pero se beneficia de tener activo el *Gestor de Clientes & Vendedores* para segmentar la audiencia.
* **Módulos Complementarios Sugeridos**:
  * Plantillas de Mensajes Automatizados.

---

## 4. Módulo: Catálogo de Servicios y Tarjetas Digitales
* **Identificador técnico**: `catalog`
* **Submódulos**:
  * Gestión de Productos (Streaming, Cuentas, IPTV).
  * Tarjetas de Regalo (Gift Cards).
  * Control de Stock y Precios Dinámicos multi-moneda (USD / Bs).
* **Dependencia Obligatoria**:
  * Ninguna. Es el núcleo base de ventas.
* **Módulos Complementarios Sugeridos**:
  * Pasarela de Checkout Obligatoria con Registro de Clientes.

---

## 5. Módulo: Clientes, Vendedores y Red de Franquicias
* **Identificador técnico**: `users`
* **Submódulos**:
  * Ficha de Datos Básicos (Nombre, Apellido, Teléfono, Correo).
  * Cambio de Contraseña de Portal.
  * Código Único de Identificación Interna (Editable por Administrador).
  * Red de Sub-Franquicias y Vendedores asociados.
* **Dependencia Obligatoria**:
  * Ninguna.
* **Módulos Complementarios Sugeridos**:
  * Control de Comisiones de Vendedores.

---

## 6. Módulo: Editor Visual de Interfaz (Admin & Master)
* **Identificador técnico**: `visual_editor`
* **Restricción de Acceso**:
  * 🔒 **Exclusivo para Administradores del Sistema y Usuario Maestro (`maxter`)**.
* **Submódulos**:
  * Personalización de Colores, Branding y Logotipos.
  * Editor de Secciones de la Landing Page.
* **Dependencia Obligatoria**:
  * Ninguna.
