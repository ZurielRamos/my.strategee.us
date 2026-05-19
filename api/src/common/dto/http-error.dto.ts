import { ApiProperty } from "@nestjs/swagger";

export class HttpErrorDto {
    @ApiProperty({ example: 400 })
    statusCode: number;

    @ApiProperty({ example: 'Ya existe otra ubicación con este nombre' })
    message: string | string[];

    @ApiProperty({ example: 'Conflict', required: false })
    error?: string;
}