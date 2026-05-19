# DateInput Component - Troubleshooting

## Problema: La selección de fecha no funciona

### Cambios Realizados para Solucionar

1. **Agregado OnChanges lifecycle hook**
   - El componente ahora reinicializa el `datePickerConfig` cuando cambian los inputs
   - Esto asegura que el datepicker tenga la configuración correcta

2. **Inicialización en el constructor**
   - Se inicializa `datePickerConfig` con valores por defecto en el constructor
   - Previene errores de "undefined" en el primer render

3. **Logs de depuración agregados**
   - `toggleDatePicker()`: Muestra cuando se abre/cierra el datepicker
   - `onDateSelected()`: Muestra la fecha seleccionada
   - `initializeDatePickerConfig()`: Muestra la configuración del datepicker
   - `onStartDateChange()` / `onEndDateChange()`: Muestra los valores en el componente padre

### Cómo Depurar

1. **Abrir la consola del navegador** (F12)

2. **Hacer clic en el input de fecha**
   - Deberías ver: `DateInput - toggleDatePicker: true`
   - Deberías ver: `DateInput - config: { mode: 'single', ... }`

3. **Seleccionar una fecha en el calendario**
   - Deberías ver: `DateInput - onDateSelected: [Date object]`
   - Deberías ver: `DateInput - new value: { startDate: '2024-...' }`
   - Deberías ver: `Memorandum - onStartDateChange: { startDate: '2024-...' }`
   - Deberías ver: `Memorandum - setting startDate to: 2024-03-15`

### Verificaciones

#### 1. El datepicker se abre?
```
✓ Hacer clic en el input
✓ Debería aparecer un overlay oscuro
✓ Debería aparecer el calendario
```

Si NO se abre:
- Verificar que `showDatePicker` cambie a `true` en la consola
- Verificar que no haya errores de CSS que oculten el datepicker
- Verificar que el z-index sea suficientemente alto

#### 2. El calendario se muestra correctamente?
```
✓ Se ven los días del mes
✓ Se puede navegar entre meses
✓ Los días deshabilitados están en gris
```

Si NO se muestra:
- Verificar que `datePickerConfig` tenga valores válidos
- Verificar que `AdvancedDatepickerComponent` esté importado
- Verificar que no haya errores en la consola

#### 3. Se puede seleccionar una fecha?
```
✓ Hacer clic en un día habilitado
✓ El día debería resaltarse
✓ El datepicker debería cerrarse
✓ El input debería mostrar la fecha seleccionada
```

Si NO se puede seleccionar:
- Verificar que el día no esté deshabilitado
- Verificar que `onDateSelected()` se ejecute en la consola
- Verificar que no haya errores en `customValidator`

#### 4. El valor se actualiza en el formulario?
```
✓ Verificar en la consola: "Memorandum - setting startDate to: ..."
✓ Verificar que el FormControl tenga el valor correcto
```

Si NO se actualiza:
- Verificar que `dateChange` emita el evento
- Verificar que `onStartDateChange()` se ejecute
- Verificar que `patchValue()` se llame correctamente

### Problemas Comunes

#### Problema 1: El datepicker no se abre
**Causa**: El evento click no se está propagando
**Solución**: Verificar que el ion-item tenga el atributo `button`

#### Problema 2: La fecha seleccionada no se muestra
**Causa**: El método `updateDisplayValue()` no se está ejecutando
**Solución**: Verificar que `onDateSelected()` llame a `updateDisplayValue()`

#### Problema 3: El valor no llega al FormControl
**Causa**: El evento `dateChange` no se está emitiendo o no se está escuchando
**Solución**: 
- Verificar que el componente tenga `(dateChange)="onStartDateChange($event)"`
- Verificar que `onStartDateChange()` esté definido en el componente padre

#### Problema 4: Error "Cannot read property 'mode' of undefined"
**Causa**: `datePickerConfig` no está inicializado
**Solución**: Ya solucionado - se inicializa en el constructor

#### Problema 5: Las fechas están deshabilitadas incorrectamente
**Causa**: `minDate` o `customValidator` están bloqueando fechas válidas
**Solución**: 
- Verificar que `minDate` sea correcto
- Verificar la lógica de `customValidator`
- Agregar logs en `customValidator` para depurar

### Código de Depuración

Agregar en el componente padre para ver el estado del formulario:

```typescript
ngAfterViewInit() {
    // Ver cambios en el formulario
    this.memorandumForm.valueChanges.subscribe(value => {
        console.log('Form value changed:', value);
    });
    
    // Ver estado del control de fecha
    this.memorandumForm.get('startDate')?.valueChanges.subscribe(value => {
        console.log('startDate control changed:', value);
    });
}
```

### Verificar Configuración del Datepicker

Agregar en el template temporalmente:

```html
<div style="background: yellow; padding: 10px; margin: 10px;">
    <h4>Debug Info</h4>
    <p>showDatePicker: {{ showDatePicker }}</p>
    <p>displayValue: {{ displayValue }}</p>
    <p>mode: {{ mode }}</p>
    <p>minDate: {{ minDate | date }}</p>
    <p>Form value: {{ memorandumForm.get('startDate')?.value }}</p>
</div>
```

### Solución Temporal

Si el problema persiste, usar el input nativo temporalmente:

```html
<ion-item lines="none">
    <ion-label position="stacked">Fecha de Inicio *</ion-label>
    <ion-input 
        type="date"
        formControlName="startDate">
    </ion-input>
</ion-item>
```

Y luego investigar el problema con más calma.

### Contacto de Soporte

Si ninguna de estas soluciones funciona:
1. Copiar todos los logs de la consola
2. Tomar screenshot del calendario (si se muestra)
3. Compartir el código del componente padre
4. Indicar en qué paso específico falla
