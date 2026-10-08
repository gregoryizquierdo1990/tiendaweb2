# Plan de Implementación: Sincronización Bidireccional Supabase y Panel de Control

Diseño y estrategia de ingeniería para solucionar de raíz el problema de sincronización de clientes con Supabase, asegurando que los registros locales y remotos se fusionen inteligentemente en tiempo real, e introduciendo un sofisticado panel de visualización y control de sincronización en la sección de administración.

---

## Decisiones del Usuario y Puntos Críticos

> [!IMPORTANT]
> A continuación se resumen las decisiones clave de arquitectura confirmadas por el usuario:
>
> 1. **Estrategia de Escritura**: Sincronización en tiempo real con escritura directa e inmediata a Supabase al registrar un cliente, incorporando reintentos automáticos y manejo claro de fallas.
> 2. **Resolución de Conflictos en Inicio**: Fusión bidireccional inteligente de datos para que los clientes registrados localmente se suban a Supabase, y los nuevos clientes en Supabase se descarguen localmente, previniendo la pérdida accidental de información o sobreescrituras destructivas.
> 3. **Visibilidad y Control**: Incorporación de un panel visual completo de conexión y un botón de "Sincronización Manual" en el submódulo de base de datos de administración.

---

## 1. Visión General y Concepto Principal

### Qué Hace
Establece un enlace bidireccional robusto y en tiempo real entre el estado local de la aplicación y la base de datos de Supabase. Corrige el fallo donde los nuevos clientes registrados de forma local se borraban al iniciar la aplicación si Supabase tenía registros. Proporciona a los administradores transparencia absoluta con un Panel de Sincronización de Base de Datos interactivo.

### Audiencia Objetivo
- **Administradores**: Que requieren ver que cada cliente, pedido y recarga esté perfectamente asentado en la base de datos de Supabase sin inconsistencias.
- **Clientes**: Que se registran en la tienda y deben tener acceso instantáneo a su cuenta en cualquier dispositivo gracias a que su perfil se guarda de inmediato en la nube.

### Valor Clave
Garantía absoluta de persistencia de datos, prevención de borrado accidental de registros en el arranque de la app, y retroalimentación interactiva del estado de la base de datos en tiempo real.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujos Clave de Usuario
1. **Registro Inmediato**: Un cliente se registra en la tienda. El sistema realiza la inserción local en milisegundos y, en paralelo, ejecuta un intento prioritario de upsert en Supabase. Si tiene éxito, se marca como sincronizado; si falla, se encola localmente para reintento y se informa elegantemente si la conexión estuviera caída.
2. **Arranque e Integración Inteligente**: En el inicio de la app, el proceso compara las firmas de tiempo e IDs de todos los registros (clientes, productos, recargas, etc.) entre la memoria local y Supabase, completando los faltantes en ambos lados.
3. **Consola de Sincronización (Admin)**: El administrador abre la sección de "Base de Datos Supabase" en su panel lateral y observa:
   - Tarjetas de estado con el número total de registros locales frente a remotos.
   - Indicadores visuales de salud de conexión (Verde / Rojo).
   - Tabla detallada por módulo (Clientes, Productos, Métodos de Pago, FAQ, Recargas, Franquicias).
   - Un botón con microinteracción de carga para "Sincronizar Todo Manualmente" que realiza la fusión en tiempo real.

### Identidad Visual y Tema (SaaS Dashboard)
Siguiendo las pautas del manual de diseño de tableros de control SaaS:
- **Canvas Mínimo**: Fondo neutral (`bg-slate-900`) con bordes de pelo ultra sutiles (`border-slate-800`).
- **Estados Semánticos**:
  - `Verde` (`#16A34A`): Conexión establecida / Sincronizado.
  - `Ámbar` (`#D97706`): Sincronización pendiente / Proceso en curso.
  - `Rojo` (`#DC2626`): Error de conexión / Credenciales inválidas.
- **Tipografía**: Cifras y contadores usando tipografía tabular mono (`font-mono tabular-nums`) para evitar saltos visuales durante conteos rápidos de registros.

---

## 3. Decisiones de Producto y Trade-Offs

### Decisión 1: Fusión Inteligente (Merging) en lugar de Reemplazo Completo
- **Enfoque Elegido**: Algoritmo de unión externa completa (Full Outer Join) en memoria por ID. Si un ID existe en local pero no en DB, se sube. Si existe en DB pero no en local, se descarga. Si existe en ambos, se prefiere la versión con el balance de Zeny más actualizado o fecha de creación.
- **Por qué**: Evita que los datos creados localmente se borren cuando la base de datos remota se inicializa, o viceversa.
- **Alternativa Descartada**: Sobrescribir siempre con Supabase (causaba pérdida de clientes locales) o sobrescribir siempre con local (causaba pérdida de registros remotos hechos por otros administradores).

### Decisión 2: Sincronización por Registro vs Operaciones por Lote Completo en Escritura
- **Enfoque Elegido**: Al añadir o editar un cliente individual, realizar el upsert específico de esa fila en Supabase en lugar de enviar todo el arreglo de clientes de golpe.
- **Por qué**: Optimiza drásticamente el consumo de ancho de banda y evita errores en cascada de `Promise.all` cuando un solo registro viola alguna restricción o regla de seguridad en la base de datos remota.

---

## 4. Arquitectura Técnica y Estrategia de Datos

### Diagrama del Sistema de Datos

```
┌────────────────────────────────────────────────────────┐
│                      Client Browser                    │
│                                                        │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │   Customer Portal │        │ Admin Control Panel │  │
│  │ (Auth / Regist.)  │        │ (Sync Dashboard)    │  │
│  └─────────┬─────────┘        └──────────┬──────────┘  │
│            │                             │             │
│            ▼                             ▼             │
│  ┌──────────────────────────────────────────────────┐  │
│  │                     App Store                    │  │
│  │                (useAppStore state)               │  │
│  └─────────┬─────────────────────────────┬──────────┘  │
│            │                             │             │
│            ▼                             ▼             │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │   LocalStorage    │        │  Supabase Client    │  │
│  │ (Offline Fallback)│        │  (Real-Time API)    │  │
│  └───────────────────┘        └──────────┬──────────┘  │
└──────────────────────────────────────────┼─────────────┘
                                           │
                                           ▼ (Secured API)
                                ┌─────────────────────┐
                                │ Supabase Database   │
                                │ (Remote PostgREST)  │
                                └─────────────────────┘
```

### Plan de Acción de Código

1. **Modificar `src/App.tsx`**:
   - Reescribir el flujo de `syncDatabaseWithSupabase` para implementar fusión bidireccional para todas las tablas clave (especialmente `customers` y `products`).
   - Agregar validación en caliente de las credenciales de Supabase.
2. **Modificar `src/store/useAppStore.ts`**:
   - Actualizar los métodos de escritura (`setCustomers`, `setProducts`, etc.) para que cuando se agregue o modifique un elemento, se sincronice únicamente ese elemento específico en tiempo real, con control de errores detallado.
3. **Modificar `src/components/AdminReconciliationModal.tsx` o crear una nueva pestaña**:
   - Integrar la pestaña "Sincronización Supabase" con una interfaz deslumbrante que muestre el estado en vivo, conteos mono-espaciados, log de eventos de sincronización y un gran botón interactivo de "Sincronizar Ahora".
