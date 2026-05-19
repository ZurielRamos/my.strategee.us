import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { globeOutline, calendarOutline } from 'ionicons/icons';
import { GlobalParameter } from '../../models/global-parameter.model';

@Component({
  selector: 'app-global-parameter-card',
  templateUrl: './global-parameter-card.component.html',
  styleUrls: ['./global-parameter-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonIcon,
    IonRippleEffect
  ]
})
export class GlobalParameterCardComponent {
  @Input() parameter!: GlobalParameter;
  @Output() cardClick = new EventEmitter<GlobalParameter>();

  constructor() {
    addIcons({ globeOutline, calendarOutline });
  }
}
