import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent, IonIcon, IonSpinner, IonChip, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    documentTextOutline, giftOutline, calendarOutline, timeOutline, flashOutline,
    checkmarkCircleOutline, closeCircleOutline, timeOutline as clockOutline, briefcaseOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { InventoryCardComponent } from './components/inventory-card/inventory-card.component';
import { BenefitsService } from '../../admin/employees/services/benefits.service';
import { VacationsService } from '../requests/services/vacations.service';
import { CompensatedTimeService } from '../requests/services/compensated-time.service';
import { EnergyzeDaysService } from '../../shared/services/energyze-days.service';
import { GiftedDaysService } from '../requests/services/gifted-days.service';
import { EmployeesService } from '../../admin/employees/services/employees.service';
import { RequestsService } from '../requests/services/requests.service';
import { IdoService, IdoResponse } from '../services/ido.service';
import { ContractsService } from '../../admin/employees/services/contracts.service';
import { Contract, ContractStatus, ContractType, PayrollGroup, SalaryType } from '../../admin/employees/models/contract.model';
import { BenefitAllocation, getBenefitTypeLabel } from '../../admin/employees/models/benefit-allocation.model';
import { Request, RequestType, RequestStatus } from '../requests/models/request.model';
import { AuthService } from '../../auth/services/auth.service';

@Component({
    selector: 'app-employee-dashboard',
    templateUrl: './dashboard.page.html',
    styleUrls: ['./dashboard.page.scss'],
    standalone: true,
    imports: [
        IonContent, CommonModule, FormsModule, IonIcon, IonSpinner,
        IonChip, IonLabel, PageHeaderComponent, InventoryCardComponent
    ]
})
export class DashboardPage implements OnInit {
    benefits: BenefitAllocation[] = [];
    recentRequests: Request[] = [];
    vacationBalance: any = null;
    compensatedTimeBalance: any = null;
    energyzeDaysBalance: any = null;
    giftedDaysBalance: any = null;
    idoData: IdoResponse | null = null;
    activeContract: Contract | null = null;
    
    isLoading = false;
    isLoadingBenefits = true;
    isLoadingRequests = true;
    isLoadingVacations = true;
    isLoadingCompensatedTime = true;
    isLoadingEnergyzeDays = true;
    isLoadingGiftedDays = true;
    isLoadingIdo = true;
    isLoadingContract = true;
    
    benefitsCount = 0;
    
    private employeeId: string | null = null;
    currentUser: any = null;
    employeeProfile: any = null;

    constructor(
        private benefitsService: BenefitsService,
        private requestsService: RequestsService,
        private vacationsService: VacationsService,
        private compensatedTimeService: CompensatedTimeService,
        private energyzeDaysService: EnergyzeDaysService,
        private giftedDaysService: GiftedDaysService,
        private idoService: IdoService,
        private authService: AuthService,
        private employeesService: EmployeesService,
        private contractsService: ContractsService
    ) {
        addIcons({ 
            documentTextOutline, giftOutline, calendarOutline, timeOutline, flashOutline,
            checkmarkCircleOutline, closeCircleOutline, clockOutline, briefcaseOutline
        });
    }

    ngOnInit() {
        this.currentUser = this.authService.getCurrentUser();
        this.employeeId = this.currentUser?.employeeId || null;
        
        console.log('Current user:', this.currentUser);
        console.log('Employee ID:', this.employeeId);
        
        if (this.employeeId) {
            // Cargar el perfil del empleado si no está disponible
            if (!this.currentUser?.profile?.firstName) {
                this.loadEmployeeProfile();
            }
        } else {
            console.error('No employee ID found for current user');
            this.isLoadingBenefits = false;
            this.isLoadingRequests = false;
            this.isLoadingVacations = false;
            this.isLoadingCompensatedTime = false;
            this.isLoadingEnergyzeDays = false;
            this.isLoadingGiftedDays = false;
            this.isLoadingIdo = false;
            this.isLoadingContract = false;
        }
    }

    ionViewWillEnter() {
        // Este método se ejecuta cada vez que la página se muestra
        // Recargar todos los datos para asegurar que estén actualizados
        if (this.employeeId) {
            this.loadAllData();
        }
    }

    loadEmployeeProfile() {
        console.log('Loading employee profile...');
        this.employeesService.getProfile().subscribe({
            next: (profile) => {
                console.log('Employee profile loaded:', profile);
                console.log('Profile firstName:', profile.firstName);
                console.log('Profile lastName:', profile.lastName);
                this.employeeProfile = profile;
            },
            error: (error) => {
                console.error('Error loading employee profile:', error);
            }
        });
    }

