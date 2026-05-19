# Migración: Actualizar Logo de Compañía a Attachment

## Descripción
Esta migración actualiza el modelo de `Company` para usar una relación con `Attachment` en lugar de almacenar una URL directa del logo.

## IMPORTANTE: Ejecutar Script SQL

Como el proyecto usa `synchronize: true` en TypeORM, necesitas ejecutar manualmente el script SQL para actualizar la base de datos.

### Opción 1: Usando MySQL CLI

```bash
# Conectarse a la base de datos
mysql -u tu_usuario -p tu_base_de_datos

# Ejecutar el script
source api/update-company-logo.sql
```

### Opción 2: Usando un cliente GUI (MySQL Workbench, DBeaver, etc.)

1. Abre tu cliente de base de datos
2. Conecta a tu base de datos
3. Abre el archivo `api/update-company-logo.sql`
4. Ejecuta el script

### Opción 3: Desde la línea de comandos

```bash
cd api
mysql -u tu_usuario -p tu_base_de_datos < update-company-logo.sql
```

## Verificación

Después de ejecutar el script, verifica que la tabla se actualizó correctamente:

```sql
DESCRIBE companies;
```

Deberías ver:
- Columna `logo_id` (varchar(36), nullable)
- NO debe existir columna `logo_url`
- Foreign key hacia `attachments`

## Cambios Realizados

### Backend (API)

1. **Entidad Company** (`company.entity.ts`)
   - Reemplazado `logoUrl: string` por `logoId: string`
   - Agregada relación `ManyToOne` con `Attachment`
   - Configurado `eager: true` para cargar automáticamente el logo

2. **DTOs**
   - `CreateCompanyDto`: Cambiado `logoUrl?: string` por `logoId?: string`
   - `UpdateCompanyDto`: Heredado automáticamente del cambio anterior

3. **Migración de Base de Datos** (`1772829723000-UpdateCompanyLogoToAttachment.ts`)
   - Agrega columna `logoId` (UUID)
   - Crea foreign key hacia `attachments`
   - Elimina columna `logoUrl`

### Frontend (App)

1. **Modelo Company** (`company.model.ts`)
   - Actualizado para incluir `logoId` y `logo: Attachment`

2. **Componente Modal de Selector de Attachments**
   - Nuevo componente para seleccionar o subir imágenes
   - Filtrado por tipo de attachment (IMAGE)
   - Búsqueda y filtrado por carpeta
   - Integración con el modal de upload existente

3. **Modal de Company**
   - Reemplazado input de URL por selector de attachment
   - Preview del logo seleccionado
   - Botón para cambiar o remover logo

4. **Página de Companies**
   - Actualizada para mostrar el logo desde el objeto `Attachment`
   - Uso de variantes de imagen (medium) para optimización

## Instrucciones de Ejecución

### 1. Ejecutar la Migración

```bash
cd api
npm run migration:run
```

### 2. Verificar la Migración

```bash
# Conectarse a la base de datos y verificar
psql -U postgres -d nombre_base_datos

# Verificar la estructura de la tabla
\d companies

# Debería mostrar:
# - logoId (uuid, nullable)
# - FK hacia attachments
# - Sin columna logoUrl
```

### 3. Rollback (si es necesario)

```bash
cd api
npm run migration:revert
```

## Notas Importantes

- **Datos Existentes**: Las URLs de logos existentes se perderán. Si necesitas migrar datos, crea un script de migración de datos antes de ejecutar esta migración.
- **Attachments**: Asegúrate de que el módulo de attachments esté funcionando correctamente antes de usar esta funcionalidad.
- **Permisos**: Los usuarios necesitarán acceso al módulo de media para subir logos.

## Testing

1. Crear una nueva compañía con logo
2. Editar una compañía existente y agregar/cambiar logo
3. Verificar que el logo se muestre correctamente en la lista
4. Verificar que el logo se muestre en el modal de detalles
5. Eliminar el logo de una compañía

## Migración de Datos (Opcional)

Si necesitas migrar URLs existentes a attachments, puedes crear un script como este:

```typescript
// migration-script.ts
import { DataSource } from 'typeorm';

async function migrateLogos(dataSource: DataSource) {
  const companies = await dataSource
    .getRepository('companies')
    .find({ where: { logoUrl: Not(IsNull()) } });

  for (const company of companies) {
    // Descargar la imagen de logoUrl
    // Subirla a Firebase Storage
    // Crear un Attachment
    // Actualizar company.logoId
  }
}
```
