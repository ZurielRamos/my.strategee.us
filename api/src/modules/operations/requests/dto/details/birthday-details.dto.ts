import { IsDateString, IsNotEmpty, IsEnum, IsNumber, Equals } from 'class-validator';

export enum DayShift {
    MORNING = 'MANANA',
    AFTERNOON = 'TARDE'
}

export class BirthdayRequestDetailsDto {
    @IsDateString()
    @IsNotEmpty()
    date: string; // Fecha en la que tomará el beneficio

    @IsEnum(DayShift)
    @IsNotEmpty()
    shift: DayShift;

    // Forzamos a que siempre sea 0.5 mediante validación
    @IsNumber()
    @Equals(0.5)
    amount: number;
}