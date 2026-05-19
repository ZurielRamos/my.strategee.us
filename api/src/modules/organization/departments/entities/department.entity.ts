import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Position } from '../../positions/entities/position.entity';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    costCenterCode: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @ManyToOne(() => Company, (company) => company.departments, { onDelete: 'CASCADE' })
    company: Company;

    @Column()
    companyId: string;

    @OneToMany(() => Position, (position) => position.department)
    positions: Position[];
}
