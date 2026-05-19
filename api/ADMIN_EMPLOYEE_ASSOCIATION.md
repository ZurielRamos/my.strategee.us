# Asociar Empleado a Usuario ADMIN

## Problema
Los usuarios con rol ADMIN necesitan tener un registro de empleado asociado (`employeeId`) para poder acceder a las funcionalidades del área de employee, como:
- Ver sus propias solicitudes (`/requests/my-requests`)
- Consultar su balance de vacaciones (`/vacations/my-balance`)
- Consultar su balance de días compensados (`/compensated-time/my-balance`)
- Ver sus beneficios asignados (`/benefits/allocations/:employeeId`)

## Solución

### Opción 1: Crear Empleado y Asociarlo Manualmente (SQL)

```sql
-- 1. Primero, crea el registro de empleado
INSERT INTO employees (
    id,
    firstName,
    lastName,
    documentNumber,
    documentType,
    birthDate,
    gender,
    address,
    personalPhone,
    personalEmail,
    corporateEmail,
    isActive,
    createdAt,
    updatedAt
) VALUES (
    UUID(),
    'Admin',
    'Principal',
    '1234567890',
    'CC',
    '1990-01-01',
    'OTHER',
    'Dirección Admin',
    '+57 300 000 0000',
    'admin@strategee.com',
    'admin@strategee.com',
    1,
    NOW(),
    NOW()
);

-- 2. Obtén el ID del empleado recién creado
SET @employee_id = (SELECT id FROM employees WHERE documentNumber = '1234567890');

-- 3. Asocia el empleado al usuario ADMIN
UPDATE users 
SET employeeId = @employee_id 
WHERE email = 'admin@strategee.com';
```

### Opción 2: Usar los Endpoints de la API

#### Paso 1: Crear el empleado
```bash
curl -X POST http://localhost:3000/api/v1/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -d '{
    "firstName": "Admin",
    "lastName": "Principal",
    "documentNumber": "1234567890",
    "documentType": "CC",
    "birthDate": "1990-01-01",
    "gender": "OTHER",
    "address": "Dirección Admin",
    "personalPhone": "+57 300 000 0000",
    "personalEmail": "admin@strategee.com",
    "corporateEmail": "admin@strategee.com"
  }'
```

Guarda el `id` del empleado de la respuesta.

#### Paso 2: Asociar el empleado al usuario
```sql
UPDATE users 
SET employeeId = 'ID_DEL_EMPLEADO_AQUI' 
WHERE email = 'admin@strategee.com';
```

### Opción 3: Script Automatizado (RECOMENDADO)

Crea un archivo `associate-admin-employee.sql`:

```sql
-- Script para asociar un empleado a un usuario ADMIN existente
-- Uso: Ejecuta este script después de crear el usuario ADMIN

-- Variables (MODIFICA ESTOS VALORES)
SET @admin_email = 'admin@strategee.com';
SET @employee_first_name = 'Admin';
SET @employee_last_name = 'Principal';
SET @employee_document = '1234567890';

-- 1. Verificar si el usuario existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'Usuario encontrado ✓'
        ELSE 'ERROR: Usuario no encontrado'
    END as status
FROM users 
WHERE email = @admin_email;

-- 2. Verificar si ya tiene un empleado asociado
SELECT 
    CASE 
        WHEN employeeId IS NULL THEN 'Sin empleado asociado - Continuando...'
        ELSE CONCAT('ADVERTENCIA: Ya tiene empleado asociado: ', employeeId)
    END as status
FROM users 
WHERE email = @admin_email;

-- 3. Crear el registro de empleado
INSERT INTO employees (
    id,
    firstName,
    lastName,
    documentNumber,
    documentType,
    birthDate,
    gender,
    address,
    personalPhone,
    personalEmail,
    corporateEmail,
    isActive,
    createdAt,
    updatedAt
) VALUES (
    UUID(),
    @employee_first_name,
    @employee_last_name,
    @employee_document,
    'CC',
    '1990-01-01',
    'OTHER',
    'Dirección Administrativa',
    '+57 300 000 0000',
    @admin_email,
    @admin_email,
    1,
    NOW(),
    NOW()
);

-- 4. Obtener el ID del empleado recién creado
SET @new_employee_id = (SELECT id FROM employees WHERE documentNumber = @employee_document);

-- 5. Asociar el empleado al usuario
UPDATE users 
SET employeeId = @new_employee_id 
WHERE email = @admin_email;

-- 6. Verificar la asociación
SELECT 
    u.id as user_id,
    u.email,
    u.roles,
    u.employeeId,
    e.firstName,
    e.lastName,
    e.documentNumber,
    'Asociación completada ✓' as status
FROM users u
LEFT JOIN employees e ON u.employeeId = e.id
WHERE u.email = @admin_email;
```

## Verificación

Después de asociar el empleado, verifica que funcione:

### 1. Iniciar sesión
```bash
curl -X POST http://localhost:3000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@strategee.com",
    "password": "Admin123!"
  }'
```

La respuesta debe incluir el `employeeId`:
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@strategee.com",
    "roles": ["ADMIN"],
    "employeeId": "uuid-del-empleado"
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### 2. Probar endpoint de employee
```bash
curl -X GET "http://localhost:3000/api/v1/requests/my-requests?page=1&limit=20" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

Debería devolver 200 OK (aunque la lista esté vacía).

## Notas Importantes

1. **Todos los usuarios ADMIN deben tener un empleado asociado** para acceder a las funcionalidades de employee.

2. **Los endpoints ahora permiten ambos roles** (ADMIN y EMPLOYEE):
   - `/requests/my-requests`
   - `/requests` (crear solicitud)
   - `/requests/:id` (actualizar solicitud)
   - `/vacations/my-balance`
   - `/compensated-time/my-balance`
   - `/benefits/allocations/:employeeId`

3. **El frontend ya está configurado** para permitir que usuarios ADMIN accedan al área de employee:
   - Ruta `/employee` permite roles: `['ADMIN', 'EMPLOYEE']`
   - El `RoleGuard` verifica que el usuario tenga al menos uno de los roles requeridos

4. **Si un usuario ADMIN no tiene `employeeId`**, recibirá un error 400 "Employee ID not found in JWT payload" al intentar acceder a los endpoints de employee.

## Recomendación

Para nuevos usuarios ADMIN:
1. Crear primero el registro de empleado
2. Crear el usuario con rol ADMIN
3. Asociar el `employeeId` al usuario
4. O usar el endpoint `/employees/:id/credentials` que crea el usuario automáticamente

Para usuarios ADMIN existentes sin empleado:
1. Ejecutar el script `associate-admin-employee.sql`
2. Verificar la asociación con el endpoint de sign-in
