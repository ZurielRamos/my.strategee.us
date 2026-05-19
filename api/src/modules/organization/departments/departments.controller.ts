import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('Departments')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear un nuevo departamento/área' })
    @ApiResponse({ status: 201, description: 'Departamento creado exitosamente', type: Department })
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar todos los departamentos, opcionalmente filtrados por empresa' })
    @ApiQuery({ name: 'companyId', required: false, description: 'Filtrar por ID de empresa' })
    @ApiResponse({ status: 200, description: 'Lista de departamentos', type: [Department] })
    findAll(@Query('companyId') companyId?: string) {
        return this.departmentsService.findAll(companyId);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener un departamento por ID' })
    @ApiResponse({ status: 200, description: 'Departamento encontrado', type: Department })
    @ApiResponse({ status: 404, description: 'Departamento no encontrado' })
    findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar un departamento' })
    @ApiResponse({ status: 200, description: 'Departamento actualizado', type: Department })
    update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar un departamento' })
    @ApiResponse({ status: 200, description: 'Departamento eliminado' })
    @ApiResponse({
        status: 409,
        description: 'No se puede eliminar - tiene dependencias',
        schema: {
            example: {
                statusCode: 409,
                message: 'No se puede eliminar el departamento porque está siendo utilizado',
                error: 'Conflict',
                dependencies: [
                    {
                        entity: 'positions',
                        count: 8,
                        examples: ['Desarrollador Senior', 'Analista de Datos', 'Gerente de Proyecto']
                    }
                ]
            }
        }
    })
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(id);
    }
}
