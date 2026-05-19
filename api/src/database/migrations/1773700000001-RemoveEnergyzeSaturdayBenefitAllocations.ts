import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEnergyzeSaturdayBenefitAllocations1773700000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Eliminar todas las asignaciones de beneficio "SABADO ENERGYZE"
        await queryRunner.query(`
            DELETE FROM benefit_allocations 
            WHERE benefit_type = 'SABADO ENERGYZE'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hay rollback - las asignaciones eliminadas no se pueden recuperar automáticamente
        console.log('No se puede revertir la eliminación de asignaciones de SABADO ENERGYZE');
    }
}
