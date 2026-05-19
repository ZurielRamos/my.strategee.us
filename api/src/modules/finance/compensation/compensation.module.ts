import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensationService } from './compensation.service';
import { CompensationController } from './compensation.controller';
import { Compensation } from './entities/compensation.entity';
import { FinanceModule } from '../finance.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Compensation]),
        forwardRef(() => FinanceModule), // Use forwardRef to break circular dependency
    ],
    controllers: [CompensationController],
    providers: [CompensationService],
    exports: [CompensationService],
})
export class CompensationModule { }
