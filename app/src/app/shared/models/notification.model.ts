export enum NotificationType {
    REQUEST_STATUS_CHANGE = 'REQUEST_STATUS_CHANGE',
}

export enum NotificationStatus {
    UNREAD = 'UNREAD',
    READ = 'READ',
}

export interface Notification {
    id: number;
    type: NotificationType;
    message: string;
    metadata: Record<string, any>;
    status: NotificationStatus;
    requestId?: number;
    readAt?: Date;
    createdAt: Date;
}

export interface NotificationQueryParams {
    page?: number;
    limit?: number;
    status?: NotificationStatus;
}

export interface UnreadCountResponse {
    count: number;
}

export interface PaginatedNotifications {
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
