import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { Position } from './entities/position.entity';
import { DepartmentsModule } from '../departments/departments.module';
import { Contract } from '../../core/contracts/entities/contract.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Position, Contract]),
        DepartmentsModule,
    ],
    controllers: [PositionsController],
    providers: [PositionsService],
    exports: [PositionsService],
})
export class PositionsModule { }