    loadAllData() {
        this.loadBenefits();
        this.loadRecentRequests();
        this.loadVacationBalance();
        this.loadCompensatedTimeBalance();
        this.loadEnergyzeDaysBalance();
        this.loadGiftedDaysBalance();
        this.loadIdo();
        this.loadActiveContract();
    }

    loadBenefits() {
        if (!this.employeeId) {
            console.error('No employeeId available for loading benefits');
            this.isLoadingBenefits = false;
            return;
        }
        
        this.isLoadingBenefits = true;
        console.log('Loading benefits balances for employeeId:', this.employeeId);
        this.benefitsService.getBenefitBalances().subscribe({
            next: (data) => {
                console.log('Benefits balances loaded:', data);
                this.benefits = data;
                this.benefitsCount = data.length;
                this.isLoadingBenefits = false;
            },
            error: (error) => {
                console.error('Error loading benefits:', error);
                console.error('Error details:', error.error);
                this.isLoadingBenefits = false;
            }
        });
    }

    loadRecentRequests() {
        if (!this.employeeId) return;
        
        this.isLoadingRequests = true;
        console.log('Loading recent requests for employee:', this.employeeId);
        this.requestsService.getMyRequests({ 
            limit: 6, 
            page: 1,
            sortBy: 'createdAt',
            order: 'DESC'
        }).subscribe({
            next: (response) => {
                console.log('Recent requests loaded:', response);
                this.recentRequests = response.data;
                this.isLoadingRequests = false;
            },
            error: (error) => {
                console.error('Error loading recent requests:', error);
                this.isLoadingRequests = false;
            }
        });
    }

    loadVacationBalance() {
        if (!this.employeeId) return;
        
        this.isLoadingVacations = true;
        console.log('Loading vacation balance');
        this.vacationsService.getMyBalance().subscribe({
            next: (balance) => {
                console.log('Vacation balance loaded:', balance);
                this.vacationBalance = balance;
                this.isLoadingVacations = false;
            },
            error: (error) => {
                console.error('Error loading vacation balance:', error);
                this.isLoadingVacations = false;
            }
        });
    }

    loadCompensatedTimeBalance() {
        if (!this.employeeId) return;
        
        this.isLoadingCompensatedTime = true;
        console.log('Loading compensated time balance');
        this.compensatedTimeService.getMyBalance().subscribe({
            next: (balance) => {
                console.log('Compensated time balance loaded:', balance);
                this.compensatedTimeBalance = balance;
                this.isLoadingCompensatedTime = false;
            },
            error: (error) => {
                console.error('Error loading compensated time balance:', error);
                this.isLoadingCompensatedTime = false;
            }
        });
    }

    loadEnergyzeDaysBalance() {
        if (!this.employeeId) return;
        
        this.isLoadingEnergyzeDays = true;
        console.log('Loading energyze days balance');
        this.energyzeDaysService.getMyBalance().subscribe({
            next: (balance) => {
                console.log('Energyze days balance loaded:', balance);
                this.energyzeDaysBalance = balance;
                this.isLoadingEnergyzeDays = false;
            },
            error: (error) => {
                console.error('Error loading energyze days balance:', error);
                this.isLoadingEnergyzeDays = false;
            }
        });
    }

