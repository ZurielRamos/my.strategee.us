export interface Contract {
    id: string;
    employeeId: string;
    companyId: string;
    contractNumber?: string;
    status: ContractStatus;
    type: ContractType;
    payrollGroup: PayrollGroup;
    startDate: string;
    endDate?: string;
    memorandums?: Memorandum[];
    currentMemorandum?: Memorandum;
    createdAt?: string;
    updatedAt?: string;
}

export interface Memorandum {
    id: string;
    contractId: string;
    positionId: string;
    position?: any;
    departmentId?: string;
    department?: any;
    salaryType: SalaryType;
    salaryAmount: number;
    parameterKey?: string;
    startDate: string;
    endDate?: string;
    reason?: string;
    createdAt?: string;
}

export enum ContractStatus {
    ACTIVE = 'ACTIVE',
    DRAFT = 'DRAFT',
    LIQUIDATED = 'LIQUIDATED',
    SUSPENDED = 'SUSPENDED'
}

export enum ContractType {
    INDEFINITE_TERM = 'Término Indefinido',
    FIXED_TERM = 'Término Fijo',
    SERVICE_PROVISION_OVER_ONE_MONTH = 'Prestación de servicios superior a un mes',
    SERVICE_PROVISION_UNDER_ONE_MONTH = 'Prestación de servicios inferior a un mes'
}

export enum PayrollGroup {
    OPERATIVE = 'Operativa',
    ADMINISTRATIVE = 'Administrativa'
}

export enum SalaryType {
    FIXED = 'FIXED',
    PARAMETER = 'PARAMETER'
}

export const CONTRACT_STATUS_LABELS: { [key in ContractStatus]: string } = {
    [ContractStatus.ACTIVE]: 'Activo',
    [ContractStatus.DRAFT]: 'Borrador',
    [ContractStatus.LIQUIDATED]: 'Liquidado',
    [ContractStatus.SUSPENDED]: 'Suspendido'
};

export function getContractStatusLabel(status: ContractStatus): string {
    return CONTRACT_STATUS_LABELS[status] || status;
}

// Función helper para determinar el estado de un memorando basado en fechas
export function getMemorandumStatus(memorandum: Memorandum): 'ACTIVE' | 'PENDING' | 'EXPIRED' {
    const now = new Date();
    const start = new Date(memorandum.startDate);
    const end = memorandum.endDate ? new Date(memorandum.endDate) : null;
    
    if (start > now) {
        return 'PENDING';
    }
    if (end && end < now) {
        return 'EXPIRED';
    }
    return 'ACTIVE';
}

export function getMemorandumStatusLabel(status: 'ACTIVE' | 'PENDING' | 'EXPIRED'): string {
    const labels = {
        'PENDING': 'Pendiente',
        'ACTIVE': 'Activo',
        'EXPIRED': 'Expirado'
    };
    return labels[status] || status;
}
