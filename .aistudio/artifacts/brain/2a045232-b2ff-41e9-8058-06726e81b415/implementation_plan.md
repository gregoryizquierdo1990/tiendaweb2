# Autenticación con Firebase Auth y Gestión de Roles en Firestore (users)

Plan de arquitectura e implementación para integrar el registro e inicio de sesión de usuarios mediante Firebase Auth (correo/contraseña y Google Sign-In), aprovisionando automáticamente un documento en la colección `users` de Firestore con el rol predeterminado `cliente`. Adicionalmente, se protege la promoción al rol `vendedor` para que únicamente el administrador autenticado con código maestro pueda ejecutar cambios de rol desde el panel de gestión.

## Decisiones Confirmadas del Usuario

> [!IMPORTANT]
> - **Métodos de Autenticación**: Doble vía habilitada: Correo electrónico con contraseña y acceso rápido con cuenta de Google (Google Sign-In).
> - **Rol Inicial Predeterminado**: Todo nuevo usuario registrado recibe obligatoriamente el rol `cliente`. No se permite la auto-asignación de roles superiores durante el registro.
> - **Gestión de Vendedores**: La asignación y cambio al rol `vendedor` es potestad exclusiva del usuario con rol `admin` desde el panel de control, protegido mediante código maestro.

---

## 1. Visión General del Sistema

El flujo de autenticación y control de acceso (RBAC) constará de:
1. **Registro con Firebase Auth (`firebaseAuthService.ts`)**:
   - `createUserWithEmailAndPassword` y `signInWithPopup(GoogleAuthProvider)`.
   - Creación inmediata del documento `/users/{uid}` en Firestore con esquema:
     `{ uid, email, displayName, phone, role: 'cliente', createdAt, updatedAt }`.
2. **Seguridad y Reglas en Firestore (`firestore.rules`)**:
   - Validación a nivel de base de datos para impedir que un usuario se auto-asigne el rol `vendedor` o `admin` en la creación o actualización.
   - Solo un administrador autenticado puede modificar el campo `role`.
3. **Panel de Gestión de Usuarios y Vendedores (`AdminUserManager.tsx`)**:
   - Interfaz visual en la pestaña de usuarios para visualizar roles (`cliente` vs `vendedor`).
   - Botón de cambio de rol con verificación de código maestro de seguridad.
   - Sincronización en tiempo real con Firestore y bitácora de auditoría.

---

## 2. Experiencia de Usuario & Diseño Visual

### Modal de Autenticación (`CustomerAuthModal.tsx`)
- Se simplifica el formulario de registro: se elimina la opción de seleccionar rol, asignando automáticamente `cliente`.
- Botón principal de registro con correo y contraseña.
- Botón destacado de acceso rápido: "Continuar con Google".
- Mensajes de error claros en español (contraseña corta, correo ya registrado, credenciales inválidas).

### Panel de Gestión de Usuarios (`AdminUserManager.tsx`)
- Tabla de usuarios con distintivo de rol:
  - `Cliente`: Etiqueta sutil en tono slate/azul.
  - `Vendedor`: Etiqueta destacada en tono púrpura/índigo con icono de credencial comercial.
- Control interactivo para ascender/degradar rol:
  - Al hacer clic en "Cambiar a Vendedor", solicita la confirmación con el código maestro del administrador.
  - Al confirmar, actualiza el documento en `/users/{uid}` y notifica el éxito de la operación.

---

## 3. Decisiones Técnicas y Arquitectura

```
┌────────────────────────────────────────────────────────┐
│             Registro de Usuario (Cliente)              │
│  - Correo/Contraseña o Google Sign-In                  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Firebase Auth (tactical-codex-mxjsq)         │
│  - Genera auth.currentUser.uid                         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         Firestore Collection: /users/{uid}             │
│  - role: 'cliente' (Obligatorio en create)             │
│  - email, displayName, phone, createdAt                │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           Panel de Gestión de Administrador            │
│  - Requiere rol 'admin' + Código Maestro               │
│  - updateDoc(users/{uid}, { role: 'vendedor' })        │
└────────────────────────────────────────────────────────┘
```

### Componentes y Módulos a Implementar

1. **Servicio de Autenticación (`src/services/firebaseAuthService.ts`)**:
   - `registerUserWithEmail(email, password, displayName, phone)`:
     - Ejecuta `createUserWithEmailAndPassword`.
     - Actualiza `updateProfile(user, { displayName })`.
     - Guarda el documento en Firestore `doc(db, 'users', user.uid)` con `role: 'cliente'`.
     - Guarda el registro sincronizado en la colección `customers` para compatibilidad total con pedidos y compras.
   - `loginUserWithEmail(email, password)`: Autentica y recupera el perfil con rol desde Firestore.
   - `loginUserWithGoogle()`: Autentica con popup de Google y crea el documento en `/users/{uid}` con `role: 'cliente'` si es la primera vez que inicia sesión.
   - `changeUserRole(targetUid, newRole, masterCode)`: Valida la autorización del administrador y actualiza el rol en `/users/{targetUid}` y `/customers/{targetUid}`.

2. **Refactorización de `CustomerAuthModal.tsx`**:
   - Integración nativa con `registerUserWithEmail` y `loginUserWithGoogle`.
   - Eliminación de la selección manual de vendedor durante el registro público.

3. **Panel Administrativo de Roles (`src/components/AdminUserManager.tsx`)**:
   - Adición del interruptor de rol (`cliente` <-> `vendedor`) por cada usuario.
   - Modal o diálogo de confirmación con código maestro administrativo.
   - Registro en bitácora de auditoría (`auditLogger.ts`).

4. **Reglas de Seguridad (`firestore.rules`)**:
   - Regla para `/users/{userId}`:
     - `allow create: if request.resource.data.role == 'cliente';`
     - `allow update: if request.resource.data.role == resource.data.role || isAdmin();`

---

## 4. Plan de Verificación

1. **Prueba de Registro de Cliente**:
   - Registrar un nuevo usuario con correo y contraseña.
   - Verificar en Firestore que el documento `/users/{uid}` tenga `role: 'cliente'`.
2. **Prueba de Registro con Google**:
   - Simular inicio de sesión con Google y verificar creación del documento con `role: 'cliente'`.
3. **Prueba de Cambio de Rol a Vendedor**:
   - Desde el panel de administración, seleccionar al cliente recién creado e introducir el código maestro para cambiar su rol a `vendedor`.
   - Verificar que el documento en Firestore se actualice a `role: 'vendedor'`.
4. **Compilación y Linter**:
   - Ejecutar `compile_applet` y `lint_applet` para confirmar cero errores de tipos o sintaxis.
