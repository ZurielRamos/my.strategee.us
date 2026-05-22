import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class InitialGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    async canActivate(): Promise<boolean | UrlTree> {
        // Esperamos a que el storage async haya sido leído antes de verificar auth.
        await this.authService.storageReady;

        if (!this.authService.isAuthenticated()) {
            return this.router.createUrlTree(['/auth/login']);
        }

        const user = this.authService.getCurrentUser();
        const roles = user?.roles || [];

        // Si el usuario es ADMIN, redirigir a admin
        if (roles.includes('ADMIN')) {
            return this.router.createUrlTree(['/admin/dashboard']);
        } 
        // Si el usuario es EMPLOYEE (pero NO admin), redirigir a employee
        else if (roles.includes('EMPLOYEE')) {
            return this.router.createUrlTree(['/employee/dashboard']);
        }

        return this.router.createUrlTree(['/auth/login']);
    }
}
