import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { EncryptionService } from '@modules/security/password-vault/services/encryption.service';
import { GoogleWorkspaceToken } from './entities/google-workspace-token.entity';
import { GoogleWorkspaceService } from './google-workspace.service';
import { GoogleWorkspaceController } from './google-workspace.controller';
import { CalendarEventLink } from './calendar/entities/calendar-event-link.entity';
import { GoogleCalendarService } from './calendar/google-calendar.service';
import { GoogleCalendarController } from './calendar/google-calendar.controller';

@Module({
    imports: [TypeOrmModule.forFeature([GoogleWorkspaceToken, CalendarEventLink]), UsersModule],
    controllers: [GoogleWorkspaceController, GoogleCalendarController],
    providers: [GoogleWorkspaceService, GoogleCalendarService, EncryptionService],
    exports: [GoogleWorkspaceService, GoogleCalendarService],
})
export class GoogleWorkspaceModule { }
