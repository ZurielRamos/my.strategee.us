import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Vault, CreateVaultDto, UpdateVaultDto } from '../models/vault.model';
import { Credential, CredentialListItem, CreateCredentialDto, UpdateCredentialDto } from '../models/credential.model';
import { AccessLog } from '../models/access-log.model';

@Injectable({
  providedIn: 'root'
})
export class PasswordVaultService {
  private readonly apiUrl = `${environment.apiUrl}/password-vault`;

  constructor(private http: HttpClient) {}

  // Vault operations
  getVaults(): Observable<Vault[]> {
    return this.http.get<Vault[]>(`${this.apiUrl}/vaults`);
  }

  getVault(id: string): Observable<Vault> {
    return this.http.get<Vault>(`${this.apiUrl}/vaults/${id}`);
  }

  createVault(dto: CreateVaultDto): Observable<Vault> {
    return this.http.post<Vault>(`${this.apiUrl}/vaults`, dto);
  }

  updateVault(id: string, dto: UpdateVaultDto): Observable<Vault> {
    return this.http.patch<Vault>(`${this.apiUrl}/vaults/${id}`, dto);
  }

  deleteVault(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/vaults/${id}`);
  }

  // Credential operations
  getCredentials(params?: {
    vaultId?: string;
    search?: string;
  }): Observable<CredentialListItem[]> {
    let httpParams = new HttpParams();
    if (params?.vaultId) {
      httpParams = httpParams.set('vaultId', params.vaultId);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<{ data: CredentialListItem[]; total: number; page: number; limit: number }>(
      `${this.apiUrl}/credentials`,
      { params: httpParams }
    ).pipe(
      map(response => response.data)
    );
  }

  getCredential(id: string): Observable<Credential> {
    return this.http.get<Credential>(`${this.apiUrl}/credentials/${id}`);
  }

  createCredential(dto: CreateCredentialDto): Observable<Credential> {
    return this.http.post<Credential>(`${this.apiUrl}/credentials`, dto);
  }

  updateCredential(id: string, dto: UpdateCredentialDto): Observable<Credential> {
    return this.http.patch<Credential>(`${this.apiUrl}/credentials/${id}`, dto);
  }

  deleteCredential(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/credentials/${id}`);
  }

  // Access logs
  getAccessLogs(credentialId: string): Observable<AccessLog[]> {
    return this.http.get<AccessLog[]>(
      `${this.apiUrl}/credentials/${credentialId}/access-logs`
    );
  }
}
