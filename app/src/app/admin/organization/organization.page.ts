import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonRippleEffect
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { businessOutline, locationOutline, timeOutline, briefcaseOutline, layersOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.page.html',
  styleUrls: ['./organization.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonRippleEffect,
    PageHeaderComponent,
    PageTitleComponent
  ]
})
export class OrganizationPage implements OnInit {

  constructor() {
    addIcons({ businessOutline, locationOutline, timeOutline, briefcaseOutline, layersOutline });
  }

  ngOnInit() {
  }

}
