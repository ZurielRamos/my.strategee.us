import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonBadge,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    logoWhatsapp,
    addOutline,
    phonePortraitOutline,
    qrCodeOutline,
    trashOutline,
    refreshOutline,
    checkmarkCircleOutline,
    closeCircleOutline,
    ellipseOutline,
    arrowBackOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../../shared/components/page-title/page-title.component';
import { WhatsappService, WhatsappDevice } from '../services/whatsapp.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CreateDeviceModalComponent } from './components/create-device-modal/create-device-modal.component';

@Component({
    selector: 'app-whatsapp-devices',
    templateUrl: './whatsapp-devices.page.html',
    styleUrls: ['./whatsapp-devices.page.scss'],
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
        IonButton,
        IonIcon,
        IonSpinner,
        IonBadge,
        PageHeaderComponent,
        PageTitleComponent
    ]
})
export class WhatsappDevicesPage implements OnInit {
    devices: WhatsappDevice[] = [];
    isLoading = false;

    // QR
    qrDeviceId: string | null = null;
    qrCode: string | null = null;
    qrLoading = false;

    constructor(
        private whatsappService: WhatsappService,
        private toastService: ToastService,
        private modalController: ModalController,
        private router: Router
    ) {
        addIcons({
            logoWhatsapp,
            addOutline,
            phonePortraitOutline,
            qrCodeOutline,
            trashOutline,
            refreshOutline,
            checkmarkCircleOutline,
            closeCircleOutline,
            ellipseOutline,
            arrowBackOutline
        });
    }

    ngOnInit() {
        this.loadDevices();
    }

    loadDevices() {
        this.isLoading = true;
        this.whatsappService.getDevices().subscribe({
            next: (devices) => {
                this.devices = devices;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading devices:', error);
                this.toastService.error('Error al cargar los dispositivos');
                this.isLoading = false;
            }
        });
    }

    async openCreateModal() {
        const modal = await this.modalController.create({
            component: CreateDeviceModalComponent,
            cssClass: 'create-device-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data } = await modal.onWillDismiss();
        if (data?.created) {
            this.loadDevices();
        }
    }

    refreshStatus(device: WhatsappDevice) {
        this.whatsappService.getDeviceStatus(device.id).subscribe({
            next: (result) => {
                device.status = result.status;
                if (result.phoneNumber) {
                    device.phoneNumber = result.phoneNumber;
                }
            },
            error: (error) => {
                console.error('Error getting status:', error);
                this.toastService.error('Error al consultar el estado');
            }
        });
    }

    generateQr(device: WhatsappDevice) {
        this.qrDeviceId = device.id;
        this.qrCode = null;
        this.qrLoading = true;

        this.whatsappService.getDeviceQr(device.id).subscribe({
            next: (result) => {
                this.qrCode = result.qrcode;
                this.qrLoading = false;
            },
            error: (error) => {
                console.error('Error getting QR:', error);
                const message = error?.error?.message || 'Error al generar el QR';
                this.toastService.error(message);
                this.qrLoading = false;
                this.qrDeviceId = null;
            }
        });
    }

    closeQr() {
        this.qrDeviceId = null;
        this.qrCode = null;
    }

    deleteDevice(device: WhatsappDevice) {
        if (!confirm(`¿Está seguro de eliminar el dispositivo "${device.name}"?`)) {
            return;
        }

        this.whatsappService.deleteDevice(device.id).subscribe({
            next: () => {
                this.toastService.success('Dispositivo eliminado');
                this.loadDevices();
            },
            error: (error) => {
                console.error('Error deleting device:', error);
                this.toastService.error('Error al eliminar el dispositivo');
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'connected': return 'success';
            case 'connecting': return 'warning';
            default: return 'danger';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'connected': return 'Conectado';
            case 'connecting': return 'Conectando';
            default: return 'Desconectado';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'connected': return 'checkmark-circle-outline';
            case 'connecting': return 'ellipse-outline';
            default: return 'close-circle-outline';
        }
    }

    goBack() {
        this.router.navigate(['/admin/settings']);
    }
}
