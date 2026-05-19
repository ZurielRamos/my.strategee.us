import {
    Controller,
    Post,
    Put,
    Get,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { DeviceTokenService } from './device-token.service';
import { PushNotificationService } from './push-notification.service';
import {
    RegisterTokenDto,
    UpdateTokenDto,
    DeactivateTokenDto,
    SendTestNotificationDto,
    PushSettingsResponseDto,
} from './dto';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { Platform } from './enums/platform.enum';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('push-settings')
export class PushSettingsController {
    constructor(
        private deviceTokenService: DeviceTokenService,
        private pushNotificationService: PushNotificationService,
    ) {}

    @Post('register')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Registrar token de dispositivo para notificaciones push' })
    @ApiResponse({
        status: 201,
        description: 'Token registrado exitosamente',
    })
    @ApiResponse({
        status: 400,
        description: 'Datos de entrada inválidos',
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async registerToken(
        @ActiveUser('employeeId') employeeId: string,
        @Body() dto: RegisterTokenDto,
    ): Promise<void> {
        await this.deviceTokenService.registerToken(
            employeeId,
            dto.fcmToken,
            dto.platform,
        );
    }

    @Put('update')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Actualizar token de dispositivo' })
    @ApiResponse({
        status: 200,
        description: 'Token actualizado exitosamente',
    })
    @ApiResponse({
        status: 400,
        description: 'Datos de entrada inválidos',
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async updateToken(
        @ActiveUser('employeeId') employeeId: string,
        @Body() dto: UpdateTokenDto,
    ): Promise<void> {
        await this.deviceTokenService.updateToken(
            employeeId,
            dto.oldToken,
            dto.newToken,
        );
    }

    @Post('deactivate')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Desactivar token de dispositivo' })
    @ApiResponse({
        status: 204,
        description: 'Token desactivado exitosamente',
    })
    @ApiResponse({
        status: 400,
        description: 'Datos de entrada inválidos',
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async deactivateToken(
        @ActiveUser('employeeId') employeeId: string,
        @Body() dto: DeactivateTokenDto,
    ): Promise<void> {
        await this.deviceTokenService.deactivateToken(
            employeeId,
            dto.fcmToken,
        );
    }

    @Get('status')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener estado de notificaciones push para el dispositivo actual' })
    @ApiResponse({
        status: 200,
        description: 'Estado obtenido exitosamente',
        type: PushSettingsResponseDto,
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async getStatus(
        @ActiveUser('employeeId') employeeId: string,
        @Query('fcmToken') fcmToken: string,
    ): Promise<PushSettingsResponseDto> {
        const token = await this.deviceTokenService.getTokenStatus(
            employeeId,
            fcmToken,
        );

        return {
            enabled: token?.active || false,
            platform: token?.platform || Platform.WEB,
            lastNotificationAt: token?.lastUsedAt || undefined,
            permissionStatus: token?.active ? 'granted' : 'default',
        };
    }

    @Post('test')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Enviar notificación push de prueba' })
    @ApiResponse({
        status: 200,
        description: 'Notificación de prueba enviada exitosamente',
    })
    @ApiResponse({
        status: 400,
        description: 'Datos de entrada inválidos',
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async sendTestNotification(
        @ActiveUser('employeeId') employeeId: string,
        @Body() dto: SendTestNotificationDto,
    ): Promise<void> {
        await this.pushNotificationService.sendTestNotification(
            employeeId,
            dto.fcmToken,
        );
    }

    @Post('logout')
    @Roles(Role.EMPLOYEE, Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Desactivar todos los tokens al cerrar sesión' })
    @ApiResponse({
        status: 204,
        description: 'Todos los tokens desactivados exitosamente',
    })
    @ApiResponse({
        status: 401,
        description: 'No autenticado',
    })
    async logout(@ActiveUser('employeeId') employeeId: string): Promise<void> {
        await this.deviceTokenService.deactivateAllTokensForEmployee(
            employeeId,
        );
    }
}
