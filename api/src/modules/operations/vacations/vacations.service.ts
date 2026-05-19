import { Injectable, Inject, forwardRef, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VACATION_RATE_KEYS, DEFAULT_VACATION_RATE } from './constants/vacation-settings.keys';
import { VacationLedger, VacationTransactionType } from './entities/vacation-ledger.entity';
import { VacationCalculator } from './utils/vacation.calculator';
import { RegisterAdjustmentDto, RegisterMoneyPaymentDto } from './dto/register-transaction.dto';
import { VacationBalanceResponseDto } from './dto/vacation-balance-response.dto';
import { ContractsService } from '@modules/core/contracts/contracts.service';
import { SystemSettingsService } from '@modules/system/system-settings/system-settings.service';
import { RequestsService } from '../requests/requests.service';
import { RequestType } from '../requests/enums/request-type.enum';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { ContractType } from '@modules/core/contracts/enums/contract-type.enum';

export interface VacationBalanceState {
    rateApplied: number;        // Tasa usada (ej: 15 o 20 días)
    totalAccrued: number;       // Ganado total histórico
    totalUsed: number;          // Gastado total (Aprobado/Pagado)
    pendingReserved: number;    // Apartado en solicitudes PENDING
    realBalance: number;        // Accrued - Used
    availableBalance: number;   // Real - Pending (Lo que puede pedir hoy)
}

@Injectable()
export class VacationsService {
    constructor(
        @InjectRepository(VacationLedger)
        private ledgerRepository: Repository<VacationLedger>,
        @Inject(forwardRef(() => ContractsService))
        private contractsService: ContractsService,
        private systemSettingsService: SystemSettingsService,
        @Inject(forwardRef(() => RequestsService))
        private requestsService: RequestsService,
    ) { }

    /**
     * Tipos de contrato elegibles para vacaciones.
     * Solo contratos laborales: Término Indefinido y Término Fijo.
     */
    static readonly ELIGIBLE_CONTRACT_TYPES: ContractType[] = [
        ContractType.INDEFINITE_TERM,
        ContractType.FIXED_TERM,
    ];

    /**
     * Verifica si un empleado es elegible para solicitar vacaciones.
     * Elegible = contrato laboral activo (Término Indefinido o Término Fijo).
     */
    async validateEligibility(employeeId: string): Promise<void> {
        const contract = await this.contractsService.findActiveByEmployee(employeeId);

        if (!contract) {
            throw new BadRequestException(
                'Las vacaciones solo aplican para empleados con contrato laboral activo (Término Indefinido o Término Fijo).',
            );
        }

        if (!VacationsService.ELIGIBLE_CONTRACT_TYPES.includes(contract.type)) {
            throw new BadRequestException(
                'Las vacaciones solo aplican para contratos de Término Indefinido o Término Fijo.',
            );
        }
    }

    /**
     * Obtiene la tasa de vacaciones configurada para un tipo de contrato específico.
     * Contratos laborales (Término Indefinido + Término Fijo) usan vacationDaysLaborContract
     * Contratos de servicios (ambos tipos) usan vacationDaysServiceContract
     */
    private async getRateForContract(contractType: ContractType): Promise<number> {
        try {
            const settings = await this.systemSettingsService.getSettings();
            
            // Clasificar contratos en 2 categorías
            const isLaborContract = 
                contractType === ContractType.INDEFINITE_TERM || 
                contractType === ContractType.FIXED_TERM;
            
            return isLaborContract 
                ? settings.vacationDaysLaborContract 
                : settings.vacationDaysServiceContract;
        } catch (error) {
            console.warn('Error loading system settings, using default vacation rate:', error);
            return DEFAULT_VACATION_RATE;
        }
    }

