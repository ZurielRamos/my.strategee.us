import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonIcon, IonLabel, PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { keyOutline, createOutline, giftOutline, calendarOutline, timeOutline, flashOutline } from 'ionicons/icons';

@Component({
    selector: 'app-employee-actions-popover',
    template: `
        <ion-content class="employee-actions-popover">
            <ion-list lines="none">
                <ion-item button (click)="selectAction('edit')" detail="false" class="action-item">
                    <ion-icon slot="start" name="create-outline" color="dark"></ion-icon>
                    <ion-label>
                        <h3>Editar Información</h3>
                        <p>Modificar datos del empleado</p>
                    </ion-label>
                </ion-item>
                
                @if (canExtendBirthday()) {
                <ion-item button (click)="selectAction('extendBirthday')" detail="false" class="action-item">
                    <ion-icon slot="start" name="gift-outline" color="success"></ion-icon>
                    <ion-label>
                        <h3>Extender Cumpleaños</h3>
                        <p>Permitir solicitud fuera de fecha</p>
                    </ion-label>
                </ion-item>
                }
                
                @if (hasLaborContract) {
                <ion-item button (click)="selectAction('adjustVacation')" detail="false" class="action-item">
                    <ion-icon slot="start" name="calendar-outline" color="tertiary"></ion-icon>
                    <ion-label>
                        <h3>Ajustar Días de Vacaciones</h3>
                        <p>Agregar o quitar días disponibles</p>
                    </ion-label>
                </ion-item>
                }
                
                @if (hasServiceContract) {
                <ion-item button (click)="selectAction('grantGiftedDays')" detail="false" class="action-item">
                    <ion-icon slot="start" name="gift-outline" color="tertiary"></ion-icon>
                    <ion-label>
                        <h3>Otorgar Días Obsequiados</h3>
                        <p>Agregar días obsequiados por servicios</p>
                    </ion-label>
                </ion-item>
                }

                <ion-item button (click)="selectAction('adjustCompensatedTime')" detail="false" class="action-item">
                    <ion-icon slot="start" name="time-outline" color="warning"></ion-icon>
                    <ion-label>
                        <h3>Ajustar Horas Compensatorias</h3>
                        <p>Agregar o quitar horas disponibles</p>
                    </ion-label>
                </ion-item>
                
                <ion-item button (click)="selectAction('addEnergyzeSaturday')" detail="false" class="action-item">
                    <ion-icon slot="start" name="flash-outline" color="tertiary"></ion-icon>
                    <ion-label>
                        <h3>Agregar Sábado Energyze</h3>
                        <p>Sumar 1 día Energyze disponible</p>
                    </ion-label>
                </ion-item>
                
                @if (!hasCredentials) {
                <ion-item button (click)="selectAction('create')" detail="false" class="action-item">
                    <ion-icon slot="start" name="key-outline" color="primary"></ion-icon>
                    <ion-label>
                        <h3>Crear Credenciales</h3>
                        <p>Generar acceso al sistema</p>
                    </ion-label>
                </ion-item>
                } @else {
                <ion-item button (click)="selectAction('delete')" detail="false" class="action-item danger">
                    <ion-icon slot="start" name="key-outline" color="danger"></ion-icon>
                    <ion-label>
                        <h3>Eliminar Credenciales</h3>
                        <p>Revocar acceso al sistema</p>
                    </ion-label>
                </ion-item>
                }
            </ion-list>
        </ion-content>
    `,
    styles: [`
        .employee-actions-popover {
            --background: #ffffff;
            --padding-top: 0;
            --padding-bottom: 0;
        }

        ion-list {
            padding: 4px 0;
            background: transparent;
            margin: 0;
        }

        ion-item {
            --padding-start: 16px;
            --padding-end: 16px;
            --inner-padding-end: 0;
            --min-height: 60px;
            --background: transparent;
            --background-hover: #f4f6f8;
            --background-activated: #e8eaed;
            --border-width: 0;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: 0;

            &:hover {
                --background: #f4f6f8;
            }

            &:active {
                --background: #e8eaed;
            }

            &.danger:hover {
                --background: rgba(235, 68, 90, 0.08);
            }

            &.danger:active {
                --background: rgba(235, 68, 90, 0.12);
            }
        }

        ion-icon {
            font-size: 20px;
            margin-right: 16px;
            min-width: 20px;
        }

        ion-label {
            margin: 0;
            
            h3 {
                font-size: 14px;
                font-weight: 500;
                color: #1a1c1b;
                margin: 0 0 2px 0;
                line-height: 1.4;
            }

            p {
                font-size: 12px;
                color: #7b7f84;
                margin: 0;
                line-height: 1.3;
            }
        }

        .danger ion-label h3 {
            color: #eb445a;
        }
    `],
    standalone: true,
    imports: [CommonModule, IonContent, IonList, IonItem, IonIcon, IonLabel]
})
export class EmployeeActionsPopoverComponent {
    @Input() hasCredentials = false;
    @Input() birthDate?: Date | string;
    @Input() hasLaborContract = false;
    @Input() hasServiceContract = false;

    constructor(private popoverCtrl: PopoverController) {
        addIcons({ keyOutline, createOutline, giftOutline, calendarOutline, timeOutline, flashOutline });
    }

    canExtendBirthday(): boolean {
        if (!this.birthDate) return false;

        const today = new Date();
        const birth = new Date(this.birthDate);
        
        // Ajustar el año del cumpleaños al año actual
        const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        // Calcular dos meses después del cumpleaños
        const twoMonthsAfter = new Date(birthdayThisYear);
        twoMonthsAfter.setMonth(twoMonthsAfter.getMonth() + 2);
        
        // La opción es visible si estamos entre la fecha de cumpleaños y dos meses después
        return today >= birthdayThisYear && today <= twoMonthsAfter;
    }

    async selectAction(action: 'edit' | 'create' | 'delete' | 'extendBirthday' | 'adjustVacation' | 'adjustCompensatedTime' | 'addEnergyzeSaturday' | 'grantGiftedDays') {
        await this.popoverCtrl.dismiss({ action });
    }
}
