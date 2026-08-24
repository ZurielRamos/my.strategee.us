import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
    IonSelect,
    IonSelectOption,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    notificationsOutline,
    documentTextOutline,
    shieldCheckmarkOutline,
    timeOutline,
    warningOutline,
    logoWhatsapp,
    phonePortraitOutline,
    keyOutline,
    addCircleOutline,
    addOutline,
    eyeOutline,
    eyeOffOutline,
    copyOutline,
    trashOutline,
    restaurantOutline,
    sunnyOutline,
    moonOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { AdminSettingsService } from './services/admin-settings.service';
import { WhatsappService, WhatsappDevice } from './services/whatsapp.service';
import { ToastService } from '../../shared/services/toast.service';
import { RequestSettingsConfirmationModalComponent } from './components/request-settings-confirmation-modal/request-settings-confirmation-modal.component';
import { AuditHistoryModalComponent } from '../../shared/components/audit-history-modal/audit-history-modal.component';
import { ApiKeyService } from './services/api-key.service';
import { BahamasService } from './services/bahamas.service';
import { CreateApiKeyModalComponent } from './components/create-api-key-modal/create-api-key-modal.component';
import { ApiKeyCreatedModalComponent } from './components/api-key-created-modal/api-key-created-modal.component';
import { RevokeApiKeyModalComponent } from './components/revoke-api-key-modal/revoke-api-key-modal.component';

export interface ApiKey {
    id: number;
    name: string;
    maskedKey: string;
    fullKey?: string;
    visible: boolean;
    createdAt: Date;
    lastUsedAt?: Date;
}

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
        IonSelect,
        IonSelectOption,
        PageHeaderComponent,
        PageTitleComponent
    ]
})
export class AdminSettingsPage implements OnInit {
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

    // WhatsApp Settings
    whatsappApiUrl = '';
    whatsappApiKey = '';
    whatsappNotificationDeviceId = '';
    whatsappLoading = false;
    whatsappDevices: WhatsappDevice[] = [];

    // Bahamas Settings
    bahamasDeviceId = '';
    bahamasMorningStart = '';
    bahamasMorningEnd = '';
    bahamasMorningDelivery = '';
    bahamasAfternoonStart = '';
    bahamasAfternoonEnd = '';
    bahamasAfternoonDelivery = '';
    bahamasSaturdayStart = '';
    bahamasSaturdayEnd = '';
    bahamasSaturdayDelivery = '';
    bahamasLoading = false;

    // API Keys
    apiKeys: ApiKey[] = [];
    apiKeysLoading = false;
    private apiKeyService: ApiKeyService;
    private bahamasService: BahamasService;

    loading = false;
    systemSettingsId: number | null = null;

    constructor(
        private adminSettingsService: AdminSettingsService,
        private whatsappService: WhatsappService,
        private toastService: ToastService,
        private modalController: ModalController,
        private router: Router
    ) {
        this.apiKeyService = inject(ApiKeyService);
        this.bahamasService = inject(BahamasService);
        addIcons({
            notificationsOutline,
            documentTextOutline,
            shieldCheckmarkOutline,
            timeOutline,
            warningOutline,
            logoWhatsapp,
            phonePortraitOutline,
            keyOutline,
            addCircleOutline,
            addOutline,
            eyeOutline,
            eyeOffOutline,
            copyOutline,
            trashOutline,
            restaurantOutline,
            sunnyOutline,
            moonOutline
        });
    }

