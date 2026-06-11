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
import { addOutline, createOutline, extensionPuzzleOutline, ellipseOutline, checkmarkCircle, alertCircleOutline, refreshOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InventoryAdminService } from '../../services/inventory-admin.service';
import { AdditionalElement } from '../../models';
import { AdditionalElementModalComponent } from '../../components/additional-element-modal/additional-element-modal.component';

@Component({
    selector: 'app-additional-elements',
    templateUrl: './additional-elements.page.html',
    styleUrls: ['./additional-elements.page.scss'],
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
export class AdditionalElementsPage implements OnInit {
    @ViewChild(IonInfiniteScroll) infiniteScroll!: IonInfiniteScroll;

    items: AdditionalElement[] = [];
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
        addIcons({ addOutline, createOutline, extensionPuzzleOutline, ellipseOutline, checkmarkCircle, alertCircleOutline, refreshOutline });
    }

    ngOnInit() {
        this.loadItems();
    }

    loadItems(append = false) {
        if (!append) {
            this.isLoading = true;
            this.hasError = false;
        }

        this.inventoryService.getAdditionalElements(this.currentPage, this.limit, this.searchTerm).subscribe({
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
                console.error('Error loading additional elements:', error);
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
            component: AdditionalElementModalComponent,
            componentProps: { mode: 'create' },
            cssClass: 'additional-element-modal',
            backdropDismiss: true
        });

        await modal.present();
        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.currentPage = 1;
            this.loadItems();
        }
    }

    async openEditModal(item: AdditionalElement) {
        const modal = await this.modalCtrl.create({
            component: AdditionalElementModalComponent,
            componentProps: { element: item, mode: 'edit' },
            cssClass: 'additional-element-modal',
            backdropDismiss: true
        });

        await modal.present();
        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.currentPage = 1;
            this.loadItems();
        }
    }

    toggleStatus(item: AdditionalElement, event: Event) {
        event.stopPropagation();
        this.inventoryService.toggleAdditionalElementStatus(item.id).subscribe({
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