    loadGiftedDaysBalance() {
        if (!this.employeeId) return;

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

    loadIdo() {
        if (!this.employeeId) return;
        
        this.isLoadingIdo = true;
        console.log('Loading IDO data');
        this.idoService.getMyIdo().subscribe({
            next: (data) => {
                console.log('IDO data loaded:', data);
                this.idoData = data;
                this.isLoadingIdo = false;
            },
            error: (error) => {
                console.error('Error loading IDO data:', error);
                this.isLoadingIdo = false;
            }
        });
    }

    get firstName(): string {
        if (this.employeeProfile?.firstName) {
            return this.employeeProfile.firstName;
        }
        
        if (this.currentUser?.profile?.employee?.firstName) {
            return this.currentUser.profile.employee.firstName;
        }
        
        if (this.currentUser?.profile?.firstName) {
            return this.currentUser.profile.firstName;
        }
        
        return 'Usuario';
    }

    get hasRequests(): boolean {
        return this.recentRequests.length > 0;
    }

    get hasBenefits(): boolean {
        return this.benefits.length > 0;
    }

    getBenefitTypeLabel(type: string): string {
        return getBenefitTypeLabel(type as any);
    }

    getRequestTypeLabel(type: RequestType, details?: any): string {
        // Si es un beneficio, mostrar el tipo específico de beneficio
        if (type === RequestType.BENEFIT && details?.benefitType) {
            return this.getBenefitTypeLabel(details.benefitType);
        }
        
        const labels: Record<RequestType, string> = {
            [RequestType.VACATION]: 'Vacaciones',
            [RequestType.DOCUMENT]: 'Documento',
            [RequestType.MEETING]: 'Reunión',
            [RequestType.BENEFIT]: 'Beneficio',
            [RequestType.BIRTHDAY]: 'Cumpleaños',
            [RequestType.ORDINARY_PERMISSION]: 'Permiso Ordinario',
            [RequestType.SICK_LEAVE]: 'Incapacidad',
            [RequestType.MEDICAL_APPOINTMENT]: 'Cita Médica',
            [RequestType.COMPENSATED_TIME_ACCUMULATION]: 'Acumulación Tiempo Comp.',
            [RequestType.COMPENSATED_TIME_USAGE]: 'Uso Tiempo Comp.',
            [RequestType.ENERGYZE_DAY_ACCUMULATION]: 'Acumulación Día Energyze',
            [RequestType.ENERGYZE_DAY_USAGE]: 'Uso Día Energyze',
            [RequestType.GIFTED_DAY_USAGE]: 'Días Obsequiados por Servicios',
        };
        return labels[type] || type;
    }

    getRequestStatusLabel(status: RequestStatus): string {
        const labels: Record<RequestStatus, string> = {
            [RequestStatus.PENDING]: 'Pendiente',
            [RequestStatus.APPROVED]: 'Aprobada',
            [RequestStatus.REJECTED]: 'Rechazada',
            [RequestStatus.CANCELLED]: 'Cancelada',
        };
        return labels[status] || status;
    }

    getRequestStatusColor(status: RequestStatus): string {
        const colors: Record<RequestStatus, string> = {
            [RequestStatus.PENDING]: 'warning',
            [RequestStatus.APPROVED]: 'success',
            [RequestStatus.REJECTED]: 'danger',
            [RequestStatus.CANCELLED]: 'medium',
        };
        return colors[status] || 'medium';
    }

    formatRequestDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        
        return date.toLocaleDateString('es-MX', { 
            day: 'numeric', 
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }

    loadActiveContract() {
        this.isLoadingContract = true;
        this.contractsService.getMyActiveContract().subscribe({
            next: (contract) => {
                this.activeContract = contract;
                this.isLoadingContract = false;
            },
            error: (error) => {
                console.error('Error loading active contract:', error);
                this.isLoadingContract = false;
            }
        });
    }

    get contractTypeLabel(): string {
        if (!this.activeContract) return '—';
        const labels: Record<ContractType, string> = {
            [ContractType.INDEFINITE_TERM]: 'Término Indefinido',
            [ContractType.FIXED_TERM]: 'Término Fijo',
            [ContractType.SERVICE_PROVISION_OVER_ONE_MONTH]: 'Prestación de Servicios > 1 mes',
            [ContractType.SERVICE_PROVISION_UNDER_ONE_MONTH]: 'Prestación de Servicios < 1 mes',
        };
        return labels[this.activeContract.type] || this.activeContract.type;
    }

    get contractPayrollLabel(): string {
        if (!this.activeContract) return '—';
        const labels: Record<PayrollGroup, string> = {
            [PayrollGroup.OPERATIVE]: 'Operativa',
            [PayrollGroup.ADMINISTRATIVE]: 'Administrativa',
        };
        return labels[this.activeContract.payrollGroup] || this.activeContract.payrollGroup;
    }

    get contractSalaryLabel(): string {
        const memo = (this.activeContract as any)?.currentMemorandum;
        if (!memo) return '—';
        if (memo.salaryType === SalaryType.PARAMETER) {
            return memo.salaryAmount
                ? this.formatCurrency(memo.salaryAmount)
                : 'Salario mínimo';
        }
        return memo.salaryAmount ? this.formatCurrency(memo.salaryAmount) : '—';
    }

    get contractPositionLabel(): string {
        const memo = (this.activeContract as any)?.currentMemorandum;
        return memo?.position?.name || '—';
    }

    get contractDepartmentLabel(): string {
        const memo = (this.activeContract as any)?.currentMemorandum;
        return memo?.department?.name || '—';
    }

    get contractStartDateLabel(): string {
        if (!this.activeContract?.startDate) return '—';
        return new Date(this.activeContract.startDate).toLocaleDateString('es-CO', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
}
