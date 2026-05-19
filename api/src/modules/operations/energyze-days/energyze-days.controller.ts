import { Controller, Get, Param, UseGuards, Body, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EnergyzeDaysService } from './energyze-days.service';
import { EnergyzeDaysBalanceResponseDto } from './dto/energyze-days-balance-response.dto';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AdjustEnergyzeDaysDto } from './dto/register-transaction.dto';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Gestión de Días Energyze')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('energyze-days')
export class EnergyzeDaysController {
  constructor(private readonly energyzeDaysService: EnergyzeDaysService) { }

  @Get('my-balance')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Consultar MI balance de días Energyze (Empleado).' })
  @ApiResponse({ status: 200, type: EnergyzeDaysBalanceResponseDto })
  async getMyBalance(@ActiveUser() user: JwtPayload): Promise<EnergyzeDaysBalanceResponseDto> {
    const employeeId = user.employeeId;
    
    if (!employeeId) {
      throw new BadRequestException('Employee ID not found in JWT payload');
    }
    
    return this.energyzeDaysService.getEmployeeBalance(employeeId);
  }

  @Get('balance/:employeeId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar el balance de CUALQUIER empleado (Admin).' })
  @ApiResponse({ status: 200, type: EnergyzeDaysBalanceResponseDto })
  async getEmployeeBalance(
    @Param('employeeId') employeeId: string
  ): Promise<EnergyzeDaysBalanceResponseDto> {
    return this.energyzeDaysService.getEmployeeBalance(employeeId);
  }

  @Post('adjust')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Realizar ajuste manual de días Energyze (+ o -).' })
  async adjust(@Body() dto: AdjustEnergyzeDaysDto) {
    return this.energyzeDaysService.registerAdjustment(dto);
  }
}
