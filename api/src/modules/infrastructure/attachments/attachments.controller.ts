import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    Res,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { FindAttachmentsDto } from './dto/find-attachments.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { Attachment } from './entities/attachment.entity';
import { AccessTokenGuard } from '@modules/iam/authentication/guards/access-token.guard';
import { RolesGuard } from '@modules/iam/authorization/guards/roles.guard';
import { Roles } from '@modules/iam/authorization/decorators/roles.decorator';
import { Role } from '@modules/iam/authorization/enums/role.enum';
import { ActiveUser } from '@modules/iam/authorization/decorators/active-user.decorator';

const multerMemoryOptions = { storage: memoryStorage() };

@ApiTags('Attachments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('attachments')
export class AttachmentsController {
    constructor(private readonly attachmentsService: AttachmentsService) { }

    // ─── Upload un solo archivo ────────────────────────────────────────────────

    @Post()
    @Roles(Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
    @UseInterceptors(FileInterceptor('file', multerMemoryOptions))
    @ApiOperation({ summary: 'Subir un archivo a Firebase Storage' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['file'],
            properties: {
                file: { type: 'string', format: 'binary', description: 'Archivo a subir' },
                title: { type: 'string', description: 'Título del archivo' },
                folder: { type: 'string', enum: ['general', 'employees', 'contracts', 'requests', 'logos'], default: 'general' },
                alt: { type: 'string' },
                description: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 201, type: Attachment })
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UploadAttachmentDto,
        @ActiveUser('sub') userId: string,
    ): Promise<Attachment> {
        return this.attachmentsService.upload(file, dto, userId);
    }

    // ─── Upload múltiples archivos ─────────────────────────────────────────────

    @Post('bulk')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @UseInterceptors(FilesInterceptor('files', 10, multerMemoryOptions))
    @ApiOperation({ summary: 'Subir hasta 10 archivos a Firebase Storage' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: ['files'],
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Archivos a subir (máx. 10)',
                },
                title: { type: 'string', description: 'Título del archivo' },
                folder: { type: 'string', enum: ['general', 'employees', 'contracts', 'requests', 'logos'], default: 'general' },
                alt: { type: 'string' },
                description: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 201, type: [Attachment] })
    bulkUpload(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UploadAttachmentDto,
        @ActiveUser('sub') userId: string,
    ): Promise<Attachment[]> {
        return this.attachmentsService.bulkUpload(files, dto, userId);
    }

    // ─── Listar con filtros ────────────────────────────────────────────────────

    @Get()
    @Roles(Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Listar attachments con filtros y paginación' })
    findAll(@Query() dto: FindAttachmentsDto) {
        return this.attachmentsService.findAll(dto);
    }

    // ─── Proxy de archivo (evita CORS con Firebase Storage) ───────────────────

    @Get(':id/proxy')
    @Roles(Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Proxy del archivo — sirve el contenido sin CORS' })
    async proxy(
        @Param('id', ParseUUIDPipe) id: string,
        @Res() res: Response,
    ): Promise<void> {
        const attachment = await this.attachmentsService.findOne(id);
        const response = await fetch(attachment.url);
        if (!response.ok) {
            res.status(502).json({ message: 'Error fetching file from storage' });
            return;
        }
        const contentType = response.headers.get('content-type') ?? attachment.mimeType ?? 'application/octet-stream';
        const contentLength = response.headers.get('content-length');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        if (contentLength) res.setHeader('Content-Length', contentLength);
        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer);
    }

    // ─── Detalle ───────────────────────────────────────────────────────────────

    @Get(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Obtener detalle de un attachment' })
    @ApiResponse({ status: 200, type: Attachment })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Attachment> {
        return this.attachmentsService.findOne(id);
    }

    // ─── Actualizar metadatos ──────────────────────────────────────────────────

    @Patch(':id')
    @Roles(Role.ADMIN, Role.HR_MANAGER)
    @ApiOperation({ summary: 'Actualizar alt o description de un attachment' })
    @ApiResponse({ status: 200, type: Attachment })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAttachmentDto,
    ): Promise<Attachment> {
        return this.attachmentsService.update(id, dto);
    }

    // ─── Eliminar ──────────────────────────────────────────────────────────────

    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Eliminar un attachment de Storage y base de datos' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.attachmentsService.remove(id);
    }
}
