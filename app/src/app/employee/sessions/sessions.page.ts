import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonButton,
    IonBadge,
    LoadingController,
    AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    phonePortraitOutline,
    desktopOutline,
    tabletPortraitOutline,
    trashOutline,
    timeOutline,
    locationOutline,
    checkmarkCircle
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SessionsService, Session } from './services/sessions.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
    selector: 'app-sessions',
    templateUrl: './sessions.page.html',
    styleUrls: ['./sessions.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonButton,
        IonBadge,
        PageHeaderComponent
    ]
})
export class SessionsPage implements OnInit {
    sessions: Session[] = [];
    isLoading = false;

    constructor(
        private sessionsService: SessionsService,
        private toastService: ToastService,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController
    ) {
        addIcons({
            phonePortraitOutline,
            desktopOutline,
            tabletPortraitOutline,
            trashOutline,
            timeOutline,
            locationOutline,
            checkmarkCircle
        });
    }

    ngOnInit() {
        this.loadSessions();
    }

    async loadSessions() {
        this.isLoading = true;
        try {
            this.sessions = await this.sessionsService.getSessions().toPromise() || [];
        } catch (error) {
            await this.toastService.show('Error al cargar las sesiones');
        } finally {
            this.isLoading = false;
        }
    }

    getDeviceIcon(deviceType: string): string {
        switch (deviceType) {
            case 'mobile':
                return 'phone-portrait-outline';
            case 'tablet':
                return 'tablet-portrait-outline';
            case 'desktop':
            default:
                return 'desktop-outline';
        }
    }

    getTimeAgo(date: Date): string {
        const now = new Date();
        const sessionDate = new Date(date);
        const diffMs = now.getTime() - sessionDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        
        return sessionDate.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    async revokeSession(session: Session) {
        if (session.isCurrent) {
            await this.toastService.show('No puedes cerrar tu sesión actual');
            return;
        }

        const alert = await this.alertCtrl.create({
            header: 'Cerrar Sesión',
            message: `¿Estás seguro de que deseas cerrar la sesión en ${session.deviceName}?`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Cerrar Sesión',
                    role: 'destructive',
                    handler: async () => {
                        const loading = await this.loadingCtrl.create({
                            message: 'Cerrando sesión...'
                        });
                        await loading.present();

                        try {
                            await this.sessionsService.revokeSession(session.id).toPromise();
                            await this.toastService.show('Sesión cerrada exitosamente');
                            await this.loadSessions();
                        } catch (error) {
                            await this.toastService.show('Error al cerrar la sesión');
                        } finally {
                            await loading.dismiss();
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

    async revokeAllOtherSessions() {
        const otherSessionsCount = this.sessions.filter(s => !s.isCurrent).length;
        
        if (otherSessionsCount === 0) {
            await this.toastService.show('No hay otras sesiones activas');
            return;
        }

        const alert = await this.alertCtrl.create({
            header: 'Cerrar Todas las Sesiones',
            message: `¿Estás seguro de que deseas cerrar todas las demás sesiones (${otherSessionsCount})? Esta acción no se puede deshacer.`,
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel'
                },
                {
                    text: 'Cerrar Todas',
                    role: 'destructive',
                    handler: async () => {
                        const loading = await this.loadingCtrl.create({
                            message: 'Cerrando sesiones...'
                        });
                        await loading.present();

                        try {
                            const result = await this.sessionsService.revokeOtherSessions().toPromise();
                            await this.toastService.show(`${result?.revoked || 0} sesiones cerradas exitosamente`);
                            await this.loadSessions();
                        } catch (error) {
                            await this.toastService.show('Error al cerrar las sesiones');
                        } finally {
                            await loading.dismiss();
                        }
                    }
                }
            ]
        });

        await alert.present();
    }
}
