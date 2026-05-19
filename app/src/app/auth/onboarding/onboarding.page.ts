import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
    selector: 'app-onboarding',
    templateUrl: './onboarding.page.html',
    styleUrls: ['./onboarding.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule]
})
export class OnboardingPage {
    constructor(private router: Router) { }

    goToLogin() {
        this.router.navigate(['/auth/login']);
    }
}
