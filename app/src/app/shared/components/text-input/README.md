# TextInput Component

Componente reutilizable para campos de texto con integración completa con Angular Reactive Forms.

## Características

- Integración con Angular Reactive Forms (ControlValueAccessor)
- Soporte para múltiples tipos de input (text, email, tel, number, url, password)
- Texto de ayuda opcional con icono
- Modo de solo lectura
- Validación HTML5 integrada (maxlength, minlength, pattern)
- Indicador de campo requerido
- Estilos consistentes con el sistema de diseño

## Uso Básico

### Importación

```typescript
import { TextInputComponent } from '@shared/components/text-input/text-input.component';

@Component({
  // ...
  imports: [TextInputComponent, ReactiveFormsModule]
})
export class MyComponent {
  form = this.fb.group({
    name: ['', Validators.required]
  });
}
```

### Template Simple

```html
<form [formGroup]="form">
  <app-text-input
    formControlName="name"
    label="Nombre"
    placeholder="Ingrese su nombre"
    [required]="true">
  </app-text-input>
</form>
```

## Propiedades (Inputs)

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `label` | `string` | `''` | Etiqueta del campo |
| `placeholder` | `string` | `''` | Texto placeholder |
| `required` | `boolean` | `false` | Indica si el campo es requerido (muestra *) |
| `type` | `TextInputType` | `'text'` | Tipo de input: text, email, tel, number, url, password |
| `helperText` | `string` | `undefined` | Texto de ayuda debajo del input |
| `helperIcon` | `string` | `undefined` | Nombre del icono de Ionicons para el helper |
| `readonly` | `boolean` | `false` | Modo de solo lectura |
| `maxlength` | `number` | `undefined` | Longitud máxima del texto |
| `minlength` | `number` | `undefined` | Longitud mínima del texto |
| `pattern` | `string` | `undefined` | Patrón regex para validación |
| `autocomplete` | `string` | `undefined` | Atributo autocomplete HTML5 |

## Tipos de Input Soportados

```typescript
type TextInputType = 'text' | 'email' | 'tel' | 'number' | 'url' | 'password';
```

## Ejemplos de Uso

### Ejemplo 1: Campo de Texto Simple

```html
<app-text-input
  formControlName="firstName"
  label="Nombres"
  placeholder="Ej: Juan Carlos"
  [required]="true">
</app-text-input>
```

### Ejemplo 2: Email

```html
<app-text-input
  formControlName="email"
  label="Email"
  placeholder="ejemplo@email.com"
  type="email"
  [required]="true">
</app-text-input>
```

### Ejemplo 3: Teléfono

```html
<app-text-input
  formControlName="phone"
  label="Teléfono"
  placeholder="+51 999 999 999"
  type="tel"
  [required]="true">
</app-text-input>
```

### Ejemplo 4: Número

```html
<app-text-input
  formControlName="age"
  label="Edad"
  placeholder="18"
  type="number"
  [required]="true">
</app-text-input>
```

### Ejemplo 5: Con Texto de Ayuda

```html
<app-text-input
  formControlName="documentNumber"
  label="Número de Documento"
  placeholder="12345678"
  [required]="true"
  helperText="Ingrese solo números sin guiones"
  helperIcon="information-circle-outline">
</app-text-input>
```

### Ejemplo 6: Con Validación de Longitud

```html
<app-text-input
  formControlName="username"
  label="Nombre de Usuario"
  placeholder="usuario123"
  [required]="true"
  [minlength]="3"
  [maxlength]="20"
  helperText="Entre 3 y 20 caracteres">
</app-text-input>
```

### Ejemplo 7: Con Patrón de Validación

```html
<app-text-input
  formControlName="postalCode"
  label="Código Postal"
  placeholder="15001"
  [required]="true"
  pattern="[0-9]{5}"
  helperText="5 dígitos numéricos">
</app-text-input>
```

### Ejemplo 8: Solo Lectura

```html
<app-text-input
  formControlName="employeeId"
  label="ID de Empleado"
  [readonly]="true">
</app-text-input>
```

### Ejemplo 9: Password

```html
<app-text-input
  formControlName="password"
  label="Contraseña"
  type="password"
  [required]="true"
  [minlength]="8"
  helperText="Mínimo 8 caracteres">
</app-text-input>
```

### Ejemplo 10: URL

```html
<app-text-input
  formControlName="website"
  label="Sitio Web"
  placeholder="https://ejemplo.com"
  type="url">
</app-text-input>
```

## Integración con Validadores de Angular

```typescript
form = this.fb.group({
  email: [
    '', 
    [
      Validators.required,
      Validators.email
    ]
  ],
  phone: [
    '',
    [
      Validators.required,
      Validators.pattern(/^\+?[0-9\s\-()]+$/)
    ]
  ],
  username: [
    '',
    [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20)
    ]
  ]
});
```

