import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('bahamas_config')
export class BahamasConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true, comment: 'ID del dispositivo WhatsApp para notificaciones' })
    whatsappDeviceId: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora inicio jornada mañana (HH:mm)' })
    morningStart: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora fin jornada mañana (HH:mm)' })
    morningEnd: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora entrega jornada mañana (HH:mm)' })
    morningDelivery: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora inicio jornada tarde (HH:mm)' })
    afternoonStart: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora fin jornada tarde (HH:mm)' })
    afternoonEnd: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora entrega jornada tarde (HH:mm)' })
    afternoonDelivery: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora inicio jornada sábado (HH:mm)' })
    saturdayStart: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora fin jornada sábado (HH:mm)' })
    saturdayEnd: string;

    @Column({ type: 'time', nullable: true, comment: 'Hora entrega jornada sábado (HH:mm)' })
    saturdayDelivery: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
