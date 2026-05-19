export interface Location {
    id: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateLocationDto {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
}

export interface UpdateLocationDto {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    country?: string;
}
