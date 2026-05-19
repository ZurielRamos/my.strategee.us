# TimeInput Component

Componente reutilizable para selección de hora con integración completa con Angular Reactive Forms.

## Características

- Integración con Angular Reactive Forms (ControlValueAccessor)
- Time picker visual con selector de hora y minutos
- Formato HH:MM (24 horas)
- Texto de ayuda opcional
- Indicador de campo requerido
- Estilos consistentes con el sistema de diseño
- Fácil de usar y configurar

## Uso Básico

### Importación

```typescript
import { TimeInputComponent } from '@shared/components/time-input/time-input.component';

@Component({
  // ...
  imports: [TimeInputComponent, ReactiveFormsModule]
})
export class MyComponent {
  form = this.fb.group({
    startTime: ['', Validators.required]
  });
}
```

### Template Simple

```html
<form [formGroup]="form">
  <app-time-input
    formControlName="startTime"
    label="Hora de Inicio"
    [required]="true">
  </app-time-input>
</form>
```

## Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `label` | `string` | `'Hora'` | Etiqueta del campo |
| `placeholder` | `string` | `'HH:MM'` | Texto placeholder |
| `required` | `boolean` | `false` | Indica si el campo es requerido (muestra *) |
| `helperText` | `string` | `undefined` | Texto de ayuda debajo del input |

## Formato de Datos

El componente maneja el tiempo en formato `HH:MM` (24 horas):
- Entrada: String en formato `HH:MM` (ej: "14:30", "09:00")
- Salida: String en formato `HH:MM`

## Ejemplos de Uso

### Ejemplo 1: Hora Simple

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [TimeInputComponent, ReactiveFormsModule]
})
export class ExampleComponent {
  form = this.fb.group({
    meetingTime: ['', Validators.required]
  });
}
```

```html
<app-time-input
  formControlName="meetingTime"
  label="Hora de la Reunión"
  [required]="true">
</app-time-input>
```

### Ejemplo 2: Con Texto de Ayuda

```html
<app-time-input
  formControlName="startTime"
  label="Hora de Inicio"
  [required]="true"
  helperText="Selecciona la hora en formato 24 horas">
</app-time-input>
```

### Ejemplo 3: Rango de Horas (Entrada y Salida)

```typescript
form = this.fb.group({
  exitTime: ['', Validators.required],
  returnTime: ['', Validators.required]
});
```

```html
<div class="time-range">
  <app-time-input
    formControlName="exitTime"
    label="Hora de Salida"
    [required]="true">
  </app-time-input>

  <app-time-input
    formControlName="returnTime"
    label="Hora de Regreso"
    [required]="true">
  </app-time-input>
</div>
```

### Ejemplo 4: Con Validación Personalizada

```typescript
form = this.fb.group({
  startTime: ['', Validators.required],
  endTime: ['', Validators.required]
}, {
  validators: this.timeRangeValidator
});

timeRangeValidator(group: FormGroup) {
  const start = group.get('startTime')?.value;
  const end = group.get('endTime')?.value;
  
  if (start && end) {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    if (startMinutes >= endMinutes) {
      return { invalidTimeRange: true };
    }
  }
  
  return null;
}
```

```html
<app-time-input
  formControlName="startTime"
  label="Hora de Inicio"
  [required]="true">
</app-time-input>

<app-time-input
  formControlName="endTime"
  label="Hora de Fin"
  [required]="true">
</app-time-input>

@if (form.errors?.['invalidTimeRange']) {
  <div class="error-message">
    La hora de fin debe ser posterior a la hora de inicio
  </div>
}
```

### Ejemplo 5: Horario de Trabajo

```typescript
form = this.fb.group({
  mondayStart: ['09:00'],
  mondayEnd: ['18:00'],
  tuesdayStart: ['09:00'],
  tuesdayEnd: ['18:00']
});
```

```html
<h4>Lunes</h4>
<div class="schedule-row">
  <app-time-input
    formControlName="mondayStart"
    label="Entrada">
  </app-time-input>
  
  <app-time-input
    formControlName="mondayEnd"
    label="Salida">
  </app-time-input>
</div>

<h4>Martes</h4>
<div class="schedule-row">
  <app-time-input
    formControlName="tuesdayStart"
    label="Entrada">
  </app-time-input>
  
  <app-time-input
    formControlName="tuesdayEnd"
    label="Salida">
  </app-time-input>
</div>
```

## Integración con Validadores de Angular

```typescript
form = this.fb.group({
  time: [
    '', 
    [
      Validators.required,
      Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    ]
  ]
});
```

```html
<app-time-input
  formControlName="time"
  label="Hora"
  [required]="true">
</app-time-input>

