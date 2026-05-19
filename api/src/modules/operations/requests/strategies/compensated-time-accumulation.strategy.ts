import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { CompensatedTimeAccumulationDetailsDto } from '@modules/operations/requests/dto/details/compensated-time-accumulation-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompensatedTimeService } from '@modules/operations/compensated-time/compensated-time.service';
import { DEFAULT_HOURS_PER_DAY } from '@modules/operations/compensated-time/constants/compensated-time-settings';
import { SystemSettingsService } from '@modules/system/system-settings/system-settings.service';

@Injectable()
export class CompensatedTimeAccumulationStrategy implements IRequestStrategy {
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
        const dto = plainToInstance(CompensatedTimeAccumulationDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
            throw new BadRequestException(`Validación fallida: ${messages}`);
        }

        // Validar que los días sean uno de los valores permitidos
        const allowedDays = [0.5, 1, 2, 3];
        if (!allowedDays.includes(dto.days)) {
            throw new BadRequestException('Los días a acumular deben ser 0.5, 1, 2 o 3');
        }

        // Validar que la fecha no sea muy antigua (máximo 3 meses atrás)
        const eventDate = new Date(dto.date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        if (eventDate < threeMonthsAgo) {
            throw new BadRequestException('La fecha del evento no puede ser mayor a 3 meses atrás');
        }

        // Validar que la fecha no sea muy futura (máximo 1 mes adelante)
        const oneMonthAhead = new Date();
        oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);
        
        if (eventDate > oneMonthAhead) {
            throw new BadRequestException('La fecha del evento no puede ser mayor a 1 mes en el futuro');
        }
    }

    async processBeforeSave(details: any): Promise<any> {
        const dto = plainToInstance(CompensatedTimeAccumulationDetailsDto, details);
        const hoursPerDay = await this.getHoursPerDay();
        
        // Calcular horas
        details.calculatedHours = dto.days * hoursPerDay;
        
        return details;
    }

    async onApprove(request: Request): Promise<void> {
        const details = request.details as CompensatedTimeAccumulationDetailsDto;
        const hoursPerDay = await this.getHoursPerDay();
        const hours = details.calculatedHours || (details.days * hoursPerDay);

        // Registrar la acumulación en el ledger
        await this.compensatedTimeService.registerAccumulation(
            request.employeeId,
            hours,
            request.id
        );

        console.log(`Acumulación de ${hours} horas aprobada para empleado ${request.employeeId}`);
    }

    async onReject(request: Request): Promise<void> {
        // No hay acciones especiales al rechazar
        console.log(`Acumulación rechazada para empleado ${request.employeeId}`);
    }

    getRequestType(): string {
        return RequestType.COMPENSATED_TIME_ACCUMULATION;
    }
}
