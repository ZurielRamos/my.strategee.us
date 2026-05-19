import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HashingService } from '../hashing/hashing.service';
import { Role } from '../authorization/enums/role.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly hashingService: HashingService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('El correo electrónico ya está registrado');
        }

        // Hash password
        const hashedPassword = await this.hashingService.hash(
            createUserDto.password,
        );

        // Create user with default role if not provided
        const user = this.usersRepository.create({
            ...createUserDto,
            password: hashedPassword,
            roles: createUserDto.roles || [Role.EMPLOYEE],
        });

        return this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['employee'],
        });

        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            relations: ['employee'],
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        // Check if email is being changed and if it's already taken
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.usersRepository.findOne({
                where: { email: updateUserDto.email },
            });

            if (existingUser) {
                throw new ConflictException('El correo electrónico ya está registrado');
            }
        }

        // Hash password if being updated
        if (updateUserDto.password) {
            updateUserDto.password = await this.hashingService.hash(
                updateUserDto.password,
            );
        }

        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        user.isActive = false;
        await this.usersRepository.save(user);
    }

    /**
     * Hard delete user and all related data (sessions, tokens)
     * Used when revoking employee credentials
     */
    async hardDelete(id: string): Promise<void> {
        const user = await this.findOne(id);
        // This will cascade delete sessions and password reset tokens
        await this.usersRepository.remove(user);
    }

    async updatePassword(id: string, newPassword: string): Promise<void> {
        const user = await this.findOne(id);

        // Hash the new password
        const hashedPassword = await this.hashingService.hash(newPassword);

        // Update password
        user.password = hashedPassword;
        await this.usersRepository.save(user);
    }

}
