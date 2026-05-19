export interface EnergyzeDaysBalance {
    totalDays: number;
    availableDays: number;
    pendingDays: number;
}

export enum EnergyzeDaysTransactionType {
    ACCUMULATION = 'ACUMULACION',
    USAGE = 'DISFRUTE',
    ADJUSTMENT = 'AJUSTE',
    EXPIRATION = 'VENCIMIENTO'
}

export interface EnergyzeDaysLedgerEntry {
    id: number;
    employeeId: string;
    type: EnergyzeDaysTransactionType;
    days: number;
    requestId: number | null;
    note: string;
    createdAt: Date;
}

export interface EnergyzeDayAccumulationDetails {
    date: string;
    days: number;
    reason: string;
}

export interface EnergyzeDayUsageDetails {
    date: string;
    reason: string;
    days?: number;
    balanceAfter?: number;
}
