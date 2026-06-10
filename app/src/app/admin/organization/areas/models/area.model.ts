export interface Area {
    id: string;
    name: string;
    costCenterCode?: string;
    description?: string;
}

export interface CreateAreaDto {
    name: string;
    costCenterCode?: string;
    description?: string;
}

export interface UpdateAreaDto {
    name?: string;
    costCenterCode?: string;
    description?: string;
}
