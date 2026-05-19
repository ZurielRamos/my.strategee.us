import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EnergyzeDaysService } from '@modules/operations/energyze-days/energyze-days.service';
import { EnergyzeDayUsageDetailsDto } from '@modules/operations/requests/dto/details/energyze-day-usage-details.dto';

@Injectable()
export class EnergyzeDayUsageStrategy implements IRequestStrategy {
    constructor(
        @Inject(forwardRef(() => EnergyzeDaysService))
        private energyzeDaysService: EnergyzeDaysService,
    ) { }

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(EnergyzeDayUsageDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
            throw new BadRequestException(`Validación fallida: ${messages}`);
        }

        // Validar que la fecha sea un sábado
        const date = new Date(dto.date);
        if (date.getDay() !== 6) {
            throw new BadRequestException('Los días Energyze solo pueden ser usados en sábados');
        }

        // Validar que la fecha no sea muy antigua (máximo 1 mes atrás)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        if (date < oneMonthAgo) {
            throw new BadRequestException('La fecha no puede ser mayor a 1 mes atrás');
        }

        // Validar que la fecha no sea muy futura (máximo 3 meses adelante)
        const threeMonthsAhead = new Date();
        threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);
        
        if (date > threeMonthsAhead) {
            throw new BadRequestException('La fecha no puede ser mayor a 3 meses en el futuro');
        }
    }

    async processBeforeSave(details: any, employeeId?: string): Promise<any> {
        const dto = plainToInstance(EnergyzeDayUsageDetailsDto, details);
        
        // Siempre es 1 día
        details.days = 1;

        // Si tenemos employeeId, calcular el balance después
        if (employeeId) {
            try {
                const balance = await this.energyzeDaysService.getEmployeeBalance(employeeId);
                details.balanceAfter = balance.availableDays - 1;
            } catch (error) {
                console.warn('No se pudo calcular balanceAfter:', error);
            }
        }

        return details;
    }

    async onApprove(request: Request): Promise<void> {
        const details = request.details as EnergyzeDayUsageDetailsDto;

        // Verificar que tenga saldo suficiente
        const balance = await this.energyzeDaysService.getEmployeeBalance(request.employeeId);
        if (balance.availableDays < 1) {
            throw new BadRequestException(
                `Saldo insuficiente. Disponible: ${balance.availableDays} días, Solicitado: 1 día`
            );
        }

        // Registrar el uso en el ledger
        await this.energyzeDaysService.registerUsage(
            request.employeeId,
            1,
            request.id
        );

        console.log(`Disfrute de 1 día Energyze aprobado para empleado ${request.employeeId}`);
    }

    async onReject(request: Request): Promise<void> {
        console.log(`Disfrute de día Energyze rechazado para empleado ${request.employeeId}`);
    }

    getRequestType(): string {
        return RequestType.ENERGYZE_DAY_USAGE;
    }
}
