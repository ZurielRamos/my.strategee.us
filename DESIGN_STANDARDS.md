# Estándares de Diseño - Aplicación Completa

## ⚠️ REGLA CRÍTICA
**ANTES de generar UI: LEE ESTE DOCUMENTO + USA mixins/componentes compartidos**

---

## 🎨 Sistema de Colores

### ⚠️ REGLA CRÍTICA: NUNCA Hardcodear Colores
**SIEMPRE usar variables CSS. NUNCA escribir códigos de color directamente (#ffffff, rgb(), etc.)**

### Variables Disponibles

#### Variables de Ionic (Predefinidas)
```scss
// Colores de marca y estado
--ion-color-primary          // Color principal de la app
--ion-color-secondary        // Color secundario
--ion-color-tertiary         // Color terciario
--ion-color-success          // Verde - estados exitosos
--ion-color-warning          // Amarillo - advertencias
--ion-color-danger           // Rojo - errores/peligro
--ion-color-dark             // Oscuro
--ion-color-medium           // Gris medio
--ion-color-light            // Claro

// Fondos y superficies
--ion-background-color       // Fondo principal de la app
--ion-item-background        // Fondo de items
--ion-card-background        // Fondo de cards
--ion-toolbar-background     // Fondo de toolbars
--ion-tab-bar-background     // Fondo de tab bar

// Textos
--ion-text-color             // Color de texto principal

// Bordes
--ion-border-color           // Color de bordes

// Escala de grises (steps 50-950)
--ion-color-step-50          // Más claro
--ion-color-step-100
--ion-color-step-150
// ... hasta
--ion-color-step-950         // Más oscuro
```

#### Variables Personalizadas (Definidas en variables.scss)
```scss
// Fondos
--app-background             // Fondo de páginas
--app-card-bg                // Fondo de cards
--app-input-bg               // Fondo de inputs
--app-hover-bg               // Fondo en hover

// Textos
--app-text-primary           // Texto principal
--app-text-secondary         // Texto secundario
--app-text-tertiary          // Texto terciario

// Bordes y sombras
--app-border                 // Bordes
--app-shadow                 // Sombras
--app-shadow-hover           // Sombras en hover
```

### Uso en HTML (Atributo color)
```html
<!-- Botones -->
<ion-button color="primary">Primario</ion-button>
<ion-button color="success">Éxito</ion-button>
<ion-button color="danger">Peligro</ion-button>

<!-- Badges -->
<ion-badge color="success">Activo</ion-badge>
<ion-badge color="warning">Pendiente</ion-badge>

<!-- Iconos -->
<ion-icon name="checkmark" color="success"></ion-icon>
```

### Uso en SCSS (Variables CSS)
```scss
.my-card {
  background: var(--app-card-bg);
  color: var(--app-text-primary);
  border: 1px solid var(--app-border);
  box-shadow: 0 2px 8px var(--app-shadow);
}

.my-button {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}

.my-text {
  color: var(--ion-text-color);
}
```

### ❌ NUNCA HACER
```scss
// ❌ NUNCA hardcodear colores
.bad-example {
  background: #ffffff;           // ❌ MAL
  color: #1a1c1b;               // ❌ MAL
  border: 1px solid #e8eaed;    // ❌ MAL
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); // ❌ MAL
}
```

### ✅ SIEMPRE HACER
```scss
// ✅ SIEMPRE usar variables
.good-example {
  background: var(--app-card-bg);      // ✅ BIEN
  color: var(--app-text-primary);      // ✅ BIEN
  border: 1px solid var(--app-border); // ✅ BIEN
  box-shadow: 0 2px 8px var(--app-shadow); // ✅ BIEN
}
```

### Beneficios de Usar Variables
- ✅ Soporte automático de tema claro/oscuro
- ✅ Consistencia en toda la aplicación
- ✅ Fácil mantenimiento y cambios globales
- ✅ Un solo lugar para definir colores
- ✅ Código más limpio y semántico
<ion-badge color="success">Activo</ion-badge>
<ion-badge color="warning">Pendiente</ion-badge>

<!-- Chips -->
<ion-chip color="primary">Etiqueta</ion-chip>
```

### Uso en SCSS (Variables CSS)
```scss
.my-card {
  background: var(--ion-card-background);
  color: var(--ion-text-color);
  border: 1px solid var(--ion-border-color);
}

.my-text {
  color: var(--ion-text-color);           // Texto principal
  
  &.secondary {
    color: var(--ion-color-step-300);     // Texto secundario
  }
}

.my-button {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
  
  &:hover {
    background: var(--ion-color-primary-shade);
  }
}
```

### Ionic Color Steps (Gradientes de Gris)
Ionic proporciona steps del 50 al 950 para crear gradientes:

```scss
--ion-color-step-50          // Más claro
--ion-color-step-100
--ion-color-step-150         // Bordes sutiles
--ion-color-step-200
--ion-color-step-250
--ion-color-step-300         // Texto secundario
--ion-color-step-400
--ion-color-step-450
--ion-color-step-500         // Texto terciario
--ion-color-step-600
...
--ion-color-step-950         // Más oscuro
```

### ❌ NO Hacer
```scss
// ❌ NUNCA hardcodear colores
.bad-example {
  background: #ffffff;
  color: #1a1c1b;
  border: 1px solid #e8eaed;
}
```

### ✅ Hacer
```scss
// ✅ SIEMPRE usar variables de Ionic
.good-example {
  background: var(--ion-card-background);
  color: var(--ion-text-color);
  border: 1px solid var(--ion-border-color);
}
```

### Beneficios
- ✅ Soporte automático de tema claro/oscuro
- ✅ Consistencia en toda la app
- ✅ Fácil mantenimiento
- ✅ Un solo lugar para cambiar colores

---

## 📐 Estructura de Página

### Admin Panel
**HTML:**
```html
<app-page-header></app-page-header>
<ion-content [fullscreen]="true" class="admin-page-content">
  <div class="admin-container">
    <app-page-title title="Título" subtitle="Descripción"></app-page-title>
    <!-- Contenido -->
  </div>
</ion-content>
```

**SCSS:**
```scss
@import '../../../theme/admin-standards.scss';

.admin-page-content { 
  @include admin-page-background; 
}

.admin-container { 
  @include admin-page-container; 
}
```

### Employee Panel
**HTML:**
```html
<app-page-header></app-page-header>
<ion-content [fullscreen]="true" class="employee-page-content">
  <div class="employee-container">
    <!-- Contenido -->
  </div>
</ion-content>
```

---

## 🪟 Modales - USO OBLIGATORIO DE BaseModalComponent

### ⚠️ REGLA CRÍTICA
**SIEMPRE usar el componente `BaseModalComponent` para todos los modales de la aplicación.**
**NUNCA crear estructura de modal desde cero (ion-header, ion-footer, etc.).**

### 1. Ubicación del Componente
```
app/src/app/shared/components/base-modal/
├── base-modal.component.ts
├── base-modal.component.html
└── base-modal.component.scss
```

### 2. Características del BaseModalComponent
- ✅ Header con título, subtítulo opcional y botón de cerrar
- ✅ Content con scroll automático
- ✅ Footer con botones de cancelar y confirmar
- ✅ Responsive: fullscreen en mobile, border-radius en desktop
- ✅ Sin box-shadows
- ✅ Estilos completamente aislados en el componente
- ✅ Inputs configurables para personalización

### 3. Configuración del Modal (TypeScript)
```typescript
async openModal() {
  const modal = await this.modalCtrl.create({
    component: MyModalComponent,
    cssClass: 'my-entity-modal',  // Clase CSS única por tipo de modal
    backdropDismiss: true,
    componentProps: {
      // Props del componente
    }
  });
  await modal.present();
}
```

### 4. Estilos Globales Mínimos (global.scss)
**Solo agregar configuración básica del modal:**
```scss
.my-entity-modal {
    --height: auto;  // Altura automática según contenido
    
    @media (min-width: 768px) {
        --border-radius: var(--app-modal-radius);
    }
}
```

### 5. Estructura del Componente Modal (HTML)
```html
<app-base-modal
    title="Título del Modal"
    subtitle="Descripción opcional"
    cancelText="Cancelar"
    confirmText="Guardar"
    [confirmDisabled]="!form.valid"
    [loading]="isSubmitting"
    (modalDismiss)="dismiss()"
    (modalConfirm)="save()">
    
    <!-- Contenido del modal -->
    <form [formGroup]="form">
        <ion-item lines="none">
            <ion-label position="stacked">Campo *</ion-label>
            <ion-input formControlName="field" placeholder="Valor"></ion-input>
        </ion-item>
    </form>
    
</app-base-modal>
```

### 6. Inputs Disponibles del BaseModalComponent
```typescript
@Input() title = '';                    // Título del modal
@Input() subtitle = '';                 // Subtítulo opcional
@Input() showFooter = true;             // Mostrar/ocultar footer
@Input() cancelText = 'Cancelar';       // Texto del botón cancelar
@Input() confirmText = 'Confirmar';     // Texto del botón confirmar
@Input() confirmDisabled = false;       // Deshabilitar botón confirmar
@Input() loading = false;               // Estado de carga

@Output() modalDismiss = new EventEmitter<void>();  // Evento al cerrar
@Output() modalConfirm = new EventEmitter<void>();  // Evento al confirmar
```

### 7. TypeScript del Componente Modal
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonItem, IonLabel, IonInput, ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../shared/components/base-modal/base-modal.component';

@Component({
    selector: 'app-my-modal',
    templateUrl: './my-modal.component.html',
    styleUrls: ['./my-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonItem,
        IonLabel,
        IonInput,
        BaseModalComponent  // ⚠️ IMPORTANTE: Importar BaseModalComponent
    ]
})
export class MyModalComponent {
    form: FormGroup;
    isSubmitting = false;

    constructor(private modalController: ModalController) {
        // Inicializar formulario
    }

    dismiss() {
        this.modalController.dismiss({ confirmed: false });
    }

    async save() {
        if (this.form.valid) {
            this.isSubmitting = true;
            // Lógica de guardado
            this.modalController.dismiss({ confirmed: true, data: this.form.value });
        }
    }
}
```

### 8. Estilos del Componente Modal (SCSS)
**Solo incluir estilos específicos del contenido, NO del header/footer:**
```scss
// Estilos específicos del contenido del modal
.my-content-section {
    padding: 24px;
    
    @media (max-width: 767px) {
        padding: 20px;
    }
}

// Estilos de formularios si aplica
ion-item {
    --background: transparent;
    --border-width: 0;
    --padding-start: 0;
    --padding-end: 0;
    margin-bottom: 20px;
}

ion-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text-primary);
    margin-bottom: 8px;
}

ion-input {
    --background: white;
    --color: var(--app-text-primary);
    --placeholder-color: var(--app-text-tertiary);
    --padding-start: 16px;
    --padding-end: 16px;
    border: 1px solid var(--app-border);
    border-radius: 8px;
    font-size: 14px;
    min-height: 48px;
}
```

### 9. Ejemplo Completo: Modal de Confirmación
Ver implementación en:
```
app/src/app/admin/settings/components/request-settings-confirmation-modal/
```

### ❌ NUNCA HACER
```html
<!-- ❌ NO crear estructura de modal manualmente -->
<ion-header>
    <ion-toolbar>
        <ion-title>Título</ion-title>
    </ion-toolbar>
</ion-header>
<ion-content>
    <!-- contenido -->
</ion-content>
<ion-footer>
    <!-- botones -->
</ion-footer>
```

### ✅ SIEMPRE HACER
```html
<!-- ✅ USAR BaseModalComponent -->
<app-base-modal
    title="Título"
    (modalDismiss)="dismiss()"
    (modalConfirm)="save()">
    <!-- contenido -->
</app-base-modal>
```

### Beneficios
- ✅ Consistencia visual en todos los modales
- ✅ Menos código duplicado
- ✅ Mantenimiento centralizado
- ✅ Responsive automático
- ✅ Estilos aislados y reutilizables

---

## 🃏 Cards

### Regla: Cards = Componentes Separados
Los cards deben ser componentes reutilizables, no HTML inline.

**Ejemplo:**
```typescript
// entity-card.component.ts
@Component({
  selector: 'app-entity-card',
  template: `
    <ion-card class="entity-card" (click)="cardClick.emit(entity)">
      <ion-card-header>
        <ion-card-title>{{ entity.name }}</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        {{ entity.description }}
      </ion-card-content>
    </ion-card>
  `,
  styleUrls: ['./entity-card.component.scss']
})
export class EntityCardComponent {
  @Input() entity!: Entity;
  @Output() cardClick = new EventEmitter<Entity>();
}
```

**SCSS:**
```scss
.entity-card { 
  @include admin-card; 
}
```

---

## 🔘 Botones

### Botón de Crear (FAB)
**⚠️ REGLA OBLIGATORIA: Los botones de crear SIEMPRE deben ser FAB**

**HTML:**
```html
<!-- Desktop: Botón normal en header -->
<div class="title-actions desktop-only">
    <ion-button (click)="openCreateModal()" class="create-button">
        <ion-icon slot="start" name="add-outline"></ion-icon>
        Crear Entidad
    </ion-button>
</div>

<!-- Mobile: FAB flotante -->
<ion-fab slot="fixed" vertical="bottom" horizontal="end" class="mobile-only">
    <ion-fab-button (click)="openCreateModal()" color="dark">
        <ion-icon name="add-outline"></ion-icon>
    </ion-fab-button>
</ion-fab>
```

**SCSS:**
```scss
.desktop-only {
    @media (max-width: 767px) {
        display: none !important;
    }
}

.mobile-only {
    @media (min-width: 768px) {
        display: none !important;
    }
}

.create-button {
    @include admin-button-primary;
}
```

### Botón Primario
```scss
.my-button { 
  @include admin-button-primary; 
}
```

---

## 📱 Responsividad

### Breakpoints
```scss
$breakpoint-sm: 640px;
$breakpoint-md: 768px;
$breakpoint-lg: 1024px;
$breakpoint-xl: 1280px;
```

### Grid Responsivo
```scss
.my-grid { 
  @include admin-grid(2, 3, 4); // móvil, tablet, desktop
}
```

---

## 🎯 Componentes Compartidos

### Modal de Historial de Auditoría
Componente reutilizable para mostrar el historial de cambios de cualquier entidad.

**Uso:**
```typescript
async openAuditHistory() {
  const modal = await this.modalCtrl.create({
    component: AuditHistoryModalComponent,
    cssClass: 'audit-history-modal',
    componentProps: {
      entityName: 'system_settings',  // Nombre de la tabla
      entityId: this.entityId,         // ID del registro
      title: 'Historial de Cambios'   // Título personalizado
    }
  });
  await modal.present();
}
```

**Ubicación:** `app/src/app/shared/components/audit-history-modal/`

---

## 📋 Estados de UI

### Loading State
```html
<div class="loading-state">
  <ion-spinner name="crescent"></ion-spinner>
  <p>Cargando...</p>
</div>
```

```scss
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;

  ion-spinner {
    --color: #1a1c1b;
    width: 48px;
    height: 48px;
  }

  p {
    font-size: 15px;
    color: #7b7f84;
    margin: 0;
  }
}
```

### Empty State
```html
<div class="empty-state">
  <ion-icon name="document-outline"></ion-icon>
  <h2>Sin Datos</h2>
  <p>No hay elementos para mostrar.</p>
</div>
```

```scss
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 48px 24px;

  ion-icon {
    font-size: 96px;
    color: #e8eaed;
    margin-bottom: 24px;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1a1c1b;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 15px;
    color: #7b7f84;
    margin: 0;
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Importar `admin-standards.scss` o estilos correspondientes
- [ ] Usar componentes compartidos (`<app-page-title>`, etc.)
- [ ] Aplicar mixins de página
- [ ] Cards como componentes separados
- [ ] Usar mixins para botones, inputs, cards
- [ ] Verificar colores con variables CSS
- [ ] Probar responsividad en móvil y desktop
- [ ] Modales: altura fija + estilos globales
- [ ] Estados de loading y empty implementados
- [ ] FAB para botones de crear

---

## 📚 Referencias

### Archivos de Estilos
- **Mixins Admin**: `app/src/theme/admin-standards.scss`
- **Variables CSS**: `app/src/theme/variables.scss`
- **Estilos Globales**: `app/src/global.scss`

### Componentes Compartidos
- **PageTitle**: `app/src/app/shared/components/page-title/`
- **PageHeader**: `app/src/app/shared/components/page-header/`
- **AuditHistoryModal**: `app/src/app/shared/components/audit-history-modal/`

### Ejemplos de Implementación
- **Admin Dashboard**: `app/src/app/admin/dashboard/`
- **Admin Media**: `app/src/app/admin/media/`
- **Admin Organization**: `app/src/app/admin/organization/`
- **Admin Settings**: `app/src/app/admin/settings/`

---

## 🔄 Actualización del Documento
Este documento debe actualizarse cuando:
- Se agreguen nuevos componentes compartidos
- Se modifiquen los estándares de diseño
- Se agreguen nuevos mixins o utilidades
- Se cambien los colores o tipografía base
