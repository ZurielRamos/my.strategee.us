import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AttachmentType } from '../enums/attachment-type.enum';
import { AttachmentFolder } from '../enums/attachment-folder.enum';

export interface AttachmentVariants {
    thumbnail: string;
    small: string;
    medium: string;
    original: string;
}

@Entity('attachments')
@Index(['type', 'folder'])
export class Attachment {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ description: 'UUID del attachment' })
    id: string;

    @Column()
    @ApiProperty({ description: 'Nombre original del archivo' })
    name: string;

    @Column({ nullable: true })
    @ApiProperty({ description: 'Título del archivo', required: false })
    title: string;

    @Column({ type: 'text' })
    @ApiProperty({ description: 'URL pública de Firebase Storage' })
    url: string;

    @Column({ name: 'storage_path' })
    @ApiProperty({ description: 'Ruta interna en Firebase Storage (para eliminar)' })
    storagePath: string;

    @Column({ name: 'mime_type' })
    @ApiProperty({ description: 'Tipo MIME del archivo (image/jpeg, application/pdf…)' })
    mimeType: string;

    @Column({ type: 'int' })
    @ApiProperty({ description: 'Tamaño del archivo en bytes' })
    size: number;

    @Column({ type: 'enum', enum: AttachmentType, default: AttachmentType.OTHER })
    @ApiProperty({ enum: AttachmentType, description: 'Categoría del archivo' })
    type: AttachmentType;

    @Column({ type: 'enum', enum: AttachmentFolder, default: AttachmentFolder.GENERAL })
    @ApiProperty({ enum: AttachmentFolder, description: 'Carpeta de organización en Storage' })
    folder: AttachmentFolder;

    @Column({ nullable: true })
    @ApiProperty({ description: 'Texto alternativo (para imágenes)', required: false })
    alt: string;

    @Column({ type: 'text', nullable: true })
    @ApiProperty({ description: 'Descripción del archivo', required: false })
    description: string;

    @Column({ type: 'json', nullable: true })
    @ApiProperty({
        description: 'URLs de las variantes AVIF generadas (solo para imágenes)',
        example: { thumbnail: 'https://...150.avif', small: 'https://...480.avif', medium: 'https://...1080.avif', original: 'https://....avif' },
        required: false,
    })
    variants: AttachmentVariants | null;

    @Column({ name: 'uploaded_by', nullable: true })
    @ApiProperty({ description: 'ID del usuario que subió el archivo' })
    uploadedBy: string;

    @CreateDateColumn({ name: 'created_at' })
    @ApiProperty()
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    @ApiProperty()
    updatedAt: Date;
}
