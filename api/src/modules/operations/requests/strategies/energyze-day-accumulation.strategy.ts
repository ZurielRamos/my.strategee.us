import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { EnergyzeDaysService } from '@modules/operations/energyze-days/energyze-days.service';
import { EnergyzeDayAccumulationDetailsDto } from '@modules/operations/requests/dto/details/energyze-day-accumulation-details.dto';

@Injectable()
export class EnergyzeDayAccumulationStrategy implements IRequestStrategy {
    constructor(
        @Inject(forwardRef(() => EnergyzeDaysService))
        private energyzeDaysService: EnergyzeDaysService,
    ) { }

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(EnergyzeDayAccumulationDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
            throw new BadRequestException(`Validación fallida: ${messages}`);
        }

        // Validar que los días sean uno de los valores permitidos (solo días completos)
        const allowedDays = [1];
        if (!allowedDays.includes(dto.days)) {
            throw new BadRequestException('Los días Energyze a acumular deben ser 1 día completo');
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
        return details;
    }

    async onApprove(request: Request): Promise<void> {
        const details = request.details as EnergyzeDayAccumulationDetailsDto;

        // Registrar la acumulación en el ledger
        await this.energyzeDaysService.registerAccumulation(
            request.employeeId,
            details.days,
            request.id
        );

        console.log(`Acumulación de ${details.days} días Energyze aprobada para empleado ${request.employeeId}`);
    }

    async onReject(request: Request): Promise<void> {
        console.log(`Acumulación de días Energyze rechazada para empleado ${request.employeeId}`);
    }

    getRequestType(): string {
        return RequestType.ENERGYZE_DAY_ACCUMULATION;
    }
}
