// Constante de fallback para la conversión de días a horas
// El valor real viene de SystemSettings.hoursPerWorkday
export const DEFAULT_HOURS_PER_DAY = 8.5;

// Razones de acumulación
export enum AccumulationReason {
    SATURDAY_WORK = 'TRABAJO_SABADO',
    SUNDAY_WORK = 'TRABAJO_DOMINGO',
    HOLIDAY_WORK = 'TRABAJO_FESTIVO',
    VOTING_CERTIFICATE = 'CERTIFICADO_VOTACION'
}

export const ACCUMULATION_REASON_LABELS: Record<AccumulationReason, string> = {
    [AccumulationReason.SATURDAY_WORK]: 'Trabajo sábado en la tarde más de 4 horas',
    [AccumulationReason.SUNDAY_WORK]: 'Trabajo domingo más de 4 horas',
    [AccumulationReason.HOLIDAY_WORK]: 'Trabajo festivo más de 4 horas',
    [AccumulationReason.VOTING_CERTIFICATE]: 'Certificado de votación'
};
