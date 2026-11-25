import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListCalendarEventsDto {
    @ApiProperty({ required: false, description: 'Inicio del rango (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    timeMin?: string;

    @ApiProperty({ required: false, description: 'Fin del rango (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    timeMax?: string;

    @ApiProperty({ required: false, default: 100, maximum: 250 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(250)
    maxResults?: number;
}

export class CreateCalendarEventLinkDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    googleEventId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(64)
    minuteId: string;
}
