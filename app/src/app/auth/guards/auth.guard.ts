import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    async canActivate(): Promise<boolean | UrlTree> {
        // Esperamos a que el storage async haya sido leído antes de verificar auth.
        // Esto evita el redirect al login cuando se refresca la página.
        await this.authService.storageReady;

        if (this.authService.isAuthenticated()) {
            return true;
        }
        return this.router.createUrlTree(['/auth/login']);
    }
}
