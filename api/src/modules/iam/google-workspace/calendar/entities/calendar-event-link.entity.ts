import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '@modules/iam/users/entities/user.entity';

/** Vínculo entre un evento de Google Calendar del usuario y un acta. */
@Entity('calendar_event_links')
@Unique('UQ_calendar_event_links_user_event', ['userId', 'googleEventId'])
export class CalendarEventLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 255 })
    googleEventId: string;

    @Column({ type: 'varchar', length: 64 })
    minuteId: string;

    @CreateDateColumn()
    createdAt: Date;
}
