export enum DayOfWeek {
    MONDAY = 'Lunes',
    TUESDAY = 'Martes',
    WEDNESDAY = 'Miercoles',
    THURSDAY = 'Jueves',
    FRIDAY = 'Viernes',
    SATURDAY = 'Sabado',
    SUNDAY = 'Domingo'
}

export interface ScheduleDay {
    day: DayOfWeek;
    isWorkDay: boolean;
    entryTime?: string;
    exitTime?: string;
    morningBreakStart?: string;
    morningBreakEnd?: string;
    lunchStart?: string;
    lunchEnd?: string;
    afternoonBreakStart?: string;
    afternoonBreakEnd?: string;
}

export interface Schedule {
    id: string;
    name: string;
    description?: string;
    dailySchedules: ScheduleDay[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateScheduleDto {
    name: string;
    description?: string;
    dailySchedules: ScheduleDay[];
}

export interface UpdateScheduleDto {
    name?: string;
    description?: string;
    dailySchedules?: ScheduleDay[];
}
