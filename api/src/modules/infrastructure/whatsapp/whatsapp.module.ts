import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappConfig } from './entities/whatsapp-config.entity';
import { WhatsappDevice } from './entities/whatsapp-device.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([WhatsappConfig, WhatsappDevice]),
        HttpModule,
    ],
    controllers: [WhatsappController],
    providers: [WhatsappService],
    exports: [WhatsappService],
})
export class WhatsappModule {}
