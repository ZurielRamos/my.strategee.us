import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WhatsappConfig } from './entities/whatsapp-config.entity';
import { WhatsappDevice } from './entities/whatsapp-device.entity';
import { UpdateWhatsappConfigDto } from './dto/update-whatsapp-config.dto';
import { CreateWhatsappDeviceDto } from './dto/create-whatsapp-device.dto';

@Injectable()
export class WhatsappService {
    constructor(
        @InjectRepository(WhatsappConfig)
        private readonly configRepository: Repository<WhatsappConfig>,
        @InjectRepository(WhatsappDevice)
        private readonly deviceRepository: Repository<WhatsappDevice>,
        private readonly httpService: HttpService,
    ) {}

    // ===================== CONFIG =====================

    async getConfig(): Promise<WhatsappConfig | null> {
        return this.configRepository.findOne({ where: {}, order: { createdAt: 'ASC' } });
    }

    async updateConfig(dto: UpdateWhatsappConfigDto): Promise<WhatsappConfig> {
        let config = await this.configRepository.findOne({ where: {}, order: { createdAt: 'ASC' } });

        if (!config) {
            config = this.configRepository.create(dto);
        } else {
            Object.assign(config, dto);
        }

        return this.configRepository.save(config);
    }

    // ===================== DEVICES =====================

    async findAllDevices(): Promise<WhatsappDevice[]> {
        return this.deviceRepository.find({ order: { createdAt: 'DESC' } });
    }

    /**
     * Normaliza la URL base removiendo trailing slashes
     */
    private normalizeUrl(url: string): string {
        return url.replace(/\/+$/, '');
    }

    async createDevice(dto: CreateWhatsappDeviceDto): Promise<WhatsappDevice> {
        const config = await this.getConfig();
        if (!config) {
            throw new BadRequestException('La configuración de WhatsApp no está definida. Configure la URL y API Key primero.');
        }

        const baseUrl = this.normalizeUrl(config.apiUrl);

        // Crear instancia en Evolution API
        try {
            await firstValueFrom(
                this.httpService.post(
                    `${baseUrl}/instance/create`,
                    {
                        instanceName: dto.instanceName,
                        integration: 'WHATSAPP-BAILEYS',
                    },
                    {
                        headers: { apikey: config.apiKey },
                    },
                ),
            );
        } catch (error: any) {
            const message = error?.response?.data?.message 
                || error?.response?.data?.response?.message
                || error?.message 
                || 'Error desconocido';
            throw new BadRequestException(`Error al crear instancia en Evolution API: ${Array.isArray(message) ? message.join(', ') : message}`);
        }

        // Guardar dispositivo local
        const device = this.deviceRepository.create({
            name: dto.name,
            instanceName: dto.instanceName,
            status: 'disconnected',
        });

        return this.deviceRepository.save(device);
    }

    async getDeviceStatus(id: string): Promise<{ status: string; phoneNumber?: string }> {
        const device = await this.deviceRepository.findOne({ where: { id } });
        if (!device) {
            throw new NotFoundException('Dispositivo no encontrado');
        }

        const config = await this.getConfig();
        if (!config) {
            throw new BadRequestException('Configuración de WhatsApp no definida');
        }

        const baseUrl = this.normalizeUrl(config.apiUrl);

        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${baseUrl}/instance/connectionState/${device.instanceName}`,
                    { headers: { apikey: config.apiKey } },
                ),
            );

            const state = response.data?.instance?.state || 'disconnected';
            const status = state === 'open' ? 'connected' : state === 'connecting' ? 'connecting' : 'disconnected';

            // Actualizar estado en BD
            device.status = status;
            await this.deviceRepository.save(device);

            return { status, phoneNumber: device.phoneNumber };
        } catch (error) {
            return { status: device.status };
        }
    }

    async getDeviceQr(id: string): Promise<{ qrcode: string }> {
        const device = await this.deviceRepository.findOne({ where: { id } });
        if (!device) {
            throw new NotFoundException('Dispositivo no encontrado');
        }

        const config = await this.getConfig();
        if (!config) {
            throw new BadRequestException('Configuración de WhatsApp no definida');
        }

        const baseUrl = this.normalizeUrl(config.apiUrl);

        try {
            const response = await firstValueFrom(
                this.httpService.get(
                    `${baseUrl}/instance/connect/${device.instanceName}`,
                    { headers: { apikey: config.apiKey } },
                ),
            );

            const qrcode = response.data?.base64 || response.data?.qrcode?.base64 || null;

            if (!qrcode) {
                throw new BadRequestException('No se pudo generar el QR. Puede que el dispositivo ya esté conectado.');
            }

            return { qrcode };
        } catch (error: any) {
            if (error instanceof BadRequestException) throw error;
            const message = error?.response?.data?.message || error?.message || 'Error desconocido';
            throw new BadRequestException(`Error al obtener QR: ${message}`);
        }
    }

    async deleteDevice(id: string): Promise<void> {
        const device = await this.deviceRepository.findOne({ where: { id } });
        if (!device) {
            throw new NotFoundException('Dispositivo no encontrado');
        }

        const config = await this.getConfig();
        const baseUrl = config ? this.normalizeUrl(config.apiUrl) : null;

        // Intentar eliminar la instancia en Evolution API
        if (config && baseUrl) {
            try {
                await firstValueFrom(
                    this.httpService.delete(
                        `${baseUrl}/instance/delete/${device.instanceName}`,
                        { headers: { apikey: config.apiKey } },
                    ),
                );
            } catch (error) {
                // Si falla en Evolution API, igualmente eliminamos localmente
                console.warn(`No se pudo eliminar instancia ${device.instanceName} en Evolution API`);
            }
        }

        await this.deviceRepository.remove(device);
    }
}