    ngOnInit() {
        this.loadSettings();
        this.loadWhatsappConfig();
        this.loadWhatsappDevices();
        this.loadBahamasConfig();
        this.loadApiKeys();
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

    // ===================== WhatsApp =====================

    loadWhatsappConfig() {
        this.whatsappService.getConfig().subscribe({
            next: (config) => {
                if (config) {
                    this.whatsappApiUrl = config.apiUrl;
                    this.whatsappApiKey = config.apiKey;
                    this.whatsappNotificationDeviceId = config.notificationDeviceId || '';
                }
            },
            error: (error) => {
                console.error('Error loading WhatsApp config:', error);
            }
        });
    }

    saveWhatsappConfig() {
        if (!this.whatsappApiUrl || !this.whatsappApiKey) {
            this.toastService.show({ message: 'Complete todos los campos de WhatsApp', type: 'warning' });
            return;
        }

        this.whatsappLoading = true;
        this.whatsappService.updateConfig({
            apiUrl: this.whatsappApiUrl,
            apiKey: this.whatsappApiKey,
            notificationDeviceId: this.whatsappNotificationDeviceId || undefined
        }).subscribe({
            next: () => {
                this.toastService.show({ message: 'Configuración de WhatsApp guardada', type: 'success' });
                this.whatsappLoading = false;
            },
            error: (error) => {
                console.error('Error saving WhatsApp config:', error);
                this.toastService.show({ message: 'Error al guardar la configuración de WhatsApp', type: 'error' });
                this.whatsappLoading = false;
            }
        });
    }

    goToWhatsappDevices() {
        this.router.navigate(['/admin/settings/whatsapp-devices']);
    }

    loadWhatsappDevices() {
        this.whatsappService.getDevices().subscribe({
            next: (devices) => {
                this.whatsappDevices = devices;
            },
            error: (error) => {
                console.error('Error loading WhatsApp devices:', error);
            }
        });
    }

    // ===================== Bahamas =====================

    loadBahamasConfig() {
        this.bahamasService.getConfig().subscribe({
            next: (config) => {
                if (config) {
                    this.bahamasDeviceId = config.whatsappDeviceId || '';
                    this.bahamasMorningStart = config.morningStart || '';
                    this.bahamasMorningEnd = config.morningEnd || '';
                    this.bahamasMorningDelivery = config.morningDelivery || '';
                    this.bahamasAfternoonStart = config.afternoonStart || '';
                    this.bahamasAfternoonEnd = config.afternoonEnd || '';
                    this.bahamasAfternoonDelivery = config.afternoonDelivery || '';
                    this.bahamasSaturdayStart = config.saturdayStart || '';
                    this.bahamasSaturdayEnd = config.saturdayEnd || '';
                    this.bahamasSaturdayDelivery = config.saturdayDelivery || '';
                }
            },
            error: (error) => {
                console.error('Error loading Bahamas config:', error);
            }
        });
    }

    saveBahamasConfig() {
        if (!this.bahamasDeviceId) {
            this.toastService.show({ message: 'Seleccione un dispositivo de WhatsApp', type: 'warning' });
            return;
        }

        // Normalizar horas a formato HH:mm (sin segundos)
        const normalizeTime = (time: string) => time ? time.substring(0, 5) : '';

        this.bahamasLoading = true;
        this.bahamasService.updateConfig({
            whatsappDeviceId: this.bahamasDeviceId,
            morningStart: normalizeTime(this.bahamasMorningStart),
            morningEnd: normalizeTime(this.bahamasMorningEnd),
            morningDelivery: normalizeTime(this.bahamasMorningDelivery),
            afternoonStart: normalizeTime(this.bahamasAfternoonStart),
            afternoonEnd: normalizeTime(this.bahamasAfternoonEnd),
            afternoonDelivery: normalizeTime(this.bahamasAfternoonDelivery),
            saturdayStart: normalizeTime(this.bahamasSaturdayStart),
            saturdayEnd: normalizeTime(this.bahamasSaturdayEnd),
            saturdayDelivery: normalizeTime(this.bahamasSaturdayDelivery),
        }).subscribe({
            next: () => {
                this.toastService.show({ message: 'Configuración de Bahamas guardada', type: 'success' });
                this.bahamasLoading = false;
            },
            error: (error) => {
                console.error('Error saving Bahamas config:', error);
                this.toastService.show({ message: 'Error al guardar la configuración de Bahamas', type: 'error' });
                this.bahamasLoading = false;
            }
        });
    }

    // ===================== API Keys =====================

    loadApiKeys() {
        this.apiKeysLoading = true;
        this.apiKeyService.getApiKeys().subscribe({
            next: (keys) => {
                this.apiKeys = keys.map((k: any) => ({
                    ...k,
                    visible: false,
                    maskedKey: k.maskedKey || this.maskKey(k.key || '')
                }));
                this.apiKeysLoading = false;
            },
            error: (error) => {
                console.error('Error loading API keys:', error);
                this.apiKeysLoading = false;
            }
        });
    }

    createApiKey() {
        this.openCreateApiKeyModal();
    }

    async openCreateApiKeyModal() {
        const modal = await this.modalController.create({
            component: CreateApiKeyModalComponent,
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();

        if (role === 'save' && data) {
            // Show the generated key in a separate modal
            await this.showCreatedKeyModal(data.key, data.name);

            // Add to list
            this.apiKeys.unshift({
                id: data.id,
                name: data.name,
                maskedKey: this.maskKey(data.key),
                fullKey: data.key,
                visible: false,
                createdAt: new Date(data.createdAt),
            });
        }
    }

    private async showCreatedKeyModal(key: string, name: string) {
        const modal = await this.modalController.create({
            component: ApiKeyCreatedModalComponent,
            componentProps: { apiKey: key, keyName: name },
            backdropDismiss: false,
        });

        await modal.present();
        await modal.onWillDismiss();
    }

    toggleKeyVisibility(key: ApiKey) {
        key.visible = !key.visible;
    }

    copyApiKey(key: ApiKey) {
        const textToCopy = key.fullKey || key.maskedKey;
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.toastService.show({ message: 'API Key copiada al portapapeles', type: 'success' });
        }).catch(() => {
            this.toastService.show({ message: 'No se pudo copiar la API Key', type: 'error' });
        });
    }

    revokeApiKey(key: ApiKey) {
        this.openRevokeApiKeyModal(key);
    }

    async openRevokeApiKeyModal(key: ApiKey) {
        const modal = await this.modalController.create({
            component: RevokeApiKeyModalComponent,
            componentProps: { keyName: key.name },
        });

        await modal.present();

        const { data } = await modal.onWillDismiss();

        if (data?.confirmed) {
            this.apiKeyService.revokeApiKey(key.id).subscribe({
                next: () => {
                    this.apiKeys = this.apiKeys.filter(k => k.id !== key.id);
                    this.toastService.show({ message: 'API Key revocada exitosamente', type: 'success' });
                },
                error: (error) => {
                    console.error('Error revoking API key:', error);
                    this.toastService.show({ message: 'Error al revocar la API Key', type: 'error' });
                }
            });
        }
    }

    private maskKey(key: string): string {
        if (!key || key.length < 8) return '••••••••';
        return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
    }
}
