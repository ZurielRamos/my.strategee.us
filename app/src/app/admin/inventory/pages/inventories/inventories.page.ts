import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    addOutline,
    cubeOutline,
    toggleOutline,
    chevronForwardOutline,
    personOutline,
    filterOutline,
    alertCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { InventoryModalComponent } from '../../components/inventory-modal/inventory-modal.component';
import { Inventory } from '../../models';
import { ToastService } from '../../../../shared/services/toast.service';

interface FilterOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-inventories',
    templateUrl: './inventories.page.html',
    styleUrls: ['./inventories.page.scss'],
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
        IonSelect,
        IonSelectOption,
        PageHeaderComponent
    ]
})
export class InventoriesPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    inventories: Inventory[] = [];
    isLoading = false;
    isLoadingMore = false;
    hasError = false;

    currentPage = 1;
    totalPages = 1;
    limit = 20;

    searchTerm = '';
    selectedTypeId = '';
    selectedSupplierId = '';

    typeOptions: FilterOption[] = [];
    supplierOptions: FilterOption[] = [];

    private searchTimeout: any;

    constructor(
        private inventoryAdminService: InventoryAdminService,
        private toastService: ToastService,
        private router: Router,
        private modalCtrl: ModalController
    ) {
        addIcons({ addOutline, cubeOutline, toggleOutline, chevronForwardOutline, personOutline, filterOutline, alertCircleOutline, refreshOutline });
    }

    ngOnInit() {
        this.loadFilters();
        this.loadInventories();
    }

    loadFilters() {
        this.inventoryAdminService.getTypeInventories(1, 100).subscribe({
            next: (response) => {
                this.typeOptions = [
                    { value: '', label: 'Todos los tipos' },
                    ...response.data.map(t => ({ value: t.id, label: t.name }))
                ];
            }
        });

        this.inventoryAdminService.getSuppliers(1, 100).subscribe({
            next: (response) => {
                this.supplierOptions = [
                    { value: '', label: 'Todos los proveedores' },
                    ...response.data.map(s => ({ value: s.id, label: s.name }))
                ];
            }
        });
    }

    loadInventories(append: boolean = false) {
        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
            this.hasError = false;
            this.inventories = [];
            this.currentPage = 1;
        }

        this.inventoryAdminService.getInventories(
            this.currentPage,
            this.limit,
            this.searchTerm,
            this.selectedTypeId || undefined,
            this.selectedSupplierId || undefined
        ).subscribe({
            next: (response) => {
                if (append) {
                    this.inventories = [...this.inventories, ...response.data];
                } else {
                    this.inventories = response.data;
                }
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
                this.isLoadingMore = false;
            },
            error: (error) => {
                console.error('Error loading inventories:', error);
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
            this.loadInventories();
        }, 500);
    }

    onTypeFilterChange(event: any) {
        this.selectedTypeId = event.detail.value ?? '';
        this.loadInventories();
    }

    onSupplierFilterChange(event: any) {
        this.selectedSupplierId = event.detail.value ?? '';
        this.loadInventories();
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
            this.loadInventories(true);
        }
    }

    navigateToDetail(inventory: Inventory) {
        this.router.navigate(['/admin/inventory/assets', inventory.id]);
    }

    async navigateToCreate() {
        const modal = await this.modalCtrl.create({
            component: InventoryModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'inventory-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadInventories();
        }
    }

    toggleStatus(inventory: Inventory, event: Event) {
        event.stopPropagation();

        if (inventory.allocation) {
            this.toastService.error('No se puede cambiar el estado de un activo con asignación activa');
            return;
        }

        this.inventoryAdminService.toggleInventoryStatus(inventory.id).subscribe({
            next: (updated) => {
                const index = this.inventories.findIndex(i => i.id === updated.id);
                if (index !== -1) {
                    this.inventories[index] = updated;
                }
                const status = updated.isActive ? 'activado' : 'desactivado';
                this.toastService.success(`Activo ${status} correctamente`);
            },
            error: async (error) => {
                console.error('Error toggling status:', error);
                await this.toastService.error('Error al cambiar el estado del activo');
            }
        });
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    getEmployeeName(inventory: Inventory): string | null {
        if (inventory.allocation?.employee) {
            const emp = inventory.allocation.employee;
            return emp.firstName
                ? `${emp.firstName} ${emp.lastName || ''}`.trim()
                : emp.name || 'Empleado asignado';
        }
        return null;
    }
}
