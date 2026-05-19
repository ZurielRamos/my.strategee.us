# PageTitleComponent

Componente compartido para mantener consistencia en los títulos y subtítulos de todas las páginas.

## Uso Básico

```html
<app-page-title 
  title="Título de la Página" 
  subtitle="Descripción breve de la página">
</app-page-title>
```

## Con Controles (Dashboard)

```html
<app-page-title 
  title="Platform Overview" 
  subtitle="Take control of your platform today!"
  [showControls]="true"
  date="12 July, 2024"
  filterLabel="Today">
</app-page-title>
```

## Con Contenido Personalizado

```html
<app-page-title 
  title="Biblioteca de Medios" 
  subtitle="Gestiona tus archivos multimedia">
  <div class="title-controls">
    <ion-button (click)="openUploadModal()">
      <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
      Subir Archivo
    </ion-button>
  </div>
</app-page-title>
```

## Propiedades

| Propiedad | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `title` | `string` | Sí | `''` | Título principal de la página |
| `subtitle` | `string` | No | `''` | Subtítulo o descripción |
| `showControls` | `boolean` | No | `false` | Muestra controles predefinidos (fecha y filtro) |
| `date` | `string` | No | `undefined` | Fecha a mostrar (requiere showControls=true) |
| `filterLabel` | `string` | No | `'Today'` | Etiqueta del filtro (requiere showControls=true) |

## Ejemplos de Uso

### Dashboard
```typescript
// dashboard.page.html
<app-page-title 
  title="Platform Overview" 
  subtitle="Take control of your platform today!"
  [showControls]="true"
  date="12 July, 2024"
  filterLabel="Today">
</app-page-title>
```

### Página de Medios
```typescript
// media.page.html
<app-page-title 
  title="Biblioteca de Medios" 
  subtitle="Gestiona tus archivos multimedia">
  <div class="title-controls desktop-only">
    <ion-button (click)="openUploadModal()" class="add-button">
      <ion-icon slot="start" name="cloud-upload-outline"></ion-icon>
      Subir Archivo
    </ion-button>
  </div>
</app-page-title>
```

### Página de Organización
```typescript
// organization.page.html
<app-page-title 
  title="Organización" 
  subtitle="Gestiona la estructura de tu empresa">
</app-page-title>
```

## Estilos

El componente incluye estilos responsivos que se adaptan a diferentes tamaños de pantalla. En dispositivos móviles, los controles se apilan verticalmente.

## Importación

El componente es standalone, por lo que debe importarse en el array `imports` de tu componente:

```typescript
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';

@Component({
  // ...
  imports: [
    // ... otros imports
    PageTitleComponent
  ]
})
```
