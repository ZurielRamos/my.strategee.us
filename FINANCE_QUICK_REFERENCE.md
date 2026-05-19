# Finanzas - Referencia Rápida

## 📋 Estructura Creada

### Páginas Principales
- **Finanzas** (`/admin/finance`) - Página central con módulos financieros
- **Valores Globales** (`/admin/finance/global-parameters`) - Gestión de parámetros globales

### Componentes
```
app/src/app/admin/finance/
├── finance.page.ts/html/scss              # Página central de Finanzas
└── global-parameters/
    ├── global-parameters.page.ts/html/scss
    ├── models/
    │   └── global-parameter.model.ts
    ├── services/
    │   └── global-parameters.service.ts
    └── components/
        ├── global-parameter-card/
        │   ├── global-parameter-card.component.ts
        │   ├── global-parameter-card.component.html
        │   └── global-parameter-card.component.scss
        └── global-parameter-modal/
            ├── global-parameter-modal.component.ts
            ├── global-parameter-modal.component.html
            └── global-parameter-modal.component.scss
```

## 🔌 API Endpoints

### Global Parameters
- `GET /global-parameters` - Listar parámetros vigentes
- `GET /global-parameters/:id` - Obtener un parámetro
- `GET /global-parameters/:key/history` - Historial de un parámetro
- `GET /global-parameters/current-value?key=X&date=Y` - Valor vigente
- `POST /global-parameters` - Crear parámetro
- `PATCH /global-parameters/:id` - Actualizar parámetro
- `DELETE /global-parameters/:id` - Eliminar parámetro

## 📊 Modelo de Datos

```typescript
interface GlobalParameter {
  id: string;
  key: string;              // Ej: "MINIMUM_WAGE"
  value: number;            // Ej: 1300000
  validFrom: string;        // Fecha de vigencia (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
}
```

## 🎨 Características UI

### Página de Valores Globales
- ✅ Grid responsivo de tarjetas (1/2/3 columnas)
- ✅ Búsqueda en tiempo real
- ✅ FAB para crear en móvil
- ✅ Botón de crear en desktop
- ✅ Estado de carga
- ✅ Estado vacío

### Tarjeta de Parámetro
- Icono de globo
- Nombre del parámetro (uppercase)
- Valor formateado con moneda
- Fecha de vigencia con icono de calendario
- Hover effect con elevación

### Modal de Parámetro
- Modos: crear, editar, ver
- Campos:
  - Clave del parámetro (texto)
  - Valor (número, mínimo 0)
  - Fecha de vigencia (date picker)
- Validación de formulario
- Botones de acción según modo
- Altura fija de 600px

## 🎯 Funcionalidades

### CRUD Completo
- ✅ Crear parámetro
- ✅ Ver detalle
- ✅ Editar parámetro
- ✅ Eliminar con confirmación
- ✅ Búsqueda/filtrado

### Navegación
- Menú lateral: "Finanzas" con icono de cash
- Página central con card de "Valores Globales"
- Breadcrumb automático

## 🚀 Próximos Pasos

### Funcionalidades Adicionales
1. **Historial de Parámetros**
   - Ver cambios históricos de un parámetro
   - Timeline de valores
   - Comparación de períodos

2. **Validaciones Avanzadas**
   - Evitar duplicados de clave en misma fecha
   - Validar fechas de vigencia
   - Alertas de cambios importantes

3. **Reportes**
   - Exportar parámetros a Excel/PDF
   - Gráficos de evolución de valores
   - Comparativas anuales

4. **Otros Módulos Financieros**
   - Compensación
   - Nómina
   - Presupuestos
   - Costos

## 📝 Notas Técnicas

### Estilos
- Sigue `ADMIN_DESIGN_STANDARDS.md`
- Usa mixins de `admin-standards.scss`
- Modal configurado en `global.scss`

### Servicios
- HttpClient para API calls
- Observable pattern
- Error handling básico

### Componentes
- Standalone components
- Reactive forms
- Ionic components
