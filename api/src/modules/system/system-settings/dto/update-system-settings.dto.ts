import { IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemSettingsDto {
    @ApiPropertyOptional({ description: 'Días de vacaciones para contrato laboral', example: 15 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(365)
    vacationDaysLaborContract?: number;

    @ApiPropertyOptional({ description: 'Días de vacaciones para contrato de prestación de servicios', example: 15 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(365)
    vacationDaysServiceContract?: number;

    @ApiPropertyOptional({ description: 'Horas en un día laboral', example: 8 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(24)
    hoursPerWorkday?: number;
}
