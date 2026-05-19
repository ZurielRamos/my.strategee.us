# Migración: Eliminación del campo status de Memorandums

## Descripción
Esta migración elimina el campo `status` de la tabla `memorandums`. A partir de ahora, el estado de un memorando se determina dinámicamente basándose en sus fechas de inicio y fin.

## Lógica de Estado

Un memorando puede tener tres estados calculados:

- **ACTIVE**: `startDate <= hoy` Y (`endDate` es null O `endDate >= hoy`)
- **PENDING**: `startDate > hoy`
- **EXPIRED**: `endDate < hoy`

## Cambios Realizados

### Backend

1. **Entidad Memorandum** (`api/src/modules/core/contracts/entities/memorandum.entity.ts`)
   - Eliminada la columna `status`
   - Agregados métodos `isActive()` y `getStatus()` para calcular el estado dinámicamente

2. **DTO CreateMemorandumDto** (`api/src/modules/core/contracts/dto/create-memorandum.dto.ts`)
   - Eliminado el campo `status`

3. **Servicio de Contratos** (`api/src/modules/core/contracts/contracts.service.ts`)
   - Eliminada la lógica de `checkMemorandumStatuses()`
   - Agregado método `getCurrentMemorandum()` que determina el memorando activo basándose en fechas
   - Actualizado `addMemorandum()` para no asignar status
   - Actualizado `findOne()`, `findAllByEmployee()` y `findActiveByEmployee()` para usar la nueva lógica

4. **Migración** (`api/src/database/migrations/1772919059000-RemoveStatusFromMemorandums.ts`)
   - Elimina la columna `status` de la tabla `memorandums`

### Frontend

1. **Modelo Contract** (`app/src/app/admin/employees/models/contract.model.ts`)
   - Eliminado el enum `MemorandumStatus`
   - Eliminado el campo `status` de la interfaz `Memorandum`
   - Agregadas funciones helper `getMemorandumStatus()` y `getMemorandumStatusLabel()`

2. **Componente MemorandumModal** 
   - Eliminado el campo de status del formulario
   - Actualizado el HTML para mostrar información sobre activación automática

3. **Componente ContractHistoryModal**
   - Actualizado para usar las nuevas funciones helper de estado

## Instrucciones de Ejecución

### 1. Ejecutar la migración

```bash
cd api
npm run migration:run
```

### 2. Verificar la migración

```bash
# Conectarse a la base de datos y verificar que la columna status fue eliminada
psql -U postgres -d nombre_base_datos
\d memorandums
```

### 3. Reiniciar el servidor backend

```bash
cd api
npm run start:dev
```

### 4. Verificar el frontend

```bash
cd app
npm start
```

## Rollback

Si necesitas revertir la migración:

```bash
cd api
npm run migration:revert
```

Esto restaurará la columna `status` con su valor por defecto 'ACTIVE'.

## Notas Importantes

- Los memorandos existentes no necesitan actualización de datos, ya que el estado ahora se calcula dinámicamente
- La lógica de negocio ahora es más simple y no requiere actualizaciones periódicas de estado
- El frontend debe calcular el estado del memorando usando las funciones helper proporcionadas
