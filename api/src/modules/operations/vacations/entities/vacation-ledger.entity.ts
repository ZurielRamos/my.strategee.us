import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';

export enum VacationTransactionType {
    USAGE = 'DISFRUTE',          // Resta días (Aprobación de vacaciones)
    MONEY_PAYMENT = 'PAGO_DINERO', // Resta días (Compensación)
    ADJUSTMENT = 'AJUSTE',       // Manual (+ o -)
    SETTLEMENT = 'LIQUIDACION'   // Cierre de contrato
}

@Entity('vacation_ledger')
@Index(['employeeId'])
export class VacationLedger {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    employeeId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'enum', enum: VacationTransactionType })
    type: VacationTransactionType;

    // Cantidad de días. Si es USAGE, se guardará como negativo en la lógica o positivo y se resta.
    // Para consistencia contable: Guardaremos USAGE como negativo en la DB.
    @Column({ type: 'decimal', precision: 10, scale: 4 })
    days: number;

    @Column({ type: 'int', nullable: true })
    requestId: number | null; // Link a la solicitud original

    @Column({ type: 'text', nullable: true })
    note: string;

    @CreateDateColumn()
    createdAt: Date;
}