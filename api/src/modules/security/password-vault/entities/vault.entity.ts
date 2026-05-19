import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Credential } from './credential.entity';

@Entity('vaults')
export class Vault {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'owner_id' })
    owner: Employee;

    @Column({ type: 'uuid' })
    ownerId: string;

    @OneToMany(() => Credential, (credential) => credential.vault)
    credentials: Credential[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
