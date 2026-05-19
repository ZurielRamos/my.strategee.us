import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Contract, ContractStatus, ContractType, PayrollGroup, SalaryType } from '../models/contract.model';

export interface CreateContractDto {
    employeeId: string;
    companyId: string;
    contractNumber?: string;
    startDate: string;
    endDate?: string;
    status?: ContractStatus;
    type: ContractType;
    payrollGroup: PayrollGroup;
    initialMemorandum: {
        positionId: string;
        scheduleId?: string;
        locationId?: string;
        salaryType: SalaryType;
        salaryAmount?: number;
        parameterKey?: string;
        startDate: string;
        endDate?: string;
        reason: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ContractsService {
    private readonly apiUrl = `${environment.apiUrl}/contracts`;

    constructor(private http: HttpClient) { }

    /**
     * Crea un nuevo contrato
     */
    create(dto: CreateContractDto): Observable<Contract> {
        return this.http.post<Contract>(this.apiUrl, dto);
    }

    /**
     * Obtiene el contrato activo del empleado autenticado
     */
    getMyActiveContract(): Observable<Contract | null> {
        return this.http.get<Contract | null>(`${this.apiUrl}/my-active`);
    }

    /**
     * Obtiene todos los contratos
     */
    getAll(): Observable<Contract[]> {
        return this.http.get<Contract[]>(this.apiUrl);
    }

    /**
     * Obtiene todos los contratos de un empleado (historial completo)
     */
    getAllByEmployee(employeeId: string): Observable<Contract[]> {
        return this.http.get<Contract[]>(`${this.apiUrl}/employee/${employeeId}/all`);
    }

    /**
     * Obtiene un contrato por ID
     */
    getById(id: string): Observable<Contract> {
        return this.http.get<Contract>(`${this.apiUrl}/${id}`);
    }

    /**
     * Cancela/Liquida un contrato
     */
    cancel(id: string): Observable<Contract> {
        return this.http.patch<Contract>(`${this.apiUrl}/${id}/cancel`, {});
    }

    /**
     * Activa un contrato (liquida el contrato activo previo si existe)
     */
    activate(id: string): Observable<Contract> {
        return this.http.patch<Contract>(`${this.apiUrl}/${id}/activate`, {});
    }

    /**
     * Suspende un contrato activo
     */
    suspend(id: string): Observable<Contract> {
        return this.http.patch<Contract>(`${this.apiUrl}/${id}/suspend`, {});
    }

    /**
     * Elimina físicamente un contrato
     * NOTA: Este método solo debe usarse en casos excepcionales por administradores.
     * En operaciones normales, usar cancel() para liquidar el contrato.
     */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Elimina un memorando pendiente
     */
    deleteMemorandum(memorandumId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/memorandums/${memorandumId}`);
    }
}
