export interface BenefitAllocation {
    id: number;
    employeeId: string;
    benefitType: BenefitType;
    monthlyQuota: number;
    usedDays?: number;
    availableDays?: number;
}

export enum BenefitType {
    REMOTE_SATURDAY = 'SABADO REMOTO',
    WORKCATION = 'WORKCATION',
    HOME_OFFICE = 'HOME OFFICE',
    IDO_REST_SATURDAY = 'SABADO DESCANSO IDO',
    BIRTHDAY_EXTENSION = 'CUMPLEAÑOS'
}

export const BENEFIT_TYPE_LABELS: { [key in BenefitType]: string } = {
    [BenefitType.REMOTE_SATURDAY]: 'Sábado Remoto',
    [BenefitType.WORKCATION]: 'Workcation',
    [BenefitType.HOME_OFFICE]: 'Home Office',
    [BenefitType.IDO_REST_SATURDAY]: 'Sábado Descanso IDO',
    [BenefitType.BIRTHDAY_EXTENSION]: 'Cumpleaños'
};

export function getBenefitTypeLabel(type: BenefitType): string {
    return BENEFIT_TYPE_LABELS[type] || type;
}
