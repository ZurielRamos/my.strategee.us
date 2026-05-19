import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettings {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Request Settings
    @Column('int', { default: 15, comment: 'Días de vacaciones para contrato laboral' })
    vacationDaysLaborContract: number;

    @Column('int', { default: 15, comment: 'Días de vacaciones para contrato de prestación de servicios' })
    vacationDaysServiceContract: number;

    @Column('decimal', { precision: 4, scale: 2, default: 8, comment: 'Horas en un día laboral' })
    hoursPerWorkday: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
