import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { FormSelectComponent, SelectOption } from '../../../../shared/components/form-select/form-select.component';
import { AlertBoxComponent } from '../../../../shared/components/alert-box/alert-box.component';
import { ToastService } from '../../../../shared/services/toast.service';
import { EmployeesService } from '../../services/employees.service';

@Component({
  selector: 'app-role-selection-modal',
  templateUrl: './role-selection-modal.component.html',
  styleUrls: ['./role-selection-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BaseModalComponent,
    FormSelectComponent,
    AlertBoxComponent
  ]
})
export class RoleSelectionModalComponent implements OnInit {
  @Input() employeeId!: string;
  @Input() employeeName!: string;
  @Input() corporateEmail!: string;

  form!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private toastService: ToastService,
    private employeesService: EmployeesService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      role: ['', Validators.required]
    });
  }

  get roleOptions(): SelectOption[] {
    return [
      { 
        value: 'EMPLOYEE', 
        label: 'Empleado - Acceso básico para empleados'
      },
      { 
        value: 'ADMIN', 
        label: 'Administrador - Acceso completo al sistema'
      }
    ];
  }

  onDismiss() {
    this.modalCtrl.dismiss();
  }

  onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const role = this.form.get('role')?.value;
      
      this.employeesService.createCredentials(this.employeeId, { roles: [role] }).subscribe({
        next: async (response) => {
          const roleName = role === 'ADMIN' ? 'Administrador' : 'Empleado';
          await this.toastService.success(
            `Credenciales creadas correctamente. Se ha enviado un correo a ${this.corporateEmail} con instrucciones para establecer la contraseña.`
          );
          this.modalCtrl.dismiss(response, 'save');
        },
        error: async (error) => {
          await this.toastService.error(
            error.error?.message || 'Error al crear las credenciales'
          );
          this.isSubmitting = false;
        }
      });
    }
  }
}
