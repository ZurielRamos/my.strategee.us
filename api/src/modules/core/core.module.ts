import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { ContractsModule } from './contracts/contracts.module';
import { BenefitsModule } from './benefits/benefits.module';
import { EmployeeRegistrationsModule } from './employee-registrations/employee-registrations.module';
import { ParafiscalesModule } from './parafiscales/parafiscales.module';

@Module({
    imports: [EmployeesModule, ContractsModule, BenefitsModule, ParafiscalesModule, EmployeeRegistrationsModule],
    exports: [EmployeesModule, ContractsModule, BenefitsModule, ParafiscalesModule],
})
export class CoreModule { }
