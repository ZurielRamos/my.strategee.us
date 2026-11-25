import {
    Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query,
    UploadedFile, UseGuards, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';
import { MinutesService } from './minutes.service';
import { ClientFilterDto, ListMinutesDto } from './dto/list-minutes.dto';
import { SaveMinuteDto } from './dto/save-minute.dto';

/** Mismo límite que recapmeeting para adjuntos. */
const uploadOptions = { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } };

/**
 * Actas de recapmeeting. Todas las operaciones se hacen en nombre del usuario autenticado
 * (por su correo), que debe existir como colaborador en recapmeeting.
 */
@ApiTags('Minutes')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller('minutes')
export class MinutesController {
    constructor(private readonly minutesService: MinutesService) { }

    @Get()
    @ApiOperation({ summary: 'Actas finalizadas de la empresa y borradores propios (50 por página)' })
    list(@ActiveUser('email') email: string, @Query() query: ListMinutesDto) {
        return this.minutesService.list(email, query.page ?? 1, query.client_id, query.project_id);
    }

    @Get('clients')
    @ApiOperation({ summary: 'Clientes de la empresa' })
    clients(@ActiveUser('email') email: string) {
        return this.minutesService.clients(email);
    }

    @Get('projects')
    @ApiOperation({ summary: 'Proyectos, opcionalmente de un cliente' })
    projects(@ActiveUser('email') email: string, @Query() query: ClientFilterDto) {
        return this.minutesService.projects(email, query.client_id);
    }

    @Get('team/users')
    @ApiOperation({ summary: 'Colaboradores de la empresa y asistentes externos del cliente' })
    teamUsers(@ActiveUser('email') email: string, @Query() query: ClientFilterDto) {
        return this.minutesService.teamUsers(email, query.client_id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Detalle de un acta con compromisos, asistentes y adjuntos' })
    detail(@ActiveUser('email') email: string, @Param('id', ParseIntPipe) id: number) {
        return this.minutesService.detail(email, String(id));
    }

    @Post()
    @ApiOperation({ summary: 'Crea un acta: state 1 = borrador, 0 = publicar (envía los correos)' })
    create(@ActiveUser('email') email: string, @Body() dto: SaveMinuteDto) {
        return this.minutesService.save(email, dto);
    }

    @Post(':id/update')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Actualiza un borrador propio; con state 0 lo publica' })
    update(@ActiveUser('email') email: string, @Param('id', ParseIntPipe) id: number, @Body() dto: SaveMinuteDto) {
        return this.minutesService.save(email, dto, String(id));
    }

    @Post(':id/discard')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Descarta (elimina) un borrador propio' })
    discard(@ActiveUser('email') email: string, @Param('id', ParseIntPipe) id: number) {
        return this.minutesService.discard(email, String(id));
    }

    @Post(':id/images')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', uploadOptions))
    @ApiOperation({ summary: 'Adjunta una imagen a un borrador propio' })
    uploadImage(
        @ActiveUser('email') email: string,
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('El archivo es requerido');
        return this.minutesService.upload(email, String(id), 'image', file);
    }

    @Post(':id/documents')
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file', uploadOptions))
    @ApiOperation({ summary: 'Adjunta un documento a un borrador propio' })
    uploadDocument(
        @ActiveUser('email') email: string,
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('El archivo es requerido');
        return this.minutesService.upload(email, String(id), 'document', file);
    }
}
