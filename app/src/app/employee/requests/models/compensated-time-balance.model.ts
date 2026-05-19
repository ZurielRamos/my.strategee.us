export interface CompensatedTimeUsageBreakdown {
    accumulated: number;
    used: number;
    expired: number;
    adjustments: number;
}

export interface CompensatedTimeBalance {
    totalAccumulated: number;
    totalUsed: number;
    breakdown: CompensatedTimeUsageBreakdown;
    pendingReserved: number;
    realBalance: number;
    availableBalance: number;
    realBalanceInDays: number;
    availableBalanceInDays: number;
}
