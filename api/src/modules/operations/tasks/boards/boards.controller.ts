import {
    Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { BoardsService } from './boards.service';
import { TasksService } from '../tasks.service';
import { BoardNameDto, CreateListDto, DeleteListDto, ShareBoardDto, UpdateListDto } from '../dto/task.dto';

/**
 * Tableros de tareas. El dueño administra el tablero, sus listas y con quién se comparte;
 * quienes tienen acceso ven y gestionan sus tareas.
 */
@ApiTags('Task boards')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('boards')
export class BoardsController {
    constructor(
        private readonly boardsService: BoardsService,
        private readonly tasksService: TasksService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Mis tableros y los compartidos conmigo (Recapmeeting primero)' })
    list(@ActiveUser('sub') userId: string) {
        return this.boardsService.listBoards(userId);
    }

    @Get('share-options')
    @ApiOperation({ summary: 'Empleados y departamentos con los que se puede compartir' })
    shareOptions(@ActiveUser('sub') userId: string) {
        return this.boardsService.shareOptions(userId);
    }

    @Post()
    create(@ActiveUser('sub') userId: string, @Body() dto: BoardNameDto) {
        return this.boardsService.createBoard(userId, dto.name);
    }

    @Patch(':id')
    rename(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: BoardNameDto) {
        return this.boardsService.renameBoard(userId, id, dto.name);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Elimina el tablero y sus tareas' })
    remove(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.boardsService.deleteBoard(userId, id);
    }

    @Put(':id/shares')
    @ApiOperation({ summary: 'Define con qué empleados y departamentos se comparte' })
    share(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ShareBoardDto) {
        return this.boardsService.setShares(userId, id, dto.userIds, dto.departmentIds);
    }

    @Get(':id/members')
    @ApiOperation({ summary: 'Personas con acceso (posibles responsables)' })
    members(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string) {
        return this.boardsService.members(userId, id);
    }

    // --- Listas ---

    @Post(':id/lists')
    createList(@ActiveUser('sub') userId: string, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateListDto) {
        return this.boardsService.createList(userId, id, dto.name, dto.isDone ?? false);
    }

    @Patch('lists/:listId')
    @ApiOperation({ summary: 'Renombra, reordena o marca una lista como "hechas"' })
    async updateList(
        @ActiveUser('sub') userId: string,
        @Param('listId', ParseUUIDPipe) listId: string,
        @Body() dto: UpdateListDto,
    ) {
        if (dto.name !== undefined) await this.boardsService.renameList(userId, listId, dto.name);
        if (dto.isDone !== undefined) await this.tasksService.setListDone(userId, listId, dto.isDone);
        if (dto.position !== undefined) await this.boardsService.moveList(userId, listId, dto.position);
        return this.boardsService.getOwnedList(userId, listId);
    }

    @Delete('lists/:listId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Elimina una lista; sus tareas pasan a moveToListId' })
    deleteList(
        @ActiveUser('sub') userId: string,
        @Param('listId', ParseUUIDPipe) listId: string,
        @Query() dto: DeleteListDto,
    ) {
        return this.tasksService.deleteList(userId, listId, dto.moveToListId);
    }
}
