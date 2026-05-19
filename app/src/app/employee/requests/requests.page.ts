import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
    IonContent, IonIcon, IonSpinner, IonButton,
    IonCard, IonBadge, IonSelect, IonSelectOption, IonItem,
    IonInfiniteScroll, IonInfiniteScrollContent,
    AlertController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline, calendarOutline, documentTextOutline, closeCircleOutline,
    timeOutline, arrowForwardOutline, chatboxOutline, arrowForward,
    airplane, documentText, gift, cafe, time, medical, fitness, calendar, closeCircle, chatbox, documentAttachOutline,
    cloudUploadOutline, informationCircleOutline, eyeOutline, walletOutline,
    filterOutline, swapVerticalOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RequestsService, RequestFilters } from './services/requests.service';
import { Request, RequestStatus, RequestType } from './models/request.model';
import { MediaService } from '../../admin/media/services/media.service';
import { Attachment } from '../../admin/media/models/attachment.model';
import { CompensatedTimeService } from './services/compensated-time.service';
import { CompensatedTimeBalance } from './models/compensated-time-balance.model';
import { SystemSettingsService } from '../../shared/services/system-settings.service';

@Component({
    selector: 'app-employee-requests',
    templateUrl: './requests.page.html',
    styleUrls: ['./requests.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent, IonIcon, IonSpinner, IonButton,
        IonCard, IonBadge, IonSelect, IonSelectOption, IonItem,
        IonInfiniteScroll, IonInfiniteScrollContent,
        PageHeaderComponent
    ],
    providers: [AlertController, LoadingController]
})
export class RequestsPage implements OnInit {
    @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

    requests: Request[] = [];
    isLoadingRequests = true;
    compensatedBalance: CompensatedTimeBalance | null = null;
    hoursPerDay: number | null = null;

    // Filtros
    selectedType?: RequestType;
    selectedStatus?: RequestStatus;
    sortByDate: 'ASC' | 'DESC' = 'DESC';

    // Paginación
    currentPage = 1;
    totalPages = 1;
    total = 0;
    limit = 20;

