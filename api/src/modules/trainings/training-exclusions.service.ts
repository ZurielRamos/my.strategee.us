import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TrainingExclusion } from './entities/training-exclusion.entity';
import { TrainingAssignment } from './entities/training-assignment.entity';
import { Training } from './entities/training.entity';
import { AssignmentStatus } from './enums/assignment-status.enum';
import { TrainingStatus } from './enums/training-status.enum';

@Injectable()
export class TrainingExclusionsService {
  constructor(
    @InjectRepository(TrainingExclusion)
    private readonly exclusionRepository: Repository<TrainingExclusion>,
    @InjectRepository(TrainingAssignment)
    private readonly assignmentRepository: Repository<TrainingAssignment>,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async exclude(
    trainingId: string,
    employeeIds: string[],
  ): Promise<{ excluded: number }> {
    let excluded = 0;

    for (const employeeId of employeeIds) {
      // Verificar si ya existe una exclusión para este par (training, employee)
      const existing = await this.exclusionRepository.findOne({
        where: { trainingId, employeeId },
      });

      if (existing) {
        // Ya excluido, ignorar
        continue;
      }

      // Crear la exclusión
      const exclusion = this.exclusionRepository.create({ trainingId, employeeId });
      await this.exclusionRepository.save(exclusion);

      // Eliminar el assignment si existe
      await this.assignmentRepository.delete({ trainingId, employeeId });

      excluded++;
    }

    return { excluded };
  }

  async revert(trainingId: string, employeeId: string): Promise<TrainingAssignment> {
    // Buscar la exclusión
    const exclusion = await this.exclusionRepository.findOne({
      where: { trainingId, employeeId },
    });

    if (!exclusion) {
      throw new NotFoundException(
        `No se encontró exclusión para el empleado ${employeeId} en la training ${trainingId}`,
      );
    }

    // Eliminar la exclusión
    await this.exclusionRepository.remove(exclusion);

    // Crear nuevo assignment con status = PENDING
    const assignment = this.assignmentRepository.create({
      trainingId,
      employeeId,
      status: AssignmentStatus.PENDING,
    });
    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Verificar si la training está activa para emitir evento
    const training = await this.trainingRepository.findOne({
      where: { id: trainingId },
    });

    if (training && training.status === TrainingStatus.ACTIVE) {
      this.eventEmitter.emit('training.assigned', { trainingId, employeeId });
    }

    return savedAssignment;
  }

  async findExcluded(
    trainingId: string,
  ): Promise<{ employeeId: string; firstName: string; lastName: string; createdAt: Date }[]> {
    const exclusions = await this.exclusionRepository.find({
      where: { trainingId },
      relations: ['employee'],
    });

    return exclusions.map((exclusion) => ({
      employeeId: exclusion.employeeId,
      firstName: exclusion.employee.firstName,
      lastName: exclusion.employee.lastName,
      createdAt: exclusion.createdAt,
    }));
  }
}