@if (form.get('time')?.invalid && form.get('time')?.touched) {
  <div class="error-message">
    @if (form.get('time')?.errors?.['required']) {
      La hora es requerida
    }
    @if (form.get('time')?.errors?.['pattern']) {
      Formato de hora inválido
    }
  </div>
}
```

## Casos de Uso Comunes

### 1. Permiso por Horas

```html
<app-time-input
  formControlName="exitTime"
  label="Hora de Salida"
  [required]="true">
</app-time-input>

<app-time-input
  formControlName="returnTime"
  label="Hora de Regreso"
  [required]="true">
</app-time-input>
```

### 2. Horario de Reunión

```html
<app-time-input
  formControlName="meetingTime"
  label="Hora de la Reunión"
  [required]="true"
  helperText="La reunión será en formato virtual">
</app-time-input>
```

### 3. Hora de Entrada/Salida

```html
<app-time-input
  formControlName="checkIn"
  label="Hora de Entrada"
  [required]="true">
</app-time-input>

<app-time-input
  formControlName="checkOut"
  label="Hora de Salida"
  [required]="true">
</app-time-input>
```

### 4. Configuración de Horario

```html
<app-time-input
  formControlName="workdayStart"
  label="Inicio de Jornada"
  [required]="true">
</app-time-input>

<app-time-input
  formControlName="workdayEnd"
  label="Fin de Jornada"
  [required]="true">
</app-time-input>
```

## Cálculo de Duración

Ejemplo de cómo calcular la duración entre dos horas:

```typescript
calculateDuration(): string {
  const startTime = this.form.get('startTime')?.value;
  const endTime = this.form.get('endTime')?.value;
  
  if (!startTime || !endTime) return '';
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  if (startMinutes >= endMinutes) return 'Horas inválidas';
  
  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutos`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}
```

```html
<app-time-input
  formControlName="startTime"
  label="Hora de Inicio"
  [required]="true">
</app-time-input>

<app-time-input
  formControlName="endTime"
  label="Hora de Fin"
  [required]="true">
</app-time-input>

@if (calculateDuration()) {
  <div class="duration-info">
    <ion-icon name="time-outline"></ion-icon>
    <span>Duración: {{ calculateDuration() }}</span>
  </div>
}
```

## Estilos

El componente utiliza las variables CSS del sistema de diseño:

- `--app-hover-bg`: Fondo del input
- `--app-card-bg`: Fondo en focus
- `--app-text-primary`: Color del texto
- `--app-text-secondary`: Color del placeholder y texto de ayuda

### Estados Visuales

- **Normal**: Fondo gris claro
- **Focus**: Borde de 2px del color primario
- **Disabled**: Opacidad reducida
- **Required**: Asterisco rojo junto a la etiqueta

## Accesibilidad

- Etiquetas asociadas correctamente con los campos
- Soporte para lectores de pantalla
- Indicadores visuales claros para campos requeridos
- Navegación por teclado

## Migración desde ion-input type="time"

### Antes:
```html
<ion-item lines="none">
  <ion-label position="stacked">Hora *</ion-label>
  <ion-input 
    type="time" 
    formControlName="time">
  </ion-input>
</ion-item>
```

### Después:
```html
<app-time-input
  formControlName="time"
  label="Hora"
  [required]="true">
</app-time-input>
```

## Migración desde TimePickerComponent Manual

### Antes:
```html
<ion-item lines="none" button (click)="showTimePicker = true">
  <ion-label position="stacked">Hora *</ion-label>
  <ion-input
    readonly
    [value]="timeControl?.value || ''"
    placeholder="HH:MM">
  </ion-input>
  <ion-icon name="time-outline" slot="end"></ion-icon>
</ion-item>

<app-time-picker
  [isOpen]="showTimePicker"
  [value]="timeControl?.value"
  (timeSelected)="onTimeChange($event)"
  (dismissed)="showTimePicker = false">
</app-time-picker>
```

### Después:
```html
<app-time-input
  formControlName="time"
  label="Hora"
  [required]="true">
</app-time-input>
```

## Notas

- El componente maneja automáticamente la sincronización con el FormControl
- El formato es siempre HH:MM en 24 horas
- El time picker se muestra como un modal/overlay
- El componente es completamente responsive
- Compatible con todos los validadores de Angular Forms

## Beneficios

1. **Código más limpio**: Menos líneas de HTML y TypeScript
2. **Consistencia**: Mismo estilo en toda la aplicación
3. **Facilidad de uso**: No necesitas manejar el estado del picker manualmente
4. **Mantenibilidad**: Cambios centralizados
5. **Reutilización**: Un componente para todos los casos de uso de hora
