import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaginatedResponse } from 'src/app/shared/models/paginated-response.model';
import {
    TypeInventory,
    Supplier,
    Hardware,
    Software,
    AdditionalElement,
    Inventory,
    InventoryFeature,
    InventoryAllocation,
    AllocationElement,
    Maintenance,
} from '../models';

@Injectable({ providedIn: 'root' })
export class InventoryAdminService {
    private readonly apiUrl = `${environment.apiUrl}/inventory`;

    constructor(private http: HttpClient) {}

    // ─── Type Inventories ───────────────────────────────────────────────────

    getTypeInventories(page = 1, limit = 20, search = ''): Observable<PaginatedResponse<TypeInventory>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedResponse<TypeInventory>>(`${this.apiUrl}/types`, { params });
    }

    createTypeInventory(dto: Partial<TypeInventory>): Observable<TypeInventory> {
        return this.http.post<TypeInventory>(`${this.apiUrl}/types`, dto);
    }

    updateTypeInventory(id: string, dto: Partial<TypeInventory>): Observable<TypeInventory> {
        return this.http.patch<TypeInventory>(`${this.apiUrl}/types/${id}`, dto);
    }

    toggleTypeInventoryStatus(id: string): Observable<TypeInventory> {
        return this.http.patch<TypeInventory>(`${this.apiUrl}/types/${id}/toggle-status`, {});
    }

    // ─── Suppliers ──────────────────────────────────────────────────────────

    getSuppliers(page = 1, limit = 20, search = ''): Observable<PaginatedResponse<Supplier>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedResponse<Supplier>>(`${this.apiUrl}/suppliers`, { params });
    }

    createSupplier(dto: Partial<Supplier>): Observable<Supplier> {
        return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, dto);
    }

    updateSupplier(id: string, dto: Partial<Supplier>): Observable<Supplier> {
        return this.http.patch<Supplier>(`${this.apiUrl}/suppliers/${id}`, dto);
    }

    toggleSupplierStatus(id: string): Observable<Supplier> {
        return this.http.patch<Supplier>(`${this.apiUrl}/suppliers/${id}/toggle-status`, {});
    }

    // ─── Hardwares ──────────────────────────────────────────────────────────

    getHardwares(page = 1, limit = 20, search = ''): Observable<PaginatedResponse<Hardware>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedResponse<Hardware>>(`${this.apiUrl}/hardwares`, { params });
    }

    createHardware(dto: Partial<Hardware>): Observable<Hardware> {
        return this.http.post<Hardware>(`${this.apiUrl}/hardwares`, dto);
    }

    updateHardware(id: string, dto: Partial<Hardware>): Observable<Hardware> {
        return this.http.patch<Hardware>(`${this.apiUrl}/hardwares/${id}`, dto);
    }

    toggleHardwareStatus(id: string): Observable<Hardware> {
        return this.http.patch<Hardware>(`${this.apiUrl}/hardwares/${id}/toggle-status`, {});
    }

    // ─── Softwares ──────────────────────────────────────────────────────────

    getSoftwares(page = 1, limit = 20, search = ''): Observable<PaginatedResponse<Software>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedResponse<Software>>(`${this.apiUrl}/softwares`, { params });
    }

    createSoftware(dto: Partial<Software>): Observable<Software> {
        return this.http.post<Software>(`${this.apiUrl}/softwares`, dto);
    }

    updateSoftware(id: string, dto: Partial<Software>): Observable<Software> {
        return this.http.patch<Software>(`${this.apiUrl}/softwares/${id}`, dto);
    }

    toggleSoftwareStatus(id: string): Observable<Software> {
        return this.http.patch<Software>(`${this.apiUrl}/softwares/${id}/toggle-status`, {});
    }

    // ─── Additional Elements ────────────────────────────────────────────────

    getAdditionalElements(page = 1, limit = 20, search = ''): Observable<PaginatedResponse<AdditionalElement>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedResponse<AdditionalElement>>(`${this.apiUrl}/additional-elements`, { params });
    }

    createAdditionalElement(dto: Partial<AdditionalElement>): Observable<AdditionalElement> {
        return this.http.post<AdditionalElement>(`${this.apiUrl}/additional-elements`, dto);
    }

    updateAdditionalElement(id: string, dto: Partial<AdditionalElement>): Observable<AdditionalElement> {
        return this.http.patch<AdditionalElement>(`${this.apiUrl}/additional-elements/${id}`, dto);
    }

    toggleAdditionalElementStatus(id: string): Observable<AdditionalElement> {
        return this.http.patch<AdditionalElement>(`${this.apiUrl}/additional-elements/${id}/toggle-status`, {});
    }

    // ─── Inventories (Assets) ───────────────────────────────────────────────

    getInventories(page = 1, limit = 20, search = '', typeId?: string, supplierId?: string): Observable<PaginatedResponse<Inventory>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        if (typeId) params = params.set('typeId', typeId);
        if (supplierId) params = params.set('supplierId', supplierId);
        return this.http.get<PaginatedResponse<Inventory>>(`${this.apiUrl}/assets`, { params });
    }

    getInventoryDetail(id: string): Observable<Inventory> {
        return this.http.get<Inventory>(`${this.apiUrl}/assets/${id}`);
    }

    createInventory(dto: Partial<Inventory>): Observable<Inventory> {
        return this.http.post<Inventory>(`${this.apiUrl}/assets`, dto);
    }

    updateInventory(id: string, dto: Partial<Inventory>): Observable<Inventory> {
        return this.http.patch<Inventory>(`${this.apiUrl}/assets/${id}`, dto);
    }

    toggleInventoryStatus(id: string): Observable<Inventory> {
        return this.http.patch<Inventory>(`${this.apiUrl}/assets/${id}/toggle-status`, {});
    }

    // ─── Inventory Features ─────────────────────────────────────────────────

    addFeature(inventoryId: string, dto: Partial<InventoryFeature>): Observable<InventoryFeature> {
        return this.http.post<InventoryFeature>(`${this.apiUrl}/assets/${inventoryId}/features`, dto);
    }

    removeFeature(inventoryId: string, featureId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/assets/${inventoryId}/features/${featureId}`);
    }

    // ─── Allocations ────────────────────────────────────────────────────────

    getAllocations(page = 1, limit = 20, search = ''): Observable<PaginatedResponse<InventoryAllocation>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        return this.http.get<PaginatedResponse<InventoryAllocation>>(`${this.apiUrl}/allocations`, { params });
    }

    getAllocationDetail(id: string): Observable<InventoryAllocation> {
        return this.http.get<InventoryAllocation>(`${this.apiUrl}/allocations/${id}`);
    }

    createAllocation(dto: Partial<InventoryAllocation>): Observable<InventoryAllocation> {
        return this.http.post<InventoryAllocation>(`${this.apiUrl}/allocations`, dto);
    }

    updateAllocation(id: string, dto: Partial<InventoryAllocation>): Observable<InventoryAllocation> {
        return this.http.patch<InventoryAllocation>(`${this.apiUrl}/allocations/${id}`, dto);
    }

    addAllocationElement(allocationId: string, dto: Partial<AllocationElement>): Observable<AllocationElement> {
        return this.http.post<AllocationElement>(`${this.apiUrl}/allocations/${allocationId}/elements`, dto);
    }

    removeAllocationElement(allocationId: string, elementId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/allocations/${allocationId}/elements/${elementId}`);
    }

    // ─── Reception Format ───────────────────────────────────────────────────

    sendReceptionFormat(allocationId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/reception-format/${allocationId}/send`, {});
    }

    getReceptionPdf(allocationId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/reception-format/${allocationId}/pdf`, {
            responseType: 'blob',
        });
    }

    // ─── Maintenances ───────────────────────────────────────────────────────

    getMaintenances(page = 1, limit = 20, search = '', inventoryId?: string): Observable<PaginatedResponse<Maintenance>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (search) params = params.set('search', search);
        if (inventoryId) params = params.set('inventoryId', inventoryId);
        return this.http.get<PaginatedResponse<Maintenance>>(`${this.apiUrl}/maintenances`, { params });
    }

    createMaintenance(dto: Partial<Maintenance>): Observable<Maintenance> {
        return this.http.post<Maintenance>(`${this.apiUrl}/maintenances`, dto);
    }

    updateMaintenance(id: string, dto: Partial<Maintenance>): Observable<Maintenance> {
        return this.http.patch<Maintenance>(`${this.apiUrl}/maintenances/${id}`, dto);
    }

    deleteMaintenance(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/maintenances/${id}`);
    }

    // ─── Employee ───────────────────────────────────────────────────────────

    getMyAssignedAssets(): Observable<InventoryAllocation[]> {
        return this.http.get<InventoryAllocation[]>(`${this.apiUrl}/allocations/my-assets`);
    }
}
