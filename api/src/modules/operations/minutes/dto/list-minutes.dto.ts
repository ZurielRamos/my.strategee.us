import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientFilterDto {
    @ApiProperty({ required: false, description: 'Cliente de recapmeeting' })
    @IsOptional()
    @IsString()
    @Matches(/^\d+$/)
    client_id?: string;
}

export class ListMinutesDto extends ClientFilterDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiProperty({ required: false, description: 'Proyecto de recapmeeting' })
    @IsOptional()
    @IsString()
    @Matches(/^\d+$/)
    project_id?: string;
}
