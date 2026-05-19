export interface EmergencyContact {
    id: number;
    employeeId: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string | null;
    createdAt?: string;
}

export interface CreateEmergencyContactDto {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
}
