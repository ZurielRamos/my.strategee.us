import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, take, timeout, catchError } from 'rxjs/operators';
import { of, timer, race } from 'rxjs';

@Component({
    selector: 'app-splash',
    templateUrl: './splash.page.html',
    styleUrls: ['./splash.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class SplashPage implements OnInit {
    constructor(private router: Router, private authService: AuthService) { }

    ngOnInit() {

        // Esperamos que el storage esté cargado (el BehaviorSubject emite null inicialmente,
        // luego emite el usuario si existe). Usamos un race entre el timer mínimo de splash
        // y la carga del storage para no bloquear más tiempo del necesario.
        Promise.all([
            this.waitForStorageReady(),
            new Promise(resolve => setTimeout(resolve, 4000)) // duración mínima del splash
        ]).then(() => {
            this.navigate();
        });
    }

    private waitForStorageReady(): Promise<void> {
        // Esperamos a que el servicio haya intentado cargar el usuario del storage.
        // Como loadUserFromStorage() corre en el constructor, lo esperamos con un timeout seguro.
        return new Promise(resolve => setTimeout(resolve, 300));
    }

    private navigate() {
        if (this.authService.isAuthenticated()) {
            const user = this.authService.getCurrentUser();
            const roles = user?.roles || [];

            if (roles.includes('ADMIN')) {
                this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
            } else if (roles.includes('EMPLOYEE')) {
                this.router.navigate(['/employee/dashboard'], { replaceUrl: true });
            } else {
                this.router.navigate(['/auth/login'], { replaceUrl: true });
            }
        } else {
            this.router.navigate(['/auth/login'], { replaceUrl: true });
        }
    }
}
