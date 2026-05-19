# Modal Service

Servicio centralizado para la gestión de modales en la aplicación.

## Descripción

`ModalService` proporciona una capa de abstracción sobre `ModalController` de Ionic, ofreciendo métodos helper que simplifican la creación y gestión de modales con configuraciones estandarizadas.

## Beneficios

- ✅ **Reduce código duplicado**: No más repetición de `modalCtrl.create()`, `present()`, `onWillDismiss()`
- ✅ **Estandarización**: Aplica automáticamente clases CSS según tamaños predefinidos
- ✅ **Type-safe**: Tipado completo con TypeScript y genéricos
- ✅ **Mantenibilidad**: Cambios centralizados afectan todos los modales
- ✅ **Documentación**: JSDoc completo en cada método
- ✅ **Consistencia**: Comportamiento uniforme en toda la aplicación

## Instalación

El servicio está disponible globalmente (`providedIn: 'root'`), solo necesitas inyectarlo:

```typescript
import { ModalService } from '@shared/services/modal.service';

constructor(private modalService: ModalService) {}
```

## Uso

### 1. Modal de Formulario (Recomendado)

Para modales que contienen formularios, usa `openFormModal()`:

```typescript
async openEmployeeModal() {
    const result = await this.modalService.openFormModal(
        EmployeeModalComponent,
        { 
            employeeId: '123',
            mode: 'edit' 
        },
        'md' // Tamaño: sm | md | lg | xl
    );

    if (result.role === 'save' && result.data) {
        console.log('Datos guardados:', result.data);
        await this.toastService.show('Empleado guardado exitosamente');
    }
}
```

**Tamaños disponibles:**
- `'sm'` (500px): Formularios simples (3-5 campos)
- `'md'` (600px): Formularios medianos (6-10 campos) - **Por defecto**
- `'lg'` (700px): Formularios complejos (10+ campos)
- `'xl'` (800px): Formularios muy complejos

### 2. Modal de Confirmación

Para diálogos de confirmación simples:

```typescript
async confirmDelete(itemName: string) {
    const result = await this.modalService.openConfirmationModal(
        ConfirmDeleteComponent,
        { 
            title: 'Confirmar eliminación',
            message: `¿Estás seguro de eliminar ${itemName}?`,
            itemName 
        }
    );

    if (result.role === 'confirm') {
        await this.deleteItem();
    }
}
```

### 3. Modal Personalizado

Para casos especiales con configuración completa:

```typescript
async openSpecialModal() {
    const result = await this.modalService.openCustomModal(
        SpecialModalComponent,
        {
            componentProps: { data: this.specialData },
            cssClass: 'special-modal-class',
            backdropDismiss: false,
            id: 'special-modal-id'
        }
    );

    // Manejar resultado
}
```

### 4. Cerrar Modal Programáticamente

Desde cualquier lugar de la aplicación:

```typescript
// Cerrar con datos
await this.modalService.dismiss({ saved: true }, 'save');

// Cerrar sin datos
await this.modalService.dismiss();
```

### 5. Verificar Modal Abierto

```typescript
const topModal = await this.modalService.getTop();
if (topModal) {
    console.log('Hay un modal abierto');
}
```

## Tipado con TypeScript

El servicio soporta genéricos para tipar los datos de retorno:

```typescript
interface EmployeeFormData {
    name: string;
    email: string;
    position: string;
}

const result = await this.modalService.openFormModal<EmployeeFormData>(
    EmployeeModalComponent,
    { employeeId: '123' },
    'md'
);

if (result.role === 'save' && result.data) {
    // result.data es de tipo EmployeeFormData
    console.log(result.data.name); // ✅ Autocompletado
}
```

## Manejo de Roles

Los roles comunes al cerrar modales:

- `'save'`: Usuario guardó cambios
- `'cancel'`: Usuario canceló
- `'confirm'`: Usuario confirmó acción
- `'backdrop'`: Usuario cerró tocando fuera (si `backdropDismiss: true`)
- `undefined`: Modal cerrado sin rol específico

```typescript
const result = await this.modalService.openFormModal(...);

switch (result.role) {
    case 'save':
        await this.handleSave(result.data);
        break;
    case 'cancel':
        console.log('Usuario canceló');
        break;
    default:
        console.log('Modal cerrado sin acción');
}
```

## Opciones Avanzadas

### Deshabilitar cierre por backdrop

```typescript
await this.modalService.openFormModal(
    MyComponent,
    { data: someData },
    'md',
    { backdropDismiss: false } // Usuario debe usar botones
);
```

### Modal con ID único

Útil para gestionar múltiples modales:

