import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Límite simple en memoria por IP para el registro público
 * (máx. 10 envíos por hora por IP).
 */
@Injectable()
export class RegistrationRateLimitGuard implements CanActivate {
    private static readonly WINDOW_MS = 60 * 60 * 1000;
    private static readonly MAX_REQUESTS = 10;
    private readonly hits = new Map<string, number[]>();

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        const ip: string = req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();
        const recent = (this.hits.get(ip) ?? []).filter((t) => now - t < RegistrationRateLimitGuard.WINDOW_MS);
        if (recent.length >= RegistrationRateLimitGuard.MAX_REQUESTS) {
            throw new HttpException(
                'Demasiados intentos. Inténtalo de nuevo más tarde.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }
        recent.push(now);
        this.hits.set(ip, recent);
        return true;
    }
}
