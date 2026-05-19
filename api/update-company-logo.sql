-- Script para actualizar la tabla companies y agregar la relación con attachments

-- 1. Agregar la columna logoId si no existe
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_id VARCHAR(36) NULL;

-- 2. Eliminar la columna logoUrl si existe
ALTER TABLE companies 
DROP COLUMN IF EXISTS logo_url;

-- 3. Agregar la foreign key constraint si no existe
ALTER TABLE companies
ADD CONSTRAINT fk_companies_logo_id 
FOREIGN KEY (logo_id) 
REFERENCES attachments(id) 
ON DELETE SET NULL;

-- Verificar la estructura de la tabla
DESCRIBE companies;
