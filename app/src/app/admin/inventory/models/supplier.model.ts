export interface Supplier {
    id: string;
    name: string;
    phone: string;
    email: string;
    contactPerson: string;
    address: string | null;
    observations: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
