import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-password-display',
  templateUrl: './password-display.component.html',
  styleUrls: ['./password-display.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon
  ]
})
export class PasswordDisplayComponent {
  @Input() password!: string;
  @Input() label = 'Contraseña';
  
  isVisible = false;

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }

  getDisplayValue(): string {
    return this.isVisible ? this.password : '••••••••';
  }

  getIconName(): string {
    return this.isVisible ? 'eye-off-outline' : 'eye-outline';
  }
}
