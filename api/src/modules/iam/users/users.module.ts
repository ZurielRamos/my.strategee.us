import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { HashingService } from '../hashing/hashing.service';
import { BcryptService } from '../hashing/bcrypt.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    controllers: [UsersController],
    providers: [
        UsersService,
        {
            provide: HashingService,
            useClass: BcryptService,
        },
    ],
    exports: [UsersService],
})
export class UsersModule { }
