import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { BenefitType } from '../enums/benefit-type.enum';

@Entity('benefit_allocations')
@Unique(['employeeId', 'benefitType']) // Un empleado solo puede tener una configuración por tipo
export class BenefitAllocation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'employee_id' })
    @Index() // 👈 Agregamos índice explícito para evitar que TypeORM intente borrar el índice de la FK
    employeeId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({ type: 'varchar', length: 60 })
    benefitType: BenefitType;

    // Cuántos días tiene disponibles al mes (Ej: 2, 4, 0.5)
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    monthlyQuota: number;
}