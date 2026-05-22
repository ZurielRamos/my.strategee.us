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
import { ModalController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, globeOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PageTitleComponent } from '../../../shared/components/page-title/page-title.component';
import { ToastService } from '../../../shared/services/toast.service';
import { GlobalParametersService } from './services/global-parameters.service';
import { GlobalParameter } from './models/global-parameter.model';
import { GlobalParameterCardComponent } from './components/global-parameter-card/global-parameter-card.component';
import { GlobalParameterModalComponent } from './components/global-parameter-modal/global-parameter-modal.component';

@Component({
    selector: 'app-global-parameters',
    templateUrl: './global-parameters.page.html',
    styleUrls: ['./global-parameters.page.scss'],
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
        PageTitleComponent,
        GlobalParameterCardComponent
    ]
})
export class GlobalParametersPage implements OnInit {
    parameters: GlobalParameter[] = [];
    filteredParameters: GlobalParameter[] = [];
    isLoading = false;
    searchTerm = '';

    constructor(
        private globalParametersService: GlobalParametersService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController,
        private toastService: ToastService
    ) {
        addIcons({ addOutline, globeOutline });
    }

    ngOnInit() {
        this.loadParameters();
    }

    loadParameters() {
        this.isLoading = true;
        this.globalParametersService.getAll().subscribe({
            next: (data) => {
                this.parameters = data;
                this.filterParameters();
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading parameters:', error);
                this.isLoading = false;
            }
        });
    }

    onSearchChange(searchValue: string) {
        this.searchTerm = searchValue;
        this.filterParameters();
    }

    filterParameters() {
        if (!this.searchTerm.trim()) {
            this.filteredParameters = [...this.parameters];
        } else {
            const term = this.searchTerm.toLowerCase().trim();
            this.filteredParameters = this.parameters.filter(param =>
                param.key.toLowerCase().includes(term) ||
                param.value.toString().includes(term)
            );
        }
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: GlobalParameterModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'global-parameter-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            this.createParameter(data);
        }
    }

    async openCreateModalWithKey(key: string) {
        const modal = await this.modalCtrl.create({
            component: GlobalParameterModalComponent,
            componentProps: {
                mode: 'create',
                parameter: { key } as any // Pre-llenar solo la clave
            },
            cssClass: 'global-parameter-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss();
        if (role === 'save' && data) {
            this.createParameter(data);
        }
    }

    createParameter(data: any) {
        this.globalParametersService.create(data).subscribe({
            next: async () => {
                await this.toastService.success('Parámetro creado correctamente');
                this.loadParameters();
            },
            error: async (error) => {
                console.error('Error creating parameter:', error);
                await this.toastService.error(
                    error.message || 'Error al crear el parámetro'
                );
            }
        });
    }

    async openViewModal(parameter: GlobalParameter) {
        // Cargar el historial del parámetro
        this.globalParametersService.getHistory(parameter.key).subscribe({
            next: async (history) => {
                const modal = await this.modalCtrl.create({
                    component: GlobalParameterModalComponent,
                    componentProps: {
                        parameter,
                        mode: 'view',
                        history: history
                    },
                    cssClass: 'global-parameter-modal',
                    backdropDismiss: true
                });

                await modal.present();

                const { data, role } = await modal.onWillDismiss();
                if (role === 'createNew' && data) {
                    // Abrir modal de creación con la clave pre-llenada
                    this.openCreateModalWithKey(data.key);
                } else if (role === 'delete' && data) {
                    this.confirmDelete(data);
                }
            },
            error: (error) => {
                console.error('Error loading history:', error);
            }
        });
    }

    async confirmDelete(parameter: GlobalParameter) {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar el parámetro "${parameter.key}"? Esta acción no se puede deshacer.`,
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
                        this.deleteParameter(parameter.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteParameter(id: string) {
        this.globalParametersService.delete(id).subscribe({
            next: async () => {
                await this.toastService.success('Parámetro eliminado correctamente');
                this.loadParameters();
            },
            error: async (error) => {
                console.error('Error deleting parameter:', error);
                await this.toastService.error(
                    error.message || 'Error al eliminar el parámetro'
                );
            }
        });
    }
}
