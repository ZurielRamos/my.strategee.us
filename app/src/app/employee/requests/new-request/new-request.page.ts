import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent, IonIcon, IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline, documentTextOutline, medicalOutline,
    timeOutline, cafeOutline, giftOutline, airplaneOutline,
    laptopOutline, homeOutline, flashOutline, bedOutline, closeCircleOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CardButtonComponent } from '../../../shared/components/card-button/card-button.component';
import { BenefitsService } from '../../../admin/employees/services/benefits.service';
import { BenefitAllocation, BenefitType, getBenefitTypeLabel } from '../../../admin/employees/models/benefit-allocation.model';
import { AuthService } from '../../../auth/services/auth.service';
import { RequestHomeOfficeModalComponent } from '../components/request-home-office-modal/request-home-office-modal.component';
import { RequestIdoRestModalComponent } from '../components/request-ido-rest-modal/request-ido-rest-modal.component';
import { RequestEnergyzeSaturdayModalComponent } from '../components/request-energyze-saturday-modal/request-energyze-saturday-modal.component';
import { RequestRemoteSaturdayModalComponent } from '../components/request-remote-saturday-modal/request-remote-saturday-modal.component';
import { RequestWorkcationModalComponent } from '../components/request-workcation-modal/request-workcation-modal.component';
import { RequestOrdinaryPermissionModalComponent } from '../components/request-ordinary-permission-modal/request-ordinary-permission-modal.component';
import { RequestMedicalAppointmentModalComponent } from '../components/request-medical-appointment-modal/request-medical-appointment-modal.component';
import { RequestSickLeaveModalComponent } from '../components/request-sick-leave-modal/request-sick-leave-modal.component';
import { RequestBirthdayModalComponent } from '../components/request-birthday-modal/request-birthday-modal.component';
import { RequestDocumentModalComponent } from '../components/request-document-modal/request-document-modal.component';
import { RequestVacationModalComponent } from '../components/request-vacation-modal/request-vacation-modal.component';
import { RequestCompensatedAccumulationModalComponent } from '../components/request-compensated-accumulation-modal/request-compensated-accumulation-modal.component';
import { RequestCompensatedUsageModalComponent } from '../components/request-compensated-usage-modal/request-compensated-usage-modal.component';
import { RequestGiftedDayUsageModalComponent } from '../components/request-gifted-day-usage-modal/request-gifted-day-usage-modal.component';
import { RequestsService } from '../services/requests.service';
import { Request, RequestStatus } from '../models/request.model';
import { VacationsService } from '../services/vacations.service';
import { VacationBalance } from '../models/vacation-balance.model';
import { CompensatedTimeService } from '../services/compensated-time.service';
import { CompensatedTimeBalance } from '../models/compensated-time-balance.model';
import { GiftedDaysService } from '../services/gifted-days.service';
import { GiftedDaysBalance } from '../models/gifted-days-balance.model';
import { SystemSettingsService } from '../../../shared/services/system-settings.service';
import { forkJoin } from 'rxjs';

interface RequestTypeCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    type: 'benefit' | 'vacation' | 'document' | 'permission' | 'sick-leave' | 'medical' | 'birthday' | 'compensated-accumulation' | 'compensated-usage' | 'gifted-day-usage';
}

@Component({
    selector: 'app-new-request',
    templateUrl: './new-request.page.html',
    styleUrls: ['./new-request.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        IonContent, IonIcon, IonSpinner,
        PageHeaderComponent,
        CardButtonComponent
    ],
    providers: [ModalController]
})
export class NewRequestPage implements OnInit {
    benefits: BenefitAllocation[] = [];
    requests: Request[] = [];
    vacationBalance: VacationBalance | null = null;
    compensatedBalance: CompensatedTimeBalance | null = null;
    giftedDaysBalance: GiftedDaysBalance | null = null;
    isLoadingBenefits = true;
    isLoadingVacations = true;
    isLoadingCompensated = true;
    isLoadingGiftedDays = true;
    private employeeId: string | null = null;
    benefitUsage: Map<BenefitType, number> = new Map();
    hoursPerDay: number | null = null;

