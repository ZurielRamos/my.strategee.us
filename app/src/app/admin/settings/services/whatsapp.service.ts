import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface WhatsappConfig {
    id: string;
    apiUrl: string;
    apiKey: string;
    createdAt: string;
    updatedAt: string;
}

export interface WhatsappDevice {
    id: string;
    name: string;
    instanceName: string;
    status: string;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateWhatsappConfigDto {
    apiUrl: string;
    apiKey: string;
}

export interface CreateWhatsappDeviceDto {
    name: string;
    instanceName: string;
}

@Injectable({
    providedIn: 'root'
})
export class WhatsappService {
    private apiUrl = `${environment.apiUrl}/whatsapp`;

    constructor(private http: HttpClient) {}

    // Config
    getConfig(): Observable<WhatsappConfig | null> {
        return this.http.get<WhatsappConfig | null>(`${this.apiUrl}/config`);
    }

    updateConfig(dto: UpdateWhatsappConfigDto): Observable<WhatsappConfig> {
        return this.http.patch<WhatsappConfig>(`${this.apiUrl}/config`, dto);
    }

    // Devices
    getDevices(): Observable<WhatsappDevice[]> {
        return this.http.get<WhatsappDevice[]>(`${this.apiUrl}/devices`);
    }

    createDevice(dto: CreateWhatsappDeviceDto): Observable<WhatsappDevice> {
        return this.http.post<WhatsappDevice>(`${this.apiUrl}/devices`, dto);
    }

    getDeviceStatus(id: string): Observable<{ status: string; phoneNumber?: string }> {
        return this.http.get<{ status: string; phoneNumber?: string }>(`${this.apiUrl}/devices/${id}/status`);
    }

    getDeviceQr(id: string): Observable<{ qrcode: string }> {
        return this.http.get<{ qrcode: string }>(`${this.apiUrl}/devices/${id}/qr`);
    }

    deleteDevice(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/devices/${id}`);
    }
}
