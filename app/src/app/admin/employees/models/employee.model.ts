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
    hireDate?: string | null;
    contractType?: string | null;
    companyId?: string | null;
    positionId?: string | null;
    departmentId?: string | null;
    company?: { id: string; name: string } | null;
    position?: { id: string; name: string } | null;
    department?: { id: string; name: string } | null;
    photoUrl?: string;
    isActive: boolean;
    status?: 'ACTIVE' | 'PENDING';
    termsAcceptedAt?: string | null;
    termsVersion?: string | null;
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
