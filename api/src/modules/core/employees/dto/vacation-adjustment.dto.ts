import { IsEnum, IsNumber, IsString, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VacationAdjustmentType {
    ADD = 'ADD',
    SUBTRACT = 'SUBTRACT'
}

export class VacationAdjustmentDto {
    @ApiProperty({
        description: 'Tipo de ajuste',
        enum: VacationAdjustmentType,
        example: VacationAdjustmentType.ADD
    })
    @IsEnum(VacationAdjustmentType)
    type: VacationAdjustmentType;

    @ApiProperty({
        description: 'Cantidad de días a ajustar',
        example: 5,
        minimum: 0.5,
        maximum: 365
    })
    @IsNumber()
    @Min(0.5)
    @Max(365)
    days: number;

    @ApiProperty({
        description: 'Motivo del ajuste',
        example: 'Ajuste por error en cálculo de vacaciones',
        maxLength: 500
    })
    @IsString()
    @MaxLength(500)
    reason: string;
}
