import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, hardwareChipOutline, ellipseOutline, checkmarkCircle, alertCircleOutline, refreshOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { Hardware } from '../../models';
import { HardwareModalComponent } from '../../components/hardware-modal/hardware-modal.component';

@Component({
    selector: 'app-hardwares',
    templateUrl: './hardwares.page.html',
    styleUrls: ['./hardwares.page.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        PageHeaderComponent
    ]
})
export class HardwaresPage implements OnInit {
    @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

    items: Hardware[] = [];
    isLoading = false;
    hasError = false;
    searchTerm = '';

    currentPage = 1;
    totalPages = 1;
    limit = 20;

    constructor(
        private inventoryService: InventoryAdminService,
        private modalCtrl: ModalController
    ) {
        addIcons({ addOutline, createOutline, hardwareChipOutline, ellipseOutline, checkmarkCircle, alertCircleOutline, refreshOutline });
    }

    ngOnInit() {
        this.loadItems();
    }

    loadItems(append = false) {
        if (!append) {
            this.isLoading = true;
            this.hasError = false;
        }

        this.inventoryService.getHardwares(this.currentPage, this.limit, this.searchTerm).subscribe({
            next: (response) => {
                if (append) {
                    this.items = [...this.items, ...response.data];
                } else {
                    this.items = response.data;
                }
                this.totalPages = response.meta.totalPages;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading hardwares:', error);
                this.isLoading = false;
                if (!append) {
                    this.hasError = true;
                }
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        this.currentPage = 1;
        this.loadItems();
    }

    onIonInfinite(event: any) {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadItems(true);
            setTimeout(() => event.target.complete(), 500);
        } else {
            event.target.complete();
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: HardwareModalComponent,
            componentProps: { mode: 'create' },
            cssClass: 'hardware-modal',
            backdropDismiss: true
        });

        await modal.present();
        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.currentPage = 1;
            this.loadItems();
        }
    }

    async openEditModal(item: Hardware) {
        const modal = await this.modalCtrl.create({
            component: HardwareModalComponent,
            componentProps: { hardware: item, mode: 'edit' },
            cssClass: 'hardware-modal',
            backdropDismiss: true
        });

        await modal.present();
        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.currentPage = 1;
            this.loadItems();
        }
    }

    toggleStatus(item: Hardware, event: Event) {
        event.stopPropagation();
        this.inventoryService.toggleHardwareStatus(item.id).subscribe({
            next: (updated) => {
                const index = this.items.findIndex(i => i.id === item.id);
                if (index !== -1) {
                    this.items[index] = updated;
                }
            },
            error: (error) => {
                console.error('Error toggling status:', error);
            }
        });
    }
}
