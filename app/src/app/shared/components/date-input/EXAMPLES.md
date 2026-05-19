# Ejemplos de Uso del DateInput Component

## Ejemplo 1: Fecha Única - Fecha de Nacimiento

### TypeScript
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateInputComponent, DateValue } from '@shared/components/date-input/date-input.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [ReactiveFormsModule, DateInputComponent]
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  maxBirthDate: Date;

  constructor(private fb: FormBuilder) {
    // Fecha máxima: hace 18 años (edad mínima)
    this.maxBirthDate = new Date();
    this.maxBirthDate.setFullYear(this.maxBirthDate.getFullYear() - 18);
  }

  ngOnInit() {
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      birthDate: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onBirthDateChange(value: DateValue) {
    if (value.startDate) {
      const birthDate = new Date(value.startDate);
      const age = this.calculateAge(birthDate);
      console.log('Edad:', age);
    }
  }

  calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  onSubmit() {
    if (this.employeeForm.valid) {
      const formValue = this.employeeForm.value;
      console.log('Datos del empleado:', formValue);
      // Procesar formulario...
    }
  }
}
```

### HTML
```html
<form [formGroup]="employeeForm" (ngSubmit)="onSubmit()">
  <ion-item lines="none">
    <ion-label position="stacked">Nombre *</ion-label>
    <ion-input formControlName="firstName"></ion-input>
  </ion-item>

  <ion-item lines="none">
    <ion-label position="stacked">Apellido *</ion-label>
    <ion-input formControlName="lastName"></ion-input>
  </ion-item>

  <app-date-input
    formControlName="birthDate"
    label="Fecha de Nacimiento"
    placeholder="Selecciona tu fecha de nacimiento"
    mode="single"
    [required]="true"
    [maxDate]="maxBirthDate"
    (dateChange)="onBirthDateChange($event)">
  </app-date-input>

  <ion-item lines="none">
    <ion-label position="stacked">Email *</ion-label>
    <ion-input formControlName="email" type="email"></ion-input>
  </ion-item>

  <ion-button expand="block" type="submit" [disabled]="employeeForm.invalid">
    Guardar
  </ion-button>
</form>
```

---

## Ejemplo 2: Rango de Fechas - Solicitud de Vacaciones

### TypeScript
```typescript
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateInputComponent, DateValue } from '@shared/components/date-input/date-input.component';

interface VacationBalance {
  availableBalance: number;
  usedBalance: number;
  totalBalance: number;
}

@Component({
  selector: 'app-vacation-request',
  standalone: true,
  imports: [ReactiveFormsModule, DateInputComponent]
})
export class VacationRequestComponent implements OnInit {
  @Input() vacationBalance!: VacationBalance;

  requestForm!: FormGroup;
  minDate: Date;
  maxDate: Date;
  totalBusinessDays = 0;

