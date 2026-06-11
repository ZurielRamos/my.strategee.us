import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    storefrontOutline,
    ellipsisVerticalOutline,
    createOutline,
    toggleOutline,
    alertCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { Supplier } from '../../models/supplier.model';
import { SupplierModalComponent } from '../../components/supplier-modal/supplier-modal.component';

@Component({
    selector: 'app-suppliers',
    templateUrl: './suppliers.page.html',
    styleUrls: ['./suppliers.page.scss'],
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
export class SuppliersPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    suppliers: Supplier[] = [];
    isLoading = false;
    isLoadingMore = false;
    hasError = false;
    searchTerm = '';

    currentPage = 1;
    totalPages = 1;
    limit = 20;
    searchTimeout: any;

    constructor(
        private inventoryService: InventoryAdminService,
        private modalCtrl: ModalController
    ) {
        addIcons({
            addOutline,
            storefrontOutline,
            ellipsisVerticalOutline,
            createOutline,
            toggleOutline,
            alertCircleOutline,
            refreshOutline
        });
    }

    ngOnInit() {
        this.loadSuppliers();
    }

    loadSuppliers(append = false) {
        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
            this.hasError = false;
            this.suppliers = [];
            this.currentPage = 1;
        }

        this.inventoryService.getSuppliers(this.currentPage, this.limit, this.searchTerm).subscribe({
            next: (response) => {
                if (append) {
                    this.suppliers = [...this.suppliers, ...response.data];
                } else {
                    this.suppliers = response.data;
                }
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
                this.isLoadingMore = false;
            },
            error: (error) => {
                console.error('Error loading suppliers:', error);
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
            this.loadSuppliers();
        }, 500);
    }

    async onScroll(event: any) {
        const scrollElement = await this.content.getScrollElement();
        const scrollTop = scrollElement.scrollTop;
        const scrollHeight = scrollElement.scrollHeight;
        const clientHeight = scrollElement.clientHeight;

        const threshold = scrollHeight * 0.8;

        if (scrollTop + clientHeight >= threshold &&
            !this.isLoadingMore &&
            !this.isLoading &&
            this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadSuppliers(true);
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: SupplierModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'supplier-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadSuppliers();
        }
    }

    async openEditModal(supplier: Supplier) {
        const modal = await this.modalCtrl.create({
            component: SupplierModalComponent,
            componentProps: {
                supplier,
                mode: 'edit'
            },
            cssClass: 'supplier-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadSuppliers();
        }
    }

    toggleStatus(supplier: Supplier) {
        this.inventoryService.toggleSupplierStatus(supplier.id).subscribe({
            next: (updated) => {
                const index = this.suppliers.findIndex(s => s.id === supplier.id);
                if (index !== -1) {
                    this.suppliers[index] = updated;
                }
            },
            error: (error) => {
                console.error('Error toggling supplier status:', error);
            }
        });
    }
}
