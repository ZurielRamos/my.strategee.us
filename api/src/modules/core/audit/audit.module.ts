import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuditLog } from './entities/audit-log.entity';
import { AuditSubscriber } from './subscribers/audit.subscriber';
import { AuditContextInterceptor } from './interceptors/audit-context.interceptor';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { User } from '@modules/iam/users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([AuditLog, Employee, User]),
        ClsModule,
    ],
    controllers: [AuditController],
    providers: [AuditSubscriber, AuditContextInterceptor, AuditService],
    exports: [AuditContextInterceptor, AuditService],
})
export class AuditModule { }
