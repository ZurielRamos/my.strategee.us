import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateContactInfoDto } from './dto/update-contact-info.dto';
import { CreateEmployeeCredentialsDto } from './dto/create-employee-credentials.dto';
import { UpdateEmployeeSettingsDto } from './dto/update-employee-settings.dto';
import { UseGuards, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { EmployeeStatus } from './enums/employee-status.enum';
import { ResponseEmployeeDto } from './dto/response-empoyee.dto';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Post()
    @ApiOperation({ summary: 'Crear ficha de empleado' })
    @ApiResponse({
        status: 201,
        description: 'Empleado creado exitosamente',
        type: ResponseEmployeeDto,
        example: {
            "id": "37df3f1e-9ad4-4944-be0e-6b3dc3d745d3",
            "firstName": "Prueba",
            "lastName": "Probando",
            "documentNumber": "4433334432342",
            "documentType": "CC",
            "birthDate": "1990-01-15T00:00:00.000Z",
            "idoLimit": 0,
            "gender": "MALE",
            "address": "Calle 123 #45-67, Bogotá",
            "personalPhone": "+57 300 123 4567",
            "personalEmail": "strategee@yopmail.com",
            "corporateEmail": "strategee@yopmail.com",
            "photoUrl": "https://example.com/photos/employee.jpg",
            "isActive": true,
            "createdAt": "2026-02-11T02:19:27.859Z",
            "updatedAt": "2026-02-11T02:19:27.859Z"
        }
    })
    @ApiResponse({
        status: 409,
        description: 'Ya existe un empleado con este número de documento',
        examples: {
            documento_duplicado: {
                summary: 'Ya existe un empleado con este número de documento',
                value: {
                    "message": "Ya existe un empleado con este número de documento",
                    "error": "Conflict",
                    "statusCode": 409
                }
            },
            correo_duplicado: {
                summary: 'Ya existe un empleado con este correo electrónico',
                value: {
                    "message": "Ya existe un empleado con este correo electrónico",
                    "error": "Conflict",
                    "statusCode": 409
                }
            }
        },
    })
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    create(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.employeesService.create(createEmployeeDto);
    }


    @Get()
    @ApiOperation({ summary: 'Listar empleados con paginación' })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: 'Número de página (default: 1)',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Resultados por página (default: 10)',
    })
    @ApiQuery({
        name: 'search',
        required: false,
        type: String,
        description: 'Buscar por nombre o apellido',
    })
    @ApiQuery({
        name: 'hasCredentials',
        required: false,
        type: Boolean,
        description: 'Filtrar por empleados con o sin credenciales',
    })
    @ApiQuery({
        name: 'contractStatus',
        required: false,
        type: String,
        description: 'Filtrar por estado de contrato (ACTIVE, SUSPENDED, LIQUIDATED, DRAFT)',
    })
    @ApiQuery({
        name: 'companyId',
        required: false,
        type: String,
        description: 'Filtrar por empresa',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de empleados obtenida exitosamente',
    })
    findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('search') search?: string,
        @Query('hasCredentials') hasCredentials?: string,
        @Query('contractStatus') contractStatus?: string,
        @Query('companyId') companyId?: string,
        @Query('status') status?: string,
    ) {
        const hasCredentialsBool = hasCredentials === 'true' ? true : hasCredentials === 'false' ? false : undefined;
        return this.employeesService.findAll(page, limit, search, hasCredentialsBool, contractStatus, companyId,
            status === 'PENDING' ? EmployeeStatus.PENDING : EmployeeStatus.ACTIVE);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Obtener el perfil del empleado actual' })
    @ApiResponse({
        status: 200,
        description: 'Perfil del empleado encontrado',
    })
    @ApiResponse({
        status: 404,
        description: 'Perfil no encontrado',
    })
    findProfile(@ActiveUser('employeeId') employeeId: string) {
        if (!employeeId) {
            throw new NotFoundException('El usuario no tiene un empleado asociado');
        }
        return this.employeesService.findProfile(employeeId);
    }

    @Get('current-ido')
    @ApiOperation({ summary: 'Obtener el IDO actual del empleado desde la API externa' })
    @ApiResponse({
        status: 200,
        description: 'IDO obtenido exitosamente',
        example: {
            ido: 96.98,
            idoLimit: 90,
            meetsRequirement: true,
            consultedAt: '2026-03-12T10:30:00Z'
        }
    })
    @ApiResponse({
        status: 400,
        description: 'El empleado no tiene correo corporativo configurado',
    })
    @ApiResponse({
        status: 500,
        description: 'Error al consultar el IDO desde la API externa',
    })
    getMyIdo(@ActiveUser('employeeId') employeeId: string) {
        if (!employeeId) {
            throw new NotFoundException('El usuario no tiene un empleado asociado');
        }
        return this.employeesService.getEmployeeIdo(employeeId);
    }

    @Patch('my-contact-info')
    @Roles(Role.EMPLOYEE)
    @ApiOperation({ summary: 'Actualizar datos de contacto propios (dirección, teléfono, email personal)' })
    @ApiResponse({ status: 200, description: 'Datos de contacto actualizados exitosamente' })
    updateMyContactInfo(
        @ActiveUser() user: JwtPayload,
        @Body() dto: UpdateContactInfoDto,
    ) {
        if (!user.employeeId) throw new NotFoundException('El usuario no tiene un empleado asociado');
        return this.employeesService.updateContactInfo(user.employeeId, dto, user.sub);
    }

    @Get('my-contact-info/logs')
    @Roles(Role.EMPLOYEE)
    @ApiOperation({ summary: 'Ver historial de cambios de datos de contacto propios' })
    @ApiResponse({ status: 200, description: 'Historial de cambios' })
    getMyContactInfoLogs(@ActiveUser() user: JwtPayload) {
        if (!user.employeeId) throw new NotFoundException('El usuario no tiene un empleado asociado');
        return this.employeesService.getContactInfoLogs(user.employeeId);
    }

    @Get(':id/contact-info/logs')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Ver historial de cambios de datos de contacto de un empleado (admin)' })
    @ApiResponse({ status: 200, description: 'Historial de cambios' })
    getContactInfoLogs(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeesService.getContactInfoLogs(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener empleado por ID' })
    @ApiResponse({
        status: 200,
        description: 'Empleado encontrado',
    })
    @ApiResponse({
        status: 404,
        description: 'Empleado no encontrado',
    })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar datos personales del empleado' })
    @ApiResponse({
        status: 200,
        description: 'Empleado actualizado exitosamente',
    })
    @ApiResponse({
        status: 404,
        description: 'Empleado no encontrado',
    })
    @ApiResponse({
        status: 409,
        description: 'Ya existe un empleado con este número de documento',
    })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateEmployeeDto: UpdateEmployeeDto,
    ) {
        return this.employeesService.update(id, updateEmployeeDto);
    }



    @Post(':id/approve')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Aprobar solicitud de registro: activa al empleado y envía el correo de bienvenida' })
    approveRegistration(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeesService.approveRegistration(id);
    }

    @Post(':id/reject')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Rechazar solicitud de registro (elimina el registro pendiente)' })
    rejectRegistration(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeesService.rejectRegistration(id);
    }

    @Post(':id/credentials')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Otorgar acceso al sistema (crear credenciales)' })
    @ApiResponse({
        status: 200,
        description: 'Credenciales creadas y asignadas exitosamente',
        example: {
            "id": "37df3f1e-9ad4-4944-be0e-6b3dc3d745d3",
            "firstName": "Prueba",
            "lastName": "Probando",
            "documentNumber": "4433334432342",
            "documentType": "CC",
            "birthDate": "1990-01-14",
            "idoLimit": 0,
            "gender": "MALE",
            "address": "Calle 123 #45-67, Bogotá",
            "personalPhone": "+57 300 123 4567",
            "personalEmail": "strategee@yopmail.com",
            "corporateEmail": "strategee@yopmail.com",
            "photoUrl": "https://example.com/photos/employee.jpg",
            "isActive": true,
            "user": {
                "id": "192e2ee8-9c48-4a91-94bb-77fb246c3a89",
                "email": "strategee@yopmail.com",
                "roles": [
                    "EMPLOYEE"
                ],
                "isActive": true,
                "employeeId": null,
                "createdAt": "2026-02-11T04:17:58.060Z",
                "updatedAt": "2026-02-11T04:17:58.060Z"
            },
            "createdAt": "2026-02-11T02:19:27.859Z",
            "updatedAt": "2026-02-11T04:17:59.000Z"
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Este empleado ya tiene credenciales asignadas',
    })
    @ApiResponse({
        status: 404,
        description: 'Empleado no encontrado',
    })
    @ApiResponse({
        status: 409,
        description: 'El correo electrónico ya está registrado',
    })
    createCredentials(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() credentialsDto: CreateEmployeeCredentialsDto,
    ) {
        return this.employeesService.createCredentials(id, credentialsDto);
    }

    @Delete(':id/credentials')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Revocar acceso al sistema (eliminar credenciales)' })
    @ApiResponse({
        status: 204,
        description: 'Credenciales eliminadas exitosamente',
    })
    @ApiResponse({
        status: 400,
        description: 'Este empleado no tiene credenciales asignadas',
    })
    @ApiResponse({
        status: 404,
        description: 'Empleado no encontrado',
    })
    deleteCredentials(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeesService.deleteCredentials(id);
    }

    @Patch(':id/profile-photo')
    @ApiOperation({ summary: 'Actualizar foto de perfil del empleado' })
    @ApiResponse({
        status: 200,
        description: 'Foto de perfil actualizada exitosamente',
    })
    @ApiResponse({
        status: 404,
        description: 'Empleado no encontrado',
    })
    updateProfilePhoto(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('profilePhotoId') profilePhotoId: string | null,
    ) {
        return this.employeesService.updateProfilePhoto(id, profilePhotoId);
    }

    @Get(':id/settings')
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Obtener configuraciones del empleado' })
    @ApiResponse({ status: 200, description: 'Configuraciones del empleado' })
    @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
    getSettings(@Param('id', ParseUUIDPipe) id: string) {
        return this.employeesService.getSettings(id);
    }

    @Patch(':id/settings')
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Actualizar configuraciones del empleado' })
    @ApiResponse({ status: 200, description: 'Configuraciones actualizadas exitosamente' })
    @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
    updateSettings(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateEmployeeSettingsDto,
    ) {
        return this.employeesService.updateSettings(id, dto);
    }
}