    requestTypes: RequestTypeCard[] = [
        {
            id: 'vacation',
            title: 'Vacaciones',
            description: 'Solicita tus días de vacaciones',
            icon: 'airplane-outline',
            color: 'primary',
            type: 'vacation'
        },
        {
            id: 'document',
            title: 'Documentos',
            description: 'Solicita certificados laborales',
            icon: 'document-text-outline',
            color: 'secondary',
            type: 'document'
        },
        {
            id: 'permission',
            title: 'Permiso Ordinario',
            description: 'Solicita permiso por horas',
            icon: 'time-outline',
            color: 'tertiary',
            type: 'permission'
        },
        {
            id: 'sick-leave',
            title: 'Incapacidad',
            description: 'Reporta una incapacidad médica',
            icon: 'medical-outline',
            color: 'warning',
            type: 'sick-leave'
        },
        {
            id: 'medical',
            title: 'Cita Médica',
            description: 'Solicita permiso para cita médica',
            icon: 'medical-outline',
            color: 'success',
            type: 'medical'
        },
        {
            id: 'birthday',
            title: 'Cumpleaños',
            description: 'Solicita tu medio día de cumpleaños',
            icon: 'cafe-outline',
            color: 'danger',
            type: 'birthday'
        },
        {
            id: 'compensated-accumulation',
            title: 'Acumular Compensados',
            description: 'Acumula días por trabajo extra',
            icon: 'time-outline',
            color: 'medium',
            type: 'compensated-accumulation'
        },
        {
            id: 'compensated-usage',
            title: 'Disfrute Compensados',
            description: 'Usa tus días compensados acumulados',
            icon: 'calendar-outline',
            color: 'dark',
            type: 'compensated-usage'
        },
        {
            id: 'gifted-day-usage',
            title: 'Días Obsequiados',
            description: 'Disfruta tus días obsequiados por servicios',
            icon: 'gift-outline',
            color: 'success',
            type: 'gifted-day-usage'
        }
    ];

    benefitIcons: { [key in BenefitType]: string } = {
        [BenefitType.REMOTE_SATURDAY]: 'home-outline',
        [BenefitType.WORKCATION]: 'airplane-outline',
        [BenefitType.HOME_OFFICE]: 'laptop-outline',
        [BenefitType.IDO_REST_SATURDAY]: 'bed-outline',
        [BenefitType.BIRTHDAY_EXTENSION]: 'cafe-outline'
    };

    constructor(
        private router: Router,
        private benefitsService: BenefitsService,
        private authService: AuthService,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private vacationsService: VacationsService,
        private compensatedTimeService: CompensatedTimeService,
        private giftedDaysService: GiftedDaysService,
        private systemSettingsService: SystemSettingsService
    ) {
        addIcons({
            calendarOutline, documentTextOutline, medicalOutline,
            timeOutline, cafeOutline, giftOutline, airplaneOutline,
            laptopOutline, homeOutline, flashOutline, bedOutline, closeCircleOutline
        });
    }

    ngOnInit() {
        const currentUser = this.authService.getCurrentUser();
        this.employeeId = currentUser?.employeeId || null;

        // Cargar horas por día desde configuración
        this.systemSettingsService.getHoursPerWorkday().subscribe({
            next: (hours) => {
                this.hoursPerDay = hours;
            },
            error: (error) => {
                console.error('Error loading hours per day:', error);
            }
        });

        if (this.employeeId) {
            this.loadBenefits();
            this.loadVacationBalance();
            this.loadCompensatedBalance();
            this.loadGiftedDaysBalance();
        } else {
            console.error('No employee ID found for current user');
            this.isLoadingBenefits = false;
            this.isLoadingVacations = false;
            this.isLoadingCompensated = false;
            this.isLoadingGiftedDays = false;
        }
    }

