import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BahamasService } from './bahamas.service';
import { UpdateBahamasConfigDto } from './dto/update-bahamas-config.dto';
import { BahamasConfig } from './entities/bahamas-config.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('Bahamas')
@Controller('bahamas/config')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
export class BahamasController {
    constructor(private readonly bahamasService: BahamasService) {}

    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Obtener configuración de Bahamas' })
    @ApiResponse({ status: 200, description: 'Configuración obtenida', type: BahamasConfig })
    getConfig() {
        return this.bahamasService.getConfig();
    }

    @Patch()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Actualizar configuración de Bahamas' })
    @ApiResponse({ status: 200, description: 'Configuración actualizada', type: BahamasConfig })
    updateConfig(@Body() updateDto: UpdateBahamasConfigDto) {
        return this.bahamasService.updateConfig(updateDto);
    }
}
