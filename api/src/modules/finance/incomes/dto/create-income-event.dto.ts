import { IncomeFrequency } from '../enums/income-frequency.enum';
import { IncomeType } from '../enums/income-type.enum';

export type IncomeSourceType = 'CONTRACT' | 'BONUS' | 'TICKET';

export class CreateIncomeEventDto {
    sourceType: IncomeSourceType;
    sourceId: number;
    employeeId: string;
    amount: number;
    concept: string;
    frequency?: IncomeFrequency;
    type: IncomeType;
}
