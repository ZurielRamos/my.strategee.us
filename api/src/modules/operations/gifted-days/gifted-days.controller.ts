import { Controller, Get, Param, UseGuards, Body, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GiftedDaysService } from './gifted-days.service';
import { GiftedDaysBalanceResponseDto } from './dto/gifted-days-balance-response.dto';
import { AdjustGiftedDaysDto, GrantGiftedDaysDto } from './dto/register-transaction.dto';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Gestión de Días Obsequiados por Servicios')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('gifted-days')
export class GiftedDaysController {
    constructor(private readonly giftedDaysService: GiftedDaysService) { }

    @Get('my-balance')
    @Roles(Role.EMPLOYEE, Role.ADMIN)
    @ApiOperation({ summary: 'Consultar MI balance de días obsequiados (Empleado).' })
    @ApiResponse({ status: 200, type: GiftedDaysBalanceResponseDto })
    async getMyBalance(@ActiveUser() user: JwtPayload): Promise<GiftedDaysBalanceResponseDto> {
        const employeeId = user.employeeId;

        if (!employeeId) {
            throw new BadRequestException('Employee ID not found in JWT payload');
        }

        return this.giftedDaysService.getEmployeeBalance(employeeId);
    }

    @Get('balance/:employeeId')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Consultar el balance de CUALQUIER empleado (Admin).' })
    @ApiResponse({ status: 200, type: GiftedDaysBalanceResponseDto })
    async getEmployeeBalance(
        @Param('employeeId') employeeId: string,
    ): Promise<GiftedDaysBalanceResponseDto> {
        return this.giftedDaysService.getEmployeeBalance(employeeId);
    }

    @Post('grant')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Otorgar días obsequiados a un empleado (Admin).' })
    @ApiResponse({ status: 201, type: GiftedDaysBalanceResponseDto })
    async grant(@Body() dto: GrantGiftedDaysDto) {
        return this.giftedDaysService.grantDays(dto);
    }

    @Post('adjust')
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Realizar ajuste manual de días obsequiados (+ o -).' })
    async adjust(@Body() dto: AdjustGiftedDaysDto) {
        return this.giftedDaysService.registerAdjustment(dto);
    }
}
