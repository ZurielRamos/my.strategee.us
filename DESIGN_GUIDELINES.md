# Lineamientos de Diseño

## Modales de Formularios

**IMPORTANTE**: Antes de crear cualquier modal que contenga un formulario, consultar el archivo **[FORM_MODAL_GUIDELINES.md](./FORM_MODAL_GUIDELINES.md)** que contiene:

- Estructura base usando `BaseModalComponent`
- **Uso de `ModalService` para simplificar la creación de modales**
- Clases CSS estándar reutilizables (NO crear clases nuevas)
- Estructura del componente TypeScript
- Template HTML estándar
- Estilos SCSS recomendados
- Uso de componentes reutilizables (AlertBoxComponent)
- Validación de formularios
- Mejores prácticas y checklist

### Reglas Rápidas
1. SIEMPRE usar `BaseModalComponent` como wrapper
2. **PREFERIR `ModalService` sobre `ModalController` directo**
3. Usar clases CSS estándar: `form-modal-sm`, `form-modal-md`, `form-modal-lg`, `form-modal-xl`
4. NO crear clases CSS personalizadas para cada modal (usar las estándar)
5. Usar `AlertBoxComponent` para mensajes informativos
6. NO incluir estilos de header, footer o botones (manejados por BaseModalComponent)
7. Seguir la estructura de estilos estándar para campos de formulario

### ModalService (Recomendado)

```typescript
import { ModalService } from '@shared/services/modal.service';

constructor(private modalService: ModalService) {}

async openModal() {
    const result = await this.modalService.openFormModal(
        MyModalComponent,
        { data: someData },
        'md' // Tamaño automático
    );
    
    if (result.role === 'save') {
        // Manejar guardado
    }
}
```

Ver [README_MODAL_SERVICE.md](./app/src/app/shared/services/README_MODAL_SERVICE.md) para documentación completa.

### Clases CSS Disponibles
- `form-modal-sm`: 500px - Formularios simples (3-5 campos)
- `form-modal-md`: 600px - Formularios medianos (6-10 campos)
- `form-modal-lg`: 700px - Formularios complejos (10+ campos)
- `form-modal-xl`: 800px - Formularios muy complejos

## Toast Notifications

### Especificaciones
- **Color**: Negro con texto blanco (invertido en dark mode)
- **Posición**: Esquina inferior derecha (desktop) / Centro inferior (mobile)
- **Duración**: 3000ms
- **Bordes**: 12px redondeados

### Uso

Importar el servicio `ToastService` y usar el método `show()`:

```typescript
import { ToastService } from '@shared/services/toast.service';

constructor(private toastService: ToastService) {}

async saveChanges() {
    try {
        // Lógica
        await this.toastService.show('Cambios guardados exitosamente');
    } catch (error) {
        await this.toastService.show('Error al guardar los cambios');
    }
}
```

### Mensajes Estándar
- Crear: "Registro creado exitosamente"
- Actualizar: "Cambios guardados exitosamente"
- Eliminar: "Registro eliminado exitosamente"
- Enviar: "Solicitud enviada exitosamente"

### Reglas
1. NO usar `color: 'success'` o `color: 'danger'`
2. Todos los toasts deben usar `ToastService`
3. Mensajes concisos y descriptivos
4. Los estilos están en `global.scss` con clase `.custom-toast`
