import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, IsString } from 'class-validator';
import { BenefitType } from '../enums/benefit-type.enum';

export class SetAllocationDto {
    @ApiProperty({ example: 1 })
    @IsString()
    employeeId: string;

    @ApiProperty({ enum: BenefitType })
    @IsEnum(BenefitType)
    benefitType: BenefitType;

    @ApiProperty({ example: 2, description: 'Días disponibles por mes' })
    @IsNumber()
    @Min(0)
    amount: number;
}