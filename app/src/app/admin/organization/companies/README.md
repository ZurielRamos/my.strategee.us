# Módulo de Gestión de Empresas

Este módulo permite gestionar las empresas de la organización desde el panel de administración.

## Características

- ✅ Listar todas las empresas
- ✅ Ver detalles de una empresa
- ✅ Crear nueva empresa
- ✅ Editar empresa existente
- ✅ Eliminar empresa (con confirmación)

## Estructura

```
companies/
├── components/
│   └── company-modal/          # Modal para crear/editar/ver empresas
├── models/
│   └── company.model.ts        # Interfaces y DTOs
├── services/
│   └── companies.service.ts    # Servicio HTTP para API
├── companies.page.ts           # Componente principal
├── companies.page.html         # Template
└── companies.page.scss         # Estilos
```

## Modelo de Datos

```typescript
interface Company {
    id: string;
    name: string;           // Nombre comercial
    legalName: string;      // Razón social
    nit: string;           // NIT
    address: string;        // Dirección
    logoUrl?: string;       // URL del logo (opcional)
    createdAt: Date;
    updatedAt: Date;
}
```

## API Endpoints

- `GET /api/v1/companies` - Listar empresas
- `GET /api/v1/companies/:id` - Obtener empresa por ID
- `POST /api/v1/companies` - Crear empresa
- `PATCH /api/v1/companies/:id` - Actualizar empresa
- `DELETE /api/v1/companies/:id` - Eliminar empresa

## Uso

Navegar a `/admin/organization/companies` para acceder al módulo.

## Estilos

Sigue la estética del dashboard con:
- Colores principales: `#1a1c1b` (oscuro), `#b7a6f6` (púrpura), `#bcf36a` (verde)
- Cards con border-radius de 16px
- Sombras sutiles
- Hover effects con elevación
