# Duplicación de Card de Días Energyze - Dashboard del Empleado

## Resumen de Cambios

Se agregó una card duplicada de "Días Energyze" en la sección de beneficios del dashboard del empleado, manteniendo la card original en la fila superior de balances.

## Ubicaciones de la Card

### 1. Card Original - Fila de Balances (Top Row)
**Ubicación**: Primera fila junto a Vacaciones y Horas Compensatorias
**Características**:
- Diseño de card de balance estándar
- Tamaño grande con métrica destacada
- Color terciario para el valor
- Icono: `flash-outline`

```html
<div class="grid-card balance-card energyze-card">
    <div class="card-header">
        <div class="card-title">
            <ion-icon name="flash-outline" class="title-icon"></ion-icon>
            Días Energyze
        </div>
    </div>
    <div class="card-metric">
        <span class="value">{{ energyzeDaysBalance.availableDays }}</span>
        <span class="label">días disponibles</span>
    </div>
</div>
```

### 2. Card Duplicada - Sección de Beneficios
**Ubicación**: Primera card en el contenedor de beneficios (benefits-container)
**Características**:
- Diseño de card cuadrada como otros beneficios
- Borde color terciario
- Gradiente de fondo sutil
- Hover effect con sombra terciaria
- Muestra solo días disponibles (sin separador de cuota)

```html
<div class="grid-card benefit-card-square energyze-benefit-card">
    <div class="benefit-content">
        <div class="benefit-name-square">Días Energyze</div>
        @if (isLoadingEnergyzeDays) {
            <div class="benefit-loading">
                <ion-spinner name="crescent"></ion-spinner>
            </div>
        } @else if (energyzeDaysBalance) {
            <div class="benefit-quota-display">
                <span class="benefit-quota-large">{{ energyzeDaysBalance.availableDays }}</span>
            </div>
            <div class="benefit-quota-label">días disponibles</div>
        } @else {
            <div class="benefit-quota-label">Sin información</div>
        }
    </div>
</div>
```

## Diferencias entre las Cards

| Característica | Card Original (Balance) | Card Duplicada (Beneficios) |
|----------------|------------------------|----------------------------|
| **Ubicación** | Fila superior de balances | Contenedor de beneficios |
| **Tamaño** | Grande (min-height: 200px) | Cuadrada (min-height: 180px) |
| **Diseño** | Card de balance estándar | Card cuadrada de beneficio |
| **Borde** | Sin borde especial | Borde color terciario |
| **Fondo** | Sólido | Gradiente sutil terciario |
| **Hover** | Sin hover especial | Transform + sombra terciaria |
| **Formato valor** | Valor grande centrado | Valor grande sin separador |
| **Icono** | Sí (flash-outline) | No |
| **Estado carga** | Spinner centrado | Spinner en benefit-loading |

## Estilos Específicos de la Card Duplicada

### SCSS Agregado
```scss
&.energyze-benefit-card {
    border-color: var(--ion-color-tertiary);
    background: linear-gradient(135deg, var(--app-card-bg) 0%, rgba(var(--ion-color-tertiary-rgb), 0.05) 100%);

    &:hover {
        border-color: var(--ion-color-tertiary);
        box-shadow: 0 8px 20px rgba(var(--ion-color-tertiary-rgb), 0.3);
    }

    .benefit-quota-large {
        color: var(--ion-color-tertiary);
    }
}

.benefit-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60px;

    ion-spinner {
        --color: var(--ion-color-tertiary);
    }
}
```

## Comportamiento

### Estados de la Card Duplicada

#### 1. Estado de Carga
```html
@if (isLoadingEnergyzeDays) {
    <div class="benefit-loading">
        <ion-spinner name="crescent"></ion-spinner>
    </div>
}
```
- Muestra spinner color terciario
- Centrado verticalmente

#### 2. Estado con Datos
```html
@else if (energyzeDaysBalance) {
    <div class="benefit-quota-display">
        <span class="benefit-quota-large">{{ energyzeDaysBalance.availableDays }}</span>
    </div>
    <div class="benefit-quota-label">días disponibles</div>
}
```
- Muestra el valor de días disponibles
- Color terciario para el número
- Etiqueta descriptiva debajo

#### 3. Estado Sin Información
```html
@else {
    <div class="benefit-quota-label">Sin información</div>
}
```
- Mensaje simple cuando no hay datos

## Integración con Datos Existentes