  constructor(private fb: FormBuilder) {
    // Configurar fechas
    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);
    
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
  }

  ngOnInit() {
    this.requestForm = this.fb.group({
      dateRange: [null, Validators.required],
      comments: ['']
    });
  }

  onDateChange(value: DateValue) {
    if (!value?.startDate || !value?.endDate) {
      this.totalBusinessDays = 0;
      return;
    }

    const startDate = new Date(value.startDate);
    const endDate = new Date(value.endDate);
    
    // Calcular días hábiles (excluyendo domingos)
    this.totalBusinessDays = this.calculateBusinessDays(startDate, endDate);
  }

  calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // Contar de lunes a sábado (1-6), excluir domingos (0)
      if (dayOfWeek !== 0) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  // Validador personalizado para verificar cuota de vacaciones
  isDateExceedingQuota = (
    date: Date, 
    currentSelection?: { start: Date | null; end: Date | null }
  ): boolean => {
    if (!currentSelection?.start) {
      return false;
    }

    const startDate = currentSelection.start;
    const endDate = date;
    
    const start = startDate < endDate ? startDate : endDate;
    const end = startDate < endDate ? endDate : startDate;
    
    const businessDays = this.calculateBusinessDays(start, end);
    
    // Deshabilitar si excede los días disponibles
    return businessDays > this.vacationBalance.availableBalance;
  }

  onSubmit() {
    if (this.requestForm.valid) {
      const dateRange: DateValue = this.requestForm.value.dateRange;
      
      const requestData = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        comments: this.requestForm.value.comments,
        businessDays: this.totalBusinessDays
      };
      
      console.log('Solicitud de vacaciones:', requestData);
      // Enviar solicitud...
    }
  }
}
```

### HTML
```html
<form [formGroup]="requestForm" (ngSubmit)="onSubmit()">
  <h3>Solicitar Vacaciones</h3>

  <app-date-input
    formControlName="dateRange"
    label="Período de Vacaciones"
    placeholder="dd/mm/yyyy al dd/mm/yyyy"
    mode="range"
    [required]="true"
    [minDate]="minDate"
    [maxDate]="maxDate"
    [disabledDaysOfWeek]="[0]"
    [customValidator]="isDateExceedingQuota"
    (dateChange)="onDateChange($event)">
  </app-date-input>

  @if (totalBusinessDays > 0) {
    <div class="vacation-summary">
      <div class="summary-item">
        <span>Días hábiles:</span>
        <span>{{ totalBusinessDays }} día(s)</span>
      </div>
      <div class="summary-item">
        <span>Días disponibles:</span>
        <span>{{ vacationBalance.availableBalance }} día(s)</span>
      </div>
      <div class="summary-item">
        <span>Saldo restante:</span>
        <span [class.negative]="totalBusinessDays > vacationBalance.availableBalance">
          {{ vacationBalance.availableBalance - totalBusinessDays }} día(s)
        </span>
      </div>
    </div>
  }

  <ion-item lines="none">
    <ion-label position="stacked">Comentarios</ion-label>
    <ion-textarea formControlName="comments" rows="3"></ion-textarea>
  </ion-item>

  <ion-button 
    expand="block" 
    type="submit" 
    [disabled]="requestForm.invalid || totalBusinessDays === 0">
    Enviar Solicitud
  </ion-button>
</form>
```

---

## Ejemplo 3: Rango de Fechas - Contrato Laboral

### TypeScript
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DateInputComponent, DateValue } from '@shared/components/date-input/date-input.component';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [ReactiveFormsModule, DateInputComponent]
})
export class ContractFormComponent implements OnInit {
  contractForm!: FormGroup;
  minStartDate: Date;
  isIndefiniteTerm = false;

  constructor(private fb: FormBuilder) {
    this.minStartDate = new Date();
  }

  ngOnInit() {
    this.contractForm = this.fb.group({
      contractType: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null],
      salary: ['', Validators.required]
    });

    // Observar cambios en el tipo de contrato
    this.contractForm.get('contractType')?.valueChanges.subscribe(type => {
      this.isIndefiniteTerm = type === 'INDEFINIDO';
      
      if (this.isIndefiniteTerm) {
        this.contractForm.get('endDate')?.clearValidators();
        this.contractForm.get('endDate')?.setValue(null);
      } else {
        this.contractForm.get('endDate')?.setValidators(Validators.required);
      }
      
      this.contractForm.get('endDate')?.updateValueAndValidity();
    });
  }

  onStartDateChange(value: DateValue) {
    console.log('Fecha de inicio:', value.startDate);
  }

  onEndDateChange(value: DateValue) {
    console.log('Fecha de fin:', value.startDate);
  }

  onSubmit() {
    if (this.contractForm.valid) {
      console.log('Contrato:', this.contractForm.value);
      // Procesar contrato...
    }
  }
}
```

