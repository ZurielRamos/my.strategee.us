import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsInt } from 'class-validator';
import { RequestType } from '../enums/request-type.enum';
import { RequestStatus } from '../enums/request-status.enum';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';


export class FilterRequestsDto extends PaginationQueryDto {
    @ApiProperty({ enum: RequestType, required: false, description: 'Filtrar por tipo de solicitud.' })
    @IsOptional()
    @IsEnum(RequestType)
    type?: RequestType;

    @ApiProperty({ enum: RequestStatus, required: false, description: 'Filtrar por estado.' })
    @IsOptional()
    @IsEnum(RequestStatus)
    status?: RequestStatus;

    @ApiProperty({ example: '2025-01-01', required: false, description: 'Fecha de creación desde (YYYY-MM-DD).' })
    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @ApiProperty({ example: '2025-12-31', required: false, description: 'Fecha de creación hasta (YYYY-MM-DD).' })
    @IsOptional()
    @IsDateString()
    dateTo?: string;

    @ApiProperty({ example: 1, required: false, description: 'Filtrar solicitudes de un empleado específico.' })
    @IsOptional()
    @IsInt()
    employeeId?: number;
}