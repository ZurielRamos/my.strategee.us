import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddConditionToCompensations1773362833000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna condition
        await queryRunner.addColumn(
            'compensations',
            new TableColumn({
                name: 'condition',
                type: 'enum',
                enum: ['NONE', 'IDO_PERCENTAGE', 'IDO_LIMIT'],
                default: "'NONE'",
            }),
        );

        // Migrar datos existentes: si vinculateIdo es true, establecer condition como IDO_LIMIT
        await queryRunner.query(`
            UPDATE compensations 
            SET condition = 'IDO_LIMIT' 
            WHERE "vinculateIdo" = true
        `);

        // Eliminar columna vinculateIdo
        await queryRunner.dropColumn('compensations', 'vinculateIdo');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Agregar de vuelta vinculateIdo
        await queryRunner.addColumn(
            'compensations',
            new TableColumn({
                name: 'vinculateIdo',
                type: 'boolean',
                default: false,
            }),
        );

        // Migrar datos de vuelta: si condition es IDO_LIMIT o IDO_PERCENTAGE, establecer vinculateIdo como true
        await queryRunner.query(`
            UPDATE compensations 
            SET "vinculateIdo" = true 
            WHERE condition IN ('IDO_LIMIT', 'IDO_PERCENTAGE')
        `);

        // Eliminar columna condition
        await queryRunner.dropColumn('compensations', 'condition');
    }
}
