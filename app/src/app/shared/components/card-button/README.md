# CardButton Component

Componente reutilizable de tarjeta con botón para mostrar opciones de acción con icono, título, descripción y estados.

## Uso Básico

```typescript
import { CardButtonComponent } from '@shared/components/card-button/card-button.component';

@Component({
    imports: [CardButtonComponent]
})
```

```html
<app-card-button
    title="Vacaciones"
    description="Solicita tus días de vacaciones"
    icon="airplane-outline"
    (cardClick)="handleVacationClick()">
</app-card-button>
```

## Propiedades

| Propiedad | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `title` | `string` | Sí | `''` | Título de la tarjeta |
| `description` | `string` | Sí | `''` | Descripción o texto secundario |
| `icon` | `string` | Sí | `''` | Nombre del icono de Ionicons |
| `disabled` | `boolean` | No | `false` | Deshabilita la tarjeta |
| `loading` | `boolean` | No | `false` | Muestra spinner de carga |
| `badge` | `object` | No | `undefined` | Badge con texto y tipo |
| `colorClass` | `string` | No | `undefined` | Clase CSS adicional para estilos |

### Badge Object

```typescript
{
    text: string;        // Texto del badge
    type: 'unavailable' | 'info';  // Tipo de badge
}
```

## Eventos

| Evento | Descripción |
|--------|-------------|
| `cardClick` | Emitido cuando se hace clic en la tarjeta (si no está disabled o loading) |

## Ejemplos

### Tarjeta Simple

```html
<app-card-button
    title="Documentos"
    description="Solicita certificados laborales"
    icon="document-text-outline"
    (cardClick)="requestDocument()">
</app-card-button>
```

### Tarjeta con Estado de Carga

```html
<app-card-button
    title="Vacaciones"
    description="Cargando balance..."
    icon="airplane-outline"
    [loading]="isLoadingVacations"
    (cardClick)="requestVacation()">
</app-card-button>
```

### Tarjeta Deshabilitada con Badge

```html
<app-card-button
    title="Home Office"
    description="Sin días disponibles este mes"
    icon="laptop-outline"
    [disabled]="true"
    [badge]="{ text: 'No disponible', type: 'unavailable' }"
    (cardClick)="requestHomeOffice()">
</app-card-button>
```

### Tarjeta con Badge Informativo

```html
<app-card-button
    title="Vacaciones"
    description="Solicita tus días de vacaciones"
    icon="airplane-outline"
    [badge]="{ text: '15 días disponibles', type: 'info' }"
    (cardClick)="requestVacation()">
</app-card-button>
```

### Tarjeta con Clase de Color

```html
<app-card-button
    title="Permiso Ordinario"
    description="Solicita permiso por horas"
    icon="time-outline"
    colorClass="color-tertiary"
    (cardClick)="requestPermission()">
</app-card-button>
```

## Grid de Tarjetas

Para mostrar múltiples tarjetas en un grid responsivo:

```html
<div class="cards-grid">
    @for (item of items; track item.id) {
        <app-card-button
            [title]="item.title"
            [description]="item.description"
            [icon]="item.icon"
            [disabled]="item.disabled"
            (cardClick)="handleClick(item)">
        </app-card-button>
    }
</div>
```

```scss
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}
```

## Estilos Personalizados

El componente soporta clases CSS adicionales a través de `colorClass`:

```scss
// En tu archivo .scss
.color-primary .card-icon {
    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.color-success .card-icon {
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
}
```

## Notas

- El componente usa variables CSS del tema de la aplicación (`--app-card-bg`, `--app-text-primary`, etc.)
- Los iconos deben ser nombres válidos de Ionicons
- El evento `cardClick` no se emite si la tarjeta está `disabled` o `loading`
- El badge de tipo `unavailable` muestra un icono de error automáticamente
