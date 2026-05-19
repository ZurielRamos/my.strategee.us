# Guías de Modales de Formularios

Estándares para la creación de modales que contengan formularios.

## Estructura Base

### 1. Usar BaseModalComponent

```html
<app-base-modal 
    title="Título del Modal"
    subtitle="Descripción breve opcional"
    confirmText="Guardar"
    [confirmDisabled]="!form.valid"
    [loading]="isSubmitting"
    (modalDismiss)="onDismiss()"
    (modalConfirm)="onConfirm()">
    
    <form [formGroup]="form">
        <!-- Contenido del formulario -->
    </form>
    
</app-base-modal>
```

### 2. Abrir el Modal con ModalService

```typescript
import { ModalService } from '@shared/services/modal.service';

constructor(private modalService: ModalService) {}

async openModal() {
    const result = await this.modalService.open(
        MyModalComponent,
        { data: someData }
    );

    if (result.role === 'save' && result.data) {
        // Manejar datos guardados
    }
}
```

## Estructura del Componente

### TypeScript

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { BaseModalComponent } from '@shared/components/base-modal/base-modal.component';
import { AlertBoxComponent } from '@shared/components/alert-box/alert-box.component';
import { FormSelectComponent, SelectOption } from '@shared/components/form-select/form-select.component';
import { DateInputComponent } from '@shared/components/date-input/date-input.component';
import { TextareaInputComponent } from '@shared/components/textarea-input/textarea-input.component';
import { TimeInputComponent } from '@shared/components/time-input/time-input.component';
import { ShiftSelectorComponent, ShiftOption } from '@shared/components/shift-selector/shift-selector.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { ToastService } from '@shared/services/toast.service';

@Component({
    selector: 'app-my-modal',
    templateUrl: './my-modal.component.html',
    styleUrls: ['./my-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        AlertBoxComponent,
        FormSelectComponent,
        DateInputComponent,
        TextareaInputComponent,
        TimeInputComponent,
        ShiftSelectorComponent,
        TextInputComponent,
        // Ionic components necesarios
    ]
})
export class MyModalComponent implements OnInit {
    @Input() requiredData!: any;

    form!: FormGroup;
    isSubmitting = false;
    
    // Datos para selects
    items: any[] = [];

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.form = this.fb.group({
            campo1: ['', [Validators.required]],
            selectField: ['', [Validators.required]]
        });
        this.loadData();
    }

    loadData() {
        // Cargar datos para los selects
    }

    // Getter para formatear opciones del select
    get itemOptions(): SelectOption[] {
        return this.items.map(item => ({
            value: item.id,
            label: item.name
        }));
    }

    // Método de ejemplo para calcular duración entre horas
    getDuration(): string {
        const startTime = this.form.get('startTime')?.value;
        const endTime = this.form.get('endTime')?.value;
        
        if (!startTime || !endTime) return '';
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) return '';
        
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        if (hours === 0) {
            return `${minutes} minutos`;
        } else if (minutes === 0) {
            return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
            return `${hours}h ${minutes}m`;
        }
    }

    /**
     * IMPORTANTE: El modal NO debe cerrarse hasta que la petición termine
     * - Mantener isSubmitting = true durante la petición
     * - Mostrar toast al finalizar (éxito o error)
     * - Solo cerrar el modal si la petición fue exitosa
     * - Si hay error, mantener el modal abierto y resetear isSubmitting
     */
    onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            // Ejemplo con Observable
            this.myService.save(this.form.value).subscribe({
                next: async (response) => {
                    await this.toastService.success('Datos guardados correctamente');
                    this.modalCtrl.dismiss(response, 'save');
                },
                error: async (error) => {
                    await this.toastService.error(
                        error.message || 'Error al guardar los datos'
                    );
                    this.isSubmitting = false; // Permitir reintentar
                }
            });
            
            // Ejemplo con Promise
            /*
            try {
                const response = await this.myService.save(this.form.value);
                await this.toastService.success('Datos guardados correctamente');
                this.modalCtrl.dismiss(response, 'save');
            } catch (error: any) {
                await this.toastService.error(
                    error.message || 'Error al guardar los datos'
                );
                this.isSubmitting = false; // Permitir reintentar
            }
            */
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}
```

### HTML

```html
<app-base-modal 
    title="Título"
    subtitle="Descripción"
    confirmText="Guardar"
    [confirmDisabled]="!form.valid"
    [loading]="isSubmitting"
    (modalDismiss)="onDismiss()"
    (modalConfirm)="onConfirm()">
    
    <form [formGroup]="form">
        <!-- Título de sección -->
        <h4 class="section-title">Información General</h4>

        <!-- Campo de selección (3+ opciones) - USAR FormSelectComponent -->
        <app-form-select
            label="Categoría"
            [options]="itemOptions"
            formControlName="selectField"
            placeholder="Seleccione una opción"
            [required]="true">
        </app-form-select>

        <!-- Campo de selección con ayuda -->
        <app-form-select
            label="Tipo"
            [options]="typeOptions"
            formControlName="typeField"
            placeholder="Seleccione tipo"
            helperText="Este campo determina el comportamiento"
            helperIcon="information-circle-outline"
            [required]="true">
        </app-form-select>

        <!-- Campo de texto simple -->
        <ion-item lines="none">
            <ion-label position="stacked">Nombre *</ion-label>
            <ion-input 
                formControlName="name" 
                placeholder="Ingrese el nombre">
            </ion-input>
        </ion-item>

        <!-- Título de sección -->
        <h4 class="section-title">Fechas</h4>

        <!-- Campo de fecha única - USAR DateInputComponent -->
        <app-date-input
            formControlName="startDate"
            label="Fecha de Inicio"
            placeholder="Selecciona fecha"
            mode="single"
            [required]="true"
            [minDate]="minDate">
        </app-date-input>

        <!-- Campos de fecha en fila -->
        <div class="form-row">
            <app-date-input
                formControlName="startDate"
                label="Fecha de Inicio"
                mode="single"
                [required]="true">
            </app-date-input>

            <app-date-input
                formControlName="endDate"
                label="Fecha de Fin"
                mode="single">
            </app-date-input>
        </div>

        <!-- Título de sección -->
        <h4 class="section-title">Horarios</h4>

        <!-- Campo de hora - USAR TimeInputComponent -->
        <app-time-input
            formControlName="meetingTime"
            label="Hora de la Reunión"
            [required]="true">
        </app-time-input>

        <!-- Campos de hora en fila (rango) -->
        <div class="form-row">
            <app-time-input
                formControlName="startTime"
                label="Hora de Inicio"
                [required]="true">
            </app-time-input>

            <app-time-input
                formControlName="endTime"
                label="Hora de Fin"
                [required]="true">
            </app-time-input>
        </div>

        <!-- Duración calculada (opcional) -->
        @if (getDuration()) {
            <div class="duration-info">
                <ion-icon name="time-outline"></ion-icon>
                <span>Duración: {{ getDuration() }}</span>
            </div>
        }

        <!-- Título de sección -->
        <h4 class="section-title">Detalles</h4>

        <!-- Campo de texto largo - USAR TextareaInputComponent -->
        <app-textarea-input
            formControlName="reason"
            label="Razón del Cambio"
            placeholder="Ej: Promoción, Ajuste salarial, etc."
            [required]="true"
            [rows]="3">
        </app-textarea-input>

        <!-- Textarea con contador de caracteres -->
        <app-textarea-input
            formControlName="comments"
            label="Comentarios"
            placeholder="Agrega comentarios adicionales..."
            [rows]="4"
            [maxlength]="500"
            [showCharCounter]="true">
        </app-textarea-input>

        <!-- Mensaje de error -->
        @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <div class="error-message">
                Campo requerido
            </div>
        }

        <!-- Alert informativo -->
        <app-alert-box type="info">
            Mensaje informativo para el usuario
        </app-alert-box>
    </form>
