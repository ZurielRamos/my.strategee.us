import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Training } from './entities/training.entity';
import { TrainingAssignment } from './entities/training-assignment.entity';
import { TrainingExclusion } from './entities/training-exclusion.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { TrainingStatus } from './enums/training-status.enum';
import { AssignmentStatus } from './enums/assignment-status.enum';
import { AssignmentMode } from './enums/assignment-mode.enum';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { TrainingCompletionFilterDto } from './dto/training-completion-filter.dto';
import { AttachmentsService } from '@modules/infrastructure/attachments/attachments.service';

@Injectable()
export class TrainingsService {
  constructor(
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,

    @InjectRepository(TrainingAssignment)
    private readonly assignmentRepository: Repository<TrainingAssignment>,

    @InjectRepository(TrainingExclusion)
    private readonly exclusionRepository: Repository<TrainingExclusion>,

    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    private readonly attachmentsService: AttachmentsService,
  ) {}

  // ─── 4.1 Create ─────────────────────────────────────────────────────────────

  async create(dto: CreateTrainingDto): Promise<Training> {
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : null;

    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException('endsAt debe ser posterior a startsAt');
    }

    // Si no hay fecha de inicio, la capacitación arranca activa de inmediato
    const status =
      startsAt && startsAt > new Date()
        ? TrainingStatus.DRAFT
        : TrainingStatus.ACTIVE;

