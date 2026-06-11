import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonButton,
  AlertController,
  LoadingController,
  PopoverController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  timeOutline,
  personOutline,
  businessOutline,
  folderOutline,
  peopleOutline,
  checkmarkCircleOutline,
  checkmarkCircle,
  ellipseOutline,
  documentTextOutline,
  mailOutline,
  arrowForwardOutline,
  alertCircleOutline,
  createOutline,
  sendOutline,
  trashOutline,
  ellipsisVerticalOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MinutesService } from '../services/minutes.service';
import { MinuteDetail } from '../models/minute.model';
import { ToastService } from '../../../shared/services/toast.service';
import { MinuteActionsPopoverComponent } from '../components/minute-actions-popover/minute-actions-popover.component';

@Component({
  selector: 'app-minute-detail',
  templateUrl: './minute-detail.page.html',
  styleUrls: ['./minute-detail.page.scss'],
  standalone: true,
  providers: [PopoverController],
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonButton,
    PageHeaderComponent,
  ],
})
export class MinuteDetailPage implements OnInit {
  detail: MinuteDetail | null = null;
  isLoading = true;
  minuteId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private minutesService: MinutesService,
    private toastService: ToastService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private popoverCtrl: PopoverController
  ) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      timeOutline,
      personOutline,
      businessOutline,
      folderOutline,
      peopleOutline,
      checkmarkCircleOutline,
      checkmarkCircle,
      ellipseOutline,
      documentTextOutline,
      mailOutline,
      arrowForwardOutline,
      alertCircleOutline,
      createOutline,
      sendOutline,
      trashOutline,
      ellipsisVerticalOutline,
    });
  }

  ngOnInit() {
    this.minuteId = this.route.snapshot.paramMap.get('id') || '';
    if (this.minuteId) {
      this.loadDetail();
    }
  }

  ionViewWillEnter() {
    // Recargar datos cada vez que la vista se muestra (e.g. volviendo de editar)
    if (this.minuteId) {
      this.loadDetail();
    }
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

  goBack() {
    const backUrl = this.route.snapshot.queryParamMap.get('backUrl');
    if (backUrl) {
      this.router.navigateByUrl(backUrl);
    } else {
      this.router.navigate(['/employee/minutes']);
    }
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

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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

  getAssistantName(assistant: any): string {
    if (!assistant?.User) return 'Sin nombre';
    const { firstname, lastname, email, name } = assistant.User;
    if (firstname || lastname) {
      return `${firstname || ''} ${lastname || ''}`.trim();
    }
    if (name && name.trim()) return name.trim();
    return email || 'Sin nombre';
  }

  getAssistantInitials(assistant: any): string {
    const name = this.getAssistantName(assistant);
    if (!name || name === 'Sin nombre') return '?';
    const parts = name.split(' ').filter((p: string) => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  getAssistantTypeLabel(typeUser: string): string {
    return typeUser === '1' ? 'Interno' : 'Externo';
  }

  getAssistantTypeColor(typeUser: string): string {
    return typeUser === '1' ? 'primary' : 'tertiary';
  }

  getCommitmentUserName(commitment: any): string {
    if (!commitment?.User) return 'Sin asignar';
    const { firstname, lastname, name } = commitment.User;
    if (firstname || lastname) {
      return `${firstname || ''} ${lastname || ''}`.trim();
    }
    if (name && name.trim()) return name.trim();
    return 'Sin asignar';
  }

  getCommitmentInitials(commitment: any): string {
    const name = this.getCommitmentUserName(commitment);
    if (!name || name === 'Sin asignar') return '?';
    const parts = name.split(' ').filter((p: string) => p.length > 0);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  // Draft actions
  async toggleActionsMenu(event: Event) {
    const popover = await this.popoverCtrl.create({
      component: MinuteActionsPopoverComponent,
      event: event,
      alignment: 'end',
      size: 'auto',
    });

    await popover.present();

    const { data } = await popover.onWillDismiss();
    if (data?.action) {
      switch (data.action) {
        case 'edit': this.editMinute(); break;
        case 'send': this.sendMinute(); break;
        case 'discard': this.discardMinute(); break;
      }
    }
  }

  editMinute() {
    this.router.navigate(['/employee/minutes', this.minuteId, 'edit']);
  }

  async sendMinute() {
    const alert = await this.alertCtrl.create({
      header: 'Enviar Acta',
      message: '¿Estás seguro de que deseas enviar esta acta? Una vez enviada no podrá ser editada.',
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Sí, enviar',
          role: 'confirm',
          handler: () => this.performSend(),
        },
      ],
    });
    await alert.present();
  }

  private async performSend() {
    const loading = await this.loadingCtrl.create({
      message: 'Enviando acta...',
      spinner: 'crescent',
    });
    await loading.present();

    this.minutesService.sendMinute(this.minuteId).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.toastService.show('Acta enviada exitosamente');
        this.loadDetail(); // Recargar para reflejar el nuevo estado
      },
      error: async (error) => {
        await loading.dismiss();
        await this.toastService.show(error?.error?.message || 'Error al enviar el acta');
      },
    });
  }

  async discardMinute() {
    const alert = await this.alertCtrl.create({
      header: 'Descartar Borrador',
      message: '¿Estás seguro de que deseas descartar este borrador? Esta acción eliminará el acta permanentemente y no se puede deshacer.',
      cssClass: 'custom-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'alert-button-cancel' },
        {
          text: 'Sí, descartar',
          role: 'destructive',
          cssClass: 'alert-button-delete',
          handler: () => this.performDiscard(),
        },
      ],
    });
    await alert.present();
  }

  private async performDiscard() {
    const loading = await this.loadingCtrl.create({
      message: 'Descartando borrador...',
      spinner: 'crescent',
    });
    await loading.present();

    this.minutesService.discardMinute(this.minuteId).subscribe({
      next: async () => {
        await loading.dismiss();
        await this.toastService.show('Borrador descartado');
        this.router.navigate(['/employee/minutes']);
      },
      error: async (error) => {
        await loading.dismiss();
        await this.toastService.show(error?.error?.message || 'Error al descartar el borrador');
      },
    });
  }
}
