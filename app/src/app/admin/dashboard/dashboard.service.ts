import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface DashboardData {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    pendingRequests: number;
    approvedToday: number;
    rejectedToday: number;
    activeContracts: number;
    recentRequests: RecentRequest[];
    requestsByType: RequestTypeCount[];
}

export interface RecentRequest {
    id: number;
    employeeName: string;
    type: string;
    status: string;
    createdAt: string;
}

export interface RequestTypeCount {
    type: string;
    count: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private readonly api = environment.apiUrl;

    constructor(private http: HttpClient) {}

    loadDashboard(): Observable<DashboardData> {
        const today = new Date().toISOString().split('T')[0];

        return forkJoin({
            employees: this.http.get<any>(`${this.api}/employees`, {
                params: new HttpParams().set('page', '1').set('limit', '1')
            }).pipe(catchError(() => of({ meta: { total: 0 } }))),

            activeEmployees: this.http.get<any>(`${this.api}/employees`, {
                params: new HttpParams().set('page', '1').set('limit', '1').set('isActive', 'true')
            }).pipe(catchError(() => of({ meta: { total: 0 } }))),

            pending: this.http.get<any>(`${this.api}/requests/admin`, {
                params: new HttpParams().set('status', 'PENDING').set('limit', '1')
            }).pipe(catchError(() => of({ meta: { total: 0 } }))),

            approvedToday: this.http.get<any>(`${this.api}/requests/admin`, {
                params: new HttpParams()
                    .set('status', 'APPROVED')
                    .set('dateFrom', today)
                    .set('dateTo', today)
                    .set('limit', '1')
            }).pipe(catchError(() => of({ meta: { total: 0 } }))),

            rejectedToday: this.http.get<any>(`${this.api}/requests/admin`, {
                params: new HttpParams()
                    .set('status', 'REJECTED')
                    .set('dateFrom', today)
                    .set('dateTo', today)
                    .set('limit', '1')
            }).pipe(catchError(() => of({ meta: { total: 0 } }))),

            contracts: this.http.get<any[]>(`${this.api}/contracts`).pipe(
                catchError(() => of([]))
            ),

            recentRequests: this.http.get<any>(`${this.api}/requests/admin`, {
                params: new HttpParams().set('limit', '8').set('sortBy', 'createdAt').set('order', 'DESC')
            }).pipe(catchError(() => of({ data: [] }))),

        }).pipe(
            map(({ employees, activeEmployees, pending, approvedToday, rejectedToday, contracts, recentRequests }) => {
                const total = employees?.meta?.total ?? 0;
                const active = activeEmployees?.meta?.total ?? 0;
                const activeContracts = Array.isArray(contracts)
                    ? contracts.filter((c: any) => c.status === 'ACTIVE').length
                    : 0;

                const recent: RecentRequest[] = (recentRequests?.data ?? []).map((r: any) => ({
                    id: r.id,
                    employeeName: r.employee
                        ? `${r.employee.firstName} ${r.employee.lastName}`
                        : 'Empleado',
                    type: r.type,
                    status: r.status,
                    createdAt: r.createdAt,
                }));

                return {
                    totalEmployees: total,
                    activeEmployees: active,
                    inactiveEmployees: total - active,
                    pendingRequests: pending?.meta?.total ?? 0,
                    approvedToday: approvedToday?.meta?.total ?? 0,
                    rejectedToday: rejectedToday?.meta?.total ?? 0,
                    activeContracts,
                    recentRequests: recent,
                    requestsByType: [],
                };
            })
        );
    }
}
