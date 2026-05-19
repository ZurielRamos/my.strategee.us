# CardButton - Ejemplos de Uso

## Ejemplo Completo: Página de Solicitudes

```typescript
// new-request.page.ts
import { Component } from '@angular/core';
import { CardButtonComponent } from '@shared/components/card-button/card-button.component';

interface RequestOption {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    disabled?: boolean;
}

@Component({
    selector: 'app-new-request',
    imports: [CardButtonComponent],
    template: `
        <div class="cards-grid">
            @for (option of requestOptions; track option.id) {
                <app-card-button
                    [title]="option.title"
                    [description]="option.description"
                    [icon]="option.icon"
                    [colorClass]="'color-' + option.color"
                    [disabled]="option.disabled"
                    (cardClick)="handleRequest(option)">
                </app-card-button>
            }
        </div>
    `
})
export class NewRequestPage {
    requestOptions: RequestOption[] = [
        {
            id: 'vacation',
            title: 'Vacaciones',
            description: 'Solicita tus días de vacaciones',
            icon: 'airplane-outline',
            color: 'primary'
        },
        {
            id: 'document',
            title: 'Documentos',
            description: 'Solicita certificados laborales',
            icon: 'document-text-outline',
            color: 'secondary'
        }
    ];

    handleRequest(option: RequestOption) {
        console.log('Request selected:', option);
    }
}
```

## Ejemplo: Cards con Balance Dinámico

```typescript
// benefits.page.ts
import { Component, OnInit } from '@angular/core';
import { CardButtonComponent } from '@shared/components/card-button/card-button.component';

interface Benefit {
    id: string;
    name: string;
    icon: string;
    available: number;
    total: number;
}

@Component({
    selector: 'app-benefits',
    imports: [CardButtonComponent],
    template: `
        <div class="cards-grid">
            @for (benefit of benefits; track benefit.id) {
                <app-card-button
                    [title]="benefit.name"
                    [description]="getBenefitDescription(benefit)"
                    [icon]="benefit.icon"
                    [disabled]="benefit.available === 0"
                    [badge]="getBenefitBadge(benefit)"
                    (cardClick)="useBenefit(benefit)">
                </app-card-button>
            }
        </div>
    `
})
export class BenefitsPage implements OnInit {
    benefits: Benefit[] = [];
    
    ngOnInit() {
        this.loadBenefits();
    }

    loadBenefits() {
        this.benefits = [
            {
                id: '1',
                name: 'Home Office',
                icon: 'laptop-outline',
                available: 3,
                total: 5
            },
            {
                id: '2',
                name: 'Sábado Remoto',
                icon: 'home-outline',
                available: 0,
                total: 2
            }
        ];
    }

    getBenefitDescription(benefit: Benefit): string {
        if (benefit.available === 0) {
            return 'Sin días disponibles este mes';
        }
        return `${benefit.available} de ${benefit.total} días disponibles`;
    }

    getBenefitBadge(benefit: Benefit) {
        if (benefit.available === 0) {
            return { text: 'No disponible', type: 'unavailable' as const };
        }
        return undefined;
    }

    useBenefit(benefit: Benefit) {
        if (benefit.available > 0) {
            console.log('Using benefit:', benefit);
        }
    }
}
```

## Ejemplo: Cards con Estado de Carga

