import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BenefitAllocation, BenefitType } from '../models/benefit-allocation.model';

export interface SetAllocationDto {
    employeeId: string;
    benefitType: BenefitType;
    amount: number;
}

@Injectable({
    providedIn: 'root'
})
export class BenefitsService {
    private readonly apiUrl = `${environment.apiUrl}/benefits`;

    constructor(private http: HttpClient) { }

    /**
     * Asigna o actualiza un beneficio a un empleado
     */
    setAllocation(dto: SetAllocationDto): Observable<BenefitAllocation> {
        return this.http.post<BenefitAllocation>(`${this.apiUrl}/allocate`, dto);
    }

    /**
     * Obtiene todas las asignaciones de beneficios de un empleado
     */
    getAllocationsByEmployee(employeeId: string): Observable<BenefitAllocation[]> {
        return this.http.get<BenefitAllocation[]>(`${this.apiUrl}/allocations/${employeeId}`);
    }

    /**
     * Obtiene el balance de beneficios con días disponibles y usados
     */
    getBenefitBalances(): Observable<BenefitAllocation[]> {
        return this.http.get<BenefitAllocation[]>(`${this.apiUrl}/balances`);
    }
}
