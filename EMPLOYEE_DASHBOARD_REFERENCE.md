# Dashboard del Empleado - Referencia Rápida

## Descripción General

El dashboard del empleado muestra un resumen visual de los beneficios asignados y las compensaciones activas del empleado autenticado.

## Estructura del Dashboard

### 1. Tarjetas de Resumen

#### Compensación Total Mensual
- Muestra la suma total de todas las compensaciones activas
- Calcula el valor actual (currentValue) o el monto base (amount)
- Color: Verde (#bcf36a)
- Icono: cash-outline

#### Beneficios Activos
- Muestra el número total de beneficios asignados al empleado
- Color: Azul (#6a9cf3)
- Icono: gift-outline

### 2. Listas Detalladas

#### Mis Solicitudes
- Lista las últimas 6 solicitudes del empleado
- Información mostrada:
  - Tipo de solicitud (Vacaciones, Beneficio, Permiso, etc.)
  - Estado con chip de color (Pendiente, Aprobada, Rechazada, Cancelada)
  - Fecha de creación en formato relativo (Hoy, Ayer, Hace X días)
- Scroll vertical si hay muchas solicitudes
- Ordenadas por fecha de creación (más recientes primero)

#### Mis Beneficios
- Lista todos los beneficios asignados al empleado
- **Card especial de Días Energyze**: Aparece como primera card con diseño destacado
  - Borde color terciario
  - Gradiente de fondo sutil
  - Muestra solo días disponibles (sin separador de cuota)
  - Estado de carga independiente
- Información mostrada en otras cards de beneficios:
  - Tipo de beneficio (Sábado Remoto, Workcation, etc.)
  - Cuota mensual en días (disponibles/total)
  - Icono visual para cada beneficio
- Scroll vertical si hay muchos beneficios

## Servicios Utilizados

### AuthService
- `getCurrentUser()`: Obtiene el usuario autenticado actual
- Extrae el `employeeId` del usuario para cargar sus datos

### BenefitsService
- `getBenefitBalances()`: Obtiene todos los beneficios asignados con sus balances

### RequestsService
- `getMyRequests(filters)`: Obtiene las solicitudes del empleado con filtros opcionales
- Filtros utilizados: `limit: 6`, `page: 1`, `sortBy: 'createdAt'`, `order: 'DESC'`

## Estados de Carga

- Spinners mientras se cargan los datos
- Estados vacíos con iconos y mensajes cuando no hay datos
- Manejo de errores en consola
- Validación de employeeId antes de cargar datos

## Integración con Autenticación

✅ **IMPLEMENTADO**: El dashboard ahora obtiene automáticamente el `employeeId` del usuario autenticado desde el `AuthService`.

- Al iniciar (`ngOnInit`), se obtiene el usuario actual del storage
- Se extrae el `employeeId` del objeto `AuthUser`
- Solo se cargan los datos si existe un `employeeId` válido
- Si no hay `employeeId`, se muestra un error en consola y se detiene la carga

## Cambios Recientes

### Reemplazo de Card de Compensaciones por Solicitudes
✅ **IMPLEMENTADO**: La card de "Mis Compensaciones" fue reemplazada por "Mis Solicitudes"

- Muestra las últimas 6 solicitudes del empleado
- Incluye tipo de solicitud, estado con color y fecha relativa
- Estados con colores: Pendiente (warning), Aprobada (success), Rechazada (danger), Cancelada (medium)
- Formato de fecha inteligente: "Hoy", "Ayer", "Hace X días", o fecha completa
- Card reducida y optimizada para mostrar información esencial

## Pendientes

### Próximos Pasos:
1. ~~Integrar con el servicio de autenticación para obtener el ID del empleado actual~~ ✅ Completado
2. ~~Reemplazar card de compensaciones por solicitudes~~ ✅ Completado
3. Implementar navegación a vista detallada de solicitudes
4. Agregar filtros por fecha o estado en solicitudes
5. Implementar actualización en tiempo real

## Archivos Modificados

- `app/src/app/employee/dashboard/dashboard.page.ts`
- `app/src/app/employee/dashboard/dashboard.page.html`
- `app/src/app/employee/dashboard/dashboard.page.scss`

## Diseño Responsivo

- Grid adaptativo: 4 columnas en desktop, 3 en tablet, 2 en móvil, 1 en móvil pequeño
- Tarjetas con altura automática en móvil
- Listas con scroll vertical para contenido extenso
