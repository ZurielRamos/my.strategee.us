import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')! || 'fallback-secret',
        });
    }

    async validate(payload: JwtPayload): Promise<JwtPayload> {
        return {
            sub: payload.sub,
            email: payload.email,
            roles: payload.roles,
            employeeId: payload.employeeId,
            sessionId: payload.sessionId, // Include sessionId if present
        };
    }
}
