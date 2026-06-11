import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

/**
 * Página de callback para OAuth2 de Google Calendar.
 * Esta página se abre en una nueva ventana y envía el código de autorización
 * de vuelta a la ventana principal mediante postMessage.
 */
@Component({
    selector: 'app-calendar-callback',
    template: `
        <ion-content class="ion-padding ion-text-center">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <p *ngIf="!error">Conectando tu calendario... Puedes cerrar esta ventana.</p>
                <p *ngIf="error" style="color: var(--ion-color-danger)">{{ error }}</p>
            </div>
        </ion-content>
    `,
    standalone: true,
    imports: [CommonModule, IonContent]
})
export class CalendarCallbackPage implements OnInit {
    error: string | null = null;

    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        const code = this.route.snapshot.queryParamMap.get('code');
        const state = this.route.snapshot.queryParamMap.get('state');
        const errorParam = this.route.snapshot.queryParamMap.get('error');

        if (errorParam) {
            this.error = 'Se canceló la autorización.';
            return;
        }

        if (code && state) {
            // Enviar el código a la ventana padre
            if (window.opener) {
                window.opener.postMessage({
                    type: 'google-calendar-callback',
                    code,
                    state
                }, '*');
                // Cerrar esta ventana después de un breve delay
                setTimeout(() => window.close(), 1500);
            } else {
                this.error = 'No se pudo comunicar con la ventana principal. Cierra esta ventana e intenta de nuevo.';
            }
        } else {
            this.error = 'No se recibió el código de autorización.';
        }
    }
}
