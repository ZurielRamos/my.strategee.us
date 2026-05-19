import { Module } from '@nestjs/common';
import { BenefitsService } from './benefits.service';
import { BenefitsController } from './benefits.controller';
import { BenefitAllocation } from './entities/benefit-allocation.entity';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [BenefitsController],
  providers: [BenefitsService],
  imports: [TypeOrmModule.forFeature([BenefitAllocation, Request])],
  exports: [BenefitsService],
})
export class BenefitsModule { }
