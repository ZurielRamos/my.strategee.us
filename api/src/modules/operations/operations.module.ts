import { Module } from '@nestjs/common';
import { RequestsModule } from './requests/requests.module';
import { VacationsModule } from './vacations/vacations.module';
import { CompensatedTimeModule } from './compensated-time/compensated-time.module';
import { EnergyzeDaysModule } from './energyze-days/energyze-days.module';
import { GiftedDaysModule } from './gifted-days/gifted-days.module';

@Module({
    imports: [RequestsModule, VacationsModule, CompensatedTimeModule, EnergyzeDaysModule, GiftedDaysModule],
    exports: [RequestsModule, VacationsModule, CompensatedTimeModule, EnergyzeDaysModule, GiftedDaysModule],
})
export class OperationsModule { }
