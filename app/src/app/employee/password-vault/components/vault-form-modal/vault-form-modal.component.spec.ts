import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { VaultFormModalComponent } from './vault-form-modal.component';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Vault } from '../../models/vault.model';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('VaultFormModalComponent', () => {
  let component: VaultFormModalComponent;
  let fixture: ComponentFixture<VaultFormModalComponent>;
  let mockVaultService: jasmine.SpyObj<PasswordVaultService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockModalCtrl: jasmine.SpyObj<ModalController>;

  const mockVault: Vault = {
    id: '1',
    name: 'Test Vault',
    description: 'Test Description',
    ownerId: 'owner1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    mockVaultService = jasmine.createSpyObj('PasswordVaultService', [
      'createVault',
      'updateVault'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockModalCtrl = jasmine.createSpyObj('ModalController', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [VaultFormModalComponent, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PasswordVaultService, useValue: mockVaultService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ModalController, useValue: mockModalCtrl }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VaultFormModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values in create mode', () => {
      component.mode = 'create';
      component.ngOnInit();

      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('description')?.value).toBe('');
    });

    it('should initialize form with vault data in edit mode', () => {
      component.mode = 'edit';
      component.vault = mockVault;
      component.ngOnInit();

      expect(component.form.get('name')?.value).toBe(mockVault.name);
      expect(component.form.get('description')?.value).toBe(mockVault.description);
    });

    it('should have name field as required', () => {
      component.ngOnInit();
      const nameControl = component.form.get('name');

      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBe(true);

      nameControl?.setValue('Valid Name');
      expect(nameControl?.hasError('required')).toBe(false);
    });

    it('should enforce maxLength of 100 on name field', () => {
      component.ngOnInit();
      const nameControl = component.form.get('name');

      const longName = 'a'.repeat(101);
      nameControl?.setValue(longName);
      expect(nameControl?.hasError('maxlength')).toBe(true);

      nameControl?.setValue('Valid Name');
      expect(nameControl?.hasError('maxlength')).toBe(false);
    });

    it('should have description field as optional', () => {
      component.ngOnInit();
      const descControl = component.form.get('description');

      descControl?.setValue('');
      expect(descControl?.valid).toBe(true);
    });
  });

  describe('Title', () => {
    it('should return "Crear Vault" in create mode', () => {
      component.mode = 'create';
      expect(component.title).toBe('Crear Vault');
    });

    it('should return "Editar Vault" in edit mode', () => {
      component.mode = 'edit';
      expect(component.title).toBe('Editar Vault');
    });
  });

  describe('onConfirm - Create Mode', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.ngOnInit();
    });

    it('should not submit if form is invalid', async () => {
      component.form.patchValue({ name: '', description: '' });
      await component.onConfirm();

      expect(mockVaultService.createVault).not.toHaveBeenCalled();
    });

    it('should not submit if already submitting', async () => {
      component.form.patchValue({ name: 'Test', description: 'Desc' });
      component.isSubmitting = true;

      await component.onConfirm();

      expect(mockVaultService.createVault).not.toHaveBeenCalled();
    });

    it('should create vault successfully', async () => {
      const formData = { name: 'New Vault', description: 'New Description' };
      component.form.patchValue(formData);

      mockVaultService.createVault.and.returnValue(of(mockVault));
      mockToastService.success.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(component.isSubmitting).toBe(true);
      expect(mockVaultService.createVault).toHaveBeenCalledWith(formData);
      expect(mockToastService.success).toHaveBeenCalledWith('Vault creado exitosamente');
      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'save');
    });

    it('should handle create error and keep modal open', async () => {
      const formData = { name: 'New Vault', description: 'New Description' };
      component.form.patchValue(formData);

      const error = { message: 'Create failed' };
      mockVaultService.createVault.and.returnValue(throwError(() => error));
      mockToastService.error.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(mockToastService.error).toHaveBeenCalledWith('Create failed');
      expect(component.isSubmitting).toBe(false);
      expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
    });

    it('should handle create error with default message', async () => {
      const formData = { name: 'New Vault', description: 'New Description' };
      component.form.patchValue(formData);

      mockVaultService.createVault.and.returnValue(throwError(() => ({})));
      mockToastService.error.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(mockToastService.error).toHaveBeenCalledWith('Error al guardar el vault');
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('onConfirm - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.vault = mockVault;
      component.ngOnInit();
    });

    it('should update vault successfully', async () => {
      const formData = { name: 'Updated Vault', description: 'Updated Description' };
      component.form.patchValue(formData);

      mockVaultService.updateVault.and.returnValue(of(mockVault));
      mockToastService.success.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(component.isSubmitting).toBe(true);
      expect(mockVaultService.updateVault).toHaveBeenCalledWith(mockVault.id, formData);
      expect(mockToastService.success).toHaveBeenCalledWith('Vault actualizado exitosamente');
      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'save');
    });

    it('should handle update error and keep modal open', async () => {
      const formData = { name: 'Updated Vault', description: 'Updated Description' };
      component.form.patchValue(formData);

      const error = { message: 'Update failed' };
      mockVaultService.updateVault.and.returnValue(throwError(() => error));
      mockToastService.error.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(mockToastService.error).toHaveBeenCalledWith('Update failed');
      expect(component.isSubmitting).toBe(false);
      expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
    });

    it('should not update if vault is not provided', async () => {
      component.vault = undefined;
      component.form.patchValue({ name: 'Test', description: 'Test' });

      await component.onConfirm();

      expect(mockVaultService.updateVault).not.toHaveBeenCalled();
    });
  });

  describe('onDismiss', () => {
    it('should dismiss modal without data', () => {
      component.onDismiss();
      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('Requirements Validation', () => {
    it('should validate Requirement 2.2: name field is required', () => {
      component.ngOnInit();
      const nameControl = component.form.get('name');
      
      nameControl?.setValue('');
      expect(nameControl?.hasError('required')).toBe(true);
    });

    it('should validate Requirement 2.3: description field is optional', () => {
      component.ngOnInit();
      const descControl = component.form.get('description');
      
      descControl?.setValue('');
      expect(descControl?.valid).toBe(true);
    });

    it('should validate Requirement 2.5: name maxLength is 100', () => {
      component.ngOnInit();
      const nameControl = component.form.get('name');
      
      nameControl?.setValue('a'.repeat(101));
      expect(nameControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate Requirement 2.7: modal closes only on success', async () => {
      component.mode = 'create';
      component.ngOnInit();
      component.form.patchValue({ name: 'Test', description: 'Test' });

      mockVaultService.createVault.and.returnValue(of(mockVault));
      mockToastService.success.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'save');
    });

    it('should validate Requirement 2.9: modal stays open on error', async () => {
      component.mode = 'create';
      component.ngOnInit();
      component.form.patchValue({ name: 'Test', description: 'Test' });

      mockVaultService.createVault.and.returnValue(throwError(() => ({ message: 'Error' })));
      mockToastService.error.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });

    it('should validate Requirement 3.1: edit mode pre-loads data', () => {
      component.mode = 'edit';
      component.vault = mockVault;
      component.ngOnInit();

      expect(component.form.get('name')?.value).toBe(mockVault.name);
      expect(component.form.get('description')?.value).toBe(mockVault.description);
    });
  });
});
