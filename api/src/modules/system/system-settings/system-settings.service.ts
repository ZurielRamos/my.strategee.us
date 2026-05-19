import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

@Injectable()
export class SystemSettingsService {
    constructor(
        @InjectRepository(SystemSettings)
        private readonly systemSettingsRepository: Repository<SystemSettings>,
    ) {}

    /**
     * Obtener las configuraciones del sistema (siempre debe haber un único registro)
     */
    async getSettings(): Promise<SystemSettings> {
        let settings = await this.systemSettingsRepository.findOne({
            where: {},
            order: { createdAt: 'ASC' }
        });

        // Si no existe, crear con valores por defecto
        if (!settings) {
            settings = this.systemSettingsRepository.create({
                vacationDaysLaborContract: 15,
                vacationDaysServiceContract: 15,
                hoursPerWorkday: 8
            });
            await this.systemSettingsRepository.save(settings);
        }

        return settings;
    }

    /**
     * Actualizar las configuraciones del sistema
     */
    async updateSettings(updateDto: UpdateSystemSettingsDto): Promise<SystemSettings> {
        const settings = await this.getSettings();
        
        Object.assign(settings, updateDto);
        
        return await this.systemSettingsRepository.save(settings);
    }
}
