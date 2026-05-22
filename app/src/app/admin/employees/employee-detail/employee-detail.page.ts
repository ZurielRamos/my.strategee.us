import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonChip,
    IonLabel,
    IonFabButton,
    PopoverController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    arrowBackOutline,
    createOutline,
    trashOutline,
    mailOutline,
    callOutline,
    calendarOutline,
    cardOutline,
    locationOutline,
    briefcaseOutline,
    cashOutline,
    giftOutline,
    personOutline,
    documentTextOutline,
    cameraOutline,
    timeOutline,
    addCircleOutline,
    eyeOutline,
    eyeOffOutline,
    chevronUpOutline,
    chevronDownOutline,
    ellipsisVerticalOutline,
    keyOutline,
    alertCircleOutline,
} from 'ionicons/icons';
import {
    businessOutline,
    medkitOutline,
    shieldCheckmarkOutline,
    walletOutline,
    peopleOutline,
} from 'ionicons/icons';import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { EmployeesService } from '../services/employees.service';
import { BenefitsService } from '../services/benefits.service';
import { CompensationService } from '../services/compensation.service';
import { ContractsService } from '../services/contracts.service';
import { Employee } from '../models/employee.model';
import { getContractStatusLabel, getMemorandumStatus, getMemorandumStatusLabel } from '../models/contract.model';
import { ModalController, AlertController, LoadingController } from '@ionic/angular/standalone';
import { ModalService } from '../../../shared/services/modal.service';
import { EmployeeModalComponent } from '../components/employee-modal/employee-modal.component';
import { BenefitAllocationModalComponent } from '../components/benefit-allocation-modal/benefit-allocation-modal.component';
import { CompensationModalComponent } from '../components/compensation-modal/compensation-modal.component';
import { CompensationHistoryModalComponent } from '../components/compensation-history-modal/compensation-history-modal.component';
import { ContractHistoryModalComponent } from '../components/contract-history-modal/contract-history-modal.component';
import { ContractModalComponent } from '../components/contract-modal/contract-modal.component';
import { MemorandumModalComponent } from '../components/memorandum-modal/memorandum-modal.component';
import { AttachmentSelectorModalComponent } from '../../../shared/components/attachment-selector-modal/attachment-selector-modal.component';
import { AttachmentType } from '../../../admin/media/models/attachment.model';
import { getGenderLabel } from '../helpers/gender.helper';
import { getBenefitTypeLabel, BenefitType } from '../models/benefit-allocation.model';
import { getCompensationFrequencyLabel, getCompensationConditionLabel, CompensationCondition } from '../models/compensation.model';
import { formatCurrency } from '../../../shared/helpers/currency.helper';
import { EmployeeActionsPopoverComponent } from '../components/employee-actions-popover/employee-actions-popover.component';
import { BenefitActionsPopoverComponent } from '../components/benefit-actions-popover/benefit-actions-popover.component';
import { CompensationActionsPopoverComponent } from '../components/compensation-actions-popover/compensation-actions-popover.component';
import { VacationAdjustmentModalComponent } from '../components/vacation-adjustment-modal/vacation-adjustment-modal.component';
import { CompensatedTimeAdjustmentModalComponent } from '../components/compensated-time-adjustment-modal/compensated-time-adjustment-modal.component';
import { GiftedDaysAdjustmentModalComponent } from '../components/gifted-days-adjustment-modal/gifted-days-adjustment-modal.component';
import { VacationsService } from '../../../employee/requests/services/vacations.service';
import { CompensatedTimeService } from '../../../employee/requests/services/compensated-time.service';
import { EnergyzeDaysService } from '../../../shared/services/energyze-days.service';
import { GiftedDaysAdminService } from '../../../shared/services/gifted-days-admin.service';
import { VacationBalance } from '../../../employee/requests/models/vacation-balance.model';
import { CompensatedTimeBalance } from '../../../employee/requests/models/compensated-time-balance.model';
import { AuditHistoryModalComponent } from '../../../shared/components/audit-history-modal/audit-history-modal.component';
import { EmergencyContactsService } from '../../../shared/services/emergency-contacts.service';
import { EmergencyContact } from '../../../shared/models/emergency-contact.model';
import { ContactInfoLog } from '../services/employees.service';
import { ParafiscalesService } from '../services/parafiscales.service';
import { ParafiscalesModalComponent } from '../components/parafiscales-modal/parafiscales-modal.component';
import { EmployeeParafiscales } from '../models/parafiscales.model';

