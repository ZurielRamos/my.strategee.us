// requests/dto/details/benefit-details.dto.ts
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { BenefitType } from '@modules/core/benefits/enums/benefit-type.enum';

export class BenefitRequestDetailsDto {
    @IsEnum(BenefitType)
    @IsNotEmpty()
    benefitType: BenefitType;

    @IsDateString()
    @IsNotEmpty()
    date: string; // Fecha en la que tomará el beneficio

    @IsNumber()
    @Min(0.5) // Mínimo medio día según tu requerimiento
    amount: number; // 0.5, 1, 2, 3...
}