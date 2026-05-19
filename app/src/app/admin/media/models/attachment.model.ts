export enum AttachmentType {
    IMAGE = 'image',
    DOCUMENT = 'document',
    VIDEO = 'video',
    OTHER = 'other'
}

export enum AttachmentFolder {
    GENERAL = 'general',
    EMPLOYEES = 'employees',
    CONTRACTS = 'contracts',
    REQUESTS = 'requests',
    LOGOS = 'logos'
}

export interface AttachmentVariants {
    thumbnail: string;
    small: string;
    medium: string;
    original: string;
}

export interface Attachment {
    id: string;
    name: string;
    title?: string;
    url: string;
    storagePath: string;
    mimeType: string;
    size: number;
    type: AttachmentType;
    folder: AttachmentFolder;
    alt?: string;
    description?: string;
    variants?: AttachmentVariants;
    uploadedBy?: string;
    createdAt: string;
    updatedAt: string;
}

export interface FindAttachmentsDto {
    type?: AttachmentType;
    folder?: AttachmentFolder;
    search?: string;
    searchTitle?: string;
    sortByDate?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}

export interface AttachmentResponse {
    data: Attachment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
