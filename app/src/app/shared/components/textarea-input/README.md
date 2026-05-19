# TextareaInput Component

Componente reutilizable para áreas de texto (textarea) con integración completa con Angular Reactive Forms.

## Características

- Integración con Angular Reactive Forms (ControlValueAccessor)
- Contador de caracteres opcional
- Límite de caracteres configurable
- Texto de ayuda opcional
- Modo de solo lectura
- Indicador de campo requerido
- Alertas visuales cuando se acerca al límite de caracteres
- Estilos consistentes con el sistema de diseño

## Uso Básico

### Importación

```typescript
import { TextareaInputComponent } from '@shared/components/textarea-input/textarea-input.component';

@Component({
  // ...
  imports: [TextareaInputComponent, ReactiveFormsModule]
})
export class MyComponent {
  form = this.fb.group({
    description: ['', Validators.required]
  });
}
```

### Template Simple

```html
<form [formGroup]="form">
  <app-textarea-input
    formControlName="description"
    label="Descripción"
    placeholder="Escribe una descripción..."
    [required]="true">
  </app-textarea-input>
</form>
```

## Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Etiqueta del campo |
| `placeholder` | `string` | `''` | Texto placeholder |
| `required` | `boolean` | `false` | Indica si el campo es requerido (muestra *) |
| `rows` | `number` | `3` | Número de filas visibles |
| `maxlength` | `number` | `undefined` | Límite máximo de caracteres |
| `showCharCounter` | `boolean` | `false` | Muestra contador de caracteres |
| `helperText` | `string` | `undefined` | Texto de ayuda debajo del textarea |
| `readonly` | `boolean` | `false` | Modo de solo lectura |

## Ejemplos de Uso

### Ejemplo 1: Textarea Básico

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [TextareaInputComponent, ReactiveFormsModule]
})
export class ExampleComponent {
  form = this.fb.group({
    notes: ['']
  });
}
```

```html
<app-textarea-input
  formControlName="notes"
  label="Notas"
  placeholder="Agrega tus notas aquí...">
</app-textarea-input>
```

### Ejemplo 2: Con Límite de Caracteres y Contador

```typescript
form = this.fb.group({
  reason: ['', [Validators.required, Validators.maxLength(500)]]
});
```

```html
<app-textarea-input
  formControlName="reason"
  label="Razón del Cambio"
  placeholder="Describe el motivo..."
  [required]="true"
  [rows]="4"
  [maxlength]="500"
  [showCharCounter]="true">
</app-textarea-input>
```

### Ejemplo 3: Con Texto de Ayuda

```html
<app-textarea-input
  formControlName="comments"
  label="Comentarios"
  placeholder="Agrega comentarios adicionales..."
  [rows]="3"
  helperText="Este campo es opcional. Máximo 200 caracteres."
  [maxlength]="200"
  [showCharCounter]="true">
</app-textarea-input>
```

### Ejemplo 4: Solo Lectura

```html
<app-textarea-input
  formControlName="description"
  label="Descripción"
  [readonly]="true"
  [rows]="5">
</app-textarea-input>
```

### Ejemplo 5: Textarea Grande para Descripciones Largas

```html
<app-textarea-input
  formControlName="detailedDescription"
  label="Descripción Detallada"
  placeholder="Proporciona una descripción completa..."
  [rows]="8"
  [maxlength]="1000"
  [showCharCounter]="true">
</app-textarea-input>
```

## Contador de Caracteres

El contador de caracteres tiene tres estados visuales:

1. **Normal**: Texto gris cuando hay suficientes caracteres disponibles
2. **Cerca del límite**: Texto naranja cuando quedan 50 caracteres o menos
3. **En el límite**: Texto rojo cuando se alcanza el límite máximo

```html
<app-textarea-input
  formControlName="message"
  label="Mensaje"
  [maxlength]="200"
  [showCharCounter]="true">