@Component({
    selector: 'app-employee-detail',
    templateUrl: './employee-detail.page.html',
    styleUrls: ['./employee-detail.page.scss'],
    standalone: true,
    providers: [PopoverController, ModalController, AlertController, LoadingController],
    imports: [
        CommonModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonBadge,
        IonChip,
        IonLabel,
        IonFabButton,
        PageHeaderComponent
    ]
})
export class EmployeeDetailPage implements OnInit {
    employee: Employee | null = null;
    isLoading = false;
    employeeId: string = '';
    showSalary = false;
    showMemorandumsHistory = false;
    vacationBalance: VacationBalance | null = null;
    compensatedTimeBalance: CompensatedTimeBalance | null = null;
    giftedDaysBalance: number = 0;

    emergencyContacts: EmergencyContact[] = [];
    isLoadingEmergencyContacts = false;

    contactInfoLogs: ContactInfoLog[] = [];
    isLoadingContactLogs = false;

    parafiscales: EmployeeParafiscales | null = null;
    isLoadingParafiscales = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private http: HttpClient,
        private employeesService: EmployeesService,
        private benefitsService: BenefitsService,
        private compensationService: CompensationService,
        private contractsService: ContractsService,
        private modalCtrl: ModalController,
        private modalService: ModalService,
        private alertCtrl: AlertController,
        private popoverCtrl: PopoverController,
        private loadingCtrl: LoadingController,
        private vacationsService: VacationsService,
        private compensatedTimeService: CompensatedTimeService,
        private energyzeDaysService: EnergyzeDaysService,
        private giftedDaysAdminService: GiftedDaysAdminService,
        private emergencyContactsService: EmergencyContactsService,
        private parafiscalesService: ParafiscalesService,
    ) {
        addIcons({
            arrowBackOutline,
            createOutline,
            trashOutline,
            mailOutline,
            callOutline,
            calendarOutline,
            cardOutline,
            locationOutline,
            briefcaseOutline,
            cashOutline,
            giftOutline,
            personOutline,
            documentTextOutline,
            cameraOutline,
            timeOutline,
            addCircleOutline,
            eyeOutline,
            eyeOffOutline,
            chevronUpOutline,
            chevronDownOutline,
            ellipsisVerticalOutline,
            keyOutline,
            alertCircleOutline,
            businessOutline,
            medkitOutline,
            shieldCheckmarkOutline,
            walletOutline,
            peopleOutline,
        });
    }

    ngOnInit() {
        this.employeeId = this.route.snapshot.paramMap.get('id') || '';
        if (this.employeeId) {
            this.loadEmployee();
            this.loadEmergencyContacts();
            this.loadContactInfoLogs();
            this.loadParafiscales();
        }
    }

    loadEmployee() {
        this.isLoading = true;
        this.employeesService.getEmployeeById(this.employeeId).subscribe({
            next: (data) => {
                this.employee = data;
                this.isLoading = false;
                // Cargar balance de vacaciones
                this.loadVacationBalance();
            },
            error: (error) => {
                console.error('Error loading employee:', error);
                this.isLoading = false;
            }
        });
    }

    loadEmergencyContacts() {
        this.isLoadingEmergencyContacts = true;
        this.emergencyContactsService.getByEmployee(this.employeeId).subscribe({
            next: (contacts) => {
                this.emergencyContacts = contacts;
                this.isLoadingEmergencyContacts = false;
            },
            error: (err) => {
                console.error('Error loading emergency contacts:', err);
                this.isLoadingEmergencyContacts = false;
            }
        });
    }

    loadContactInfoLogs() {
        this.isLoadingContactLogs = true;
        this.employeesService.getContactInfoLogs(this.employeeId).subscribe({
            next: (logs) => {
                this.contactInfoLogs = logs;
                this.isLoadingContactLogs = false;
            },
            error: (err) => {
                console.error('Error loading contact info logs:', err);
                this.isLoadingContactLogs = false;
            },
        });
    }

    loadParafiscales() {
        this.isLoadingParafiscales = true;
        this.parafiscalesService.getByEmployee(this.employeeId).subscribe({
            next: (data) => {
                this.parafiscales = data;
                this.isLoadingParafiscales = false;
            },
            error: (err) => {
                console.error('Error loading parafiscales:', err);
                this.isLoadingParafiscales = false;
            },
        });
    }

    async editParafiscales() {
        const result = await this.modalService.open(
            ParafiscalesModalComponent,
            {
                employeeId: this.employeeId,
                employeeName: this.fullName,
                current: this.parafiscales,
            },
        );

        if (result.role === 'save') {
            this.loadParafiscales();
        }
    }

    formatLogDate(dateStr: string): string {
        return new Date(dateStr).toLocaleString('es-CO', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    loadVacationBalance(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.vacationsService.getEmployeeBalance(this.employeeId).subscribe({
                next: (balance) => {
                    this.vacationBalance = balance;
                    console.log('Vacation balance loaded:', balance);
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading vacation balance:', error);
                    reject(error);
                }
            });
        });
    }

    goBack() {
        this.router.navigate(['/admin/employees']);
    }

    async openEditModal() {
        if (!this.employee) return;

        const modal = await this.modalCtrl.create({
            component: EmployeeModalComponent,
            componentProps: {
                employee: this.employee,
                mode: 'edit'
            },
            cssClass: 'employee-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadEmployee();
        }
    }


    async confirmDelete() {
        if (!this.employee) return;

        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar a "${this.employee.firstName} ${this.employee.lastName}"? Esta acción no se puede deshacer.`,
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
                    handler: () => {
                        this.deleteEmployee();
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteEmployee() {
        this.employeesService.delete(this.employeeId).subscribe({
            next: () => {
                this.goBack();
            },
            error: (error) => {
                console.error('Error deleting employee:', error);
            }
        });
    }

    get fullName(): string {
        return this.employee ? `${this.employee.firstName} ${this.employee.lastName}` : '';
    }

    get age(): number {
        if (!this.employee?.birthDate) return 0;
        
        const today = new Date();
        
        // Parsear la fecha de nacimiento sin conversión de zona horaria
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

    get contractsCount(): number {
        return this.employee?.contracts?.length || 0;
    }

    get compensationsCount(): number {
        return this.employee?.compensations?.length || 0;
    }

    get benefitsCount(): number {
        return this.employee?.benefitAllocations?.length || 0;
    }

    get activeContract(): any {
        return this.employee?.contract || null;
    }

    get hasActiveContract(): boolean {
        return !!this.employee?.contract;
    }

    get activeCompensations(): any[] {
        return this.employee?.compensations || [];
    }

    get hasCompensations(): boolean {
        return this.activeCompensations.length > 0;
    }

    get benefitAllocations(): any[] {
        return this.employee?.benefitAllocations || [];
    }

    get hasBenefits(): boolean {
        return this.benefitAllocations.length > 0;
    }

    get allContracts(): any[] {
        return this.employee?.contracts || [];
    }

    get hasContracts(): boolean {
        return this.allContracts.length > 0;
    }

    formatDate(date: string | Date): string {
        if (!date) return '-';
        
        // Convertir a string y extraer solo la parte de la fecha (YYYY-MM-DD)
        const dateStr = String(date);
        const datePart = dateStr.split('T')[0];
        
        // Parsear la fecha sin conversión de zona horaria
        const [year, month, day] = datePart.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        
        return localDate.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async openPhotoSelector() {
        const modal = await this.modalCtrl.create({
            component: AttachmentSelectorModalComponent,
            componentProps: {
                selectedAttachmentId: this.employee?.profilePhoto?.id,
                filterType: AttachmentType.IMAGE,
                title: 'Seleccionar Foto de Perfil',
                allowUpload: true,
                uploadButtonText: 'Subir Nueva Foto'
            },
            cssClass: 'attachment-selector-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'selected' && data) {
            this.updateProfilePhotoFromAttachment(data.id);
        }
    }

    updateProfilePhotoFromAttachment(attachmentId: string) {
        this.employeesService.updateProfilePhoto(this.employeeId, attachmentId).subscribe({
            next: () => {
                this.loadEmployee();
            },
            error: (error: any) => {
                console.error('Error updating profile photo:', error);
            }
        });
    }

    get profilePhotoUrl(): string {
        return this.employee?.profilePhoto?.url || '';
    }

    get hasProfilePhoto(): boolean {
        return !!this.employee?.profilePhoto;
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

    getCompensationConditionLabel(condition: string): string {
        return getCompensationConditionLabel(condition as CompensationCondition);
    }

    hasCompensationCondition(compensation: any): boolean {
        return compensation.condition && compensation.condition !== CompensationCondition.NONE;
    }

    formatCurrency(amount: number | string | null | undefined): string {
        return formatCurrency(amount);
    }

    getContractStatusLabel(status: string): string {
        return getContractStatusLabel(status as any);
    }

    toggleSalaryVisibility() {
        this.showSalary = !this.showSalary;
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
        const status = getMemorandumStatus(memo);
        return getMemorandumStatusLabel(status);
    }

    getMemorandumStatusColor(memo: any): string {
        const status = getMemorandumStatus(memo);
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'EXPIRED':
                return 'medium';
            default:
                return 'medium';
        }
    }

    /**
     * Determina si un memorando es el activo actual
     * Solo el memorando con la fecha de inicio más reciente que ya haya comenzado
     * se considera activo, independientemente de si hay otros memorandos vigentes
     */
    isActiveMemorandum(memo: any): boolean {
        if (!this.activeContract?.memorandums || this.activeContract.memorandums.length === 0) {
            return false;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación de fechas

        // Filtrar memorandos que ya han comenzado
        const startedMemorandums = this.activeContract.memorandums.filter((m: any) => {
            const startDate = new Date(m.startDate);
            startDate.setHours(0, 0, 0, 0);
            
            // Debe haber comenzado
            return startDate <= now;
        });

        // Si no hay memorandos que hayan comenzado, ninguno es activo
        if (startedMemorandums.length === 0) {
            return false;
        }

        // Ordenar por fecha de inicio descendente y tomar el más reciente
        const sortedStarted = startedMemorandums.sort((a: any, b: any) => 
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );

        // El activo es el más reciente que ya comenzó
        return sortedStarted[0].id === memo.id;
    }

    /**
     * Obtiene el estado visual del memorando para el badge
     */
    getMemorandumDisplayStatus(memo: any): 'ACTIVE' | 'PENDING' | 'EXPIRED' {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const startDate = new Date(memo.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = memo.endDate ? new Date(memo.endDate) : null;
        if (endDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        // Si es el memorando activo (el más reciente que ya comenzó)
        if (this.isActiveMemorandum(memo)) {
            return 'ACTIVE';
        }

        // Si aún no ha comenzado
        if (startDate > now) {
            return 'PENDING';
        }

        // Si ya expiró o fue reemplazado por uno más reciente
        return 'EXPIRED';
    }

    /**
     * Obtiene el color del badge según el estado del memorando
     */
    getMemorandumDisplayStatusColor(memo: any): string {
        const status = this.getMemorandumDisplayStatus(memo);
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
                return 'warning';
            case 'EXPIRED':
                return 'medium';
            default:
                return 'medium';
        }
    }

    /**
     * Obtiene la etiqueta del estado del memorando
     */
    getMemorandumDisplayStatusLabel(memo: any): string {
        const status = this.getMemorandumDisplayStatus(memo);
        return getMemorandumStatusLabel(status);
    }

    async addBenefit() {
        if (!this.employee) return;

        // Obtener los tipos de beneficios ya asignados
        const existingBenefits = this.benefitAllocations.map(b => b.benefitType);

        const result = await this.modalService.open(
            BenefitAllocationModalComponent,
            { 
                employeeId: this.employeeId,
                employeeName: this.fullName,
                existingBenefits: existingBenefits
            }
        );

        if (result.role === 'save') {
            this.loadEmployee();
        }
    }

    async presentBenefitMenu(event: any, benefit: any) {
        const popover = await this.popoverCtrl.create({
            component: BenefitActionsPopoverComponent,
            event: event,
            translucent: false,
            showBackdrop: true,
            cssClass: 'benefit-actions-popover-wrapper',
            componentProps: {
                benefit: benefit
            }
        });

        await popover.present();

        const { data } = await popover.onWillDismiss();
        
        if (data?.action === 'edit') {
            this.editBenefit(data.benefit);
        } else if (data?.action === 'history') {
            this.viewBenefitHistory(data.benefit);
        }
    }

    async presentCompensationMenu(event: any, compensation: any) {
        const popover = await this.popoverCtrl.create({
            component: CompensationActionsPopoverComponent,
            event: event,
            translucent: false,
            showBackdrop: true,
            cssClass: 'compensation-actions-popover-wrapper',
            componentProps: {
                compensation: compensation
            }
        });

        await popover.present();

        const { data } = await popover.onWillDismiss();
        
        if (data?.action === 'edit') {
            this.editCompensation(data.compensation);
        } else if (data?.action === 'history') {
            this.viewCompensationHistory(data.compensation);
        }
    }

    async editCompensation(compensation: any) {
        if (!compensation) return;

        const result = await this.modalService.open(
            CompensationModalComponent,
            { 
                employeeId: this.employeeId,
                compensation: compensation // Pasar la compensación para modo edición
            }
        );

        if (result.role === 'save') {
            this.loadEmployee();
        }
    }

    async viewCompensationHistory(compensation: any) {
        if (!compensation) return;

        const modal = await this.modalCtrl.create({
            component: AuditHistoryModalComponent,
            componentProps: {
                entityName: 'compensations',
                entityId: compensation.id.toString(),
                title: `Historial de ${compensation.concept}`
            },
            cssClass: 'audit-history-modal',
            backdropDismiss: true
        });

        await modal.present();
    }

    async editBenefit(benefit: any) {
        if (!this.employee) return;

        const result = await this.modalService.open(
            BenefitAllocationModalComponent,
            { 
                employeeId: this.employeeId,
                employeeName: this.fullName,
                existingBenefits: this.benefitAllocations
                    .filter(b => b.id !== benefit.id)
                    .map(b => b.benefitType),
                benefit: benefit // Pasar el beneficio para modo edición
            }
        );

        if (result.role === 'save') {
            this.loadEmployee();
        }
    }

    async viewBenefitHistory(benefit: any) {
        if (!benefit) return;

        const modal = await this.modalCtrl.create({
            component: AuditHistoryModalComponent,
            componentProps: {
                entityName: 'benefit_allocations',
                entityId: benefit.id.toString(),
                title: `Historial de ${this.getBenefitTypeLabel(benefit.benefitType)}`
            },
            cssClass: 'audit-history-modal',
            backdropDismiss: true
        });

        await modal.present();
    }

    viewBenefitsHistory() {
        // TODO: Implementar vista de historial de beneficios
        console.log('Ver historial de beneficios para empleado:', this.employeeId);
    }

    async addCompensation() {
        if (!this.employee) return;

        const modal = await this.modalCtrl.create({
            component: CompensationModalComponent,
            componentProps: {
                employeeId: this.employeeId
            },
            cssClass: 'compensation-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadEmployee();
        }
    }


    async showErrorAlert(header: string, message: string) {
        const alert = await this.alertCtrl.create({
            header: header,
            message: message,
            cssClass: 'custom-alert',
            buttons: ['OK']
        });
        await alert.present();
    }

    viewCompensationsHistory() {
        if (!this.employee) return;

        this.modalCtrl.create({
            component: CompensationHistoryModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName
            },
            cssClass: 'compensation-history-modal',
            backdropDismiss: true
        }).then(modal => {
            modal.present();
            modal.onWillDismiss().then(({ role }) => {
                if (role === 'cancelled') {
                    // Recargar empleado si se canceló alguna compensación
                    this.loadEmployee();
                }
            });
        });
    }

    viewContractsHistory() {
        if (!this.employee) return;

        this.modalCtrl.create({
            component: ContractHistoryModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName
            },
            cssClass: 'contract-history-modal',
            backdropDismiss: true
        }).then(modal => {
            modal.present();
            modal.onWillDismiss().then(({ role }) => {
                if (role === 'cancelled' || role === 'activated' || role === 'suspended') {
                    // Recargar empleado si se modificó algún contrato
                    this.loadEmployee();
                }
            });
        });
    }

    addContract() {
        if (!this.employee) return;

        this.modalCtrl.create({
            component: ContractModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName,
                employeeDocumentNumber: this.employee.documentNumber
            },
            cssClass: 'contract-modal',
            backdropDismiss: true
        }).then(modal => {
            modal.present();
            modal.onWillDismiss().then(({ role }) => {
                if (role === 'save') {
                    // El modal ya creó el contrato, solo recargar
                    this.loadEmployee();
                }
            });
        });
    }

    async addMemorandum() {
        if (!this.employee || !this.activeContract) return;

        const result = await this.modalService.open(
            MemorandumModalComponent,
            {
                contractId: this.activeContract.id,
                employeeName: this.fullName,
                contractType: this.activeContract.type
            }
        );

        if (result.role === 'save') {
            // Modal already handled the API call and showed toast
            // Just reload the employee data
            this.loadEmployee();
        }
    }

    async confirmDeleteMemorandum(memo: any) {
        const alert = await this.alertCtrl.create({
            header: 'Eliminar Memorando',
            message: `¿Está seguro de eliminar este memorando pendiente? Esta acción no se puede deshacer.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Sí, Eliminar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.deleteMemorandum(memo.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteMemorandum(memorandumId: string) {
        this.contractsService.deleteMemorandum(memorandumId).subscribe({
            next: () => {
                this.loadEmployee();
            },
            error: (error) => {
                console.error('Error deleting memorandum:', error);
            }
        });
    }

    async presentPopover(event: any) {
        const popover = await this.popoverCtrl.create({
            component: EmployeeActionsPopoverComponent,
            event: event,
            translucent: false,
            showBackdrop: true,
            cssClass: 'employee-actions-popover-wrapper',
            componentProps: {
                hasCredentials: !!this.employee?.user && this.employee.user.isActive !== false,
                birthDate: this.employee?.birthDate,
                hasLaborContract: this.activeContract?.type === 'Término Indefinido' || this.activeContract?.type === 'Término Fijo',
                hasServiceContract: !this.activeContract ||
                    this.activeContract?.type === 'Prestación de servicios superior a un mes' ||
                    this.activeContract?.type === 'Prestación de servicios inferior a un mes'
            }
        });

        await popover.present();

        const { data } = await popover.onWillDismiss();
        
        if (data?.action === 'edit') {
            this.openEditModal();
        } else if (data?.action === 'create') {
            this.createCredentials();
        } else if (data?.action === 'delete') {
            this.deleteCredentials();
        } else if (data?.action === 'extendBirthday') {
            this.extendBirthday();
        } else if (data?.action === 'adjustVacation') {
            this.adjustVacationDays();
        } else if (data?.action === 'adjustCompensatedTime') {
            this.adjustCompensatedTime();
        } else if (data?.action === 'addEnergyzeSaturday') {
            this.addEnergyzeSaturday();
        } else if (data?.action === 'grantGiftedDays') {
            this.grantGiftedDays();
        }
    }

    async createCredentials() {
        if (!this.employee) return;

        // Verificar que el empleado tenga correo corporativo
        if (!this.employee.corporateEmail) {
            await this.showErrorAlert(
                'Correo Corporativo Requerido',
                'El empleado debe tener un correo corporativo asignado antes de crear credenciales.'
            );
            return;
        }

        // Abrir modal de selección de rol
        const { RoleSelectionModalComponent } = await import('../components/role-selection-modal/role-selection-modal.component');
        
        const modal = await this.modalCtrl.create({
            component: RoleSelectionModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName,
                corporateEmail: this.employee.corporateEmail
            },
            cssClass: 'role-selection-modal'
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();

        if (role === 'save' && data) {
            // Recargar datos del empleado para reflejar las credenciales creadas
            await this.loadEmployee();
        }
    }

    async deleteCredentials() {
        if (!this.employee) return;

        const alert = await this.alertCtrl.create({
            header: 'Eliminar Credenciales',
            message: `¿Está seguro de eliminar las credenciales de acceso de ${this.fullName}? El empleado perderá acceso al sistema.`,
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
                    handler: () => {
                        this.performDeleteCredentials();
                    }
                }
            ]
        });

        await alert.present();
    }

    async performDeleteCredentials() {
        const loading = await this.loadingCtrl.create({
            message: 'Eliminando credenciales...',
            spinner: 'crescent',
            cssClass: 'custom-loading'
        });

        await loading.present();

        this.employeesService.deleteCredentials(this.employeeId).subscribe({
            next: async () => {
                await loading.dismiss();
                await this.loadEmployee();
                const successAlert = await this.alertCtrl.create({
                    header: 'Credenciales Eliminadas',
                    message: 'Las credenciales han sido eliminadas exitosamente.',
                    cssClass: 'custom-alert',
                    buttons: ['OK']
                });
                await successAlert.present();
            },
            error: async (error) => {
                await loading.dismiss();
                console.error('Error deleting credentials:', error);
                const errorMessage = error.error?.message || 'Ocurrió un error al eliminar las credenciales';
                await this.showErrorAlert('Error al Eliminar Credenciales', errorMessage);
            }
        });
    }

    async extendBirthday() {
        if (!this.employee) return;

        const alert = await this.alertCtrl.create({
            header: 'Extender Cumpleaños',
            message: `¿Desea otorgar una extensión de cumpleaños a ${this.fullName}? Esto permitirá que el empleado solicite su medio día de cumpleaños fuera del período normal (cumpleaños + 1 mes).`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Otorgar Extensión',
                    cssClass: 'alert-button-confirm',
                    handler: () => {
                        this.performExtendBirthday();
                    }
                }
            ]
        });

        await alert.present();
    }

    async performExtendBirthday() {
        const loading = await this.loadingCtrl.create({
            message: 'Otorgando extensión...',
            spinner: 'crescent',
            cssClass: 'custom-loading'
        });

        await loading.present();

        // Crear la asignación de beneficio BIRTHDAY_EXTENSION
        const extensionData = {
            employeeId: this.employeeId,
            benefitType: BenefitType.BIRTHDAY_EXTENSION,
            amount: 0.5
        };

        this.benefitsService.setAllocation(extensionData).subscribe({
            next: async () => {
                await loading.dismiss();
                await this.loadEmployee();
                const successAlert = await this.alertCtrl.create({
                    header: 'Extensión Otorgada',
                    message: `Se ha otorgado la extensión de cumpleaños a ${this.fullName}. El empleado ahora puede solicitar su medio día de cumpleaños en cualquier momento.`,
                    cssClass: 'custom-alert',
                    buttons: ['OK']
                });
                await successAlert.present();
            },
            error: async (error) => {
                await loading.dismiss();
                console.error('Error extending birthday:', error);
                const errorMessage = error.error?.message || 'Ocurrió un error al otorgar la extensión';
                await this.showErrorAlert('Error al Otorgar Extensión', errorMessage);
            }
        });
    }

    async adjustVacationDays() {
        if (!this.employee) return;

        // Asegurar que el balance esté cargado
        if (!this.vacationBalance) {
            await this.loadVacationBalance();
            // Esperar un momento para que se complete la carga
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!this.vacationBalance) {
            await this.showErrorAlert('Error', 'No se pudo cargar el balance de vacaciones del empleado.');
            return;
        }

        const modal = await this.modalCtrl.create({
            component: VacationAdjustmentModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName,
                currentBalance: this.vacationBalance.availableBalance
            },
            cssClass: 'vacation-adjustment-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            // Actualizar el balance con la respuesta del backend
            this.vacationBalance = data;
            
            // Recargar el empleado completo
            await this.loadEmployee();
        }
    }

    async adjustCompensatedTime() {
        if (!this.employee) return;

        // Cargar el balance de tiempo compensatorio
        if (!this.compensatedTimeBalance) {
            await this.loadCompensatedTimeBalance();
            // Esperar un momento para que se complete la carga
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!this.compensatedTimeBalance) {
            await this.showErrorAlert('Error', 'No se pudo cargar el balance de tiempo compensatorio del empleado.');
            return;
        }

        const modal = await this.modalCtrl.create({
            component: CompensatedTimeAdjustmentModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName,
                currentBalance: this.compensatedTimeBalance.availableBalance
            },
            cssClass: 'compensated-time-adjustment-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            // Recargar el balance de tiempo compensatorio
            await this.loadCompensatedTimeBalance();
            
            // Recargar el empleado completo
            await this.loadEmployee();
        }
    }

    async loadCompensatedTimeBalance(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.compensatedTimeService.getEmployeeBalance(this.employeeId).subscribe({
                next: (balance) => {
                    this.compensatedTimeBalance = balance;
                    console.log('Compensated time balance loaded:', balance);
                    resolve();
                },
                error: (error) => {
                    console.error('Error loading compensated time balance:', error);
                    reject(error);
                }
            });
        });
    }

    async addEnergyzeSaturday() {
        if (!this.employee) return;

        const alert = await this.alertCtrl.create({
            header: 'Agregar Sábado Energyze',
            message: `¿Desea agregar 1 día Energyze a ${this.fullName}? Esto sumará 1 día disponible a su balance.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Agregar',
                    cssClass: 'alert-button-confirm',
                    handler: () => {
                        this.performAddEnergyzeSaturday();
                    }
                }
            ]
        });

        await alert.present();
    }

    async performAddEnergyzeSaturday() {
        const loading = await this.loadingCtrl.create({
            message: 'Agregando día Energyze...',
            spinner: 'crescent',
            cssClass: 'custom-loading'
        });

        await loading.present();

        const adjustmentData = {
            employeeId: this.employeeId,
            days: 1,
            note: 'Ajuste manual: Sábado Energyze agregado por administrador'
        };

        this.energyzeDaysService.adjustBalance(
            adjustmentData.employeeId,
            adjustmentData.days,
            adjustmentData.note
        ).subscribe({
            next: async () => {
                await loading.dismiss();
                const successAlert = await this.alertCtrl.create({
                    header: 'Día Energyze Agregado',
                    message: `Se ha agregado 1 día Energyze al balance de ${this.fullName}.`,
                    cssClass: 'custom-alert',
                    buttons: ['OK']
                });
                await successAlert.present();
            },
            error: async (error) => {
                await loading.dismiss();
                console.error('Error adding energyze day:', error);
                const errorMessage = error.error?.message || 'Ocurrió un error al agregar el día Energyze';
                await this.showErrorAlert('Error al Agregar Día Energyze', errorMessage);
            }
        });
    }

    async grantGiftedDays() {
        if (!this.employee) return;

        // Cargar el balance actual de días obsequiados
        try {
            const balance = await this.giftedDaysAdminService
                .getEmployeeBalance(this.employeeId)
                .toPromise();
            this.giftedDaysBalance = balance?.availableDays ?? 0;
        } catch {
            this.giftedDaysBalance = 0;
        }

        const modal = await this.modalCtrl.create({
            component: GiftedDaysAdjustmentModalComponent,
            componentProps: {
                employeeId: this.employeeId,
                employeeName: this.fullName,
                currentBalance: this.giftedDaysBalance
            },
            cssClass: 'vacation-adjustment-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            await this.loadEmployee();
        }
    }

    async performGrantGiftedDays(days: number, note: string) {
        // Kept for backward compatibility — no longer used
    }
}