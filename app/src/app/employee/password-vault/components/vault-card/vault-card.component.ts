import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, folderOutline } from 'ionicons/icons';
import { Vault } from '../../models/vault.model';

@Component({
  selector: 'app-vault-card',
  templateUrl: './vault-card.component.html',
  styleUrls: ['./vault-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon
  ]
})
export class VaultCardComponent {
  @Input() vault!: Vault;
  @Input() isOwner = false;
  @Output() cardClick = new EventEmitter<Vault>();
  @Output() editClick = new EventEmitter<Vault>();
  @Output() deleteClick = new EventEmitter<Vault>();

  constructor() {
    addIcons({ createOutline, trashOutline, folderOutline });
  }

  onCardClick() {
    this.cardClick.emit(this.vault);
  }

  onEditClick(event: Event) {
    event.stopPropagation();
    this.editClick.emit(this.vault);
  }

  onDeleteClick(event: Event) {
    event.stopPropagation();
    this.deleteClick.emit(this.vault);
  }
}
