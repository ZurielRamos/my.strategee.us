# AlertBox Component

Componente reutilizable para mostrar mensajes de alerta con diferentes tipos y estilos.

## Uso

### Importar el componente

```typescript
import { AlertBoxComponent } from './shared/components/alert-box/alert-box.component';

@Component({
  // ...
  imports: [AlertBoxComponent]
})
```

### Ejemplos de uso

#### Con mensaje como input
```html
<app-alert-box type="info" message="Este es un mensaje informativo"></app-alert-box>
<app-alert-box type="warning" message="Advertencia importante"></app-alert-box>
<app-alert-box type="danger" message="Error crítico"></app-alert-box>
<app-alert-box type="success" message="Operación exitosa"></app-alert-box>
```

#### Con contenido proyectado (ng-content)
```html
<app-alert-box type="info">
  Este es un mensaje informativo con <strong>HTML</strong> personalizado.
</app-alert-box>

<app-alert-box type="warning">
  <p>Advertencia con múltiples párrafos.</p>
  <p>Puedes incluir cualquier contenido HTML.</p>
</app-alert-box>
```

#### Con variable dinámica
```typescript
errorMessage = 'Ha ocurrido un error';
```

```html
@if (errorMessage) {
  <app-alert-box type="danger" [message]="errorMessage"></app-alert-box>
}
```

## Propiedades

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `type` | `'info' \| 'warning' \| 'danger' \| 'success'` | `'info'` | Tipo de alerta que determina el color e icono |
| `message` | `string` | `''` | Mensaje de texto a mostrar (opcional si usas ng-content) |

## Tipos de alerta

### Info (azul)
- Icono: `information-circle-outline`
- Color: Azul (#2196f3)
- Uso: Mensajes informativos generales

### Warning (naranja)
- Icono: `warning-outline`
- Color: Naranja (#ff9800)
- Uso: Advertencias y precauciones

### Danger (rojo)
- Icono: `alert-circle-outline`
- Color: Rojo (#eb445a)
- Uso: Errores y mensajes críticos

### Success (verde)
- Icono: `checkmark-circle-outline`
- Color: Verde (#4caf50)
- Uso: Confirmaciones y operaciones exitosas

## Soporte de tema oscuro

El componente incluye soporte automático para tema oscuro con colores ajustados para mejor legibilidad.
