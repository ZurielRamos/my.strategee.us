import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toastService: ToastService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log all errors to console for debugging
        console.error('HTTP Error:', {
          status: error.status,
          message: error.message,
          url: request.url,
          error: error.error
        });

        // Handle specific error codes
        // Note: AuthInterceptor runs first and handles 401 with token refresh
        // If token refresh fails, this interceptor will catch the 401 and redirect to login
        this.handleError(error);

        // Re-throw the error so components can handle it if needed
        return throwError(() => error);
      })
    );
  }

  private async handleError(error: HttpErrorResponse): Promise<void> {
    switch (error.status) {
      case 401:
        // Unauthorized - redirect to login
        await this.toastService.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        this.router.navigate(['/auth/sign-in']);
        break;

      case 403:
        // Forbidden - insufficient permissions
        await this.toastService.error('No tienes permisos suficientes para realizar esta acción.');
        break;

      case 404:
        // Not found
        await this.toastService.error('El recurso solicitado no fue encontrado.');
        break;

      case 409:
        // Conflict - show specific message from backend if available
        const conflictMessage = error.error?.message || 'Conflicto al procesar la solicitud.';
        await this.toastService.error(conflictMessage);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        await this.toastService.error('Error del servidor. Por favor, intenta nuevamente más tarde.');
        break;

      case 0:
        // Network error (no connection)
        await this.toastService.error('Error de conexión. Verifica tu conexión a internet.');
        break;

      default:
        // Other errors - show generic message
        const defaultMessage = error.error?.message || 'Ocurrió un error inesperado.';
        await this.toastService.error(defaultMessage);
        break;
    }
  }
}
