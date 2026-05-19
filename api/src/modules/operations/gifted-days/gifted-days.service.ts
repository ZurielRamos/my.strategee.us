import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftedDaysLedger, GiftedDaysTransactionType } from './entities/gifted-days-ledger.entity';
import { GiftedDaysBalanceResponseDto } from './dto/gifted-days-balance-response.dto';
import { AdjustGiftedDaysDto, GrantGiftedDaysDto } from './dto/register-transaction.dto';
import { RequestsService } from '../requests/requests.service';
import { RequestType } from '../requests/enums/request-type.enum';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { ContractsService } from '@modules/core/contracts/contracts.service';
import { ContractType } from '@modules/core/contracts/enums/contract-type.enum';
import { SystemSettingsService } from '@modules/system/system-settings/system-settings.service';
import { VacationCalculator } from '../vacations/utils/vacation.calculator';

@Injectable()
export class GiftedDaysService {
    constructor(
        @InjectRepository(GiftedDaysLedger)
        private ledgerRepository: Repository<GiftedDaysLedger>,
        @Inject(forwardRef(() => RequestsService))
        private requestsService: RequestsService,
        @Inject(forwardRef(() => ContractsService))
        private contractsService: ContractsService,
        private systemSettingsService: SystemSettingsService,
    ) { }

    /**
     * Tipos de contrato elegibles para días obsequiados por servicios.
     * Aplica a empleados sin contrato activo o con contrato de prestación de servicios.
     */
    static readonly ELIGIBLE_CONTRACT_TYPES: ContractType[] = [
        ContractType.SERVICE_PROVISION_OVER_ONE_MONTH,
        ContractType.SERVICE_PROVISION_UNDER_ONE_MONTH,
    ];

    /**
     * Verifica si un empleado es elegible para usar días obsequiados.
     * Elegible = contrato laboral activo O contrato de prestación de servicios activo.
     * Sin contrato → no elegible.
     */
    async validateEligibility(employeeId: string): Promise<void> {
        const contract = await this.contractsService.findActiveByEmployee(employeeId);

        if (!contract) {
            throw new BadRequestException(
                'Los días obsequiados requieren un contrato activo.',
            );
        }

        const isServiceContract = GiftedDaysService.ELIGIBLE_CONTRACT_TYPES.includes(contract.type);
        const isLaborContract =
            contract.type === ContractType.INDEFINITE_TERM ||
            contract.type === ContractType.FIXED_TERM;

        if (!isServiceContract && !isLaborContract) {
            throw new BadRequestException(
                'Los días obsequiados solo aplican para contratos laborales o de prestación de servicios.',
            );
        }
    }

    async getEmployeeBalance(employeeId: string): Promise<GiftedDaysBalanceResponseDto> {
        // 1. Obtener contrato activo
        const contract = await this.contractsService.findActiveByEmployee(employeeId);

        // Sin contrato → no elegible
        if (!contract) {
            return { totalAccrued: 0, totalDays: 0, availableDays: 0, pendingDays: 0, isEligible: false };
        }

        const isServiceContract = GiftedDaysService.ELIGIBLE_CONTRACT_TYPES.includes(contract.type);
        const isLaborContract =
            contract.type === ContractType.INDEFINITE_TERM ||
            contract.type === ContractType.FIXED_TERM;

        // Ni laboral ni servicios → no elegible
        if (!isServiceContract && !isLaborContract) {
            return { totalAccrued: 0, totalDays: 0, availableDays: 0, pendingDays: 0, isEligible: false };
        }

        // 2. Calcular devengado
        //    - Contrato de servicios → devengado automático con tasa vacationDaysServiceContract
        //    - Contrato laboral → devengado = 0 (solo días otorgados manualmente)
        let totalAccrued = 0;
        if (isServiceContract) {
            const settings = await this.systemSettingsService.getSettings();
            totalAccrued = VacationCalculator.calculateAccrued(
                contract.startDate,
                new Date(),
                settings.vacationDaysServiceContract,
            );
        }

        // 3. Procesar el Ledger (ajustes manuales, otorgamientos, usos, vencimientos)
        const ledgerEntries = await this.ledgerRepository.find({ where: { employeeId } });
        let ledgerSum = 0;
        for (const entry of ledgerEntries) {
            ledgerSum += Number(entry.days);
        }

        // 4. Calcular solicitudes pendientes
        const requestsResult = await this.requestsService.findAllByEmployee(employeeId, {
            limit: 1000,
            page: 1,
        });
        const pendingDays = requestsResult.data
            .filter(
                (r) =>
                    r.type === RequestType.GIFTED_DAY_USAGE &&
                    r.status === RequestStatus.PENDING,
            )
            .reduce((sum, r) => sum + Number(r.details['days'] || 0), 0);

        // 5. Consolidar saldos
        const realBalance = totalAccrued + ledgerSum;
        const availableDays = Math.max(0, realBalance - pendingDays);

        return {
            totalAccrued: this.round(totalAccrued),
            totalDays: this.round(realBalance),
            availableDays: this.round(availableDays),
            pendingDays: this.round(pendingDays),
            isEligible: true,
        };
    }

    private round(num: number): number {
        return parseFloat(num.toFixed(2));
    }

    /**
     * Registra el otorgamiento de días obsequiados por el Admin.
     * Se llama directamente desde el endpoint de administración.
     */
    async grantDays(dto: GrantGiftedDaysDto): Promise<GiftedDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId: dto.employeeId,
            type: GiftedDaysTransactionType.GIFT,
            days: Math.abs(dto.days),
            note: dto.note,
            requestId: null,
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra el uso de días obsequiados.
     * Se llama cuando la solicitud de disfrute se APRUEBA.
     */
    async registerUsage(employeeId: string, days: number, requestId: number): Promise<GiftedDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: GiftedDaysTransactionType.USAGE,
            days: -Math.abs(days),
            requestId,
            note: `Disfrute Solicitud #${requestId}`,
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra un ajuste manual (Admin).
     */
    async registerAdjustment(dto: AdjustGiftedDaysDto): Promise<GiftedDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId: dto.employeeId,
            type: GiftedDaysTransactionType.ADJUSTMENT,
            days: dto.days,
            note: dto.note,
            requestId: null,
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra vencimiento de días obsequiados.
     */
    async registerExpiration(employeeId: string, days: number, note: string): Promise<GiftedDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: GiftedDaysTransactionType.EXPIRATION,
            days: -Math.abs(days),
            note,
            requestId: null,
        });
        return this.ledgerRepository.save(entry);
    }
}
