import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from '@config/database.config';
import firebaseConfig from '@config/firebase.config';
import { envValidationSchema } from '@config/env.validation';
import { IamModule } from '@modules/iam/iam.module';
import { CoreModule } from '@modules/core/core.module';
import { OrganizationModule } from '@modules/organization/organization.module';
import { FinanceModule } from '@modules/finance/finance.module';
import { ClsModule } from 'nestjs-cls';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditContextInterceptor } from '@modules/core/audit/interceptors/audit-context.interceptor';
import { AuditModule } from '@modules/core/audit/audit.module';
import { OperationsModule } from '@modules/operations/operations.module';
import { InfrastructureModule } from '@modules/infrastructure/infrastructure.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SystemModule } from '@modules/system/system.module';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { PushNotificationsModule } from '@modules/notifications/push-notifications.module';
import { PasswordVaultModule } from '@modules/security/password-vault/password-vault.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, firebaseConfig],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        return configService.get<TypeOrmModuleOptions>('database')!;
      },
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'app', 'www'),
      exclude: ['/api/v1/(.*)'],
    }),
    IamModule,
    CoreModule,
    OrganizationModule,
    FinanceModule,
    InfrastructureModule,
    SystemModule,
    NotificationsModule,
    PushNotificationsModule,
    PasswordVaultModule,
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    AuditModule,
    OperationsModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
})
export class AppModule { }