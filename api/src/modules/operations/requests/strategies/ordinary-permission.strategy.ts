import { Injectable, BadRequestException } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { OrdinaryPermissionDetailsDto } from '@modules/operations/requests/dto/details/ordinary-permission-details.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class OrdinaryPermissionStrategy implements IRequestStrategy {

    async validate(details: any, employeeId: string): Promise<void> {
        // 1. Validación de estructura
        const dto = plainToInstance(OrdinaryPermissionDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            throw new BadRequestException('Datos inválidos en el permiso ordinario');
        }

        // 2. Validación de Fechas (Coherencia temporal)
        const exitDate = new Date(dto.exitDateTime);
        const returnDate = new Date(dto.returnDateTime);

        if (exitDate >= returnDate) {
            throw new BadRequestException('La fecha/hora de salida debe ser anterior a la de regreso.');
        }

        // Nota: Ya NO lanzamos error si isUpToDate es false. 
        // Se permite pasar, pero el dato queda guardado para que el aprobador lo vea.
    }

    /**
     * Aquí calculamos las horas automáticamente.
     * Esto hace que el reporte sea mucho más rápido y legible.
     */
    async processBeforeSave(details: any): Promise<any> {
        const start = new Date(details.exitDateTime);
        const end = new Date(details.returnDateTime);

        // Diferencia en milisegundos
        const diffMs = end.getTime() - start.getTime();

        // Convertir a horas (con decimales para mayor precisión, ej: 1.5 horas)
        const durationHours = diffMs / (1000 * 60 * 60);

        return {
            ...details,
            // Guardamos el cálculo con 2 decimales para limpieza visual
            durationHours: parseFloat(durationHours.toFixed(2))
        };
    }

    async onApprove(request: Request): Promise<void> {
        // Log informativo
        const hours = request.details['durationHours'];
        console.log(`Permiso ordinario de ${hours} horas aprobado.`);
    }

    async onReject(request: Request): Promise<void> {
        // Sin acciones extra
    }

    getRequestType(): string {
        return RequestType.ORDINARY_PERMISSION;
    }
}