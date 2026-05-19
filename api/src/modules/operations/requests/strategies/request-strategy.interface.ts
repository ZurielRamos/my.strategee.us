import { Request } from '../entities/request.entity';

export interface IRequestStrategy {
    /**
     * Valida la estructura y lógica de negocio de los detalles JSON.
     * Lanza excepciones si los datos son inválidos.
     */
    validate(details: any, employeeId: string): Promise<void>;

    /**
     * Ejecuta lógica adicional antes de guardar (ej: calcular días, verificar saldos).
     * Retorna el objeto details enriquecido o modificado.
     */
    processBeforeSave(details: any, employeeId?: string): Promise<any>;

    /**
     * Obtiene el tipo de solicitud que maneja esta estrategia.
     */
    getRequestType(): string;

    /**
     * Se ejecuta DESPUÉS de cambiar el estado a APPROVED.
     * Útil para descontar inventario, saldos de vacaciones, enviar emails, etc.
     */
    onApprove(request: Request): Promise<void>;

    /**
     * Se ejecuta DESPUÉS de cambiar el estado a REJECTED.
     * Útil para liberar recursos reservados.
     */
    onReject(request: Request): Promise<void>;
}