### HTML
```html
<form [formGroup]="contractForm" (ngSubmit)="onSubmit()">
  <h3>Crear Contrato</h3>

  <ion-item lines="none">
    <ion-label position="stacked">Tipo de Contrato *</ion-label>
    <ion-select formControlName="contractType">
      <ion-select-option value="FIJO">Término Fijo</ion-select-option>
      <ion-select-option value="INDEFINIDO">Término Indefinido</ion-select-option>
      <ion-select-option value="OBRA">Obra o Labor</ion-select-option>
    </ion-select>
  </ion-item>

  <div class="date-row">
    <app-date-input
      formControlName="startDate"
      label="Fecha de Inicio"
      placeholder="Selecciona fecha"
      mode="single"
      [required]="true"
      [minDate]="minStartDate"
      (dateChange)="onStartDateChange($event)">
    </app-date-input>

    @if (!isIndefiniteTerm) {
      <app-date-input
        formControlName="endDate"
        label="Fecha de Fin"
        placeholder="Selecciona fecha"
        mode="single"
        [required]="true"
        [minDate]="minStartDate"
        (dateChange)="onEndDateChange($event)">
      </app-date-input>
    }
  </div>

  <ion-item lines="none">
    <ion-label position="stacked">Salario *</ion-label>
    <ion-input formControlName="salary" type="number"></ion-input>
  </ion-item>

  <ion-button expand="block" type="submit" [disabled]="contractForm.invalid">
    Crear Contrato
  </ion-button>
</form>
```

---

## Ejemplo 4: Fecha con Restricciones Personalizadas

### TypeScript
```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DateInputComponent, DateValue } from '@shared/components/date-input/date-input.component';

@Component({
  selector: 'app-meeting-request',
  standalone: true,
  imports: [DateInputComponent]
})
export class MeetingRequestComponent implements OnInit {
  meetingForm!: FormGroup;
  minDate: Date;
  maxDate: Date;
  blockedDates: Date[] = [];

  constructor(private fb: FormBuilder) {
    this.minDate = new Date();
    
    this.maxDate = new Date();
    this.maxDate.setMonth(this.maxDate.getMonth() + 3);

    // Fechas bloqueadas (ej: días festivos)
    this.blockedDates = [
      new Date('2024-12-25'),
      new Date('2024-01-01'),
      new Date('2024-07-20')
    ];
  }

  ngOnInit() {
    this.meetingForm = this.fb.group({
      meetingDate: [null, Validators.required],
      topic: ['', Validators.required]
    });
  }

  // Validador que bloquea fechas específicas y fines de semana
  isDateBlocked = (date: Date): boolean => {
    // Bloquear sábados y domingos
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    // Bloquear fechas específicas
    const dateString = date.toISOString().split('T')[0];
    return this.blockedDates.some(blocked => 
      blocked.toISOString().split('T')[0] === dateString
    );
  }

  onDateChange(value: DateValue) {
    console.log('Fecha de reunión:', value.startDate);
  }

  onSubmit() {
    if (this.meetingForm.valid) {
      console.log('Solicitud de reunión:', this.meetingForm.value);
    }
  }
}
```

### HTML
```html
<form [formGroup]="meetingForm" (ngSubmit)="onSubmit()">
  <h3>Solicitar Reunión</h3>

  <app-date-input
    formControlName="meetingDate"
    label="Fecha de la Reunión"
    placeholder="Selecciona una fecha"
    mode="single"
    [required]="true"
    [minDate]="minDate"
    [maxDate]="maxDate"
    [customValidator]="isDateBlocked"
    (dateChange)="onDateChange($event)">
  </app-date-input>

  <div class="info-note">
    <ion-icon name="information-circle-outline"></ion-icon>
    <p>Las reuniones solo pueden agendarse en días hábiles (lunes a viernes)</p>
  </div>

  <ion-item lines="none">
    <ion-label position="stacked">Tema *</ion-label>
    <ion-input formControlName="topic"></ion-input>
  </ion-item>

  <ion-button expand="block" type="submit" [disabled]="meetingForm.invalid">
    Solicitar Reunión
  </ion-button>
</form>
```

---

## Notas Importantes

1. **Formato de Fechas**: El componente almacena las fechas en formato ISO string internamente
2. **Validación**: Usa validadores de Angular Forms para validación adicional
3. **Accesibilidad**: El componente es accesible y funciona con lectores de pantalla
4. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
5. **Tema**: Usa las variables CSS del sistema de diseño para mantener consistencia
