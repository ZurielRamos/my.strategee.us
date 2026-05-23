import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Training } from './entities/training.entity';
import { TrainingMaterial } from './entities/training-material.entity';
import { TrainingQuiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';
import { TrainingAssignment } from './entities/training-assignment.entity';
import { TrainingMaterialProgress } from './entities/training-material-progress.entity';
import { TrainingExclusion } from './entities/training-exclusion.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { TrainingsController } from './trainings.controller';
import { TrainingMaterialsController } from './training-materials.controller';
import { TrainingQuizController } from './training-quiz.controller';
import { TrainingAssignmentsController } from './training-assignments.controller';
import { TrainingExclusionsController } from './training-exclusions.controller';
import { TrainingsService } from './trainings.service';
import { TrainingMaterialsService } from './training-materials.service';
import { TrainingQuizService } from './training-quiz.service';
import { TrainingAssignmentsService } from './training-assignments.service';
import { TrainingExclusionsService } from './training-exclusions.service';
import { TrainingSchedulerService } from './training-scheduler.service';
import { TrainingNotificationListener } from './listeners/training-notification.listener';
import { InfrastructureModule } from '@modules/infrastructure/infrastructure.module';
import { PushNotificationsModule } from '@modules/notifications/push-notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Training,
      TrainingMaterial,
      TrainingQuiz,
      QuizQuestion,
      QuizOption,
      TrainingAssignment,
      TrainingMaterialProgress,
      TrainingExclusion,
      Employee,
    ]),
    InfrastructureModule,
    PushNotificationsModule,
  ],
  controllers: [
    TrainingsController,
    TrainingMaterialsController,
    TrainingQuizController,
    TrainingAssignmentsController,
    TrainingExclusionsController,
  ],
  providers: [
    TrainingsService,
    TrainingMaterialsService,
    TrainingQuizService,
    TrainingAssignmentsService,
    TrainingExclusionsService,
    TrainingSchedulerService,
    TrainingNotificationListener,
  ],
})
export class TrainingsModule {}
