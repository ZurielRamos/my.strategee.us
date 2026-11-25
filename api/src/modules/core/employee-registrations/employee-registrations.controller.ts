import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeeRegistrationsService } from './employee-registrations.service';
import { SubmitRegistrationDto } from './dto/submit-registration.dto';
import { RegistrationRateLimitGuard } from './guards/registration-rate-limit.guard';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';

/** Endpoints públicos (sin autenticación). Protegidos por el token del enlace. */
@ApiTags('Employee Registration (public)')
@Controller('public/employee-registration')
export class PublicEmployeeRegistrationController {
    constructor(private readonly service: EmployeeRegistrationsService) { }

    @Get(':token/options')
    @ApiOperation({ summary: 'Valida el enlace y devuelve las opciones del formulario' })
    getOptions(@Param('token') token: string) {
        return this.service.getOptions(token);
    }

    @Post(':token')
    @UseGuards(RegistrationRateLimitGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Envía una solicitud de registro (queda pendiente de aprobación)' })
    submit(@Param('token') token: string, @Body() dto: SubmitRegistrationDto) {
        return this.service.submit(token, dto);
    }
}

/** Administración del enlace general de registro. */
@ApiTags('Employee Registration (admin)')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.ADMIN, Role.HR_MANAGER)
@Controller('employee-registration-link')
export class EmployeeRegistrationLinkController {
    constructor(private readonly service: EmployeeRegistrationsService) { }

    @Get()
    @ApiOperation({ summary: 'Obtiene el enlace de registro activo (o null)' })
    async get() {
        const link = await this.service.getActiveLink();
        return { token: link?.token ?? null };
    }

    @Post()
    @ApiOperation({ summary: 'Genera un enlace nuevo e invalida el anterior' })
    async generate() {
        const link = await this.service.generateLink();
        return { token: link.token };
    }

    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Desactiva el enlace de registro' })
    async disable() {
        await this.service.disableLink();
    }
}
