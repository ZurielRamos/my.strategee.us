import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BahamasConfig } from './entities/bahamas-config.entity';
import { UpdateBahamasConfigDto } from './dto/update-bahamas-config.dto';
import { WhatsappService } from '../../infrastructure/whatsapp/whatsapp.service';

@Injectable()
export class BahamasService {
    constructor(
        @InjectRepository(BahamasConfig)
        private readonly bahamasConfigRepository: Repository<BahamasConfig>,
        private readonly whatsappService: WhatsappService,
    ) {}

    /**
     * Obtener la configuración de Bahamas (siempre un único registro)
     */
    async getConfig(): Promise<BahamasConfig> {
        let config = await this.bahamasConfigRepository.findOne({
            where: {},
            order: { createdAt: 'ASC' },
        });

        // Si no existe, crear con valores por defecto
        if (!config) {
            config = this.bahamasConfigRepository.create({});
            await this.bahamasConfigRepository.save(config);
        }

        return config;
    }

    /**
     * Actualizar la configuración de Bahamas
     */
    async updateConfig(updateDto: UpdateBahamasConfigDto): Promise<BahamasConfig> {
        const config = await this.getConfig();
        Object.assign(config, updateDto);
        return await this.bahamasConfigRepository.save(config);
    }

    /**
     * Obtener configuración completa para integración externa.
     * Incluye: instanceName del dispositivo, URL y API key de Evolution API, y horarios.
     */
    async getIntegrationConfig() {
        const config = await this.getConfig();

        if (!config.whatsappDeviceId) {
            throw new NotFoundException('No hay dispositivo WhatsApp configurado para Bahamas');
        }

        // Obtener datos del dispositivo
        const devices = await this.whatsappService.findAllDevices();
        const device = devices.find(d => d.id === config.whatsappDeviceId);

        if (!device) {
            throw new NotFoundException('El dispositivo WhatsApp configurado no existe');
        }

        // Obtener config de WhatsApp (Evolution API URL + key)
        const whatsappConfig = await this.whatsappService.getConfig();

        if (!whatsappConfig) {
            throw new NotFoundException('La configuración de WhatsApp (Evolution API) no está definida');
        }

        const now = new Date();
        const isSaturday = now.getDay() === 6;

        return {
            whatsapp: {
                instanceName: device.instanceName,
                apiUrl: whatsappConfig.apiUrl,
                apiKey: whatsappConfig.apiKey,
            },
            schedule: isSaturday
                ? {
                    morning: {
                        start: config.saturdayStart,
                        end: config.saturdayEnd,
                        delivery: config.saturdayDelivery,
                    },
                }
                : {
                    morning: {
                        start: config.morningStart,
                        end: config.morningEnd,
                        delivery: config.morningDelivery,
                    },
                    afternoon: {
                        start: config.afternoonStart,
                        end: config.afternoonEnd,
                        delivery: config.afternoonDelivery,
                    },
                },
        };
    }
}
