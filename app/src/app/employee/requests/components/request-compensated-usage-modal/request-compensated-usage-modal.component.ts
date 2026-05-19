import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, informationCircleOutline, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { RequestsService } from '../../services/requests.service';
import { CompensatedTimeService } from '../../services/compensated-time.service';
import { CompensatedTimeBalance } from '../../models/compensated-time-balance.model';
import { RequestType } from '../../models/request.model';
import { SystemSettingsService } from '../../../../shared/services/system-settings.service';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { DateInputComponent } from '../../../../shared/components/date-input/date-input.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { TextareaInputComponent } from '../../../../shared/components/textarea-input/textarea-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';

export enum UsageType {
    DAYS = 'DAYS',
    HOURS = 'HOURS'
}

@Component({
    selector: 'app-request-compensated-usage-modal',
    templateUrl: './request-compensated-usage-modal.component.html',
    styleUrls: ['./request-compensated-usage-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        FormSelectComponent,
        DateInputComponent,
        TextInputComponent,
        TextareaInputComponent,
        AlertBoxComponent,
        IonIcon
    ]
})
export class RequestCompensatedUsageModalComponent implements OnInit {
    form!: FormGroup;
    isSubmitting = false;
    
    balance: CompensatedTimeBalance | null = null;
    isLoadingBalance = true;
    hoursPerDay: number | null = null;
    
    // Date constraints
    minDate: Date;

    UsageType = UsageType;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private requestsService: RequestsService,
        private compensatedTimeService: CompensatedTimeService,
        private systemSettingsService: SystemSettingsService,
        private toastService: ToastService
    ) {
        addIcons({ timeOutline, informationCircleOutline, checkmarkCircle, closeCircle });
        
        // Configurar fecha mínima
        this.minDate = new Date();
        this.minDate.setHours(0, 0, 0, 0);
    }

    ngOnInit() {
        this.initForm();
        this.loadSystemSettings();
        this.loadBalance();
    }

    initForm() {
        this.form = this.fb.group({
            usageType: [UsageType.DAYS, [Validators.required]],
            date: ['', [Validators.required]],
            hours: ['', [Validators.min(0.5)]],
            comments: ['']
        });

        // Suscribirse a cambios en el tipo de uso
        this.form.get('usageType')?.valueChanges.subscribe(() => {
            this.onUsageTypeChange();
        });

        // Suscribirse a cambios en las horas
        this.form.get('hours')?.valueChanges.subscribe(() => {
            this.validateHours();
        });
    }

    loadSystemSettings() {
        this.systemSettingsService.getHoursPerWorkday().subscribe({
            next: (hours) => {
                this.hoursPerDay = hours;
            },
            error: (error) => {
                console.error('Error loading hours per day:', error);
            }
        });
    }

    loadBalance() {
        this.isLoadingBalance = true;
        this.compensatedTimeService.getMyBalance().subscribe({
            next: (data) => {
                this.balance = data;
                this.isLoadingBalance = false;
            },
            error: (error) => {
                console.error('Error loading balance:', error);
                this.isLoadingBalance = false;
            }
        });
    }

    get usageTypeOptions(): SelectOption[] {
        return [
            { value: UsageType.DAYS, label: 'Días completos' },
            { value: UsageType.HOURS, label: 'Horas' }
        ];
    }

    onUsageTypeChange() {
        const usageType = this.form.get('usageType')?.value;
        const hoursControl = this.form.get('hours');
        
        if (usageType === UsageType.HOURS) {
            hoursControl?.setValidators([Validators.required, Validators.min(0.5)]);
        } else {
            hoursControl?.clearValidators();
            hoursControl?.setValue('');
        }
        hoursControl?.updateValueAndValidity();
    }

    validateHours() {
        const usageType = this.form.get('usageType')?.value;
        const hours = parseFloat(this.form.get('hours')?.value || '0');
        
        if (usageType === UsageType.HOURS && hours > 0 && this.balance) {
            if (hours > this.balance.availableBalance) {
                this.toastService.warning(
                    `Las horas ingresadas (${hours} hrs) exceden tu balance disponible (${this.balance.availableBalance} hrs)`
                );
            }
        }
    }

    get calculatedHours(): number {
        const usageType = this.form.get('usageType')?.value;
        
        if (usageType === UsageType.HOURS) {
            return parseFloat(this.form.get('hours')?.value || '0');
        } else if (usageType === UsageType.DAYS && this.hoursPerDay) {
            // Para días completos, usar las horas por día configuradas
            return this.hoursPerDay;
        }
        return 0;
    }

    get calculatedDays(): number {
        return this.hoursPerDay ? parseFloat((this.calculatedHours / this.hoursPerDay).toFixed(2)) : 0;
    }

    get hasInsufficientBalance(): boolean {
        if (!this.balance) return false;
        return this.calculatedHours > this.balance.availableBalance;
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            // Validación adicional de balance
            if (this.hasInsufficientBalance) {
                await this.toastService.error(
                    `No tienes suficientes horas disponibles. Disponible: ${this.balance?.availableBalance} horas, Solicitado: ${this.calculatedHours} horas`
                );
                return;
            }

            if (this.calculatedHours === 0) {
                await this.toastService.error('Debes ingresar una cantidad válida de horas');
                return;
            }

            this.isSubmitting = true;

            const formValue = this.form.value;
            const usageType = formValue.usageType;
            
            const requestDto: any = {
                type: RequestType.COMPENSATED_TIME_USAGE,
                details: {
                    usageType: usageType,
                    startDate: formValue.date,
                    endDate: formValue.date,
                    calculatedHours: this.calculatedHours
                }
            };

            // Agregar horas solo si es tipo HOURS
            if (usageType === UsageType.HOURS) {
                requestDto.details.hours = parseFloat(formValue.hours);
            }

            // Agregar comentarios solo si se proporcionaron
            if (formValue.comments && formValue.comments.trim()) {
                requestDto.details.comments = formValue.comments.trim();
            }

            this.requestsService.createRequest(requestDto).subscribe({
                next: async (response) => {
                    await this.toastService.success('Solicitud de disfrute enviada correctamente');
                    this.modalCtrl.dismiss({
                        success: true,
                        request: response,
                        refreshNeeded: true
                    }, 'save');
                },
                error: async (error) => {
                    console.error('Error creating request:', error);
                    const errorMessage = error.error?.message || error.message || 'Error al enviar la solicitud';
                    await this.toastService.error(errorMessage);
                    this.isSubmitting = false;
                }
            });
        }
    }
}