### Fuente de Datos
Ambas cards utilizan la misma fuente de datos:
```typescript
energyzeDaysBalance: any = null;
isLoadingEnergyzeDays = true;
```

### Método de Carga
```typescript
loadEnergyzeDaysBalance() {
    if (!this.employeeId) return;
    
    this.isLoadingEnergyzeDays = true;
    this.energyzeDaysService.getMyBalance().subscribe({
        next: (balance) => {
            this.energyzeDaysBalance = balance;
            this.isLoadingEnergyzeDays = false;
        },
        error: (error) => {
            console.error('Error loading energyze days balance:', error);
            this.isLoadingEnergyzeDays = false;
        }
    });
}
```

## Orden de Visualización en Beneficios

1. **Días Energyze** (card duplicada) ← Nueva
2. Sábado Remoto (si está asignado)
3. Workcation (si está asignado)
4. Home Office (si está asignado)
5. Otros beneficios...

## Diseño Responsivo

### Desktop
```scss
.benefits-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
}
```
- Grid adaptativo con columnas automáticas
- Card de Energyze se integra naturalmente en el grid

### Tablet (≤768px)
```scss
@media (max-width: 768px) {
    .benefits-container {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
}
```
- 2 columnas
- Card de Energyze ocupa una celda

### Mobile (≤480px)
```scss
@media (max-width: 480px) {
    .benefits-container {
        grid-template-columns: 1fr;
    }
}
```
- 1 columna
- Card de Energyze se muestra primero

## Ventajas de la Duplicación

### 1. Visibilidad Mejorada
- Los Días Energyze aparecen en dos ubicaciones estratégicas
- Mayor prominencia para un beneficio importante

### 2. Contexto Dual
- **En balances**: Junto a vacaciones y horas compensatorias (tiempo libre)
- **En beneficios**: Junto a otros beneficios asignados (perks)

### 3. Diseño Diferenciado
- Card en balances: Énfasis en la métrica
- Card en beneficios: Integración con otros beneficios

### 4. Consistencia de Datos
- Ambas cards usan la misma fuente de datos
- Actualización sincronizada automática

## Consideraciones de UX

### Ventajas
✅ Mayor visibilidad del beneficio Energyze
✅ Contexto dual (balance + beneficio)
✅ Diseño diferenciado según ubicación
✅ Fácil acceso desde dos secciones

### Posibles Mejoras Futuras
- Agregar click handler para navegar a detalle de Días Energyze
- Mostrar información adicional en tooltip
- Agregar indicador de días usados vs disponibles
- Implementar animación de transición entre estados

## Archivos Modificados

1. ✅ `app/src/app/employee/dashboard/dashboard.page.html`
   - Agregada card duplicada en benefits-container
   
2. ✅ `app/src/app/employee/dashboard/dashboard.page.scss`
   - Agregados estilos para `.energyze-benefit-card`
   - Agregados estilos para `.benefit-loading`
   
3. ✅ `EMPLOYEE_DASHBOARD_REFERENCE.md`
   - Actualizada documentación de beneficios

## Testing Recomendado

### Casos de Prueba
1. ✅ Verificar que ambas cards muestren el mismo valor
2. ✅ Validar estados de carga sincronizados
3. ✅ Comprobar diseño responsivo en diferentes tamaños
4. ✅ Verificar hover effects en la card duplicada
5. ✅ Validar colores y gradientes
6. ✅ Comprobar que el spinner tenga color terciario
7. ✅ Verificar estado sin información

## Ejemplo Visual

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard del Empleado                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│ │Vacaciones│  │  Horas   │  │  Días    │  ← Original │
│ │    15    │  │Comp. 8   │  │Energyze 5│             │
│ └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│ ┌─────────────────┐  ┌─────────────────┐              │
│ │ Mis Solicitudes │  │ Mis Beneficios  │              │
│ │                 │  │                 │              │
│ │ • Vacaciones    │  │ ┌─────┐ ┌─────┐│              │
│ │ • Permiso       │  │ │Días │ │Sáb. ││ ← Duplicada │
│ │ • Beneficio     │  │ │Engy.│ │Remot││              │
│ │                 │  │ │  5  │ │ 2/4 ││              │
│ │                 │  │ └─────┘ └─────┘│              │
│ └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Notas Técnicas

- La card duplicada NO requiere cambios en el TypeScript
- Usa los mismos datos y estados que la card original
- El diseño es completamente CSS/SCSS
- Compatible con temas light/dark mode
- Responsive por defecto con el grid existente
