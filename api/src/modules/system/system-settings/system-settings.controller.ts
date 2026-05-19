import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemSettingsService } from './system-settings.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SystemSettings } from './entities/system-settings.entity';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('System Settings')
@Controller('system-settings')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
export class SystemSettingsController {
    constructor(private readonly systemSettingsService: SystemSettingsService) {}

    @Get()
    @Roles(Role.ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Obtener configuraciones del sistema' })
    @ApiResponse({ status: 200, description: 'Configuraciones obtenidas', type: SystemSettings })
    getSettings() {
        return this.systemSettingsService.getSettings();
    }

    @Patch()
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Actualizar configuraciones del sistema' })
    @ApiResponse({ status: 200, description: 'Configuraciones actualizadas', type: SystemSettings })
    updateSettings(@Body() updateDto: UpdateSystemSettingsDto) {
        return this.systemSettingsService.updateSettings(updateDto);
    }
}
