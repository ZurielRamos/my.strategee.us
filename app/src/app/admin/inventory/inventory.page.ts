import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonRippleEffect
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    layersOutline,
    storefrontOutline,
    hardwareChipOutline,
    laptopOutline,
    extensionPuzzleOutline,
    cubeOutline,
    swapHorizontalOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.page.html',
    styleUrls: ['./inventory.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        IonContent,
        IonGrid,
        IonRow,
        IonCol,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonIcon,
        IonRippleEffect,
        PageHeaderComponent,
        PageTitleComponent
    ]
})
export class InventoryPage {
    constructor() {
        addIcons({
            layersOutline,
            storefrontOutline,
            hardwareChipOutline,
            laptopOutline,
            extensionPuzzleOutline,
            cubeOutline,
            swapHorizontalOutline
        });
    }
}
