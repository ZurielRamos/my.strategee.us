import { Injectable } from '@nestjs/common';
import { DeviceInfo } from '../interfaces/device-info.interface';
import { Request } from 'express';

@Injectable()
export class DeviceDetectorService {
    /**
     * Extrae información del dispositivo desde el User-Agent y headers de la request
     */
    extractDeviceInfo(request: Request): DeviceInfo {
        const userAgent = request.headers['user-agent'] || 'Unknown';
        const ipAddress = this.extractIpAddress(request);

        return {
            deviceName: this.parseDeviceName(userAgent),
            deviceType: this.detectDeviceType(userAgent),
            userAgent,
            ipAddress,
        };
    }

    private parseDeviceName(userAgent: string): string {
        // Detectar navegador
        let browser = 'Unknown Browser';
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
        }

        // Detectar sistema operativo
        let os = 'Unknown OS';
        if (userAgent.includes('Windows')) {
            os = 'Windows';
        } else if (userAgent.includes('Mac OS')) {
            os = 'macOS';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
        } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            os = 'iOS';
        }

        return `${browser} on ${os}`;
    }

    private detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
        const ua = userAgent.toLowerCase();

        // Detectar tablets
        if (ua.includes('ipad') || (ua.includes('tablet') && !ua.includes('mobile'))) {
            return 'tablet';
        }

        // Detectar móviles
        if (
            ua.includes('mobile') ||
            ua.includes('android') ||
            ua.includes('iphone') ||
            ua.includes('ipod') ||
            ua.includes('blackberry') ||
            ua.includes('windows phone')
        ) {
            return 'mobile';
        }

        // Si no es móvil ni tablet, probablemente es desktop
        if (ua.includes('windows') || ua.includes('mac') || ua.includes('linux')) {
            return 'desktop';
        }

        return 'unknown';
    }

    private extractIpAddress(request: Request): string {
        // Intenta obtener la IP real del cliente considerando proxies
        const forwarded = request.headers['x-forwarded-for'] as string;
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }

        const realIp = request.headers['x-real-ip'] as string;
        if (realIp) {
            return realIp;
        }

        return request.ip || 'unknown';
    }
}
