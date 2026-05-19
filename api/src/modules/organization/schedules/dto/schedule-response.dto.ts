import { ApiProperty } from '@nestjs/swagger';
import { ScheduleDayDto } from './schedule-day.dto';
import { Expose } from 'class-transformer';

export class ScheduleResponseDto {
    @ApiProperty({ description: 'ID del horario', example: 'uuid-v4' })
    @Expose()
    id: string;

    @ApiProperty({ description: 'Nombre del horario', example: 'Horario Oficina' })
    @Expose()
    name: string;

    @ApiProperty({ description: 'Descripción del horario', nullable: true, example: 'Lunes a Viernes 8am - 5pm' })
    @Expose()
    description: string;

    @ApiProperty({ type: [ScheduleDayDto], description: 'Configuración diaria del horario' })
    @Expose()
    dailySchedules: ScheduleDayDto[];

    @ApiProperty({ description: 'Indica si el horario está activo', example: true })
    @Expose()
    isActive: boolean;

    @ApiProperty({ description: 'Fecha de creación' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Fecha de última actualización' })
    @Expose()
    updatedAt: Date;
}
