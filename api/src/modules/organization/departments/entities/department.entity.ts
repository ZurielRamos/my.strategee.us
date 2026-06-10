import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
}
