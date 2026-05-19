import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface AdminRequestFilters {
    type?: string;
    status?: string;
    employeeId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface RequestEmployee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position?: string;
}

export interface AdminRequest {
    id: number;
    type: string;
    status: string;
    details: any;
    reviewerComment?: string;
    employeeId: string;
    employee?: RequestEmployee;
    createdAt: string;
    updatedAt: string;
}

export interface PaginatedAdminRequests {
    data: AdminRequest[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ProcessRequestDto {
    reviewerComment?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminRequestsService {
    private apiUrl = `${environment.apiUrl}/requests`;

    constructor(private http: HttpClient) { }

    getAllRequests(filters?: AdminRequestFilters): Observable<PaginatedAdminRequests> {
        let params = new HttpParams();
        
        if (filters) {
            if (filters.type !== undefined) params = params.set('type', filters.type);
            if (filters.status !== undefined) params = params.set('status', filters.status);
            if (filters.employeeId !== undefined) params = params.set('employeeId', filters.employeeId.toString());
            if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
            if (filters.page !== undefined) params = params.set('page', filters.page.toString());
            if (filters.limit !== undefined) params = params.set('limit', filters.limit.toString());
            if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
            if (filters.order) params = params.set('order', filters.order);
        }

        return this.http.get<PaginatedAdminRequests>(`${this.apiUrl}/admin`, { params });
    }

    approveRequest(requestId: number, data: ProcessRequestDto): Observable<AdminRequest> {
        return this.http.patch<AdminRequest>(`${this.apiUrl}/${requestId}/approve`, data);
    }

    rejectRequest(requestId: number, data: ProcessRequestDto): Observable<AdminRequest> {
        return this.http.patch<AdminRequest>(`${this.apiUrl}/${requestId}/reject`, data);
    }

    updateRequest(requestId: number, data: Partial<AdminRequest>): Observable<AdminRequest> {
        return this.http.patch<AdminRequest>(`${this.apiUrl}/${requestId}`, data);
    }

    getPendingCount(): Observable<{ count: number }> {
        const params = new HttpParams()
            .set('status', 'PENDING')
            .set('limit', '1');
        
        return this.http.get<PaginatedAdminRequests>(`${this.apiUrl}/admin`, { params })
            .pipe(
                map(response => ({ count: response.meta.total }))
            );
    }
}
