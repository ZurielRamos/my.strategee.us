import { IsNotEmpty, IsEnum, IsUUID, IsDateString, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '../enums/contract-status.enum';
import { ContractType } from '../enums/contract-type.enum';
import { PayrollGroup } from '../enums/payroll-group.enum';
import { CreateMemorandumDto } from './create-memorandum.dto';

export class CreateContractDto {
    @ApiProperty({ description: 'ID del empleado', example: 'uuid-employee-id' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: 'ID de la empresa', example: 'uuid-company-id' })
    @IsUUID()
    @IsNotEmpty()
    companyId: string;

    @ApiProperty({ description: 'Número de contrato', example: 'CT-2024-001' })
    @IsString()
    @IsOptional()
    contractNumber?: string;

    @ApiProperty({ description: 'Fecha de inicio del contrato (YYYY-MM-DD)', example: '2024-02-01' })
    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @ApiPropertyOptional({ description: 'Fecha de fin del contrato (YYYY-MM-DD)', example: '2025-02-01' })
    @IsDateString()
    @IsOptional()
    endDate?: string;



    @ApiProperty({ description: 'Estado del contrato', enum: ContractStatus, default: ContractStatus.ACTIVE })
    @IsEnum(ContractStatus)
    @IsOptional()
    status?: ContractStatus;

    @ApiProperty({ description: 'Tipo de contrato', enum: ContractType })
    @IsEnum(ContractType)
    @IsNotEmpty()
    type: ContractType;

    @ApiProperty({ description: 'Grupo de nómina', enum: PayrollGroup })
    @IsEnum(PayrollGroup)
    @IsNotEmpty()
    payrollGroup: PayrollGroup;

    @ApiProperty({ description: 'Detalles del cargo y salario inicial' })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateMemorandumDto)
    initialMemorandum: CreateMemorandumDto;
}
