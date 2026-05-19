import { IsDateString, IsNotEmpty, IsString, IsBoolean, MaxLength } from 'class-validator';

export class OrdinaryPermissionDetailsDto {
    // 1. Confirmación de compromisos (Ahora permite false)
    @IsBoolean()
    isUpToDate: boolean;

    // ... (fechas y motivo se mantienen igual)
    @IsDateString()
    @IsNotEmpty()
    exitDateTime: string;

    @IsDateString()
    @IsNotEmpty()
    returnDateTime: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    makeupProposal: string;
}