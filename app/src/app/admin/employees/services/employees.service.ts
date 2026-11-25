import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, tap, throwError, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Employee } from '../models/employee.model';

export interface EmployeesResponse {
    data: Employee[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ContactInfoLog {
    id: string;
    createdAt: string;
    changedBy: string;
    fields: Array<{
        field: string;
        label: string;
        from: string | null;
        to: string;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class EmployeesService {
    private readonly apiUrl = `${environment.apiUrl}/employees`;

    private currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);
    currentEmployee$ = this.currentEmployeeSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Obtiene todos los empleados con paginación y búsqueda
     */
    getAll(
        page: number = 1, 
        limit: number = 100, 
        search?: string,
        hasCredentials?: boolean,
        contractStatus?: string,
        companyId?: string,
        status?: string
    ): Observable<EmployeesResponse> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        if (search && search.trim()) {
            params = params.set('search', search);
        }

        if (hasCredentials !== undefined && hasCredentials !== null) {
            params = params.set('hasCredentials', hasCredentials.toString());
        }

        if (contractStatus && contractStatus.trim()) {
            params = params.set('contractStatus', contractStatus);
        }

        if (companyId && companyId.trim()) {
            params = params.set('companyId', companyId);
        }

        if (status) {
            params = params.set('status', status);
        }
        return this.http.get<EmployeesResponse>(this.apiUrl, { params }).pipe(
            catchError(error => {
                console.error('Error loading employees:', error);
                return throwError(() => error);
            })
        );
    }

    /** Aprueba una solicitud de registro pendiente (envía el correo de bienvenida). */
    approveRegistration(id: string): Observable<Employee> {
        return this.http.post<Employee>(`${this.apiUrl}/${id}/approve`, {});
    }

    /** Rechaza (elimina) una solicitud de registro pendiente. */
    rejectRegistration(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
    }

    /**
     * Obtiene un empleado por su ID
     */
    getEmployeeById(id: string): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/${id}`);
    }

    /**
     * Crea un nuevo empleado
     */
    create(data: Partial<Employee>): Observable<Employee> {
        return this.http.post<Employee>(this.apiUrl, data);
    }

    /**
     * Actualiza un empleado existente
     */
    update(id: string, data: Partial<Employee>): Observable<Employee> {
        return this.http.patch<Employee>(`${this.apiUrl}/${id}`, data);
    }

    /**
     * Elimina un empleado (soft delete)
     */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Consulta el perfil del empleado actual
     */
    loadCurrentEmployee(id: string): Observable<Employee> {
        return this.getEmployeeById(id).pipe(
            tap(employee => this.currentEmployeeSubject.next(employee)),
            catchError(error => {
                console.error('[EmployeesService] Error loading current employee:', error);
                this.currentEmployeeSubject.next(null);
                return throwError(() => error);
            })
        );
    }

    /**
     * Retorna el empleado actual de forma síncrona
     */
    getCurrentEmployee(): Employee | null {
        return this.currentEmployeeSubject.getValue();
    }

    /**
     * Limpia el estado del empleado actual
     */
    clearCurrentEmployee(): void {
        this.currentEmployeeSubject.next(null);
    }

    /**
     * Actualiza la foto de perfil del empleado
     */
    updateProfilePhoto(id: string, profilePhotoId: string | null): Observable<Employee> {
        return this.http.patch<Employee>(`${this.apiUrl}/${id}/profile-photo`, { profilePhotoId });
    }

    /**
     * Crea credenciales de acceso para un empleado
     */
    createCredentials(id: string, data: { roles: string[] }): Observable<Employee> {
        return this.http.post<Employee>(`${this.apiUrl}/${id}/credentials`, data);
    }

    /**
     * Elimina las credenciales de acceso de un empleado
     */
    deleteCredentials(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/credentials`);
    }

    /**
     * Ajusta los días de vacaciones de un empleado
     */
    adjustVacationDays(data: { employeeId: string; type: 'ADD' | 'SUBTRACT'; days: number; reason: string }): Observable<any> {
        // Calcular los días con el signo correcto
        const days = data.type === 'ADD' ? data.days : -data.days;
        
        // Usar el endpoint de vacations para registrar el ajuste
        // y luego obtener el balance actualizado
        return this.http.post(`${environment.apiUrl}/vacations/adjust`, {
            employeeId: data.employeeId,
            days: days,
            note: data.reason
        }).pipe(
            switchMap(() => 
                // Después del ajuste, obtener el balance actualizado
                this.http.get(`${environment.apiUrl}/vacations/balance/${data.employeeId}`)
            )
        );
    }

    /**
     * Obtiene el perfil del empleado actual autenticado
     */
    getProfile(): Observable<Employee> {
        return this.http.get<Employee>(`${this.apiUrl}/profile`);
    }

    /**
     * Actualiza los datos de contacto del empleado autenticado
     */
    updateMyContactInfo(data: { address?: string; phone?: string; personalEmail?: string }): Observable<Employee> {
        return this.http.patch<Employee>(`${this.apiUrl}/my-contact-info`, data);
    }

    /**
     * Obtiene el historial de cambios de datos de contacto del empleado autenticado
     */
    getMyContactInfoLogs(): Observable<ContactInfoLog[]> {
        return this.http.get<ContactInfoLog[]>(`${this.apiUrl}/my-contact-info/logs`);
    }

    /**
     * Obtiene el historial de cambios de datos de contacto de un empleado (admin)
     */
    getContactInfoLogs(employeeId: string): Observable<ContactInfoLog[]> {
        return this.http.get<ContactInfoLog[]>(`${this.apiUrl}/${employeeId}/contact-info/logs`);
    }
}
