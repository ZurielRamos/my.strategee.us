import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/iam/users/entities/user.entity';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Department } from '@modules/organization/departments/entities/department.entity';
import { UsersModule } from '@modules/iam/users/users.module';
import { GoogleWorkspaceModule } from '@modules/iam/google-workspace/google-workspace.module';
import { MinutesModule } from '../minutes/minutes.module';
import { Task } from './entities/task.entity';
import { TaskSyncState } from './entities/task-sync-state.entity';
import { Board } from './entities/board.entity';
import { BoardList } from './entities/board-list.entity';
import { BoardShare } from './entities/board-share.entity';
import { GoogleTaskList } from './entities/google-task-list.entity';
import { BoardsService } from './boards/boards.service';
import { BoardsController } from './boards/boards.controller';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRecapSyncService } from './tasks-recap-sync.service';
import { TasksGoogleSyncService } from './tasks-google-sync.service';
import { TasksSyncScheduler } from './tasks-sync.scheduler';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, TaskSyncState, Board, BoardList, BoardShare, GoogleTaskList, User, Employee, Department]),
        UsersModule,
        GoogleWorkspaceModule,
        MinutesModule,
    ],
    controllers: [TasksController, BoardsController],
    providers: [BoardsService, TasksService, TasksRecapSyncService, TasksGoogleSyncService, TasksSyncScheduler],
    exports: [TasksService],
})
export class TasksModule { }
