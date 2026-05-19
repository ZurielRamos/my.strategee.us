export interface DeviceInfo {
    deviceName: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
    userAgent: string;
    ipAddress?: string;
}