    async getEmployeeBalance(employeeId: string): Promise<VacationBalanceResponseDto> {
        // 1. Obtener Contrato y verificar elegibilidad
        const contract = await this.contractsService.findActiveByEmployee(employeeId);
        
        if (!contract || !VacationsService.ELIGIBLE_CONTRACT_TYPES.includes(contract.type)) {
            return this.getEmptyBalance();
        }

        const rate = await this.getRateForContract(contract.type);
        const cutOffDate = new Date();
        const endDate = cutOffDate;

        const totalAccrued = VacationCalculator.calculateAccrued(contract.startDate, endDate, rate);

        // 3. Procesar el Ledger (Aquí está el cambio principal)
        const ledgerEntries = await this.ledgerRepository.find({ where: { employeeId } });

        // Inicializamos contadores
        let taken = 0;          // USAGE
        let compensated = 0;    // MONEY_PAYMENT
        let settled = 0;        // SETTLEMENT
        let adjustments = 0;    // ADJUSTMENT
        let totalLedgerSum = 0; // La suma matemática real de la DB (negativos y positivos)

        for (const entry of ledgerEntries) {
            const days = Number(entry.days); // Convertir decimal a number
            totalLedgerSum += days;

            // Clasificamos para el desglose visual (usamos Math.abs para mostrar cantidades positivas en el reporte de "gastados")
            switch (entry.type) {
                case VacationTransactionType.USAGE:
                    taken += Math.abs(days);
                    break;
                case VacationTransactionType.MONEY_PAYMENT:
                    compensated += Math.abs(days);
                    break;
                case VacationTransactionType.SETTLEMENT:
                    settled += Math.abs(days);
                    break;
                case VacationTransactionType.ADJUSTMENT:
                    // Los ajustes se suman tal cual (pueden ser positivos o negativos)
                    adjustments += days;
                    break;
            }
        }

        // El "Total Used" visualmente suele ser la suma de lo que se ha restado.
        // Pero matemáticamente para el balance, usamos totalLedgerSum.
        // Para el reporte visual "Total Usado", sumaremos los conceptos de gasto.
        const visualTotalUsed = taken + compensated + settled;
        // Nota: No sumamos 'adjustments' al 'visualTotalUsed' porque puede ser saldo a favor.
        // Lo mostramos separado en el desglose.

        // 4. Calcular Pendientes - obtener todas las solicitudes sin límite de paginación
        const requestsResult = await this.requestsService.findAllByEmployee(employeeId, { 
            limit: 1000, // Límite alto para obtener todas las solicitudes
            page: 1 
        });
        const pendingRequests = requestsResult.data.filter(r =>
            r.type === RequestType.VACATION &&
            r.status === RequestStatus.PENDING
        );

        let pendingReserved = 0;
        for (const req of pendingRequests) {
            const days = req.details['calculatedDays'] || 0;
            pendingReserved += Number(days);
        }

        // 5. Consolidar Saldos
        // Balance Real = Ganado + (Suma del Ledger, que trae negativos)
        const realBalance = totalAccrued + totalLedgerSum;
        const availableBalance = realBalance - pendingReserved;

        return {
            rateApplied: rate,
            totalAccrued: this.round(totalAccrued),

            // Totales visuales
            totalUsed: this.round(visualTotalUsed), // Solo lo que se ha "gastado"

            breakdown: {
                taken: this.round(taken),
                compensated: this.round(compensated),
                settled: this.round(settled),
                adjustments: this.round(adjustments), // Puede ser negativo o positivo
            },

            pendingReserved: this.round(pendingReserved),
            realBalance: this.round(realBalance),
            availableBalance: this.round(availableBalance),
            isEligible: true,
        };
    }

    // Helper para redondear a 2 decimales y evitar errores de punto flotante en JSON
    private round(num: number): number {
        return parseFloat(num.toFixed(2));
    }

    private getEmptyBalance(): VacationBalanceResponseDto {
        return {
            rateApplied: 0,
            totalAccrued: 0,
            totalUsed: 0,
            breakdown: { taken: 0, compensated: 0, settled: 0, adjustments: 0 },
            pendingReserved: 0,
            realBalance: 0,
            availableBalance: 0,
            isEligible: false,
        };
    }

