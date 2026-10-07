# Blueprint de Construcción y Bitácora del Proyecto: Gregory Streaming (Maxter)

Este archivo contiene el historial completo de requerimientos, comandos, archivos clave, estructuras y flujos desarrollados para la plataforma de administración y tienda de streaming de **Gregory Izquierdo**. Está diseñado para que cualquier modelo de IA o desarrollador pueda reconstruir, mantener o continuar el proyecto sin perder contexto.

---

## 1. Comandos de Construcción & Mantenimiento
Para levantar, auditar, compilar y empaquetar el proyecto, utiliza los siguientes comandos estándar de la terminal de Linux:

*   **Instalar Dependencias de Node:**
    ```bash
    npm install
    ```
*   **Iniciar Servidor de Desarrollo Local (Puerto 3000):**
    ```bash
    npm run dev
    ```
*   **Auditar Sintaxis y Errores de TypeScript (Linter):**
    ```bash
    npm run lint
    ```
*   **Compilar Aplicación para Producción:**
    ```bash
    npm run build
    ```
*   **Generar ZIP de Respaldo Completo (Código Fuente):**
    ```bash
    python3 scripts/create_zip.py
    ```

---

## 2. Estructura de Archivos Clave del Sistema

El proyecto está estructurado de manera modular y tipada en React con TypeScript y Tailwind CSS:

*   `/src/types/index.ts` — Contiene los tipos oficiales de datos: pedidos (`Order`), egresos (`ExpenseItem`), compras a proveedores (`SupplierPurchase`), clientes (`CustomerUser`), cuentas de franquicia (`FranchiseAccount`), incidencias (`Incident`) y métodos de pago (`PaymentMethod`).
*   `/src/data/defaultCatalog.ts` — Semillero inicial de catálogo de plataformas (Netflix, Max, Disney+, etc.), cuentas mayoristas de prueba, historial de pedidos precargados y egresos base.
*   `/src/components/AdminReconciliationModal.tsx` — Panel de Control Administrativo Principal. Gestiona los pedidos, estados de conciliación, conciliaciones mensuales y el **Sistema de Despacho de Alertas de Proveedores por WhatsApp**.
*   `/src/components/AdminAccountingManager.tsx` — Módulo de Contabilidad Integral. Genera Balance General, Estado de Resultados, Flujo de Efectivo, Notas explicativas (VEN-NIF PYME), Libro Diario Automatizado y el **Dashboard Visual con Recharts**.
*   `/src/components/AdminExpensesManager.tsx` — Panel Gestor de Egresos. Permite registrar gastos en USD/Bs con tasa oficial BCV, clasificar categorías y añadir nuevos tipos de gasto al catálogo en vivo.
*   `/src/components/AdminLoginModal.tsx` — Pantalla de acceso administrativa con doble factor de autenticación (2FA) con envío simulado de código OTP de 6 dígitos a WhatsApp, Telegram o correo electrónico.
*   `/src/components/AdminIntegrationsCatalogModal.tsx` — Catálogo didáctico de integraciones de Google Workspace (Sheets, Drive, People) y APIs de Terceros (WhatsApp Cloud API, Binance Pay, n8n).

---

## 3. Módulos Implementados en Detalle

### A. Dashboard de Control Financiero (`Recharts`)
*   **Gráfico de Barras Comparativo:** Compara mensualmente los ingresos por membresías cobradas frente a los gastos totales generados.
*   **Gráfico de Pastel de Egresos:** Muestra de forma porcentual en qué categorías operacionales se está invirtiendo el presupuesto (Servidores, marketing, nómina, etc.).
*   **Diagnóstico Gerencial:** Añade un anexo automático en lenguaje no técnico evaluando la liquidez y salud de tesorería de la plataforma de Gregory.

### B. Gestión de Gastos & Conversión de Moneda
*   **Registro Multidivisa:** Permite declarar gastos en USD o Bolívares. El sistema realiza la conversión automática según la tasa del Banco Central de Venezuela (BCV) cargada.
*   **Precisión Contable:** Soporte nativo para montos con precisión de hasta 3 decimales para evitar pérdidas por redondeo cambiario.

### C. Alertas de Proveedores & Despachador de WhatsApp
*   **Control de Prepago:** Resta del depósito inicial de cada distribuidor mayorista los costos de las cuentas adquiridas en `supplierPurchases`.
*   **Fórmula de Alerta:**
    *   `Saldo <= $15.00` $\rightarrow$ Estado Crítico (Rojo).
    *   `Saldo <= $35.00` $\rightarrow$ Advertencia Preventiva (Amarillo).
*   **Enrutador Personal de Mensajes:** Permite ingresar los celulares personales de **Gregori` y de **Pablo` para redactar y despachar en un solo clic plantillas completas de alerta mediante enlaces directos a WhatsApp Web (`wa.me`).

---

## 4. Próximos Pasos & Integraciones en Cola

1.  **Sincronización Bidireccional de Contactos (Google Contacts):**
    *   *Objetivo:* Cargar los contactos de clientes actuales guardados en el celular de Gregory a la plataforma de administración, y exportar los clientes nuevos de la plataforma hacia su libreta de Google Contacts automáticamente.
    *   *Mapeo de Datos:* Nombre Completo, Teléfono (con código internacional WhatsApp), Email, y Plataforma Streaming contratada en la sección de Notas del Contacto.
    *   *OAuth Requerido:* `https://www.googleapis.com/auth/contacts` para lectura y escritura.

2.  **Ruteo de Flujos en n8n (Docker en Zorin OS):**
    *   *Objetivo:* Automatizar la detección de alertas sin clics utilizando la infraestructura local de n8n del cliente.
    *   *Flujo:* Google Sheets $\rightarrow$ n8n Webhook / Watch $\rightarrow$ Enrutador de Mensajes $\rightarrow$ WhatsApp Personal (vía Evolution API o bot de Telegram).

---
*Nota: Este archivo se actualiza dinámicamente con cada mejora sustancial realizada al proyecto.*
