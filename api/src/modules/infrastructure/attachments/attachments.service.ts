import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Attachment } from './entities/attachment.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { ImageProcessorService } from './image-processor.service';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { FindAttachmentsDto } from './dto/find-attachments.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { AttachmentType } from './enums/attachment-type.enum';
import { AttachmentFolder } from './enums/attachment-folder.enum';
import type { AttachmentVariants } from './entities/attachment.entity';

@Injectable()
export class AttachmentsService {
    private readonly logger = new Logger(AttachmentsService.name);

    constructor(
        @InjectRepository(Attachment)
        private readonly attachmentRepository: Repository<Attachment>,
        private readonly firebaseService: FirebaseService,
        private readonly imageProcessorService: ImageProcessorService,
    ) { }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private resolveType(mimeType: string): AttachmentType {
        if (mimeType.startsWith('image/')) return AttachmentType.IMAGE;
        if (mimeType.startsWith('video/')) return AttachmentType.VIDEO;
        if (
            mimeType === 'application/pdf' ||
            mimeType.includes('word') ||
            mimeType.includes('sheet') ||
            mimeType.includes('presentation') ||
            mimeType === 'text/plain'
        ) {
            return AttachmentType.DOCUMENT;
        }
        return AttachmentType.OTHER;
    }

    private buildStoragePath(
        folder: AttachmentFolder,
        uuid: string,
        filename: string,
        suffix?: string,
        ext?: string,
    ): string {
        const finalExt = ext ?? filename.split('.').pop() ?? 'bin';
        const suffixPart = suffix ? `-${suffix}` : '';
        return `${folder}/${uuid}${suffixPart}.${finalExt}`;
    }

    // ─── Upload ──────────────────────────────────────────────────────────────────

    async upload(
            file: Express.Multer.File,
            dto: UploadAttachmentDto,
            uploadedBy?: string,
        ): Promise<Attachment> {
            if (!file) throw new BadRequestException('No file provided');

            const folder = dto.folder ?? AttachmentFolder.GENERAL;
            const uuid = uuidv4();
            const isImage = this.imageProcessorService.isImage(file.mimetype);

            let url: string;
            let storagePath: string;
            let mimeType = file.mimetype;
            let size = file.size;
            let variants: AttachmentVariants | null = null;

            if (isImage) {
                // ── Pipeline de imagen: convertir a AVIF y generar variantes ──────────
                const imageVariants = await this.imageProcessorService.processImage(file.buffer);

                const uploadedVariants = await Promise.all(
                    imageVariants.map(async (v) => {
                        const path = this.buildStoragePath(folder, uuid, file.originalname, v.suffix, 'avif');
                        const variantUrl = await this.firebaseService.uploadFile(v.buffer, path, 'image/avif');
                        return { suffix: v.suffix, url: variantUrl, path };
                    }),
                );

                // Construir mapa de variantes
                variants = uploadedVariants.reduce<AttachmentVariants>((acc, v) => {
                    acc[v.suffix] = v.url;
                    return acc;
                }, {} as AttachmentVariants);

                // La URL principal es la variante medium (uso general)
                const mediumVariant = uploadedVariants.find((v) => v.suffix === 'medium')!;
                url = mediumVariant.url;
                storagePath = mediumVariant.path;
                mimeType = 'image/avif';

                // Tamaño de la variante original procesada
                const originalVariant = imageVariants.find((v) => v.suffix === 'original')!;
                size = originalVariant.buffer.length;

            } else {
                // ── Archivos no-imagen: subir directamente ────────────────────────────
                storagePath = this.buildStoragePath(folder, uuid, file.originalname);
                url = await this.firebaseService.uploadFile(file.buffer, storagePath, file.mimetype);
            }

            const attachment = this.attachmentRepository.create({
                name: file.originalname,
                title: dto.title,
                url,
                storagePath,
                mimeType,
                size,
                type: this.resolveType(file.mimetype),
                folder,
                alt: dto.alt,
                description: dto.description,
                variants,
                uploadedBy,
            });

            return this.attachmentRepository.save(attachment);
        }

    async bulkUpload(
        files: Express.Multer.File[],
        dto: UploadAttachmentDto,
        uploadedBy?: string,
    ): Promise<Attachment[]> {
        if (!files?.length) throw new BadRequestException('No files provided');
        return Promise.all(files.map((f) => this.upload(f, dto, uploadedBy)));
    }

    // ─── Read ────────────────────────────────────────────────────────────────────

    async findAll(dto: FindAttachmentsDto): Promise<{
            data: Attachment[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        }> {
            const { page = 1, limit = 20, type, folder, search, searchTitle, sortByDate = 'DESC' } = dto;
            const skip = (page - 1) * limit;

            const where: Record<string, any> = {};
            if (type) where.type = type;
            if (folder) where.folder = folder;
            if (search) where.name = Like(`%${search}%`);
            if (searchTitle) where.title = Like(`%${searchTitle}%`);

            const [data, total] = await this.attachmentRepository.findAndCount({
                where,
                order: { createdAt: sortByDate },
                skip,
                take: limit,
            });

            return {
                data,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }

    async findOne(id: string): Promise<Attachment> {
        const attachment = await this.attachmentRepository.findOne({ where: { id } });
        if (!attachment) throw new NotFoundException(`Attachment #${id} no encontrado`);
        return attachment;
    }

    // ─── Update ──────────────────────────────────────────────────────────────────

    async update(id: string, dto: UpdateAttachmentDto): Promise<Attachment> {
        const attachment = await this.findOne(id);
        Object.assign(attachment, dto);
        return this.attachmentRepository.save(attachment);
    }

    // ─── Delete ──────────────────────────────────────────────────────────────────

    async remove(id: string): Promise<{ message: string }> {
        const attachment = await this.findOne(id);

        // Si es imagen, eliminar todas las variantes de Storage
        if (attachment.variants) {
            const variantPaths = Object.values(attachment.variants).map((variantUrl) => {
                // Extraer el path desde la URL pública de GCS
                const url = new URL(variantUrl);
                return decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
            });
            await Promise.all(variantPaths.map((p) => this.firebaseService.deleteFile(p)));
        } else {
            await this.firebaseService.deleteFile(attachment.storagePath);
        }

        await this.attachmentRepository.remove(attachment);
        this.logger.log(`Attachment ${id} eliminado correctamente`);
        return { message: `Attachment ${id} eliminado correctamente` };
    }
}
