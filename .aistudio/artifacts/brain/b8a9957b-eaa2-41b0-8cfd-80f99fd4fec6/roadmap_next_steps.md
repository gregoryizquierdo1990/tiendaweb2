# Hoja de Ruta: Consolidación del Sistema

Tras haber migrado la base financiera al estado centralizado (`useAppStore.ts`), el sistema se encuentra en un estado híbrido. Para garantizar la estabilidad y la escalabilidad, estas son las acciones prioritarias, ordenadas por impacto técnico:

## Prioridad 1: Migración Completa de Estado (Estabilidad)

1.  **Refactorización de `App.tsx`:** 
    *   **Acción:** Mover los estados `orders`, `customers`, `products`, etc., que actualmente residen en `App.tsx` directamente al `useAppStore`.
    *   **Razón:** `App.tsx` es actualmente un punto de falla por exceso de responsabilidad. Eliminar el *prop-drilling* desde aquí hará que los componentes hijos sean mucho más ligeros.

2.  **Migración de Componentes Restantes:**
    *   **Acción:** Refactorizar `AdminFranchiseManager`, `AdminProductCatalog`, y `AdminOrderManager` para consumir `useAppStore` en lugar de recibir datos por `props`.
    *   **Razón:** Necesitamos eliminar toda dependencia de estados locales dispersos para asegurar que la "Fuente Única de Verdad" sea consistente.

## Prioridad 2: Funcionalidad y Coherencia (Integridad)

3.  **Implementación del Contenido en `FinancialInitializationModal`:**
    *   **Acción:** Sustituir el marcador de posición del modal con los formularios reales que interactúen con `bankBalances`, `accountsReceivable`, y `accountsPayable` del store.
    *   **Razón:** Habilitar la funcionalidad real para que el administrador pueda cargar sus datos iniciales.

4.  **Atomicidad en Ventas y Gastos:**
    *   **Acción:** Crear acciones atómicas en `useAppStore` para `addOrder` y `addExpense`.
    *   **Razón:** Al igual que con las compras, estas acciones deben registrar el movimiento contable (asiento automático) y afectar los saldos bancarios de forma sincronizada. Esto elimina el descuadre contable.

## Prioridad 3: Seguridad y Calidad (Sostenibilidad)

5.  **Tipo de Datos Estricto en Store:**
    *   **Acción:** Refinar las interfaces del store para evitar `any[]` y tipar correctamente las estructuras de datos (ej. `AccountsReceivableItem`).
    *   **Razón:** El uso de `any` es un riesgo de *runtime* que debemos eliminar para evitar errores difíciles de depurar.

6.  **Validación de Persistencia:**
    *   **Acción:** Implementar un middleware en Zustand o un proceso de *hydration* para asegurar que los datos del `localStorage` son válidos antes de cargarlos.
    *   **Razón:** Prevenir errores si el formato del JSON guardado cambia tras una actualización del sistema.

7.  **Sistema de *Undo/Redo* Financiero:**
    *   **Acción:** Aprovechar el middleware de Zustand para implementar un historial de acciones.
    *   **Razón:** Si un administrador comete un error al registrar un saldo inicial, poder revertirlo al estado anterior es crucial.

---
**Recomendación de experto:** Comienza con la **Acción #1 (Refactorización de App.tsx)**. Es el paso más importante para limpiar la estructura del proyecto antes de seguir añadiendo lógica de negocio.
