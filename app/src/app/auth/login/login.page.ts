import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    standalone: true,
    imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class LoginPage implements OnInit {
    loginForm!: FormGroup;
    showPassword = false;
    isLoading = false;
    step: 'email' | 'password' = 'email';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toastCtrl: ToastController,
        private loadingCtrl: LoadingController
    ) { }

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });

        // Load preferences asynchronously
        Preferences.get({ key: 'rememberedEmail' }).then(({ value }) => {
            if (value) {
                this.loginForm.patchValue({
                    email: value,
                    rememberMe: true
                });
            }
        });
    }

    isCheckingEmail = false;

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    async nextStep() {
        if (this.emailCtrl.invalid) {
            this.emailCtrl.markAsTouched();
            return;
        }

        this.isCheckingEmail = true;
        this.authService.checkEmail(this.emailCtrl.value).subscribe({
            next: () => {
                this.isCheckingEmail = false;
                this.step = 'password';
            },
            error: async () => {
                this.isCheckingEmail = false;
                await this.showToast('Este correo no está registrado');
            }
        });
    }

    async onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const loading = await this.loadingCtrl.create({
            message: 'Iniciando sesión...',
            spinner: 'crescent',
            cssClass: 'custom-loading'
        });
        await loading.present();
        this.isLoading = true;

        const { email, password, rememberMe } = this.loginForm.value;

        if (rememberMe) {
            await Preferences.set({ key: 'rememberedEmail', value: email });
        } else {
            await Preferences.remove({ key: 'rememberedEmail' });
        }

        this.authService.signIn(email, password).subscribe({
            next: async (response) => {
                await loading.dismiss();
                this.isLoading = false;

                const user = response.user;
                const roles = user?.roles || [];

                console.log('Login successful:', { user, roles });

                if (roles.includes('ADMIN')) {
                    console.log('Navigating to admin dashboard');
                    await this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
                } else if (roles.includes('EMPLOYEE')) {
                    console.log('Navigating to employee dashboard');
                    await this.router.navigate(['/employee/dashboard'], { replaceUrl: true });
                } else {
                    console.warn('No matching roles found, staying on login/home context');
                    await this.router.navigate(['/auth/login'], { replaceUrl: true });
                }
            },
            error: async (err) => {
                await loading.dismiss();
                this.isLoading = false;
                await this.showToast(err.message || 'Credenciales inválidas');
            }
        });
    }

    private async showToast(message: string) {
        const toast = await this.toastCtrl.create({
            message,
            duration: 3500,
            position: 'top',
            color: 'danger',
            cssClass: 'auth-toast'
        });
        await toast.present();
    }

    get emailCtrl() { return this.loginForm.get('email')!; }
    get passwordCtrl() { return this.loginForm.get('password')!; }

    goBack() {
        if (this.step === 'password') {
            this.step = 'email';
            this.passwordCtrl.reset();
        } else {
            this.router.navigate(['/auth/onboarding']);
        }
    }

    goToForgotPassword() {
        this.router.navigate(['/auth/forgot-password']);
    }
}
