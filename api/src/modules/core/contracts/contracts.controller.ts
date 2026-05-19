import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateMemorandumDto } from './dto/create-memorandum.dto';
import { Contract } from './entities/contract.entity';
import { Memorandum } from './entities/memorandum.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';
import { ActiveUser } from '../../iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '../../iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Contracts')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) { }

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Crear un nuevo contrato con memorandum inicial' })
    @ApiResponse({ status: 201, description: 'Contrato creado exitosamente', type: Contract })
    create(@Body() createContractDto: CreateContractDto) {
        return this.contractsService.create(createContractDto);
    }

    @Get('my-active')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener el contrato activo del empleado autenticado' })
    @ApiResponse({ status: 200, description: 'Contrato activo del empleado', type: Contract })
    getMyActiveContract(@ActiveUser() user: JwtPayload) {
        if (!user.employeeId) {
            return null;
        }
        return this.contractsService.findActiveByEmployee(user.employeeId);
    }

    @Get()
    @ApiResponse({ status: 200, description: 'Lista de contratos', type: [Contract] })
    findAll() {
        return this.contractsService.findAll();
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener un contrato por ID con salario inyectado' })
    @ApiResponse({ status: 200, description: 'Contrato encontrado con detalle actual', type: Contract })
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(id);
    }

    @Get('employee/:id/all')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener todos los contratos de un empleado (historial completo)' })
    findAllByEmployee(@Param('id') employeeId: string) {
        return this.contractsService.findAllByEmployee(employeeId);
    }

    @Patch(':id/cancel')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Cancelar/Liquidar un contrato' })
    cancel(@Param('id') id: string) {
        return this.contractsService.cancel(id);
    }

    @Patch(':id/activate')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Activar un contrato (liquida el contrato activo previo si existe)' })
    activate(@Param('id') id: string) {
        return this.contractsService.activate(id);
    }

    @Patch(':id/suspend')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Suspender un contrato activo' })
    suspend(@Param('id') id: string) {
        return this.contractsService.suspend(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar datos básicos del contrato' })
    @ApiResponse({ status: 200, description: 'Contrato actualizado', type: Contract })
    update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
        return this.contractsService.update(id, updateContractDto);
    }

    @Post(':id/memorandums')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Agregar un nuevo memorandum (cambio de cargo/salario) al contrato' })
    @ApiResponse({ status: 201, description: 'Memorandum agregado', type: Memorandum })
    addMemorandum(@Param('id') id: string, @Body() createMemorandumDto: CreateMemorandumDto) {
        return this.contractsService.addMemorandum(id, createMemorandumDto);
    }

    @Delete('memorandums/:memorandumId')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Eliminar un memorandum pendiente' })
    @ApiResponse({ status: 200, description: 'Memorandum eliminado' })
    deleteMemorandum(@Param('memorandumId') memorandumId: string) {
        return this.contractsService.deleteMemorandum(memorandumId);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Eliminar un contrato' })
    @ApiResponse({ status: 200, description: 'Contrato eliminado' })
    remove(@Param('id') id: string) {
        return this.contractsService.remove(id);
    }
}
