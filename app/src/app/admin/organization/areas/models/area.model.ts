export interface Area {
    id: string;
    name: string;
    costCenterCode?: string;
    description?: string;
    companyId: string;
    company?: {
        id: string;
        name: string;
    };
}

export interface CreateAreaDto {
    name: string;
    costCenterCode?: string;
    description?: string;
    companyId: string;
}

export interface UpdateAreaDto {
    name?: string;
    costCenterCode?: string;
    description?: string;
    companyId?: string;
}
