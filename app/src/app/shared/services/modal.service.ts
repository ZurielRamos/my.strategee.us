import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ComponentRef } from '@ionic/core';

/**
 * Resultado de un modal al cerrarse
 */
export interface ModalResult<T = any> {
    /** Datos retornados por el modal */
    data?: T;
    /** Rol con el que se cerró el modal (ej: 'save', 'cancel', 'backdrop') */
    role?: string;
}

/**
 * Opciones de configuración para abrir un modal
 */
export interface ModalOptions {
    /** Propiedades a pasar al componente del modal */
    componentProps?: Record<string, any>;
    /** Permitir cerrar el modal tocando fuera de él */
    backdropDismiss?: boolean;
    /** ID único para el modal */
    id?: string;
    /** Animación de entrada personalizada */
    enterAnimation?: any;
    /** Animación de salida personalizada */
    leaveAnimation?: any;
}

/**
 * Servicio centralizado para la gestión de modales en la aplicación.
 * 
 * Proporciona métodos helper para abrir diferentes tipos de modales
 * con configuraciones estandarizadas, reduciendo código duplicado
 * y manteniendo consistencia en toda la aplicación.
 * 
 * Todos los modales usan la clase CSS estándar 'standard-modal' que
 * proporciona altura automática y diseño responsive.
 * 
 * @example
 * ```typescript
 * // Inyectar el servicio
 * constructor(private modalService: ModalService) {}
 * 
 * // Abrir un modal
 * const result = await this.modalService.open(
 *   MyFormComponent,
 *   { data: someData }
 * );
 * 
 * if (result.role === 'save') {
 *   console.log('Datos guardados:', result.data);
 * }
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class ModalService {
    /**
     * Clase CSS estándar aplicada a todos los modales
     */
    private readonly STANDARD_MODAL_CLASS = 'standard-modal';

    constructor(private modalController: ModalController) {}

    /**
     * Abre un modal con configuración estándar.
     * 
     * Este método aplica automáticamente la clase CSS estándar que proporciona
     * altura automática ajustada al contenido y diseño responsive.
     * 
     * @param component - Componente del modal a mostrar
     * @param componentProps - Propiedades a pasar al componente
     * @param options - Opciones adicionales de configuración
     * @returns Promesa que resuelve con los datos y rol al cerrar el modal
     * 
     * @example
     * ```typescript
     * const result = await this.modalService.open(
     *   EmployeeModalComponent,
     *   { employeeId: '123' }
     * );
     * 
     * if (result.role === 'save') {
     *   this.handleSave(result.data);
     * }
     * ```
     */
    async open<T = any>(
        component: ComponentRef,
        componentProps?: Record<string, any>,
        options?: Omit<ModalOptions, 'componentProps'>
    ): Promise<ModalResult<T>> {
        const modal = await this.modalController.create({
            component,
            componentProps,
            cssClass: this.STANDARD_MODAL_CLASS,
            backdropDismiss: options?.backdropDismiss ?? true,
            id: options?.id,
            enterAnimation: options?.enterAnimation,
            leaveAnimation: options?.leaveAnimation
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss<T>();

        return { data, role };
    }

    /**
     * Abre un modal de confirmación.
     * 
     * Utiliza la clase CSS 'confirmation-modal' que tiene altura automática.
     * Ideal para diálogos de confirmación simples.
     * 
     * @param component - Componente del modal de confirmación
     * @param componentProps - Propiedades a pasar al componente
     * @param options - Opciones adicionales de configuración
     * @returns Promesa que resuelve con los datos y rol al cerrar el modal
     * 
     * @example
     * ```typescript
     * const result = await this.modalService.openConfirmation(
     *   ConfirmDeleteComponent,
     *   { itemName: 'Usuario' }
     * );
     * 
     * if (result.role === 'confirm') {
     *   this.deleteItem();
     * }
     * ```
     */
    async openConfirmation<T = any>(
        component: ComponentRef,
        componentProps?: Record<string, any>,
        options?: Omit<ModalOptions, 'componentProps'>
    ): Promise<ModalResult<T>> {
        const modal = await this.modalController.create({
            component,
            componentProps,
            cssClass: 'confirmation-modal',
            backdropDismiss: options?.backdropDismiss ?? true,
            id: options?.id,
            enterAnimation: options?.enterAnimation,
            leaveAnimation: options?.leaveAnimation
        });

        await modal.present();

        const { data, role } = await modal.onWillDismiss<T>();

        return { data, role };
    }

    /**
     * Cierra el modal superior actualmente abierto.
     * 
     * @param data - Datos opcionales a retornar al cerrar
     * @param role - Rol opcional para identificar cómo se cerró
     * @returns Promesa que resuelve cuando el modal se cierra
     * 
     * @example
     * ```typescript
     * await this.modalService.dismiss({ saved: true }, 'save');
     * ```
     */
    async dismiss<T = any>(data?: T, role?: string): Promise<boolean> {
        return this.modalController.dismiss(data, role);
    }

    /**
     * Obtiene el modal superior actualmente abierto.
     * 
     * @returns Promesa que resuelve con el modal superior o undefined
     * 
     * @example
     * ```typescript
     * const topModal = await this.modalService.getTop();
     * if (topModal) {
     *   console.log('Hay un modal abierto');
     * }
     * ```
     */
    async getTop(): Promise<HTMLIonModalElement | undefined> {
        return this.modalController.getTop();
    }
}
