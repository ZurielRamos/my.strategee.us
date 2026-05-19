# Referencia Rápida - Estándares Admin

## 🎯 Estructura Base (Copiar y Pegar)

### HTML Template
```html
<app-page-header></app-page-header>

<ion-content [fullscreen]="true" class="admin-page-content">
  <div class="admin-container">
    <app-page-title 
      title="Título de la Página" 
      subtitle="Descripción breve">
    </app-page-title>
    
    <!-- Tu contenido aquí -->
  </div>
</ion-content>
```

### SCSS
```scss
@import '../../../theme/admin-standards.scss';

.admin-page-content {
    @include admin-page-background;
}

.admin-container {
    @include admin-page-container;
}
```

### TypeScript
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

---

## 🎨 Colores

```scss
$admin-bg-color: #f4f6f8;         // Fondo de página
$admin-card-bg: #ffffff;           // Fondo de tarjetas
$admin-text-primary: #1a1c1b;     // Texto principal
$admin-text-secondary: #7b7f84;   // Texto secundario
$admin-border-color: #e8eaed;     // Bordes
$admin-accent-color: #1a1c1b;     // Botones/acentos
```

---

## 🧩 Mixins Comunes

```scss
// Tarjeta
.my-card {
    @include admin-card;
}

// Botón primario
.my-button {
    @include admin-button-primary;
}

// Input/Select
.my-input {
    @include admin-input-field;
}

// Grid responsivo (2, 3, 4, 5 columnas)
.my-grid {
    @include admin-grid(2, 3, 4, 5);
}

// Estado de carga
.loading {
    @include admin-loading-state;
}

// Estado vacío
.empty {
    @include admin-empty-state;
}
```

---

## 📱 Clases Utilitarias

```html
<!-- Solo desktop -->
<div class="desktop-only">
  <ion-button>Acción</ion-button>
</div>

<!-- Solo móvil -->
<div class="mobile-only">
  <ion-fab-button>+</ion-fab-button>
</div>
```

---

## 🔧 PageTitleComponent

### Básico
```html
<app-page-title 
  title="Mi Página" 
  subtitle="Descripción">
</app-page-title>
```

### Con Botón
```html
<app-page-title 
  title="Mi Página" 
  subtitle="Descripción">
  <div class="title-controls">
    <ion-button (click)="action()">
      <ion-icon slot="start" name="add-outline"></ion-icon>
      Agregar
    </ion-button>
  </div>
</app-page-title>
```

### Con Controles (Dashboard)
```html
<app-page-title 
  title="Dashboard" 
  subtitle="Vista general"
  [showControls]="true"
  date="12 July, 2024"
  filterLabel="Today">
</app-page-title>
```

---

## ✅ Checklist Rápido

- [ ] `<ion-content class="admin-page-content">`
- [ ] `<div class="admin-container">`
- [ ] `<app-page-title>` para título
- [ ] `@import '../../../theme/admin-standards.scss'`
- [ ] Usar mixins en lugar de estilos duplicados
- [ ] Fondo de página: `#f4f6f8`
- [ ] Fondo de tarjetas: `#ffffff`

---

## 🚫 NO Hacer

```html
<!-- ❌ NO -->
<ion-content class="media-content">
<ion-content class="dashboard-content">
<div class="page-container">
<ion-content class="ion-padding">

<!-- ✅ SÍ -->
<ion-content class="admin-page-content">
  <div class="admin-container">
```

---

## 📚 Documentación Completa

Ver: `ADMIN_DESIGN_STANDARDS.md`
