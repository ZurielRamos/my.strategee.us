# DateInput Component

Componente reutilizable para selección de fechas que soporta tanto fecha única como rango de fechas.

## Características

- Modo de fecha única o rango de fechas
- Integración con Angular Reactive Forms (ControlValueAccessor)
- Validación personalizada de fechas
- Restricción de días de la semana
- Fechas mínimas y máximas configurables
- Formato de fecha en español (dd/mm/yyyy)
- Interfaz consistente con el sistema de diseño

## Uso Básico

### Fecha Única

```typescript
import { DateInputComponent, DateValue } from '@shared/components/date-input/date-input.component';

@Component({
  // ...
  imports: [DateInputComponent, ReactiveFormsModule]
})
export class MyComponent {
  form = this.fb.group({
    birthDate: [null, Validators.required]
  });

  onDateChange(value: DateValue) {
    console.log('Fecha seleccionada:', value.startDate);
  }
}
```

```html
<form [formGroup]="form">
  <app-date-input
    formControlName="birthDate"
    label="Fecha de Nacimiento"
    placeholder="Selecciona una fecha"
    mode="single"
    [required]="true"
    (dateChange)="onDateChange($event)">
  </app-date-input>
</form>
```

### Rango de Fechas

```typescript
import { DateInputComponent, DateValue } from '@shared/components/date-input/date-input.component';

@Component({
  // ...
  imports: [DateInputComponent, ReactiveFormsModule]
})
export class MyComponent {
  minDate = new Date();
  maxDate = new Date();

  form = this.fb.group({
    vacationPeriod: [null, Validators.required]
  });

  constructor() {
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
  }

  onDateChange(value: DateValue) {
    console.log('Rango:', value.startDate, 'al', value.endDate);
  }
}
```

```html
<form [formGroup]="form">
  <app-date-input
    formControlName="vacationPeriod"
    label="Período de Vacaciones"
    placeholder="dd/mm/yyyy al dd/mm/yyyy"
    mode="range"
    [required]="true"
    [minDate]="minDate"
    [maxDate]="maxDate"
    [disabledDaysOfWeek]="[0]"
    (dateChange)="onDateChange($event)">
  </app-date-input>
</form>
```

## Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `label` | `string` | `'Fecha'` | Etiqueta del campo |
| `placeholder` | `string` | `'Selecciona una fecha'` | Texto placeholder |
| `mode` | `'single' \| 'range'` | `'single'` | Modo de selección |
| `required` | `boolean` | `false` | Indica si el campo es requerido |
| `minDate` | `Date` | `undefined` | Fecha mínima seleccionable |
| `maxDate` | `Date` | `undefined` | Fecha máxima seleccionable |
| `disabledDaysOfWeek` | `number[]` | `undefined` | Días de la semana deshabilitados (0=Domingo, 6=Sábado) |
| `customValidator` | `Function` | `undefined` | Función de validación personalizada |

## Eventos (Outputs)

| Evento | Tipo | Descripción |
|--------|------|-------------|
| `dateChange` | `EventEmitter<DateValue>` | Se emite cuando cambia la fecha seleccionada |

## Tipo DateValue

```typescript
interface DateValue {
  startDate: string | null;  // ISO string
  endDate?: string | null;   // ISO string (solo en modo 'range')
}
```

## Validación Personalizada

Puedes proporcionar una función de validación personalizada para deshabilitar fechas específicas:

```typescript
customValidator = (date: Date, currentSelection?: { start: Date | null; end: Date | null }): boolean => {
  // Retorna true para deshabilitar la fecha, false para habilitarla
  
  // Ejemplo: deshabilitar fechas que excedan una cuota
  if (!currentSelection?.start) return false;
  
  const daysBetween = this.calculateDays(currentSelection.start, date);
  return daysBetween > this.maxDays;
}
```

```html
<app-date-input
  [customValidator]="customValidator"
  ...>
</app-date-input>
```

## Integración con Reactive Forms

El componente implementa `ControlValueAccessor`, por lo que funciona perfectamente con Angular Reactive Forms:

```typescript
// Obtener el valor
const dateValue: DateValue = this.form.get('myDate')?.value;

// Establecer el valor
this.form.patchValue({
  myDate: {
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-05T00:00:00.000Z'
  }
});

// Validación
if (this.form.get('myDate')?.invalid) {
  // Manejar error
}
```

## Ejemplos de Uso

### Fecha de Nacimiento

```html
<app-date-input
  formControlName="birthDate"
  label="Fecha de Nacimiento"
  mode="single"
  [required]="true"
  [maxDate]="today">
</app-date-input>
```

### Período de Vacaciones

```html
<app-date-input
  formControlName="vacationPeriod"
  label="Período de Vacaciones"
  placeholder="dd/mm/yyyy al dd/mm/yyyy"
  mode="range"
  [required]="true"
  [minDate]="today"
  [disabledDaysOfWeek]="[0]"
  [customValidator]="validateVacationQuota">
</app-date-input>
```

### Fecha de Inicio de Contrato

```html
<app-date-input
  formControlName="startDate"
  label="Fecha de Inicio"
  mode="single"
  [required]="true">
</app-date-input>
```

## Estilos

El componente utiliza las variables CSS del sistema de diseño:

- `--app-hover-bg`: Fondo del input
- `--app-card-bg`: Fondo en focus
- `--app-text-primary`: Color del texto
- `--app-text-secondary`: Color del placeholder
- `--app-border`: Color del borde

## Notas

- Las fechas se almacenan en formato ISO string
- El formato de visualización es dd/mm/yyyy
- El componente usa el datepicker avanzado internamente
- Compatible con validadores de Angular Forms
