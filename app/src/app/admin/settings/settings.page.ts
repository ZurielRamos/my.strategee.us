import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonButton,
    IonIcon,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    businessOutline,
    notificationsOutline,
    documentTextOutline,
    shieldCheckmarkOutline,
    timeOutline,
    warningOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { AdminSettingsService } from './services/admin-settings.service';
import { ToastService } from '../../shared/services/toast.service';
import { RequestSettingsConfirmationModalComponent } from './components/request-settings-confirmation-modal/request-settings-confirmation-modal.component';
import { AuditHistoryModalComponent } from '../../shared/components/audit-history-modal/audit-history-modal.component';

@Component({
    selector: 'app-admin-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonLabel,
        IonInput,
        IonToggle,
        IonButton,
        IonIcon,
        PageHeaderComponent,
        PageTitleComponent
    ]
})
export class AdminSettingsPage implements OnInit {
    // Company Settings
    companyName = '';
    companyEmail = '';
    companyWebsite = '';

    // System Settings
    autoApproveVacations = false;
    requireManagerApproval = true;
    enableEmailNotifications = true;
    enablePushNotifications = false;

    // Request Settings
    vacationDaysLaborContract = 15;
    vacationDaysServiceContract = 0;
    hoursPerWorkday = 8;

    // Security Settings
    sessionTimeout = 30;
    requirePasswordChange = false;
    passwordExpirationDays = 90;

    loading = false;
    systemSettingsId: number | null = null;

    constructor(
        private adminSettingsService: AdminSettingsService,
        private toastService: ToastService,
        private modalController: ModalController
    ) {
        addIcons({
            businessOutline,
            notificationsOutline,
            documentTextOutline,
            shieldCheckmarkOutline,
            timeOutline,
            warningOutline
        });
    }

    ngOnInit() {
        this.loadSettings();
    }

    async loadSettings() {
        try {
            this.adminSettingsService.getSettings().subscribe({
                next: (settings) => {
                    if (settings) {
                        this.systemSettingsId = parseInt(settings.id);
                        this.vacationDaysLaborContract = settings.vacationDaysLaborContract;
                        this.vacationDaysServiceContract = settings.vacationDaysServiceContract;
                        this.hoursPerWorkday = settings.hoursPerWorkday;
                    }
                },
                error: (error) => {
                    console.error('Error loading settings:', error);
                    this.toastService.show('Error al cargar la configuración');
                }
            });
        } catch (error) {
            console.error('Error loading settings:', error);
            this.toastService.show('Error al cargar la configuración');
        }
    }

    saveCompanySettings() {
        console.log('Saving company settings');
        this.toastService.show('Configuración de la empresa guardada');
    }

    saveSystemSettings() {
        console.log('Saving system settings');
        this.toastService.show('Configuración del sistema guardada');
    }

    async saveRequestSettings() {
        this.loading = true;
        try {
            this.adminSettingsService.updateSettings({
                vacationDaysLaborContract: this.vacationDaysLaborContract,
                vacationDaysServiceContract: this.vacationDaysServiceContract,
                hoursPerWorkday: this.hoursPerWorkday
            }).subscribe({
                next: () => {
                    this.toastService.show('Configuración de solicitudes guardada');
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error saving request settings:', error);
                    this.toastService.show('Error al guardar la configuración');
                    this.loading = false;
                }
            });
        } catch (error) {
            console.error('Error saving request settings:', error);
            this.toastService.show('Error al guardar la configuración');
            this.loading = false;
        }
    }

    saveSecuritySettings() {
        console.log('Saving security settings');
        this.toastService.show('Configuración de seguridad guardada');
    }

    async openRequestSettingsConfirmation() {
        const modal = await this.modalController.create({
            component: RequestSettingsConfirmationModalComponent,
            cssClass: 'confirmation-modal',
            backdropDismiss: false
        });

        await modal.present();

        const { data } = await modal.onWillDismiss();

        if (data?.confirmed) {
            this.saveRequestSettings();
        }
    }

    async openAuditHistory() {
        if (!this.systemSettingsId) {
            this.toastService.show('No se puede cargar el historial en este momento');
            return;
        }

        const modal = await this.modalController.create({
            component: AuditHistoryModalComponent,
            cssClass: 'audit-history-modal',
            componentProps: {
                entityName: 'system_settings',
                entityId: this.systemSettingsId,
                title: 'Historial de Cambios - Configuración de Solicitudes'
            }
        });

        await modal.present();
    }
}
