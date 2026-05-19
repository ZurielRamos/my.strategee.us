# ShiftSelectorComponent

Componente reutilizable para seleccionar turnos (mañana/tarde u otras opciones) con botones visuales.

## Características

- Implementa `ControlValueAccessor` para integración con Angular Forms
- Botones visuales con iconos
- Opciones personalizables
- Soporte para modo readonly y disabled
- Validación integrada con formularios reactivos
- Estilos consistentes con el sistema de diseño

## Uso Básico

```typescript
import { ShiftSelectorComponent, ShiftOption } from '@shared/components/shift-selector/shift-selector.component';

@Component({
  imports: [ShiftSelectorComponent, ReactiveFormsModule]
})
export class MyComponent {
  form = this.fb.group({
    shift: ['', Validators.required]
  });

  shiftOptions: ShiftOption[] = [
    { value: 'MANANA', label: 'Mañana', icon: 'time-outline' },
    { value: 'TARDE', label: 'Tarde', icon: 'time-outline' }
  ];
}
```

```html
<form [formGroup]="form">
  <app-shift-selector
    formControlName="shift"
    label="Turno"
    [options]="shiftOptions"
    [required]="true">
  </app-shift-selector>
</form>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | `'Turno'` | Etiqueta del campo |
| `required` | `boolean` | `false` | Muestra asterisco de campo requerido |
| `options` | `ShiftOption[]` | `[{value: 'MANANA', label: 'Mañana'}, {value: 'TARDE', label: 'Tarde'}]` | Opciones disponibles |
| `readonly` | `boolean` | `false` | Modo solo lectura |

## Interfaz ShiftOption

```typescript
interface ShiftOption {
  value: string;      // Valor que se guarda en el formulario
  label: string;      // Texto que se muestra al usuario
  icon?: string;      // Icono de Ionicons (opcional, default: 'time-outline')
}
```

## Ejemplos

### Turnos de Trabajo

```typescript
shiftOptions: ShiftOption[] = [
  { value: 'MORNING', label: 'Mañana', icon: 'sunny-outline' },
  { value: 'AFTERNOON', label: 'Tarde', icon: 'partly-sunny-outline' },
  { value: 'NIGHT', label: 'Noche', icon: 'moon-outline' }
];
```

```html
<app-shift-selector
  formControlName="workShift"
  label="Turno de Trabajo"
  [options]="shiftOptions"
  [required]="true">
</app-shift-selector>
```

### Horario de Clases

```typescript
classTimeOptions: ShiftOption[] = [
  { value: 'AM', label: 'Matutino', icon: 'time-outline' },
  { value: 'PM', label: 'Vespertino', icon: 'time-outline' },
  { value: 'NIGHT', label: 'Nocturno', icon: 'moon-outline' }
];
```

```html
<app-shift-selector
  formControlName="classTime"
  label="Horario"
  [options]="classTimeOptions">
</app-shift-selector>
```

### Modo Solo Lectura

```html
<app-shift-selector
  formControlName="shift"
  label="Turno Asignado"
  [options]="shiftOptions"
  [readonly]="true">
</app-shift-selector>
```

### Con Validación

```typescript
form = this.fb.group({
  shift: ['', Validators.required]
});

get shiftControl() {
  return this.form.get('shift');
}
```

```html
<app-shift-selector
  formControlName="shift"
  label="Turno"
  [options]="shiftOptions"
  [required]="true">
</app-shift-selector>

@if (shiftControl?.invalid && shiftControl?.touched) {
  <div class="error-message">
    El turno es requerido
  </div>
}
```

## Integración con Formularios

El componente emite el `value` de la opción seleccionada como string:

```typescript
// Valor del formulario
{
  shift: 'MANANA'  // string
}
```

## Estilos

El componente usa variables CSS del sistema de diseño:

- `--app-text-primary`: Color del texto del label
- `--app-text-secondary`: Color del texto de opciones no seleccionadas
- `--ion-color-primary`: Color de la opción seleccionada
- `--ion-color-light`: Color de fondo de opciones no seleccionadas
- `--app-hover-bg`: Color de hover

## Accesibilidad

- Botones nativos con semántica correcta
- Labels asociados correctamente
- Estados disabled y readonly manejados apropiadamente
- Indicador visual de campo requerido