</app-base-modal>
```

### SCSS

```scss
// Títulos de sección
.section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--app-text-primary);
    margin: 24px 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--app-border-light);
}

// Grid para campos en fila
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    @media (max-width: 576px) {
        grid-template-columns: 1fr;
    }
}

// Estilos de campos
ion-item {
    --background: var(--app-hover-bg);
    --border-radius: 12px;
    --padding-start: 16px;
    --padding-end: 16px;
    --min-height: 56px;
    --border-width: 0;
    margin-bottom: 16px;
    border-radius: 12px;
    transition: all 0.2s ease;

    &:focus-within {
        --background: var(--app-card-bg);
        box-shadow: 0 0 0 2px var(--app-text-primary);
    }

    ion-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--app-text-primary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    ion-input,
    ion-select,
    ion-textarea {
        font-size: 15px;
        font-weight: 500;
        color: var(--app-text-primary);
        --padding-start: 0;
        --padding-end: 0;

        &::placeholder {
            color: var(--app-text-secondary);
            opacity: 0.7;
        }
    }

    ion-select {
        width: 100%;
        max-width: 100%;
    }

    ion-note {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--app-text-secondary);
        margin-top: 8px;

        ion-icon {
            font-size: 14px;
        }
    }
}

// Mensajes de error
.error-message {
    color: #eb445a;
    font-size: 12px;
    font-weight: 600;
    margin: -12px 0 16px 16px;
}

// Indicador de duración
.duration-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #e3f2fd;
    border-radius: 8px;
    margin: -8px 0 16px 0;
    border-left: 3px solid #2196f3;

    ion-icon {
        font-size: 20px;
        color: #2196f3;
        flex-shrink: 0;
    }

    span {
        font-size: 14px;
        font-weight: 600;
        color: #1976d2;
    }
}
```

## Componentes Reutilizables

### 1. FormSelectComponent

**IMPORTANTE**: Para campos de selección con 3 o más opciones, SIEMPRE usar `FormSelectComponent`.

**Cuándo usar:**
- ✅ Selección de categorías, tipos, estados
- ✅ Listas de entidades (empleados, departamentos, ubicaciones)
- ✅ Cualquier select con 3+ opciones
- ❌ NO usar para campos booleanos (usar ion-toggle o ion-checkbox)
- ❌ NO usar para 2 opciones simples (considerar ion-segment o ion-radio-group)

**Características:**
- Integración completa con Angular Forms (ControlValueAccessor)
- Estilos consistentes con el diseño de la app
- Popover con bordes redondeados
- Soporte para texto de ayuda e iconos
- Marcado automático de campos requeridos

**Uso básico:**
```html
<app-form-select
    label="Cargo"
    [options]="positionOptions"
    formControlName="positionId"
    placeholder="Seleccione cargo"
    [required]="true">
</app-form-select>
```

**Con texto de ayuda:**
```html
<app-form-select
    label="Parámetro Global"
    [options]="parameterOptions"
    formControlName="parameterKey"
    placeholder="Seleccione parámetro"
    helperText="El valor se actualizará automáticamente"
    helperIcon="information-circle-outline"
    [required]="true">
</app-form-select>
```

**Preparar opciones en TypeScript:**
```typescript
import { SelectOption } from '@shared/components/form-select/form-select.component';

// Datos cargados del API
positions: any[] = [];

// Getter para formatear opciones
get positionOptions(): SelectOption[] {
    return this.positions.map(p => ({
        value: p.id,
        label: p.name
    }));
}
```

**Props disponibles:**
- `label` (string): Etiqueta del campo
- `options` (SelectOption[]): Array de opciones `{ value, label }`
- `placeholder` (string): Texto cuando no hay selección
- `required` (boolean): Marca el campo como requerido (agrega *)
- `helperText` (string): Texto de ayuda opcional
- `helperIcon` (string): Nombre del icono de Ionicons
- `interface` ('alert' | 'action-sheet' | 'popover'): Tipo de interfaz, default: 'popover'

---

### 2. DateInputComponent

**IMPORTANTE**: Para campos de fecha, SIEMPRE usar `DateInputComponent` en lugar de `<ion-input type="date">`.

**Cuándo usar:**
- ✅ Fecha única (fecha de nacimiento, fecha de inicio, etc.)
- ✅ Rango de fechas (período de vacaciones, vigencia de contrato)
- ✅ Cualquier selección de fecha que requiera validación
- ❌ NO usar para campos de hora (usar TimePicker)

**Características:**
- Integración completa con Angular Forms (ControlValueAccessor)
- Datepicker visual con calendario
- Soporte para fecha única o rango de fechas
- Validación de fechas mínimas y máximas
- Exclusión de días de la semana
- Validación personalizada
- Formato español (dd/mm/yyyy)

**Uso básico - Fecha única:**
```html
<app-date-input
    formControlName="startDate"
    label="Fecha de Inicio"
    placeholder="Selecciona fecha"
    mode="single"
    [required]="true"
    [minDate]="minDate">
