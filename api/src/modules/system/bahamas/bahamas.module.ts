import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BahamasController } from './bahamas.controller';
import { BahamasIntegrationController } from './bahamas-integration.controller';
import { BahamasService } from './bahamas.service';
import { BahamasConfig } from './entities/bahamas-config.entity';
import { WhatsappModule } from '../../infrastructure/whatsapp/whatsapp.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([BahamasConfig]),
        WhatsappModule,
        ApiKeysModule,
    ],
    controllers: [BahamasController, BahamasIntegrationController],
    providers: [BahamasService],
    exports: [BahamasService],
})
export class BahamasModule {}
