import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GiftedDayUsageDetailsDto {
    @ApiProperty({ description: 'Fecha de inicio del disfrute (YYYY-MM-DD)' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ description: 'Fecha de fin del disfrute (YYYY-MM-DD)' })
    @IsDateString()
    endDate: string;

    @ApiProperty({ description: 'Cantidad de días a disfrutar', example: 1 })
    @IsNumber()
    @Min(1)
    days: number;

    @ApiProperty({ description: 'Razón del disfrute', example: 'Descanso personal' })
    @IsString()
    reason: string;

    @ApiProperty({ description: 'Balance después de la solicitud', required: false })
    @IsOptional()
    @IsNumber()
    balanceAfter?: number;
}
