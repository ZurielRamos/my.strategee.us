# Configuración de Foto de Perfil para Empleados

## Problema
El endpoint `PATCH /employees/:id/profile-photo` devuelve 404 porque:
1. La columna `profilePhotoId` no existe en la tabla `employees`
2. El servidor necesita reiniciarse para registrar el nuevo endpoint

## Solución

### Opción 1: Ejecutar el script SQL manualmente

1. Abre tu cliente MySQL (MySQL Workbench, phpMyAdmin, o línea de comandos)
2. Conéctate a tu base de datos
3. Ejecuta el archivo `add-profile-photo-column.sql`:

```bash
mysql -u tu_usuario -p tu_base_de_datos < add-profile-photo-column.sql
```

O copia y pega el contenido del archivo en tu cliente MySQL.

### Opción 2: Usar TypeORM CLI (si está configurado)

Si tienes TypeORM CLI configurado, puedes ejecutar:

```bash
npm run typeorm migration:run
```

### Opción 3: Ejecutar la migración desde el código

Si tu aplicación está configurada para ejecutar migraciones automáticamente al iniciar, simplemente reinicia el servidor.

## Después de ejecutar la migración

1. **Reinicia el servidor NestJS**:
   ```bash
   npm run start:dev
   ```

2. **Verifica que el endpoint esté disponible**:
   - El endpoint debería estar en: `PATCH http://localhost:3000/api/v1/employees/:id/profile-photo`
   - Puedes verificarlo en la documentación Swagger: `http://localhost:3000/api`

## Verificación

Para verificar que todo funciona correctamente:

1. Ve a la vista de detalle de un empleado en la app
2. Haz clic en el botón de cámara en el avatar
3. Selecciona o sube una imagen
4. La foto debería actualizarse sin errores

## Estructura de la columna agregada

```sql
profilePhotoId VARCHAR(36) NULL
```

Esta columna almacena el ID del attachment que se usa como foto de perfil del empleado.
