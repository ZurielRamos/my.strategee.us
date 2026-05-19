import { BenefitType } from '../../../admin/employees/models/benefit-allocation.model';

export enum RequestType {
    VACATION = 'VACATION',
    DOCUMENT = 'DOCUMENT',
    MEETING = 'MEETING',
    BENEFIT = 'BENEFIT',
    BIRTHDAY = 'BIRTHDAY',
    ORDINARY_PERMISSION = 'ORDINARY_PERMISSION',
    SICK_LEAVE = 'SICK_LEAVE',
    MEDICAL_APPOINTMENT = 'MEDICAL_APPOINTMENT',
    COMPENSATED_TIME_ACCUMULATION = 'COMPENSATED_TIME_ACCUMULATION',
    COMPENSATED_TIME_USAGE = 'COMPENSATED_TIME_USAGE',
    ENERGYZE_DAY_ACCUMULATION = 'ENERGYZE_DAY_ACCUMULATION',
    ENERGYZE_DAY_USAGE = 'ENERGYZE_DAY_USAGE',
    GIFTED_DAY_USAGE = 'GIFTED_DAY_USAGE',
}

export enum RequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export interface BenefitRequestDetails {
    benefitType: BenefitType;
    date: string;
    amount: number;
}

export interface CreateRequestDto {
    type: RequestType;
    details: BenefitRequestDetails | any;
}

export interface Request {
    id: number;
    type: RequestType;
    status: RequestStatus;
    details: any;
    reviewerComment?: string;
    employeeId: string;
    createdAt: string;
    updatedAt: string;
}
