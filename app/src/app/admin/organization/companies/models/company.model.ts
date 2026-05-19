export interface Company {
    id: string;
    name: string;
    legalName: string;
    nit: string;
    address: string;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateCompanyDto {
    name: string;
    legalName: string;
    nit: string;
    address: string;
    logoId?: string;
}

export interface UpdateCompanyDto {
    name?: string;
    legalName?: string;
    nit?: string;
    address?: string;
    logoId?: string;
}
