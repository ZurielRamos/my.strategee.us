import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  Training,
  TrainingsListResponse,
  CompletionReport,
  ExcludedEmployee,
} from '../models/training.model';

export interface CreateTrainingDto {
  title: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  isMandatory?: boolean;
}

export interface UpdateTrainingDto {
  title?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isMandatory?: boolean;
  status?: string;
}

export interface ReorderMaterialItem {
  materialId: string;
  orderIndex: number;
}

export interface SaveQuizDto {
  passingScore: number;
  questions: {
    text: string;
    score?: number;
    orderIndex: number;
    options: {
      text: string;
      isCorrect: boolean;
      orderIndex: number;
    }[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class TrainingsAdminService {
  private readonly apiUrl = `${environment.apiUrl}/trainings`;

  constructor(private http: HttpClient) {}

  // ─── Trainings CRUD ───────────────────────────────────────────────────────

  /**
   * Crea un nuevo training
   */
  create(data: CreateTrainingDto): Observable<Training> {
    return this.http.post<Training>(this.apiUrl, data);
  }

  /**
   * Lista todos los trainings con paginación
   */
  findAll(page = 1, limit = 20): Observable<TrainingsListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<TrainingsListResponse>(this.apiUrl, { params });
  }

  /**
   * Obtiene el detalle de un training por ID
   */
  findOne(id: string): Observable<Training> {
    return this.http.get<Training>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza un training existente
   */
  update(id: string, data: UpdateTrainingDto): Observable<Training> {
    return this.http.patch<Training>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Elimina un training (cascade)
   */
  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene el reporte de completitud de un training
   */
  getCompletionReport(id: string, status?: string): Observable<CompletionReport> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<CompletionReport>(`${this.apiUrl}/${id}/completion`, { params });
  }

  // ─── Materials ────────────────────────────────────────────────────────────

  /**
   * Sube un material (PDF o video) para un training.
   * Usa FormData; NO se setea Content-Type manualmente para que el browser
   * incluya el boundary correcto en multipart/form-data.
   */
  uploadMaterial(trainingId: string, file: File, title: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    return this.http.post<any>(`${this.apiUrl}/${trainingId}/materials`, formData);
  }

  /**
   * Reordena los materiales de un training
   */
  reorderMaterials(
    trainingId: string,
    items: ReorderMaterialItem[]
  ): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${trainingId}/materials/reorder`, { items });
  }

  /**
   * Elimina un material de un training
   */
  removeMaterial(trainingId: string, materialId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/${trainingId}/materials/${materialId}`
    );
  }

  // ─── Quiz ─────────────────────────────────────────────────────────────────

  /**
   * Crea o reemplaza el quiz de un material
   */
  saveQuiz(materialId: string, data: SaveQuizDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/materials/${materialId}/quiz`, data);
  }

  /**
   * Elimina el quiz de un material
   */
  removeQuiz(materialId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/materials/${materialId}/quiz`
    );
  }

  // ─── Exclusions ───────────────────────────────────────────────────────────

  /**
   * Excluye empleados de un training
   */
  excludeEmployees(
    trainingId: string,
    employeeIds: string[]
  ): Observable<{ excluded: number }> {
    return this.http.post<{ excluded: number }>(
      `${this.apiUrl}/${trainingId}/exclusions`,
      { employeeIds }
    );
  }

  /**
   * Revierte la exclusión de un empleado de un training
   */
  revertExclusion(trainingId: string, employeeId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${trainingId}/exclusions/${employeeId}`
    );
  }

  /**
   * Lista los empleados excluidos de un training
   */
  getExcluded(trainingId: string): Observable<ExcludedEmployee[]> {
    return this.http.get<ExcludedEmployee[]>(
      `${this.apiUrl}/${trainingId}/exclusions`
    );
  }

  // ─── Employee management (modo selected) ─────────────────────────────────

  getAssignedEmployees(trainingId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${trainingId}/employees`);
  }

  addEmployees(trainingId: string, employeeIds: string[]): Observable<{ added: number }> {
    return this.http.post<{ added: number }>(`${this.apiUrl}/${trainingId}/employees`, { employeeIds });
  }

  removeEmployee(trainingId: string, employeeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${trainingId}/employees/${employeeId}`);
  }
}
