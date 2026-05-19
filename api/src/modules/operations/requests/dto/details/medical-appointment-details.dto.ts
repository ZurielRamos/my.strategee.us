import { IsDateString, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class MedicalAppointmentDetailsDto {
    @IsDateString()
    @IsNotEmpty()
    exitDateTime: string; // ISO 8601

    @IsDateString()
    @IsNotEmpty()
    returnDateTime: string; // ISO 8601

    @IsOptional()
    @IsString()
    @IsUrl() // Valida que sea una URL válida si se envía
    attachmentUrl?: string; // Opcional al crear, obligatorio para cerrar el caso (regla futura)
}