import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class CreateTrainingMaterialProgressTable1774400000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'training_material_progress',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                        default: 'UUID()',
                    },
                    {
                        name: 'assignment_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'material_id',
                        type: 'varchar',
                        length: '36',
                        isNullable: false,
                    },
                    {
                        name: 'is_completed',
                        type: 'tinyint',
                        width: 1,
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'quiz_score',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'quiz_passed',
                        type: 'tinyint',
                        width: 1,
                        isNullable: true,
                    },
                    {
                        name: 'attempts',
                        type: 'int',
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'completed_at',
                        type: 'datetime',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createUniqueConstraint(
            'training_material_progress',
            new TableUnique({
                name: 'UQ_training_material_progress_assignment_material',
                columnNames: ['assignment_id', 'material_id'],
            }),
        );

        await queryRunner.createForeignKey(
            'training_material_progress',
            new TableForeignKey({
                columnNames: ['assignment_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'training_assignments',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'training_material_progress',
            new TableForeignKey({
                columnNames: ['material_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'training_materials',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('training_material_progress');
        if (table) {
            for (const fk of table.foreignKeys) {
                await queryRunner.dropForeignKey('training_material_progress', fk);
            }
        }
        await queryRunner.dropUniqueConstraint(
            'training_material_progress',
            'UQ_training_material_progress_assignment_material',
        );
        await queryRunner.dropTable('training_material_progress');
    }
}