    ionViewWillEnter() {
        // Recargar datos cuando la página se vuelva a mostrar
        if (this.employeeId) {
            this.loadBenefits();
            this.loadVacationBalance();
            this.loadCompensatedBalance();
            this.loadGiftedDaysBalance();
        }
    }

    loadBenefits() {
        if (!this.employeeId) return;

        this.isLoadingBenefits = true;
        
        forkJoin({
            benefits: this.benefitsService.getAllocationsByEmployee(this.employeeId),
            requests: this.requestsService.getMyRequests()
        }).subscribe({
            next: ({ benefits, requests }) => {
                this.benefits = benefits;
                this.requests = requests.data; // Extraer el array de datos de la respuesta paginada
                this.calculateBenefitUsage();
                this.isLoadingBenefits = false;
            },
            error: (error) => {
                console.error('Error loading data:', error);
                this.isLoadingBenefits = false;
            }
        });
    }

    loadVacationBalance() {
        this.isLoadingVacations = true;
        
        this.vacationsService.getMyBalance().subscribe({
            next: (balance) => {
                this.vacationBalance = balance;
                this.isLoadingVacations = false;
            },
            error: (error) => {
                console.error('Error loading vacation balance:', error);
                this.isLoadingVacations = false;
            }
        });
    }

    loadCompensatedBalance() {
        this.isLoadingCompensated = true;
        
        this.compensatedTimeService.getMyBalance().subscribe({
            next: (balance) => {
                this.compensatedBalance = balance;
                this.isLoadingCompensated = false;
            },
            error: (error) => {
                console.error('Error loading compensated balance:', error);
                this.isLoadingCompensated = false;
            }
        });
    }

