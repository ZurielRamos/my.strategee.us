import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';
import { TrainingAssignmentsService } from './training-assignments.service';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

@ApiTags('Progreso de Capacitaciones')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('trainings')
export class TrainingAssignmentsController {
  constructor(private readonly assignmentsService: TrainingAssignmentsService) {}

  @Get('/my')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Obtener mis capacitaciones activas' })
  getMyTrainings(@ActiveUser() user: JwtPayload) {
    if (!user.employeeId) throw new BadRequestException('Employee ID not found in token');
    return this.assignmentsService.getMyTrainings(user.employeeId);
  }

  @Get('/my/:id')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Obtener el detalle de una de mis capacitaciones' })
  getMyTrainingDetail(
    @ActiveUser() user: JwtPayload,
    @Param('id') trainingId: string,
  ) {
    if (!user.employeeId) throw new BadRequestException('Employee ID not found in token');
    return this.assignmentsService.getMyTrainingDetail(user.employeeId, trainingId);
  }

  @Post('/my/:id/materials/:materialId/complete')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Marcar un material como completado' })
  completeMaterial(
    @ActiveUser() user: JwtPayload,
    @Param('id') trainingId: string,
    @Param('materialId') materialId: string,
  ) {
    if (!user.employeeId) throw new BadRequestException('Employee ID not found in token');
    return this.assignmentsService.completeMaterial(user.employeeId, trainingId, materialId);
  }

  @Post('/my/:id/materials/:materialId/quiz/submit')
  @Roles(Role.EMPLOYEE, Role.ADMIN)
  @ApiOperation({ summary: 'Enviar respuestas del quiz de un material' })
  submitQuiz(
    @ActiveUser() user: JwtPayload,
    @Param('id') trainingId: string,
    @Param('materialId') materialId: string,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    if (!user.employeeId) throw new BadRequestException('Employee ID not found in token');
    return this.assignmentsService.submitQuiz(user.employeeId, trainingId, materialId, dto);
  }
}
