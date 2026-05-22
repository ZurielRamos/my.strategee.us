import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { BaseModalComponent } from '../../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../../shared/components/text-input/text-input.component';
import { DateInputComponent } from '../../../../../shared/components/date-input/date-input.component';
import { AlertBoxComponent } from '../../../../../shared/components/alert-box/alert-box.component';
import { GlobalParameter } from '../../models/global-parameter.model';

@Component({
  selector: 'app-global-parameter-modal',
  templateUrl: './global-parameter-modal.component.html',
  styleUrls: ['./global-parameter-modal.component.scss'],
  standalone: true,
  providers: [ModalController],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseModalComponent,
    TextInputComponent,
    DateInputComponent,
    AlertBoxComponent
  ]
})
export class GlobalParameterModalComponent implements OnInit {
  @Input() parameter?: GlobalParameter;
  @Input() mode: 'create' | 'view' = 'create';

  form!: FormGroup;
  isSubmitting = false;
  minDate: Date;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController
  ) {
    this.minDate = new Date();
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      key: [this.parameter?.key || '', [Validators.required]],
      value: [this.parameter?.value || '', [Validators.required, Validators.min(0)]],
      validFrom: [this.parameter?.validFrom || '', [Validators.required]]
    });

    // Set key as readonly in view mode or when editing (key is pre-filled)
    if (this.mode === 'view' || (this.mode === 'create' && this.parameter?.key)) {
      this.form.get('key')?.disable();
    }

    // Disable all fields in view mode
    if (this.mode === 'view') {
      this.form.disable();
    }
  }

  get title(): string {
    return this.mode === 'view' ? 'Detalle del Parámetro' : 'Nuevo Parámetro Global';
  }

  get isKeyReadonly(): boolean {
    return this.mode === 'view' || (this.mode === 'create' && !!this.parameter?.key);
  }

  onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.form.getRawValue();
      this.modalCtrl.dismiss(formValue, 'save');
    }
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }
}