</app-date-input>
```

**Uso - Rango de fechas:**
```html
<app-date-input
    formControlName="vacationPeriod"
    label="Período de Vacaciones"
    placeholder="dd/mm/yyyy al dd/mm/yyyy"
    mode="range"
    [required]="true"
    [minDate]="today"
    [maxDate]="maxDate"
    [disabledDaysOfWeek]="[0]"
    [customValidator]="validateQuota">
</app-date-input>
```

**Con validación personalizada:**
```typescript
// En el componente TypeScript
minDate: Date;
maxDate: Date;

constructor() {
    this.minDate = new Date();
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
}

// Validador personalizado (opcional)
customValidator = (date: Date, currentSelection?: { start: Date | null; end: Date | null }): boolean => {
    // Retorna true para deshabilitar la fecha
    // Ejemplo: deshabilitar fechas que excedan una cuota
    if (!currentSelection?.start) return false;
    const days = this.calculateDays(currentSelection.start, date);
    return days > this.maxAllowedDays;
}
```

**Props disponibles:**
- `label` (string): Etiqueta del campo
- `placeholder` (string): Texto placeholder
- `mode` ('single' | 'range'): Modo de selección, default: 'single'
- `required` (boolean): Marca el campo como requerido
- `minDate` (Date): Fecha mínima seleccionable
- `maxDate` (Date): Fecha máxima seleccionable
- `disabledDaysOfWeek` (number[]): Días deshabilitados (0=Domingo, 6=Sábado)
- `customValidator` (Function): Función de validación personalizada

**Formato de datos:**
- Modo `single`: El FormControl recibe un string en formato `YYYY-MM-DD`
- Modo `range`: El FormControl recibe un objeto `{ startDate: string, endDate: string }`

**Documentación completa:**
- Ver `app/src/app/shared/components/date-input/README.md`
- Ver ejemplos en `app/src/app/shared/components/date-input/EXAMPLES.md`

---

### 3. TextareaInputComponent

**IMPORTANTE**: Para campos de texto largo, SIEMPRE usar `TextareaInputComponent` en lugar de `<ion-textarea>`.

**Cuándo usar:**
- ✅ Descripciones, comentarios, notas
- ✅ Razones, motivos, justificaciones
- ✅ Direcciones
- ✅ Cualquier texto que requiera múltiples líneas
- ❌ NO usar para campos de una sola línea (usar ion-input)

**Características:**
- Integración completa con Angular Forms (ControlValueAccessor)
- Contador de caracteres opcional
- Límite de caracteres configurable
- Alertas visuales cuando se acerca al límite
- Texto de ayuda opcional
- Modo de solo lectura
- Estilos consistentes

**Uso básico:**
```html
<app-textarea-input
    formControlName="reason"
    label="Razón del Cambio"
    placeholder="Ej: Promoción, Ajuste salarial, etc."
    [required]="true"
    [rows]="3">
</app-textarea-input>
```

**Con límite de caracteres y contador:**
```html
<app-textarea-input
    formControlName="comments"
    label="Comentarios"
    placeholder="Agrega tus comentarios..."
    [rows]="4"
    [maxlength]="500"
    [showCharCounter]="true">
</app-textarea-input>
```

**Con texto de ayuda:**
```html
<app-textarea-input
    formControlName="description"
    label="Descripción"
    placeholder="Describe el motivo..."
    [required]="true"
    [rows]="4"
    [maxlength]="500"
    [showCharCounter]="true"
    helperText="Explica claramente el motivo del cambio">
</app-textarea-input>
```

**Solo lectura:**
```html
<app-textarea-input
    formControlName="notes"
    label="Notas"
    [readonly]="true"
    [rows]="5">
</app-textarea-input>
```

**Props disponibles:**
- `label` (string): Etiqueta del campo
- `placeholder` (string): Texto placeholder
- `required` (boolean): Marca el campo como requerido
- `rows` (number): Número de filas visibles, default: 3
- `maxlength` (number): Límite máximo de caracteres
- `showCharCounter` (boolean): Muestra contador de caracteres
- `helperText` (string): Texto de ayuda debajo del textarea
- `readonly` (boolean): Modo de solo lectura

**Estados del contador:**
- Normal: Texto gris (suficientes caracteres disponibles)
- Cerca del límite: Texto naranja (≤50 caracteres restantes)
- En el límite: Texto rojo (0 caracteres restantes)

**Documentación completa:**
- Ver `app/src/app/shared/components/textarea-input/README.md`

---

### 4. TimeInputComponent

**IMPORTANTE**: Para campos de hora, SIEMPRE usar `TimeInputComponent` en lugar de `<ion-input type="time">`.

**Cuándo usar:**
- ✅ Hora de entrada/salida
- ✅ Hora de reunión o cita
- ✅ Horarios de trabajo
- ✅ Cualquier selección de hora
- ❌ NO usar para fechas (usar DateInputComponent)
- ❌ NO usar para duraciones (usar ion-input type="number")

**Características:**
- Integración completa con Angular Forms (ControlValueAccessor)
- Time picker visual con selector de hora y minutos
- Formato HH:MM (24 horas)
- Texto de ayuda opcional
- Estilos consistentes

**Uso básico:**
```html
<app-time-input
    formControlName="startTime"
    label="Hora de Inicio"
    [required]="true">
