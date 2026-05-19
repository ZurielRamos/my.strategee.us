# Migración: Sábado Energyze a Sistema Acumulable

## Resumen del Cambio

El beneficio "Sábado Energyze" ha sido migrado de un sistema de cupos mensuales (`benefit_allocation`) a un sistema acumulable de días similar al de tiempo compensado.

## Cambios Realizados

### 1. Backend - Nueva Estructura

#### Entidad: `EnergyzeDaysLedger`
- Tabla: `energyze_days_ledger`
- Campos:
  - `id`: Identificador único
  - `employee_id`: Empleado
  - `type`: Tipo de transacción (ACUMULACION, DISFRUTE, AJUSTE, VENCIMIENTO)
  - `days`: Cantidad de días (positivo para acumulación, negativo para uso)
  - `request_id`: Referencia a la solicitud
  - `note`: Nota o comentario
  - `created_at`: Fecha de creación

#### Módulo: `EnergyzeDaysModule`
- Servicio: `EnergyzeDaysService`
- Controlador: `EnergyzeDaysController`
- Endpoints:
  - `GET /energyze-days/my-balance` - Consultar mi balance (Empleado)
  - `GET /energyze-days/balance/:employeeId` - Consultar balance de cualquier empleado (Admin)
  - `POST /energyze-days/adjust` - Ajuste manual (Admin)

### 2. Tipos de Solicitud

Se agregaron dos nuevos tipos de solicitud:

#### `ENERGYZE_DAY_ACCUMULATION`
- Permite solicitar la acumulación de 1 día Energyze
- Validaciones:
  - Solo se puede acumular 1 día por solicitud
  - La fecha del evento no puede ser mayor a 3 meses atrás
  - La fecha del evento no puede ser mayor a 1 mes en el futuro
- Detalles requeridos:
  - `date`: Fecha del evento (YYYY-MM-DD)
  - `days`: Siempre 1
  - `reason`: Razón de la acumulación

#### `ENERGYZE_DAY_USAGE`
- Permite solicitar el disfrute de 1 día Energyze
- Validaciones:
  - La fecha debe ser un sábado
  - Solo se puede usar 1 día por solicitud
  - La fecha no puede ser mayor a 1 mes atrás
  - La fecha no puede ser mayor a 3 meses en el futuro
  - Debe tener saldo suficiente
- Detalles requeridos:
  - `date`: Fecha del sábado (YYYY-MM-DD)
  - `reason`: Razón del disfrute

### 3. Eliminación del Beneficio Anterior

- Se eliminó `ENERGIZE_SATURDAY` del enum `BenefitType`
- Se eliminaron todas las asignaciones existentes de `SABADO ENERGYZE` en `benefit_allocations`

### 4. Migraciones

#### `1773700000000-CreateEnergyzeDaysLedgerTable.ts`
Crea la tabla `energyze_days_ledger` con:
- Índice en `employee_id`
- Foreign key a `employees` (CASCADE)
- Foreign key a `requests` (SET NULL)

#### `1773700000001-RemoveEnergyzeSaturdayBenefitAllocations.ts`
Elimina todas las asignaciones de `SABADO ENERGYZE`

## Flujo de Uso

### Para Empleados

1. **Acumular días Energyze:**
   - Crear solicitud tipo `ENERGYZE_DAY_ACCUMULATION`
   - Especificar fecha del evento y razón
   - Esperar aprobación de Admin/RRHH
   - Al aprobar, se suma 1 día al balance

2. **Usar días Energyze:**
   - Consultar balance disponible: `GET /energyze-days/my-balance`
   - Crear solicitud tipo `ENERGYZE_DAY_USAGE`
   - Especificar fecha del sábado y razón
   - Esperar aprobación de Admin/RRHH
   - Al aprobar, se resta 1 día del balance

### Para Administradores

1. **Consultar balance de empleado:**
   ```
   GET /energyze-days/balance/:employeeId
   ```

2. **Ajuste manual:**
   ```
   POST /energyze-days/adjust
   {
     "employeeId": "EMP001",
     "days": 2,  // positivo para sumar, negativo para restar
     "note": "Ajuste por corrección"
   }
   ```

3. **Aprobar/Rechazar solicitudes:**
   - Las solicitudes de acumulación y uso se manejan igual que otras solicitudes
   - Al aprobar, se registra automáticamente en el ledger

## Balance de Días

El balance se calcula como:
- `totalDays` = Suma de todas las transacciones en el ledger
- `pendingDays` = Días en solicitudes de uso pendientes
- `availableDays` = totalDays - pendingDays

## Consideraciones

1. **No hay cupos mensuales:** Los días se acumulan sin límite de tiempo (hasta que se implemente vencimiento)
2. **Solo días completos:** A diferencia del tiempo compensado (que maneja horas), Energyze Days solo maneja días completos
3. **Solo sábados:** Los días solo pueden ser usados en sábados
4. **Historial completo:** Todas las transacciones quedan registradas en el ledger para auditoría

## Próximos Pasos (Opcional)

- Implementar política de vencimiento de días acumulados
- Agregar reportes de uso de días Energyze
- Notificaciones cuando se acumulan o usan días
