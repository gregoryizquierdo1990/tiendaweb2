# Plan de Implementación: Centralización de Estado con Zustand

## 1. Objetivo
Migrar el estado financiero y operativo distribuido de la aplicación (actualmente disperso en múltiples componentes mediante `useState` y *prop-drilling*) a un **Store Centralizado** utilizando **Zustand**.

## 2. Beneficios
- **Única Fuente de Verdad:** Elimina la duplicidad y el riesgo de transacciones paralelas.
- **Mantenibilidad:** Reduce drásticamente la complejidad de los componentes.
- **Coherencia:** Garantiza que cualquier cambio en un saldo se refleje instantáneamente en todos los módulos (Contabilidad, Franquicias, Compras).

## 3. Fases del Plan

### Fase 1: Configuración Inicial
- Instalación de la dependencia: `npm install zustand`.
- Creación de `src/store/appStore.ts` donde se definirá la estructura global del estado (balances, compras, gastos, usuarios, asientos contables).

### Fase 2: Definición de Acciones (Actions)
- Definir acciones atómicas en el Store para garantizar que cada registro de transacción (ej. registrar compra) realice automáticamente el asiento contable correspondiente (Principio de partida doble automatizado).
- Ejemplo: `addPurchase(purchase) => { updateBalances(), addPurchase(), addAccountingEntry() }`.

### Fase 3: Refactorización (Migración Pausada)
Realizaremos la migración por módulos críticos para evitar romper la aplicación:
1.  **Módulo Financiero y Contable:** Migrar `AdminAccountingManager` y `AdminPurchasesAndFinanceManager`.
2.  **Módulo de Franquicias:** Migrar `AdminFranchiseManager`.
3.  **Módulo de Clientes:** Migrar `AdminReconciliationModal`.

### Fase 4: Limpieza
- Eliminar los estados locales innecesarios (`useState` complejos) en los componentes migrados.
- Eliminar el *prop-drilling* de los componentes padres.

## 4. Riesgos y Mitigación
- **Riesgo:** Inestabilidad durante la migración.
- **Mitigación:** Cada fase incluye pruebas de compilación y verificación manual de la coherencia de los saldos tras la migración de cada módulo.

---
**¿Apruebas este plan de trabajo para proceder con la fase 1 (Setup e Instalación)?**
