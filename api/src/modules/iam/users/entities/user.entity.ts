import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../../authorization/enums/role.enum';
import { Employee } from '@modules/core/employees/entities/employee.entity';
import { Session } from '../../authentication/entities/session.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column({ type: 'json' })
    roles: Role[];

    @Column({ default: true })
    isActive: boolean;

    @Column({ type: 'uuid', nullable: true })
    employeeId: string | null;

    @OneToOne(() => Employee, (employee) => employee.user, { nullable: true })
    employee: Employee | null;

    @OneToMany(() => Session, (session) => session.user, { cascade: true })
    sessions: Session[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
