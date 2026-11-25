import { Module } from '@nestjs/common';
import { RequestsModule } from './requests/requests.module';
import { VacationsModule } from './vacations/vacations.module';
import { CompensatedTimeModule } from './compensated-time/compensated-time.module';
import { EnergyzeDaysModule } from './energyze-days/energyze-days.module';
import { GiftedDaysModule } from './gifted-days/gifted-days.module';
import { MinutesModule } from './minutes/minutes.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
    imports: [RequestsModule, VacationsModule, CompensatedTimeModule, EnergyzeDaysModule, GiftedDaysModule, MinutesModule, TasksModule],
    exports: [RequestsModule, VacationsModule, CompensatedTimeModule, EnergyzeDaysModule, GiftedDaysModule, MinutesModule, TasksModule],
})
export class OperationsModule { }
