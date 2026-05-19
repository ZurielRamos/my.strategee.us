import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToggle,
    ModalController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
    keyOutline,
    notificationsOutline,
    languageOutline,
    moonOutline,
    shieldCheckmarkOutline,
    informationCircleOutline,
    chevronForwardOutline,
    phonePortraitOutline,
    mailOutline
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { AuthService } from '../../auth/services/auth.service';
import { ThemeService } from '../../shared/services/theme.service';
import { Preferences } from '@capacitor/preferences';
import { ChangePasswordModalComponent } from './components/change-password-modal/change-password-modal.component';
import { PushSettingsComponent } from './components/push-settings/push-settings.component';
import { EmployeeSettingsService, EmployeeSettings } from '../services/employee-settings.service';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        IonContent,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonItem,
        IonLabel,
        IonIcon,
        IonToggle,
        PageHeaderComponent,
        PushSettingsComponent
    ],
    providers: [ModalController]
})
export class SettingsPage implements OnInit {
    currentUser: any = null;
    
    // Configuraciones
    emailNotifications = true;
    darkMode = false;

    // Employee settings
    personalEmailNotification = false;
    corporativeEmailNotification = false;
    private employeeId: string | null = null;

    constructor(
        private router: Router,
        private authService: AuthService,
        private themeService: ThemeService,
        private modalCtrl: ModalController,
        private employeeSettingsService: EmployeeSettingsService
    ) {
        addIcons({
            keyOutline,
            notificationsOutline,
            languageOutline,
            moonOutline,
            shieldCheckmarkOutline,
            informationCircleOutline,
            chevronForwardOutline,
            phonePortraitOutline,
            mailOutline
        });
    }

    ngOnInit() {
        this.loadSettings();
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
            this.employeeId = user?.employeeId ?? null;
            if (this.employeeId) {
                this.loadEmployeeSettings();
            }
        });
        
        // Suscribirse al tema actual
        this.themeService.currentTheme$.subscribe(theme => {
            this.darkMode = theme === 'dark';
        });
    }

    async loadSettings() {
        try {
            // Cargar configuraciones de notificaciones desde Preferences
            const emailResult = await Preferences.get({ key: 'email_notifications' });
            
            this.emailNotifications = emailResult.value !== 'false';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    loadEmployeeSettings() {
        if (!this.employeeId) return;
        this.employeeSettingsService.getSettings(this.employeeId).subscribe({
            next: (settings: EmployeeSettings) => {
                this.personalEmailNotification = settings.personalEmailNotification;
                this.corporativeEmailNotification = settings.corporativeEmailNotification;
            },
            error: (err: any) => console.error('Error loading employee settings:', err)
        });
    }

    onPersonalEmailNotificationChange() {
        if (!this.employeeId) return;
        this.employeeSettingsService.updateSettings(this.employeeId, {
            personalEmailNotification: this.personalEmailNotification
        }).subscribe({
            error: (err: any) => console.error('Error updating personal email notification:', err)
        });
    }

    onCorporativeEmailNotificationChange() {
        if (!this.employeeId) return;
        this.employeeSettingsService.updateSettings(this.employeeId, {
            corporativeEmailNotification: this.corporativeEmailNotification
        }).subscribe({
            error: (err: any) => console.error('Error updating corporative email notification:', err)
        });
    }

    async saveNotificationSettings() {
        try {
            await Preferences.set({ 
                key: 'email_notifications', 
                value: this.emailNotifications.toString() 
            });
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    }

    async onEmailNotificationsChange() {
        await this.saveNotificationSettings();
    }

    async onDarkModeChange() {
        const theme = this.darkMode ? 'dark' : 'light';
        await this.themeService.setTheme(theme);
    }

    async changePassword() {
        const modal = await this.modalCtrl.create({
            component: ChangePasswordModalComponent,
            cssClass: 'rounded-modal'
        });

        await modal.present();
    }

    viewPrivacyPolicy() {
        // Navegar a la política de privacidad
        console.log('Ver política de privacidad');
    }

    viewTermsOfService() {
        // Navegar a los términos de servicio
        console.log('Ver términos de servicio');
    }

    get appVersion(): string {
        return '1.0.0';
    }
}
