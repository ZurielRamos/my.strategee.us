import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushNotificationService } from '@modules/notifications/push-notification.service';
import { Training } from '../entities/training.entity';

export interface TrainingActivatedEvent {
  trainingId: string;
  employeeIds: string[];
}

export interface TrainingAssignedEvent {
  trainingId: string;
  employeeId: string;
}

@Injectable()
export class TrainingNotificationListener {
  private readonly logger = new Logger(TrainingNotificationListener.name);

  constructor(
    private readonly pushNotificationService: PushNotificationService,
    @InjectRepository(Training)
    private readonly trainingRepository: Repository<Training>,
  ) {}

  @OnEvent('training.activated')
  async handleTrainingActivated(event: TrainingActivatedEvent): Promise<void> {
    try {
      const training = await this.trainingRepository.findOne({
        where: { id: event.trainingId },
      });

      if (!training) {
        this.logger.warn(`Training ${event.trainingId} not found for activation notification`);
        return;
      }

      const body = training.isMandatory
        ? 'Tienes una capacitación OBLIGATORIA disponible. Debes completarla para continuar usando la aplicación.'
        : 'Tienes una nueva capacitación disponible. Ingresa a la app para verla.';

      const payload = {
        notification: {
          title: 'Nueva Capacitación Disponible',
          body,
        },
        data: {
          notificationId: event.trainingId,
          type: 'TRAINING_ACTIVATED',
          trainingId: event.trainingId,
        },
      };

      const sendPromises = event.employeeIds.map((employeeId) =>
        this.pushNotificationService.sendToEmployee(employeeId, payload).catch((error) => {
          this.logger.error(
            `Failed to send training.activated notification to employee ${employeeId}: ${error.message}`,
            error.stack,
          );
        }),
      );

      await Promise.allSettled(sendPromises);
    } catch (error) {
      this.logger.error(
        `Error handling training.activated event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent('training.assigned')
  async handleTrainingAssigned(event: TrainingAssignedEvent): Promise<void> {
    try {
      const training = await this.trainingRepository.findOne({
        where: { id: event.trainingId },
      });

      if (!training) {
        this.logger.warn(`Training ${event.trainingId} not found for assignment notification`);
        return;
      }

      const body = training.isMandatory
        ? 'Tienes una capacitación OBLIGATORIA disponible. Debes completarla para continuar usando la aplicación.'
        : 'Tienes una nueva capacitación disponible. Ingresa a la app para verla.';

      const payload = {
        notification: {
          title: 'Nueva Capacitación Disponible',
          body,
        },
        data: {
          notificationId: event.trainingId,
          type: 'TRAINING_ACTIVATED',
          trainingId: event.trainingId,
        },
      };

      await this.pushNotificationService.sendToEmployee(event.employeeId, payload).catch((error) => {
        this.logger.error(
          `Failed to send training.assigned notification to employee ${event.employeeId}: ${error.message}`,
          error.stack,
        );
      });
    } catch (error) {
      this.logger.error(
        `Error handling training.assigned event: ${error.message}`,
        error.stack,
      );
    }
  }
}
