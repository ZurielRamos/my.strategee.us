-- Script para agregar la columna profilePhotoId a la tabla employees
-- Ejecutar este script en tu base de datos MySQL

-- Agregar la columna profilePhotoId
ALTER TABLE `employees` 
ADD COLUMN `profilePhotoId` VARCHAR(36) NULL AFTER `photoUrl`;

-- Agregar la foreign key constraint
ALTER TABLE `employees` 
ADD CONSTRAINT `FK_employees_profilePhoto` 
FOREIGN KEY (`profilePhotoId`) 
REFERENCES `attachments`(`id`) 
ON DELETE SET NULL 
ON UPDATE NO ACTION;

-- Verificar que la columna se agregó correctamente
DESCRIBE `employees`;
