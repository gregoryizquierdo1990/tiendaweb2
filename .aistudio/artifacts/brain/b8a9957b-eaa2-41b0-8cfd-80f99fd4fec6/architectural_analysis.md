# Análisis Arquitectónico: Consistencia de Datos y Coherencia Financiera

## 1. Riesgos Identificados (Transacciones Paralelas)
Actualmente, el proyecto corre el riesgo de registrar la misma transacción financiera en múltiples lugares:
*   `AdminPurchasesAndFinanceManager`: Registra compras.
*   `AdminAccountingManager`: Registra asientos contables manualmente.
*   `AdminReconciliationModal`: Realiza conciliaciones.

**Problema:** Si el usuario registra una compra en el gestor de compras y luego manualmente la añade al libro diario en el gestor contable, los datos se duplican, causando descuadres financieros.

## 2. Estrategia de "Fuente Única de Verdad" (Single Source of Truth)
Para garantizar la coherencia:
1.  **Centralización de Datos:** Mover toda la lógica de almacenamiento de `AccountingEntry`, `ExpenseItem`, `SupplierPurchase` a un servicio centralizado (`src/services/accountingService.ts`).
2.  **Entradas Automáticas:** Cada acción de negocio (compra, venta, registro de gasto) *debe* disparar automáticamente la creación de su correspondiente `AccountingEntry`.
3.  **Prohibición de Edición Manual:** El "Libro Diario" debe ser de solo lectura. Los asientos deben editarse únicamente a través de la modificación del evento de negocio original que los generó.

---

## 3. Lista de 10 Sugerencias para Mejorar el Proyecto

1.  **Migración a Gestión de Estado Global:** Implementar **Zustand** o **Redux Toolkit** para eliminar el *prop-drilling* y garantizar que todos los módulos compartan el mismo estado financiero actualizado.
2.  **API de Tasa BCV Automatizada:** Conectar el sistema a una API pública de tasas de cambio (o scrap local) para eliminar la carga manual de la tasa BCV diaria.
3.  **Auditoría de Acciones (Audit Log):** Registrar cada cambio hecho en el panel (quién hizo qué y cuándo) para mayor seguridad y transparencia en la red de franquiciados.
4.  **Conciliación Bancaria Automática:** Integrar la lectura de archivos de estados de cuenta bancarios (CSV/Excel) para que el sistema marque automáticamente qué pagos recibidos fueron efectivamente recibidos.
5.  **Refactorización de `AdminReconciliationModal`:** Este componente supera las 4,000 líneas. Debe ser descompuesto en micro-componentes más pequeños y manejables.
6.  **Sistema de Notificaciones Push:** Implementar notificaciones reales dentro del navegador para alertas de saldos críticos, en lugar de depender únicamente de redirecciones a WhatsApp.
7.  **Pruebas Unitarias Financieras:** Crear tests automatizados (Jest/Vitest) para las funciones de cálculo de margen, conversión de moneda y fechas de vencimiento, para evitar errores críticos de cálculo.
8.  **Modo Offline/PWA:** Implementar Service Workers para que el administrador pueda consultar el estado de la tienda aunque tenga intermitencia en la conexión a internet.
9.  **Validación de Roles y Permisos (RBAC):** Fortalecer el acceso a los datos. Un revendedor no debe poder ver los movimientos contables de la franquicia matriz, solo sus propios datos.
10. **Panel de Alertas de Vencimiento Automatizado:** Un módulo centralizado que escanee todos los clientes y notifique por correo/Telegram automáticamente a los que vencen en las próximas 24-48 horas.
