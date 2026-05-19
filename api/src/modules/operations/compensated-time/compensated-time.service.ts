import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompensatedTimeLedger, CompensatedTimeTransactionType } from './entities/compensated-time-ledger.entity';
import { CompensatedTimeBalanceResponseDto } from './dto/compensated-time-balance-response.dto';
import { RegisterCompensatedTimeAdjustmentDto } from './dto/register-transaction.dto';
import { RequestsService } from '../requests/requests.service';
import { RequestType } from '../requests/enums/request-type.enum';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { DEFAULT_HOURS_PER_DAY } from './constants/compensated-time-settings';
import { SystemSettingsService } from '@modules/system/system-settings/system-settings.service';

@Injectable()
export class CompensatedTimeService {
    constructor(
        @InjectRepository(CompensatedTimeLedger)
        private ledgerRepository: Repository<CompensatedTimeLedger>,
        @Inject(forwardRef(() => RequestsService))
        private requestsService: RequestsService,
        private systemSettingsService: SystemSettingsService,
    ) { }

    /**
     * Obtiene las horas por día laboral desde la configuración del sistema
     */
    private async getHoursPerDay(): Promise<number> {
        try {
            const settings = await this.systemSettingsService.getSettings();
            return Number(settings.hoursPerWorkday);
        } catch (error) {
            console.warn('Error loading system settings, using default hours per day:', error);
            return DEFAULT_HOURS_PER_DAY;
        }
    }

    async getEmployeeBalance(employeeId: string): Promise<CompensatedTimeBalanceResponseDto> {
        const hoursPerDay = await this.getHoursPerDay();
        
        // 1. Procesar el Ledger
        const ledgerEntries = await this.ledgerRepository.find({ where: { employeeId } });

        // Inicializamos contadores
        let accumulated = 0;
        let used = 0;
        let expired = 0;
        let adjustments = 0;
        let totalLedgerSum = 0;

        for (const entry of ledgerEntries) {
            const hours = Number(entry.hours);
            totalLedgerSum += hours;

            switch (entry.type) {
                case CompensatedTimeTransactionType.ACCUMULATION:
                    accumulated += Math.abs(hours);
                    break;
                case CompensatedTimeTransactionType.USAGE:
                    used += Math.abs(hours);
                    break;
                case CompensatedTimeTransactionType.EXPIRATION:
                    expired += Math.abs(hours);
                    break;
                case CompensatedTimeTransactionType.ADJUSTMENT:
                    adjustments += hours;
                    break;
            }
        }

        // 2. Calcular Pendientes - obtener todas las solicitudes sin límite de paginación
        const requestsResult = await this.requestsService.findAllByEmployee(employeeId, { 
            limit: 1000, // Límite alto para obtener todas las solicitudes
            page: 1 
        });
        const pendingRequests = requestsResult.data.filter(r =>
            r.type === RequestType.COMPENSATED_TIME_USAGE &&
            r.status === RequestStatus.PENDING
        );

        let pendingReserved = 0;
        for (const req of pendingRequests) {
            const hours = req.details['calculatedHours'] || 0;
            pendingReserved += Number(hours);
        }

        // 3. Consolidar Saldos
        const realBalance = totalLedgerSum;
        const availableBalance = realBalance - pendingReserved;

        return {
            totalAccumulated: this.round(accumulated),
            totalUsed: this.round(used + expired),
            breakdown: {
                accumulated: this.round(accumulated),
                used: this.round(used),
                expired: this.round(expired),
                adjustments: this.round(adjustments),
            },
            pendingReserved: this.round(pendingReserved),
            realBalance: this.round(realBalance),
            availableBalance: this.round(availableBalance),
            realBalanceInDays: this.round(realBalance / hoursPerDay),
            availableBalanceInDays: this.round(availableBalance / hoursPerDay)
        };
    }

    private round(num: number): number {
        return parseFloat(num.toFixed(2));
    }

    /**
     * Registra la acumulación de horas compensadas.
     * Se llama cuando la solicitud de acumulación se APRUEBA.
     */
    async registerAccumulation(employeeId: string, hours: number, requestId: number): Promise<CompensatedTimeLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: CompensatedTimeTransactionType.ACCUMULATION,
            hours: Math.abs(hours), // Positivo para sumar
            requestId,
            note: `Acumulación Solicitud #${requestId}`
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra el uso de horas compensadas.
     * Se llama cuando la solicitud de disfrute se APRUEBA.
     */
    async registerUsage(employeeId: string, hours: number, requestId: number): Promise<CompensatedTimeLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: CompensatedTimeTransactionType.USAGE,
            hours: -Math.abs(hours), // Negativo para restar
            requestId,
            note: `Disfrute Solicitud #${requestId}`
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra un ajuste manual (Admin).
     */
    async registerAdjustment(dto: RegisterCompensatedTimeAdjustmentDto): Promise<CompensatedTimeLedger> {
        const entry = this.ledgerRepository.create({
            employeeId: dto.employeeId,
            type: CompensatedTimeTransactionType.ADJUSTMENT,
            hours: dto.hours,
            note: dto.note,
            requestId: null
        });

        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra vencimiento de horas (si se implementa política de expiración).
     */
    async registerExpiration(employeeId: string, hours: number, note: string): Promise<CompensatedTimeLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: CompensatedTimeTransactionType.EXPIRATION,
            hours: -Math.abs(hours),
            note,
            requestId: null
        });

        return this.ledgerRepository.save(entry);
    }
}
