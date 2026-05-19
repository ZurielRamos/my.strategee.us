/**
 * Formatea un número como moneda colombiana (COP)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined) {
        return '$0';
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
        return '$0';
    }

    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericAmount);
}
