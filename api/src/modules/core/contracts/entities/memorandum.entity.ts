import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { Position } from '../../../organization/positions/entities/position.entity';
import { Schedule } from '../../../organization/schedules/entities/schedule.entity';
import { Location } from '../../../organization/locations/entities/location.entity';
import { Department } from '../../../organization/departments/entities/department.entity';
import { SalaryType } from '../enums/salary-type.enum';


@Entity('memorandums')
export class Memorandum {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Contract, (contract) => contract.memorandums, { onDelete: 'CASCADE' })
    contract: Contract;

    @Column()
    contractId: string;

    @ManyToOne(() => Position)
    position: Position;

    @Column()
    positionId: string;

    @ManyToOne(() => Schedule, { createForeignKeyConstraints: false })
    schedule: Schedule;

    @Column({ nullable: true })
    scheduleId: string;

    @ManyToOne(() => Location, { createForeignKeyConstraints: false })
    location: Location;

    @Column({ nullable: true })
    locationId: string;

    @ManyToOne(() => Department, { createForeignKeyConstraints: false })
    department: Department;

    @Column({ nullable: true })
    departmentId: string;

    @Column({
        type: 'varchar',
    })
    salaryType: SalaryType;

    @Column({ nullable: true })
    parameterKey: string;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    salaryAmount: number;

    @Column('date')
    startDate: Date;

    @Column('date', { nullable: true })
    endDate: Date;

    @Column('text')
    reason: string;

    @CreateDateColumn()
    createdAt: Date;

    // Campo calculado para determinar si el memorando está activo
    isActive(): boolean {
        const now = new Date();
        const start = new Date(this.startDate);
        const end = this.endDate ? new Date(this.endDate) : null;
        
        return start <= now && (!end || end >= now);
    }

    // Campo calculado para determinar el estado
    getStatus(): 'ACTIVE' | 'PENDING' | 'EXPIRED' {
        const now = new Date();
        const start = new Date(this.startDate);
        const end = this.endDate ? new Date(this.endDate) : null;
        
        if (start > now) {
            return 'PENDING';
        }
        if (end && end < now) {
            return 'EXPIRED';
        }
        return 'ACTIVE';
    }
}
