import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { UsersModule } from './users/users.module';
import { GoogleWorkspaceModule } from './google-workspace/google-workspace.module';

@Module({
    imports: [AuthenticationModule, AuthorizationModule, UsersModule, GoogleWorkspaceModule],
    exports: [AuthenticationModule, AuthorizationModule, UsersModule, GoogleWorkspaceModule],
})
export class IamModule { }
