# Validación de Unicidad en la Base de Datos - Resumen

## 📋 Objetivo
Asegurar que no existan duplicados de **DNI** y **Correo Electrónico** en la base de datos de empleados.

## ✅ Implementaciones Realizadas

### 1. **Backend - Validaciones Automáticas**

#### 1.1 Creación de Empleados (`createEmployee`)
**Archivo**: `apps/api/src/rrhh/rrhh.service.ts` (líneas 8-31)

- **Validación de DNI**: Antes de crear un empleado, verifica que el DNI no exista
- **Validación de Email**: Antes de crear un empleado, verifica que el email no exista
- **Respuesta de Error**: Lanza `ConflictException` con mensaje descriptivo

```typescript
// Verificación DNI
const dniSnapshot = await firestore.collection('employees').where('dni', '==', data.dni).get();
if (!dniSnapshot.empty) {
    throw new ConflictException(`El DNI ${data.dni} ya está registrado.`);
}

// Verificación Email
const emailSnapshot = await firestore.collection('employees').where('email', '==', data.email).get();
if (!emailSnapshot.empty) {
    throw new ConflictException(`El correo ${data.email} ya está registrado.`);
}
```

#### 1.2 Actualización de Empleados (`updateEmployee`)
**Archivo**: `apps/api/src/rrhh/rrhh.service.ts` (líneas 78-97)

- **Validación de DNI**: Al actualizar, verifica que el nuevo DNI no pertenezca a otro empleado
- **Validación de Email**: Al actualizar, verifica que el nuevo email no pertenezca a otro empleado
- **Excluye al mismo empleado**: Permite que un empleado mantenga su propio DNI/email

```typescript
if (data.dni) {
    const dniSnapshot = await firestore.collection('employees').where('dni', '==', data.dni).get();
    if (!dniSnapshot.empty && dniSnapshot.docs[0].id !== id) {
        throw new ConflictException(`El DNI ${data.dni} ya está registrado por otro empleado.`);
    }
}
```

#### 1.3 Verificación en Tiempo Real (`checkExistence`)
**Archivo**: `apps/api/src/rrhh/rrhh.service.ts` (líneas 234-254)

Endpoint: `GET /rrhh/check-existence?dni=XXX&email=YYY`

- Verifica si existe un DNI o email en la base de datos
- Retorna información del empleado que ya tiene ese dato
- Usado por el frontend para validación en tiempo real

```typescript
async checkExistence(dni?: string, email?: string): Promise<{ 
    exists: boolean, 
    field?: string, 
    name?: string, 
    id?: string 
}>
```

### 2. **Frontend - Validación en Tiempo Real**

#### 2.1 Formulario de Nuevo Empleado
**Archivo**: `apps/web/app/dashboard/rrhh/new/page.tsx`

- **onBlur del campo DNI** (línea 192): Ejecuta `checkUniqueness('dni', value)`
- **onBlur del campo Email** (línea 295): Ejecuta `checkUniqueness('email', value)`
- **Toast de alerta**: Muestra mensaje al usuario si hay duplicado

```typescript
const checkUniqueness = async (field: 'dni' | 'email', value: string) => {
    if (!value) return;
    const res = await fetch(`${API_URL}/rrhh/check-existence?${field}=${value}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    if (res.ok) {
        const data = await res.json();
        if (data.exists) {
            showToast(`Este ${data.field} ya está registrado por ${data.name}`, "error");
        }
    }
};
```

### 3. **Herramientas de Mantenimiento (Modo Estricto)**

#### 3.1 Analizar Duplicados (SIN eliminar)
**Endpoint**: `GET /rrhh/maintenance/analyze-duplicates`
**Función**: `analyzeDuplicates()` en `rrhh.service.ts`

Retorna un análisis completo de duplicados utilizando **normalización estricta**:
- **DNIs**: Se eliminan espacios en blanco antes de comparar (`trim`)
- **Emails**: Se eliminan espacios y se convierten a minúsculas (`trim` + `lowercase`)

#### 3.2 Limpiar Duplicados (ELIMINACIÓN AGRESIVA)
**Endpoint**: `POST /rrhh/maintenance/cleanup-duplicates`
**Función**: `cleanupDuplicates()` en `rrhh.service.ts`

**Estrategia de limpieza IMPLACABLE**:
1. Agrupa empleados por DNI normalizado y Email normalizado
2. Si encuentra CUALQUIER duplicado:
   - Ordena por `createdAt` (más reciente primero)
   - **Mantiene**: Solo el registro más reciente
   - **Elimina**: TODOS los demás registros duplicados sin excepción
3. **Auto-ejecución**: Esta limpieza se ejecuta automáticamente al iniciar el servicio para asegurar la integridad.

**Retorno**:
```json
{
  "deleted": 3,
  "details": {
    "deletedByDni": 2, // Detalles específicos...
    "deletedByEmail": 1
  },
  "message": "Limpieza completada. Eliminados 3 registros duplicados..."
}
```

## 🔒 Permisos

Todos los endpoints de mantenimiento requieren rol **GERENTE**:
- `GET /rrhh/maintenance/analyze-duplicates`
- `POST /rrhh/maintenance/cleanup-duplicates`

## 📝 Flujo de Uso Recomendado

### Para prevenir duplicados (uso normal):
1. El usuario llena el formulario de nuevo empleado
2. Al salir del campo DNI, se valida automáticamente
3. Al salir del campo Email, se valida automáticamente
4. Si hay duplicado, se muestra un toast de error
5. Al intentar guardar, el backend valida nuevamente

### Para limpiar duplicados existentes:
1. **Analizar primero**: `GET /rrhh/maintenance/analyze-duplicates`
   - Revisar cuántos duplicados hay
   - Verificar qué registros se eliminarían
2. **Limpiar**: `POST /rrhh/maintenance/cleanup-duplicates`
   - Ejecutar solo después de revisar el análisis
   - Guardar el resultado para auditoría

## 🎯 Estado Actual

✅ Validación en creación (backend)
✅ Validación en actualización (backend)
✅ Validación en tiempo real (frontend)
✅ Endpoint de análisis de duplicados
✅ Endpoint de limpieza de duplicados
✅ Manejo de errores con ConflictException
✅ Mensajes descriptivos al usuario

## 🚀 Próximos Pasos (Opcional)

- [ ] Crear página de administración en el frontend para ejecutar limpieza
- [ ] Agregar log de auditoría de registros eliminados
- [ ] Implementar backup automático antes de limpieza
- [ ] Agregar opción de "dry run" (simular sin eliminar)
