import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { EncryptionService } from '@modules/security/password-vault/services/encryption.service';
import { GoogleWorkspaceToken } from './entities/google-workspace-token.entity';
import { GoogleWorkspaceService } from './google-workspace.service';
import { GoogleWorkspaceController } from './google-workspace.controller';

@Module({
    imports: [TypeOrmModule.forFeature([GoogleWorkspaceToken]), UsersModule],
    controllers: [GoogleWorkspaceController],
    providers: [GoogleWorkspaceService, EncryptionService],
    exports: [GoogleWorkspaceService],
})
export class GoogleWorkspaceModule { }
