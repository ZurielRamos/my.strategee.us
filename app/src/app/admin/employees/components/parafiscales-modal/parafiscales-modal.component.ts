import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ParafiscalesService } from '../../services/parafiscales.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { EmployeeParafiscales } from '../../models/parafiscales.model';

@Component({
    selector: 'app-parafiscales-modal',
    templateUrl: './parafiscales-modal.component.html',
    styleUrls: ['./parafiscales-modal.component.scss'],
    standalone: true,
    providers: [ModalController],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        TextInputComponent,
        AlertBoxComponent,
    ],
})
export class ParafiscalesModalComponent implements OnInit {
    @Input() employeeId!: string;
    @Input() employeeName?: string;
    @Input() current?: EmployeeParafiscales | null;

    form!: FormGroup;
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private parafiscalesService: ParafiscalesService,
        private toastService: ToastService,
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            eps: [this.current?.eps ?? ''],
            arl: [this.current?.arl ?? ''],
            fondoPension: [this.current?.fondoPension ?? ''],
            cajaCompensacion: [this.current?.cajaCompensacion ?? ''],
        });
    }

    get modalSubtitle(): string {
        return this.employeeName ? `Empleado: ${this.employeeName}` : '';
    }

    onDismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }

    onConfirm() {
        if (this.isSubmitting) return;
        this.isSubmitting = true;

        const raw = this.form.getRawValue();
        const dto = {
            eps: raw.eps?.trim() || null,
            arl: raw.arl?.trim() || null,
            fondoPension: raw.fondoPension?.trim() || null,
            cajaCompensacion: raw.cajaCompensacion?.trim() || null,
        };

        this.parafiscalesService.upsert(this.employeeId, dto).subscribe({
            next: () => {
                this.toastService.success('Parafiscales actualizados correctamente');
                this.modalCtrl.dismiss(null, 'save');
            },
            error: (err) => {
                console.error('Error saving parafiscales:', err);
                this.toastService.error('Error al guardar los parafiscales');
                this.isSubmitting = false;
            },
        });
    }
}
