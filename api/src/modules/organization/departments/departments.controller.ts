import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
    @ApiOperation({ summary: 'Listar todos los departamentos/áreas' })
    @ApiResponse({ status: 200, description: 'Lista de departamentos', type: [Department] })
    findAll() {
        return this.departmentsService.findAll();
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
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(id);
    }
}
