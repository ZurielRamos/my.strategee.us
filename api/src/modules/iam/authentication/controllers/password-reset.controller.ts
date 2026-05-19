import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { PasswordResetService } from '../services/password-reset.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { ActiveUser } from '../../authorization/decorators/active-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class PasswordResetController {
    constructor(
        private readonly passwordResetService: PasswordResetService,
    ) { }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
    @ApiResponse({
        status: 200,
        description: 'Si el email existe, se enviará un correo con instrucciones',
        example: {
            message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Datos inválidos',
        example: {
            "message": "Si el correo existe, recibirás instrucciones para recuperar tu contraseña"
        }
    })
    async forgotPassword(
        @Body() forgotPasswordDto: ForgotPasswordDto,
    ): Promise<{ message: string }> {
        await this.passwordResetService.requestPasswordReset(
            forgotPasswordDto.email,
        );

        // Mismo mensaje siempre para no revelar si el email existe
        return {
            message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
        };
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restablecer contraseña con token' })
    @ApiBody({
        type: ResetPasswordDto,
        examples: {
            example1: {
                summary: 'Restablecer contraseña',
                description: 'Restablecer contraseña con token',
                value: {
                    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTNkNDNlNS02ZWRjLTQ2MjMtOGZiMC01NDg5ZTBmOWNmM2UiLCJlbWFpbCI6ImFkbWluQHN0cmF0ZWdlZS51cyIsInJvbGVzIjpbIkFETUlOIl0sImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3MDc0Mjk1NywiZXhwIjoxNzcwODI5MzU3fQ.TOUas4cl4fGmpVgbTXAsbmN3j3twI9rRE1zI1i8kH5o',
                    newPassword: 'newPassword',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Contraseña restablecida exitosamente',
        example: {
            message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión'
        }
    })
    @ApiResponse({
        status: 400,
        description: 'Token inválido o expirado',
        example: {
            message: "Token inválido o expirado",
            error: "Bad Request",
            statusCode: 400
        }
    })
    async resetPassword(
        @Body() resetPasswordDto: ResetPasswordDto,
    ): Promise<{ message: string }> {
        await this.passwordResetService.resetPassword(
            resetPasswordDto.token,
            resetPasswordDto.newPassword,
        );

        return {
            message: 'Contraseña restablecida exitosamente. Por favor, inicia sesión',
        };
    }

    @Post('change-password')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cambiar contraseña (requiere autenticación)' })
    @ApiResponse({
        status: 200,
        description: 'Contraseña cambiada exitosamente',
    })
    @ApiResponse({
        status: 401,
        description: 'Contraseña actual incorrecta',
    })
    async changePassword(
        @ActiveUser('sub') userId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        await this.passwordResetService.changePassword(
            userId,
            changePasswordDto.currentPassword,
            changePasswordDto.newPassword,
        );

        return {
            message: 'Contraseña cambiada exitosamente. Por seguridad, debes volver a iniciar sesión',
        };
    }
}
