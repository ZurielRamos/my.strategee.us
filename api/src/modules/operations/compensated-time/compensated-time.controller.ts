import { Controller, Get, Param, UseGuards, Body, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CompensatedTimeService } from './compensated-time.service';
import { CompensatedTimeBalanceResponseDto } from './dto/compensated-time-balance-response.dto';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { RegisterCompensatedTimeAdjustmentDto } from './dto/register-transaction.dto';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Gestión de Días Compensados')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('compensated-time')
export class CompensatedTimeController {
  constructor(private readonly compensatedTimeService: CompensatedTimeService) { }

  @Get('my-balance')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Consultar MI balance de días compensados (Empleado).' })
  @ApiResponse({ status: 200, type: CompensatedTimeBalanceResponseDto })
  async getMyBalance(@ActiveUser() user: JwtPayload): Promise<CompensatedTimeBalanceResponseDto> {
    const employeeId = user.employeeId;
    
    if (!employeeId) {
      throw new BadRequestException('Employee ID not found in JWT payload');
    }
    
    return this.compensatedTimeService.getEmployeeBalance(employeeId);
  }

  @Get('balance/:employeeId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Consultar el balance de CUALQUIER empleado (Admin).' })
  @ApiResponse({ status: 200, type: CompensatedTimeBalanceResponseDto })
  async getEmployeeBalance(
    @Param('employeeId') employeeId: string
  ): Promise<CompensatedTimeBalanceResponseDto> {
    return this.compensatedTimeService.getEmployeeBalance(employeeId);
  }

  @Post('adjust')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Realizar ajuste manual de horas compensadas (+ o -).' })
  async adjust(@Body() dto: RegisterCompensatedTimeAdjustmentDto) {
    return this.compensatedTimeService.registerAdjustment(dto);
  }
}
