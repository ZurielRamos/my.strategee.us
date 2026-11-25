import { Injectable } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { TaskDialogComponent, TaskDialogOption } from '../components/task-dialog/task-dialog.component';

/** Abre los diálogos de Tareas con el estilo de los modales de la app (en lugar de alertas nativas). */
@Injectable({
    providedIn: 'root'
})
export class TaskDialogService {
    constructor(private modalCtrl: ModalController) { }

    async confirm(title: string, message: string, confirmText: string, danger = false): Promise<boolean> {
        const result = await this.open({ mode: 'confirm', title, message, confirmText, danger });
        return !!result?.confirmed;
    }

    /** Pide un texto; devuelve null si se cancela. */
    async prompt(title: string, label: string, value = '', confirmText = 'Guardar', placeholder = ''): Promise<string | null> {
        const result = await this.open({ mode: 'prompt', title, label, value, confirmText, placeholder });
        return result?.confirmed ? result.value : null;
    }

    /** Elegir una opción; devuelve su valor o null si se cancela. */
    async choose(title: string, message: string, options: TaskDialogOption[], confirmText: string, danger = false): Promise<string | null> {
        const result = await this.open({ mode: 'choose', title, message, options, confirmText, danger });
        return result?.confirmed ? result.value : null;
    }

    private async open(componentProps: Partial<TaskDialogComponent>): Promise<{ confirmed: boolean; value: any } | undefined> {
        const modal = await this.modalCtrl.create({
            component: TaskDialogComponent,
            componentProps,
            cssClass: 'confirmation-modal',
        });
        await modal.present();
        const { data } = await modal.onDidDismiss();
        return data;
    }
}
