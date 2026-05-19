import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, Min, Max, IsDateString } from 'class-validator';
import { AccumulationReason } from '@modules/operations/compensated-time/constants/compensated-time-settings';

export class CompensatedTimeAccumulationDetailsDto {
    @ApiProperty({ 
        description: 'Fecha del evento (trabajo extra o votación)',
        example: '2024-03-15T00:00:00.000Z'
    })
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({ 
        description: 'Cantidad de días a acumular', 
        example: 1,
        enum: [0.5, 1, 2, 3]
    })
    @IsNumber()
    @IsNotEmpty()
    @Min(0.5)
    @Max(3)
    days: number;

    @ApiProperty({ 
        description: 'Motivo de la acumulación',
        enum: AccumulationReason,
        example: AccumulationReason.SATURDAY_WORK
    })
    @IsEnum(AccumulationReason)
    @IsNotEmpty()
    reason: AccumulationReason;

    @ApiProperty({ 
        description: 'URL del comprobante (imagen o PDF)',
        example: 'https://storage.example.com/proof.pdf'
    })
    @IsString()
    @IsNotEmpty()
    proofUrl: string;

    @ApiProperty({ 
        description: 'Comentarios u observaciones adicionales',
        example: 'Trabajé el sábado 15 de marzo en el proyecto X',
        required: false
    })
    @IsString()
    @IsOptional()
    comments?: string;

    @ApiProperty({ 
        description: 'Horas calculadas (días * hoursPerWorkday configurado)',
        example: 8.5,
        required: false
    })
    @IsNumber()
    @IsOptional()
    calculatedHours?: number;
}