```html
<app-text-input
  formControlName="email"
  label="Email"
  type="email"
  [required]="true">
</app-text-input>

@if (form.get('email')?.invalid && form.get('email')?.touched) {
  <div class="error-message">
    @if (form.get('email')?.errors?.['required']) {
      El email es requerido
    }
    @if (form.get('email')?.errors?.['email']) {
      Email inválido
    }
  </div>
}
```

## Casos de Uso Comunes

### 1. Información Personal

```html
<app-text-input
  formControlName="firstName"
  label="Nombres"
  placeholder="Ej: Juan Carlos"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="lastName"
  label="Apellidos"
  placeholder="Ej: García López"
  [required]="true">
</app-text-input>
```

### 2. Información de Contacto

```html
<app-text-input
  formControlName="personalEmail"
  label="Email Personal"
  placeholder="ejemplo@email.com"
  type="email"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="personalPhone"
  label="Teléfono Personal"
  placeholder="+51 999 999 999"
  type="tel"
  [required]="true">
</app-text-input>
```

### 3. Documentos de Identidad

```html
<app-text-input
  formControlName="documentNumber"
  label="Número de Documento"
  placeholder="12345678"
  [required]="true"
  [maxlength]="20">
</app-text-input>
```

### 4. Información Laboral

```html
<app-text-input
  formControlName="employeeCode"
  label="Código de Empleado"
  placeholder="EMP-001"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="corporateEmail"
  label="Email Corporativo"
  placeholder="empleado@empresa.com"
  type="email">
</app-text-input>
```

### 5. Datos Financieros

```html
<app-text-input
  formControlName="salary"
  label="Salario"
  placeholder="2500000"
  type="number"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="bankAccount"
  label="Cuenta Bancaria"
  placeholder="1234567890"
  [maxlength]="20">
</app-text-input>
```

## Autocomplete

El componente soporta el atributo `autocomplete` de HTML5 para mejorar la experiencia del usuario:

```html
<app-text-input
  formControlName="email"
  label="Email"
  type="email"
  autocomplete="email"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="phone"
  label="Teléfono"
  type="tel"
  autocomplete="tel"
  [required]="true">
</app-text-input>
```

Valores comunes de autocomplete:
- `name` - Nombre completo
- `given-name` - Nombre
- `family-name` - Apellido
- `email` - Email
- `tel` - Teléfono
- `street-address` - Dirección
- `postal-code` - Código postal
- `country` - País

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
- **Readonly**: Sin cambios visuales, pero no editable
- **Required**: Asterisco rojo junto a la etiqueta

## Accesibilidad

- Etiquetas asociadas correctamente con los campos
- Soporte para lectores de pantalla
- Indicadores visuales claros para campos requeridos
- Validación HTML5 integrada
- Mensajes de ayuda accesibles

## Migración desde ion-input

### Antes:
```html
<ion-item lines="none">
  <ion-label position="stacked">Nombre *</ion-label>
  <ion-input 
    formControlName="name" 
    placeholder="Ingrese su nombre">
  </ion-input>
</ion-item>
```

### Después:
```html
<app-text-input
  formControlName="name"
  label="Nombre"
  placeholder="Ingrese su nombre"
  [required]="true">
</app-text-input>
```

## Comparación de Código

### Formulario Completo - Antes (ion-input)

```html
<ion-item lines="none">
  <ion-label position="stacked">Nombres *</ion-label>
  <ion-input formControlName="firstName" placeholder="Ej: Juan"></ion-input>
</ion-item>

<ion-item lines="none">
  <ion-label position="stacked">Email *</ion-label>
  <ion-input formControlName="email" type="email" placeholder="email@ejemplo.com"></ion-input>
</ion-item>

<ion-item lines="none">
  <ion-label position="stacked">Teléfono *</ion-label>
  <ion-input formControlName="phone" type="tel" placeholder="+51 999 999 999"></ion-input>
</ion-item>
```

### Formulario Completo - Después (app-text-input)

```html
<app-text-input
  formControlName="firstName"
  label="Nombres"
  placeholder="Ej: Juan"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="email"
  label="Email"
  type="email"
  placeholder="email@ejemplo.com"
  [required]="true">
</app-text-input>

<app-text-input
  formControlName="phone"
  label="Teléfono"
  type="tel"
  placeholder="+51 999 999 999"
  [required]="true">
</app-text-input>
```

## Beneficios

1. **Código más limpio**: Menos líneas de HTML
2. **Consistencia**: Mismo estilo en toda la aplicación
3. **Mantenibilidad**: Cambios centralizados
4. **Validación integrada**: Soporte para validación HTML5
5. **Reutilización**: Un componente para todos los tipos de texto
6. **Accesibilidad**: Mejores prácticas implementadas por defecto

## Notas

- El componente maneja automáticamente la sincronización con el FormControl
- Todos los tipos de input HTML5 están soportados
- Compatible con todos los validadores de Angular Forms
- El componente es completamente responsive
- Los atributos HTML5 como maxlength, minlength y pattern funcionan automáticamente
