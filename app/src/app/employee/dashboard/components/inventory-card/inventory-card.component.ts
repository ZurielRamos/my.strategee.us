import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { laptopOutline } from 'ionicons/icons';
import { InventoryAdminService } from '../../../../admin/inventory/services/inventory-admin.service';
import { InventoryAllocation } from '../../../../admin/inventory/models/inventory-allocation.model';

@Component({
    selector: 'app-inventory-card',
    templateUrl: './inventory-card.component.html',
    styleUrls: ['./inventory-card.component.scss'],
    standalone: true,
    imports: [CommonModule, IonIcon, IonSpinner],
})
export class InventoryCardComponent implements OnInit {
    assets: InventoryAllocation[] = [];
    isLoading = true;

    constructor(private inventoryService: InventoryAdminService) {
        addIcons({ laptopOutline });
    }

    ngOnInit() {
        this.loadAssets();
    }

    loadAssets() {
        this.isLoading = true;
        this.inventoryService.getMyAssignedAssets().subscribe({
            next: (data) => {
                this.assets = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading assigned assets:', error);
                this.assets = [];
                this.isLoading = false;
            },
        });
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }
}
