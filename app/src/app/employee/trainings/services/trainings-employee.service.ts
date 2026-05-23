import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  MyTraining,
  MyTrainingListItem,
  QuizSubmitResult,
} from '../models/my-training.model';

export interface QuizAnswer {
  questionId: string;
  optionId: string;
}

@Injectable({ providedIn: 'root' })
export class TrainingsEmployeeService {
  private readonly apiUrl = `${environment.apiUrl}/trainings`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de trainings asignadas al empleado autenticado
   */
  getMyTrainings(): Observable<MyTrainingListItem[]> {
    return this.http.get<MyTrainingListItem[]>(`${this.apiUrl}/my`);
  }

  /**
   * Obtiene el detalle completo de una training con materiales y progreso
   */
  getMyTrainingDetail(id: string): Observable<MyTraining> {
    return this.http.get<MyTraining>(`${this.apiUrl}/my/${id}`);
  }

  /**
   * Marca un material como visto/completado
   */
  completeMaterial(trainingId: string, materialId: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/my/${trainingId}/materials/${materialId}/complete`,
      {}
    );
  }

  /**
   * Envía las respuestas del quiz de un material
   */
  submitQuiz(
    trainingId: string,
    materialId: string,
    answers: QuizAnswer[]
  ): Observable<QuizSubmitResult> {
    return this.http.post<QuizSubmitResult>(
      `${this.apiUrl}/my/${trainingId}/materials/${materialId}/quiz/submit`,
      { answers }
    );
  }
}
