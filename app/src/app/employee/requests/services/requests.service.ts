import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CreateRequestDto, Request, RequestType, RequestStatus } from '../models/request.model';

export interface RequestFilters {
    type?: RequestType;
    status?: RequestStatus;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface PaginatedRequests {
    data: Request[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class RequestsService {
    private apiUrl = `${environment.apiUrl}/requests`;

    constructor(private http: HttpClient) { }

    createRequest(requestDto: CreateRequestDto): Observable<Request> {
        return this.http.post<Request>(this.apiUrl, requestDto);
    }

    getMyRequests(filters?: RequestFilters): Observable<PaginatedRequests> {
        let params = new HttpParams();
        
        if (filters) {
            if (filters.type !== undefined) params = params.set('type', filters.type);
            if (filters.status !== undefined) params = params.set('status', filters.status);
            if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
            if (filters.page !== undefined) params = params.set('page', filters.page.toString());
            if (filters.limit !== undefined) params = params.set('limit', filters.limit.toString());
            if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
            if (filters.order) params = params.set('order', filters.order);
        }

        console.log('Request params:', params.toString());

        return this.http.get<PaginatedRequests>(`${this.apiUrl}/my-requests`, { params });
    }

    cancelRequest(requestId: number): Observable<Request> {
        return this.http.patch<Request>(`${this.apiUrl}/${requestId}/cancel`, {});
    }

    updateRequest(requestId: number, data: Partial<Request>): Observable<Request> {
        return this.http.patch<Request>(`${this.apiUrl}/${requestId}`, data);
    }
}
