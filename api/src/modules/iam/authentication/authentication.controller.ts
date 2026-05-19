import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { SignInDto } from './dto/sign-in.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { ActiveUser } from '../authorization/decorators/active-user.decorator';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthenticationController {
    constructor(private readonly authenticationService: AuthenticationService) { }

    // @Post('sign-up')
    // @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    // @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
    // @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
    // signUp(@Body() signUpDto: SignUpDto) {
    //     return this.authenticationService.signUp(signUpDto);
    // }

    @Post('check-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verificar si un correo está registrado' })
    @ApiResponse({ status: 200, description: 'Correo registrado' })
    @ApiResponse({ status: 404, description: 'Correo no registrado' })
    async checkEmail(@Body('email') email: string) {
        const exists = await this.authenticationService.checkEmail(email);
        if (!exists) {
            throw new NotFoundException('El correo no está registrado');
        }
        return { exists: true };
    }

    @Post('sign-in')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Iniciar sesión' })
    @ApiResponse({
        status: 200,
        description: 'Inicio de sesión exitoso',
        example: {
            "user": {
                "id": "d93d43e5-6edc-4623-8fb0-5489e0f9cf3e",
                "email": "admin@strategee.us",
                "roles": [
                    "ADMIN"
                ]
            },
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTNkNDNlNS02ZWRjLTQ2MjMtOGZiMC01NDg5ZTBmOWNmM2UiLCJlbWFpbCI6ImFkbWluQHN0cmF0ZWdlZS51cyIsInJvbGVzIjpbIkFETUlOIl0sImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3MDc0MTgyOCwiZXhwIjoxNzcwODI4MjI4fQ.aMM1xihIorYmOyei782OjTpiTu3ut9PI6qkxeHjf8wg",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTNkNDNlNS02ZWRjLTQ2MjMtOGZiMC01NDg5ZTBmOWNmM2UiLCJlbWFpbCI6ImFkbWluQHN0cmF0ZWdlZS51cyIsInJvbGVzIjpbIkFETUlOIl0sImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3MDc0MTgyOCwiZXhwIjoxNzcxMzQ2NjI4fQ.IZZxdnAte82lhs4wRwIuQFKXK0TaCqbc5_dd9hMDSSE"
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciales inválidas',
        example: {
            "message": "Credenciales inválidas",
            "error": "Unauthorized",
            "statusCode": 401
        }
    })
    signIn(@Body() signInDto: SignInDto, @Req() request: Request) {
        return this.authenticationService.signIn(signInDto, request);
    }

    @Post('refresh')
    @UseGuards(RefreshTokenGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refrescar tokens de acceso' })
    @ApiResponse({
        status: 200,
        description: 'Tokens refrescados exitosamente',
        example: {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTNkNDNlNS02ZWRjLTQ2MjMtOGZiMC01NDg5ZTBmOWNmM2UiLCJlbWFpbCI6ImFkbWluQHN0cmF0ZWdlZS51cyIsInJvbGVzIjpbIkFETUlOIl0sImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3MDc0Mjk1NywiZXhwIjoxNzcwODI5MzU3fQ.TOUas4cl4fGmpVgbTXAsbmN3j3twI9rRE1zI1i8kH5o",
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTNkNDNlNS02ZWRjLTQ2MjMtOGZiMC01NDg5ZTBmOWNmM2UiLCJlbWFpbCI6ImFkbWluQHN0cmF0ZWdlZS51cyIsInJvbGVzIjpbIkFETUlOIl0sImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3MDc0Mjk1NywiZXhwIjoxNzcxMzQ3NzU3fQ.BkSpg-Mp-Dx_8cOJ4-B4bKszB-Cx11JGY8UKqTpyDQo"
        }
    })
    @ApiResponse({
        status: 401, description: 'Refresh token inválido',
        example: {
            "message": "Refresh token inválido",
            "error": "Unauthorized",
            "statusCode": 401
        }
    })
    refreshTokens(
        @Body() refreshTokenDto: RefreshTokenDto,
    ) {
        return this.authenticationService.refreshTokens(
            refreshTokenDto.refreshToken,
        );
    }

    @Post('logout')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cerrar sesión' })
    @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
    async logout(
        @ActiveUser('sessionId') sessionId: string,
        @ActiveUser('sub') userId: string,
    ) {
        if (sessionId && userId) {
            await this.authenticationService.logout(sessionId, userId);
        }
        return { message: 'Sesión cerrada exitosamente' };
    }

    @Post('change-password')
    @UseGuards(AccessTokenGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cambiar contraseña' })
    @ApiResponse({
        status: 200,
        description: 'Contraseña cambiada exitosamente',
        example: {
            message: 'Contraseña cambiada exitosamente'
        }
    })
    @ApiResponse({
        status: 401,
        description: 'Contraseña actual incorrecta',
        example: {
            message: 'La contraseña actual es incorrecta',
            error: 'Unauthorized',
            statusCode: 401
        }
    })
    async changePassword(
        @ActiveUser('sub') userId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        await this.authenticationService.changePassword(userId, changePasswordDto);
        return { message: 'Contraseña cambiada exitosamente' };
    }

}