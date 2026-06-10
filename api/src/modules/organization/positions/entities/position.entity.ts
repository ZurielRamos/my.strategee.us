import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { RiskLevel } from '../enums/risk-level.enum';

@Entity('positions')
export class Position {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: RiskLevel,
    })
    riskLevel: RiskLevel;
}
