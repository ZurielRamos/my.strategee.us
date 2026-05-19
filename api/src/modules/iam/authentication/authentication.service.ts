import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Role } from '../authorization/enums/role.enum';
import { SessionsService } from './services/sessions.service';
import { DeviceDetectorService } from './services/device-detector.service';
import { Request } from 'express';

@Injectable()
export class AuthenticationService {
    constructor(
        private readonly usersService: UsersService,
        private readonly hashingService: HashingService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly sessionsService: SessionsService,
        private readonly deviceDetectorService: DeviceDetectorService,
    ) { }

    async signUp(signUpDto: SignUpDto, request: Request) {
        // Check if user already exists
        const existingUser = await this.usersService.findByEmail(signUpDto.email);
        if (existingUser) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        // Create user with default EMPLOYEE role
        const user = await this.usersService.create({
            email: signUpDto.email,
            password: signUpDto.password,
            roles: [Role.EMPLOYEE],
        });

        // Extract employeeId if set or retrieved from relation
        const employeeId = user.employeeId || user.employee?.id || null;

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.roles, employeeId);

        // Extract device info and create session
        const deviceInfo = this.deviceDetectorService.extractDeviceInfo(request);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.sessionsService.createSession(user.id, tokens.refreshToken, deviceInfo, expiresAt);

        return {
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles,
                employeeId: employeeId,
            },
            ...tokens,
        };
    }

    async checkEmail(email: string): Promise<boolean> {
        const user = await this.usersService.findByEmail(email);
        return !!user;
    }

    async signIn(signInDto: SignInDto, request: Request) {
        // Find user
        const user = await this.usersService.findByEmail(signInDto.email);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new UnauthorizedException('Usuario inactivo');
        }

        // Verify password
        const isPasswordValid = await this.hashingService.compare(
            signInDto.password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // Extract device info
        const deviceInfo = this.deviceDetectorService.extractDeviceInfo(request);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create session first (with temporary refresh token)
        const session = await this.sessionsService.createSession(
            user.id,
            'temporary', // Will be replaced immediately
            deviceInfo,
            expiresAt,
        );

        // Extract employeeId if set or retrieved from relation
        const employeeId = user.employeeId || user.employee?.id || null;

        // Generate tokens with sessionId
        const tokens = await this.generateTokens(
            user.id,
            user.email,
            user.roles,
            employeeId,
            session.id,
        );

        // Update session with real refresh token
        await this.sessionsService.updateRefreshToken(
            session.id,
            tokens.refreshToken,
            expiresAt,
        );

        return {
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles,
                employeeId: employeeId,
            },
            ...tokens,
        };
    }

    async refreshTokens(refreshToken: string) {
        // Find session by refresh token
        const session = await this.sessionsService.findByRefreshToken(refreshToken);

        if (!session) {
            throw new UnauthorizedException('Sesión inválida o expirada');
        }

        // Check if session has expired
        if (session.expiresAt < new Date()) {
            await this.sessionsService.revokeSession(session.id, session.userId);
            throw new UnauthorizedException('Sesión expirada');
        }

        // Find user
        const user = await this.usersService.findOne(session.userId);

        // Extract employeeId if set or retrieved from relation
        const employeeId = user.employeeId || user.employee?.id || null;

        // Generate new tokens (token rotation) with sessionId
        const tokens = await this.generateTokens(
            user.id,
            user.email,
            user.roles,
            employeeId,
            session.id,
        );

        // Update session with new refresh token
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.sessionsService.updateRefreshToken(session.id, tokens.refreshToken, newExpiresAt);

        return tokens;
    }

    async logout(sessionId: string, userId: string) {
        await this.sessionsService.revokeSession(sessionId, userId);
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        // Find user
        const user = await this.usersService.findOne(userId);
        if (!user) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        // Verify current password
        const isPasswordValid = await this.hashingService.compare(
            changePasswordDto.currentPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new UnauthorizedException('La contraseña actual es incorrecta');
        }

        // Update password
        await this.usersService.updatePassword(userId, changePasswordDto.newPassword);
    }


    private async generateTokens(
        userId: string,
        email: string,
        roles: Role[],
        employeeId: string | null,
        sessionId?: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const payload: JwtPayload = {
            sub: userId,
            email,
            roles,
            employeeId,
            ...(sessionId && { sessionId }), // Include sessionId if provided
        };

        // Usar diferente expiración según el entorno
        const isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
        const accessTokenExpiry = isDevelopment ? '24h' : '15m';

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: accessTokenExpiry, // 24h en desarrollo, 15m en producción
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: '7d', // 7 days
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }
}


