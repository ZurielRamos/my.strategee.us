import { Employee } from '@modules/core/employees/entities/employee.entity';
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('employee_parafiscales')
export class EmployeeParafiscales {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'employee_id', unique: true })
    employeeId: string;

    @OneToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    /** EPS (Entidad Promotora de Salud) */
    @Column({ type: 'varchar', length: 150, nullable: true })
    eps: string | null;

    /** ARL (Administradora de Riesgos Laborales) */
    @Column({ type: 'varchar', length: 150, nullable: true })
    arl: string | null;

    /** Fondo de Pensión */
    @Column({ type: 'varchar', length: 150, nullable: true })
    fondoPension: string | null;

    /** Caja de Compensación Familiar */
    @Column({ type: 'varchar', length: 150, nullable: true })
    cajaCompensacion: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
