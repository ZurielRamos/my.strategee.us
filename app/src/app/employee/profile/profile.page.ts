import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonFabButton,
    IonButton,
    AlertController,
    LoadingController,
    ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    mailOutline,
    callOutline,
    locationOutline,
    briefcaseOutline,
    cashOutline,
    giftOutline,
    personOutline,
    documentTextOutline,
    chevronUpOutline,
    chevronDownOutline,
    cameraOutline,
    addOutline,
    trashOutline,
    alertCircleOutline,
    createOutline,
    timeOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthService } from '../../auth/services/auth.service';
import { EmployeesService, ContactInfoLog } from '../../admin/employees/services/employees.service';
import { MediaService } from '../../admin/media/services/media.service';
import { EmergencyContactsService } from '../../shared/services/emergency-contacts.service';
import { EmergencyContact } from '../../shared/models/emergency-contact.model';
import { EditContactInfoModalComponent } from './components/edit-contact-info-modal/edit-contact-info-modal.component';
import { AddEmergencyContactModalComponent } from './components/add-emergency-contact-modal/add-emergency-contact-modal.component';
import { Attachment } from '../../admin/media/models/attachment.model';
import { formatCurrency } from '../../shared/helpers/currency.helper';
import { getGenderLabel } from '../../admin/employees/helpers/gender.helper';
import { getBenefitTypeLabel } from '../../admin/employees/models/benefit-allocation.model';
import { getCompensationFrequencyLabel } from '../../admin/employees/models/compensation.model';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonIcon,
        IonSpinner,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonBadge,
        IonFabButton,
        IonButton,
        PageHeaderComponent
    ]
})
export class ProfilePage implements OnInit {
    currentUser: any = null;
    isLoading = false;
    showMemorandumsHistory = false;

    emergencyContacts: EmergencyContact[] = [];
    isLoadingContacts = false;

