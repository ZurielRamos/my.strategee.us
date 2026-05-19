import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class ResetPasswordPage implements OnInit {
  resetForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  private token: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.showToast('Token inválido o expirado. Por favor, solicita un nuevo enlace.', 'danger');
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  get passwordCtrl() { return this.resetForm.get('password')!; }
  get confirmCtrl() { return this.resetForm.get('confirmPassword')!; }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onSubmit() {
    if (this.resetForm.invalid || !this.token) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando contraseña...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });
    await loading.present();
    this.isLoading = true;

    const { password } = this.resetForm.value;

    this.authService.resetPassword(this.token, password).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isLoading = false;
        await this.showToast('Contraseña actualizada correctamente.', 'success');
        await this.router.navigate(['/auth/login'], { replaceUrl: true });
      },
      error: async (err) => {
        await loading.dismiss();
        this.isLoading = false;
        
        const errorMessage = err.message || 'Error al restablecer la contraseña';
        
        // Si el error es por token inválido o expirado, redirigir a forgot-password
        if (errorMessage.toLowerCase().includes('token') || 
            errorMessage.toLowerCase().includes('expirado') ||
            errorMessage.toLowerCase().includes('invalid') ||
            errorMessage.toLowerCase().includes('expired')) {
          await this.showToast('El enlace ha expirado o es inválido. Por favor, solicita uno nuevo.', 'danger');
          await this.router.navigate(['/auth/forgot-password'], { replaceUrl: true });
        } else {
          await this.showToast(errorMessage, 'danger');
        }
      }
    });
  }

  private async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'top',
      color,
      cssClass: 'auth-toast'
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
