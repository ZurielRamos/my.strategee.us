import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline,
    swapHorizontalOutline,
    chevronForwardOutline,
    personOutline,
    cubeOutline,
    alertCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { InventoryAllocation } from '../../models/inventory-allocation.model';
import { AllocationModalComponent } from '../../components/allocation-modal/allocation-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-allocations',
    templateUrl: './allocations.page.html',
    styleUrls: ['./allocations.page.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonFab,
        IonFabButton,
        PageHeaderComponent
    ]
})
export class AllocationsPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    allocations: InventoryAllocation[] = [];
    isLoading = false;
    isLoadingMore = false;
    hasError = false;

    currentPage = 1;
    totalPages = 1;
    limit = 20;

    searchTerm = '';
    private searchTimeout: any;

    constructor(
        private inventoryAdminService: InventoryAdminService,
        private modalCtrl: ModalController,
        private toastService: ToastService,
        private router: Router
    ) {
        addIcons({ addOutline, swapHorizontalOutline, chevronForwardOutline, personOutline, cubeOutline, alertCircleOutline, refreshOutline });
    }

    ngOnInit() {
        this.loadAllocations();
    }

    loadAllocations(append: boolean = false) {
        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
            this.hasError = false;
            this.allocations = [];
            this.currentPage = 1;
        }

        this.inventoryAdminService.getAllocations(this.currentPage, this.limit, this.searchTerm).subscribe({
            next: (response) => {
                if (append) {
                    this.allocations = [...this.allocations, ...response.data];
                } else {
                    this.allocations = response.data;
                }
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
                this.isLoadingMore = false;
            },
            error: (error) => {
                console.error('Error loading allocations:', error);
                this.isLoading = false;
                this.isLoadingMore = false;
                if (!append) {
                    this.hasError = true;
                }
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
            this.loadAllocations();
        }, 500);
    }

    async onScroll(event: any) {
        const scrollElement = await this.content.getScrollElement();
        const scrollTop = scrollElement.scrollTop;
        const scrollHeight = scrollElement.scrollHeight;
        const clientHeight = scrollElement.clientHeight;

        const threshold = scrollHeight * 0.8;

        if (
            scrollTop + clientHeight >= threshold &&
            !this.isLoadingMore &&
            !this.isLoading &&
            this.currentPage < this.totalPages
        ) {
            this.currentPage++;
            this.loadAllocations(true);
        }
    }

    navigateToDetail(allocation: InventoryAllocation) {
        this.router.navigate(['/admin/inventory/allocations', allocation.id]);
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: AllocationModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'allocation-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadAllocations();
        }
    }

    getAssetName(allocation: InventoryAllocation): string {
        return allocation.inventory?.name ?? 'Activo sin nombre';
    }

    getEmployeeName(allocation: InventoryAllocation): string {
        if (allocation.employee) {
            const emp = allocation.employee;
            return emp.firstName
                ? `${emp.firstName} ${emp.lastName || ''}`.trim()
                : emp.name || 'Empleado';
        }
        return 'Empleado no asignado';
    }
}
