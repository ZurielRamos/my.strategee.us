import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConflictResponse } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Schedule } from './entities/schedule.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';
import { ApiExamplesResponse } from '@common/decorators/api-examples.decorator';
import { ScheduleConflictExamples, ScheduleCreatedExamples } from './utils/schedules.examples';

import { ScheduleResponseDto } from './dto/schedule-response.dto';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('schedules')
export class SchedulesController {
    constructor(private readonly schedulesService: SchedulesService) { }

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear un nuevo horario' })
    @ApiExamplesResponse(201, ScheduleResponseDto, { ...ScheduleCreatedExamples }, { description: 'Horario creado exitosamente' })
    @ApiConflictResponse({ description: 'Ya existe un horario con este nombre', examples: ScheduleConflictExamples })
    create(@Body() createScheduleDto: CreateScheduleDto) {
        return this.schedulesService.create(createScheduleDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar todos los horarios' })
    @ApiExamplesResponse(200, ScheduleResponseDto, { ...ScheduleCreatedExamples }, { description: 'Lista de horarios' })
    findAll() {
        return this.schedulesService.findAll();
    }

    @Get('active')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar solo horarios activos' })
    @ApiExamplesResponse(200, ScheduleResponseDto, { ...ScheduleCreatedExamples }, { description: 'Lista de horarios activos' })
    findAllActive() {
        return this.schedulesService.findAllActive();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener un horario por ID' })
    @ApiExamplesResponse(200, ScheduleResponseDto, ScheduleCreatedExamples, { description: 'Horario encontrado' })
    @ApiResponse({ status: 404, description: 'Horario no encontrado' })
    findOne(@Param('id') id: string) {
        return this.schedulesService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar un horario' })
    @ApiResponse({ status: 200, description: 'Horario actualizado', type: ScheduleResponseDto })
    @ApiResponse({ status: 404, description: 'Horario no encontrado' })
    update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto) {
        return this.schedulesService.update(id, updateScheduleDto);
    }

    @Patch(':id/toggle-active')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Activar/Desactivar un horario' })
    @ApiResponse({ status: 200, description: 'Estado del horario actualizado', type: ScheduleResponseDto })
    toggleActive(@Param('id') id: string) {
        return this.schedulesService.toggleActive(id);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar un horario' })
    @ApiResponse({ status: 200, description: 'Horario eliminado' })
    @ApiResponse({
        status: 409,
        description: 'No se puede eliminar - tiene dependencias',
        schema: {
            example: {
                statusCode: 409,
                message: 'No se puede eliminar el horario porque está siendo utilizado',
                error: 'Conflict',
                dependencies: [
                    {
                        entity: 'memorandums',
                        count: 3,
                        examples: [
                            'Memorando de Juan Pérez',
                            'Memorando de María López',
                            'Memorando de Carlos García',
                        ],
                    },
                ],
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Horario no encontrado' })
    remove(@Param('id') id: string) {
        return this.schedulesService.remove(id);
    }
}