</app-time-input>
```

**Rango de horas:**
```html
<app-time-input
    formControlName="exitTime"
    label="Hora de Salida"
    [required]="true">
</app-time-input>

<app-time-input
    formControlName="returnTime"
    label="Hora de Regreso"
    [required]="true">
</app-time-input>
```

**Con texto de ayuda:**
```html
<app-time-input
    formControlName="meetingTime"
    label="Hora de la Reunión"
    [required]="true"
    helperText="La reunión será en formato virtual">
</app-time-input>
```

**Props disponibles:**
- `label` (string): Etiqueta del campo
- `placeholder` (string): Texto placeholder, default: 'HH:MM'
- `required` (boolean): Marca el campo como requerido
- `helperText` (string): Texto de ayuda debajo del input

**Formato de datos:**
- El FormControl recibe un string en formato `HH:MM` (ej: "14:30", "09:00")
- Formato de 24 horas

**Cálculo de duración:**
```typescript
calculateDuration(): string {
  const startTime = this.form.get('startTime')?.value;
  const endTime = this.form.get('endTime')?.value;
  
  if (!startTime || !endTime) return '';
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  return `${hours}h ${minutes}m`;
}
```

**Documentación completa:**
- Ver `app/src/app/shared/components/time-input/README.md`

---

### 5. ShiftSelectorComponent

**IMPORTANTE**: Para campos de selección de turno (mañana/tarde u otras opciones), SIEMPRE usar `ShiftSelectorComponent`.

**Cuándo usar:**
- ✅ Selección de turno (mañana/tarde)
- ✅ Horarios de trabajo (matutino/vespertino/nocturno)
- ✅ Períodos del día
- ✅ Cualquier selección de 2-4 opciones que se beneficie de botones visuales
- ❌ NO usar para listas largas (usar FormSelectComponent)
- ❌ NO usar para campos booleanos simples (usar ion-toggle)

**Características:**
- Integración completa con Angular Forms (ControlValueAccessor)
- Botones visuales con iconos
- Opciones personalizables
- Soporte para modo readonly y disabled
- Estilos consistentes

**Uso básico:**
```html
<app-shift-selector
    formControlName="shift"
    label="Turno"
    [options]="shiftOptions"
    [required]="true">
</app-shift-selector>
```

**Definir opciones en TypeScript:**
```typescript
import { ShiftOption } from '@shared/components/shift-selector/shift-selector.component';

shiftOptions: ShiftOption[] = [
    { value: 'MANANA', label: 'Mañana', icon: 'time-outline' },
    { value: 'TARDE', label: 'Tarde', icon: 'time-outline' }
];
```

**Con más opciones:**
```typescript
workShiftOptions: ShiftOption[] = [
    { value: 'MORNING', label: 'Matutino', icon: 'sunny-outline' },
    { value: 'AFTERNOON', label: 'Vespertino', icon: 'partly-sunny-outline' },
    { value: 'NIGHT', label: 'Nocturno', icon: 'moon-outline' }
];
```

```html
<app-shift-selector
    formControlName="workShift"
    label="Turno de Trabajo"
    [options]="workShiftOptions"
    [required]="true">
</app-shift-selector>
```

**Solo lectura:**
```html
<app-shift-selector
    formControlName="shift"
    label="Turno Asignado"
    [options]="shiftOptions"
    [readonly]="true">
</app-shift-selector>
```

**Props disponibles:**
- `label` (string): Etiqueta del campo, default: 'Turno'
- `options` (ShiftOption[]): Array de opciones `{ value, label, icon? }`
- `required` (boolean): Marca el campo como requerido
- `readonly` (boolean): Modo de solo lectura

**Interfaz ShiftOption:**
```typescript
interface ShiftOption {
  value: string;      // Valor que se guarda en el formulario
  label: string;      // Texto que se muestra al usuario
  icon?: string;      // Icono de Ionicons (opcional, default: 'time-outline')
}
```

**Formato de datos:**
- El FormControl recibe un string con el `value` de la opción seleccionada

**Documentación completa:**
- Ver `app/src/app/shared/components/shift-selector/README.md`

---

### 6. TextInputComponent

**IMPORTANTE**: Para campos de texto de una sola línea, SIEMPRE usar `TextInputComponent` en lugar de `<ion-input>` cuando necesites funcionalidades adicionales.

**Cuándo usar:**
- ✅ Campos de texto con validación HTML5
- ✅ Campos que necesitan modo readonly
- ✅ Campos con texto de ayuda
- ✅ Emails, teléfonos, URLs, contraseñas
- ✅ Campos numéricos con validación
- ❌ NO usar para texto largo (usar TextareaInputComponent)
- ❌ NO usar para fechas (usar DateInputComponent)
- ❌ NO usar para horas (usar TimeInputComponent)

**Características:**
- Integración completa con Angular Forms (ControlValueAccessor)
- Soporte para múltiples tipos: text, email, tel, number, url, password
- Validación HTML5 (maxlength, minlength, pattern)
- Texto de ayuda con icono opcional
- Modo readonly
- Autocomplete configurable
- Estilos consistentes

**Uso básico:**
```html
<app-text-input
    formControlName="firstName"
    label="Nombres"
    placeholder="Ej: Juan Carlos"
    [required]="true">
</app-text-input>
```

**Campo de email:**
```html
<app-text-input
    formControlName="email"
    label="Email Personal"
    placeholder="Ej: juan.garcia@email.com"
    type="email"
    [required]="true">
</app-text-input>
```

**Campo de teléfono:**
```html
<app-text-input
    formControlName="phone"
    label="Teléfono"
    placeholder="Ej: +51 999 999 999"
    type="tel"
    [required]="true">
</app-text-input>
```

**Campo numérico:**
```html
<app-text-input
    formControlName="age"
    label="Edad"
    type="number"
    [min]="18"
    [max]="100"
    [required]="true">
</app-text-input>
```

**Con validación de longitud:**
```html
<app-text-input
    formControlName="documentNumber"
    label="Número de Documento"
    placeholder="Ej: 12345678"
    [required]="true"
    [minlength]="8"
    [maxlength]="12">
