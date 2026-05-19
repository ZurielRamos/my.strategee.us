import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface ImageVariant {
    suffix: 'thumbnail' | 'small' | 'medium' | 'original';
    buffer: Buffer;
    mimeType: string;
}

export interface ProcessedVariants {
    thumbnail: Buffer;
    small: Buffer;
    medium: Buffer;
    original: Buffer;
}

const VARIANTS = [
    { suffix: 'thumbnail' as const, width: 150 },
    { suffix: 'small' as const, width: 480 },
    { suffix: 'medium' as const, width: 1080 },
    { suffix: 'original' as const, width: null },
] satisfies { suffix: ImageVariant['suffix']; width: number | null }[];

const AVIF_OPTIONS: sharp.AvifOptions = {
    quality: 75,
    effort: 4, // 0-9, mayor = mejor compresión pero más lento
};

@Injectable()
export class ImageProcessorService {
    private readonly logger = new Logger(ImageProcessorService.name);

    isImage(mimeType: string): boolean {
        return mimeType.startsWith('image/');
    }

    /**
     * Convierte una imagen a AVIF y genera 4 variantes de tamaño.
     * @returns Array de variantes listas para subir a Storage
     */
    async processImage(inputBuffer: Buffer): Promise<ImageVariant[]> {
        const base = sharp(inputBuffer).rotate(); // rotate respeta EXIF

        const variants: ImageVariant[] = await Promise.all(
            VARIANTS.map(async ({ suffix, width }) => {
                let pipeline = base.clone();

                if (width !== null) {
                    pipeline = pipeline.resize(width, null, {
                        withoutEnlargement: true, // No ampliar imágenes pequeñas
                        fit: 'inside',
                    });
                }

                const buffer = await pipeline
                    .avif(AVIF_OPTIONS)
                    .toBuffer();

                return { suffix, buffer, mimeType: 'image/avif' };
            }),
        );

        this.logger.debug(
            `Image processed → ${variants.map((v) => `${v.suffix}:${(v.buffer.length / 1024).toFixed(1)}KB`).join(', ')}`,
        );

        return variants;
    }
}
