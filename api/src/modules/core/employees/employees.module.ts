import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { EmergencyContactsService } from './emergency-contacts.service';
import { EmergencyContactsController } from './emergency-contacts.controller';
import { Employee } from './entities/employee.entity';
import { EmployeeSettings } from './entities/employee-settings.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { AuditLog } from '@modules/core/audit/entities/audit-log.entity';
import { IamModule } from '@modules/iam/iam.module';
import { ContractsModule } from '@modules/core/contracts/contracts.module';
import { FinanceModule } from '@modules/finance/finance.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Employee, EmployeeSettings, EmergencyContact, AuditLog]),
        HttpModule,
        IamModule,
        ContractsModule,
        FinanceModule
    ],
    controllers: [EmployeesController, EmergencyContactsController],
    providers: [EmployeesService, EmergencyContactsService],
    exports: [EmployeesService],
})
export class EmployeesModule { }