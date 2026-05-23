import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingAssignment } from './entities/training-assignment.entity';
import { TrainingMaterialProgress } from './entities/training-material-progress.entity';
import { Training } from './entities/training.entity';
import { TrainingMaterial } from './entities/training-material.entity';
import { TrainingQuiz } from './entities/quiz.entity';
import { AssignmentStatus } from './enums/assignment-status.enum';
import { TrainingStatus } from './enums/training-status.enum';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { TrainingCompletionFilterDto } from './dto/training-completion-filter.dto';

@Injectable()
export class TrainingAssignmentsService {
  constructor(
    @InjectRepository(TrainingAssignment)
    private readonly assignmentRepository: Repository<TrainingAssignment>,
    @InjectRepository(TrainingMaterialProgress)
    private readonly progressRepository: Repository<TrainingMaterialProgress>,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(TrainingMaterial)
    private readonly materialRepository: Repository<TrainingMaterial>,
    @InjectRepository(TrainingQuiz)
    private readonly quizRepository: Repository<TrainingQuiz>,
  ) {}

  /**
   * 7.1 — Retorna las trainings activas del empleado con su assignment y progreso.
   */
  async getMyTrainings(employeeId: string) {
    const assignments = await this.assignmentRepository.find({
      where: {
        employeeId,
        training: { status: TrainingStatus.ACTIVE },
      },
      relations: ['training', 'training.materials', 'progress'],
    });

    return assignments.map((assignment) => {
      const totalMaterials = assignment.training.materials.length;
      const completedMaterials = assignment.progress.filter(
        (p) => p.isCompleted,
      ).length;

      return {
        training: assignment.training,
        assignment: {
          id: assignment.id,
          status: assignment.status,
          completedAt: assignment.completedAt,
        },
        progress: {
          completed: completedMaterials,
          total: totalMaterials,
        },
      };
    });
  }

  /**
   * 7.1b — Lista los empleados asignados a una capacitación (para admin).
   */
  async getAssignedEmployees(trainingId: string) {
    const assignments = await this.assignmentRepository.find({
      where: { trainingId },
      relations: ['employee'],
    });
    return assignments.map((a) => ({
      assignmentId: a.id,
      employeeId: a.employeeId,
      firstName: (a.employee as any)?.firstName ?? '',
      lastName: (a.employee as any)?.lastName ?? '',
      documentNumber: (a.employee as any)?.documentNumber ?? '',
      status: a.status,
    }));
  }

  /**
   * 7.1c — Agrega empleados a una capacitación en modo 'selected'.
   */
  async addEmployees(trainingId: string, employeeIds: string[]) {
    const training = await this.trainingRepository.findOne({ where: { id: trainingId } });
    if (!training) throw new NotFoundException(`Training #${trainingId} no encontrada`);

    const existing = await this.assignmentRepository.find({ where: { trainingId } });
    const existingIds = new Set(existing.map((a) => a.employeeId));

    const toAdd = employeeIds.filter((id) => !existingIds.has(id));
    if (toAdd.length === 0) return { added: 0 };

    const assignments = toAdd.map((empId) =>
      this.assignmentRepository.create({
        trainingId,
        employeeId: empId,
        status: AssignmentStatus.PENDING,
      }),
    );
    await this.assignmentRepository.save(assignments);
    return { added: toAdd.length };
  }

