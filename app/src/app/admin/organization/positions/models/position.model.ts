export enum RiskLevel {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V'
}

export interface Position {
    id: string;
    name: string;
    riskLevel: RiskLevel;
    departmentId: string;
    department?: {
        id: string;
        name: string;
        company?: {
            id: string;
            name: string;
        };
    };
}

export interface CreatePositionDto {
    name: string;
    riskLevel: RiskLevel;
    departmentId: string;
}

export interface UpdatePositionDto {
    name?: string;
    riskLevel?: RiskLevel;
    departmentId?: string;
}
