# Cambios en Frontend - Migración Días Energyze

## Resumen

El beneficio "Sábado Energyze" ha sido migrado de un sistema de cupos mensuales a un sistema acumulable. Este documento describe los cambios necesarios en el frontend.

## Cambios Realizados

### 1. Modelos Actualizados

#### `app/src/app/admin/employees/models/benefit-allocation.model.ts`
- Eliminado `ENERGIZE_SATURDAY` del enum `BenefitType`
- Eliminado del objeto `BENEFIT_TYPE_LABELS`

#### `app/src/app/employee/requests/models/request.model.ts`
- Agregados nuevos tipos de solicitud:
  - `ENERGYZE_DAY_ACCUMULATION`
  - `ENERGYZE_DAY_USAGE`

#### `app/src/app/shared/models/energyze-days.model.ts` (NUEVO)
- Interfaces para el sistema de días Energyze:
  - `EnergyzeDaysBalance`
  - `EnergyzeDaysTransactionType`
  - `EnergyzeDaysLedgerEntry`
  - `EnergyzeDayAccumulationDetails`
  - `EnergyzeDayUsageDetails`

### 2. Componentes Actualizados

#### `app/src/app/employee/requests/new-request/new-request.page.ts`
- Eliminado `ENERGIZE_SATURDAY` del objeto `benefitIcons`
- Eliminado case `BenefitType.ENERGIZE_SATURDAY` del switch en `requestBenefit()`

## Cambios Pendientes (TODO)

### 1. ~~Crear Servicio de Energyze Days~~ ✅ COMPLETADO

~~Crear `app/src/app/shared/services/energyze-days.service.ts`~~

**IMPLEMENTADO:** El servicio ya está creado en `app/src/app/shared/services/energyze-days.service.ts` con los métodos:
- `getMyBalance()` - Obtener balance del empleado actual
- `getEmployeeBalance(employeeId)` - Obtener balance de cualquier empleado (Admin)
- `adjustBalance(employeeId, days, note)` - Ajuste manual (Admin)

### 2. ~~Agregar Card en Dashboard~~ ✅ COMPLETADO

**IMPLEMENTADO:** Se agregó la card de Días Energyze en el dashboard del empleado (`app/src/app/employee/dashboard/`) mostrando:
- Balance total de días
- Días disponibles
- Días en solicitudes pendientes
- Icono de rayo (flash-outline)
- Estilos consistentes con las otras cards

### 3. Crear Componentes de Solicitud

#### Modal de Acumulación
`app/src/app/employee/requests/modals/request-energyze-accumulation-modal/`

Formulario con:
- Selector de fecha (fecha del evento)
- Campo de razón (textarea)
- Validación: solo 1 día, fecha no mayor a 3 meses atrás

#### Modal de Uso
`app/src/app/employee/requests/modals/request-energyze-usage-modal/`

Formulario con:
- Selector de fecha (solo sábados)
- Campo de razón (textarea)
- Mostrar balance disponible
- Validación: fecha debe ser sábado, tener saldo disponible

### 3. Actualizar Página de Nueva Solicitud

En `new-request.page.ts`:

1. Importar el servicio:
```typescript
import { EnergyzeDaysService } from '../../../shared/services/energyze-days.service';
```

2. Agregar propiedad para el balance:
```typescript
energyzeBalance: EnergyzeDaysBalance | null = null;
isLoadingEnergyzeDays = false;
```

3. Inyectar el servicio en el constructor:
```typescript
constructor(
  // ... otros servicios
  private energyzeDaysService: EnergyzeDaysService
) {}
```

4. Cargar balance en `ngOnInit()`:
```typescript
loadEnergyzeDaysBalance() {
  this.isLoadingEnergyzeDays = true;
  
  this.energyzeDaysService.getMyBalance().subscribe({
    next: (balance) => {
      this.energyzeBalance = balance;
      this.isLoadingEnergyzeDays = false;
    },
    error: (error) => {
      console.error('Error loading energyze days balance:', error);
      this.isLoadingEnergyzeDays = false;
    }
  });
}
```

5. Agregar cards para las nuevas solicitudes en el template:
```html
<!-- Acumulación de Días Energyze -->
<app-card-button
  icon="flash-outline"
  title="Acumular Día Energyze"
  subtitle="Registrar trabajo en sábado"
  (click)="openEnergyzeDayAccumulationModal()"
></app-card-button>

<!-- Uso de Días Energyze -->
<app-card-button
  icon="flash-outline"
  title="Usar Día Energyze"
  [subtitle]="'Disponibles: ' + (energyzeBalance?.availableDays || 0) + ' días'"
  [disabled]="!energyzeBalance || energyzeBalance.availableDays <= 0"
  (click)="openEnergyzeDayUsageModal()"
></app-card-button>
```

6. Implementar métodos para abrir modales:
```typescript
async openEnergyzeDayAccumulationModal() {
  const modal = await this.modalCtrl.create({
    component: RequestEnergyzeDayAccumulationModalComponent,
    cssClass: 'request-modal'
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();
  if (data?.success) {
    const timestamp = new Date().getTime();
    this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
  }
}

async openEnergyzeDayUsageModal() {
  if (!this.energyzeBalance || this.energyzeBalance.availableDays <= 0) {
    return;
  }

  const modal = await this.modalCtrl.create({
    component: RequestEnergyzeDayUsageModalComponent,
    componentProps: {
      balance: this.energyzeBalance
    },
    cssClass: 'request-modal'
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();
  if (data?.success) {
    const timestamp = new Date().getTime();
    this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
  }
}
```

### 4. Actualizar Vista de Solicitudes

En `app/src/app/employee/requests/requests.page.ts`:

Agregar manejo de los nuevos tipos de solicitud en el método que muestra los detalles:
```typescript
getRequestTypeLabel(type: RequestType): string {
  const labels = {
    // ... otros tipos
    [RequestType.ENERGYZE_DAY_ACCUMULATION]: 'Acumulación Día Energyze',
    [RequestType.ENERGYZE_DAY_USAGE]: 'Uso Día Energyze',
  };
  return labels[type] || type;
}
```

### 5. Panel de Administración

Crear componente para que los administradores puedan:
- Ver balance de días Energyze de cualquier empleado
- Hacer ajustes manuales
- Ver historial de transacciones

Ubicación sugerida: `app/src/app/admin/energyze-days/`

### 6. Eliminar Componentes Obsoletos

Una vez implementado el nuevo sistema, eliminar:
- `RequestEnergyzeSaturdayModalComponent` (si existe)
- Cualquier referencia al beneficio ENERGIZE_SATURDAY en otros componentes

## Notas Importantes

1. El nuevo sistema NO usa cupos mensuales, los días se acumulan indefinidamente
2. Solo se pueden acumular y usar días completos (no fracciones)
3. Los días solo pueden ser usados en sábados
4. El balance se calcula automáticamente considerando solicitudes pendientes
5. Los administradores pueden hacer ajustes manuales si es necesario

## Testing

Asegurarse de probar:
1. Creación de solicitud de acumulación
2. Creación de solicitud de uso
3. Validación de sábados en solicitud de uso
4. Validación de saldo suficiente
5. Actualización del balance después de aprobar/rechazar solicitudes
6. Ajustes manuales por administradores