  /**
   * 7.1d — Quita un empleado de una capacitación en modo 'selected'.
   */
  async removeEmployee(trainingId: string, employeeId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { trainingId, employeeId },
    });
    if (!assignment) throw new NotFoundException('Assignment no encontrado');
    await this.assignmentRepository.remove(assignment);
    return { removed: 1 };
  }

  /**
   * 7.2 — Retorna el detalle de una training con progreso del empleado.
   */
  async getMyTrainingDetail(employeeId: string, trainingId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { employeeId, trainingId },
    });

    if (!assignment) {
      throw new NotFoundException('No tienes asignación para esta capacitación');
    }

    const training = await this.trainingRepository.findOne({
      where: { id: trainingId },
      relations: [
        'materials',
        'materials.attachment',
        'materials.quiz',
        'materials.quiz.questions',
        'materials.quiz.questions.options',
      ],
      order: { materials: { orderIndex: 'ASC' } },
    });

    if (!training) {
      throw new NotFoundException('Capacitación no encontrada');
    }

    const progressList = await this.progressRepository.find({
      where: { assignmentId: assignment.id },
    });

    const enrichedMaterials = training.materials.map((material, index) => {
      const progress =
        progressList.find((p) => p.materialId === material.id) ?? null;

      let isAccessible: boolean;
      if (index === 0) {
        isAccessible = true;
      } else {
        const previousMaterial = training.materials[index - 1];
        const previousProgress = progressList.find(
          (p) => p.materialId === previousMaterial.id,
        );
        isAccessible = previousProgress?.isCompleted === true;
      }

      return { ...material, progress, isAccessible };
    });

    return {
      ...training,
      materials: enrichedMaterials,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        completedAt: assignment.completedAt,
      },
    };
  }

  /**
   * 7.3 — Marca un material sin quiz como completado.
   */
  async completeMaterial(
    employeeId: string,
    trainingId: string,
    materialId: string,
  ) {
    const assignment = await this.assignmentRepository.findOne({
      where: { employeeId, trainingId },
    });

    if (!assignment) {
      throw new NotFoundException('No tienes asignación para esta capacitación');
    }

    const material = await this.materialRepository.findOne({
      where: { id: materialId, trainingId },
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado en esta capacitación');
    }

    // Verificar progreso secuencial
    if (material.orderIndex > 0) {
      const previousMaterial = await this.materialRepository.findOne({
        where: { trainingId, orderIndex: material.orderIndex - 1 },
      });

      if (previousMaterial) {
        const previousProgress = await this.progressRepository.findOne({
          where: { assignmentId: assignment.id, materialId: previousMaterial.id },
        });

        if (!previousProgress?.isCompleted) {
          throw new ForbiddenException('Debes completar el material anterior primero');
        }
      }
    }

    // Buscar o crear el progress
    let progress = await this.progressRepository.findOne({
      where: { assignmentId: assignment.id, materialId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        assignmentId: assignment.id,
        materialId,
        isCompleted: false,
        attempts: 0,
      });
    }

    // Si ya está completado, retornar sin cambios
    if (progress.isCompleted) {
      return progress;
    }

    progress.isCompleted = true;
    progress.completedAt = new Date();

    await this.progressRepository.save(progress);

    // Verificar si todos los materiales están completados
    await this.checkAndCompleteAssignment(assignment.id, trainingId);

    return progress;
  }

  /**
   * 7.4 — Evalúa las respuestas del quiz.
   */
  async submitQuiz(
    employeeId: string,
    trainingId: string,
    materialId: string,
    dto: SubmitQuizAttemptDto,
  ) {
    const assignment = await this.assignmentRepository.findOne({
      where: { employeeId, trainingId },
    });

    if (!assignment) {
      throw new NotFoundException('No tienes asignación para esta capacitación');
    }

    const material = await this.materialRepository.findOne({
      where: { id: materialId, trainingId },
      relations: ['quiz', 'quiz.questions', 'quiz.questions.options'],
    });

    if (!material) {
      throw new NotFoundException('Material no encontrado en esta capacitación');
    }

    if (!material.quiz) {
      throw new BadRequestException('Este material no tiene quiz');
    }

    const quiz = material.quiz;

    // Verificar progreso secuencial
    if (material.orderIndex > 0) {
      const previousMaterial = await this.materialRepository.findOne({
        where: { trainingId, orderIndex: material.orderIndex - 1 },
      });

      if (previousMaterial) {
        const previousProgress = await this.progressRepository.findOne({
          where: { assignmentId: assignment.id, materialId: previousMaterial.id },
        });

        if (!previousProgress?.isCompleted) {
          throw new ForbiddenException('Debes completar el material anterior primero');
        }
      }
    }

    // Calcular puntaje
    const puntajeTotalPosible = quiz.questions.reduce(
      (sum, q) => sum + Number(q.score),
      0,
    );

    let puntajeObtenido = 0;
    const incorrectQuestions: {
      questionId: string;
      questionText: string;
      selectedOptionId: string;
      correctOptionId: string;
    }[] = [];

    for (const answer of dto.answers) {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      const selectedOption = question.options.find(
        (o) => o.id === answer.optionId,
      );
      const correctOption = question.options.find((o) => o.isCorrect);

      if (selectedOption?.isCorrect) {
        puntajeObtenido += Number(question.score);
      } else {
        incorrectQuestions.push({
          questionId: question.id,
          questionText: question.text,
          selectedOptionId: answer.optionId,
          correctOptionId: correctOption?.id ?? '',
        });
      }
    }

    const puntajePorcentual =
      puntajeTotalPosible > 0
        ? (puntajeObtenido / puntajeTotalPosible) * 100
        : 0;

    // Buscar o crear el progress
    let progress = await this.progressRepository.findOne({
      where: { assignmentId: assignment.id, materialId },
    });

    if (!progress) {
      progress = this.progressRepository.create({
        assignmentId: assignment.id,
        materialId,
        isCompleted: false,
        attempts: 0,
      });
    }

    progress.attempts = (progress.attempts ?? 0) + 1;

    if (puntajePorcentual >= quiz.passingScore) {
      progress.quizPassed = true;
      progress.quizScore = puntajePorcentual;
      progress.isCompleted = true;
      progress.completedAt = new Date();

      await this.progressRepository.save(progress);

      // Verificar si todos los materiales están completados
      await this.checkAndCompleteAssignment(assignment.id, trainingId);

      return {
        passed: true,
        score: puntajePorcentual,
        passingScore: quiz.passingScore,
        incorrectQuestions: [],
      };
    } else {
      progress.quizScore = puntajePorcentual;
      progress.quizPassed = false;

      await this.progressRepository.save(progress);

      return {
        passed: false,
        score: puntajePorcentual,
        passingScore: quiz.passingScore,
        incorrectQuestions,
      };
    }
  }

  /**
   * 7.5 — Reporte de completitud de una training para el admin.
   */
  async getCompletionReport(
    trainingId: string,
    filter?: TrainingCompletionFilterDto,
  ) {
    let assignments = await this.assignmentRepository.find({
      where: { trainingId },
      relations: ['employee'],
    });

    if (filter?.status) {
      assignments = assignments.filter((a) => a.status === filter.status);
    }

    const totalAssigned = assignments.length;
    const completedCount = assignments.filter(
      (a) => a.status === AssignmentStatus.COMPLETED,
    ).length;

    const completionPercentage =
      totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 0;

    return {
      trainingId,
      totalAssigned,
      completedCount,
      completionPercentage,
      assignments: assignments.map((a) => ({
        id: a.id,
        employee: a.employee,
        status: a.status,
        completedAt: a.completedAt,
      })),
    };
  }

  /**
   * Verifica si todos los materiales de la training están completados
   * y marca el assignment como COMPLETED si corresponde.
   */
  private async checkAndCompleteAssignment(
    assignmentId: string,
    trainingId: string,
  ): Promise<void> {
    const allMaterials = await this.materialRepository.find({
      where: { trainingId },
    });

    const allProgress = await this.progressRepository.find({
      where: { assignmentId },
    });

    const allCompleted = allMaterials.every((m) =>
      allProgress.some((p) => p.materialId === m.id && p.isCompleted),
    );

    if (allCompleted) {
      await this.assignmentRepository.update(assignmentId, {
        status: AssignmentStatus.COMPLETED,
        completedAt: new Date(),
      });
    }
  }
}
