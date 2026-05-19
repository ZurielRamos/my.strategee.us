import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { GlobalParameter } from './entities/global-parameter.entity';
import { CreateGlobalParameterDto } from './dto/create-global-parameter.dto';
import { UpdateGlobalParameterDto } from './dto/update-global-parameter.dto';
import { GlobalParameterKey } from './enums/global-parameter-key.enum';

@Injectable()
export class GlobalParametersService {
    constructor(
        @InjectRepository(GlobalParameter)
        private readonly globalParametersRepository: Repository<GlobalParameter>,
    ) { }

    async create(createGlobalParameterDto: CreateGlobalParameterDto): Promise<GlobalParameter> {
        const parameter = this.globalParametersRepository.create(createGlobalParameterDto);
        return this.globalParametersRepository.save(parameter);
    }

    async findAll(): Promise<GlobalParameter[]> {
        const now = new Date();
        const parameters = await this.globalParametersRepository.find({
            order: { validFrom: 'DESC' }
        });

        const uniqueParams = new Map<string, GlobalParameter>();

        // Group by key
        const paramsByKey = new Map<string, GlobalParameter[]>();
        for (const param of parameters) {
            const list = paramsByKey.get(param.key);
            if (list) {
                list.push(param);
            } else {
                paramsByKey.set(param.key, [param]);
            }
        }

        // For each key, find the best parameter
        for (const [key, params] of paramsByKey) {
            // 1. Try to find the latest valid parameter (validFrom <= now)
            // Params are already sorted by validFrom DESC
            const currentParam = params.find(p => new Date(p.validFrom) <= now);

            if (currentParam) {
                uniqueParams.set(key, currentParam);
            } else {
                // 2. Fallback: Find the nearest future parameter (validFrom > now)
                // Since params are sorted DESC, the nearest future param is the LAST one in the list (smallest date > now)
                // Actually, let's just reverse find or sort properly.
                // If sorted DESC: [Future2026, Future2025] -> We want Future2025.
                const futureParams = params.filter(p => new Date(p.validFrom) > now);
                if (futureParams.length > 0) {
                    // Sort ASC to get the nearest future date
                    futureParams.sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());
                    uniqueParams.set(key, futureParams[0]);
                }
            }
        }

        return Array.from(uniqueParams.values());
    }

    async findHistoryByKey(key: string): Promise<GlobalParameter[]> {
        return this.globalParametersRepository.find({
            where: { key },
            order: { validFrom: 'DESC' }
        });
    }

    async findOne(id: string): Promise<GlobalParameter> {
        const parameter = await this.globalParametersRepository.findOne({ where: { id } });
        if (!parameter) {
            throw new NotFoundException(`Parámetro con ID ${id} no encontrado`);
        }
        return parameter;
    }

    async update(id: string, updateGlobalParameterDto: UpdateGlobalParameterDto): Promise<GlobalParameter> {
        const parameter = await this.findOne(id);
        Object.assign(parameter, updateGlobalParameterDto);
        return this.globalParametersRepository.save(parameter);
    }

    async remove(id: string): Promise<void> {
        const parameter = await this.findOne(id);
        await this.globalParametersRepository.remove(parameter);
    }

    /**
     * Obtiene el valor vigente de un parámetro para una fecha dada.
     * Si no se especifica fecha, usa la fecha actual.
     */
    async getValue(key: string, date: Date = new Date()): Promise<number> {
        // 1. Try to find the latest valid parameter (validFrom <= date)
        const parameter = await this.globalParametersRepository.createQueryBuilder('param')
            .where('param.key = :key', { key })
            .andWhere('param.validFrom <= :date', { date })
            .orderBy('param.validFrom', 'DESC')
            .getOne();

        if (parameter) {
            return Number(parameter.value);
        }

        // 2. Fallback: If no valid parameter, find the nearest future parameter (validFrom > date)
        // We order by ASC to get the one closest to the date
        const futureParameter = await this.globalParametersRepository.createQueryBuilder('param')
            .where('param.key = :key', { key })
            .andWhere('param.validFrom > :date', { date })
            .orderBy('param.validFrom', 'ASC')
            .getOne();

        if (futureParameter) {
            return Number(futureParameter.value);
        }

        throw new NotFoundException(`No se encontró valor vigente ni programado para ${key} en la fecha ${date.toISOString()}`);
    }
}
