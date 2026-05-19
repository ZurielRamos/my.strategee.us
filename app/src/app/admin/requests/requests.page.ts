import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent, IonButton, IonIcon, IonCard,
    IonSpinner, IonBadge, IonSelect, IonSelectOption, IonItem,
    IonInfiniteScroll, IonInfiniteScrollContent,
    ModalController, AlertController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    filterOutline, swapVerticalOutline, closeCircleOutline,
    calendarOutline, timeOutline, personOutline, checkmarkCircleOutline,
    closeCircle, arrowForward, documentTextOutline, chatboxOutline,
    documentAttachOutline, eyeOutline, walletOutline, informationCircleOutline,
    airplane, documentText, gift, cafe, time, medical, fitness, calendar
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { AdminRequestsService, AdminRequestFilters, AdminRequest } from './services/admin-requests.service';
import { MediaService } from '../media/services/media.service';
import { Attachment } from '../media/models/attachment.model';
import { SystemSettingsService } from '../../shared/services/system-settings.service';

@Component({
    selector: 'app-admin-requests',
    templateUrl: './requests.page.html',
    styleUrls: ['./requests.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent, IonButton, IonIcon, IonCard,
        IonSpinner, IonBadge, IonSelect, IonSelectOption, IonItem,
        IonInfiniteScroll, IonInfiniteScrollContent,
        PageHeaderComponent,
        PageTitleComponent
    ],
    providers: [ModalController, AlertController, LoadingController]
})
export class AdminRequestsPage implements OnInit {
    @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

    requests: AdminRequest[] = [];
    isLoading = true;
    hoursPerDay: number | null = null;

    // Filtros
    selectedType?: string;
    selectedStatus: string | null = 'PENDING';
    sortByDate: 'ASC' | 'DESC' = 'DESC';

    // Paginación
    currentPage = 1;
    totalPages = 1;
    total = 0;
    limit = 20;

    // Tipos y estados disponibles
    requestTypes = [
        { value: 'VACATION', label: 'Vacaciones' },
        { value: 'ORDINARY_PERMISSION', label: 'Permiso Ordinario' },
        { value: 'MEDICAL_APPOINTMENT', label: 'Cita Médica' },
        { value: 'SICK_LEAVE', label: 'Incapacidad' },
        { value: 'DOCUMENT', label: 'Documento' },
        { value: 'BIRTHDAY', label: 'Cumpleaños' },
        { value: 'BENEFIT', label: 'Beneficio' },
        { value: 'COMPENSATED_TIME_ACCUMULATION', label: 'Acumulación Compensados' },
        { value: 'COMPENSATED_TIME_USAGE', label: 'Disfrute Compensados' },
        { value: 'ENERGYZE_DAY_ACCUMULATION', label: 'Acumulación Días Energyze' },
        { value: 'ENERGYZE_DAY_USAGE', label: 'Disfrute Días Energyze' },
        { value: 'GIFTED_DAY_USAGE', label: 'Días Obsequiados por Servicios' },
    ];

    requestStatuses = [
        { value: 'PENDING', label: 'Pendiente' },
        { value: 'APPROVED', label: 'Aprobada' },
        { value: 'REJECTED', label: 'Rechazada' },
        { value: 'CANCELLED', label: 'Cancelada' }
    ];

    constructor(
        private adminRequestsService: AdminRequestsService,
        private mediaService: MediaService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private systemSettingsService: SystemSettingsService
    ) {
        addIcons({
            filterOutline, swapVerticalOutline, closeCircleOutline,
            calendarOutline, timeOutline, personOutline, checkmarkCircleOutline,
            closeCircle, arrowForward, documentTextOutline, chatboxOutline,
            documentAttachOutline, eyeOutline, walletOutline, informationCircleOutline,
            airplane, documentText, gift, cafe, time, medical, fitness, calendar
        });
    }

    ngOnInit() {
        // Cargar horas por día desde configuración
        this.systemSettingsService.getHoursPerWorkday().subscribe({
            next: (hours) => {
                this.hoursPerDay = hours;
            },
            error: (error) => {
                console.error('Error loading hours per day:', error);
            }
        });
        
        this.loadRequests();
    }

