# Eliminación de Credenciales Maestras y Gestión de Operadores - Acceso Exclusivo Google

Este plan define la reestructuración del módulo de acceso administrativo para erradicar las credenciales maestras tradicionales de usuario/contraseña y el gestor de operadores, dejando una autenticación única, moderna y segura basada exclusivamente en el Botón Oficial de Google vinculado al correo del propietario (`emprendimientogregoryizquierdo@gmail.com`).

---

## Decisiones Críticas Confirmadas por el Usuario

> [!IMPORTANT]
> Se han confirmado las siguientes decisiones clave durante la fase de aclaración interactiva:

- **Acceso Exclusivo con Google**: La ventana emergente de acceso administrativo (`AdminLoginModal`) suprimirá por completo el formulario tradicional de usuario y contraseña, el flujo secundario de contraseñas de emergencia y el cajón de operadores. El acceso se realizará 100% mediante el botón oficial de Google.
- **Tarjeta de Identidad Única en el Panel Contable**: En `AdminUserManager`, se eliminará el listado y reseteo de contraseñas maestras múltiples, presentando una tarjeta institucional clara del **Administrador Único Autorizado (Google Identity)** junto al directorio de clientes, vendedores y franquicias.
- **Purga de Datos Residuales**: Se limpian del almacenamiento local (`localStorage`) y del estado de React los operadores secundarios (`staffMembers`) y credenciales maestras obsoletas (ej. `neron`), garantizando que ninguna sesión o clave residual tenga permisos de acceso.

---

## 1. Visión General & Concepto Central

- **Qué hace**: Convierte la puerta de enlace administrativa en un flujo sin fricción y de máxima seguridad corporativa: un solo clic en *"Continuar con Google como Administrador"*, validando de forma instantánea el correo emitido por el proveedor OAuth de Google.
- **Audiencia / Persona**: Gregory Izquierdo como propietario y administrador supremo del sistema.
- **Beneficio Principal**: Elimina el riesgo de filtración de contraseñas maestras estáticas, remueve la complejidad innecesaria de roles de operadores y centraliza la auditoría de seguridad directamente bajo la cuenta corporativa de Google.

---

## 2. Experiencia de Usuario & Diseño Visual

### Flujo de Acceso del Administrador
1. El usuario hace clic en el botón de acceso administrativo (icono de escudo/candado en la cabecera o pie de página).
2. Se despliega el modal `AdminLoginModal` con una estética sobria, limpia y profesional:
   - Cabecera con degradado Slate/Indigo y distintivo de *Acceso Administrativo Verificado*.
   - Botón central de **Google Sign-In** oficial con el isotipo a color de Google y etiqueta clara.
   - Indicador tipográfico sutil de cuenta autorizada (`emprendimientogregoryizquierdo@gmail.com`).
   - Sin campos de texto para usuario ni contraseña. Sin botones de operadores secundarios.
3. Al pulsar el botón, se abre la ventana emergente oficial de Google Identity Services. Si la cuenta seleccionada coincide con el correo autorizado, se concede el token de sesión y se abre el panel de control inmediatamente con notificación de éxito.

### Vista en el Panel Administrativo (`AdminUserManager`)
- Se reemplaza la sección de tarjetas con contraseñas editables por una **Ficha de Seguridad del Administrador Supremo**:
  - Estado: Activo y Protegido por Google OAuth.
  - Correo Autorizado: `emprendimientogregoryizquierdo@gmail.com`.
  - Teléfono Oficial de Contacto y soporte.
  - Eliminación de los botones de "Cambiar Clave" o envío de credenciales maestras.
- Se mantiene íntegro el directorio interactivo de clientes, vendedores, franquiciados y subfranquiciados con sus herramientas de edición.

---

## 3. Decisiones de Producto & Trade-Offs

- **Decisión 1: Eliminar completamente el flujo de contraseñas legacy en el login**
  - *Enfoque*: El modal solo ofrece Google OAuth.
  - *Razón*: Evita confusión en el usuario y elimina vulnerabilidades asociadas a contraseñas estáticas compartidas o guardadas en el código/navegador.
- **Decisión 2: Supresión del gestor de operadores en `AdminLoginModal` y `App.tsx`**
  - *Enfoque*: Remover los handlers `onAddStaff`, `onDeleteStaff`, `onUpdateStaffPassword` y el estado `staffMembers`.
  - *Razón*: El negocio opera con un único administrador dueño; la existencia de operadores creaba ruido visual y complejidad innecesaria.
- **Decisión 3: Preservar el directorio de usuarios de clientes y franquicias**
  - *Enfoque*: Solo se remueve la sección de credenciales de administradores y operadores; el catálogo de clientes y franquiciados en `AdminUserManager` se conserva al 100%.

---

## 4. Arquitectura Técnica & Estrategia de Datos

### Diagrama del Sistema de Autenticación Unificado

```
┌──────────────────────────────────────────────────────────────┐
│                    AdminLoginModal.tsx                       │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │       [ Continuar con Google como Administrador ]     │   │
│   └──────────────────────────┬───────────────────────────┘   │
└──────────────────────────────┼───────────────────────────────┘
                               │ Click
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  services/googleAuth.ts                      │
│            googleSignIn() -> Google Identity Services        │
└──────────────────────────────┬───────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [ Correo Coincide ]             [ Correo Inválido ]
  emprendimientogregoryizquierdo...                    │
               │                                       ▼
               ▼                         Muestra mensaje de error:
   Genera Token de Sesión                "Acceso denegado: cuenta
   y Notifica onLoginSuccess()            no autorizada"
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│                      App.tsx / Store                         │
│   - setIsAdminOpen(true)                                     │
│   - Guarda token de sesión del administrador único           │
│   - Purgar 'streamsync_staff_members_v1' y 'staffMembers'    │
└──────────────────────────────────────────────────────────────┘
```

### Acciones Concretas de Código tras Aprobación:
1. **`src/components/AdminLoginModal.tsx`**:
   - Remover los estados de formulario de contraseña (`username`, `password`, `errorMessage`, `step === 'credentials'` de inputs, `step === '2fa'`).
   - Remover el acordeón/cajón `showStaffManager`, `newStaffName`, `newStaffUser`, `newStaffPass`, `newStaffRole`, `onAddStaff`, `onDeleteStaff`, `onUpdateStaffPassword`.
   - Simplificar la interfaz al contenedor exclusivo del Botón Oficial de Google, con indicador de carga y badges tipográficos limpios.
2. **`src/App.tsx`**:
   - Eliminar el estado `staffMembers`, `handleAddStaff`, `handleUpdateStaffPassword`, `handleDeleteStaff`.
   - Eliminar los props de operadores pasados a `AdminLoginModal`.
   - Limpiar cualquier clave residual de operadores en `localStorage` al iniciar.
3. **`src/components/AdminUserManager.tsx`**:
   - Reemplazar la sección de edición de contraseñas de administradores maestros por una ficha única del Administrador Supremo autenticado por Google.
   - Retirar los botones de reseteo de claves de administradores.
4. **Verificación & Linting**:
   - Ejecutar `lint_applet` y `compile_applet` para confirmar cero errores en la compilación de TypeScript y Vite.