```typescript
// dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { CardButtonComponent } from '@shared/components/card-button/card-button.component';

@Component({
    selector: 'app-dashboard',
    imports: [CardButtonComponent],
    template: `
        <div class="cards-grid">
            <app-card-button
                title="Vacaciones"
                [description]="vacationDescription"
                icon="airplane-outline"
                [loading]="isLoadingVacations"
                [badge]="vacationBadge"
                (cardClick)="requestVacation()">
            </app-card-button>

            <app-card-button
                title="Compensados"
                [description]="compensatedDescription"
                icon="calendar-outline"
                [loading]="isLoadingCompensated"
                [disabled]="!hasCompensatedBalance"
                [badge]="compensatedBadge"
                (cardClick)="useCompensated()">
            </app-card-button>
        </div>
    `
})
export class DashboardPage implements OnInit {
    isLoadingVacations = true;
    isLoadingCompensated = true;
    vacationBalance = 0;
    compensatedBalance = 0;

    ngOnInit() {
        this.loadBalances();
    }

    async loadBalances() {
        // Simular carga de datos
        setTimeout(() => {
            this.vacationBalance = 15;
            this.isLoadingVacations = false;
        }, 1000);

        setTimeout(() => {
            this.compensatedBalance = 0;
            this.isLoadingCompensated = false;
        }, 1500);
    }

    get vacationDescription(): string {
        if (this.isLoadingVacations) return 'Cargando...';
        return `${this.vacationBalance} días disponibles`;
    }

    get vacationBadge() {
        if (this.isLoadingVacations) return undefined;
        return { text: `${this.vacationBalance} días`, type: 'info' as const };
    }

    get compensatedDescription(): string {
        if (this.isLoadingCompensated) return 'Cargando...';
        return this.hasCompensatedBalance 
            ? `${this.compensatedBalance} horas disponibles`
            : 'Sin horas disponibles';
    }

    get compensatedBadge() {
        if (this.isLoadingCompensated) return undefined;
        if (!this.hasCompensatedBalance) {
            return { text: 'No disponible', type: 'unavailable' as const };
        }
        return undefined;
    }

    get hasCompensatedBalance(): boolean {
        return this.compensatedBalance > 0;
    }

    requestVacation() {
        console.log('Request vacation');
    }

    useCompensated() {
        if (this.hasCompensatedBalance) {
            console.log('Use compensated time');
        }
    }
}
```

## Ejemplo: Grid Responsivo con Diferentes Tamaños

```scss
// Configuración de grid para diferentes breakpoints
.cards-grid {
    display: grid;
    gap: 20px;

    // Desktop: 3 columnas
    @media (min-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
    }

    // Tablet: 2 columnas
    @media (min-width: 768px) and (max-width: 1023px) {
        grid-template-columns: repeat(2, 1fr);
    }

    // Mobile: 1 columna
    @media (max-width: 767px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}

// Grid con auto-fill para ajuste automático
.cards-grid-auto {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}
```

## Ejemplo: Cards con Acciones Condicionales

```typescript
// actions.page.ts
import { Component } from '@angular/core';
import { CardButtonComponent } from '@shared/components/card-button/card-button.component';

@Component({
    selector: 'app-actions',
    imports: [CardButtonComponent],
    template: `
        <div class="cards-grid">
            <app-card-button
                title="Acción Permitida"
                description="Esta acción está disponible"
                icon="checkmark-circle-outline"
                colorClass="color-success"
                (cardClick)="performAction('allowed')">
            </app-card-button>

            <app-card-button
                title="Acción Bloqueada"
                description="Requiere permisos adicionales"
                icon="lock-closed-outline"
                [disabled]="true"
                [badge]="{ text: 'Sin permisos', type: 'unavailable' }"
                (cardClick)="performAction('blocked')">
            </app-card-button>

            <app-card-button
                title="Acción en Proceso"
                description="Procesando solicitud..."
                icon="sync-outline"
                [loading]="true"
                (cardClick)="performAction('processing')">
            </app-card-button>
        </div>
    `
})
export class ActionsPage {
    performAction(action: string) {
        console.log('Action:', action);
    }
}
```

## Ejemplo: Integración con Formularios

```typescript
// form-selection.page.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardButtonComponent } from '@shared/components/card-button/card-button.component';

@Component({
    selector: 'app-form-selection',
    imports: [CardButtonComponent, ReactiveFormsModule],
    template: `
        <form [formGroup]="form">
            <div class="cards-grid">
                @for (option of options; track option.id) {
                    <app-card-button
                        [title]="option.title"
                        [description]="option.description"
                        [icon]="option.icon"
                        [class.selected]="isSelected(option.id)"
                        (cardClick)="selectOption(option.id)">
                    </app-card-button>
                }
            </div>
        </form>
    `,
    styles: [`
        .card-button.selected {
            border: 2px solid var(--ion-color-primary);
            box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.1);
        }
    `]
})
export class FormSelectionPage {
    form: FormGroup;
    options = [
        { id: 'option1', title: 'Opción 1', description: 'Descripción 1', icon: 'star-outline' },
        { id: 'option2', title: 'Opción 2', description: 'Descripción 2', icon: 'heart-outline' },
        { id: 'option3', title: 'Opción 3', description: 'Descripción 3', icon: 'trophy-outline' }
    ];

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            selectedOption: [null]
        });
    }

    selectOption(optionId: string) {
        this.form.patchValue({ selectedOption: optionId });
    }

    isSelected(optionId: string): boolean {
        return this.form.get('selectedOption')?.value === optionId;
    }
}
```
