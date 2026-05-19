import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalParametersService } from './global-parameters/global-parameters.service';
import { GlobalParametersController } from './global-parameters/global-parameters.controller';
import { GlobalParameter } from './global-parameters/entities/global-parameter.entity';
import { CompensationModule } from './compensation/compensation.module';
import { IncomesModule } from './incomes/incomes.module';

@Module({
    imports: [TypeOrmModule.forFeature([GlobalParameter]), CompensationModule, IncomesModule],
    controllers: [GlobalParametersController],
    providers: [GlobalParametersService],
    exports: [GlobalParametersService, CompensationModule, IncomesModule],
})
export class FinanceModule { }
