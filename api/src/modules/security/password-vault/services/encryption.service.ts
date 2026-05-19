import {
    Injectable,
    InternalServerErrorException,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * EncryptionService
 * 
 * Servicio dedicado para cifrado y descifrado de datos sensibles usando AES-256-GCM.
 * Implementa cifrado autenticado con derivación de clave mediante PBKDF2.
 * 
 * Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
@Injectable()
export class EncryptionService implements OnModuleInit {
    private readonly algorithm = 'aes-256-gcm';
    private key: Buffer;

    constructor(private readonly configService: ConfigService) {}

    /**
     * Inicializa la clave de cifrado al arrancar el módulo
     * Deriva la clave usando PBKDF2 con 100,000 iteraciones
     */
    onModuleInit() {
        const secret = this.configService.get<string>('ENCRYPTION_SECRET');
        const salt = this.configService.get<string>('ENCRYPTION_SALT');

        if (!secret || !salt) {
            throw new Error(
                'ENCRYPTION_SECRET and ENCRYPTION_SALT must be defined in environment variables',
            );
        }

        // Derive key using PBKDF2 with 100,000 iterations for security
        this.key = crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha256');
    }

    /**
     * Cifra un texto usando AES-256-GCM
     * 
     * @param text - Texto plano a cifrar
     * @returns String en formato "iv:authTag:encryptedData" (todos en hexadecimal)
     * @throws InternalServerErrorException si el cifrado falla
     */
    encrypt(text: string): string {
        try {
            // Generate random initialization vector (16 bytes for AES)
            const iv = crypto.randomBytes(16);

            // Create cipher with algorithm, key, and IV
            const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

            // Encrypt the text
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Get authentication tag for GCM mode
            const authTag = cipher.getAuthTag();

            // Return format: iv:authTag:encryptedData
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error al cifrar los datos',
            );
        }
    }

    /**
     * Descifra un texto cifrado con AES-256-GCM
     * 
     * @param encryptedText - String en formato "iv:authTag:encryptedData"
     * @returns Texto plano descifrado
     * @throws InternalServerErrorException si el descifrado falla o la autenticación no es válida
     */
    decrypt(encryptedText: string): string {
        try {
            // Parse the encrypted text format: iv:authTag:encryptedData
            const parts = encryptedText.split(':');

            if (parts.length !== 3) {
                throw new Error('Invalid encrypted text format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];

            // Create decipher with algorithm, key, and IV
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);

            // Set authentication tag for verification
            decipher.setAuthTag(authTag);

            // Decrypt the text
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new InternalServerErrorException(
                'Error al descifrar los datos',
            );
        }
    }
}
