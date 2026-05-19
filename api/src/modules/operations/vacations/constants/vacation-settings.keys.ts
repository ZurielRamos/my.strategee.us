import { ContractType } from "@modules/core/contracts/enums/contract-type.enum";

// Mapeo entre Tipo de Contrato y Clave de Configuración
export const VACATION_RATE_KEYS: Record<ContractType, string> = {
    [ContractType.FIXED_TERM]: 'VACATION_DAYS_PER_YEAR_FIXED',
    [ContractType.INDEFINITE_TERM]: 'VACATION_DAYS_PER_YEAR_INDEFINITE',
    [ContractType.SERVICE_PROVISION_OVER_ONE_MONTH]: 'VACATION_DAYS_PER_YEAR_SERVICE_LONG',
    [ContractType.SERVICE_PROVISION_UNDER_ONE_MONTH]: 'VACATION_DAYS_PER_YEAR_SERVICE_SHORT',
};

// Valor por defecto si no existe la config (ej. 15 días por año)
export const DEFAULT_VACATION_RATE = 15;