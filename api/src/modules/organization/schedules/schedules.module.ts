import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { Schedule } from './entities/schedule.entity';
import { Memorandum } from '../../core/contracts/entities/memorandum.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Schedule, Memorandum])],
    controllers: [SchedulesController],
    providers: [SchedulesService],
    exports: [SchedulesService],
})
export class SchedulesModule { }
