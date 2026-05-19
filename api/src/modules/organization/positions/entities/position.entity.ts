import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { RiskLevel } from '../enums/risk-level.enum';

@Entity('positions')
export class Position {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: RiskLevel,
    })
    riskLevel: RiskLevel;

    @ManyToOne(() => Department, (department) => department.positions, { onDelete: 'CASCADE' })
    department: Department;

    @Column()
    departmentId: string;
}