</app-text-input>
```

**Con texto de ayuda:**
```html
<app-text-input
    formControlName="username"
    label="Nombre de Usuario"
    placeholder="Ej: jgarcia"
    [required]="true"
    helperText="Solo letras minúsculas y números"
    helperIcon="information-circle-outline">
</app-text-input>
```

**Solo lectura:**
```html
<app-text-input
    formControlName="employeeCode"
    label="Código de Empleado"
    [readonly]="true">
</app-text-input>
```

**Props disponibles:**
- `label` (string): Etiqueta del campo
- `placeholder` (string): Texto placeholder
- `type` ('text' | 'email' | 'tel' | 'number' | 'url' | 'password'): Tipo de input, default: 'text'
- `required` (boolean): Marca el campo como requerido
- `readonly` (boolean): Modo de solo lectura
- `maxlength` (number): Longitud máxima
- `minlength` (number): Longitud mínima
- `min` (number): Valor mínimo (para type="number")
- `max` (number): Valor máximo (para type="number")
- `pattern` (string): Patrón de validación regex
- `autocomplete` (string): Atributo autocomplete HTML5
- `helperText` (string): Texto de ayuda debajo del input
- `helperIcon` (string): Icono de Ionicons para el texto de ayuda

**Formato de datos:**
- El FormControl recibe un string (o number para type="number")

**Documentación completa:**
- Ver `app/src/app/shared/components/text-input/README.md`

---

### 7. AlertBoxComponent

**IMPORTANTE**: Para mostrar mensajes informativos, advertencias o errores en formularios, SIEMPRE usar `AlertBoxComponent`.

**Cuándo usar:**
- ✅ Mensajes informativos sobre el formulario
- ✅ Advertencias sobre validaciones o restricciones
- ✅ Mensajes de error generales
- ✅ Mensajes de éxito o confirmación
- ✅ Instrucciones importantes para el usuario
- ❌ NO usar para errores de validación de campos individuales (usar mensajes debajo del campo)

**Características:**
- 4 tipos visuales: info, warning, danger, success
- Soporte para texto simple o contenido HTML
- Iconos automáticos según el tipo
- Estilos consistentes con el sistema de diseño
- Responsive y accesible

**Tipos disponibles:**

| Tipo | Uso | Color | Icono |
|------|-----|-------|-------|
| `info` | Información general | Azul | information-circle |
| `warning` | Advertencias | Naranja | alert-circle |
| `danger` | Errores | Rojo | close-circle |
| `success` | Confirmaciones | Verde | checkmark-circle |

**Uso básico con mensaje:**
```html
<app-alert-box type="info" message="Este es un mensaje informativo"></app-alert-box>
```

**Con contenido HTML:**
```html
<app-alert-box type="info">
    Puedes usar <strong>HTML</strong> dentro del alert box.
</app-alert-box>
```

**Ejemplos por tipo:**

```html
<!-- Información -->
<app-alert-box type="info">
    Todos los campos marcados con (*) son obligatorios.
</app-alert-box>

<!-- Advertencia -->
<app-alert-box type="warning">
    Esta acción no se puede deshacer. Asegúrate de revisar los datos antes de continuar.
</app-alert-box>

<!-- Error -->
<app-alert-box type="danger">
    No se pudo procesar la solicitud. Por favor intenta nuevamente.
</app-alert-box>

<!-- Éxito -->
<app-alert-box type="success">
    Los cambios se guardaron correctamente.
</app-alert-box>
```

**Uso común en formularios:**

```html
<form [formGroup]="form">
    <!-- Información importante al inicio -->
    <app-alert-box type="info">
        Solicita tu medio día de cumpleaños. Puedes tomarlo el día de tu cumpleaños o hasta 1 mes después.
    </app-alert-box>

    <!-- Campos del formulario -->
    <app-date-input formControlName="date" label="Fecha"></app-date-input>
    
    <!-- Advertencia sobre restricciones -->
    <app-alert-box type="warning">
        Solo puedes solicitar este beneficio una vez por año.
    </app-alert-box>

    <!-- Error general del formulario -->
    @if (errorMessage) {
        <app-alert-box type="danger">
            {{ errorMessage }}
        </app-alert-box>
    }
</form>
```

**Con contenido dinámico:**
```typescript
errorMessage = '';

onSubmit() {
    this.service.save(this.form.value).subscribe({
        error: (error) => {
            this.errorMessage = error.message || 'Ocurrió un error inesperado';
        }
    });
}
```

```html
@if (errorMessage) {
    <app-alert-box type="danger">
        {{ errorMessage }}
    </app-alert-box>
}
```

**Props disponibles:**
- `type` ('info' | 'warning' | 'danger' | 'success'): Tipo de alerta, default: 'info'
- `message` (string): Mensaje de texto simple (opcional si usas contenido HTML)

**Buenas prácticas:**
- Usa `info` para instrucciones y contexto general
- Usa `warning` para advertencias que el usuario debe considerar
- Usa `danger` para errores que impiden continuar
- Usa `success` para confirmaciones de acciones exitosas
- Coloca alertas informativas al inicio del formulario
- Coloca alertas de error cerca de donde ocurre el problema
- Mantén los mensajes concisos y claros

## Validación de Formularios

```typescript
// Validadores comunes
campo: ['', [Validators.required]]
email: ['', [Validators.required, Validators.email]]
cantidad: [null, [Validators.required, Validators.min(1), Validators.max(100)]]
```

```html
<!-- Mensajes de error -->
@if (form.get('campo')?.invalid && form.get('campo')?.touched) {
    <div class="error-message">
        @if (form.get('campo')?.errors?.['required']) {
            Campo requerido
        }
        @if (form.get('campo')?.errors?.['email']) {
            Email inválido
        }
    </div>
}
```

## Manejo de Peticiones y Notificaciones

### REGLA CRÍTICA: Los modales NO deben cerrarse hasta que la petición termine

**Flujo correcto:**
1. Usuario hace clic en "Guardar"
2. Modal entra en estado de carga (`isSubmitting = true`)
3. Se ejecuta la petición al backend
4. Si es exitosa:
   - Mostrar toast de éxito
   - Cerrar el modal
   - Retornar los datos
5. Si falla:
   - Mostrar toast de error
   - Mantener el modal abierto
   - Resetear `isSubmitting = false` para permitir reintentar

### ToastService

Usar `ToastService` para todas las notificaciones:

```typescript
import { ToastService } from '@shared/services/toast.service';

