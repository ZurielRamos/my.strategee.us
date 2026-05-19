import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
    IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle,
    IonItem, IonIcon, IonLabel, IonRouterOutlet, IonBadge, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    gridOutline, gridSharp,
    cubeOutline, cubeSharp,
    settingsOutline, settingsSharp,
    documentTextOutline, documentTextSharp,
    keyOutline, keySharp
} from 'ionicons/icons';
import { UserProfileComponent } from '../../shared/components/user-profile/user-profile.component';

@Component({
    selector: 'app-employee-layout',
    templateUrl: './employee-layout.component.html',
    styleUrls: ['./employee-layout.component.scss'],
    standalone: true,
    imports: [
        CommonModule, RouterLink, RouterLinkActive, IonSplitPane, IonMenu,
        IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, 
        IonRouterOutlet, IonBadge, IonFooter, UserProfileComponent
    ]
})
export class EmployeeLayoutComponent {
    public appPages: Array<{ title: string; url: string; icon: string; badge?: string }> = [
        { title: 'Dashboard', url: '/employee/dashboard', icon: 'grid' },
        { title: 'Solicitudes', url: '/employee/requests', icon: 'document-text' },
        { title: 'Password Vault', url: '/employee/password-vault', icon: 'key' },
        { title: 'Ajustes', url: '/employee/settings', icon: 'settings' }
    ];

    constructor() {
        addIcons({
            gridOutline, gridSharp,
            cubeOutline, cubeSharp,
            settingsOutline, settingsSharp,
            documentTextOutline, documentTextSharp,
            keyOutline, keySharp
        });
    }
}
