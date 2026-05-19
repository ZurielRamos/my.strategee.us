# Módulo de Biblioteca de Medios

Este módulo permite gestionar archivos multimedia en la aplicación, utilizando el módulo de `attachments` de la API que almacena archivos en Firebase Storage.

## Características

- **Subida de archivos**: Drag & drop o selección manual
- **Procesamiento automático de imágenes**: Las imágenes se convierten a formato AVIF y se generan 4 variantes (thumbnail, small, medium, original)
- **Filtros**: Por tipo de archivo (imagen, documento, video, otro) y carpeta
- **Organización por carpetas**: general, empleados, contratos, solicitudes, logos
- **Metadatos**: Descripción y texto alternativo para accesibilidad
- **Paginación**: 20 archivos por página
- **Eliminación**: Con confirmación

## Estructura

```
media/
├── components/
│   └── media-upload-modal/          # Modal para subir archivos
│       ├── media-upload-modal.component.ts
│       ├── media-upload-modal.component.html
│       └── media-upload-modal.component.scss
├── models/
│   └── attachment.model.ts          # Interfaces y enums
├── services/
│   └── media.service.ts             # Servicio HTTP
├── media.page.ts                    # Componente principal
├── media.page.html
├── media.page.scss
└── README.md

```

## API Endpoints

- `GET /attachments` - Listar archivos con filtros y paginación
- `POST /attachments` - Subir un archivo
- `POST /attachments/bulk` - Subir múltiples archivos (máx. 10)
- `GET /attachments/:id` - Obtener detalle de un archivo
- `PATCH /attachments/:id` - Actualizar metadatos
- `DELETE /attachments/:id` - Eliminar archivo

## Uso

### Subir un archivo

1. Click en "Subir Archivo"
2. Arrastra un archivo o haz click para seleccionar
3. Selecciona la carpeta de destino
4. Opcionalmente agrega descripción y texto alternativo
5. Click en "Subir Archivo"

### Filtrar archivos

Usa los selectores en la parte superior para filtrar por:
- Tipo de archivo (imagen, documento, video, otro)
- Carpeta (general, empleados, contratos, solicitudes, logos)

### Eliminar un archivo

1. Click en el ícono de papelera en la tarjeta del archivo
2. Confirma la eliminación

## Notas técnicas

- Las imágenes se procesan automáticamente en el backend
- El tamaño máximo de archivo es 10MB
- Los archivos se almacenan en Firebase Storage
- Las URLs son públicas y accesibles directamente
- Las variantes de imagen se generan automáticamente para optimizar el rendimiento

## Solución de problemas

Si encuentras errores de compilación después de crear el módulo:

```bash
# Limpiar caché de Angular
rm -rf .angular

# Recompilar
npm run build
```

O simplemente reinicia el servidor de desarrollo.
