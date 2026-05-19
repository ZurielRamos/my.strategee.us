import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

export enum EnergyzeDaysTransactionType {
    ACCUMULATION = 'ACUMULACION',  // Suma días (Aprobación de acumulación)
    USAGE = 'DISFRUTE',            // Resta días (Aprobación de disfrute)
    ADJUSTMENT = 'AJUSTE',         // Manual (+ o -)
    EXPIRATION = 'VENCIMIENTO'     // Vencimiento de días acumulados
}

@Entity('energyze_days_ledger')
@Index(['employeeId'])
export class EnergyzeDaysLedger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    employeeId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'enum', enum: EnergyzeDaysTransactionType })
    type: EnergyzeDaysTransactionType;

    // Cantidad de días. Positivo para acumulación, negativo para uso
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    days: number;

    @Column({ type: 'int', nullable: true })
    requestId: number | null; // Link a la solicitud original

    @Column({ type: 'text', nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;
}
