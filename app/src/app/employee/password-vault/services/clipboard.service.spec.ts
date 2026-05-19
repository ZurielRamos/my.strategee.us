import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';
import { ToastService } from '../../../shared/services/toast.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let clipboardSpy: jasmine.Spy;

  beforeEach(() => {
    const toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);
    
    TestBed.configureTestingModule({
      providers: [
        ClipboardService,
        { provide: ToastService, useValue: toastSpy }
      ]
    });
    
    service = TestBed.inject(ClipboardService);
    toastServiceSpy = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    
    // Mock navigator.clipboard
    clipboardSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardSpy },
      writable: true,
      configurable: true
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('copy', () => {
    it('should copy text to clipboard and show success toast', async () => {
      const text = 'test text';
      const successMessage = 'Copied!';

      const result = await service.copy(text, successMessage);

      expect(clipboardSpy).toHaveBeenCalledWith(text);
      expect(toastServiceSpy.success).toHaveBeenCalledWith(successMessage);
      expect(result).toBe(true);
    });

    it('should use default success message when not provided', async () => {
      const text = 'test text';

      const result = await service.copy(text);

      expect(clipboardSpy).toHaveBeenCalledWith(text);
      expect(toastServiceSpy.success).toHaveBeenCalledWith('Copiado al portapapeles');
      expect(result).toBe(true);
    });

    it('should show error toast and return false when clipboard fails', async () => {
      const text = 'test text';
      const error = new Error('Clipboard error');
      clipboardSpy.and.returnValue(Promise.reject(error));

      const result = await service.copy(text);

      expect(clipboardSpy).toHaveBeenCalledWith(text);
      expect(toastServiceSpy.error).toHaveBeenCalledWith('Error al copiar al portapapeles');
      expect(result).toBe(false);
    });
  });

  describe('copyUsername', () => {
    it('should copy username with specific message', async () => {
      const username = 'john.doe@example.com';

      const result = await service.copyUsername(username);

      expect(clipboardSpy).toHaveBeenCalledWith(username);
      expect(toastServiceSpy.success).toHaveBeenCalledWith('Usuario copiado');
      expect(result).toBe(true);
    });
  });

  describe('copyPassword', () => {
    it('should copy password with specific message', async () => {
      const password = 'secret123';

      const result = await service.copyPassword(password);

      expect(clipboardSpy).toHaveBeenCalledWith(password);
      expect(toastServiceSpy.success).toHaveBeenCalledWith('Contraseña copiada');
      expect(result).toBe(true);
    });
  });
});
