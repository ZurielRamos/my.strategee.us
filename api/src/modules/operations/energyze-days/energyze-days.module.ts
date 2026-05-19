import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnergyzeDaysService } from './energyze-days.service';
import { EnergyzeDaysController } from './energyze-days.controller';
import { EnergyzeDaysLedger } from './entities/energyze-days-ledger.entity';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnergyzeDaysLedger]),
    forwardRef(() => RequestsModule),
  ],
  controllers: [EnergyzeDaysController],
  providers: [EnergyzeDaysService],
  exports: [EnergyzeDaysService],
})
export class EnergyzeDaysModule {}
