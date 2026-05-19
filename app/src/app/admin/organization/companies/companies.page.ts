import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner
} from '@ionic/angular/standalone';
import { ModalController, AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, trashOutline, eyeOutline, businessOutline } from 'ionicons/icons';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CompanyCardComponent } from './components/company-card/company-card.component';
import { CompaniesService } from './services/companies.service';
import { Company } from './models/company.model';
import { CompanyModalComponent } from './components/company-modal/company-modal.component';

@Component({
    selector: 'app-companies',
    templateUrl: './companies.page.html',
    styleUrls: ['./companies.page.scss'],
    standalone: true,
    providers: [ModalController, AlertController],
    imports: [
        CommonModule,
        FormsModule,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        PageHeaderComponent,
        CompanyCardComponent
    ]
})
export class CompaniesPage implements OnInit {
    companies: Company[] = [];
    isLoading = false;

    constructor(
        private companiesService: CompaniesService,
        private modalCtrl: ModalController,
        private alertCtrl: AlertController
    ) {
        addIcons({ addOutline, createOutline, trashOutline, eyeOutline, businessOutline });
    }

    ngOnInit() {
        this.loadCompanies();
    }

    loadCompanies() {
        this.isLoading = true;
        this.companiesService.getAll().subscribe({
            next: (data) => {
                this.companies = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading companies:', error);
                this.isLoading = false;
            }
        });
    }

    async openCreateModal() {
        const modal = await this.modalCtrl.create({
            component: CompanyModalComponent,
            componentProps: {
                mode: 'create'
            },
            cssClass: 'company-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadCompanies();
        }
    }

    async openEditModal(company: Company) {
        const modal = await this.modalCtrl.create({
            component: CompanyModalComponent,
            componentProps: {
                company,
                mode: 'edit'
            },
            cssClass: 'company-modal',
            backdropDismiss: true
        });

        await modal.present();

        const { role } = await modal.onWillDismiss();
        if (role === 'save') {
            this.loadCompanies();
        }
    }

    async confirmDelete(company: Company) {
        const alert = await this.alertCtrl.create({
            header: 'Confirmar eliminación',
            message: `¿Está seguro de eliminar la empresa "${company.name}"? Esta acción no se puede deshacer.`,
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
                        this.deleteCompany(company.id);
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteCompany(id: string) {
        this.companiesService.delete(id).subscribe({
            next: () => {
                this.loadCompanies();
            },
            error: (error) => {
                console.error('Error deleting company:', error);
            }
        });
    }
}
