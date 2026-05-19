import { Controller, Get, Param, UseGuards, ParseIntPipe, Body, Post, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VacationsService } from './vacations.service';
import { VacationBalanceResponseDto } from './dto/vacation-balance-response.dto';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { RegisterAdjustmentDto, RegisterMoneyPaymentDto } from './dto/register-transaction.dto';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Gestión de Vacaciones')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('vacations')
export class VacationsController {
  constructor(private readonly vacationsService: VacationsService) { }

  // --------------------------------------------------------
  // 1. Endpoint para el Empleado (Auto-consulta)
  // --------------------------------------------------------
  @Get('my-balance')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Consultar MI balance de vacaciones (Empleado).' })
  @ApiResponse({ status: 200, type: VacationBalanceResponseDto })
  async getMyBalance(@ActiveUser() user: JwtPayload): Promise<VacationBalanceResponseDto> {
    // Extraer employeeId desde el JWT payload
    const employeeId = user.employeeId;
    
    if (!employeeId) {
      throw new BadRequestException('Employee ID not found in JWT payload');
    }
    
    return this.vacationsService.getEmployeeBalance(employeeId);
  }

  // --------------------------------------------------------
  // 2. Endpoint para el Administrador (Consulta global)
  // --------------------------------------------------------
  @Get('balance/:employeeId')
  @Roles(Role.ADMIN) // 🔒 Solo Admin
  @ApiOperation({ summary: 'Consultar el balance de CUALQUIER empleado (Admin).' })
  @ApiResponse({ status: 200, type: VacationBalanceResponseDto })
  async getEmployeeBalance(
    @Param('employeeId') employeeId: string
  ): Promise<VacationBalanceResponseDto> {
    return this.vacationsService.getEmployeeBalance(employeeId);
  }

  @Post('compensate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Registrar pago de vacaciones en dinero (Compensación).' })
  async compensate(@Body() dto: RegisterMoneyPaymentDto) {
    return this.vacationsService.registerMoneyPayment(dto);
  }

  @Post('adjust')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Realizar ajuste manual de saldo (+ o -).' })
  async adjust(@Body() dto: RegisterAdjustmentDto) {
    return this.vacationsService.registerAdjustment(dto);
  }
}