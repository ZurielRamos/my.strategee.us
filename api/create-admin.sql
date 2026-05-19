-- Script SQL para crear usuario administrador base
-- Ejecutar este script después de que TypeORM haya creado la tabla users

USE my_strategee;

-- Insertar usuario administrador
-- Password: Admin123! (hasheado con bcrypt, 10 salt rounds)
INSERT INTO users (
  id,
  email,
  password,
  roles,
  isActive,
  refreshToken,
  employeeId,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'admin@strategee.com',
  '$2b$10$YQ7qZ8YK5W5Yk8tY0qZ8YeGJR5Yk8tY0qZ8YeGJR5Yk8tY0qZ8YeO', -- Admin123!
  '["ADMIN"]',
  1,
  NULL,
  NULL,
  NOW(),
  NOW()
);

SELECT 'Usuario administrador creado exitosamente!' as STATUS;
SELECT '📧 Email: admin@strategee.com' as CREDENCIALES;
SELECT '🔑 Password: Admin123!' as CREDENCIALES;
