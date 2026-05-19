export interface EmployeeParafiscales {
    id?: number;
    employeeId: string;
    eps: string | null;
    arl: string | null;
    fondoPension: string | null;
    cajaCompensacion: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface UpsertParafiscalesDto {
    eps?: string | null;
    arl?: string | null;
    fondoPension?: string | null;
    cajaCompensacion?: string | null;
}

export const PARAFISCALES_LABELS: Record<keyof UpsertParafiscalesDto, string> = {
    eps: 'EPS',
    arl: 'ARL',
    fondoPension: 'Fondo de Pensión',
    cajaCompensacion: 'Caja de Compensación',
};
