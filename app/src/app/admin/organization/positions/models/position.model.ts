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
}

export interface CreatePositionDto {
    name: string;
    riskLevel: RiskLevel;
}

export interface UpdatePositionDto {
    name?: string;
    riskLevel?: RiskLevel;
}
