import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Attachment, AttachmentResponse, FindAttachmentsDto } from '../models/attachment.model';

@Injectable({
    providedIn: 'root'
})
export class MediaService {
    private readonly apiUrl = `${environment.apiUrl}/attachments`;

    constructor(private http: HttpClient) { }

    getAll(filters?: FindAttachmentsDto): Observable<AttachmentResponse> {
        let params = new HttpParams();
        if (filters?.type) params = params.set('type', filters.type);
        if (filters?.folder) params = params.set('folder', filters.folder);
        if (filters?.search) params = params.set('search', filters.search);
        if (filters?.searchTitle) params = params.set('searchTitle', filters.searchTitle);
        if (filters?.sortByDate) params = params.set('sortByDate', filters.sortByDate);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get<AttachmentResponse>(this.apiUrl, { params });
    }

    getById(id: string): Observable<Attachment> {
        return this.http.get<Attachment>(`${this.apiUrl}/${id}`);
    }

    upload(file: File, metadata?: { folder?: string; title?: string; description?: string; alt?: string }): Observable<Attachment> {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata?.folder) formData.append('folder', metadata.folder);
        if (metadata?.title) formData.append('title', metadata.title);
        if (metadata?.description) formData.append('description', metadata.description);
        if (metadata?.alt) formData.append('alt', metadata.alt);

        return this.http.post<Attachment>(this.apiUrl, formData);
    }

    bulkUpload(files: File[], metadata?: { folder?: string; title?: string; description?: string; alt?: string }): Observable<Attachment[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (metadata?.folder) formData.append('folder', metadata.folder);
        if (metadata?.title) formData.append('title', metadata.title);
        if (metadata?.description) formData.append('description', metadata.description);
        if (metadata?.alt) formData.append('alt', metadata.alt);

        return this.http.post<Attachment[]>(`${this.apiUrl}/bulk`, formData);
    }

    update(id: string, data: { title?: string; alt?: string; description?: string }): Observable<Attachment> {
        return this.http.patch<Attachment>(`${this.apiUrl}/${id}`, data);
    }

    delete(id: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }
}
