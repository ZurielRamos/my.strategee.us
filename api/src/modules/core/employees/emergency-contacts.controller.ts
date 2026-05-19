import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    ParseUUIDPipe,
    UseGuards,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';
import { EmergencyContactsService } from './emergency-contacts.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';

@ApiTags('Emergency Contacts')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('emergency-contacts')
export class EmergencyContactsController {
    constructor(private readonly service: EmergencyContactsService) {}

    // ── Rutas del empleado (sobre sus propios contactos) ──────────────────────

    @Get('my')
    @Roles(Role.EMPLOYEE)
    @ApiOperation({ summary: 'Obtener mis contactos de emergencia' })
    getMyContacts(@ActiveUser() user: JwtPayload) {
        if (!user.employeeId) throw new BadRequestException('El usuario no tiene un empleado asociado');
        return this.service.findByEmployee(user.employeeId);
    }

    @Post('my')
    @Roles(Role.EMPLOYEE)
    @ApiOperation({ summary: 'Agregar un contacto de emergencia' })
    @ApiResponse({ status: 201, description: 'Contacto creado exitosamente' })
    createMyContact(
        @ActiveUser() user: JwtPayload,
        @Body() dto: CreateEmergencyContactDto,
    ) {
        if (!user.employeeId) throw new BadRequestException('El usuario no tiene un empleado asociado');
        return this.service.create(user.employeeId, dto);
    }

    @Delete('my/:id')
    @Roles(Role.EMPLOYEE)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar uno de mis contactos de emergencia' })
    @ApiResponse({ status: 204, description: 'Contacto eliminado exitosamente' })
    removeMyContact(
        @Param('id', ParseIntPipe) id: number,
        @ActiveUser() user: JwtPayload,
    ) {
        if (!user.employeeId) throw new BadRequestException('El usuario no tiene un empleado asociado');
        return this.service.remove(id, user.employeeId);
    }

    // ── Rutas de admin (sobre cualquier empleado) ─────────────────────────────

    @Get('employee/:employeeId')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Obtener contactos de emergencia de un empleado (admin)' })
    getByEmployee(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
        return this.service.findByEmployee(employeeId);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Eliminar un contacto de emergencia (admin)' })
    removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
        return this.service.removeAsAdmin(id);
    }
}
