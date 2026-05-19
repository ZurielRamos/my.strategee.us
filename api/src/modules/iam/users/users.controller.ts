import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ClassSerializerInterceptor,
    UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../authorization/enums/role.enum';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';
import { RolesGuard } from '../authorization/guards/roles.guard';
import { Roles } from '../authorization/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AccessTokenGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Crear un nuevo usuario (Solo Admin)' })
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
    @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener todos los usuarios (Admin/HR Manager)' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios obtenida exitosamente' })
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un usuario por ID' })
    @ApiResponse({ status: 200, description: 'Usuario encontrado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar un usuario (Solo Admin)' })
    @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
