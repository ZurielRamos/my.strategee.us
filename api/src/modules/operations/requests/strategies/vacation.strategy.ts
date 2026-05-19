import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { IRequestStrategy } from './request-strategy.interface';
import { Request } from '@modules/operations/requests/entities/request.entity';
import { VacationsService } from '@modules/operations/vacations/vacations.service';

@Injectable()
export class VacationStrategy implements IRequestStrategy {
    constructor(
        // Usamos forwardRef si hay dependencia circular, o inyección directa si el módulo lo permite
        @Inject(forwardRef(() => VacationsService))
        private readonly vacationsService: VacationsService
    ) { }

    // 1. VALIDACIÓN (Al crear la solicitud)
    async validate(details: any, employeeId: string): Promise<void> {
        // Verificar elegibilidad por tipo de contrato
        await this.vacationsService.validateEligibility(employeeId);

        const requestedDays = this.calculateBusinessDays(details.startDate, details.endDate);

        // Consultamos el saldo disponible (que ya descuenta las otras solicitudes pending)
        const balance = await this.vacationsService.getEmployeeBalance(employeeId);

        if (balance.availableBalance < requestedDays) {
            throw new BadRequestException(
                `Saldo insuficiente. Tienes ${balance.availableBalance} días disponibles (ya descontando otras solicitudes pendientes) y pides ${requestedDays}.`
            );
        }
    }

    // 2. PROCESAMIENTO PREVIO
    async processBeforeSave(details: any): Promise<any> {
        // Calculamos y guardamos los días exactos en el JSON
        // Esto es crucial para que getEmployeeBalance pueda leer 'pendingReserved' rápido
        const days = this.calculateBusinessDays(details.startDate, details.endDate);
        return {
            ...details,
            calculatedDays: days
        };
    }

    // 3. APROBACIÓN (Commit al Ledger)
    async onApprove(request: Request): Promise<void> {
        // Re-verificar elegibilidad al momento de aprobar
        await this.vacationsService.validateEligibility(request.employeeId);

        const days = request.details['calculatedDays'];
        // Escribimos en el Ledger (Esto reduce el Real Balance permanentemente)
        await this.vacationsService.registerUsage(request.employeeId, days, request.id);

        // NOTA: No necesitamos "borrar" el pending. 
        // Como la solicitud ahora es APPROVED, getEmployeeBalance ya no la contará como pending.
        console.log(`[Vacaciones] Solicitud #${request.id} aprobada. ${days} días descontados.`);
    }

    // 4. RECHAZO / CANCELACIÓN
    async onReject(request: Request): Promise<void> {
        // No hacemos nada. 
        // Como la solicitud pasa a REJECTED, getEmployeeBalance ya no la contará como pending.
        // El saldo disponible se libera automáticamente.
        console.log(`[Vacaciones] Solicitud #${request.id} rechazada. Días liberados.`);
    }

    getRequestType(): string {
        return 'VACATION';
    }

    // Utilidad simple para días hábiles (Deberías mejorarla con un calendario de festivos real)
    private calculateBusinessDays(startStr: string, endStr: string): number {
        const start = new Date(startStr);
        const end = new Date(endStr);
        let count = 0;
        let curDate = start;
        while (curDate <= end) {
            const dayOfWeek = curDate.getDay();
            // Contar de lunes a sábado (1-6), excluir solo domingos (0)
            if (dayOfWeek !== 0) count++;
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    }
}