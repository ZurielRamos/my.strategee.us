// requests/strategies/sick-leave.strategy.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { SickLeaveDetailsDto } from '@modules/operations/requests/dto/details/sick-leave-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class SickLeaveStrategy implements IRequestStrategy {

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(SickLeaveDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) throw new BadRequestException('Datos inválidos en incapacidad');

        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);

        // Normalizar horas para comparar solo fechas
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (start > end) {
            throw new BadRequestException('La fecha fin no puede ser anterior a la fecha inicio.');
        }
    }

    async processBeforeSave(details: any): Promise<any> {
        const start = new Date(details.startDate);
        const end = new Date(details.endDate);

        // Calcular diferencia en días (inclusivo)
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        // +1 porque si inicia el 10 y termina el 10, es 1 día de incapacidad.

        return {
            ...details,
            durationDays: durationDays
        };
    }

    async onApprove(request: Request): Promise<void> {
        // AQUÍ ES IMPORTANTE:
        // Las incapacidades aprobadas deben ir al módulo de Asistencia (Attendance)
        // para justificar las ausencias y que no se descuente el día como falla injustificada.
        // await this.attendanceService.registerJustifiedAbsence(...)
        console.log(`Incapacidad de ${request.details['durationDays']} días aprobada.`);
    }

    async onReject(request: Request): Promise<void> { }

    getRequestType(): string {
        return RequestType.SICK_LEAVE;
    }
}