import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BahamasConfig {
    id: string;
    whatsappDeviceId: string;
    morningStart: string;
    morningEnd: string;
    morningDelivery: string;
    afternoonStart: string;
    afternoonEnd: string;
    afternoonDelivery: string;
    saturdayStart: string;
    saturdayEnd: string;
    saturdayDelivery: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateBahamasConfigDto {
    whatsappDeviceId: string;
    morningStart: string;
    morningEnd: string;
    morningDelivery: string;
    afternoonStart: string;
    afternoonEnd: string;
    afternoonDelivery: string;
    saturdayStart: string;
    saturdayEnd: string;
    saturdayDelivery: string;
}

@Injectable({
    providedIn: 'root'
})
export class BahamasService {
    private apiUrl = `${environment.apiUrl}/bahamas/config`;

    constructor(private http: HttpClient) {}

    getConfig(): Observable<BahamasConfig | null> {
        return this.http.get<BahamasConfig | null>(this.apiUrl);
    }

    updateConfig(dto: UpdateBahamasConfigDto): Observable<BahamasConfig> {
        return this.http.patch<BahamasConfig>(this.apiUrl, dto);
    }
}
