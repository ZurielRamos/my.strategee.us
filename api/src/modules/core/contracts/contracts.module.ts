import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract } from './entities/contract.entity';
import { Memorandum } from './entities/memorandum.entity';
import { Employee } from '../employees/entities/employee.entity';
import { FinanceModule } from '../../finance/finance.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Contract, Memorandum, Employee]),
        FinanceModule,
    ],
    controllers: [ContractsController],
    providers: [ContractsService],
    exports: [ContractsService],
})
export class ContractsModule { }
