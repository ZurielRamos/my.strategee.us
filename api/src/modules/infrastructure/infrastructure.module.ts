import { Module } from '@nestjs/common';
import { MailModule } from './mail/mail.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
    imports: [MailModule, FirebaseModule, AttachmentsModule, WhatsappModule],
    exports: [MailModule, FirebaseModule, AttachmentsModule, WhatsappModule],
})
export class InfrastructureModule { }
