import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    private authService = inject(AuthService);
    private router = inject(Router);

    async canActivate(route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
        await this.authService.storageReady;

        const expectedRoles = route.data['roles'] as Array<string>;

        if (!this.authService.isAuthenticated()) {
            return this.router.createUrlTree(['/auth/login']);
        }

        const user = this.authService.getCurrentUser();
        const userRoles = user?.roles || [];

        // Verificar si el usuario tiene al menos uno de los roles requeridos
        const hasRole = expectedRoles.some(role => userRoles.includes(role));

        if (hasRole) {
            // El usuario tiene permiso, permitir acceso
            return true;
        }

        // Si no tiene permiso, redirigir según su rol
        if (userRoles.includes('EMPLOYEE')) {
            return this.router.createUrlTree(['/employee/dashboard']);
        }
        
        return this.router.createUrlTree(['/auth/login']);
    }
}
