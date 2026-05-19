import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GlobalParametersService } from './global-parameters.service';
import { CreateGlobalParameterDto } from './dto/create-global-parameter.dto';
import { UpdateGlobalParameterDto } from './dto/update-global-parameter.dto';
import { GlobalParameter } from './entities/global-parameter.entity';
import { GlobalParameterKey } from './enums/global-parameter-key.enum';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('Global Parameters')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('global-parameters')
export class GlobalParametersController {
    constructor(private readonly globalParametersService: GlobalParametersService) { }

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear un parámetro global' })
    @ApiResponse({ status: 201, description: 'Parámetro creado exitosamente', type: GlobalParameter })
    create(@Body() createGlobalParameterDto: CreateGlobalParameterDto) {
        return this.globalParametersService.create(createGlobalParameterDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar parámetros vigentes (únicos por clave)' })
    @ApiResponse({ status: 200, description: 'Lista de parámetros vigentes', type: [GlobalParameter] })
    findAll() {
        return this.globalParametersService.findAll();
    }

    @Get('current-value')
    @Roles(Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Obtener el valor vigente de un parámetro' })
    @ApiQuery({ name: 'key', type: String })
    @ApiQuery({ name: 'date', required: false, description: 'Fecha de consulta (YYYY-MM-DD)' })
    @ApiResponse({ status: 200, description: 'Valor vigente', type: Number })
    async getValue(
        @Query('key') key: string,
        @Query('date') dateString?: string,
    ) {
        // Ensure key is properly decoded (e.g., "Salario%20Minimo" -> "Salario Minimo")
        const decodedKey = decodeURIComponent(key);
        const date = dateString ? new Date(dateString) : new Date();
        const value = await this.globalParametersService.getValue(decodedKey, date);
        return { value };
    }

    @Get(':key/history')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener historial de un parámetro' })
    @ApiResponse({ status: 200, description: 'Historial del parámetro', type: [GlobalParameter] })
    getHistory(@Param('key') key: string) {
        return this.globalParametersService.findHistoryByKey(key);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener un parámetro por ID' })
    @ApiResponse({ status: 200, description: 'Parámetro encontrado', type: GlobalParameter })
    findOne(@Param('id') id: string) {
        return this.globalParametersService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Actualizar un parámetro' })
    @ApiResponse({ status: 200, description: 'Parámetro actualizado', type: GlobalParameter })
    update(@Param('id') id: string, @Body() updateGlobalParameterDto: UpdateGlobalParameterDto) {
        return this.globalParametersService.update(id, updateGlobalParameterDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar un parámetro' })
    @ApiResponse({ status: 200, description: 'Parámetro eliminado' })
    remove(@Param('id') id: string) {
        return this.globalParametersService.remove(id);
    }
}