    loadGiftedDaysBalance() {
        this.isLoadingGiftedDays = true;

        this.giftedDaysService.getMyBalance().subscribe({
            next: (balance) => {
                this.giftedDaysBalance = balance;
                this.isLoadingGiftedDays = false;
            },
            error: (error) => {
                console.error('Error loading gifted days balance:', error);
                this.isLoadingGiftedDays = false;
            }
        });
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

    hasCompensatedBalance(): boolean {
        return this.compensatedBalance !== null && this.compensatedBalance.availableBalance > 0;
    }

    hasGiftedDaysBalance(): boolean {
        return this.giftedDaysBalance !== null &&
            this.giftedDaysBalance.isEligible &&
            this.giftedDaysBalance.availableDays > 0;
    }

    isGiftedDaysEligible(): boolean {
        return this.giftedDaysBalance !== null && this.giftedDaysBalance.isEligible;
    }

    calculateBenefitUsage() {
        this.benefitUsage.clear();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filtrar solicitudes del mes actual que sean de tipo BENEFIT y estén pendientes o aprobadas
        const currentMonthRequests = this.requests.filter(request => {
            if (request.type !== 'BENEFIT') return false;
            if (request.status === RequestStatus.REJECTED || request.status === RequestStatus.CANCELLED) return false;
            
            const requestDate = new Date(request.createdAt);
            return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
        });

        // Sumar los días usados por tipo de beneficio
        currentMonthRequests.forEach(request => {
            if (request.details?.benefitType && request.details?.amount) {
                const benefitType = request.details.benefitType as BenefitType;
                const currentUsage = this.benefitUsage.get(benefitType) || 0;
                this.benefitUsage.set(benefitType, currentUsage + request.details.amount);
            }
        });
    }

    getBenefitLabel(type: BenefitType): string {
        return getBenefitTypeLabel(type);
    }

    getBenefitIcon(type: BenefitType): string {
        return this.benefitIcons[type] || 'gift-outline';
    }

    async selectRequestType(requestType: RequestTypeCard) {
        console.log('Selected request type:', requestType);
        
        // Validar balance de compensados antes de abrir el modal
        if (requestType.type === 'compensated-usage' && !this.hasCompensatedBalance()) {
            return; // No hacer nada si no hay balance
        }
        
        // Validar balance de días obsequiados antes de abrir el modal
        if (requestType.type === 'gifted-day-usage' && (!this.isGiftedDaysEligible() || !this.hasGiftedDaysBalance())) {
            return;
        }
        
        // Abrir modal según el tipo de solicitud
        if (requestType.type === 'vacation') {
            // Validar que tenga balance de vacaciones cargado y sea elegible
            if (!this.vacationBalance || !this.vacationBalance.isEligible) {
                return;
            }

            const modal = await this.modalCtrl.create({
                component: RequestVacationModalComponent,
                componentProps: {
                    vacationBalance: this.vacationBalance
                },
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'permission') {
            const modal = await this.modalCtrl.create({
                component: RequestOrdinaryPermissionModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                // Forzar recarga de la página de solicitudes
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'medical') {
            const modal = await this.modalCtrl.create({
                component: RequestMedicalAppointmentModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                // Forzar recarga de la página de solicitudes
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'sick-leave') {
            const modal = await this.modalCtrl.create({
                component: RequestSickLeaveModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                // Forzar recarga de la página de solicitudes
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'birthday') {
            const modal = await this.modalCtrl.create({
                component: RequestBirthdayModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                // Forzar recarga de la página de solicitudes
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'document') {
            const modal = await this.modalCtrl.create({
                component: RequestDocumentModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                // Forzar recarga de la página de solicitudes
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'compensated-accumulation') {
            const modal = await this.modalCtrl.create({
                component: RequestCompensatedAccumulationModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'compensated-usage') {
            const modal = await this.modalCtrl.create({
                component: RequestCompensatedUsageModalComponent,
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);
                
                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else if (requestType.type === 'gifted-day-usage') {
            if (!this.giftedDaysBalance) {
                console.error('Gifted days balance not loaded');
                return;
            }

            const modal = await this.modalCtrl.create({
                component: RequestGiftedDayUsageModalComponent,
                componentProps: {
                    giftedDaysBalance: this.giftedDaysBalance
                },
                cssClass: 'request-modal'
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.success) {
                console.log('Request created successfully:', data.request);

                const timestamp = new Date().getTime();
                this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
            }
        } else {
            // TODO: Implementar otros tipos de solicitudes
            console.log('Tipo de solicitud no implementado aún:', requestType.type);
        }
    }

    async requestBenefit(benefit: BenefitAllocation) {
        // Validar si tiene días disponibles
        if (!this.hasDaysAvailable(benefit)) {
            return;
        }

        // Seleccionar el componente de modal según el tipo de beneficio
        let modalComponent;
        switch (benefit.benefitType) {
            case BenefitType.IDO_REST_SATURDAY:
                modalComponent = RequestIdoRestModalComponent;
                break;
            case BenefitType.REMOTE_SATURDAY:
                modalComponent = RequestRemoteSaturdayModalComponent;
                break;
            case BenefitType.WORKCATION:
                modalComponent = RequestWorkcationModalComponent;
                break;
            case BenefitType.HOME_OFFICE:
            case BenefitType.BIRTHDAY_EXTENSION:
            default:
                modalComponent = RequestHomeOfficeModalComponent;
                break;
        }

        const modal = await this.modalCtrl.create({
            component: modalComponent,
            componentProps: {
                benefit: benefit,
                benefitUsage: this.benefitUsage.get(benefit.benefitType) || 0
            },
            cssClass: 'request-modal'
        });

        await modal.present();

        const { data } = await modal.onWillDismiss();
        if (data?.success) {
            console.log('Request created successfully:', data.request);
            
            // Forzar recarga de la página de solicitudes
            // Usamos navigateByUrl con un timestamp para evitar que Angular reutilice la instancia
            const timestamp = new Date().getTime();
            this.router.navigateByUrl(`/employee/requests?refresh=${timestamp}`);
        }
    }

    hasDaysAvailable(benefit: BenefitAllocation): boolean {
        const used = this.benefitUsage.get(benefit.benefitType) || 0;
        const available = benefit.monthlyQuota - used;
        return available > 0;
    }

    getAvailableDays(benefit: BenefitAllocation): number {
        const used = this.benefitUsage.get(benefit.benefitType) || 0;
        return Math.max(0, benefit.monthlyQuota - used);
    }

    getBenefitStatusMessage(benefit: BenefitAllocation): string {
        const available = this.getAvailableDays(benefit);
        if (available === 0) {
            return 'Sin días disponibles este mes';
        }
        return `${available} de ${benefit.monthlyQuota} días disponibles`;
    }

    isRequestTypeVisible(requestType: RequestTypeCard): boolean {
        // Vacaciones: solo si tiene contrato laboral
        if (requestType.type === 'vacation') {
            return !this.isLoadingVacations && (this.vacationBalance?.isEligible ?? false);
        }
        // Días obsequiados: solo si tiene contrato activo (laboral o servicios)
        if (requestType.type === 'gifted-day-usage') {
            return !this.isLoadingGiftedDays && (this.giftedDaysBalance?.isEligible ?? false);
        }
        return true;
    }

    isRequestTypeDisabled(requestType: RequestTypeCard): boolean {
        if (requestType.type === 'compensated-usage') return !this.hasCompensatedBalance();
        if (requestType.type === 'gifted-day-usage') return !this.hasGiftedDaysBalance();
        return false;
    }

    isRequestTypeLoading(type: string): boolean {
        if (type === 'vacation') {
            return this.isLoadingVacations;
        }
        if (type === 'compensated-usage') {
            return this.isLoadingCompensated;
        }
        if (type === 'gifted-day-usage') {
            return this.isLoadingGiftedDays;
        }
        return false;
    }

    getRequestDescription(requestType: RequestTypeCard): string {
        if (requestType.type === 'vacation' && this.vacationBalance && !this.isLoadingVacations) {
            if (!this.vacationBalance.isEligible) {
                return 'Solo para contratos laborales';
            }
            return `${this.vacationBalance.availableBalance} días disponibles`;
        }
        if (requestType.type === 'compensated-usage' && this.compensatedBalance && !this.isLoadingCompensated) {
            if (this.compensatedBalance.availableBalance > 0) {
                return `${this.formatBalanceDisplay(this.compensatedBalance.availableBalance)} disponibles`;
            }
            return 'Sin horas disponibles';
        }
        if (requestType.type === 'gifted-day-usage' && this.giftedDaysBalance && !this.isLoadingGiftedDays) {
            if (!this.giftedDaysBalance.isEligible) {
                return 'Solo para contratos de servicios';
            }
            if (this.giftedDaysBalance.availableDays > 0) {
                return `${this.giftedDaysBalance.availableDays} días disponibles`;
            }
            return 'Sin días disponibles';
        }
        return requestType.description;
    }

    getRequestBadge(requestType: RequestTypeCard): { text: string; type: 'unavailable' | 'info' } | undefined {
        if (requestType.type === 'compensated-usage' && this.compensatedBalance && !this.isLoadingCompensated) {
            if (this.compensatedBalance.availableBalance === 0) {
                return { text: 'No disponible', type: 'unavailable' };
            }
        }
        if (requestType.type === 'vacation' && this.vacationBalance && !this.isLoadingVacations) {
            if (!this.vacationBalance.isEligible) {
                return { text: 'No aplica', type: 'unavailable' };
            }
        }
        if (requestType.type === 'gifted-day-usage' && this.giftedDaysBalance && !this.isLoadingGiftedDays) {
            if (!this.giftedDaysBalance.isEligible) {
                return { text: 'No aplica', type: 'unavailable' };
            }
            if (this.giftedDaysBalance.availableDays === 0) {
                return { text: 'No disponible', type: 'unavailable' };
            }
        }
        return undefined;
    }
}
