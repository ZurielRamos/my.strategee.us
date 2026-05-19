import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Skip auth endpoints
        if (request.url.includes('/auth/sign-in') || request.url.includes('/auth/refresh')) {
            return next.handle(request);
        }

        const token = this.authService.getAccessToken();
        if (token) {
            request = this.addToken(request, token);
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401 && !request.url.includes('/auth/logout')) {
                    return this.handle401Error(request, next);
                }
                return throwError(() => error);
            })
        );
    }

    private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
        return request.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this.isRefreshing) {
            return this.refreshTokenSubject.pipe(
                filter(token => token !== null),
                take(1),
                switchMap(token => next.handle(this.addToken(request, token!)))
            );
        }

        this.isRefreshing = true;
        this.refreshTokenSubject.next(null);

        return this.authService.refreshTokens().pipe(
            switchMap(({ accessToken }) => {
                this.isRefreshing = false;
                this.refreshTokenSubject.next(accessToken);
                return next.handle(this.addToken(request, accessToken));
            }),
            catchError((error) => {
                this.isRefreshing = false;
                return throwError(() => error);
            })
        );
    }
}
