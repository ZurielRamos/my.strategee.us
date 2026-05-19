import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParafiscalesService } from './parafiscales.service';
import { ParafiscalesController } from './parafiscales.controller';
import { EmployeeParafiscales } from './entities/employee-parafiscales.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EmployeeParafiscales])],
    controllers: [ParafiscalesController],
    providers: [ParafiscalesService],
    exports: [ParafiscalesService],
})
export class ParafiscalesModule {}
