import { Module } from '@nestjs/common';
import { EmployeesModule } from './employees/employees.module';
import { ContractsModule } from './contracts/contracts.module';
import { BenefitsModule } from './benefits/benefits.module';
import { ParafiscalesModule } from './parafiscales/parafiscales.module';

@Module({
    imports: [EmployeesModule, ContractsModule, BenefitsModule, ParafiscalesModule],
    exports: [EmployeesModule, ContractsModule, BenefitsModule, ParafiscalesModule],
})
export class CoreModule { }
