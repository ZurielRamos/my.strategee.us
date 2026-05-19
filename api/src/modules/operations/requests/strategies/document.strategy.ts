import { Injectable, BadRequestException } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { DocumentDetailsDto } from '@modules/operations/requests/dto/details/document-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request } from '@modules/operations/requests/entities/request.entity';

@Injectable()
export class DocumentStrategy implements IRequestStrategy {

    async validate(details: any, employeeId: string): Promise<void> {
        const dto = plainToInstance(DocumentDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            throw new BadRequestException(`Detalles de documento inválidos: ${errors.toString()}`);
        }
    }

    async processBeforeSave(details: any): Promise<any> {
        return details; // No requiere procesamiento extra
    }

    getRequestType(): string {
        return RequestType.DOCUMENT;
    }

    async onApprove(request: Request): Promise<void> {
        console.log(`[DocumentStrategy] Solicitud ${request.id} Aprobada.`);
        // AQUÍ LÓGICA DE NEGOCIO:
        // 1. Calcular días entre request.details.startDate y endDate
        // 2. Llamar a AttendanceService.deductVacationDays(request.employeeId, days)
        // 3. Enviar email de "Felices vacaciones"
    }

    async onReject(request: Request): Promise<void> {
        console.log(`[DocumentStrategy] Solicitud ${request.id} Rechazada.`);
        // Lógica de reversión si fuera necesaria
    }
}