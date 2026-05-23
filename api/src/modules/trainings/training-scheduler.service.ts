import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Training } from './entities/training.entity';
import { TrainingAssignment } from './entities/training-assignment.entity';
import { TrainingStatus } from './enums/training-status.enum';

@Injectable()
export class TrainingSchedulerService {
  private readonly logger = new Logger(TrainingSchedulerService.name);

  constructor(
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
    @InjectRepository(TrainingAssignment)
    private readonly assignmentRepository: Repository<TrainingAssignment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async activateTrainings(): Promise<void> {
    const now = new Date();

    // Solo activar trainings que tienen fecha de inicio definida y ya llegó
    const draftsToActivate = await this.trainingRepository.find({
      where: {
        status: TrainingStatus.DRAFT,
        startsAt: LessThanOrEqual(now),
      },
    });

    for (const training of draftsToActivate) {
      training.status = TrainingStatus.ACTIVE;
      await this.trainingRepository.save(training);

      const assignments = await this.assignmentRepository.find({
        where: { trainingId: training.id },
        select: ['employeeId'],
      });

      const employeeIds = assignments.map((a) => a.employeeId);

      this.eventEmitter.emit('training.activated', {
        trainingId: training.id,
        employeeIds,
      });
    }

    this.logger.log(`activateTrainings: ${draftsToActivate.length} training(s) activated`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireTrainings(): Promise<void> {
    const now = new Date();

    // Solo expirar trainings que tienen fecha de fin definida y ya pasó
    const activeToExpire = await this.trainingRepository.find({
      where: {
        status: TrainingStatus.ACTIVE,
        endsAt: LessThan(now),
      },
    });

    for (const training of activeToExpire) {
      training.status = TrainingStatus.EXPIRED;
      await this.trainingRepository.save(training);
    }

    this.logger.log(`expireTrainings: ${activeToExpire.length} training(s) expired`);
  }
}
