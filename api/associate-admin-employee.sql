-- Script para asociar un empleado a un usuario ADMIN existente
-- Uso: Ejecuta este script después de crear el usuario ADMIN

-- Variables (MODIFICA ESTOS VALORES SEGÚN TU CASO)
SET @admin_email = 'admin@strategee.com';
SET @employee_first_name = 'Admin';
SET @employee_last_name = 'Principal';
SET @employee_document = '1234567890';

-- ============================================================
-- VERIFICACIONES PREVIAS
-- ============================================================

-- 1. Verificar si el usuario existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Usuario encontrado'
        ELSE '✗ ERROR: Usuario no encontrado'
    END as status,
    @admin_email as email
FROM users 
WHERE email = @admin_email;

-- 2. Verificar si ya tiene un empleado asociado
SELECT 
    CASE 
        WHEN employeeId IS NULL THEN '✓ Sin empleado asociado - Continuando...'
        ELSE CONCAT('⚠ ADVERTENCIA: Ya tiene empleado asociado: ', employeeId)
    END as status,
    employeeId
FROM users 
WHERE email = @admin_email;

-- 3. Verificar si el documento ya existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('⚠ ADVERTENCIA: Ya existe un empleado con documento ', @employee_document)
        ELSE '✓ Documento disponible'
    END as status
FROM employees 
WHERE documentNumber = @employee_document;

-- ============================================================
-- CREACIÓN DEL EMPLEADO
-- ============================================================

-- Crear el registro de empleado
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

-- ============================================================
-- ASOCIACIÓN
-- ============================================================

-- Obtener el ID del empleado recién creado
SET @new_employee_id = (SELECT id FROM employees WHERE documentNumber = @employee_document);

-- Asociar el empleado al usuario
UPDATE users 
SET employeeId = @new_employee_id 
WHERE email = @admin_email;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================

SELECT 
    '✓ ASOCIACIÓN COMPLETADA' as status,
    u.id as user_id,
    u.email,
    JSON_EXTRACT(u.roles, '$') as roles,
    u.employeeId,
    e.firstName,
    e.lastName,
    e.documentNumber
FROM users u
LEFT JOIN employees e ON u.employeeId = e.id
WHERE u.email = @admin_email;

-- ============================================================
-- INSTRUCCIONES POST-EJECUCIÓN
-- ============================================================

-- Ahora puedes:
-- 1. Iniciar sesión con el usuario ADMIN
-- 2. Acceder a los endpoints de employee:
--    - GET /requests/my-requests
--    - GET /vacations/my-balance
--    - GET /compensated-time/my-balance
--    - GET /benefits/allocations/:employeeId
-- 3. El JWT incluirá el employeeId en el payload