```typescript
await this.modalService.openFormModal(
    MyComponent,
    { data: someData },
    'md',
    { id: 'unique-modal-id' }
);
```

### Animaciones personalizadas

```typescript
import { customEnterAnimation, customLeaveAnimation } from './animations';

await this.modalService.openFormModal(
    MyComponent,
    { data: someData },
    'md',
    { 
        enterAnimation: customEnterAnimation,
        leaveAnimation: customLeaveAnimation
    }
);
```

## Migración desde ModalController

### Antes (código repetitivo):

```typescript
async openModal() {
    const modal = await this.modalCtrl.create({
        component: MyComponent,
        componentProps: { data: this.data },
        cssClass: 'form-modal-md',
        backdropDismiss: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
        this.handleSave(data);
    }
}
```

### Después (simplificado):

```typescript
async openModal() {
    const result = await this.modalService.openFormModal(
        MyComponent,
        { data: this.data },
        'md'
    );

    if (result.role === 'save' && result.data) {
        this.handleSave(result.data);
    }
}
```

## Mejores Prácticas

### 1. Usar el método apropiado

```typescript
// ✅ Correcto - Modal de formulario
await this.modalService.openFormModal(FormComponent, props, 'md');

// ✅ Correcto - Modal de confirmación
await this.modalService.openConfirmationModal(ConfirmComponent, props);

// ❌ Evitar - Usar openCustomModal para casos estándar
await this.modalService.openCustomModal(FormComponent, { 
    componentProps: props, 
    cssClass: 'form-modal-md' 
});
```

### 2. Manejar errores

```typescript
async openModal() {
    try {
        const result = await this.modalService.openFormModal(...);
        
        if (result.role === 'save') {
            await this.saveData(result.data);
        }
    } catch (error) {
        console.error('Error al abrir modal:', error);
        await this.toastService.show('Error al abrir el formulario');
    }
}
```

### 3. Limpiar recursos

```typescript
async openModal() {
    const result = await this.modalService.openFormModal(...);
    
    // Limpiar subscripciones o recursos si es necesario
    if (result.role === 'cancel') {
        this.cleanup();
    }
}
```

### 4. Validar datos de retorno

```typescript
const result = await this.modalService.openFormModal<FormData>(...);

if (result.role === 'save' && result.data) {
    // Validar datos antes de usar
    if (this.isValidFormData(result.data)) {
        await this.saveData(result.data);
    } else {
        await this.toastService.show('Datos inválidos');
    }
}
```

## API Reference

### Métodos

#### `openFormModal<T>(component, componentProps?, size?, options?)`
Abre un modal de formulario con tamaño estandarizado.

**Parámetros:**
- `component`: Componente del modal
- `componentProps?`: Props a pasar al componente
- `size?`: Tamaño ('sm' | 'md' | 'lg' | 'xl'), default: 'md'
- `options?`: Opciones adicionales

**Retorna:** `Promise<ModalResult<T>>`

---

#### `openConfirmationModal<T>(component, componentProps?, options?)`
Abre un modal de confirmación con altura automática.

**Parámetros:**
- `component`: Componente del modal
- `componentProps?`: Props a pasar al componente
- `options?`: Opciones adicionales

**Retorna:** `Promise<ModalResult<T>>`

---

#### `openCustomModal<T>(component, options?)`
Abre un modal con configuración personalizada completa.

**Parámetros:**
- `component`: Componente del modal
- `options?`: Opciones completas de configuración

**Retorna:** `Promise<ModalResult<T>>`

---

#### `dismiss<T>(data?, role?)`
Cierra el modal superior actualmente abierto.

**Parámetros:**
- `data?`: Datos a retornar
- `role?`: Rol del cierre

**Retorna:** `Promise<boolean>`

---

#### `getTop()`
Obtiene el modal superior actualmente abierto.

**Retorna:** `Promise<HTMLIonModalElement | undefined>`

### Tipos

#### `ModalSize`
```typescript
type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
```

#### `ModalResult<T>`
```typescript
interface ModalResult<T = any> {
    data?: T;
    role?: string;
}
```

#### `ModalOptions`
```typescript
interface ModalOptions {
    componentProps?: Record<string, any>;
    backdropDismiss?: boolean;
    cssClass?: string;
    id?: string;
    enterAnimation?: any;
    leaveAnimation?: any;
}
```

## Soporte

Para preguntas o problemas, consultar:
- [FORM_MODAL_GUIDELINES.md](../../../FORM_MODAL_GUIDELINES.md) - Guías de modales de formularios
- [DESIGN_GUIDELINES.md](../../../DESIGN_GUIDELINES.md) - Lineamientos de diseño generales
