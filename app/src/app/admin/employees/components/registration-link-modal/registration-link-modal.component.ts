import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonButton, IonIcon, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { copyOutline, refreshOutline, banOutline } from 'ionicons/icons';
import { environment } from 'src/environments/environment';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-registration-link-modal',
    templateUrl: './registration-link-modal.component.html',
    styleUrls: ['./registration-link-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [CommonModule, IonButton, IonIcon, IonSpinner, BaseModalComponent],
})
export class RegistrationLinkModalComponent implements OnInit {
    private readonly apiUrl = `${environment.apiUrl}/employee-registration-link`;

    token: string | null = null;
    isLoading = true;
    isWorking = false;

    constructor(
        private http: HttpClient,
        private modalCtrl: ModalController,
        private toastService: ToastService,
    ) {
        addIcons({ copyOutline, refreshOutline, banOutline });
    }

    ngOnInit() {
        this.http.get<{ token: string | null }>(this.apiUrl).subscribe({
            next: (res) => {
                this.token = res.token;
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.toastService.error('No se pudo cargar el enlace de registro');
            },
        });
    }

    get link(): string {
        return this.token ? `${window.location.origin}/registro/${this.token}` : '';
    }

    async copy() {
        try {
            await navigator.clipboard.writeText(this.link);
            await this.toastService.success('Enlace copiado');
        } catch {
            await this.toastService.error('No se pudo copiar. Selecciona el enlace y cópialo manualmente.');
        }
    }

    generate() {
        this.isWorking = true;
        this.http.post<{ token: string }>(this.apiUrl, {}).subscribe({
            next: (res) => {
                this.token = res.token;
                this.isWorking = false;
                this.toastService.success('Enlace generado. El anterior dejó de funcionar.');
            },
            error: () => {
                this.isWorking = false;
                this.toastService.error('No se pudo generar el enlace');
            },
        });
    }

    disable() {
        this.isWorking = true;
        this.http.delete<void>(this.apiUrl).subscribe({
            next: () => {
                this.token = null;
                this.isWorking = false;
                this.toastService.success('Enlace desactivado');
            },
            error: () => {
                this.isWorking = false;
                this.toastService.error('No se pudo desactivar el enlace');
            },
        });
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}
