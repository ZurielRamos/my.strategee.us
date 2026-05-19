import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BenefitAllocation } from './entities/benefit-allocation.entity';
import { BenefitType } from './enums/benefit-type.enum';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { RequestStatus } from '@modules/operations/requests/enums/request-status.enum';

@Injectable()
export class BenefitsService {
    constructor(
        @InjectRepository(BenefitAllocation)
        private allocationRepository: Repository<BenefitAllocation>,
        @InjectRepository(Request)
        private requestRepository: Repository<Request>,
    ) { }

    /**
     * Asigna o actualiza la cantidad de días mensuales para un empleado y beneficio.
     */
    async setAllocation(employeeId: string, type: BenefitType, amount: number): Promise<BenefitAllocation> {
        let allocation = await this.allocationRepository.findOne({
            where: { employeeId, benefitType: type }
        });

        if (!allocation) {
            allocation = this.allocationRepository.create({ employeeId, benefitType: type });
        }

        allocation.monthlyQuota = amount;
        return this.allocationRepository.save(allocation);
    }

    /**
     * Obtiene el cupo mensual configurado.
     */
    async getMonthlyQuota(employeeId: string, type: BenefitType): Promise<number> {
        const allocation = await this.allocationRepository.findOne({
            where: { employeeId, benefitType: type }
        });
        return allocation ? Number(allocation.monthlyQuota) : 0;
    }

    /**
     * Obtiene todas las asignaciones de un empleado.
     */
    async findAllByEmployee(employeeId: string): Promise<BenefitAllocation[]> {
        return this.allocationRepository.find({ where: { employeeId } });
    }


    /**
     * Elimina completamente una asignación de beneficio.
     * Útil para beneficios de "un solo uso" como la reactivación de cumpleaños.
     */
    async removeAllocation(employeeId: string, type: BenefitType): Promise<void> {
        const allocation = await this.allocationRepository.findOne({
            where: { employeeId, benefitType: type }
        });

        if (allocation) {
            await this.allocationRepository.remove(allocation);
        }
    }

    /**
     * Obtiene el balance de beneficios con días disponibles y usados
     */
    async getBenefitBalances(employeeId: string): Promise<BenefitBalance[]> {
        // Obtener todas las asignaciones del empleado
        const allocations = await this.findAllByEmployee(employeeId);

        // Obtener el mes actual
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

        // Obtener todas las solicitudes de beneficios del mes actual (aprobadas Y pendientes)
        const requests = await this.requestRepository.find({
            where: {
                employeeId,
                type: RequestType.BENEFIT,
            }
        });

        // Filtrar solicitudes del mes actual y calcular uso por tipo de beneficio
        const usageByType = new Map<BenefitType, number>();

        requests.forEach(request => {
            // Solo contar solicitudes aprobadas o pendientes
            if (request.status !== RequestStatus.APPROVED && request.status !== RequestStatus.PENDING) {
                return;
            }

            if (request.details?.benefitType && request.details?.amount) {
                const requestDate = new Date(request.details.date);
                
                // Solo contar si la fecha está en el mes actual
                if (requestDate >= startOfMonth && requestDate <= endOfMonth) {
                    const benefitType = request.details.benefitType as BenefitType;
                    const currentUsage = usageByType.get(benefitType) || 0;
                    usageByType.set(benefitType, currentUsage + Number(request.details.amount));
                }
            }
        });

        // Construir el balance para cada asignación
        return allocations.map(allocation => {
            const used = usageByType.get(allocation.benefitType) || 0;
            const assigned = Number(allocation.monthlyQuota);
            const available = Math.max(0, assigned - used);

            return {
                id: allocation.id,
                employeeId: allocation.employeeId,
                benefitType: allocation.benefitType,
                monthlyQuota: assigned,
                usedDays: used,
                availableDays: available,
            };
        });
    }
}

export interface BenefitBalance {
    id: number;
    employeeId: string;
    benefitType: BenefitType;
    monthlyQuota: number;
    usedDays: number;
    availableDays: number;
}