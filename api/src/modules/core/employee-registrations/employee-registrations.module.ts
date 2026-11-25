import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationLink } from './entities/registration-link.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Company } from '@modules/organization/companies/entities/company.entity';
import { Position } from '@modules/organization/positions/entities/position.entity';
import { Department } from '@modules/organization/departments/entities/department.entity';
import { EmployeeRegistrationsService } from './employee-registrations.service';
import {
    EmployeeRegistrationLinkController,
    PublicEmployeeRegistrationController,
} from './employee-registrations.controller';
import { RegistrationRateLimitGuard } from './guards/registration-rate-limit.guard';
import { IamModule } from '@modules/iam/iam.module';

@Module({
    imports: [TypeOrmModule.forFeature([RegistrationLink, Employee, Company, Position, Department]), IamModule],
    controllers: [PublicEmployeeRegistrationController, EmployeeRegistrationLinkController],
    providers: [EmployeeRegistrationsService, RegistrationRateLimitGuard],
})
export class EmployeeRegistrationsModule { }
