# Plan Revisado: Gestión y Visualización de Facturas

## 1. Objetivo
Implementar un sistema de facturación robusto que garantice:
- **Para el Cliente:** Visualización solo lectura de facturas (vía URL única), historial de facturas en su perfil (vinculadas por email/ID), sin capacidad de descarga o copia.
- **Para Administración:** Capacidad total de impresión/exportación de facturas, reportes y contratos en cualquier dispositivo o formato (impresora física, virtual, USB, etc.).

## 2. Cambios Arquitectónicos
- **Facturas (Invoice):** Todas las facturas (incluso las creadas manualmente) se asociarán a un `customerEmail` o `customerId`.
- **Portal del Cliente:** Se actualizará `CustomerPortalModal` para consultar y mostrar el historial de facturas filtradas por el email del cliente logueado.
- **Visor de Factura (InvoiceViewer):**
  - **Modo Cliente (URL):** Bloqueo CSS (`pointer-events: none`, `user-select: none`) para evitar descargas o copias.
  - **Modo Admin:** Acceso al mismo visor pero con controles de impresión/descarga habilitados.

## 3. Plan de Implementación
### A. Backend/Datos
1.  Asegurar que el proceso de creación de factura (manual o automático) siempre asigne el `customerId`/`customerEmail` y genere la URL pública.
2.  Añadir campo `invoiceUrl` a la interfaz `Invoice` si no está cubierto por el ID.

### B. Frontend Cliente
3.  **Componente `InvoiceViewer`:** Visor que detecta si el usuario es `admin` para habilitar o deshabilitar herramientas de impresión/descarga.
4.  **Actualización `CustomerPortalModal`:** Añadir pestaña "Mis Facturas" que filtre y liste las facturas asociadas al usuario.

### C. Funcionalidad Admin (Impresión)
5.  **Controles de Impresión:** Implementar `window.print()` en el `InvoiceViewer` solo para usuarios con rol `admin`.
6.  **CSS de Impresión:** Añadir `@media print { ... }` en los componentes de facturas, reportes y contratos para garantizar que la salida a impresoras (físicas o PDF virtuales) sea profesional.

---
**¿Apruebas este plan revisado para comenzar con la implementación?**
