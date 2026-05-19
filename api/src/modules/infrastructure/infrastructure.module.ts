import { Module } from '@nestjs/common';
import { MailModule } from './mail/mail.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AttachmentsModule } from './attachments/attachments.module';

@Module({
    imports: [MailModule, FirebaseModule, AttachmentsModule],
    exports: [MailModule, FirebaseModule, AttachmentsModule],
})
export class InfrastructureModule { }
