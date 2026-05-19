import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { CompensatedTimeUsageDetailsDto, UsageType } from '@modules/operations/requests/dto/details/compensated-time-usage-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompensatedTimeService } from '@modules/operations/compensated-time/compensated-time.service';
import { DEFAULT_HOURS_PER_DAY } from '@modules/operations/compensated-time/constants/compensated-time-settings';
import { SystemSettingsService } from '@modules/system/system-settings/system-settings.service';

@Injectable()
export class CompensatedTimeUsageStrategy implements IRequestStrategy {
    constructor(
        @Inject(forwardRef(() => CompensatedTimeService))
        private compensatedTimeService: CompensatedTimeService,
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

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(CompensatedTimeUsageDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
            throw new BadRequestException(`Validación fallida: ${messages}`);
        }

        // Validaciones específicas según el tipo
        if (dto.usageType === UsageType.HOURS) {
            // Para tipo HOURS, startDate y endDate deben ser iguales
            if (dto.startDate !== dto.endDate) {
                throw new BadRequestException('Para solicitudes por horas, la fecha de inicio y fin deben ser iguales');
            }

            // Validar que se proporcionen las horas
            if (!dto.startTime || !dto.endTime) {
                throw new BadRequestException('Para solicitudes por horas, debe proporcionar hora de inicio y fin');
            }
        } else if (dto.usageType === UsageType.DAYS) {
            // Para tipo DAYS, no deben haber horas
            if (dto.startTime || dto.endTime) {
                throw new BadRequestException('Para solicitudes por días, no debe proporcionar horas');
            }
        }
    }

    async processBeforeSave(details: any, employeeId?: string): Promise<any> {
        const dto = plainToInstance(CompensatedTimeUsageDetailsDto, details);
        const hoursPerDay = await this.getHoursPerDay();

        // Calcular horas según el tipo
        if (dto.usageType === UsageType.HOURS) {
            const calculatedHours = this.calculateHoursBetweenTimes(dto.startTime!, dto.endTime!);
            details.calculatedHours = calculatedHours;
        } else if (dto.usageType === UsageType.DAYS) {
            const days = this.calculateDaysBetween(dto.startDate, dto.endDate);
            details.calculatedHours = days * hoursPerDay;
        }

        // Calcular días equivalentes
        details.calculatedDays = parseFloat((details.calculatedHours / hoursPerDay).toFixed(2));

        // Si tenemos employeeId, calcular el balance después
        if (employeeId) {
            try {
                const balance = await this.compensatedTimeService.getEmployeeBalance(employeeId);
                details.balanceAfter = balance.availableBalance - details.calculatedHours;
            } catch (error) {
                // Si hay error obteniendo el balance, no incluir balanceAfter
                console.warn('No se pudo calcular balanceAfter:', error);
            }
        }

        return details;
    }

    async onApprove(request: Request): Promise<void> {
        const details = request.details as CompensatedTimeUsageDetailsDto;
        const hours = details.calculatedHours || 0;

        // Verificar que tenga saldo suficiente
        const balance = await this.compensatedTimeService.getEmployeeBalance(request.employeeId);
        if (balance.availableBalance < hours) {
            throw new BadRequestException(
                `Saldo insuficiente. Disponible: ${balance.availableBalance} horas, Solicitado: ${hours} horas`
            );
        }

        // Registrar el uso en el ledger
        await this.compensatedTimeService.registerUsage(
            request.employeeId,
            hours,
            request.id
        );

        console.log(`Disfrute de ${hours} horas aprobado para empleado ${request.employeeId}`);
    }

    async onReject(request: Request): Promise<void> {
        // No hay acciones especiales al rechazar
        console.log(`Disfrute rechazado para empleado ${request.employeeId}`);
    }

    getRequestType(): string {
        return RequestType.COMPENSATED_TIME_USAGE;
    }

    private calculateHoursBetweenTimes(startTime: string, endTime: string): number {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;

        const diffMinutes = endMinutes - startMinutes;
        
        if (diffMinutes <= 0) {
            throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
        }

        return parseFloat((diffMinutes / 60).toFixed(2));
    }

    private calculateDaysBetween(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (end < start) {
            throw new BadRequestException('La fecha de fin debe ser posterior o igual a la fecha de inicio');
        }

        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
        
        return diffDays;
    }
}
