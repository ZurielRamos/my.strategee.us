import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

export const IS_API_KEY_PROTECTED = 'isApiKeyProtected';

/**
 * Decorador que protege un endpoint con autenticación por API key.
 * Aplica automáticamente el guard y documenta el header en Swagger.
 * 
 * Uso:
 * @ApiKeyAuth()
 * @Get('webhook')
 * handleWebhook() { ... }
 */
export function ApiKeyAuth() {
    return applyDecorators(
        SetMetadata(IS_API_KEY_PROTECTED, true),
        UseGuards(ApiKeyGuard),
        ApiHeader({
            name: 'x-api-key',
            description: 'API key para autenticación de integraciones',
            required: true,
        }),
    );
}
