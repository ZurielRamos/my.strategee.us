import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon, ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkDoneOutline, warningOutline, checkmark } from 'ionicons/icons';
import { BaseModalComponent } from '../../../../shared/components/base-modal/base-modal.component';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';

export type TaskDialogMode = 'confirm' | 'prompt' | 'choose';

export interface TaskDialogOption {
    value: string;
    label: string;
    hint?: string;
}

/**
 * Diálogo con el estilo de los modales de la app (app-base-modal):
 * - confirm: mensaje y botón de confirmar (rojo si danger).
 * - prompt: pide un texto (por ejemplo, un nombre).
 * - choose: elegir una opción de una lista.
 * Se cierra con { confirmed, value }.
 */
@Component({
    selector: 'app-task-dialog',
    templateUrl: './task-dialog.component.html',
    styleUrls: ['./task-dialog.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, IonIcon, BaseModalComponent, TextInputComponent]
})
export class TaskDialogComponent implements OnInit {
    @Input() mode: TaskDialogMode = 'confirm';
    @Input() title = '';
    @Input() message = '';
    @Input() confirmText = 'Confirmar';
    @Input() danger = false;
    /** prompt */
    @Input() label = '';
    @Input() placeholder = '';
    @Input() value = '';
    @Input() maxlength = 120;
    /** choose */
    @Input() options: TaskDialogOption[] = [];

    input = new FormControl('', { nonNullable: true });
    /** El formulario enlazado evita que Enter haga un envío nativo (que recargaba la página). */
    form = new FormGroup({ name: this.input });
    selected: string | null = null;

    constructor(private modalCtrl: ModalController) {
        addIcons({ checkmarkDoneOutline, warningOutline, checkmark });
    }

    ngOnInit() {
        this.input.setValue(this.value);
        this.input.setValidators([Validators.required, Validators.maxLength(this.maxlength)]);
        this.selected = this.options[0]?.value ?? null;
    }

    get canConfirm(): boolean {
        if (this.mode === 'prompt') return this.input.value.trim().length > 0 && this.input.valid;
        if (this.mode === 'choose') return !!this.selected;
        return true;
    }

    dismiss() {
        this.modalCtrl.dismiss({ confirmed: false });
    }

    confirm() {
        if (!this.canConfirm) return;
        const value = this.mode === 'prompt' ? this.input.value.trim() : this.mode === 'choose' ? this.selected : null;
        this.modalCtrl.dismiss({ confirmed: true, value });
    }
}