    const training = this.trainingRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      startsAt,
      endsAt,
      isMandatory: dto.isMandatory ?? false,
      assignmentMode: dto.assignmentMode ?? AssignmentMode.ALL,
      status,
    });

    const savedTraining = await this.trainingRepository.save(training);

    const mode = dto.assignmentMode ?? AssignmentMode.ALL;
    const employeeIds = dto.employeeIds ?? [];

    let assignedEmployeeIds: string[] = [];

    if (mode === AssignmentMode.ALL) {
      // Asignar a todos los empleados activos
      const all = await this.employeeRepository.find({ where: { isActive: true } });
      assignedEmployeeIds = all.map((e) => e.id);

    } else if (mode === AssignmentMode.ALL_WITH_EXCLUSIONS) {
      // Asignar a todos excepto los excluidos
      const all = await this.employeeRepository.find({ where: { isActive: true } });
      const excludedSet = new Set(employeeIds);
      assignedEmployeeIds = all.filter((e) => !excludedSet.has(e.id)).map((e) => e.id);

      // Persistir exclusiones
      if (employeeIds.length > 0) {
        const exclusions = employeeIds.map((empId) =>
          this.exclusionRepository.create({
            trainingId: savedTraining.id,
            employeeId: empId,
          }),
        );
        await this.exclusionRepository.save(exclusions);
      }

    } else if (mode === AssignmentMode.SELECTED) {
      // Solo los seleccionados
      assignedEmployeeIds = employeeIds;
    }

    if (assignedEmployeeIds.length > 0) {
      const assignments = assignedEmployeeIds.map((empId) =>
        this.assignmentRepository.create({
          trainingId: savedTraining.id,
          employeeId: empId,
          status: AssignmentStatus.PENDING,
        }),
      );
      await this.assignmentRepository.save(assignments);
    }

    return savedTraining;
  }

  // ─── 4.2 FindAll ────────────────────────────────────────────────────────────

  async findAll(
    page: number,
    limit: number,
  ): Promise<{
    data: Training[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.trainingRepository.findAndCount({
      relations: ['materials'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─── 4.3 FindOne ────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Training> {
    const training = await this.trainingRepository.findOne({
      where: { id },
      relations: [
        'materials',
        'materials.attachment',
        'materials.quiz',
        'materials.quiz.questions',
        'materials.quiz.questions.options',
      ],
      order: {
        materials: {
          orderIndex: 'ASC',
        },
      },
    });

    if (!training) {
      throw new NotFoundException(`Training #${id} no encontrada`);
    }

    return training;
  }

  // ─── 4.4 Update ─────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTrainingDto): Promise<Training> {
    const training = await this.findOne(id);

    // Validar fechas si se proveen ambas
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : training.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : training.endsAt;

    if (dto.startsAt || dto.endsAt) {
      if (startsAt && endsAt && endsAt <= startsAt) {
        throw new BadRequestException('endsAt debe ser posterior a startsAt');
      }
    }

    Object.assign(training, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
      ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
      ...(dto.isMandatory !== undefined && { isMandatory: dto.isMandatory }),
      ...(dto.assignmentMode !== undefined && { assignmentMode: dto.assignmentMode }),
      ...(dto.status !== undefined && { status: dto.status }),
    });

    return this.trainingRepository.save(training);
  }

  // ─── 4.5 Remove ─────────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const training = await this.trainingRepository.findOne({
      where: { id },
      relations: [
        'materials',
        'materials.attachment',
        'assignments',
        'assignments.progress',
        'exclusions',
      ],
    });

    if (!training) {
      throw new NotFoundException(`Training #${id} no encontrada`);
    }

    // Bloquear eliminación si algún empleado ya tiene progreso registrado
    const hasProgress = training.assignments.some((a) => a.progress && a.progress.length > 0);
    if (hasProgress) {
      throw new BadRequestException(
        'No se puede eliminar una capacitación que ya tiene progreso registrado por empleados. Puedes inhabilitarla en su lugar.',
      );
    }

    // Eliminar attachments de Firebase para cada material
    for (const material of training.materials) {
      if (material.attachmentId) {
        await this.attachmentsService.remove(material.attachmentId);
      }
    }

    // Eliminar la training (cascade eliminará assignments, exclusiones, quizzes, progress)
    await this.trainingRepository.remove(training);

    return { message: 'Training eliminada correctamente' };
  }

  // ─── 4.6 Disable ────────────────────────────────────────────────────────────

  async disable(id: string): Promise<Training> {
    const training = await this.trainingRepository.findOne({ where: { id } });

    if (!training) {
      throw new NotFoundException(`Training #${id} no encontrada`);
    }

    if (training.status === TrainingStatus.INACTIVE) {
      throw new BadRequestException('La capacitación ya está inhabilitada.');
    }

    training.status = TrainingStatus.INACTIVE;
    return this.trainingRepository.save(training);
  }

  // ─── 4.6 GetCompletionReport ─────────────────────────────────────────────────

  async getCompletionReport(
    trainingId: string,
    filter?: TrainingCompletionFilterDto,
  ): Promise<{
    trainingId: string;
    title: string;
    totalAssigned: number;
    completedCount: number;
    completionPercentage: number;
    assignments: {
      employeeId: string;
      employeeName: string;
      status: AssignmentStatus;
      completedAt: Date | null;
    }[];
  }> {
    const training = await this.trainingRepository.findOne({
      where: { id: trainingId },
    });

    if (!training) {
      throw new NotFoundException(`Training #${trainingId} no encontrada`);
    }

    // Obtener todos los assignments con relación employee
    let assignments = await this.assignmentRepository.find({
      where: { trainingId },
      relations: ['employee'],
    });

    // Filtrar por status si se provee
    if (filter?.status) {
      assignments = assignments.filter((a) => a.status === filter.status);
    }

    const totalAssigned = assignments.length;
    const completedCount = assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED,
    ).length;

    const completionPercentage =
      totalAssigned > 0
        ? Math.round((completedCount / totalAssigned) * 100 * 100) / 100
        : 0;

    return {
      trainingId,
      title: training.title,
      totalAssigned,
      completedCount,
      completionPercentage,
      assignments: assignments.map((a) => ({
        employeeId: a.employeeId,
        employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
        status: a.status,
        completedAt: a.completedAt,
      })),
    };
  }
}
