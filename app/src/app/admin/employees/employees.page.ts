import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    IonItem
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
    addOutline, 
    peopleOutline, 
    keyOutline, 
    documentTextOutline, 
    businessOutline,
    closeCircleOutline 
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmployeesService } from './services/employees.service';
import { CompaniesService, Company } from './services/companies.service';
import { Employee } from './models/employee.model';
import { EmployeeModalComponent } from './components/employee-modal/employee-modal.component';
import { EmployeeCardComponent } from './components/employee-card/employee-card.component';

@Component({
    selector: 'app-employees',
    templateUrl: './employees.page.html',
    styleUrls: ['./employees.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonFab,
        IonFabButton,
        IonSelect,
        IonSelectOption,
        IonItem,
        PageHeaderComponent,
        EmployeeCardComponent
    ]
})
export class EmployeesPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    employees: Employee[] = [];
    companies: Company[] = [];
    isLoading = false;
    isLoadingMore = false;
    searchTerm = '';
    selectedCredentials: any = undefined;
    selectedContractStatus: string | undefined = undefined;
    selectedCompany: string | undefined = undefined;
    
    currentPage = 1;
    totalPages = 1;
    limit = 20;
    searchTimeout: any;

    constructor(
        private employeesService: EmployeesService,
        private companiesService: CompaniesService,
        private modalCtrl: ModalController,
        private router: Router
    ) {
        addIcons({ 
            addOutline, 
            peopleOutline, 
            keyOutline, 
            documentTextOutline, 
            businessOutline,
            closeCircleOutline 
        });
    }

    ngOnInit() {
        this.loadCompanies();
        this.loadEmployees();
    }

    loadCompanies() {
        this.companiesService.getAll().subscribe({
            next: (data) => {
                this.companies = data;
            },
            error: (error) => {
                console.error('Error loading companies:', error);
            }
        });
    }

    loadEmployees(append: boolean = false) {
        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
            this.employees = [];
            this.currentPage = 1;
        }

        // Convertir valores para el backend
        const hasCredentials = this.selectedCredentials === undefined || this.selectedCredentials === null ? undefined : 
                              this.selectedCredentials === true || this.selectedCredentials === 'true' ? true : 
                              this.selectedCredentials === false || this.selectedCredentials === 'false' ? false : 
                              undefined;

        this.employeesService.getAll(
            this.currentPage,
            this.limit,
            this.searchTerm || undefined,
            hasCredentials,
            this.selectedContractStatus,
            this.selectedCompany
        ).subscribe({
            next: (response) => {
                if (append) {
                    this.employees = [...this.employees, ...response.data];
                } else {
                    this.employees = response.data;
                }
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
                this.isLoadingMore = false;
            },
            error: (error) => {
                console.error('Error loading employees:', error);
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.loadEmployees();
        }, 500);
    }

    onFilterChange() {
        this.loadEmployees();
    }

    hasActiveFilters(): boolean {
        return !!(
            this.selectedCredentials !== undefined || 
            this.selectedContractStatus !== undefined || 
            this.selectedCompany !== undefined
        );
    }

    clearFilters() {
        this.selectedCredentials = undefined;
        this.selectedContractStatus = undefined;
        this.selectedCompany = undefined;
        this.loadEmployees();
    }

    async onScroll(event: any) {
        const scrollElement = await this.content.getScrollElement();
        const scrollTop = scrollElement.scrollTop;
        const scrollHeight = scrollElement.scrollHeight;
        const clientHeight = scrollElement.clientHeight;
        
        // Cargar más cuando esté cerca del final (80% del scroll)
        const threshold = scrollHeight * 0.8;
        
        if (scrollTop + clientHeight >= threshold && 
            !this.isLoadingMore && 
            !this.isLoading && 
            this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadEmployees(true);
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: EmployeeModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'employee-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadEmployees();
        }
    }

    viewEmployeeDetail(employee: Employee) {
        this.router.navigate(['/admin/employees', employee.id]);
    }
}
