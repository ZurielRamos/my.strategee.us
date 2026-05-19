import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnergyzeDaysLedger, EnergyzeDaysTransactionType } from './entities/energyze-days-ledger.entity';
import { EnergyzeDaysBalanceResponseDto } from './dto/energyze-days-balance-response.dto';
import { AdjustEnergyzeDaysDto } from './dto/register-transaction.dto';
import { RequestsService } from '../requests/requests.service';
import { RequestType } from '../requests/enums/request-type.enum';
import { RequestStatus } from '../requests/enums/request-status.enum';

@Injectable()
export class EnergyzeDaysService {
    constructor(
        @InjectRepository(EnergyzeDaysLedger)
        private ledgerRepository: Repository<EnergyzeDaysLedger>,
        @Inject(forwardRef(() => RequestsService))
        private requestsService: RequestsService,
    ) { }

    async getEmployeeBalance(employeeId: string): Promise<EnergyzeDaysBalanceResponseDto> {
        // 1. Procesar el Ledger
        const ledgerEntries = await this.ledgerRepository.find({ where: { employeeId } });

        let totalDays = 0;
        for (const entry of ledgerEntries) {
            totalDays += Number(entry.days);
        }

        // 2. Calcular Pendientes
        const requestsResult = await this.requestsService.findAllByEmployee(employeeId, { 
            limit: 1000,
            page: 1 
        });
        const pendingRequests = requestsResult.data.filter(r =>
            r.type === RequestType.ENERGYZE_DAY_USAGE &&
            r.status === RequestStatus.PENDING
        );

        let pendingDays = 0;
        for (const req of pendingRequests) {
            const days = req.details['days'] || 0;
            pendingDays += Number(days);
        }

        const availableDays = totalDays - pendingDays;

        return {
            totalDays: this.round(totalDays),
            availableDays: this.round(availableDays),
            pendingDays: this.round(pendingDays),
        };
    }

    private round(num: number): number {
        return parseFloat(num.toFixed(2));
    }

    /**
     * Registra la acumulación de días Energyze.
     * Se llama cuando la solicitud de acumulación se APRUEBA.
     */
    async registerAccumulation(employeeId: string, days: number, requestId: number): Promise<EnergyzeDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: EnergyzeDaysTransactionType.ACCUMULATION,
            days: Math.abs(days),
            requestId,
            note: `Acumulación Solicitud #${requestId}`
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra el uso de días Energyze.
     * Se llama cuando la solicitud de disfrute se APRUEBA.
     */
    async registerUsage(employeeId: string, days: number, requestId: number): Promise<EnergyzeDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: EnergyzeDaysTransactionType.USAGE,
            days: -Math.abs(days),
            requestId,
            note: `Disfrute Solicitud #${requestId}`
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra un ajuste manual (Admin).
     */
    async registerAdjustment(dto: AdjustEnergyzeDaysDto): Promise<EnergyzeDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId: dto.employeeId,
            type: EnergyzeDaysTransactionType.ADJUSTMENT,
            days: dto.days,
            note: dto.note,
            requestId: null
        });

        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra vencimiento de días.
     */
    async registerExpiration(employeeId: string, days: number, note: string): Promise<EnergyzeDaysLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: EnergyzeDaysTransactionType.EXPIRATION,
            days: -Math.abs(days),
            note,
            requestId: null
        });

        return this.ledgerRepository.save(entry);
    }
}
