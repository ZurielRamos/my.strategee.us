import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RequestType } from '../enums/request-type.enum';
import { RequestStatus } from '../enums/request-status.enum';
import { Employee } from '@modules/core/employees/entities/employee.entity';

@Entity('requests')
@Index(['employeeId', 'status']) // Índice para filtrar bandeja de entrada rápidamente
export class Request {
    @PrimaryGeneratedColumn()
    @ApiProperty()
    id: number;

    @Column({ type: 'enum', enum: RequestType })
    @ApiProperty({ enum: RequestType, description: 'Tipo de solicitud (discriminador)' })
    type: RequestType;

    @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
    @ApiProperty({ enum: RequestStatus })
    status: RequestStatus;

    // 🌟 LA MAGIA: Almacena datos específicos según el tipo
    @Column({ type: 'json' }) // En Postgres usa 'jsonb' para mejor rendimiento
    @ApiProperty({ description: 'Objeto JSON con los detalles específicos del tipo de solicitud' })
    details: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    @ApiProperty({ description: 'Comentarios del aprobador/rechazo', required: false })
    reviewerComment: string;

    // --- Relaciones ---

    @Column({ name: 'employee_id' })
    employeeId: string;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}