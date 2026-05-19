import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ParafiscalesService } from './parafiscales.service';
import { UpsertParafiscalesDto } from './dto/upsert-parafiscales.dto';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';

@ApiTags('Parafiscales')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('parafiscales')
export class ParafiscalesController {
    constructor(private readonly parafiscalesService: ParafiscalesService) {}

    @Get(':employeeId')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Obtener configuración de parafiscales de un empleado' })
    findByEmployee(@Param('employeeId') employeeId: string) {
        return this.parafiscalesService.findByEmployee(employeeId);
    }

    @Put(':employeeId')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Crear o actualizar configuración de parafiscales de un empleado' })
    upsert(
        @Param('employeeId') employeeId: string,
        @Body() dto: UpsertParafiscalesDto,
    ) {
        return this.parafiscalesService.upsert(employeeId, dto);
    }
}
