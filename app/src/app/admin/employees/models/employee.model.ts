export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    documentType: string;
    birthDate: string;
    gender: string;
    address: string;
    personalPhone: string;
    personalEmail: string;
    corporateEmail: string;
    idoLimit: number;
    photoUrl?: string;
    isActive: boolean;
    vacationBalance?: number;
    createdAt?: string;
    updatedAt?: string;
    user?: any;
    contracts?: any[];
    compensations?: any[];
    benefitAllocations?: {
        id: number;
        benefitType: string;
        monthlyQuota: number;
    }[];
    contract?: any;
    profilePhoto?: {
        id: string;
        url: string;
        title?: string;
    } | null;
}
