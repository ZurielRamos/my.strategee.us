// requests/strategies/medical-appointment.strategy.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { MedicalAppointmentDetailsDto } from '@modules/operations/requests/dto/details/medical-appointment-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class MedicalAppointmentStrategy implements IRequestStrategy {

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(MedicalAppointmentDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) throw new BadRequestException('Datos inválidos en cita médica');

        const start = new Date(dto.exitDateTime);
        const end = new Date(dto.returnDateTime);

        if (start >= end) {
            throw new BadRequestException('La hora de regreso debe ser posterior a la de salida.');
        }
    }

    async processBeforeSave(details: any): Promise<any> {
        const start = new Date(details.exitDateTime);
        const end = new Date(details.returnDateTime);

        // Calcular duración en horas
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

        return {
            ...details,
            durationHours: parseFloat(durationHours.toFixed(2)) // Guardamos el cálculo
        };
    }

    async onApprove(request: Request): Promise<void> {
        // Lógica opcional: Notificar a RRHH que hay una ausencia médica parcial
    }

    async onReject(request: Request): Promise<void> { }

    getRequestType(): string {
        return RequestType.MEDICAL_APPOINTMENT;
    }
}