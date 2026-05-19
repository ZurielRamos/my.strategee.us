# Módulo de Solicitudes del Empleado - Referencia Rápida

## Descripción General

El módulo de solicitudes permite a los empleados ver sus beneficios asignados y crear solicitudes para utilizarlos. Cada beneficio se muestra como una tarjeta con un botón de solicitud.

## Estructura del Módulo

### Vista Principal (requests.page)

La página muestra una cuadrícula de tarjetas, una por cada beneficio asignado al empleado.

#### Elementos de cada Tarjeta de Beneficio:

1. **Icono del Beneficio**
   - Icono visual distintivo según el tipo de beneficio
   - Fondo con gradiente verde (primary color)
   - Tamaño: 64x64px

2. **Información del Beneficio**
   - Nombre del beneficio (ej: "Sábado Remoto", "Workcation")
   - Cuota mensual disponible (ej: "5 días/mes disponibles")

3. **Botón de Solicitud**
   - Botón "Solicitar" con estilo primary
   - Al hacer clic, ejecuta `requestBenefit(benefit)`

### Mapeo de Iconos por Tipo de Beneficio

| Tipo de Beneficio | Icono |
|-------------------|-------|
| Sábado Remoto | home-outline |
| Workcation | airplane-outline |
| Home Office | laptop-outline |
| Sábado Energyze | flash-outline |
| Sábado Descanso IDO | bed-outline |
| Cumpleaños | cafe-outline |

## Servicios Utilizados

### AuthService
- `getCurrentUser()`: Obtiene el usuario autenticado
- Extrae el `employeeId` para cargar beneficios

### BenefitsService
- `getAllocationsByEmployee(employeeId)`: Obtiene todos los beneficios asignados al empleado

## Estados de la Vista

### Estado de Carga
- Muestra un spinner mientras se cargan los beneficios
- Mensaje: "Cargando beneficios..."

### Estado Vacío
- Se muestra cuando el empleado no tiene beneficios asignados
- Icono: gift-outline
- Mensaje: "No tienes beneficios asignados"
- Submensaje: "Contacta con Recursos Humanos para más información"

### Estado con Datos
- Grid responsivo de tarjetas de beneficios
- Hover effects en las tarjetas
- Animación de elevación al pasar el mouse

## Navegación

### Menú del Empleado
- Título: "Solicitudes"
- Icono: document-text
- URL: `/employee/requests`
- Posición: Segunda opción en el menú (después de Dashboard)

## Diseño Responsivo

### Grid de Beneficios
- Desktop: Columnas automáticas con mínimo 300px
- Móvil: 1 columna
- Gap: 24px (desktop), 16px (móvil)

### Tarjetas
- Padding: 28px
- Border radius: 20px
- Hover: Elevación y borde primary
- Transición suave en todas las interacciones

## Pendientes

### Próximos Pasos:
1. Implementar modal o página de creación de solicitud
2. Integrar con el servicio de requests del backend
3. Agregar validación de cuotas disponibles
4. Mostrar historial de solicitudes del empleado
5. Implementar notificaciones de estado de solicitudes

## Integración con Backend

### Endpoint a Utilizar (Pendiente)
- `POST /requests` - Crear nueva solicitud
- Body: `{ type: 'BENEFIT', details: { benefitType, startDate, endDate, ... } }`

### Tipos de Request
- `BENEFIT`: Solicitud de beneficio
- Otros tipos disponibles: VACATION, DOCUMENT, MEETING, etc.

## Archivos Creados

- `app/src/app/employee/requests/requests.page.ts`
- `app/src/app/employee/requests/requests.page.html`
- `app/src/app/employee/requests/requests.page.scss`

## Archivos Modificados

- `app/src/app/employee/employee.routes.ts` - Agregada ruta `/requests`
- `app/src/app/employee/layout/employee-layout.component.ts` - Agregado enlace en menú

## Notas de Implementación

- El método `requestBenefit()` actualmente solo hace console.log
- Se necesita crear un modal o componente para el formulario de solicitud
- El formulario debe capturar: fecha de inicio, fecha de fin, comentarios opcionales
- Validar que el empleado tenga cuota disponible antes de permitir la solicitud
