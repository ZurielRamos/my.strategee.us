# Validación de IDO con API Externa - Referencia Técnica

## Descripción General

Cuando un empleado solicita un beneficio de tipo **Sábado Remoto** o **Sábado Descanso IDO**, el sistema realiza una validación automática consultando una API externa para verificar que el indicador IDO (Ingreso Diario Ordinario) del empleado supere el límite configurado.

## Tipos de Beneficios que Requieren Validación IDO

```typescript
const idoRestrictedTypes = [
    BenefitType.REMOTE_SATURDAY,      // Sábado Remoto
    BenefitType.IDO_REST_SATURDAY     // Sábado Descanso IDO
];
```

## API Externa Consultada

### Endpoint
```
POST https://tickets.strategee.us/tickets/getIDO
```

### Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "empleado@empresa.com",
  "fecha_solicitud": "2026-03-15"
}
```

#### Parámetros del Request
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `email` | string | Email corporativo del empleado | "juan.perez@empresa.com" |
| `fecha_solicitud` | string | Fecha de la solicitud en formato YYYY-MM-DD | "2026-03-15" |

### Response Esperado
```json
{
  "result": true,
  "Response": {
    "ido": "96.98",
    "otros_campos": "..."
  }
}
```

#### Estructura de la Respuesta
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `result` | boolean | Indica si la consulta fue exitosa |
| `Response` | object | Objeto con los datos del IDO |
| `Response.ido` | string | Valor del indicador IDO en formato string (ej: "96.98") |

## Flujo de Validación

### 1. Datos Requeridos del Empleado
```typescript
const employee = await this.employeesService.findOne(employeeId);

// Campos necesarios:
- employee.corporateEmail  // Email corporativo (requerido)
- employee.idoLimit        // Límite IDO configurado (default: 90)
```

### 2. Validación Previa
```typescript
if (!employee.corporateEmail) {
    throw new BadRequestException(
        'El empleado no tiene correo corporativo configurado para validar el IDO.'
    );
}
```

### 3. Petición a la API Externa
```typescript
const apiUrl = 'https://tickets.strategee.us/tickets/getIDO';
const payload = {
    email: employee.corporateEmail,
    fecha_solicitud: dateString // Formato YYYY-MM-DD
};

const { data } = await firstValueFrom(
    this.httpService.post(apiUrl, payload)
);
```

### 4. Validación de la Respuesta
```typescript
// Verificar estructura válida
if (!data.result || !data.Response || !data.Response.ido) {
    throw new BadRequestException(
        'No se pudo verificar tu indicador IDO en el sistema externo.'
    );
}

// Convertir valores
const idoValue = parseFloat(data.Response.ido);  // Ej: 96.98
const idoLimit = Number(employee.idoLimit);      // Ej: 90

// Validar umbral
if (idoValue <= idoLimit) {
    throw new BadRequestException(
        `Tu indicador IDO (${idoValue}%) no supera el límite requerido (${idoLimit}%) para solicitar este beneficio.`
    );
}
```

## Casos de Uso

### Caso 1: Validación Exitosa ✅
```
Empleado: Juan Pérez
Email: juan.perez@empresa.com
IDO Limit: 90
Fecha Solicitud: 2026-03-15

API Response: { result: true, Response: { ido: "96.98" } }

Resultado: ✅ APROBADO
- IDO Value: 96.98%
- IDO Limit: 90%
- 96.98 > 90 → Validación exitosa
```

### Caso 2: IDO Insuficiente ❌
```
Empleado: María García
Email: maria.garcia@empresa.com
IDO Limit: 90
Fecha Solicitud: 2026-03-15

API Response: { result: true, Response: { ido: "85.50" } }

Resultado: ❌ RECHAZADO
Error: "Tu indicador IDO (85.5%) no supera el límite requerido (90%) para solicitar este beneficio."
```

### Caso 3: Sin Email Corporativo ❌
```
Empleado: Pedro López
Email: null
IDO Limit: 90

Resultado: ❌ RECHAZADO
Error: "El empleado no tiene correo corporativo configurado para validar el IDO."
```

### Caso 4: Error de API Externa ❌
```
Empleado: Ana Martínez
Email: ana.martinez@empresa.com
IDO Limit: 90

API Response: Error de conexión / Timeout

Resultado: ❌ ERROR
Error: "Error de conexión al validar el indicador IDO. Intente más tarde."
```

### Caso 5: Respuesta Inválida de API ❌
```
Empleado: Carlos Ruiz
Email: carlos.ruiz@empresa.com
IDO Limit: 90

API Response: { result: false } o { Response: null }

Resultado: ❌ ERROR
Error: "No se pudo verificar tu indicador IDO en el sistema externo."
```

## Logs de Depuración

El sistema genera logs detallados para facilitar el debugging:

```typescript
console.log('[IDO Validation] Employee ID:', employeeId);
console.log('[IDO Validation] Corporate Email:', employee.corporateEmail);
console.log('[IDO Validation] IDO Limit:', employee.idoLimit);

