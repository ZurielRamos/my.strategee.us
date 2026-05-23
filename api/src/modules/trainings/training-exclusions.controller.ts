import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { TrainingExclusionsService } from './training-exclusions.service';

@ApiTags('Exclusiones de Capacitación')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('trainings')
export class TrainingExclusionsController {
  constructor(private readonly exclusionsService: TrainingExclusionsService) {}

  @Post('/:id/exclusions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Excluir empleados de una capacitación' })
  exclude(
    @Param('id') trainingId: string,
    @Body() body: { employeeIds: string[] },
  ) {
    return this.exclusionsService.exclude(trainingId, body.employeeIds);
  }

  @Delete('/:id/exclusions/:employeeId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Revertir la exclusión de un empleado de una capacitación' })
  revert(
    @Param('id') trainingId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.exclusionsService.revert(trainingId, employeeId);
  }

  @Get('/:id/exclusions')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar empleados excluidos de una capacitación' })
  findExcluded(@Param('id') trainingId: string) {
    return this.exclusionsService.findExcluded(trainingId);
  }
}
