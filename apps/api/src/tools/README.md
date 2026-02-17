# Scripts de Mantenimiento y Desarrollo

## Scripts de Desarrollo (`dev/`)

### `check-db.js`
Verifica la conectividad con Firestore.

### `test-db.js`
Prueba operaciones CRUD básicas en Firestore.

### `test-firebase.js`
Valida configuración de Firebase Admin SDK.

## Scripts de Mantenimiento (`maintenance/`)

### `list-users.js`
Lista todos los usuarios registrados en Firebase Auth.

### `verify-unification.js`
Verifica sincronización entre colecciones `users` y `employees`.

## Uso

Ejecutar desde el directorio `apps/api`:
```bash
node src/tools/dev/check-db.js
node src/tools/maintenance/list-users.js
```
