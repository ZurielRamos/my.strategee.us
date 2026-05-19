import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('Positions')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('positions')
export class PositionsController {
    constructor(private readonly positionsService: PositionsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear un nuevo cargo' })
    @ApiResponse({ status: 201, description: 'Cargo creado exitosamente', type: Position })
    create(@Body() createPositionDto: CreatePositionDto) {
        return this.positionsService.create(createPositionDto);
    }

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Listar todos los cargos, opcionalmente filtrados por departamento' })
    @ApiQuery({ name: 'departmentId', required: false, description: 'Filtrar por ID de departamento' })
    @ApiResponse({ status: 200, description: 'Lista de cargos', type: [Position] })
    findAll(@Query('departmentId') departmentId?: string) {
        return this.positionsService.findAll(departmentId);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener un cargo por ID' })
    @ApiResponse({ status: 200, description: 'Cargo encontrado', type: Position })
    @ApiResponse({ status: 404, description: 'Cargo no encontrado' })
    findOne(@Param('id') id: string) {
        return this.positionsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar un cargo' })
    @ApiResponse({ status: 200, description: 'Cargo actualizado', type: Position })
    update(@Param('id') id: string, @Body() updatePositionDto: UpdatePositionDto) {
        return this.positionsService.update(id, updatePositionDto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar un cargo' })
    @ApiResponse({ status: 200, description: 'Cargo eliminado' })
    @ApiResponse({
        status: 409,
        description: 'No se puede eliminar - tiene dependencias',
        schema: {
            example: {
                statusCode: 409,
                message: 'No se puede eliminar el cargo porque está siendo utilizado',
                error: 'Conflict',
                dependencies: [
                    {
                        entity: 'contracts',
                        count: 5,
                        examples: ['Contrato de Juan Pérez', 'Contrato de María López', 'Contrato de Carlos García']
                    }
                ]
            }
        }
    })
    remove(@Param('id') id: string) {
        return this.positionsService.remove(id);
    }
}
