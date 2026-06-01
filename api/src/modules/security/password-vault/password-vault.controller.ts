import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PasswordVaultService } from './password-vault.service';
import { CreateVaultDto } from './dto/create-vault.dto';
import { UpdateVaultDto } from './dto/update-vault.dto';
import { Vault } from './entities/vault.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { CredentialFilterDto } from './dto/credential-filter.dto';
import { Credential } from './entities/credential.entity';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';

@ApiTags('Password Vault')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('password-vault')
export class PasswordVaultController {
    constructor(private readonly passwordVaultService: PasswordVaultService) {}

    @Post('vaults')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear un nuevo vault' })
    @ApiResponse({ status: 201, description: 'Vault creado exitosamente', type: Vault })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @ApiResponse({ status: 403, description: 'Empleado no activo' })
    @ApiResponse({ status: 404, description: 'Empleado no encontrado' })
    async createVault(
        @ActiveUser('employeeId') employeeId: string,
        @Body() createVaultDto: CreateVaultDto,
    ): Promise<Vault> {
        return this.passwordVaultService.createVault(employeeId, createVaultDto);
    }

    @Get('vaults')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar vaults del empleado autenticado' })
    @ApiResponse({ status: 200, description: 'Lista de vaults', type: [Vault] })
    async findAllVaults(
        @ActiveUser('employeeId') employeeId: string,
        @Query('search') search?: string,
    ): Promise<Vault[]> {
        return this.passwordVaultService.findAllVaults(employeeId, search);
    }

    @Get('vaults/:id')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener detalle de un vault' })
    @ApiResponse({ status: 200, description: 'Detalle del vault', type: Vault })
    @ApiResponse({ status: 404, description: 'Vault no encontrado' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para acceder a este vault' })
    async findOneVault(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') id: string,
    ): Promise<Vault> {
        return this.passwordVaultService.findOneVault(employeeId, id);
    }

    @Patch('vaults/:id')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar un vault' })
    @ApiResponse({ status: 200, description: 'Vault actualizado exitosamente', type: Vault })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar este vault' })
    @ApiResponse({ status: 404, description: 'Vault no encontrado' })
    async updateVault(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') id: string,
        @Body() updateVaultDto: UpdateVaultDto,
    ): Promise<Vault> {
        return this.passwordVaultService.updateVault(employeeId, id, updateVaultDto);
    }

    @Delete('vaults/:id')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Eliminar un vault vacío' })
    @ApiResponse({ status: 200, description: 'Vault eliminado exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar este vault' })
    @ApiResponse({ status: 404, description: 'Vault no encontrado' })
    @ApiResponse({ status: 409, description: 'El vault contiene credenciales y no puede ser eliminado' })
    async deleteVault(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') id: string,
    ): Promise<void> {
        return this.passwordVaultService.deleteVault(employeeId, id);
    }

    // Credential endpoints

    @Post('credentials')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear una nueva credencial' })
    @ApiResponse({ status: 201, description: 'Credencial creada exitosamente', type: Credential })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @ApiResponse({ status: 403, description: 'Empleado no activo' })
    @ApiResponse({ status: 404, description: 'Empleado, vault o entidades de visibilidad no encontrados' })
    async createCredential(
        @ActiveUser('employeeId') employeeId: string,
        @Body() createCredentialDto: CreateCredentialDto,
    ): Promise<Credential> {
        return this.passwordVaultService.createCredential(employeeId, createCredentialDto);
    }

    @Get('credentials')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar credenciales accesibles para el empleado autenticado' })
    @ApiResponse({ status: 200, description: 'Lista de credenciales accesibles', type: [Credential] })
    async findAllCredentials(
        @ActiveUser('employeeId') employeeId: string,
        @Query() filters: CredentialFilterDto,
    ): Promise<{ data: Credential[]; total: number; page: number; limit: number }> {
        return this.passwordVaultService.findAllCredentials(employeeId, filters);
    }

    @Get('credentials/:id')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener detalle de una credencial' })
    @ApiResponse({ status: 200, description: 'Detalle de la credencial', type: Credential })
    @ApiResponse({ status: 403, description: 'No tienes permisos para acceder a esta credencial' })
    @ApiResponse({ status: 404, description: 'Credencial no encontrada' })
    async findOneCredential(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') id: string,
    ): Promise<Credential> {
        return this.passwordVaultService.findOneCredential(employeeId, id);
    }

    @Patch('credentials/:id')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar una credencial' })
    @ApiResponse({ status: 200, description: 'Credencial actualizada exitosamente', type: Credential })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para actualizar esta credencial' })
    @ApiResponse({ status: 404, description: 'Credencial no encontrada' })
    async updateCredential(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') id: string,
        @Body() updateCredentialDto: UpdateCredentialDto,
    ): Promise<Credential> {
        return this.passwordVaultService.updateCredential(employeeId, id, updateCredentialDto);
    }

    @Get('credentials/:id/access-logs')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar logs de acceso de una credencial específica' })
    @ApiResponse({ status: 200, description: 'Lista de logs de acceso de la credencial' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para ver estos logs' })
    @ApiResponse({ status: 404, description: 'Credencial no encontrada' })
    async findCredentialAccessLogs(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') credentialId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<any[]> {
        return this.passwordVaultService.findCredentialAccessLogs(
            employeeId,
            credentialId,
            page || 1,
            limit || 50,
        );
    }

    @Delete('credentials/:id')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Eliminar una credencial' })
    @ApiResponse({ status: 200, description: 'Credencial eliminada exitosamente' })
    @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar esta credencial' })
    @ApiResponse({ status: 404, description: 'Credencial no encontrada' })
    async deleteCredential(
        @ActiveUser('employeeId') employeeId: string,
        @Param('id') id: string,
    ): Promise<void> {
        return this.passwordVaultService.deleteCredential(employeeId, id);
    }

    // Audit endpoints

    @Get('access-logs')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar logs de acceso a credenciales del empleado propietario' })
    @ApiResponse({ 
        status: 200, 
        description: 'Lista paginada de logs de acceso a credenciales del empleado propietario',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            credentialId: { type: 'string', format: 'uuid' },
                            employeeId: { type: 'string', format: 'uuid' },
                            accessedAt: { type: 'string', format: 'date-time' },
                            credential: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    title: { type: 'string' },
                                    serviceUrl: { type: 'string' },
                                },
                            },
                            employee: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
            },
        },
    })
    async findAccessLogs(
        @ActiveUser('employeeId') employeeId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        return this.passwordVaultService.findAccessLogs(
            employeeId,
            page || 1,
            limit || 10,
        );
    }
}