</app-textarea-input>
```

## Integración con Validadores de Angular

```typescript
form = this.fb.group({
  description: [
    '', 
    [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(500)
    ]
  ]
});
```

```html
<app-textarea-input
  formControlName="description"
  label="Descripción"
  [required]="true"
  [maxlength]="500"
  [showCharCounter]="true">
</app-textarea-input>

@if (form.get('description')?.invalid && form.get('description')?.touched) {
  <div class="error-message">
    @if (form.get('description')?.errors?.['required']) {
      La descripción es requerida
    }
    @if (form.get('description')?.errors?.['minlength']) {
      Mínimo 10 caracteres
    }
  </div>
}
```

## Casos de Uso Comunes

### 1. Razón de Cambio en Memorandos

```html
<app-textarea-input
  formControlName="reason"
  label="Razón del Cambio"
  placeholder="Ej: Promoción, Ajuste salarial, etc."
  [required]="true"
  [rows]="3">
</app-textarea-input>
```

### 2. Comentarios en Solicitudes

```html
<app-textarea-input
  formControlName="comments"
  label="Comentarios u Observaciones"
  placeholder="Agrega información adicional..."
  [rows]="4"
  [maxlength]="500"
  [showCharCounter]="true">
</app-textarea-input>
```

### 3. Dirección

```html
<app-textarea-input
  formControlName="address"
  label="Dirección"
  placeholder="Ej: Calle 100 # 15-20"
  [required]="true"
  [rows]="2">
</app-textarea-input>
```

### 4. Descripción de Archivo

```html
<app-textarea-input
  formControlName="description"
  label="Descripción"
  placeholder="Describe el archivo..."
  [rows]="4"
  [maxlength]="300"
  [showCharCounter]="true">
</app-textarea-input>
```

### 5. Motivo de Ajuste

```html
<app-textarea-input
  formControlName="reason"
  label="Motivo del Ajuste"
  placeholder="Describe el motivo del ajuste..."
  [required]="true"
  [rows]="4"
  [maxlength]="500"
  [showCharCounter]="true"
  helperText="Explica claramente el motivo del ajuste">
</app-textarea-input>
```

## Estilos

El componente utiliza las variables CSS del sistema de diseño:

- `--app-hover-bg`: Fondo del textarea
- `--app-card-bg`: Fondo en focus
- `--app-text-primary`: Color del texto
- `--app-text-secondary`: Color del placeholder y texto de ayuda
- `--app-border`: Color del borde

### Estados Visuales

- **Normal**: Fondo gris claro
- **Focus**: Borde de 2px del color primario
- **Disabled**: Opacidad reducida
- **Readonly**: Sin cambios visuales, pero no editable

## Accesibilidad

- Etiquetas asociadas correctamente con los campos
- Soporte para lectores de pantalla
- Indicadores visuales claros para campos requeridos
- Mensajes de error accesibles

## Notas

- El componente maneja automáticamente la sincronización con el FormControl
- El contador de caracteres solo se muestra si `showCharCounter` es `true` Y `maxlength` está definido
- El texto de ayuda se muestra debajo del textarea cuando está definido
- El componente es completamente responsive

## Migración desde ion-textarea

### Antes:
```html
<ion-item lines="none">
  <ion-label position="stacked">Descripción *</ion-label>
  <ion-textarea 
    formControlName="description" 
    placeholder="Escribe aquí..."
    rows="3">
  </ion-textarea>
</ion-item>
```

### Después:
```html
<app-textarea-input
  formControlName="description"
  label="Descripción"
  placeholder="Escribe aquí..."
  [required]="true"
  [rows]="3">
</app-textarea-input>
```

## Beneficios

1. **Código más limpio**: Menos líneas de HTML
2. **Consistencia**: Mismo estilo en toda la aplicación
3. **Funcionalidad integrada**: Contador de caracteres incluido
4. **Mantenibilidad**: Cambios centralizados
5. **Reutilización**: Un componente para todos los casos de uso
