import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompensationService } from './compensation.service';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { Compensation } from './entities/compensation.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('Compensation')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('compensation')
export class CompensationController {
    constructor(private readonly compensationService: CompensationService) { }

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear una compensación/ingreso adicional' })
    @ApiResponse({ status: 201, description: 'Compensación creada exitosamente', type: Compensation })
    create(@Body() createCompensationDto: CreateCompensationDto) {
        return this.compensationService.create(createCompensationDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar todas las compensaciones con valor calculado' })
    findAll() {
        return this.compensationService.findAll();
    }

    @Get('employee/:id/active')
    @Roles(Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE) // Employee can see their own? Add logic? For now strict role check.
    @ApiOperation({ summary: 'Obtener compensaciones vigentes de un empleado con valor calculado' })
    findActiveByEmployee(@Param('id') employeeId: string) {
        return this.compensationService.findActiveByEmployee(employeeId);
    }

    @Get('employee/:id/all')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener todas las compensaciones de un empleado (historial completo)' })
    findAllByEmployee(@Param('id') employeeId: string) {
        return this.compensationService.findAllByEmployee(employeeId);
    }

    @Patch(':id/cancel')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Cancelar una compensación' })
    cancel(@Param('id') id: string) {
        return this.compensationService.cancel(id);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener una compensación por ID' })
    findOne(@Param('id') id: string) {
        return this.compensationService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar una compensación' })
    update(@Param('id') id: string, @Body() updateCompensationDto: UpdateCompensationDto) {
        return this.compensationService.update(id, updateCompensationDto);
    }

    // NOTA: Este endpoint solo debe usarse en casos excepcionales por administradores
    // En operaciones normales, usar el endpoint /cancel para marcar como cancelada
    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar físicamente una compensación (solo para casos excepcionales)' })
    remove(@Param('id') id: string) {
        return this.compensationService.remove(id);
    }
}
