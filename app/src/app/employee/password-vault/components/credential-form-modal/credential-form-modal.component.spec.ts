import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalController, AngularDelegate } from '@ionic/angular/standalone';
import { of, throwError } from 'rxjs';
import { CredentialFormModalComponent } from './credential-form-modal.component';
import { PasswordVaultService } from '../../services/password-vault.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { VisibilityLevel } from '../../models/visibility.model';

describe('CredentialFormModalComponent', () => {
  let component: CredentialFormModalComponent;
  let fixture: ComponentFixture<CredentialFormModalComponent>;
  let mockVaultService: jasmine.SpyObj<PasswordVaultService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockModalCtrl: jasmine.SpyObj<ModalController>;
  let mockAngularDelegate: jasmine.SpyObj<AngularDelegate>;

  const mockVaults = [
    { id: '1', name: 'Work Vault', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Personal Vault', ownerId: 'user1', createdAt: new Date(), updatedAt: new Date() }
  ];

  const mockCredential = {
    id: 'cred1',
    title: 'Gmail Account',
    url: 'https://gmail.com',
    username: 'user@example.com',
    password: 'password123',
    directLoginUrl: 'https://accounts.google.com',
    notes: 'Test notes',
    logoId: 'logo1',
    visibilityLevel: VisibilityLevel.PRIVATE,
    ownerId: 'user1',
    owner: { id: 'user1', firstName: 'John', lastName: 'Doe' },
    vaultId: '1',
    vault: { id: '1', name: 'Work Vault' },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    mockVaultService = jasmine.createSpyObj('PasswordVaultService', [
      'createCredential',
      'updateCredential'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);
    mockModalCtrl = jasmine.createSpyObj('ModalController', ['dismiss']);
    mockAngularDelegate = jasmine.createSpyObj('AngularDelegate', ['create']);

    await TestBed.configureTestingModule({
      imports: [CredentialFormModalComponent, ReactiveFormsModule],
      providers: [
        { provide: PasswordVaultService, useValue: mockVaultService },
        { provide: ToastService, useValue: mockToastService },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: AngularDelegate, useValue: mockAngularDelegate }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CredentialFormModalComponent);
    component = fixture.componentInstance;
    component.vaults = mockVaults;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values in create mode', () => {
      component.mode = 'create';
      component.ngOnInit();

      expect(component.form.get('vaultId')?.value).toBe('');
      expect(component.form.get('url')?.value).toBe('');
      expect(component.form.get('username')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
      expect(component.form.get('visibilityLevel')?.value).toBe(VisibilityLevel.PRIVATE);
    });

    it('should initialize form with credential data in edit mode', () => {
      component.mode = 'edit';
      component.credential = mockCredential;
      component.ngOnInit();

      expect(component.form.get('vaultId')?.value).toBe('1');
      expect(component.form.get('url')?.value).toBe('https://gmail.com');
      expect(component.form.get('username')?.value).toBe('user@example.com');
      expect(component.form.get('password')?.value).toBe('password123');
      expect(component.form.get('title')?.value).toBe('Gmail Account');
      expect(component.form.get('visibilityLevel')?.value).toBe(VisibilityLevel.PRIVATE);
    });

    it('should mark required fields', () => {
      component.ngOnInit();

      const vaultIdControl = component.form.get('vaultId');
      const urlControl = component.form.get('url');
      const usernameControl = component.form.get('username');
      const passwordControl = component.form.get('password');

      expect(vaultIdControl?.hasError('required')).toBe(true);
      expect(urlControl?.hasError('required')).toBe(true);
      expect(usernameControl?.hasError('required')).toBe(true);
      expect(passwordControl?.hasError('required')).toBe(true);
    });
  });

  describe('URL Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should accept valid URLs', () => {
      const urlControl = component.form.get('url');
      
      urlControl?.setValue('https://example.com');
      expect(urlControl?.hasError('invalidUrl')).toBe(false);

      urlControl?.setValue('http://test.com');
      expect(urlControl?.hasError('invalidUrl')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      const urlControl = component.form.get('url');
      
      urlControl?.setValue('not-a-url');
      expect(urlControl?.hasError('invalidUrl')).toBe(true);

      urlControl?.setValue('example.com');
      expect(urlControl?.hasError('invalidUrl')).toBe(true);
    });
  });

  describe('Title Validation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should accept titles up to 200 characters', () => {
      const titleControl = component.form.get('title');
      const validTitle = 'a'.repeat(200);
      
      titleControl?.setValue(validTitle);
      expect(titleControl?.hasError('maxlength')).toBe(false);
    });

    it('should reject titles over 200 characters', () => {
      const titleControl = component.form.get('title');
      const invalidTitle = 'a'.repeat(201);
      
      titleControl?.setValue(invalidTitle);
      expect(titleControl?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Vault Options', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should format vaults as select options', () => {
      const options = component.vaultOptions;

      expect(options.length).toBe(2);
      expect(options[0]).toEqual({ value: '1', label: 'Work Vault' });
      expect(options[1]).toEqual({ value: '2', label: 'Personal Vault' });
    });
  });

  describe('Create Credential', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.ngOnInit();
    });

    it('should create credential successfully', async () => {
      mockVaultService.createCredential.and.returnValue(of(mockCredential));
      mockToastService.success.and.returnValue(Promise.resolve());

      component.form.patchValue({
        vaultId: '1',
        url: 'https://example.com',
        username: 'user@test.com',
        password: 'pass123',
        visibilityLevel: VisibilityLevel.PRIVATE
      });

      await component.onConfirm();

      expect(mockVaultService.createCredential).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith('Credencial creada exitosamente');
      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'save');
    });

    it('should handle creation error', async () => {
      const error = { message: 'Creation failed' };
      mockVaultService.createCredential.and.returnValue(throwError(() => error));
      mockToastService.error.and.returnValue(Promise.resolve());

      component.form.patchValue({
        vaultId: '1',
        url: 'https://example.com',
        username: 'user@test.com',
        password: 'pass123',
        visibilityLevel: VisibilityLevel.PRIVATE
      });

      await component.onConfirm();

      expect(mockToastService.error).toHaveBeenCalledWith('Creation failed');
      expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });

    it('should not submit if form is invalid', async () => {
      component.form.patchValue({
        vaultId: '',
        url: '',
        username: '',
        password: ''
      });

      await component.onConfirm();

      expect(mockVaultService.createCredential).not.toHaveBeenCalled();
      expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
    });
  });

  describe('Update Credential', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.credential = mockCredential;
      component.ngOnInit();
    });

    it('should update credential successfully', async () => {
      mockVaultService.updateCredential.and.returnValue(of(mockCredential));
      mockToastService.success.and.returnValue(Promise.resolve());

      component.form.patchValue({
        title: 'Updated Title'
      });

      await component.onConfirm();

      expect(mockVaultService.updateCredential).toHaveBeenCalledWith(
        'cred1',
        jasmine.objectContaining({ title: 'Updated Title' })
      );
      expect(mockToastService.success).toHaveBeenCalledWith('Credencial actualizada exitosamente');
      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith(null, 'save');
    });

    it('should handle update error', async () => {
      const error = { message: 'Update failed' };
      mockVaultService.updateCredential.and.returnValue(throwError(() => error));
      mockToastService.error.and.returnValue(Promise.resolve());

      await component.onConfirm();

      expect(mockToastService.error).toHaveBeenCalledWith('Update failed');
      expect(mockModalCtrl.dismiss).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('Modal Title', () => {
    it('should return "Crear Credencial" in create mode', () => {
      component.mode = 'create';
      expect(component.title).toBe('Crear Credencial');
    });

    it('should return "Editar Credencial" in edit mode', () => {
      component.mode = 'edit';
      expect(component.title).toBe('Editar Credencial');
    });
  });

  describe('Modal Dismiss', () => {
    it('should dismiss modal without data', () => {
      component.onDismiss();
      expect(mockModalCtrl.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('Submitting State', () => {
    beforeEach(() => {
      component.mode = 'create';
      component.ngOnInit();
    });

    it('should prevent multiple submissions', async () => {
      mockVaultService.createCredential.and.returnValue(of(mockCredential));
      mockToastService.success.and.returnValue(Promise.resolve());

      component.form.patchValue({
        vaultId: '1',
        url: 'https://example.com',
        username: 'user@test.com',
        password: 'pass123',
        visibilityLevel: VisibilityLevel.PRIVATE
      });

      component.isSubmitting = true;
      await component.onConfirm();

      expect(mockVaultService.createCredential).not.toHaveBeenCalled();
    });
  });
});