    loadRequests(append: boolean = false) {
        if (!append) {
            this.isLoading = true;
        }

        const filters: AdminRequestFilters = {
            page: this.currentPage,
            limit: this.limit,
            sortBy: 'createdAt',
            order: this.sortByDate
        };

        if (this.selectedType) {
            filters.type = this.selectedType;
        }
        if (this.selectedStatus) {
            filters.status = this.selectedStatus;
        }

        this.adminRequestsService.getAllRequests(filters).subscribe({
            next: (response) => {
                if (append) {
                    this.requests = [...this.requests, ...response.data];
                } else {
                    this.requests = response.data;
                }
                
                this.total = response.meta.total;
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading requests:', error);
                this.isLoading = false;
            }
        });
    }

    resetAndLoadRequests() {
        this.currentPage = 1;
        this.requests = [];
        this.loadRequests(false);
    }

    onFilterChange() {
        this.resetAndLoadRequests();
    }

    hasActiveFilters(): boolean {
        return !!(
            this.selectedType || 
            (this.selectedStatus !== null && this.selectedStatus !== 'PENDING') || 
            this.selectedStatus === null ||
            this.sortByDate !== 'DESC'
        );
    }

    clearFilters() {
        this.selectedType = undefined;
        this.selectedStatus = 'PENDING';
        this.sortByDate = 'DESC';
        this.resetAndLoadRequests();
    }

