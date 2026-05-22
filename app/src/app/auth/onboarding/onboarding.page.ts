import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
    selector: 'app-onboarding',
    templateUrl: './onboarding.page.html',
    styleUrls: ['./onboarding.page.scss'],
    standalone: true,
    imports: [CommonModule, IonContent, IonButton, IonIcon]
})
export class OnboardingPage {
    constructor(private router: Router) {
        addIcons({ shieldCheckmarkOutline });
    }

    goToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