constructor(
    private toastService: ToastService
) {}
```

**Métodos disponibles:**
- `success(message)`: Toast verde para operaciones exitosas
- `error(message)`: Toast rojo para errores
- `warning(message)`: Toast naranja para advertencias
- `info(message)`: Toast azul para información

### Patrón con Observable

```typescript
onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
        this.isSubmitting = true;
        
        this.myService.save(this.form.value).subscribe({
            next: async (response) => {
                // 1. Mostrar toast de éxito
                await this.toastService.success('Datos guardados correctamente');
                
                // 2. Cerrar modal con los datos
                this.modalCtrl.dismiss(response, 'save');
            },
            error: async (error) => {
                // 1. Mostrar toast de error
                await this.toastService.error(
                    error.message || 'Error al guardar los datos'
                );
                
                // 2. Resetear estado para permitir reintentar
                this.isSubmitting = false;
                
                // 3. NO cerrar el modal
            }
        });
    }
}
```

### Patrón con Promise/Async-Await

```typescript
async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
        this.isSubmitting = true;
        
        try {
            // Ejecutar petición
            const response = await this.myService.save(this.form.value);
            
            // Mostrar toast de éxito
            await this.toastService.success('Datos guardados correctamente');
            
            // Cerrar modal
            this.modalCtrl.dismiss(response, 'save');
            
        } catch (error: any) {
            // Mostrar toast de error
            await this.toastService.error(
                error.message || 'Error al guardar los datos'
            );
            
            // Resetear estado para permitir reintentar
            this.isSubmitting = false;
            
            // NO cerrar el modal
        }
    }
}
```

### Ejemplo Completo: Crear Empleado

```typescript
async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
        this.isSubmitting = true;
        
        try {
            const employee = await this.employeeService.create(this.form.value);
            await this.toastService.success('Empleado creado correctamente');
            this.modalCtrl.dismiss(employee, 'save');
        } catch (error: any) {
            if (error.status === 409) {
                await this.toastService.error('Ya existe un empleado con ese documento');
            } else {
                await this.toastService.error('Error al crear el empleado');
            }
            this.isSubmitting = false;
        }
    }
}
```

### Ejemplo Completo: Actualizar Datos

```typescript
async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
        this.isSubmitting = true;
        
        this.dataService.update(this.id, this.form.value).subscribe({
            next: async (updated) => {
                await this.toastService.success('Cambios guardados correctamente');
                this.modalCtrl.dismiss(updated, 'save');
            },
            error: async (error) => {
                const message = error.error?.message || 'Error al actualizar los datos';
                await this.toastService.error(message);
                this.isSubmitting = false;
            }
        });
    }
}
```

### Ejemplo Completo: Eliminar Registro

```typescript
async onDelete() {
    if (!this.isSubmitting) {
        this.isSubmitting = true;
        
        try {
            await this.service.delete(this.id);
            await this.toastService.success('Registro eliminado correctamente');
            this.modalCtrl.dismiss(null, 'delete');
        } catch (error: any) {
            if (error.status === 409) {
                await this.toastService.error('No se puede eliminar: tiene registros asociados');
            } else {
                await this.toastService.error('Error al eliminar el registro');
            }
            this.isSubmitting = false;
        }
    }
}
```

### Mensajes de Toast Recomendados

**Operaciones CRUD:**
- Crear: "Registro creado correctamente"
- Actualizar: "Cambios guardados correctamente"
- Eliminar: "Registro eliminado correctamente"

**Solicitudes:**
- Crear: "Solicitud enviada correctamente"
- Aprobar: "Solicitud aprobada"
- Rechazar: "Solicitud rechazada"

**Errores comunes:**
- Genérico: "Error al procesar la solicitud"
- Validación: "Verifica los datos ingresados"
- Conflicto: "Ya existe un registro con esos datos"
- Dependencias: "No se puede eliminar: tiene registros asociados"
- Red: "Error de conexión. Intenta nuevamente"

### ❌ NO HACER

```typescript
// MAL: Cerrar el modal inmediatamente
onConfirm() {
    this.isSubmitting = true;
    this.modalCtrl.dismiss(this.form.value, 'save'); // ❌ NO!
    
    // La petición se ejecuta después de cerrar
    this.service.save(this.form.value).subscribe();
}

// MAL: No mostrar toast
onConfirm() {
    this.service.save(this.form.value).subscribe({
        next: (response) => {
            this.modalCtrl.dismiss(response, 'save'); // ❌ Sin feedback!
        }
    });
}

