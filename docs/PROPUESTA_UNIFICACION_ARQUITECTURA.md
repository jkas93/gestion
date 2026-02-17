# 🏗️ Propuesta de Arquitectura: Unificación de Usuario y Empleado

## 🎯 Objetivo
Unificar las entidades de **Usuario** (acceso) y **Empleado** (recurso) en una única entidad **"Colaborador"** (o mantener el nombre **Empleado**), eliminando la duplicidad de datos y simplificando la gestión del sistema.

---

## 1. La Nueva Arquitectura Propuesta

### Modelo Actual (Dual)
*   **Auth User**: Manejado por Google Identity Platform.
*   **Colección `users`**: Datos de perfil de acceso (Rol, Email). ID = `UID`.
*   **Colección `employees`**: Datos de RRHH (DNI, Salario). ID = `Random`.

### Modelo Unificado (Single Entity)
*   **Auth User**: Sigue igual (Garante del Login).
*   **Colección `employees`**: ÚNICA colección maestra.
    *   **ID**: `UID` (Mismo que Auth).
    *   **Datos**: Contiene TODO (Rol, Email, DNI, Salario, Puesto...).
*   **Colección `users`**: **ELIMINADA**.

---

## 2. Impacto en el Login y Autenticación

### ✅ Login (Sin Cambios Críticos)
El inicio de sesión seguirá siendo transparente para el usuario final.
1.  El usuario se loguea en el frontend con email/password.
2.  Firebase devuelve un **Token**.
3.  El **Rol** (Gerente, RRHH) seguirá viajando dentro del Token (Custom Claims), por lo que las rutas protegidas (`RolesGuard`) seguirán funcionando **sin tocar una sola línea de código en los Guards**.

### 🔄 Cambio en "Mi Perfil"
Cuando el usuario quiera ver sus datos ("Hola, Kevin"), el frontend ya no consultará `/users/me`, sino `/employees/me` (o `/employees/{uid}`), obteniendo la ficha completa de una sola vez.

---

## 3. Impacto en la Base de Datos

### 📉 Simplificación y Limpieza
*   **Eliminación de `Users`**: Se borrará la colección `users`.
*   **Migración**:
    *   Los datos de `users` (principalmente `role`) se copiarán a `employees`.
    *   Los registros de `employees` se moverán a nuevos documentos cuyo ID sea el `UID` del usuario correspondiente (actualmente tienen IDs aleatorios).

### 🛡️ Integridad Garantizada
Al tener una sola colección, es **imposible** tener un "Usuario sin Empleado" o un "Empleado sin Usuario".
*   Crear un empleado **automáticamente** generará su acceso.
*   Borrar un empleado **automáticamente** revocará su acceso.

---

## 4. Estrategia de Migración (Paso a Paso)

Si decidimos proceder, este sería el plan de ejecución seguro:

1.  **Refactorización de Creación (Backend)**:
    *   Modificar `RRHHService.createEmployee`: Ahora, antes de guardar en Firestore, crea el usuario en Firebase Auth, obtiene el `UID` y usa ese UID como ID del documento.
    *   Modificar `RRHHService.updateEmployee`: Sincronizar cambios de email/rol con Firebase Auth.

2.  **Script de Migración de Datos**:
    *   Recorrer todos los `employees` actuales.
    *   Buscar su par en `users` (por email).
    *   Crear un NUEVO documento en `employees` usando el `UID` y copiando todos los datos combinados.
    *   Borrar los documentos antiguos.

3.  **Refactorización del Frontend**:
    *   Actualizar las llamadas a API para que apunten siempre a `employees`.
    *   Eliminar pantallas de "Gestión de Usuarios" (ahora todo se hace desde RRHH).

---

## 5. Análisis de Riesgos y Beneficios

| Aspecto | Análisis |
| :--- | :--- |
| **Simplicidad** | ⭐⭐⭐ **Alta**. Elimina código redundante y la necesidad de sincronizar dos tablas. |
| **Performance** | ⭐⭐⭐ **Mejorada**. Se elimina la necesidad de hacer "Joins" manuales o búsquedas dobles. |
| **Seguridad** | ⭐⭐⭐ **Robusta**. Menor superficie de ataque al tener un solo punto de entrada para altas/bajas. |
| **Esfuerzo** | 🚧 **Medio**. Requiere migración de datos y refactorizar el flujo de alta (`createEmployee`). |

## 6. Conclusión
La unificación es la decisión arquitectónica correcta para una aplicación de gestión empresarial. El modelo actual de doble entidad es propenso a errores (como los duplicados que eliminamos). **Recomiendo proceder con la unificación**, comenzando por la refactorización del Backend y siguiendo con la migración de datos.
