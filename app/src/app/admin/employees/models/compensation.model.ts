export interface Compensation {
    id: string;
    employeeId: string;
    concept: string;
    isLinkedGlobalParameter: boolean;
    condition: CompensationCondition;
    frequency: CompensationFrequency;
    amount: number;
    linkedGlobalParameter?: string;
    isActive: boolean;
    status: CompensationStatus;
    startDate: string;
    endDate?: string;
    paymentDate?: string;
    paymentDay?: number;
    secondPaymentDay?: number;
    currentValue?: number;
}

export enum CompensationCondition {
    NONE = 'NONE',
    IDO_PERCENTAGE = 'IDO_PERCENTAGE',
    IDO_LIMIT = 'IDO_LIMIT'
}

export enum CompensationFrequency {
    ONE_TIME = 'ONE_TIME',
    RECURRING_MONTHLY = 'RECURRING_MONTHLY',
    RECURRING_BIWEEKLY = 'RECURRING_BIWEEKLY'
}

export enum CompensationStatus {
    ACTIVE = 'ACTIVE',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export const COMPENSATION_CONDITION_LABELS: { [key in CompensationCondition]: string } = {
    [CompensationCondition.NONE]: 'Ninguna',
    [CompensationCondition.IDO_PERCENTAGE]: 'Porcentaje IDO',
    [CompensationCondition.IDO_LIMIT]: 'Límite IDO'
};

export const COMPENSATION_FREQUENCY_LABELS: { [key in CompensationFrequency]: string } = {
    [CompensationFrequency.ONE_TIME]: 'Pago Único',
    [CompensationFrequency.RECURRING_MONTHLY]: 'Mensual',
    [CompensationFrequency.RECURRING_BIWEEKLY]: 'Quincenal'
};

export const COMPENSATION_STATUS_LABELS: { [key in CompensationStatus]: string } = {
    [CompensationStatus.ACTIVE]: 'Activo',
    [CompensationStatus.CANCELLED]: 'Cancelado',
    [CompensationStatus.COMPLETED]: 'Completado'
};

export function getCompensationConditionLabel(condition: CompensationCondition): string {
    return COMPENSATION_CONDITION_LABELS[condition] || condition;
}

export function getCompensationFrequencyLabel(frequency: CompensationFrequency): string {
    return COMPENSATION_FREQUENCY_LABELS[frequency] || frequency;
}

export function getCompensationStatusLabel(status: CompensationStatus): string {
    return COMPENSATION_STATUS_LABELS[status] || status;
}