    onIonInfinite(event: any) {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadRequests(true);
            
            setTimeout(() => {
                event.target.complete();
            }, 500);
        } else {
            event.target.complete();
        }
    }

    async approveRequest(request: AdminRequest) {
        // Validar que las solicitudes de documento tengan el documento adjunto
        if (request.type === 'DOCUMENT' && !request.details?.documentUrl) {
            const alert = await this.alertCtrl.create({
                header: 'Documento Requerido',
                message: 'Debes adjuntar el documento antes de aprobar esta solicitud.',
                cssClass: 'custom-alert',
                buttons: ['Aceptar']
            });
            await alert.present();
            return;
        }

        const alert = await this.alertCtrl.create({
            header: 'Aprobar Solicitud',
            message: '¿Deseas agregar un comentario?',
            cssClass: 'custom-alert',
            inputs: [
                {
                    name: 'comment',
                    type: 'textarea',
                    placeholder: 'Comentario (opcional)',
                    attributes: {
                        maxlength: 500
                    }
                }
            ],
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Aprobar',
                    cssClass: 'alert-button-confirm',
                    handler: (data) => {
                        this.performApprove(request, data.comment);
                    }
                }
            ]
        });

        await alert.present();
    }

    private performApprove(request: AdminRequest, comment?: string) {
        this.adminRequestsService.approveRequest(request.id, { reviewerComment: comment }).subscribe({
            next: async (updatedRequest) => {
                const index = this.requests.findIndex(r => r.id === request.id);
                if (index !== -1) {
                    this.requests[index] = updatedRequest;
                }

                const successAlert = await this.alertCtrl.create({
                    header: 'Solicitud Aprobada',
                    message: 'La solicitud ha sido aprobada exitosamente.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await successAlert.present();
            },
            error: async (error) => {
                console.error('Error approving request:', error);
                const errorAlert = await this.alertCtrl.create({
                    header: 'Error',
                    message: error.error?.message || 'No se pudo aprobar la solicitud.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await errorAlert.present();
            }
        });
    }

    async rejectRequest(request: AdminRequest) {
        const alert = await this.alertCtrl.create({
            header: 'Rechazar Solicitud',
            message: 'Por favor indica el motivo del rechazo:',
            cssClass: 'custom-alert',
            inputs: [
                {
                    name: 'comment',
                    type: 'textarea',
                    placeholder: 'Motivo del rechazo (requerido)',
                    attributes: {
                        maxlength: 500,
                        required: true
                    }
                }
            ],
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Rechazar',
                    cssClass: 'alert-button-delete',
                    handler: (data) => {
                        if (!data.comment || data.comment.trim() === '') {
                            return false;
                        }
                        this.performReject(request, data.comment);
                        return true;
                    }
                }
            ]
        });

        await alert.present();
    }

    private performReject(request: AdminRequest, comment: string) {
        this.adminRequestsService.rejectRequest(request.id, { reviewerComment: comment }).subscribe({
            next: async (updatedRequest) => {
                const index = this.requests.findIndex(r => r.id === request.id);
                if (index !== -1) {
                    this.requests[index] = updatedRequest;
                }

                const successAlert = await this.alertCtrl.create({
                    header: 'Solicitud Rechazada',
                    message: 'La solicitud ha sido rechazada.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await successAlert.present();
            },
            error: async (error) => {
                console.error('Error rejecting request:', error);
                const errorAlert = await this.alertCtrl.create({
                    header: 'Error',
                    message: error.error?.message || 'No se pudo rechazar la solicitud.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await errorAlert.present();
            }
        });
    }

    canProcessRequest(request: AdminRequest): boolean {
        return request.status === 'PENDING';
    }

    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'PENDING': 'warning',
            'APPROVED': 'success',
            'REJECTED': 'danger',
            'CANCELLED': 'medium'
        };
        return colors[status] || 'medium';
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'PENDING': 'Pendiente',
            'APPROVED': 'Aprobada',
            'REJECTED': 'Rechazada',
            'CANCELLED': 'Cancelada'
        };
        return labels[status] || status;
    }

    getRequestTypeLabel(type: string): string {
        const found = this.requestTypes.find(t => t.value === type);
        return found ? found.label : type;
    }

    getEmployeeName(request: AdminRequest): string {
        if (request.employee) {
            return `${request.employee.firstName} ${request.employee.lastName}`;
        }
        return 'Empleado';
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    formatTime(timeString: string): string {
        // Si el string ya está en formato HH:MM, devolverlo directamente
        if (timeString && /^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
            return timeString.substring(0, 5); // Retornar solo HH:MM
        }
        
        // Si es una fecha completa, parsearla
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }
        
        return timeString; // Retornar el string original si no se puede parsear
    }

    formatDuration(hours: number): string {
        const wholeHours = Math.floor(hours);
        const minutes = Math.round((hours - wholeHours) * 60);
        
        if (wholeHours === 0) {
            return `${minutes} minutos`;
        } else if (minutes === 0) {
            return `${wholeHours} ${wholeHours === 1 ? 'hora' : 'horas'}`;
        } else {
            return `${wholeHours} ${wholeHours === 1 ? 'hora' : 'horas'} y ${minutes} minutos`;
        }
    }

    calculateDaysBetween(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    getAccumulationReasonLabel(reason: string): string {
        const labels: { [key: string]: string } = {
            'TRABAJO_SABADO': 'Trabajo sábado en la tarde más de 4 horas',
            'TRABAJO_DOMINGO': 'Trabajo domingo más de 4 horas',
            'TRABAJO_FESTIVO': 'Trabajo festivo más de 4 horas',
            'CERTIFICADO_VOTACION': 'Certificado de votación'
        };
        return labels[reason] || reason;
    }

    formatBalanceDisplay(hours: number): string {
        if (!this.hoursPerDay) return `${hours.toFixed(2)} horas`;
        
        if (hours < this.hoursPerDay) {
            return `${hours.toFixed(2)} horas`;
        } else {
            const days = (hours / this.hoursPerDay).toFixed(2);
            return `${days} días`;
        }
    }

    getRequestIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'VACATION': 'airplane',
            'DOCUMENT': 'document-text',
            'BENEFIT': 'gift',
            'BIRTHDAY': 'cafe',
            'ORDINARY_PERMISSION': 'time',
            'SICK_LEAVE': 'medical',
            'MEDICAL_APPOINTMENT': 'fitness',
            'COMPENSATED_TIME_ACCUMULATION': 'time',
            'COMPENSATED_TIME_USAGE': 'calendar'
        };
        return icons[type] || 'document-text';
    }

    viewAttachment(url: string) {
        if (url) {
            window.open(url, '_blank');
        }
    }

    async uploadDocument(request: AdminRequest) {
        // Crear input de archivo dinámicamente
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx';
        
        input.onchange = async (event: any) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validar tipo de archivo
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                const alert = await this.alertCtrl.create({
                    header: 'Archivo no válido',
                    message: 'Solo se permiten archivos PDF o Word (DOC, DOCX)',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await alert.present();
                return;
            }

            // Validar tamaño (máximo 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                const alert = await this.alertCtrl.create({
                    header: 'Archivo muy grande',
                    message: 'El archivo no debe superar los 10MB',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await alert.present();
                return;
            }

            // Mostrar loading
            const loading = await this.loadingCtrl.create({
                message: 'Subiendo documento...',
                spinner: 'crescent'
            });
            await loading.present();

            // Subir archivo
            const documentTitle = request.details.documentType === 'CERTIFICADO_LABORAL' 
                ? 'Certificado Laboral' 
                : 'Comprobante de Nómina';

            this.mediaService.upload(file, { 
                folder: 'requests', 
                title: documentTitle 
            }).subscribe({
                next: async (attachment: Attachment) => {
                    // Actualizar la solicitud con el nuevo documentUrl
                    const updatedDetails = {
                        ...request.details,
                        documentUrl: attachment.url
                    };

                    this.adminRequestsService.updateRequest(request.id, { details: updatedDetails }).subscribe({
                        next: async (updatedRequest: AdminRequest) => {
                            await loading.dismiss();
                            
                            // Actualizar la solicitud en la lista
                            const index = this.requests.findIndex(r => r.id === request.id);
                            if (index !== -1) {
                                this.requests[index] = updatedRequest;
                            }

                            const successAlert = await this.alertCtrl.create({
                                header: 'Documento adjuntado',
                                message: 'El documento se ha adjuntado exitosamente.',
                                cssClass: 'custom-alert',
                                buttons: ['Aceptar']
                            });
                            await successAlert.present();
                        },
                        error: async (error: any) => {
                            await loading.dismiss();
                            console.error('Error updating request:', error);
                            
                            const errorAlert = await this.alertCtrl.create({
                                header: 'Error',
                                message: 'No se pudo actualizar la solicitud. Por favor intenta nuevamente.',
                                cssClass: 'custom-alert',
                                buttons: ['Aceptar']
                            });
                            await errorAlert.present();
                        }
                    });
                },
                error: async (error: any) => {
                    await loading.dismiss();
                    console.error('Error uploading file:', error);
                    
                    const errorAlert = await this.alertCtrl.create({
                        header: 'Error',
                        message: 'No se pudo subir el archivo. Por favor intenta nuevamente.',
                        cssClass: 'custom-alert',
                        buttons: ['Aceptar']
                    });
                    await errorAlert.present();
                }
            });
        };

        input.click();
    }

    async removeDocument(request: AdminRequest) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar documento',
            message: '¿Estás seguro de que deseas eliminar el documento adjunto?',
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: async () => {
                        const loading = await this.loadingCtrl.create({
                            message: 'Eliminando documento...',
                            spinner: 'crescent'
                        });
                        await loading.present();

                        // Actualizar la solicitud sin el documentUrl
                        const updatedDetails = {
                            ...request.details,
                            documentUrl: null
                        };

                        this.adminRequestsService.updateRequest(request.id, { details: updatedDetails }).subscribe({
                            next: async (updatedRequest: AdminRequest) => {
                                await loading.dismiss();
                                
                                // Actualizar la solicitud en la lista
                                const index = this.requests.findIndex(r => r.id === request.id);
                                if (index !== -1) {
                                    this.requests[index] = updatedRequest;
                                }

                                const successAlert = await this.alertCtrl.create({
                                    header: 'Documento eliminado',
                                    message: 'El documento ha sido eliminado exitosamente.',
                                    cssClass: 'custom-alert',
                                    buttons: ['Aceptar']
                                });
                                await successAlert.present();
                            },
                            error: async (error: any) => {
                                await loading.dismiss();
                                console.error('Error updating request:', error);
                                
                                const errorAlert = await this.alertCtrl.create({
                                    header: 'Error',
                                    message: 'No se pudo eliminar el documento. Por favor intenta nuevamente.',
                                    cssClass: 'custom-alert',
                                    buttons: ['Aceptar']
                                });
                                await errorAlert.present();
                            }
                        });
                    }
                }
            ]
        });

        await alert.present();
    }

    async openRequestHistory(request: AdminRequest) {
        const { AuditHistoryModalComponent } = await import('../../shared/components/audit-history-modal/audit-history-modal.component');
        
        const modal = await this.modalCtrl.create({
            component: AuditHistoryModalComponent,
            componentProps: {
                entityName: 'requests',
                entityId: request.id.toString(),
                title: 'Historial de Solicitud'
            },
            cssClass: 'audit-history-modal'
        });

        await modal.present();
    }

    canShowHistory(request: AdminRequest): boolean {
        // Mostrar historial para solicitudes aprobadas o rechazadas
        return request.status === 'APPROVED' || request.status === 'REJECTED';
    }
}
