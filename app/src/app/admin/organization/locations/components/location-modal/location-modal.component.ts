import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { Location } from '../../models/location.model';
import { BaseModalComponent } from 'src/app/shared/components/base-modal/base-modal.component';
import { TextInputComponent } from 'src/app/shared/components/text-input/text-input.component';
import { TextareaInputComponent } from 'src/app/shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from 'src/app/shared/components/alert-box/alert-box.component';
import { ToastService } from 'src/app/shared/services/toast.service';
import { LocationsService } from '../../services/locations.service';

@Component({
    selector: 'app-location-modal',
    templateUrl: './location-modal.component.html',
    styleUrls: ['./location-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        TextareaInputComponent,
        AlertBoxComponent
    ]
})
export class LocationModalComponent implements OnInit {
    @Input() location?: Location;
    @Input() mode: 'create' | 'edit' = 'create';

    locationForm!: FormGroup;
    isSubmitting = false;
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private toastService: ToastService,
        private locationsService: LocationsService
    ) {}

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.locationForm = this.fb.group({
            name: [this.location?.name || '', [Validators.required]],
            address: [this.location?.address || ''],
            city: [this.location?.city || ''],
            country: [this.location?.country || ''],
            description: [this.location?.description || '']
        });

        // Limpiar el error cuando el usuario modifica el nombre
        this.locationForm.get('name')?.valueChanges.subscribe(() => {
            this.errorMessage = '';
        });
    }

    get title(): string {
        return this.mode === 'edit' ? 'Editar Ubicación' : 'Nueva Ubicación';
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.locationForm.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            this.errorMessage = '';
            
            const operation = this.mode === 'edit' && this.location?.id
                ? this.locationsService.update(this.location.id, this.locationForm.value)
                : this.locationsService.create(this.locationForm.value);
            
            operation.subscribe({
                next: async (response) => {
                    const message = this.mode === 'edit'
                        ? 'Cambios guardados correctamente'
                        : 'Ubicación creada correctamente';
                    await this.toastService.success(message);
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    // El mensaje real del backend viene en error.error.message
                    this.errorMessage = error.error?.message || error.message || 'Error al guardar los datos';
                    this.isSubmitting = false;
                }
            });
        }
    }
}
