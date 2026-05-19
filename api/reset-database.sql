-- Script para reiniciar la base de datos my_strategee
-- ADVERTENCIA: Este script eliminará TODAS las tablas y datos

USE my_strategee;

-- Desactivar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar todas las tablas si existen
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `positions`;
DROP TABLE IF EXISTS `contracts`;
DROP TABLE IF EXISTS `absences`;
DROP TABLE IF EXISTS `payrolls`;
DROP TABLE IF EXISTS `benefits`;
DROP TABLE IF EXISTS `evaluations`;
DROP TABLE IF EXISTS `trainings`;

-- Reactivar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Mensaje de confirmación
SELECT 'Base de datos limpiada exitosamente. TypeORM creará las tablas automáticamente al iniciar.' as STATUS;
