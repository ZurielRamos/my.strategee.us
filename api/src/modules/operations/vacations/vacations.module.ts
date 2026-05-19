import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacationsService } from './vacations.service';
import { VacationLedger } from './entities/vacation-ledger.entity';
import { VacationsController } from './vacations.controller';
import { ContractsModule } from '@modules/core/contracts/contracts.module';
import { SystemSettingsModule } from '@modules/system/system-settings/system-settings.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VacationLedger]),
    forwardRef(() => ContractsModule),
    SystemSettingsModule,
    forwardRef(() => RequestsModule), // Necesario por la dependencia circular Service <-> Strategy
  ],
  controllers: [VacationsController],
  providers: [VacationsService],
  exports: [VacationsService],
})
export class VacationsModule { }