import { Type } from 'class-transformer';
import {
    IsArray, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class MinuteCommitmentDto {
    @ApiProperty()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    user_id: number;

    @ApiProperty()
    @IsString()
    @MaxLength(5000)
    description: string;

    @ApiProperty({ example: '2026-12-01' })
    @IsString()
    @Matches(DATE)
    delivery_date: string;
}

/** Campos de un acta. Los que no se envían conservan su valor al actualizar. */
export class SaveMinuteDto {
    /** La app lo envía, pero la empresa la define recapmeeting (Application.team_id). */
    @ApiProperty({ required: false, description: 'Se ignora' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    team_id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    client_id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    project_id?: number;

    @ApiProperty({ required: false, description: 'HTML del acta' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false, example: '2026-11-25 08:00:00' })
    @IsOptional()
    @IsString()
    @Matches(DATETIME)
    start_date?: string;

    @ApiProperty({ required: false, example: '2026-11-25 09:00:00' })
    @IsOptional()
    @IsString()
    @Matches(DATETIME)
    end_date?: string;

    @ApiProperty({ required: false, type: [Number], description: 'Colaboradores' })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    funcionarios?: number[];

    @ApiProperty({ required: false, type: [Number], description: 'Asistentes externos del cliente' })
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    @IsInt({ each: true })
    externos?: number[];

    @ApiProperty({ required: false, description: 'Correos en copia, separados por coma' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    copies?: string;

    @ApiProperty({ required: false, type: [MinuteCommitmentDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MinuteCommitmentDto)
    commitments?: MinuteCommitmentDto[];

    @ApiProperty({ required: false, enum: [0, 1], description: '1 = borrador, 0 = publicar' })
    @IsOptional()
    @Type(() => Number)
    @IsIn([0, 1])
    state?: 0 | 1;
}
