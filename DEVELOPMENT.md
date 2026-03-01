# 🚀 Guía de Desarrollo - Golden Tower ERP

## 📋 Requisitos Previos

- **Node.js**: >= 18
- **npm**: 11.5.1 (viene con Node.js)
- **Git**: Para control de versiones

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd gestion
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

#### API (Backend)

Copia el archivo de ejemplo y completa con tus credenciales:

```bash
cd apps/api
cp .env.example .env
```

Edita `apps/api/.env` con tus valores reales:

```env
PORT=4001
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=tu-email@proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-app
```

#### Web (Frontend)

```bash
cd apps/web
cp .env.local.example .env.local
```

Edita `apps/web/.env.local` con tu configuración Firebase.

## 🎯 Comandos Principales

### Desarrollo

```bash
# Iniciar TODA la aplicación (API + Web)
npm run dev

# Iniciar con limpieza de puertos (recomendado si hay errores)
npm run dev:clean

# Iniciar solo el API
cd apps/api && npm run dev

# Iniciar solo el Web
cd apps/web && npm run dev
```

### Mantenimiento

```bash
# Limpiar puertos ocupados (3000, 3001, 4001)
npm run kill-ports

# Limpiar build y puertos
npm run clean

# Formatear código
npm run format

# Verificar tipos TypeScript
npm run check-types
```

### Producción

```bash
# Build de toda la aplicación
npm run build

# Iniciar API en producción
cd apps/api && npm run start:prod
```

## 🏗️ Arquitectura del Proyecto

```
gestion/
├── apps/
│   ├── api/          → Backend NestJS (Puerto 4001)
│   ├── web/          → Frontend Next.js (Puerto 3000)
│   └── docs/         → Documentación
├── packages/
│   └── @erp/shared   → Código compartido
├── package.json      → Workspace raíz
└── turbo.json        → Configuración Turborepo
```

## 🌐 Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| **API** | 4001 | http://localhost:4001 |
| **Web** | 3000 | http://localhost:3000 |

### Health Checks (API)

Una vez iniciado el servidor API, puedes verificar su estado:

```bash
# Estado general
curl http://localhost:4001/health

# Estado de Firebase
curl http://localhost:4001/health/firebase

# Métricas detalladas
curl http://localhost:4001/health/detailed
```

## 🔍 Troubleshooting

### Error: "Puerto ya en uso"

```bash
# Solución rápida
npm run kill-ports

# O manualmente en PowerShell
netstat -ano | findstr ":4001"
taskkill /PID <PID> /F
```

### Error: "Firebase initialization failed"

1. Verifica que todas las variables de Firebase estén en `.env`
2. Asegúrate de que `FIREBASE_PRIVATE_KEY` incluya `-----BEGIN PRIVATE KEY-----`
3. Verifica los logs de inicio para más detalles

### Error: "SMTP connection failed"

1. Si usas Gmail, genera una "Contraseña de aplicación" desde tu cuenta Google
2. Verifica que `SMTP_USER` y `SMTP_PASS` sean correctos
3. Prueba la conexión con: (endpoint disponible en próxima versión)

### Múltiples procesos Node.js

Si ves demasiados procesos Node.js ejecutándose:

```powershell
# Ver procesos Node.js activos
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Select-Object ProcessName, Id, WorkingSet

# Limpiar todo
npm run kill-ports
```

### Arranque lento

El primer arranque puede demorar más debido a:
- Compilación de TypeScript
- Inicialización de Firebase (~200-500ms)
- Next.js analizando rutas

**Tiempos esperados**:
- API: 500-1200ms
- Web: 800-1500ms

Los logs de arranque muestran métricas detalladas:
```
⏱️  Tiempo total de arranque: 892ms
   ├─ Creación NestJS: 412ms
   ├─ Middleware: 8ms
   └─ Listen: 12ms
```

## 📦 Estructura de Módulos del API

- **ConfigModule**: Variables de entorno globales
- **FirebaseModule**: Conexión a Firebase Admin SDK
- **HealthModule**: Endpoints de monitoreo
- **MailModule**: Envío de correos (SMTP)
- **UsersModule**: Gestión de usuarios
- **ProjectsModule**: Gestión de proyectos
- **RRHHModule**: Recursos humanos
- **ActivitiesModule**: Actividades del proyecto
- **ProgressLogsModule**: Logs de progreso
- **StatsModule**: Estadísticas
- **FinanceModule**: Gestión financiera
- **MaterialsModule**: Gestión de materiales
- **MaterialRequestsModule**: Solicitudes de materiales

## 🧪 Testing

```bash
# Ejecutar tests (API)
cd apps/api && npm run test

# Tests con cobertura
cd apps/api && npm run test:cov

# Tests en modo watch
cd apps/api && npm run test:watch
```

## 📝 Mejores Prácticas

### Variables de Entorno

- ✅ **NUNCA** commitear archivos `.env` con credenciales reales
- ✅ **SIEMPRE** usar `.env.example` para documentar variables requeridas
- ✅ Rotar credenciales periódicamente
- ✅ Usar variables de entorno en producción (no archivos .env)

### Control de Procesos

- ✅ Usar `npm run kill-ports` antes de iniciar si hay errores
- ✅ Cerrar servidores con `Ctrl+C` en lugar de cerrar la terminal
- ✅ Revisar health checks después de iniciar

### Desarrollo

- ✅ Ejecutar `npm run format` antes de commits
- ✅ Revisar logs de arranque para detectar problemas temprano
- ✅ Usar `npm run dev:clean` si hay comportamientos extraños

## 🔗 Enlaces Útiles

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## 🆘 Soporte

Si encuentras problemas no documentados aquí:

1. Revisa los logs de arranque para errores específicos
2. Verifica que todas las variables de entorno estén configuradas
3. Intenta limpiar puertos con `npm run kill-ports`
4. Verifica el estado con los health checks

---

**Última actualización**: 2026-02-16  
**Versión**: 1.0.0
