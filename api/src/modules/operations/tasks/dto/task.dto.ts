import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, Min, ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ListTasksDto {
    @ApiProperty()
    @IsUUID()
    boardId: string;
}

export class CreateTaskDto {
    @ApiProperty()
    @IsUUID()
    boardId: string;

    @ApiProperty({ required: false, description: 'Por defecto, la primera lista de pendientes' })
    @IsOptional()
    @IsUUID()
    listId?: string;

    @ApiProperty({ required: false, description: 'Responsable; por defecto, quien la crea' })
    @IsOptional()
    @IsUUID()
    assigneeUserId?: string;

    @ApiProperty({ maxLength: 500 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    title: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(10000)
    description?: string | null;

    @ApiProperty({ required: false, nullable: true, example: '2026-12-01' })
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Matches(DATE)
    dueDate?: string | null;
}

/** Las tareas que vienen de un acta solo aceptan listId y position. */
export class UpdateTaskDto {
    @ApiProperty({ required: false, maxLength: 500 })
    @IsOptional()
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    title?: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Transform(trim)
    @IsString()
    @MaxLength(10000)
    description?: string | null;

    @ApiProperty({ required: false, nullable: true, example: '2026-12-01' })
    @IsOptional()
    @ValidateIf((_, value) => value !== null)
    @Matches(DATE)
    dueDate?: string | null;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsUUID()
    assigneeUserId?: string;

    @ApiProperty({ required: false, description: 'Lista destino (del mismo tablero)' })
    @IsOptional()
    @IsUUID()
    listId?: string;

    @ApiProperty({ required: false, description: 'Posición dentro de la lista (0 = arriba)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    position?: number;
}

// --- Tableros y listas ---

export class BoardNameDto {
    @ApiProperty({ maxLength: 120 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name: string;
}

export class ShareBoardDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayMaxSize(500)
    @IsUUID('all', { each: true })
    userIds: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayMaxSize(200)
    @IsUUID('all', { each: true })
    departmentIds: string[];
}

export class CreateListDto {
    @ApiProperty({ maxLength: 80 })
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    name: string;

    @ApiProperty({ required: false, default: false, description: 'Las tareas en esta lista cuentan como hechas' })
    @IsOptional()
    @IsBoolean()
    isDone?: boolean;
}

export class UpdateListDto {
    @ApiProperty({ required: false, maxLength: 80 })
    @IsOptional()
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isDone?: boolean;

    @ApiProperty({ required: false, description: 'Nueva posición de la lista en el tablero (0 = primera)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    position?: number;
}

export class DeleteListDto {
    @ApiProperty({ required: false, description: 'Lista a la que se mueven sus tareas' })
    @IsOptional()
    @IsUUID()
    moveToListId?: string;
}
