-- Script SQL para crear usuario IT
-- Contraseña: M3d3llin2026,. (hasheada con bcrypt, 10 salt rounds)

USE my_strategee;

INSERT INTO users (
  id,
  email,
  password,
  roles,
  is_active,
  employee_id,
  created_at,
  updated_at
) VALUES (
  UUID(),
  'it@strategee.us',
  '$2b$10$P..XY9Bua1VCXxfInTIzu.m1YjngbATL.ljI2pVq0rb/doz9FQnW6',
  '["ADMIN"]',
  1,
  NULL,
  NOW(),
  NOW()
);

SELECT 'Usuario IT creado exitosamente!' AS STATUS;
SELECT '📧 Email: it@strategee.us' AS CREDENCIALES;
SELECT '🔑 Password: M3d3llin2026,.' AS CREDENCIALES;
