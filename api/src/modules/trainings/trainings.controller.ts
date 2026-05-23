import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { JwtPayload } from '@modules/iam/authentication/interfaces/jwt-payload.interface';
import { TrainingsService } from './trainings.service';
import { TrainingAssignmentsService } from './training-assignments.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingCompletionFilterDto } from './dto/training-completion-filter.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

@ApiTags('Capacitaciones')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('trainings')
export class TrainingsController {
  constructor(
    private readonly trainingsService: TrainingsService,
    private readonly assignmentsService: TrainingAssignmentsService,
  ) {}

  // ─── Rutas estáticas primero (evitan colisión con /:id) ──────────────────────

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

  // ─── Admin CRUD ──────────────────────────────────────────────────────────────

  @Get('/:id/employees')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar empleados asignados a una capacitación' })
  getAssignedEmployees(@Param('id') id: string) {
    return this.assignmentsService.getAssignedEmployees(id);
  }

  @Post('/:id/employees')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Agregar empleados a una capacitación (modo selected)' })
  addEmployees(@Param('id') id: string, @Body() body: { employeeIds: string[] }) {
    return this.assignmentsService.addEmployees(id, body.employeeIds);
  }

  @Delete('/:id/employees/:employeeId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Quitar un empleado de una capacitación (modo selected)' })
  removeEmployee(@Param('id') id: string, @Param('employeeId') employeeId: string) {
    return this.assignmentsService.removeEmployee(id, employeeId);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear una nueva capacitación' })
  create(@Body() dto: CreateTrainingDto) {
    return this.trainingsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todas las capacitaciones (paginado)' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.trainingsService.findAll(+page, +limit);
  }

  @Get('/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener detalle de una capacitación' })
  findOne(@Param('id') id: string) {
    return this.trainingsService.findOne(id);
  }

  @Patch('/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Actualizar una capacitación' })
  update(@Param('id') id: string, @Body() dto: UpdateTrainingDto) {
    return this.trainingsService.update(id, dto);
  }

  @Patch('/:id/disable')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Inhabilitar una capacitación' })
  disable(@Param('id') id: string) {
    return this.trainingsService.disable(id);
  }

  @Delete('/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar una capacitación (cascade)' })
  remove(@Param('id') id: string) {
    return this.trainingsService.remove(id);
  }

  @Get('/:id/completion')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Reporte de completitud de una capacitación' })
  getCompletion(
    @Param('id') id: string,
    @Query() filter: TrainingCompletionFilterDto,
  ) {
    return this.trainingsService.getCompletionReport(id, filter);
  }
}
