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
    layersOutline,
    createOutline,
    toggleOutline,
    alertCircleOutline,
    refreshOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { TypeInventory } from '../../models/type-inventory.model';
import { TypeInventoryModalComponent } from '../../components/type-inventory-modal/type-inventory-modal.component';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
    selector: 'app-type-inventories',
    templateUrl: './type-inventories.page.html',
    styleUrls: ['./type-inventories.page.scss'],
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
export class TypeInventoriesPage implements OnInit {
    @ViewChild(IonContent) content!: IonContent;

    typeInventories: TypeInventory[] = [];
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
        private toastService: ToastService
    ) {
        addIcons({ addOutline, layersOutline, createOutline, toggleOutline, alertCircleOutline, refreshOutline });
    }

    ngOnInit() {
        this.loadTypeInventories();
    }

    loadTypeInventories(append: boolean = false) {
        if (append) {
            this.isLoadingMore = true;
        } else {
            this.isLoading = true;
            this.hasError = false;
            this.typeInventories = [];
            this.currentPage = 1;
        }

        this.inventoryAdminService.getTypeInventories(this.currentPage, this.limit, this.searchTerm).subscribe({
            next: (response) => {
                if (append) {
                    this.typeInventories = [...this.typeInventories, ...response.data];
                } else {
                    this.typeInventories = response.data;
                }
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
                this.isLoadingMore = false;
            },
            error: (error) => {
                console.error('Error loading type inventories:', error);
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
            this.loadTypeInventories();
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
            this.loadTypeInventories(true);
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: TypeInventoryModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'type-inventory-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadTypeInventories();
        }
    }

    async openEditModal(typeInventory: TypeInventory) {
        const modal = await this.modalCtrl.create({
            component: TypeInventoryModalComponent,
            componentProps: {
                typeInventory,
                mode: 'edit'
            },
            cssClass: 'type-inventory-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadTypeInventories();
        }
    }

    async toggleStatus(typeInventory: TypeInventory) {
        this.inventoryAdminService.toggleTypeInventoryStatus(typeInventory.id).subscribe({
            next: (updated) => {
                const index = this.typeInventories.findIndex(t => t.id === updated.id);
                if (index !== -1) {
                    this.typeInventories[index] = updated;
                }
                const status = updated.isActive ? 'activado' : 'desactivado';
                this.toastService.success(`Tipo de inventario ${status} correctamente`);
            },
            error: async (error) => {
                console.error('Error toggling status:', error);
                await this.toastService.error('Error al cambiar el estado');
            }
        });
    }
}
