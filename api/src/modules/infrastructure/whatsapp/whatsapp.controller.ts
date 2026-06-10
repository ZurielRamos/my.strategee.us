import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { UpdateWhatsappConfigDto } from './dto/update-whatsapp-config.dto';
import { CreateWhatsappDeviceDto } from './dto/create-whatsapp-device.dto';
import { AccessTokenGuard } from '../../iam/authentication/guards/access-token.guard';
import { RolesGuard } from '../../iam/authorization/guards/roles.guard';
import { Roles } from '../../iam/authorization/decorators/roles.decorator';
import { Role } from '../../iam/authorization/enums/role.enum';

@ApiTags('WhatsApp')
@Controller('whatsapp')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.ADMIN)
export class WhatsappController {
    constructor(private readonly whatsappService: WhatsappService) {}

    // ===================== CONFIG =====================

    @Get('config')
    @ApiOperation({ summary: 'Obtener configuración de WhatsApp (Evolution API)' })
    @ApiResponse({ status: 200, description: 'Configuración obtenida' })
    getConfig() {
        return this.whatsappService.getConfig();
    }

    @Patch('config')
    @ApiOperation({ summary: 'Actualizar configuración de WhatsApp (Evolution API)' })
    @ApiResponse({ status: 200, description: 'Configuración actualizada' })
    updateConfig(@Body() dto: UpdateWhatsappConfigDto) {
        return this.whatsappService.updateConfig(dto);
    }

    // ===================== DEVICES =====================

    @Get('devices')
    @ApiOperation({ summary: 'Listar dispositivos de WhatsApp' })
    @ApiResponse({ status: 200, description: 'Lista de dispositivos' })
    findAllDevices() {
        return this.whatsappService.findAllDevices();
    }

    @Post('devices')
    @ApiOperation({ summary: 'Crear un nuevo dispositivo de WhatsApp' })
    @ApiResponse({ status: 201, description: 'Dispositivo creado' })
    createDevice(@Body() dto: CreateWhatsappDeviceDto) {
        return this.whatsappService.createDevice(dto);
    }

    @Get('devices/:id/status')
    @ApiOperation({ summary: 'Obtener estado de conexión de un dispositivo' })
    @ApiResponse({ status: 200, description: 'Estado del dispositivo' })
    getDeviceStatus(@Param('id') id: string) {
        return this.whatsappService.getDeviceStatus(id);
    }

    @Get('devices/:id/qr')
    @ApiOperation({ summary: 'Generar QR de conexión para un dispositivo' })
    @ApiResponse({ status: 200, description: 'QR generado en base64' })
    getDeviceQr(@Param('id') id: string) {
        return this.whatsappService.getDeviceQr(id);
    }

    @Delete('devices/:id')
    @ApiOperation({ summary: 'Eliminar un dispositivo de WhatsApp' })
    @ApiResponse({ status: 200, description: 'Dispositivo eliminado' })
    deleteDevice(@Param('id') id: string) {
        return this.whatsappService.deleteDevice(id);
    }
}
