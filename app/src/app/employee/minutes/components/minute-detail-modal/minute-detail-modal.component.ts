import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonLabel,
  IonSpinner,
  IonList,
  IonItem,
  IonAvatar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  calendarOutline,
  timeOutline,
  personOutline,
  businessOutline,
  folderOutline,
  peopleOutline,
  checkmarkCircleOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { MinutesService } from '../../services/minutes.service';
import { MinuteDetail } from '../../models/minute.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-minute-detail-modal',
  templateUrl: './minute-detail-modal.component.html',
  styleUrls: ['./minute-detail-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonBadge,
    IonLabel,
    IonSpinner,
    IonList,
    IonItem,
    IonAvatar,
  ],
})
export class MinuteDetailModalComponent implements OnInit {
  @Input() minuteId!: string;

  detail: MinuteDetail | null = null;
  isLoading = true;

  constructor(
    private modalCtrl: ModalController,
    private minutesService: MinutesService,
    private toastService: ToastService
  ) {
    addIcons({
      closeOutline,
      calendarOutline,
      timeOutline,
      personOutline,
      businessOutline,
      folderOutline,
      peopleOutline,
      checkmarkCircleOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {
    this.loadDetail();
  }

  async loadDetail() {
    this.isLoading = true;
    try {
      this.detail = await this.minutesService.getMinuteDetail(this.minuteId).toPromise() || null;
    } catch (error) {
      await this.toastService.show('Error al cargar el detalle del acta');
    } finally {
      this.isLoading = false;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDuration(): string {
    if (!this.detail) return '';
    const start = new Date(this.detail.Contac.start_date);
    const end = new Date(this.detail.Contac.end_date);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
}
