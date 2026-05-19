import { Module } from '@nestjs/common';
import { CompaniesModule } from './companies/companies.module';
import { DepartmentsModule } from './departments/departments.module';
import { PositionsModule } from './positions/positions.module';
import { SchedulesModule } from './schedules/schedules.module';
import { LocationsModule } from './locations/locations.module';

@Module({
    imports: [
        CompaniesModule,
        DepartmentsModule,
        PositionsModule,
        SchedulesModule,
        LocationsModule,
    ],
    exports: [
        CompaniesModule,
        DepartmentsModule,
        PositionsModule,
    ],
})
export class OrganizationModule { }