    /**
     * Registra el consumo real en el libro mayor.
     * Se llama SOLO cuando la solicitud se APRUEBA.
     */
    async registerUsage(employeeId: string, days: number, requestId: number): Promise<VacationLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: VacationTransactionType.USAGE,
            days: -Math.abs(days), // ⚠️ IMPORTANTE: Guardar como negativo para restar del saldo
            requestId,
            note: `Disfrute Solicitud #${requestId}`
        });
        return this.ledgerRepository.save(entry);
    }

    /**
     * Registra un pago en dinero (compensación).
     */
    async registerPayment(employeeId: string, days: number, note: string): Promise<VacationLedger> {
        const entry = this.ledgerRepository.create({
            employeeId,
            type: VacationTransactionType.MONEY_PAYMENT,
            days: -Math.abs(days), // Resta días del saldo, aunque se pague en dinero
            requestId: null,
            note: note
        });
        return this.ledgerRepository.save(entry);
    }



    // ---------------------------------------------------------
    // 2. PAGO EN DINERO (Compensación)
    // ---------------------------------------------------------
    async registerMoneyPayment(dto: RegisterMoneyPaymentDto): Promise<VacationLedger> {
        // 1. Validar que tenga saldo suficiente
        const balance = await this.getEmployeeBalance(dto.employeeId);

        // Usamos 'realBalance' porque el dinero no se "aparta" como una solicitud, es inmediato.
        // Pero si quieres ser estricto, usa 'availableBalance'.
        if (balance.realBalance < dto.days) {
            throw new BadRequestException(`Saldo insuficiente para compensar. Balance Real: ${balance.realBalance}`);
        }

        // 2. Crear transacción (Guardamos negativo porque reduce el saldo)
        const entry = this.ledgerRepository.create({
            employeeId: dto.employeeId,
            type: VacationTransactionType.MONEY_PAYMENT,
            days: -Math.abs(dto.days), // Aseguramos que sea negativo
            note: dto.note,
            requestId: null
        });

        return this.ledgerRepository.save(entry);
    }

    // ---------------------------------------------------------
    // 3. AJUSTE MANUAL (Admin)
    // ---------------------------------------------------------
    async registerAdjustment(dto: RegisterAdjustmentDto): Promise<VacationLedger> {
        // Aquí confiamos en el Admin. Si envía positivo suma, si envía negativo resta.
        const entry = this.ledgerRepository.create({
            employeeId: dto.employeeId,
            type: VacationTransactionType.ADJUSTMENT,
            days: dto.days,
            note: dto.note,
            requestId: null
        });

        return this.ledgerRepository.save(entry);
    }

    // ---------------------------------------------------------
    // 4. LIQUIDACIÓN (Settlement) - Llamado al terminar contrato
    // ---------------------------------------------------------
    async settleVacations(employeeId: string, terminationDate: Date): Promise<VacationLedger | null> {
        // 1. Obtener el balance EXACTO al momento del corte
        const balance = await this.getEmployeeBalance(employeeId);

        // Si el balance es 0, no hay nada que liquidar (o quizás registrar 0 por constancia)
        if (balance.realBalance === 0) return null;

        // 2. "Pagar" todo lo que quede debiendo (o descontar si debe días)
        // Si tiene 10.5 días a favor, registramos -10.5 (LIQUIDACION) para dejarlo en 0.
        // Si debe -2 días, registramos +2 (LIQUIDACION) para dejarlo en 0 (descuento en liquidación final).
        const daysToSettle = -balance.realBalance;

        const entry = this.ledgerRepository.create({
            employeeId: employeeId,
            type: VacationTransactionType.SETTLEMENT,
            days: daysToSettle,
            note: `Liquidación final de contrato al ${terminationDate.toISOString().split('T')[0]}`,
            requestId: null
        });

        console.log(`[Vacaciones] Liquidación generada para Empleado ${employeeId}: ${daysToSettle} días.`);

        return this.ledgerRepository.save(entry);
    }


}