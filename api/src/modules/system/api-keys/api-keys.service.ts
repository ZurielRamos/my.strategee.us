import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ApiKeysService {
    constructor(
        @InjectRepository(ApiKey)
        private readonly apiKeyRepository: Repository<ApiKey>,
    ) {}

    /**
     * Genera una API key segura, almacena su hash y devuelve la key en texto plano (solo esta vez).
     */
    async create(createDto: CreateApiKeyDto): Promise<{ id: number; name: string; key: string; createdAt: Date }> {
        const rawKey = this.generateKey();
        const keyHash = this.hashKey(rawKey);
        const keyPrefix = rawKey.substring(0, 8);
        const keySuffix = rawKey.substring(rawKey.length - 8);

        const apiKey = this.apiKeyRepository.create({
            name: createDto.name,
            keyHash,
            keyPrefix,
            keySuffix,
        });

        const saved = await this.apiKeyRepository.save(apiKey);

        return {
            id: saved.id,
            name: saved.name,
            key: rawKey,
            createdAt: saved.createdAt,
        };
    }

    /**
     * Lista todas las API keys activas (sin exponer el hash).
     */
    async findAll(): Promise<any[]> {
        const keys = await this.apiKeyRepository.find({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
        });

        return keys.map((k) => ({
            id: k.id,
            name: k.name,
            maskedKey: `${k.keyPrefix}••••••••${k.keySuffix}`,
            createdAt: k.createdAt,
            lastUsedAt: k.lastUsedAt,
        }));
    }

    /**
     * Revoca (soft delete) una API key.
     */
    async revoke(id: number): Promise<void> {
        const key = await this.apiKeyRepository.findOne({ where: { id, isActive: true } });

        if (!key) {
            throw new NotFoundException('API Key no encontrada');
        }

        key.isActive = false;
        await this.apiKeyRepository.save(key);
    }

    /**
     * Valida una API key contra el hash almacenado. Actualiza lastUsedAt si es válida.
     */
    async validateKey(rawKey: string, ip?: string): Promise<boolean> {
        const keyHash = this.hashKey(rawKey);

        const apiKey = await this.apiKeyRepository.findOne({
            where: { keyHash, isActive: true },
        });

        if (!apiKey) {
            return false;
        }

        // Actualizar último uso
        apiKey.lastUsedAt = new Date();
        if (ip) {
            apiKey.lastUsedIp = ip;
        }
        await this.apiKeyRepository.save(apiKey);

        return true;
    }

    /**
     * Genera una key aleatoria con prefijo identificador.
     * Formato: sk_live_<32 bytes hex> = 72 caracteres total
     */
    private generateKey(): string {
        const random = randomBytes(32).toString('hex');
        return `sk_live_${random}`;
    }

    /**
     * Genera un hash SHA-256 de la key.
     */
    private hashKey(key: string): string {
        return createHash('sha256').update(key).digest('hex');
    }
}
