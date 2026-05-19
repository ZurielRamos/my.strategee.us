// requests/dto/details/sick-leave-details.dto.ts
import { IsDateString, IsNotEmpty, IsOptional, IsUrl, IsString } from 'class-validator';

export class SickLeaveDetailsDto {
    @IsDateString()
    @IsNotEmpty()
    startDate: string; // YYYY-MM-DD

    @IsDateString()
    @IsNotEmpty()
    endDate: string;   // YYYY-MM-DD

    @IsOptional()
    @IsString()
    @IsUrl()
    attachmentUrl?: string; // Comprobante de la EPS/ARL
}