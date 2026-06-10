import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys.service';
import { IS_API_KEY_PROTECTED } from '../decorators/api-key.decorator';

/**
 * Guard que valida el header `x-api-key` contra las API keys almacenadas.
 * Solo se activa en endpoints decorados con @ApiKeyAuth().
 * 
 * Uso en controllers:
 * @UseGuards(ApiKeyGuard)
 * @ApiKeyAuth()
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(
        private readonly apiKeysService: ApiKeysService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isProtected = this.reflector.getAllAndOverride<boolean>(IS_API_KEY_PROTECTED, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si el endpoint no está decorado con @ApiKeyAuth(), permitir acceso
        if (!isProtected) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API key requerida. Incluye el header x-api-key.');
        }

        const ip = request.ip || request.connection?.remoteAddress;
        const isValid = await this.apiKeysService.validateKey(apiKey, ip);

        if (!isValid) {
            throw new UnauthorizedException('API key inválida o revocada.');
        }

        return true;
    }
}
