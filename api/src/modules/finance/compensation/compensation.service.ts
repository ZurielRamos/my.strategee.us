import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compensation } from './entities/compensation.entity';
import { CreateCompensationDto } from './dto/create-compensation.dto';
import { UpdateCompensationDto } from './dto/update-compensation.dto';
import { GlobalParametersService } from '../global-parameters/global-parameters.service';

@Injectable()
export class CompensationService {
    constructor(
        @InjectRepository(Compensation)
        private readonly compensationRepository: Repository<Compensation>,
        private readonly globalParametersService: GlobalParametersService,
    ) { }

    async create(createCompensationDto: CreateCompensationDto): Promise<Compensation> {
        const compensation = this.compensationRepository.create(createCompensationDto);
        return this.compensationRepository.save(compensation);
    }

    async findAll(): Promise<any[]> {
        const compensations = await this.compensationRepository.find({
            relations: ['employee'],
        });

        return Promise.all(compensations.map(async (comp) => {
            const calculatedValue = await this.calculateEffectiveValue(comp);
            return { ...comp, currentValue: calculatedValue };
        }));
    }

    async findOne(id: string): Promise<any> {
        const compensation = await this.compensationRepository.findOne({
            where: { id },
            relations: ['employee'],
        });

        if (!compensation) {
            throw new NotFoundException(`Compensación con ID ${id} no encontrada`);
        }

        const calculatedValue = await this.calculateEffectiveValue(compensation);
        return { ...compensation, currentValue: calculatedValue };
    }

    /*
     * Trae solo las compensaciones vigentes y con su valor calculado.
     */
    async findActiveByEmployee(employeeId: string): Promise<any[]> {
        const currentDate = new Date();

        // Query logic:
        // employeeId match
        // isActive = true
        // startDate <= current
        // endDate >= current OR endDate is NULL

        const compensations = await this.compensationRepository.createQueryBuilder('comp')
            .leftJoinAndSelect('comp.employee', 'employee')
            .where('comp.employeeId = :employeeId', { employeeId })
            .andWhere('comp.isActive = :isActive', { isActive: true })
            .andWhere('comp.startDate <= :date', { date: currentDate })
            .andWhere('(comp.endDate >= :date OR comp.endDate IS NULL)', { date: currentDate })
            .getMany();

        return Promise.all(compensations.map(async (comp) => {
            const calculatedValue = await this.calculateEffectiveValue(comp);
            return { ...comp, currentValue: calculatedValue };
        }));
    }

    async update(id: string, updateCompensationDto: UpdateCompensationDto): Promise<Compensation> {
        const compensation = await this.compensationRepository.findOne({ where: { id } });
        if (!compensation) {
            throw new NotFoundException(`Compensación con ID ${id} no encontrada`);
        }
        Object.assign(compensation, updateCompensationDto);
        return this.compensationRepository.save(compensation);
    }

    async remove(id: string): Promise<void> {
        const compensation = await this.compensationRepository.findOne({ where: { id } });
        if (!compensation) {
            throw new NotFoundException(`Compensación con ID ${id} no encontrada`);
        }
        await this.compensationRepository.remove(compensation);
    }

    /**
     * Obtiene todas las compensaciones de un empleado (historial completo)
     */
    async findAllByEmployee(employeeId: string): Promise<any[]> {
        const compensations = await this.compensationRepository.find({
            where: { employeeId },
            relations: ['employee'],
            order: { createdAt: 'DESC' }
        });

        return Promise.all(compensations.map(async (comp) => {
            const calculatedValue = await this.calculateEffectiveValue(comp);
            return { ...comp, currentValue: calculatedValue };
        }));
    }

    /**
     * Cancela una compensación cambiando su estado a CANCELLED
     */
    async cancel(id: string): Promise<Compensation> {
        const compensation = await this.compensationRepository.findOne({ where: { id } });
        if (!compensation) {
            throw new NotFoundException(`Compensación con ID ${id} no encontrada`);
        }
        compensation.status = 'CANCELLED' as any;
        compensation.isActive = false;
        return this.compensationRepository.save(compensation);
    }

    /**
     * Calcula el valor efectivo de una compensación.
     * Si está vinculada a un parámetro global, obtiene el valor vigente.
     * Si no, usa el monto fijo.
     */
    async calculateEffectiveValue(compensation: Compensation): Promise<number> {
        if (compensation.linkedGlobalParameter) {
            try {
                return await this.globalParametersService.getValue(compensation.linkedGlobalParameter);
            } catch (error) {
                // Fallback or rethrow? For now, rethrow or return 0 if critical.
                // Assuming service keeps data integrity, this should be consistent.
                console.warn(`Could not fetch global parameter ${compensation.linkedGlobalParameter} for compensation ${compensation.id}`);
                return 0;
            }
        }
        return Number(compensation.amount);
    }
}