// MAL: Cerrar el modal en caso de error
onConfirm() {
    this.service.save(this.form.value).subscribe({
        error: (error) => {
            this.toastService.error('Error');
            this.modalCtrl.dismiss(); // ❌ El usuario pierde sus datos!
        }
    });
}
```

### ✅ HACER

```typescript
// BIEN: Esperar la petición, mostrar toast, cerrar solo si es exitoso
async onConfirm() {
    if (this.form.valid && !this.isSubmitting) {
        this.isSubmitting = true;
        
        try {
            const result = await this.service.save(this.form.value);
            await this.toastService.success('Guardado correctamente');
            this.modalCtrl.dismiss(result, 'save');
        } catch (error: any) {
            await this.toastService.error('Error al guardar');
            this.isSubmitting = false; // Permitir reintentar
        }
    }
}
```

## Reglas Importantes

1. ✅ SIEMPRE usar `BaseModalComponent`
2. ✅ SIEMPRE usar `ModalService.open()` para abrir modales
3. ✅ SIEMPRE usar `ToastService` para notificaciones
4. ✅ SIEMPRE esperar a que la petición termine antes de cerrar el modal
5. ✅ SIEMPRE mostrar toast después de operaciones (éxito o error)
6. ✅ NUNCA cerrar el modal si la petición falla
7. ✅ SIEMPRE resetear `isSubmitting = false` en caso de error
8. ✅ SIEMPRE usar `FormSelectComponent` para selects con 3+ opciones
9. ✅ SIEMPRE usar `DateInputComponent` para campos de fecha
10. ✅ SIEMPRE usar `TextareaInputComponent` para campos de texto largo
11. ✅ SIEMPRE usar `TimeInputComponent` para campos de hora
12. ✅ SIEMPRE usar `ShiftSelectorComponent` para selección de turnos
13. ✅ SIEMPRE usar `TextInputComponent` para campos de texto con validación
14. ✅ Usar `AlertBoxComponent` para mensajes informativos en formularios
15. ✅ Marcar campos requeridos con asterisco (*)
16. ✅ Deshabilitar botón cuando formulario es inválido o está enviando
17. ✅ Crear getters para formatear opciones de selects

## Componentes a Usar

| Tipo de Campo | Componente | Cuándo Usar |
|---------------|------------|-------------|
| Select (3+ opciones) | `<app-form-select>` | Categorías, tipos, listas |
| Fecha única | `<app-date-input mode="single">` | Fecha de inicio, nacimiento, etc. |
| Rango de fechas | `<app-date-input mode="range">` | Período de vacaciones, vigencia |
| Hora | `<app-time-input>` | Hora de entrada, salida, reunión |
| Turno/Período | `<app-shift-selector>` | Mañana/Tarde, turnos de trabajo |
| Texto largo | `<app-textarea-input>` | Descripciones, comentarios, razones |
| Texto corto | `<app-text-input>` | Nombres, emails, teléfonos, documentos |
| Texto simple | `<ion-input>` | Campos básicos sin validación especial |
| Número | `<app-text-input type="number">` | Cantidades, edades con validación |
| Email | `<app-text-input type="email">` | Correos con validación |
| Teléfono | `<app-text-input type="tel">` | Números telefónicos |
| Toggle | `<ion-toggle>` | Opciones booleanas |
| Checkbox | `<ion-checkbox>` | Selección múltiple |

## Migración de Componentes Antiguos

### Migrar ion-select a FormSelectComponent

**Antes:**
```html
<ion-item lines="none">
    <ion-label position="stacked">Cargo *</ion-label>
    <ion-select formControlName="positionId" placeholder="Seleccione">
        @for (position of positions; track position.id) {
            <ion-select-option [value]="position.id">
                {{ position.name }}
            </ion-select-option>
        }
    </ion-select>
</ion-item>
```

**Después:**
```html
<app-form-select
    label="Cargo"
    [options]="positionOptions"
    formControlName="positionId"
    placeholder="Seleccione cargo"
    [required]="true">
</app-form-select>
```

### Migrar ion-input type="date" a DateInputComponent

**Antes:**
```html
<ion-item lines="none">
    <ion-label position="stacked">Fecha de Inicio *</ion-label>
    <ion-input type="date" formControlName="startDate"></ion-input>
</ion-item>
```

**Después:**
```html
<app-date-input
    formControlName="startDate"
    label="Fecha de Inicio"
    mode="single"
    [required]="true"
    [minDate]="minDate">
</app-date-input>
```

### Migrar ion-textarea a TextareaInputComponent

**Antes:**
```html
<ion-item lines="none">
    <ion-label position="stacked">Razón *</ion-label>
    <ion-textarea 
        formControlName="reason" 
        placeholder="Describe el motivo..."
        rows="3">
    </ion-textarea>
</ion-item>
```

**Después:**
```html
<app-textarea-input
    formControlName="reason"
    label="Razón"
    placeholder="Describe el motivo..."
    [required]="true"
    [rows]="3">
</app-textarea-input>
```

### Migrar ion-input type="time" a TimeInputComponent

**Antes:**
```html
<ion-item lines="none">
    <ion-label position="stacked">Hora de Inicio *</ion-label>
    <ion-input type="time" formControlName="startTime"></ion-input>
</ion-item>
```

**Después:**
```html
<app-time-input
    formControlName="startTime"
    label="Hora de Inicio"
    [required]="true">
</app-time-input>
```

### Migrar ion-input a TextInputComponent

**Antes:**
```html
<ion-item lines="none">
    <ion-label position="stacked">Nombre *</ion-label>
    <ion-input 
        formControlName="firstName" 
        placeholder="Ingrese el nombre">
    </ion-input>
</ion-item>
```

**Después:**
```html
<app-text-input
    formControlName="firstName"
    label="Nombre"
    placeholder="Ingrese el nombre"
    [required]="true">
</app-text-input>
```

**Antes (email):**
```html
<ion-item lines="none">
    <ion-label position="stacked">Email *</ion-label>
    <ion-input 
        type="email"
        formControlName="email" 
        placeholder="correo@ejemplo.com">
    </ion-input>
</ion-item>
```

**Después (email):**
```html
<app-text-input
    formControlName="email"
    label="Email"
    type="email"
    placeholder="correo@ejemplo.com"
    [required]="true">