    // Enums para el template
    RequestType = RequestType;
    RequestStatus = RequestStatus;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private requestsService: RequestsService,
        private compensatedTimeService: CompensatedTimeService,
        private mediaService: MediaService,
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private systemSettingsService: SystemSettingsService
    ) {
        addIcons({
            addOutline, calendarOutline, documentTextOutline, closeCircleOutline,
            timeOutline, arrowForwardOutline, chatboxOutline, arrowForward,
            airplane, documentText, gift, cafe, time, medical, fitness, calendar, closeCircle, chatbox, documentAttachOutline,
            cloudUploadOutline, informationCircleOutline, eyeOutline, walletOutline,
            filterOutline, swapVerticalOutline
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
        this.loadCompensatedBalance();
        
        // Suscribirse a cambios en los query parameters
        this.route.queryParams.subscribe(params => {
            if (params['refresh']) {
                // Si hay un parámetro refresh, recargar los datos
                this.resetAndLoadRequests();
                this.loadCompensatedBalance();
            }
        });
    }

    ionViewWillEnter() {
        // Recargar datos cuando la página se vuelva a mostrar
        this.resetAndLoadRequests();
        this.loadCompensatedBalance();
    }

    loadRequests(append: boolean = false) {
        if (!append) {
            this.isLoadingRequests = true;
        }

        const filters: RequestFilters = {
            page: this.currentPage,
            limit: this.limit,
            sortBy: 'createdAt',
            order: this.sortByDate
        };

        // Solo agregar filtros si tienen valor
        if (this.selectedType) {
            filters.type = this.selectedType;
        }
        if (this.selectedStatus) {
            filters.status = this.selectedStatus;
        }

        console.log('Loading requests with filters:', filters);

        this.requestsService.getMyRequests(filters).subscribe({
            next: (response) => {
                console.log('Requests response:', response);
                if (append) {
                    this.requests = [...this.requests, ...response.data];
                } else {
                    this.requests = response.data;
                }
                
                this.total = response.meta.total;
                this.totalPages = response.meta.totalPages;
                this.isLoadingRequests = false;
            },
            error: (error) => {
                console.error('Error loading requests:', error);
                this.isLoadingRequests = false;
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
        return !!(this.selectedType || this.selectedStatus || this.sortByDate !== 'DESC');
    }

    clearFilters() {
        this.selectedType = undefined;
        this.selectedStatus = undefined;
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

    loadCompensatedBalance() {
        this.compensatedTimeService.getMyBalance().subscribe({
            next: (data) => {
                this.compensatedBalance = data;
            },
            error: (error) => {
                console.error('Error loading compensated balance:', error);
                this.compensatedBalance = null;
            }
        });
    }

    goToNewRequest() {
        this.router.navigate(['/employee/requests/new']);
    }

    getStatusColor(status: RequestStatus): string {
        const colors: { [key in RequestStatus]: string } = {
            [RequestStatus.PENDING]: 'warning',
            [RequestStatus.APPROVED]: 'success',
            [RequestStatus.REJECTED]: 'danger',
            [RequestStatus.CANCELLED]: 'medium'
        };
        return colors[status] || 'medium';
    }

    getStatusLabel(status: RequestStatus): string {
        const labels: { [key in RequestStatus]: string } = {
            [RequestStatus.PENDING]: 'Pendiente',
            [RequestStatus.APPROVED]: 'Aprobada',
            [RequestStatus.REJECTED]: 'Rechazada',
            [RequestStatus.CANCELLED]: 'Cancelada'
        };
        return labels[status] || status;
    }

    canCancelRequest(request: Request): boolean {
        // Solo se pueden cancelar solicitudes en estado PENDING
        return request.status === RequestStatus.PENDING;
    }

    async cancelRequest(request: Request) {
        if (!this.canCancelRequest(request)) {
            return;
        }

        // Mostrar alerta de confirmación usando AlertController
        const alert = await this.alertCtrl.create({
            header: 'Confirmar cancelación',
            message: '¿Estás seguro de que deseas cancelar esta solicitud? Esta acción no se puede deshacer.',
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, cancelar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.performCancelRequest(request);
                    }
                }
            ]
        });

        await alert.present();
    }

    private async performCancelRequest(request: Request) {
        // Mostrar loading mientras se procesa
        const loading = await this.loadingCtrl.create({
            message: 'Cancelando solicitud...',
            spinner: 'crescent'
        });
        
        await loading.present();

        this.requestsService.cancelRequest(request.id).subscribe({
            next: async (updatedRequest) => {
                await loading.dismiss();
                console.log('Request cancelled successfully:', updatedRequest);
                
                // Actualizar la solicitud en la lista
                const index = this.requests.findIndex(r => r.id === request.id);
                if (index !== -1) {
                    this.requests[index] = updatedRequest;
                }
                
                // Mostrar mensaje de éxito
                const successAlert = await this.alertCtrl.create({
                    header: 'Solicitud cancelada',
                    message: 'La solicitud ha sido cancelada exitosamente.',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await successAlert.present();
            },
            error: async (error) => {
                await loading.dismiss();
                console.error('Error cancelling request:', error);
                
                // Mostrar mensaje de error específico
                const errorMessage = error.error?.message || error.message || 'Error al cancelar la solicitud.';
                const errorAlert = await this.alertCtrl.create({
                    header: 'Error',
                    message: errorMessage,
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await errorAlert.present();
            }
        });
    }

    getRequestTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            'VACATION': 'Vacaciones',
            'DOCUMENT': 'Documento',
            'BENEFIT': 'Beneficio',
            'BIRTHDAY': 'Cumpleaños',
            'ORDINARY_PERMISSION': 'Permiso Ordinario',
            'SICK_LEAVE': 'Incapacidad',
            'MEDICAL_APPOINTMENT': 'Cita Médica',
            'COMPENSATED_TIME_ACCUMULATION': 'Acumulación Compensados',
            'COMPENSATED_TIME_USAGE': 'Disfrute Compensados',
            'ENERGYZE_DAY_ACCUMULATION': 'Acumulación Días Energyze',
            'ENERGYZE_DAY_USAGE': 'Disfrute Días Energyze',
            'GIFTED_DAY_USAGE': 'Días Obsequiados por Servicios'
        };
        return labels[type] || type;
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
            'COMPENSATED_TIME_USAGE': 'calendar',
            'ENERGYZE_DAY_ACCUMULATION': 'flash',
            'ENERGYZE_DAY_USAGE': 'flash',
            'GIFTED_DAY_USAGE': 'gift'
        };
        return icons[type] || 'document-text';
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
            // Si es menos de un día, mostrar en horas
            return `${hours.toFixed(2)} horas`;
        } else {
            // Si es mayor o igual a un día, mostrar en días con dos decimales
            const days = (hours / this.hoursPerDay).toFixed(2);
            return `${days} días`;
        }
    }

    async uploadAttachment(request: Request) {
        // Crear input de archivo dinámicamente
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png';
        
        input.onchange = async (event: any) => {
            const file = event.target.files[0];
            if (!file) return;

            // Validar tipo de archivo
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                const alert = await this.alertCtrl.create({
                    header: 'Archivo no válido',
                    message: 'Solo se permiten archivos PDF o imágenes (JPG, PNG)',
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
                    message: 'El archivo no debe superar los 5MB',
                    cssClass: 'custom-alert',
                    buttons: ['Aceptar']
                });
                await alert.present();
                return;
            }

            // Mostrar loading
            const loading = await this.loadingCtrl.create({
                message: 'Subiendo comprobante...',
                spinner: 'crescent'
            });
            await loading.present();

            // Subir archivo
            this.mediaService.upload(file, { folder: 'requests', title: 'Comprobante Cita Médica' }).subscribe({
                next: async (attachment: Attachment) => {
                    // Actualizar la solicitud con el nuevo attachmentUrl
                    const updatedDetails = {
                        ...request.details,
                        attachmentUrl: attachment.url
                    };

                    this.requestsService.updateRequest(request.id, { details: updatedDetails }).subscribe({
                        next: async (updatedRequest) => {
                            await loading.dismiss();
                            
                            // Actualizar la solicitud en la lista
                            const index = this.requests.findIndex(r => r.id === request.id);
                            if (index !== -1) {
                                this.requests[index] = updatedRequest;
                            }

                            const successAlert = await this.alertCtrl.create({
                                header: 'Comprobante subido',
                                message: 'El comprobante se ha adjuntado exitosamente.',
                                cssClass: 'custom-alert',
                                buttons: ['Aceptar']
                            });
                            await successAlert.present();
                        },
                        error: async (error) => {
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
                error: async (error) => {
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

    async removeAttachment(request: Request) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar comprobante',
            message: '¿Estás seguro de que deseas eliminar el comprobante adjunto?',
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
                            message: 'Eliminando comprobante...',
                            spinner: 'crescent'
                        });
                        await loading.present();

                        // Actualizar la solicitud sin el attachmentUrl
                        const updatedDetails = {
                            ...request.details,
                            attachmentUrl: null
                        };

                        this.requestsService.updateRequest(request.id, { details: updatedDetails }).subscribe({
                            next: async (updatedRequest) => {
                                await loading.dismiss();
                                
                                // Actualizar la solicitud en la lista
                                const index = this.requests.findIndex(r => r.id === request.id);
                                if (index !== -1) {
                                    this.requests[index] = updatedRequest;
                                }

                                const successAlert = await this.alertCtrl.create({
                                    header: 'Comprobante eliminado',
                                    message: 'El comprobante ha sido eliminado exitosamente.',
                                    cssClass: 'custom-alert',
                                    buttons: ['Aceptar']
                                });
                                await successAlert.present();
                            },
                            error: async (error) => {
                                await loading.dismiss();
                                console.error('Error updating request:', error);
                                
                                const errorAlert = await this.alertCtrl.create({
                                    header: 'Error',
                                    message: 'No se pudo eliminar el comprobante. Por favor intenta nuevamente.',
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

    viewAttachment(url: string) {
        if (url) {
            window.open(url, '_blank');
        }
    }

    calculateDaysBetween(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
        return diffDays;
    }
}
