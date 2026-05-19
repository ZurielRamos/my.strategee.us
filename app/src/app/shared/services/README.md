# ToastService

Servicio reutilizable para mostrar notificaciones toast en la aplicación.

## Características

- 4 tipos de toast: success, error, warning, info
- Duración configurable
- Posición configurable
- Colores automáticos según el tipo
- Botón de cerrar incluido
- API simple y consistente

## Uso Básico

```typescript
import { ToastService } from '@shared/services/toast.service';

@Component({
  // ...
})
export class MyComponent {
  constructor(private toastService: ToastService) {}

  async saveData() {
    try {
      await this.service.save(this.data);
      await this.toastService.success('Datos guardados correctamente');
    } catch (error) {
      await this.toastService.error('Error al guardar los datos');
    }
  }
}
```

## Métodos Disponibles

### success(message: string, duration?: number)
Muestra un toast de éxito (verde).

```typescript
await this.toastService.success('Operación exitosa');
await this.toastService.success('Guardado correctamente', 2000);
```

### error(message: string, duration?: number)
Muestra un toast de error (rojo).

```typescript
await this.toastService.error('Error al procesar la solicitud');
await this.toastService.error('No se pudo conectar', 5000);
```

### warning(message: string, duration?: number)
Muestra un toast de advertencia (naranja).

```typescript
await this.toastService.warning('Algunos campos no se guardaron');
await this.toastService.warning('Revisa los datos ingresados', 4000);
```

### info(message: string, duration?: number)
Muestra un toast informativo (azul).

```typescript
await this.toastService.info('Procesando solicitud...');
await this.toastService.info('Datos actualizados', 2500);
```

### show(options: ToastOptions)
Método genérico con todas las opciones configurables.

```typescript
await this.toastService.show({
  message: 'Mensaje personalizado',
  type: 'success',
  duration: 3000,
  position: 'top'
});
```

## Opciones

```typescript
interface ToastOptions {
  message: string;           // Mensaje a mostrar (requerido)
  type?: ToastType;          // 'success' | 'error' | 'warning' | 'info'
  duration?: number;         // Duración en ms (default: 3000)
  position?: 'top' | 'middle' | 'bottom'; // Posición (default: 'bottom')
}
```

## Duraciones por Defecto

- `success`: 3000ms (3 segundos)
- `error`: 4000ms (4 segundos) - más tiempo para leer errores
- `warning`: 3500ms (3.5 segundos)
- `info`: 3000ms (3 segundos)

## Uso en Modales

```typescript
async onConfirm() {
  if (this.form.valid && !this.isSubmitting) {
    this.isSubmitting = true;
    
    try {
      const result = await this.service.save(this.form.value);
      await this.toastService.success('Cambios guardados correctamente');
      this.modalCtrl.dismiss(result, 'save');
    } catch (error) {
      await this.toastService.error('Error al guardar los cambios');
      this.isSubmitting = false;
    }
  }
}
```

## Colores por Tipo

| Tipo | Color Ionic | Uso |
|------|-------------|-----|
| `success` | `success` (verde) | Operaciones exitosas |
| `error` | `danger` (rojo) | Errores y fallos |
| `warning` | `warning` (naranja) | Advertencias |
| `info` | `primary` (azul) | Información general |

## Buenas Prácticas

1. Usa mensajes cortos y claros
2. Usa `success` para confirmar acciones exitosas
3. Usa `error` para notificar fallos
4. Usa `warning` para advertencias que no bloquean
5. Usa `info` para notificaciones generales
6. Ajusta la duración según la longitud del mensaje
7. Mensajes de error pueden tener mayor duración
8. Evita mostrar múltiples toasts simultáneamente

## Ejemplos Completos

### Guardar Datos
```typescript
async save() {
  this.isSubmitting = true;
  
  this.service.save(this.form.value).subscribe({
    next: async (response) => {
      await this.toastService.success('Datos guardados correctamente');
      this.modalCtrl.dismiss(response, 'save');
    },
    error: async (error) => {
      await this.toastService.error(
        error.message || 'Error al guardar los datos'
      );
      this.isSubmitting = false;
    }
  });
}
```

### Eliminar Registro
```typescript
async delete() {
  this.service.delete(this.id).subscribe({
    next: async () => {
      await this.toastService.success('Registro eliminado correctamente');
      this.modalCtrl.dismiss(null, 'delete');
    },
    error: async (error) => {
      await this.toastService.error('No se pudo eliminar el registro');
    }
  });
}
```

### Validación con Advertencia
```typescript
async submit() {
  if (this.hasWarnings()) {
    await this.toastService.warning('Algunos campos tienen advertencias');
  }
  
  if (this.form.valid) {
    await this.save();
  }
}
```