    contactInfoLogs: ContactInfoLog[] = [];
    isLoadingLogs = false;
    showContactLogs = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private employeesService: EmployeesService,
        private mediaService: MediaService,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private emergencyContactsService: EmergencyContactsService,
        private modalCtrl: ModalController,
    ) {
        addIcons({
            mailOutline,
            callOutline,
            locationOutline,
            briefcaseOutline,
            cashOutline,
            giftOutline,
            personOutline,
            documentTextOutline,
            chevronUpOutline,
            chevronDownOutline,
            cameraOutline,
            addOutline,
            trashOutline,
            alertCircleOutline,
            createOutline,
            timeOutline,
        });
    }

    ngOnInit() {
        this.loadProfile();
        this.loadEmergencyContacts();
    }

    loadProfile() {
        this.isLoading = true;
        this.authService.currentUser$.subscribe({
            next: (user: any) => {
                this.currentUser = user;
                this.isLoading = false;
            },
            error: (error: any) => {
                console.error('Error loading profile:', error);
                this.isLoading = false;
            }
        });
    }

    get employee(): any {
        return this.currentUser?.profile?.employee || null;
    }

    get fullName(): string {
        return this.employee ? `${this.employee.firstName} ${this.employee.lastName}` : '';
    }

    get age(): number {
        if (!this.employee?.birthDate) return 0;
        
        const today = new Date();
        const birthDateStr = String(this.employee.birthDate);
        const datePart = birthDateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const birthDate = new Date(year, month - 1, day);
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    get activeContract(): any {
        return this.currentUser?.profile?.currentContract || null;
    }

    get hasActiveContract(): boolean {
        return !!this.activeContract;
    }

    get profilePhotoUrl(): string {
        return this.employee?.profilePhoto?.url || '';
    }

    get hasProfilePhoto(): boolean {
        return !!this.employee?.profilePhoto;
    }

    formatDate(date: string | Date): string {
        if (!date) return '-';
        
        const dateStr = String(date);
        const datePart = dateStr.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        
        return localDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getGenderLabel(gender: string | null | undefined): string {
        return getGenderLabel(gender);
    }

    getBenefitTypeLabel(type: string): string {
        return getBenefitTypeLabel(type as any);
    }

    getCompensationFrequencyLabel(frequency: string): string {
        return getCompensationFrequencyLabel(frequency as any);
    }

    formatCurrency(amount: number | string | null | undefined): string {
        return formatCurrency(amount);
    }

    toggleMemorandumsHistory() {
        this.showMemorandumsHistory = !this.showMemorandumsHistory;
    }

    getSortedMemorandums(memorandums: any[]): any[] {
        if (!memorandums) return [];
        return [...memorandums].sort((a, b) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
    }

    isCurrentMemorandum(memo: any): boolean {
        return this.activeContract?.currentMemorandum?.id === memo.id;
    }

    getMemorandumStatusLabel(memo: any): string {
        const now = new Date();
        const startDate = new Date(memo.startDate);
        const endDate = memo.endDate ? new Date(memo.endDate) : null;

        if (startDate > now) {
            return 'Pendiente';
        } else if (!endDate || endDate > now) {
            return 'Activo';
        } else {
            return 'Finalizado';
        }
    }

    getMemorandumStatusColor(memo: any): string {
        const label = this.getMemorandumStatusLabel(memo);
        switch (label) {
            case 'Activo':
                return 'success';
            case 'Pendiente':
                return 'warning';
            case 'Finalizado':
                return 'medium';
            default:
                return 'medium';
        }
    }

    async openPhotoSelector() {
        // Crear input de archivo dinámicamente
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/jpg';
        
        input.onchange = async (event: any) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validar tipo de archivo
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                const alert = await this.alertCtrl.create({
                    header: 'Archivo no válido',
                    message: 'Solo se permiten imágenes (JPG, PNG)',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await alert.present();
                return;
            }

            // Validar tamaño (máximo 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                const alert = await this.alertCtrl.create({
                    header: 'Archivo muy grande',
                    message: 'La imagen no debe superar los 5MB',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await alert.present();
                return;
            }

            // Mostrar loading
            const loading = await this.loadingCtrl.create({
                message: 'Subiendo foto de perfil...',
                spinner: 'crescent'
            });
            await loading.present();

            // Subir archivo
            this.mediaService.upload(file, { folder: 'employees', title: 'Foto de Perfil' }).subscribe({
                next: async (attachment: Attachment) => {
                    // Actualizar la foto de perfil del empleado
                    this.updateProfilePhoto(attachment.id);
                },
                error: async (error: any) => {
                    await loading.dismiss();
                    console.error('Error uploading photo:', error);
                    
                    const errorAlert = await this.alertCtrl.create({
                        header: 'Error',
                        message: 'No se pudo subir la foto. Por favor intenta nuevamente.',
                        cssClass: 'custom-alert',
                        buttons: ['Aceptar']
                    });
                    await errorAlert.present();
                }
            });
        };

        input.click();
    }

    // ── Contact Info Edit ─────────────────────────────────────────────────────

    async openEditContactInfoAlert() {
        const modal = await this.modalCtrl.create({
            component: EditContactInfoModalComponent,
            componentProps: {
                currentAddress: this.employee?.address || '',
                currentPhone: this.employee?.personalPhone || '',
                currentPersonalEmail: this.employee?.personalEmail || '',
            },
        });
        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadProfile();
            this.loadContactInfoLogs();
        }
    }

    saveContactInfo(data: { address?: string; phone?: string; personalEmail?: string }) {
        this.employeesService.updateMyContactInfo(data).subscribe({
            next: () => {
                this.authService.refreshUserProfile().subscribe({
                    next: () => this.loadProfile(),
                    error: () => this.loadProfile(),
                });
                this.loadContactInfoLogs();
            },
            error: async (err) => {
                console.error('Error updating contact info:', err);
                const alert = await this.alertCtrl.create({
                    header: 'Error',
                    message: err?.error?.message || 'No se pudo actualizar la información.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar'],
                });
                await alert.present();
            },
        });
    }

    loadContactInfoLogs() {
        this.isLoadingLogs = true;
        this.employeesService.getMyContactInfoLogs().subscribe({
            next: (logs) => {
                this.contactInfoLogs = logs;
                this.isLoadingLogs = false;
            },
            error: (err) => {
                console.error('Error loading contact info logs:', err);
                this.isLoadingLogs = false;
            },
        });
    }

    toggleContactLogs() {
        this.showContactLogs = !this.showContactLogs;
        if (this.showContactLogs && this.contactInfoLogs.length === 0) {
            this.loadContactInfoLogs();
        }
    }

    formatLogDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('es-CO', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    // ── Emergency Contacts ────────────────────────────────────────────────────

    loadEmergencyContacts() {
        this.isLoadingContacts = true;
        this.emergencyContactsService.getMyContacts().subscribe({
            next: (contacts) => {
                this.emergencyContacts = contacts;
                this.isLoadingContacts = false;
            },
            error: (err) => {
                console.error('Error loading emergency contacts:', err);
                this.isLoadingContacts = false;
            }
        });
    }

    async openAddContactAlert() {
        const modal = await this.modalCtrl.create({
            component: AddEmergencyContactModalComponent,
        });
        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data?.contact) {
            this.emergencyContacts = [...this.emergencyContacts, data.contact];
        }
    }

    saveContact(dto: { name: string; relationship: string; phone: string; email?: string }) {
        this.emergencyContactsService.createMyContact(dto).subscribe({
            next: (contact) => {
                this.emergencyContacts = [...this.emergencyContacts, contact];
            },
            error: (err) => console.error('Error saving contact:', err),
        });
    }

    async confirmDeleteContact(contact: EmergencyContact) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar contacto',
            message: `¿Deseas eliminar a <strong>${contact.name}</strong> de tus contactos de emergencia?`,
            cssClass: 'custom-alert',
            buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    handler: () => this.deleteContact(contact.id),
                },
            ],
        });
        await alert.present();
    }

    deleteContact(id: number) {
        this.emergencyContactsService.removeMyContact(id).subscribe({
            next: () => {
                this.emergencyContacts = this.emergencyContacts.filter(c => c.id !== id);
            },
            error: (err) => console.error('Error deleting contact:', err),
        });
    }

    // ── Profile Photo ─────────────────────────────────────────────────────────

    async updateProfilePhoto(attachmentId: string) {
        if (!this.employee?.id) return;

        const loading = await this.loadingCtrl.getTop();

        this.employeesService.updateProfilePhoto(this.employee.id, attachmentId).subscribe({
            next: async () => {
                // Refrescar el perfil del usuario en sesión
                this.authService.refreshUserProfile().subscribe({
                    next: async () => {
                        if (loading) await loading.dismiss();
                        
                        // Recargar el perfil para mostrar la nueva foto
                        this.loadProfile();

                        const successAlert = await this.alertCtrl.create({
                            header: 'Foto actualizada',
                            message: 'Tu foto de perfil se ha actualizado exitosamente.',
                            cssClass: 'custom-alert',
                            buttons: ['Aceptar']
                        });
                        await successAlert.present();
                    },
                    error: async (error: any) => {
                        if (loading) await loading.dismiss();
                        console.error('Error refreshing user profile:', error);
                        
                        // Aunque falle el refresh, la foto se actualizó en el servidor
                        this.loadProfile();
                        
                        const successAlert = await this.alertCtrl.create({
                            header: 'Foto actualizada',
                            message: 'Tu foto de perfil se ha actualizado exitosamente.',
                            cssClass: 'custom-alert',
                            buttons: ['Aceptar']
                        });
                        await successAlert.present();
                    }
                });
            },
            error: async (error: any) => {
                if (loading) await loading.dismiss();
                console.error('Error updating profile photo:', error);
                
                const errorAlert = await this.alertCtrl.create({
                    header: 'Error',
                    message: 'No se pudo actualizar la foto de perfil. Por favor intenta nuevamente.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await errorAlert.present();
            }
        });
    }
}
