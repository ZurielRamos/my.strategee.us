export class VacationCalculator {
    private static readonly DAYS_IN_YEAR_ACCOUNTING = 360; // Estándar contable laboral

    /**
     * Calcula días ganados (Accrued)
     * Fórmula: (Días Trabajados * Tasa Anual) / 360
     */
    static calculateAccrued(
        startDate: Date,
        endDate: Date,
        daysPerYearRate: number
    ): number {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Diferencia en tiempo
        const diffTime = Math.abs(end.getTime() - start.getTime());
        // Diferencia en días (+1 para incluir el día final si es inclusivo)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const accrued = (diffDays * daysPerYearRate) / this.DAYS_IN_YEAR_ACCOUNTING;

        // Retornamos con 4 decimales de precisión
        return parseFloat(accrued.toFixed(4));
    }
}