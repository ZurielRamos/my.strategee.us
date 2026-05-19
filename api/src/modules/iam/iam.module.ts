import { Module } from '@nestjs/common';
import { AuthenticationModule } from './authentication/authentication.module';
import { AuthorizationModule } from './authorization/authorization.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [AuthenticationModule, AuthorizationModule, UsersModule],
    exports: [AuthenticationModule, AuthorizationModule, UsersModule],
})
export class IamModule { }
