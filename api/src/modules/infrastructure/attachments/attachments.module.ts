import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { Attachment } from './entities/attachment.entity';
import { FirebaseModule } from '../firebase/firebase.module';
import { ImageProcessorService } from './image-processor.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Attachment]),
        FirebaseModule,
    ],
    controllers: [AttachmentsController],
    providers: [AttachmentsService, ImageProcessorService],
    exports: [AttachmentsService],
})
export class AttachmentsModule { }