console.log('[IDO API Request] URL:', apiUrl);
console.log('[IDO API Request] Payload:', JSON.stringify(payload, null, 2));

console.log('[IDO API Response] Full Response:', JSON.stringify(data, null, 2));

console.log('[IDO Validation] IDO Value from API:', idoValue);
console.log('[IDO Validation] IDO Limit from Employee:', idoLimit);
console.log('[IDO Validation] Comparison:', idoValue > idoLimit ? 'PASS' : 'FAIL');

console.log('[IDO Validation] ✓ Validation successful');
```

## Manejo de Errores

### Errores de Negocio (BadRequestException)
- Email corporativo no configurado
- IDO insuficiente
- Respuesta inválida de la API

### Errores Técnicos (InternalServerErrorException)
- Error de conexión con la API externa
- Timeout
- Errores de red

## Configuración del Empleado

### Campo IDO Limit en la Base de Datos

**Tabla**: `employees`

**Campo**: `idoLimit`
- **Tipo**: `int`
- **Default**: `90`
- **Descripción**: Límite mínimo de IDO requerido para solicitar beneficios restringidos

### Ejemplo de Registro
```sql
SELECT id, firstName, lastName, corporateEmail, idoLimit 
FROM employees 
WHERE id = 'uuid-del-empleado';
```

```
id: "123e4567-e89b-12d3-a456-426614174000"
firstName: "Juan"
lastName: "Pérez"
corporateEmail: "juan.perez@empresa.com"
idoLimit: 90
```

## Integración en el Flujo de Solicitudes

### Ubicación en el Código
```
api/src/modules/operations/requests/strategies/benefit.strategy.ts
```

### Método Principal
```typescript
private async validateIdoRequirement(
    employeeId: string, 
    dateString: string
): Promise<void>
```

### Llamada en el Flujo
```typescript
async validate(details: any, employeeId: string): Promise<void> {
    // ... otras validaciones
    
    // Validación de IDO para tipos restringidos
    const idoRestrictedTypes = [
        BenefitType.REMOTE_SATURDAY,
        BenefitType.IDO_REST_SATURDAY
    ];

    if (idoRestrictedTypes.includes(dto.benefitType)) {
        await this.validateIdoRequirement(employeeId, dto.date);
    }
    
    // ... continuar con otras validaciones
}
```

## Dependencias

### Módulos Requeridos
```typescript
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
```

### Inyección en el Constructor
```typescript
constructor(
    private readonly httpService: HttpService,
    private readonly employeesService: EmployeesService
) { }
```

## Consideraciones de Seguridad

1. **Timeout**: La petición HTTP debe tener un timeout configurado para evitar bloqueos
2. **Retry Logic**: Considerar implementar reintentos en caso de fallos temporales
3. **Cache**: Evaluar cachear respuestas por un período corto para reducir llamadas
4. **Validación de SSL**: Asegurar que la conexión HTTPS sea segura
5. **Rate Limiting**: Implementar límites de peticiones para evitar abusos

## Mejoras Futuras Sugeridas

1. ✅ Implementar cache de respuestas IDO (TTL: 1 hora)
2. ✅ Agregar retry logic con backoff exponencial
3. ✅ Configurar timeout explícito (ej: 5 segundos)
4. ✅ Agregar métricas de performance de la API externa
5. ✅ Implementar circuit breaker para fallos recurrentes
6. ✅ Agregar webhook para notificar cambios en IDO
7. ✅ Permitir override manual por administradores en casos excepcionales

## Testing

### Casos de Prueba Recomendados

1. ✅ Validación exitosa con IDO > límite
2. ✅ Rechazo con IDO < límite
3. ✅ Error cuando no hay email corporativo
4. ✅ Manejo de timeout de API
5. ✅ Manejo de respuesta inválida
6. ✅ Validación de formato de fecha
7. ✅ Validación con diferentes límites IDO
8. ✅ Comportamiento con API caída

### Ejemplo de Test
```typescript
describe('IDO Validation', () => {
    it('should approve request when IDO exceeds limit', async () => {
        // Mock API response
        mockHttpService.post.mockReturnValue(of({
            data: {
                result: true,
                Response: { ido: "96.98" }
            }
        }));
        
        // Mock employee
        mockEmployeesService.findOne.mockResolvedValue({
            corporateEmail: 'test@empresa.com',
            idoLimit: 90
        });
        
        // Should not throw
        await expect(
            strategy.validate(benefitDetails, employeeId)
        ).resolves.not.toThrow();
    });
});
```

## Contacto y Soporte

Para problemas con la API externa de IDO:
- **URL**: https://tickets.strategee.us/tickets/getIDO
- **Proveedor**: Strategee
- **Documentación**: [Pendiente]
