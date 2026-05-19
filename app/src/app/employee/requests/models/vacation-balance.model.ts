export interface VacationUsageBreakdown {
    taken: number;
    compensated: number;
    settled: number;
    adjustments: number;
}

export interface VacationBalance {
    rateApplied: number;
    totalAccrued: number;
    totalUsed: number;
    breakdown: VacationUsageBreakdown;
    pendingReserved: number;
    realBalance: number;
    availableBalance: number;
    isEligible: boolean;
}
