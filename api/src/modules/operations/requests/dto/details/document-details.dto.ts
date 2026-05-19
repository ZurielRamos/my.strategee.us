import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum DocumentType {
    LABOR_CERTIFICATE = 'CERTIFICADO_LABORAL',
    PAYROLL_PROOF = 'COMPROBANTE_NOMINA'
}

export class DocumentDetailsDto {
    @IsEnum(DocumentType)
    @IsNotEmpty()
    documentType: DocumentType;

    @IsString()
    @IsOptional()
    addressedTo?: string; // Opcional, por defecto "A quien pueda interesar"

    @IsString()
    @IsOptional()
    notes?: string; // Notas u observaciones adicionales

    @IsString()
    @IsOptional()
    documentUrl?: string; // URL del documento generado (se usará más adelante)
}