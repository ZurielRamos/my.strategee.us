import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonFab,
    IonFabButton
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, timeOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ScheduleCardComponent } from './components/schedule-card/schedule-card.component';
import { SchedulesService } from './services/schedules.service';
import { Schedule } from './models/schedule.model';
import { ScheduleModalComponent } from './components/schedule-modal/schedule-modal.component';

@Component({
    selector: 'app-schedules',
    templateUrl: './schedules.page.html',
    styleUrls: ['./schedules.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonFab,
        IonFabButton,
        PageHeaderComponent,
        ScheduleCardComponent
    ]
})
export class SchedulesPage implements OnInit {
    schedules: Schedule[] = [];
    filteredSchedules: Schedule[] = [];
    isLoading = false;
    searchTerm = '';

    constructor(
        private schedulesService: SchedulesService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {
        addIcons({ addOutline, timeOutline });
    }

    ngOnInit() {
        this.loadSchedules();
    }

    loadSchedules() {
        this.isLoading = true;
        this.schedulesService.getAll().subscribe({
            next: (data) => {
                this.schedules = data;
                this.filterSchedules();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading schedules:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        this.filterSchedules();
    }

    filterSchedules() {
        if (!this.searchTerm.trim()) {
            this.filteredSchedules = [...this.schedules];
        } else {
            const term = this.searchTerm.toLowerCase().trim();
            this.filteredSchedules = this.schedules.filter(schedule =>
                schedule.name.toLowerCase().includes(term) ||
                schedule.description?.toLowerCase().includes(term)
            );
        }
    }

    async openViewModal(schedule: Schedule) {
        const modal = await this.modalCtrl.create({
            component: ScheduleModalComponent,
            componentProps: {
                schedule,
                mode: 'view'
            },
            cssClass: 'schedule-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'delete' && data) {
            this.confirmDelete(data);
        } else if (role === 'toggleActive' && data) {
            this.toggleActive(data);
        } else if (role === 'save' && data) {
            this.updateSchedule(schedule.id, data);
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: ScheduleModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'schedule-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'create' && data) {
            this.createSchedule(data);
        }
    }

    createSchedule(scheduleData: any) {
        this.schedulesService.create(scheduleData).subscribe({
            next: () => {
                this.loadSchedules();
            },
            error: (error) => {
                console.error('Error creating schedule:', error);
            }
        });
    }

    updateSchedule(id: string, scheduleData: any) {
        this.schedulesService.update(id, scheduleData).subscribe({
            next: () => {
                this.loadSchedules();
            },
            error: (error) => {
                console.error('Error updating schedule:', error);
            }
        });
    }

    toggleActive(schedule: Schedule) {
        this.schedulesService.toggleActive(schedule.id).subscribe({
            next: () => {
                this.loadSchedules();
            },
            error: (error) => {
                console.error('Error toggling schedule status:', error);
            }
        });
    }

    async confirmDelete(schedule: Schedule) {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar el horario "${schedule.name}"? Esta acción no se puede deshacer.`,
            cssClass: 'custom-alert',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                    cssClass: 'alert-button-cancel'
                },
                {
                    text: 'Eliminar',
                    role: 'destructive',
                    cssClass: 'alert-button-delete',
                    handler: () => {
                        this.deleteSchedule(schedule.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteSchedule(id: string) {
        this.schedulesService.delete(id).subscribe({
            next: () => {
                this.loadSchedules();
            },
            error: (error) => {
                console.error('Error deleting schedule:', error);
            }
        });
    }
}
