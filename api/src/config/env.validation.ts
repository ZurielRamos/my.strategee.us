// src/config/env.validation.ts
import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    // Define el entorno (desarrollo, producción, etc.)
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),

    // Puerto de la API (por defecto 3000 si no se define)
    PORT: Joi.number().default(3000),

    // Validaciones de Base de Datos (Todas obligatorias)
    APP_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(3306),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),

    // Define si TypeORM debe sincronizar esquemas (¡Cuidado en prod!)
    DB_SYNC: Joi.boolean().default(false),

    // Firebase Storage
    FIREBASE_PROJECT_ID: Joi.string().required(),
    FIREBASE_CLIENT_EMAIL: Joi.string().email().required(),
    FIREBASE_PRIVATE_KEY: Joi.string().required(),
    FIREBASE_STORAGE_BUCKET: Joi.string().required(),

    // Password Vault Encryption
    ENCRYPTION_SECRET: Joi.string().min(32).required(),
    ENCRYPTION_SALT: Joi.string().min(16).required(),
});