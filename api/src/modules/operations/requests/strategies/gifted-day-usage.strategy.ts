import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { RequestType } from '@modules/operations/requests/enums/request-type.enum';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GiftedDaysService } from '@modules/operations/gifted-days/gifted-days.service';
import { GiftedDayUsageDetailsDto } from '@modules/operations/requests/dto/details/gifted-day-usage-details.dto';

@Injectable()
export class GiftedDayUsageStrategy implements IRequestStrategy {
    constructor(
        @Inject(forwardRef(() => GiftedDaysService))
        private giftedDaysService: GiftedDaysService,
    ) { }

    async validate(details: any, employeeId: string): Promise<void> {
        // 1. Verificar elegibilidad por tipo de contrato
        await this.giftedDaysService.validateEligibility(employeeId);

        // 2. Validar estructura del DTO
        const dto = plainToInstance(GiftedDayUsageDetailsDto, details);
        const errors = await validate(dto);

        if (errors.length > 0) {
            const messages = errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ');
            throw new BadRequestException(`Validación fallida: ${messages}`);
        }

        // 3. Validar que startDate <= endDate
        const start = new Date(dto.startDate);
        const end = new Date(dto.endDate);
        if (start > end) {
            throw new BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
        }

        // 4. Calcular días hábiles solicitados
        const requestedDays = this.calculateBusinessDays(dto.startDate, dto.endDate);

        // 5. Validar que los días calculados coincidan con los declarados
        if (requestedDays !== dto.days) {
            throw new BadRequestException(
                `Los días declarados (${dto.days}) no coinciden con los días hábiles calculados (${requestedDays})`,
            );
        }

        // 6. Validar saldo disponible
        const balance = await this.giftedDaysService.getEmployeeBalance(employeeId);
        if (balance.availableDays < requestedDays) {
            throw new BadRequestException(
                `Saldo insuficiente. Tienes ${balance.availableDays} días disponibles y solicitas ${requestedDays}.`,
            );
        }
    }

    async processBeforeSave(details: any, employeeId?: string): Promise<any> {
        const days = this.calculateBusinessDays(details.startDate, details.endDate);
        details.days = days;

        if (employeeId) {
            try {
                const balance = await this.giftedDaysService.getEmployeeBalance(employeeId);
                details.balanceAfter = balance.availableDays - days;
            } catch (error) {
                console.warn('No se pudo calcular balanceAfter:', error);
            }
        }

        return details;
    }

    async onApprove(request: Request): Promise<void> {
        const details = request.details as GiftedDayUsageDetailsDto;

        // Re-verificar elegibilidad al momento de aprobar
        await this.giftedDaysService.validateEligibility(request.employeeId);

        // Verificar saldo suficiente al momento de aprobar
        const balance = await this.giftedDaysService.getEmployeeBalance(request.employeeId);
        if (balance.availableDays < details.days) {
            throw new BadRequestException(
                `Saldo insuficiente al aprobar. Disponible: ${balance.availableDays} días, Solicitado: ${details.days} días`,
            );
        }

        // Registrar el uso en el ledger
        await this.giftedDaysService.registerUsage(request.employeeId, details.days, request.id);

        console.log(
            `[Días Obsequiados] Solicitud #${request.id} aprobada. ${details.days} días descontados para empleado ${request.employeeId}`,
        );
    }

    async onReject(request: Request): Promise<void> {
        // No se requiere acción. Al pasar a REJECTED, el saldo pendiente se libera automáticamente.
        console.log(`[Días Obsequiados] Solicitud #${request.id} rechazada. Días liberados.`);
    }

    getRequestType(): string {
        return RequestType.GIFTED_DAY_USAGE;
    }

    /**
     * Calcula días hábiles entre dos fechas (lunes a sábado, excluye domingos).
     */
    private calculateBusinessDays(startStr: string, endStr: string): number {
        const start = new Date(startStr);
        const end = new Date(endStr);
        let count = 0;
        const cur = new Date(start);
        while (cur <= end) {
            const day = cur.getDay();
            if (day !== 0) count++; // Excluir domingos
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    }
}
