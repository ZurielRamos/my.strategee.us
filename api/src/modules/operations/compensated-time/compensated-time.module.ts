import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompensatedTimeService } from './compensated-time.service';
import { CompensatedTimeController } from './compensated-time.controller';
import { CompensatedTimeLedger } from './entities/compensated-time-ledger.entity';
import { RequestsModule } from '../requests/requests.module';
import { SystemSettingsModule } from '@modules/system/system-settings/system-settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompensatedTimeLedger]),
    forwardRef(() => RequestsModule),
    SystemSettingsModule,
  ],
  controllers: [CompensatedTimeController],
  providers: [CompensatedTimeService],
  exports: [CompensatedTimeService],
})
export class CompensatedTimeModule {}
