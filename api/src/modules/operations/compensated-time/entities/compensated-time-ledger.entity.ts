import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

export enum CompensatedTimeTransactionType {
    ACCUMULATION = 'ACUMULACION',  // Suma horas (Aprobación de acumulación)
    USAGE = 'DISFRUTE',            // Resta horas (Aprobación de disfrute)
    ADJUSTMENT = 'AJUSTE',         // Manual (+ o -)
    EXPIRATION = 'VENCIMIENTO'     // Vencimiento de horas acumuladas
}

@Entity('compensated_time_ledger')
@Index(['employeeId'])
export class CompensatedTimeLedger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    employeeId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'enum', enum: CompensatedTimeTransactionType })
    type: CompensatedTimeTransactionType;

    // Cantidad de horas. Positivo para acumulación, negativo para uso
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    hours: number;

    @Column({ type: 'int', nullable: true })
    requestId: number | null; // Link a la solicitud original

    @Column({ type: 'text', nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;
}
