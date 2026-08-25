# Minimarket 24/7 — App móvil (Expo)

Versión Android para administrar el catálogo del minimarket, hecha con Expo/React Native.
Consume la **misma API** que ya usa la app de escritorio (los mismos
endpoints de `apps/desktop/src/services/api.js`), así que no necesitas
tocar el backend.

## 1. Configurar la URL del backend

Edita `app.json` y reemplaza:

```json
"extra": {
  "apiUrl": "https://TU-BACKEND-EN-RAILWAY.up.railway.app"
}
```

con la URL real de tu backend en Railway (sin `/api` al final, eso ya
lo agrega `src/services/api.js`).

## 2. Instalar dependencias

```bash
npm install
npx expo install expo-linear-gradient expo-haptics
```

`expo-linear-gradient` mejora los encabezados y `expo-haptics` agrega una
respuesta táctil ligera al navegar. Ambas funcionan con Expo Go.

## 3. Probar en tu celular (modo desarrollo)

```bash
npx expo start
```

Escanea el QR con la app **Expo Go** desde tu Android (necesitas que
el celular y la computadora estén en la misma red, y que el backend
de Railway sea accesible desde internet — no uses `127.0.0.1` en
`app.json` si vas a probar en un celular físico).

## 4. Generar el APK instalable

Necesitas una cuenta gratuita de Expo (https://expo.dev) y la CLI de
EAS:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

Al terminar, EAS te da un link para descargar el `.apk` directo al
celular, sin pasar por Play Store.

## Qué incluye esta versión

- **Login** (`src/screens/LoginScreen.js`)
- **Productos** (`src/screens/ProductosScreen.js`): listar, buscar,
  crear y editar productos, con creación rápida de categorías.
- **Inventario** (`src/screens/InventarioScreen.js`): ver movimientos
  y registrar entradas/salidas/ajustes de stock.
- **Proveedores** (`src/screens/ProveedoresScreen.js`): listar, buscar,
  crear y editar proveedores.
- **Compras** (`src/screens/ComprasScreen.js`): listar compras y
  registrar una nueva (proveedor + productos + cantidad + costo).

La aplicación está enfocada únicamente en la gestión del catálogo, con navegación
inferior entre Productos, Inventario, Proveedores y Compras.

## Qué falta (agregar cuando lo necesites)

- Pantalla de **Caja y turnos** (abrir/cerrar caja, movimientos) — el
  desktop ya tiene la lógica en `CajaPage.jsx`, se puede portar igual
  que se hizo con Ventas.
- Clientes especiales, reportes y usuarios (aún no portados).
- Reportes / PDF — en el desktop se generan con Electron
  (`printToPDF`), eso **no funciona en el celular**. Si lo necesitas
  aquí, hay que moverlo al backend (que genere el PDF y lo sirva por
  HTTP) para que tanto desktop como mobile lo puedan descargar igual.
