import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiftedDaysService } from './gifted-days.service';
import { GiftedDaysController } from './gifted-days.controller';
import { GiftedDaysLedger } from './entities/gifted-days-ledger.entity';
import { RequestsModule } from '../requests/requests.module';
import { ContractsModule } from '@modules/core/contracts/contracts.module';
import { SystemSettingsModule } from '@modules/system/system-settings/system-settings.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([GiftedDaysLedger]),
        forwardRef(() => RequestsModule),
        ContractsModule,
        SystemSettingsModule,
    ],
    controllers: [GiftedDaysController],
    providers: [GiftedDaysService],
    exports: [GiftedDaysService],
})
export class GiftedDaysModule { }