</app-text-input>
```

## Ejemplo de Referencia

Ver `MemorandumModalComponent` en:
`app/src/app/admin/employees/components/memorandum-modal/`

## Ejemplo Completo con Todos los Componentes

### TypeScript Completo

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { BaseModalComponent } from '@shared/components/base-modal/base-modal.component';
import { AlertBoxComponent } from '@shared/components/alert-box/alert-box.component';
import { FormSelectComponent, SelectOption } from '@shared/components/form-select/form-select.component';
import { DateInputComponent } from '@shared/components/date-input/date-input.component';
import { TextareaInputComponent } from '@shared/components/textarea-input/textarea-input.component';
import { TimeInputComponent } from '@shared/components/time-input/time-input.component';
import { ShiftSelectorComponent, ShiftOption } from '@shared/components/shift-selector/shift-selector.component';
import { TextInputComponent } from '@shared/components/text-input/text-input.component';
import { ToastService } from '@shared/services/toast.service';
import { IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';

@Component({
    selector: 'app-complete-example-modal',
    templateUrl: './complete-example-modal.component.html',
    styleUrls: ['./complete-example-modal.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        BaseModalComponent,
        AlertBoxComponent,
        FormSelectComponent,
        DateInputComponent,
        TextareaInputComponent,
        TimeInputComponent,
        ShiftSelectorComponent,
        TextInputComponent,
        IonItem,
        IonLabel,
        IonInput
    ]
})
export class CompleteExampleModalComponent implements OnInit {
    @Input() data?: any;

    form!: FormGroup;
    isSubmitting = false;
    
    categories: any[] = [];
    minDate: Date;
    maxDate: Date;

    constructor(
        private fb: FormBuilder,
        private modalCtrl: ModalController,
        private toastService: ToastService
    ) {
        this.minDate = new Date();
        this.maxDate = new Date();
        this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
    }

    ngOnInit() {
        this.form = this.fb.group({
            category: ['', Validators.required],
            name: ['', Validators.required],
            eventDate: ['', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(500)]]
        });
        
        this.loadCategories();
    }

    loadCategories() {
        // Cargar categorías del API
        this.categories = [
            { id: 1, name: 'Categoría 1' },
            { id: 2, name: 'Categoría 2' }
        ];
    }

    get categoryOptions(): SelectOption[] {
        return this.categories.map(c => ({
            value: c.id,
            label: c.name
        }));
    }

    getDuration(): string {
        const startTime = this.form.get('startTime')?.value;
        const endTime = this.form.get('endTime')?.value;
        
        if (!startTime || !endTime) return '';
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        
        if (startMinutes >= endMinutes) return '';
        
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        
        if (hours === 0) {
            return `${minutes} minutos`;
        } else if (minutes === 0) {
            return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        } else {
            return `${hours}h ${minutes}m`;
        }
    }

    async onConfirm() {
        if (this.form.valid && !this.isSubmitting) {
            this.isSubmitting = true;
            
            try {
                const result = await this.myService.save(this.form.value);
                await this.toastService.success('Evento guardado correctamente');
                this.modalCtrl.dismiss(result, 'save');
            } catch (error: any) {
                await this.toastService.error(
                    error.message || 'Error al guardar el evento'
                );
                this.isSubmitting = false;
            }
        }
    }

    onDismiss() {
        this.modalCtrl.dismiss();
    }
}
```

### HTML Completo

```html
<app-base-modal 
    title="Ejemplo Completo"
    subtitle="Formulario con todos los componentes reutilizables"
    confirmText="Guardar"
    [confirmDisabled]="!form.valid"
    [loading]="isSubmitting"
    (modalDismiss)="onDismiss()"
    (modalConfirm)="onConfirm()">
    
    <form [formGroup]="form">
        <!-- Información General -->
        <h4 class="section-title">Información General</h4>

        <app-form-select
            label="Categoría"
            [options]="categoryOptions"
            formControlName="category"
            placeholder="Seleccione categoría"
            [required]="true">
        </app-form-select>

        <ion-item lines="none">
            <ion-label position="stacked">Nombre del Evento *</ion-label>
            <ion-input 
                formControlName="name" 
                placeholder="Ingrese el nombre">
            </ion-input>
        </ion-item>

        <!-- Fecha y Hora -->
        <h4 class="section-title">Fecha y Hora</h4>

        <app-date-input
            formControlName="eventDate"
            label="Fecha del Evento"
            mode="single"
            [required]="true"
            [minDate]="minDate"
            [maxDate]="maxDate">
        </app-date-input>

        <div class="form-row">
            <app-time-input
                formControlName="startTime"
                label="Hora de Inicio"
                [required]="true">
            </app-time-input>

            <app-time-input
                formControlName="endTime"
                label="Hora de Fin"
                [required]="true">
            </app-time-input>
        </div>

        @if (getDuration()) {
            <div class="duration-info">
                <ion-icon name="time-outline"></ion-icon>
                <span>Duración: {{ getDuration() }}</span>
            </div>
        }

        <!-- Descripción -->
        <h4 class="section-title">Descripción</h4>

        <app-textarea-input
            formControlName="description"
            label="Descripción del Evento"
            placeholder="Describe el evento..."
            [required]="true"
            [rows]="4"
            [maxlength]="500"
            [showCharCounter]="true">
        </app-textarea-input>

        <!-- Información -->
        <app-alert-box type="info">
            Todos los campos marcados con (*) son obligatorios.
        </app-alert-box>
    </form>
</app-base-modal>
```

### SCSS Completo

```scss
.section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--app-text-primary);
    margin: 24px 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--app-border-light);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    @media (max-width: 576px) {
        grid-template-columns: 1fr;
    }
}

ion-item {
    --background: var(--app-hover-bg);
    --border-radius: 12px;
    --padding-start: 16px;
    --padding-end: 16px;
    --min-height: 56px;
    --border-width: 0;
    margin-bottom: 16px;
    border-radius: 12px;
    transition: all 0.2s ease;

    &:focus-within {
        --background: var(--app-card-bg);
        box-shadow: 0 0 0 2px var(--app-text-primary);
    }

    ion-label {
        font-size: 13px;
        font-weight: 700;
        color: var(--app-text-primary);
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    ion-input {
        font-size: 15px;
        font-weight: 500;
        color: var(--app-text-primary);
        --padding-start: 0;
        --padding-end: 0;

        &::placeholder {
            color: var(--app-text-secondary);
            opacity: 0.7;
        }
    }
}

.duration-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #e3f2fd;
    border-radius: 8px;
    margin: -8px 0 16px 0;
    border-left: 3px solid #2196f3;

    ion-icon {
        font-size: 20px;
        color: #2196f3;
        flex-shrink: 0;
    }

    span {
        font-size: 14px;
        font-weight: 600;
        color: #1976d2;
    }
}
```
