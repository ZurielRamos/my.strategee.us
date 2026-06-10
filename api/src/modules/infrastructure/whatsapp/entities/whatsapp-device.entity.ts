import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('whatsapp_devices')
export class WhatsappDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: 'Nombre del dispositivo/instancia' })
  name: string;

  @Column({ comment: 'Nombre de la instancia en Evolution API' })
  instanceName: string;

  @Column({
    default: 'disconnected',
    comment: 'Estado de conexión: connected, disconnected, connecting',
  })
  status: string;

  @Column({ nullable: true, comment: 'Número de teléfono conectado' })
  phoneNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
