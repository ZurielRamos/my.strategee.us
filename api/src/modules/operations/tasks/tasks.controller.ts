import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ListTasksDto, UpdateTaskDto } from './dto/task.dto';

/** Tareas de los tableros a los que el usuario tiene acceso. */
@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    @ApiOperation({ summary: 'Tareas de un tablero, en el orden de cada lista' })
    list(@ActiveUser('sub') userId: string, @Query() query: ListTasksDto) {
        return this.tasksService.listBoardTasks(userId, query.boardId);
    }

    @Get(':id')
    get(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.tasksService.get(userId, id);
    }

    @Post()
    @ApiOperation({ summary: 'Crea una tarea manual en un tablero' })
    create(@ActiveUser('sub') userId: string, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(userId, dto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Edita una tarea o la mueve de lista y posición' })
    update(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
        return this.tasksService.update(userId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Elimina una tarea manual' })
    remove(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.tasksService.remove(userId, id);
    }
}
