import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { UsersModule } from '../users/users.module';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { HashingService } from '../hashing/hashing.service';
import { BcryptService } from '../hashing/bcrypt.service';
import { Session } from './entities/session.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { SessionsService } from './services/sessions.service';
import { DeviceDetectorService } from './services/device-detector.service';
import { PasswordResetService } from './services/password-reset.service';
import { SessionsController } from './controllers/sessions.controller';
import { PasswordResetController } from './controllers/password-reset.controller';
import { InfrastructureModule } from '@modules/infrastructure/infrastructure.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Session, PasswordResetToken]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: '15m',
                },
            }),
        }),
        UsersModule,
        InfrastructureModule,
    ],
    controllers: [AuthenticationController, SessionsController, PasswordResetController],
    providers: [
        AuthenticationService,
        SessionsService,
        DeviceDetectorService,
        PasswordResetService,
        AccessTokenStrategy,
        RefreshTokenStrategy,
        {
            provide: HashingService,
            useClass: BcryptService,
        },
    ],
    exports: [AuthenticationService, SessionsService, PasswordResetService],
})
export class AuthenticationModule { }
