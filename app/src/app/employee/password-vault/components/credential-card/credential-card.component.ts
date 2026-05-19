import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonIcon, IonAvatar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { globeOutline, personOutline, folderOutline } from 'ionicons/icons';
import { CredentialListItem } from '../../models/credential.model';

@Component({
  selector: 'app-credential-card',
  templateUrl: './credential-card.component.html',
  styleUrls: ['./credential-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonAvatar
  ]
})
export class CredentialCardComponent {
  @Input() credential!: CredentialListItem;
  @Output() cardClick = new EventEmitter<CredentialListItem>();

  constructor() {
    addIcons({ globeOutline, personOutline, folderOutline });
  }

  onCardClick() {
    this.cardClick.emit(this.credential);
  }

  getDisplayTitle(): string {
    return this.credential.title || this.credential.url;
  }

  hasValidLogo(): boolean {
    return !!(this.credential.logo?.url && this.credential.logo.url.trim());
  }
}
