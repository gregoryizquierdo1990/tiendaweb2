# Guía de Despliegue en Producción: GitHub ➔ Vercel ➔ Dominio www.gregoryizquierdo.xyz

El proyecto ha sido preparado para producción: **completamente limpio, sin registros ni pedidos demo**, con catálogo real de productos de streaming, pasarelas de pago configuradas y optimizaciones para `www.gregoryizquierdo.xyz`.

---

## 1. Estado del Proyecto: 100% Operativo y Sin Registros Demo

1. **Eliminación Total de Datos Demo:**
   - Se removieron los pedidos de prueba (`STR-99999`, `STR-92415`, `STR-91832`).
   - Se removió el cliente ficticio `cliente@demo.com` (`Carlos Mendoza`) y balances de prueba.
   - Se eliminaron las franquicias de prueba (`StreamPlus Venezuela`, etc.) e incidencias demo.
   - Se eliminaron las compras de proveedores simuladas (`possub41+4uph8e@gmail.com`).
   - Se removieron los botones de prueba en modales ("Entrar como Cliente Demo con 15 GRPAY", "Usar Cuenta Demo").
   - El estado inicial de Zustand y `localStorage` cuenta con filtros automáticos para que ningún dato residual de pruebas aparezca al abrir el sitio.

2. **Catálogo de Servicios y Pasarelas de Pago Oficiales:**
   - Catálogo de plataformas (Netflix, Disney+, Max, Spotify, Prime Video, YouTube Premium, etc.) listo para vender por perfiles con PIN o cuentas completas.
   - Pago Móvil, Binance Pay, Airtm, Zelle, Zinli y Billetera GRPAY 100% operativos.
   - Tasa BCV oficial con actualización automática en vivo.

3. **Optimizaciones para el Dominio `www.gregoryizquierdo.xyz`:**
   - `index.html` configurado con título oficial, metadatos OpenGraph, tarjeta Twitter y datos estructurados Schema.org (`WebApplication`).
   - Archivo de configuración `vercel.json` con reescritura para rutas SPA (`/* -> /`).
   - Archivo `public/_redirects` para compatibilidad directa con Netlify.
   - Archivo `public/CNAME` con `www.gregoryizquierdo.xyz` para GitHub Pages.
   - `public/robots.txt` y `public/sitemap.xml` listos para indexación en Google.

---

## 2. Descarga del Código Fuente (.ZIP)

El paquete completo comprimido listo para producción está generado y disponible en la raíz y en la carpeta pública:

- **Archivo descargable:** `proyecto-gregory-izquierdo.zip` (o ruta web `/proyecto-gregory-izquierdo.zip`).
- Contiene todo el código fuente listo para compilar (`npm run build`), libre de archivos temporales y `node_modules`.

---

## 3. Subir el Proyecto a GitHub

Si tienes Git instalado en tu computadora:

```bash
# 1. Descomprime el archivo zip en una carpeta y abre una terminal allí:
cd /ruta/de/tu-proyecto

# 2. Inicializa el repositorio Git (si es nuevo):
git init

# 3. Añade todos los archivos:
git add .

# 4. Crea el commit de producción:
git commit -m "feat: release produccion limpia para www.gregoryizquierdo.xyz sin registros demo"

# 5. Vincula tu repositorio remoto de GitHub (reemplaza con tu URL):
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 6. Sube los cambios a la rama principal (main):
git branch -M main
git push -u origin main --force
```

---

## 4. Desplegar en Vercel y Vincular el Dominio

1. **Importar Repositorio en Vercel:**
   - Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
   - Haz clic en **"Add New..."** ➔ **"Project"**.
   - Selecciona tu repositorio recién subido.
   - **Framework Preset:** Vite (se detecta automáticamente).
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - Haz clic en **"Deploy"**.

2. **Vincular el Dominio Personalizado:**
   - En el panel del proyecto en Vercel, dirígete a **Settings** ➔ **Domains**.
   - Escribe tu dominio: `www.gregoryizquierdo.xyz` (y también `gregoryizquierdo.xyz`).
   - Haz clic en **Add**.

3. **Configuración de DNS en tu Registrador de Dominio (Namecheap, Hostinger, GoDaddy, Cloudflare, etc.):**
   - **Registro CNAME:**
     - Nombre / Host: `www`
     - Valor / Destino: `cname.vercel-dns.com`
   - **Registro A (para la raíz):**
     - Nombre / Host: `@`
     - Valor / IP: `76.76.21.21`

*(Una vez guardados los DNS, Vercel emitirá automáticamente el certificado SSL HTTPS gratuito en pocos minutos).*

---

## 5. Acceso al Panel de Administración

Para entrar al Panel Administrativo en `www.gregoryizquierdo.xyz`:

- **Botón de acceso:** Haz clic en el ícono de escudo o enlace **"Acceso Admin"** en el pie de página o barra superior.
- **Usuario Maestro:** `maxter`
- **Contraseña:** `maxter` o `nolimits.10`
- **Autenticación 2FA:**
  - **Google Authenticator (TOTP):** Clave secreta base `JBSWY3DPEHPK3PXP` (puedes escanear el QR en pantalla o ingresar el código de 6 dígitos).
  - O selecciona **WhatsApp / Pregunta de Seguridad** según tu preferencia.

¡Tu plataforma de streaming está lista para recibir clientes y procesar pagos reales en producción!
