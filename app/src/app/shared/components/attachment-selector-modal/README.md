# Attachment Selector Modal Component

Componente modal reutilizable para seleccionar attachments (imágenes, documentos, videos, etc.) desde la biblioteca de medios.

## Ubicación
`app/src/app/shared/components/attachment-selector-modal/`

## Características

- ✅ Selección de attachments desde la biblioteca de medios
- ✅ Filtrado por tipo de archivo (imagen, documento, video, etc.)
- ✅ Búsqueda por título
- ✅ Filtrado por carpeta
- ✅ Opción de subir nuevos archivos
- ✅ Preview de archivos seleccionados
- ✅ Altura fija con scroll interno (600px móvil, 700px desktop)
- ✅ Diseño responsivo
- ✅ Consistente con estándares visuales del admin

## Uso Básico

### 1. Importar el Componente

```typescript
import { AttachmentSelectorModalComponent } from '../../../shared/components/attachment-selector-modal/attachment-selector-modal.component';
import { AttachmentType } from '../../media/models/attachment.model';
```

### 2. Abrir el Modal

```typescript
async openAttachmentSelector() {
    const modal = await this.modalCtrl.create({
        component: AttachmentSelectorModalComponent,
        componentProps: {
            selectedAttachmentId: 'uuid-del-attachment-actual', // Opcional
            filterType: AttachmentType.IMAGE, // Opcional
            title: 'Seleccionar Logo', // Opcional
            uploadButtonText: 'Subir Logo', // Opcional
            allowUpload: true // Opcional, default: true
        },
        cssClass: 'attachment-selector-modal',
        backdropDismiss: true
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data) {
        // data contiene el Attachment seleccionado
        console.log('Attachment seleccionado:', data);
        this.selectedAttachment = data;
    }
}
```

## Props (Inputs)

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `selectedAttachmentId` | `string` | `undefined` | UUID del attachment actualmente seleccionado (para marcarlo visualmente) |
| `filterType` | `AttachmentType` | `undefined` | Filtrar por tipo de archivo (IMAGE, DOCUMENT, VIDEO, OTHER) |
| `title` | `string` | `'Seleccionar Recurso'` | Título del modal |
| `uploadButtonText` | `string` | `'Subir Nuevo'` | Texto del botón de subir |
| `allowUpload` | `boolean` | `true` | Mostrar/ocultar botón de subir nuevos archivos |

## Valores de Retorno

El modal retorna mediante `onWillDismiss()`:

### Cuando se selecciona un attachment:
```typescript
{
    role: 'selected',
    data: Attachment // Objeto completo del attachment
}
```

### Cuando se cancela:
```typescript
{
    role: 'backdrop' | undefined,
    data: undefined
}
```

## Ejemplos de Uso

### Ejemplo 1: Selector de Logo (Solo Imágenes)

```typescript
async selectLogo() {
    const modal = await this.modalCtrl.create({
        component: AttachmentSelectorModalComponent,
        componentProps: {
            filterType: AttachmentType.IMAGE,
            title: 'Seleccionar Logo',
            uploadButtonText: 'Subir Logo'
        },
        cssClass: 'attachment-selector-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data) {
        this.logoId = data.id;
        this.logoUrl = data.variants?.medium || data.url;
    }
}
```

### Ejemplo 2: Selector de Documento (Sin Opción de Subir)

```typescript
async selectDocument() {
    const modal = await this.modalCtrl.create({
        component: AttachmentSelectorModalComponent,
        componentProps: {
            filterType: AttachmentType.DOCUMENT,
            title: 'Seleccionar Documento',
            allowUpload: false // No mostrar botón de subir
        },
        cssClass: 'attachment-selector-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data) {
        this.documentId = data.id;
        this.documentUrl = data.url;
    }
}
```

### Ejemplo 3: Selector General (Todos los Tipos)

```typescript
async selectAttachment() {
    const modal = await this.modalCtrl.create({
        component: AttachmentSelectorModalComponent,
        componentProps: {
            // Sin filterType = muestra todos los tipos
            title: 'Seleccionar Archivo',
            uploadButtonText: 'Subir Archivo'
        },
        cssClass: 'attachment-selector-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data) {
        this.attachmentId = data.id;
        this.attachmentUrl = data.url;
    }
}
```

### Ejemplo 4: Con Attachment Pre-seleccionado

```typescript
async editLogo(currentLogoId: string) {
    const modal = await this.modalCtrl.create({
        component: AttachmentSelectorModalComponent,
        componentProps: {
            selectedAttachmentId: currentLogoId, // Marca este como seleccionado
            filterType: AttachmentType.IMAGE,
            title: 'Cambiar Logo'
        },
        cssClass: 'attachment-selector-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'selected' && data) {
        this.logoId = data.id;
    }
}
```

## Tipos de Attachment

```typescript
enum AttachmentType {
    IMAGE = 'image',
    DOCUMENT = 'document',
    VIDEO = 'video',
    OTHER = 'other'
}

enum AttachmentFolder {
    GENERAL = 'general',
    EMPLOYEES = 'employees',
    CONTRACTS = 'contracts',
    REQUESTS = 'requests',
    LOGOS = 'logos'
}
```

## Estructura del Objeto Attachment

```typescript
interface Attachment {
    id: string;
    name: string;
    title?: string;
    url: string;
    storagePath: string;
    mimeType: string;
    size: number;
    type: AttachmentType;
    folder: AttachmentFolder;
    alt?: string;
    description?: string;
    variants?: {
        thumbnail: string;
        small: string;
        medium: string;
        original: string;
    };
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
}
```

## Diseño y Estándares

El componente sigue los estándares visuales del panel de administración:

- **Altura fija**: 600px (móvil), 700px (desktop)
- **Fondo del modal**: #ffffff (blanco)
- **Fondo del header**: #ffffff con título en #1a1c1b
- **Título**: Font-weight 800, tamaño 20px
- **Inputs**: Fondo #f4f6f8, border-radius 12px
- **Cards**: Idénticas a la vista de media
  - Border-radius: 16px
  - Border seleccionado: 3px solid #1a1c1b
  - Shadow: 0 4px 15px rgba(0, 0, 0, 0.05)
  - Hover: translateY(-4px) con shadow aumentado
- **Grid responsivo**: 2 columnas (móvil), 3 (tablet), 4 (desktop), 5 (xl)
- **Botones**: 
  - Primario: #1a1c1b con altura 52px
  - Outline: Border 2px #1a1c1b
  - Font-weight: 700
- **Tipografía**: Consistente con otros modales del admin

## Dependencias

- `MediaService`: Para cargar attachments
- `MediaUploadModalComponent`: Para subir nuevos archivos
- `ModalController`: Para gestionar modales de Ionic

## Notas

- El componente carga hasta 50 attachments por defecto
- La búsqueda tiene un debounce de 500ms
- Las imágenes usan la variante `medium` para optimización
- El scroll es interno al modal (altura fija)
- Compatible con todos los breakpoints responsivos

## Casos de Uso Comunes

1. **Seleccionar logo de empresa**
2. **Seleccionar foto de perfil de empleado**
3. **Seleccionar documento adjunto**
4. **Seleccionar imagen para banner**
5. **Seleccionar archivo para descarga**

## Mantenimiento

Al actualizar este componente:
- Mantener la altura fija del modal
- Respetar los estándares visuales del admin
- Probar en todos los breakpoints
- Verificar que el scroll interno funcione correctamente
- Asegurar que los filtros funcionen con todos los tipos
