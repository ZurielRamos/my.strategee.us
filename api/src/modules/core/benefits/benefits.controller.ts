import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BenefitsService } from './benefits.service';
import { SetAllocationDto } from './dto/set-allocation.dto';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';

@ApiTags('Benefits')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('benefits')
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) { }

  @Post('allocate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Asignar cupo mensual de un beneficio a un empleado.' })
  setAllocation(@Body() dto: SetAllocationDto) {
    return this.benefitsService.setAllocation(dto.employeeId, dto.benefitType, dto.amount);
  }

  @Get('allocations/:employeeId')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Ver mis cupos asignados.' })
  findAll(@Param('employeeId') employeeId: string) {
    return this.benefitsService.findAllByEmployee(employeeId);
  }

  @Get('balances')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Obtener balance de beneficios con días disponibles y usados del mes actual' })
  getBenefitBalances(@ActiveUser() user: JwtPayload) {
    if (!user.employeeId) {
      throw new Error('User does not have an associated employee ID');
    }
    return this.benefitsService.getBenefitBalances(user.employeeId);
  }
}