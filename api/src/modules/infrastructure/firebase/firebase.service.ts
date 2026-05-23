import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private bucket: any;

    constructor(private readonly configService: ConfigService) { }

    onModuleInit() {
        const storageBucket = this.configService.get<string>('firebase.storageBucket');

        this.logger.log(`Firebase Storage Bucket from config: "${storageBucket}"`);

        if (!admin.apps.length) {
            const config: admin.AppOptions = {
                credential: admin.credential.cert({
                    projectId: this.configService.get<string>('firebase.projectId'),
                    clientEmail: this.configService.get<string>('firebase.clientEmail'),
                    privateKey: this.configService.get<string>('firebase.privateKey'),
                }),
            };

            if (storageBucket && storageBucket.trim() !== '') {
                config.storageBucket = storageBucket;
                admin.initializeApp(config);
                this.logger.log('Firebase Admin SDK initialized with Storage');
            } else {
                admin.initializeApp(config);
                this.logger.log('Firebase Admin SDK initialized without Storage');
            }
        } else {
            this.logger.log('Firebase Admin SDK already initialized, reusing existing app');
        }

        // Intentar obtener el bucket siempre, independientemente de quién inicializó Firebase
        if (storageBucket && storageBucket.trim() !== '') {
            try {
                this.bucket = admin.storage().bucket(storageBucket);
                this.logger.log(`Firebase Storage bucket initialized: ${storageBucket}`);
            } catch (error) {
                this.logger.error(`Failed to initialize Firebase Storage bucket: ${error.message}`);
            }
        } else {
            this.logger.warn('Firebase Storage bucket not configured. File upload features will not be available.');
        }
    }


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getBucket(): any {
        if (!this.bucket) {
            throw new Error('Firebase Storage bucket is not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.');
        }
        return this.bucket;
    }

    /**
     * Sube un archivo a Firebase Storage y retorna la URL pública.
     * @param fileBuffer   Buffer del archivo
     * @param storagePath  Ruta destino en el bucket (ej. "general/uuid-filename.jpg")
     * @param mimeType     Tipo MIME del archivo
     */
    async uploadFile(
        fileBuffer: Buffer,
        storagePath: string,
        mimeType: string,
    ): Promise<string> {
        if (!this.bucket) {
            throw new Error('Firebase Storage bucket is not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.');
        }
        
        const file = this.bucket.file(storagePath);

        await file.save(fileBuffer, {
            metadata: { contentType: mimeType },
            resumable: false,
        });

        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${storagePath}`;
        return publicUrl;
    }

    /**
     * Elimina un archivo del bucket de Firebase Storage.
     * @param storagePath  Ruta del archivo en el bucket
     */
    async deleteFile(storagePath: string): Promise<void> {
        if (!this.bucket) {
            throw new Error('Firebase Storage bucket is not configured. Please set FIREBASE_STORAGE_BUCKET environment variable.');
        }
        
        const file = this.bucket.file(storagePath);
        const [exists] = await file.exists();
        if (exists) {
            await file.delete();
        }
    }
}
