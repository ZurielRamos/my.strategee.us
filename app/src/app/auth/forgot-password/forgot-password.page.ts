import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class ForgotPasswordPage implements OnInit {
  forgotForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) { }

  ngOnInit() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get emailCtrl() { return this.forgotForm.get('email')!; }

  async onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Enviando enlace...',
      spinner: 'crescent',
      cssClass: 'custom-loading'
    });
    await loading.present();
    this.isLoading = true;

    const { email } = this.forgotForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isLoading = false;
        await this.showToast('Enlace de recuperación enviado. Revisa tu correo.', 'success');
        await this.router.navigate(['/auth/login'], { replaceUrl: true });
      },
      error: async (err) => {
        await loading.dismiss();
        this.isLoading = false;
        await this.showToast(err.message || 'Error al enviar de correo');
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
    this.router.navigate(['/auth/login']);
  }
}
