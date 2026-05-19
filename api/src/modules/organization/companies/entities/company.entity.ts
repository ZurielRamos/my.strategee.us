import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Attachment } from '../../../infrastructure/attachments/entities/attachment.entity';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    legalName: string;

    @Column({ unique: true })
    nit: string;

    @Column()
    address: string;

    @Column({ nullable: true, name: 'logo_id' })
    logoId: string;

    @ManyToOne(() => Attachment, { nullable: true })
    @JoinColumn({ name: 'logo_id' })
    logo: Attachment;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Department, (department) => department.company)
    departments: Department[];
}
